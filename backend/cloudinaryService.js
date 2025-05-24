const cloudinary = require("cloudinary").v2;
require("dotenv").config({ path: "../.env" });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOpts = {
  overwrite: true,
  invalidate: true,
  resource_type: "auto",
  upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
  use_filename: true,
  unique_filename: true,
};

const uploadImage = (imageBuffer, originalFilename) => {
  if (!originalFilename) {
    return Promise.reject({ message: "Filename is required" });
  }

  // Clean the filename - remove special characters and spaces
  const cleanFilename = originalFilename
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "_");

  // Get filename without extension
  const filename = cleanFilename.split(".")[0];

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        ...uploadOpts,
        public_id: filename,
      },
      (error, result) => {
        if (result && result.public_id) {
          console.log(`Uploaded/Updated as: ${result.public_id}`);
          return resolve(result.public_id);
        }
        if (error) {
          console.log(`Upload error: ${error.message}`);
          return reject({ message: error.message });
        } else {
          return reject({ message: "Unknown error occurred during upload" });
        }
      }
    );

    uploadStream.end(imageBuffer);
  });
};

const deleteImage = (fileName) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(fileName, (error, result) => {
      if (result && result.result === "ok") {
        console.log(`Deleted image: ${fileName}`);
        return resolve(result);
      }
      if (error) {
        console.log(error.message);
        return reject({ message: error.message });
      } else {
        return reject({ message: "Unknown error occurred during delete" });
      }
    });
  });
};

const constructImageUrl = (fileName) => {
  return cloudinary.url(fileName);
};

module.exports = {
  uploadImage,
  deleteImage,
  constructImageUrl,
};
