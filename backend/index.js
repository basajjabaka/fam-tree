const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const moment = require("moment");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(express.static(path.join(__dirname, "../dist")));

// Ensure the uploads directory exists in the parent directory
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const uri = process.env.MONGO_URI;

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

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
    const image = req.file ? `/uploads/${req.file.filename}` : "";
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
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;
    const parsedDob = moment(dob, "DD/MM/YYYY").toDate();
    if (!parsedDob || isNaN(parsedDob)) {
      throw new Error("Invalid date format");
    }

    // Find the existing member to get the old image path
    const existingMember = await FamilyMember.findById(req.params.id);
    if (!existingMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Delete the old image file if a new image is uploaded
    if (req.file && existingMember.image) {
      const oldImagePath = path.join(__dirname, "..", existingMember.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
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

    if (deletedMember.image) {
      const imagePath = path.join(__dirname, "..", deletedMember.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

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
