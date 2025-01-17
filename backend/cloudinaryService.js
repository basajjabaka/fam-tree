const cloudinary = require("cloudinary").v2;
require("dotenv").config();

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
};

const uploadImage = (imageBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOpts,
      (error, result) => {
        if (result && result.public_id) {
          console.log(result.public_id);
          return resolve(result.public_id);
        }
        if (error) {
          console.log(error.message);
          return reject({ message: error.message });
        } else {
          return reject({ message: "Unknown error occurred during upload" });
        }
      }
    );

    // Pipe the image buffer to the upload stream
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
