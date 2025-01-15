const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../dist")));

const uri = process.env.MONGO_URI;
const netlifyBlobUrl = process.env.NETLIFY_BLOB_URL;
const netlifyAccessToken = process.env.NETLIFY_ACCESS_TOKEN;

async function connectDB() {
  try {
    await mongoose.connect(uri, {
      dbName: "ancheryfamily",
    });
    console.log("Connected to DB");
  } catch (err) {
    console.error(err);
  }
}

connectDB();

const storage = multer.memoryStorage();
const upload = multer({ storage });

const FamilyMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  phone: { type: String, required: false },
  image: { type: String, required: false },
  occupation: { type: String, required: false },
  address: { type: String, required: false },
  spouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FamilyMember",
    default: null,
  },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: "FamilyMember" }],
});

const FamilyMember = mongoose.model("FamilyMember", FamilyMemberSchema);

app.get("/api/members", async (req, res) => {
  try {
    const members = await FamilyMember.find().populate("spouse children");
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/members/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    const member = await FamilyMember.findById(id).populate("spouse children");
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    if (!member.spouse) {
      const parent = await FamilyMember.findOne({ children: id }).populate(
        "spouse children"
      );
      return res.json(parent);
    }
    res.json(member);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/members", upload.single("image"), async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { name, dob, phone, occupation, address, spouse, parent, children } =
      req.body;
    let image = "";
    if (req.file) {
      const fetch = (await import("node-fetch")).default;
      const response = await fetch(
        `${netlifyBlobUrl}/.netlify/functions/blob`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${netlifyAccessToken}`,
          },
          body: JSON.stringify({
            operation: "create",
            path: req.file.originalname,
            contentType: req.file.mimetype,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create blob");
      }
      const { uploadUrl, blobUrl } = data;
      await axios.put(uploadUrl, req.file.buffer, {
        headers: {
          "Content-Type": req.file.mimetype,
        },
      });
      image = blobUrl;
    }
    const parsedDob = moment(dob, "DD/MM/YYYY").toDate();
    if (!parsedDob || isNaN(parsedDob)) {
      throw new Error("Invalid date format");
    }
    const newMember = new FamilyMember({
      name,
      dob: parsedDob,
      phone,
      image,
      occupation,
      address,
      spouse: spouse || null,
      children: children ? children.split(",") : [],
    });
    await newMember.save();

    // Update spouse's children list and spouse's spouse
    if (spouse) {
      await FamilyMember.findByIdAndUpdate(spouse, {
        $addToSet: { children: { $each: newMember.children } },
        spouse: newMember._id,
        image: image,
      });
    }

    if (parent) {
      await FamilyMember.findByIdAndUpdate(parent, {
        $addToSet: { children: newMember._id },
      });
    }

    res.status(201).json(newMember);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

app.put("/api/members/:id", upload.single("image"), async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { name, dob, phone, occupation, address, spouse, parent, children } =
      req.body;
    let image = req.body.image;
    if (req.file) {
      const fetch = (await import("node-fetch")).default;
      const response = await fetch(
        `${netlifyBlobUrl}/.netlify/functions/blob`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${netlifyAccessToken}`,
          },
          body: JSON.stringify({
            operation: "create",
            path: req.file.originalname,
            contentType: req.file.mimetype,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create blob");
      }
      const { uploadUrl, blobUrl } = data;
      await axios.put(uploadUrl, req.file.buffer, {
        headers: {
          "Content-Type": req.file.mimetype,
        },
      });
      image = blobUrl;
    }
    const parsedDob = moment(dob, "DD/MM/YYYY").toDate();
    if (!parsedDob || isNaN(parsedDob)) {
      throw new Error("Invalid date format");
    }

    const updatedMember = await FamilyMember.findByIdAndUpdate(
      req.params.id,
      {
        name,
        dob: parsedDob,
        phone,
        image: image ? image : null,
        occupation,
        address,
        spouse: spouse || null,
        children: children ? children.split(",") : [],
      },
      { new: true }
    );

    if (!updatedMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Update spouse's children list and spouse's spouse
    if (spouse) {
      await FamilyMember.findByIdAndUpdate(spouse, {
        $set: {
          children: updatedMember.children,
          spouse: updatedMember._id,
          image: image,
        },
      });
    }

    if (parent) {
      await FamilyMember.findByIdAndUpdate(parent, {
        $addToSet: { children: updatedMember._id },
      });
    }

    res.json(updatedMember);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

app.delete("/api/members/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    const deletedMember = await FamilyMember.findByIdAndDelete(id);
    if (!deletedMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Remove the member from the spouse's children list and clear spouse's spouse
    if (deletedMember.spouse) {
      await FamilyMember.findByIdAndUpdate(deletedMember.spouse, {
        $pull: { children: deletedMember._id },
        $unset: { spouse: "" },
      });
    }

    await FamilyMember.updateMany(
      { children: deletedMember._id },
      { $pull: { children: deletedMember._id } }
    );

    res.json(deletedMember);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search endpoint
app.get("/api/search", async (req, res) => {
  try {
    const { query } = req.query;
    const searchRegex = new RegExp(query, "i"); // Case-insensitive search
    const members = await FamilyMember.find({
      $or: [
        { name: searchRegex },
        { phone: searchRegex },
        { occupation: searchRegex },
        { address: searchRegex },
      ],
    }).populate("spouse children");
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
