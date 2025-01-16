const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const moment = require("moment");
const multer = require("multer");
const {
  uploadImage,
  deleteImage,
  constructImageUrl,
} = require("./cloudinaryService");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../dist")));

const uri = process.env.MONGO_URI;

async function connectDB() {
  try {
    await mongoose.connect(uri, { dbName: process.env.DB_NAME });
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
  phone: { type: String },
  image: { type: String }, // Store image file name from Cloudinary
  occupation: { type: String },
  address: { type: String },
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
    // Generate full URLs for images
    const membersWithUrls = members.map((member) => ({
      ...member.toObject(),
      image: member.image ? constructImageUrl(member.image) : null,
    }));
    res.json(membersWithUrls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/members/:id", async (req, res) => {
  try {
    let member = await FamilyMember.findById(req.params.id).populate(
      "spouse children"
    );
    if (!member) return res.status(404).json({ message: "Member not found" });
    if (!member.spouse) {
      const parent = await FamilyMember.findOne({
        children: req.params.id,
      }).populate("spouse children");
      member = parent;
    }

    // Generate full URL for image
    const memberWithUrl = {
      ...member.toObject(),
      image: member.image ? constructImageUrl(member.image) : null,
    };
    res.json(memberWithUrl);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/members", upload.single("image"), async (req, res) => {
  try {
    const { name, dob, phone, occupation, address, spouse, children } =
      req.body;
    const parsedDob = moment(dob, "DD/MM/YYYY").toDate();
    if (!parsedDob || isNaN(parsedDob)) throw new Error("Invalid date format");

    let imageFileName = "";
    if (req.file) {
      imageFileName = await uploadImage(req.file.buffer);
    }

    const newMember = new FamilyMember({
      name,
      dob: parsedDob,
      phone,
      image: imageFileName,
      occupation,
      address,
      spouse,
      children: children ? children.split(",") : [],
    });
    await newMember.save();

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
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

app.put("/api/members/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, dob, phone, occupation, address, spouse, children } =
      req.body;
    const parsedDob = moment(dob, "DD/MM/YYYY").toDate();
    if (!parsedDob || isNaN(parsedDob)) throw new Error("Invalid date format");

    let imageFileName = req.body.image;
    if (req.file) {
      imageFileName = await uploadImage(req.file.buffer);
    }

    const existingMember = await FamilyMember.findById(req.params.id);

    // Delete the old image file if a new image is uploaded
    if (req.file && existingMember.image) {
      await deleteImage(existingMember.image);
    }

    const updatedMember = await FamilyMember.findByIdAndUpdate(
      req.params.id,
      {
        name,
        dob: parsedDob,
        phone,
        image: imageFileName,
        occupation,
        address,
        spouse,
        children: children ? children.split(",") : [],
      },
      { new: true }
    );

    if (!updatedMember)
      return res.status(404).json({ message: "Member not found" });

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
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

app.delete("/api/members/:id", async (req, res) => {
  try {
    const deletedMember = await FamilyMember.findByIdAndDelete(req.params.id);
    if (!deletedMember)
      return res.status(404).json({ message: "Member not found" });

    if (deletedMember.spouse)
      await FamilyMember.findByIdAndUpdate(deletedMember.spouse, {
        $pull: { children: deletedMember._id },
        $unset: { spouse: "" },
      });
    await FamilyMember.updateMany(
      { children: deletedMember._id },
      { $pull: { children: deletedMember._id } }
    );

    // Delete image from Cloudinary if image file name exists
    if (deletedMember.image) {
      try {
        await deleteImage(deletedMember.image);
      } catch (cloudinaryErr) {
        console.error("Error deleting image from Cloudinary:", cloudinaryErr);
      }
    }

    res.json(deletedMember);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const { query } = req.query;
    const searchRegex = new RegExp(query, "i");
    const members = await FamilyMember.find({
      $or: [
        { name: searchRegex },
        { phone: searchRegex },
        { occupation: searchRegex },
        { address: searchRegex },
      ],
    }).populate("spouse children");
    // Generate full URLs for images
    const membersWithUrls = members.map((member) => ({
      ...member.toObject(),
      image: member.image ? constructImageUrl(member.image) : null,
    }));
    res.json(membersWithUrls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "../dist/index.html"))
);

app.listen(5000, () => console.log("Server is running on port 5000"));
