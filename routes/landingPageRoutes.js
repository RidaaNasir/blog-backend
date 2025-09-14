const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const upload = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary'); // your cloudinary config file
const streamifier = require('streamifier'); // to upload buffers via stream

const {
  getLandingPage,
  updateLandingPage,
  uploadHeroMedia,
  addReel,
  deleteReel,
  updateReelsSection
} = require('../controllers/landingPageController');

const uploadToCloudinary = (buffer, folder, resource_type = "auto") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const uploadMedia = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadedFiles = [];
    for (const file of req.files) {
      const isVideoFile = file.mimetype.startsWith("video/");
      const folder = "landing-page"; // Cloudinary folder name
      const resource_type = isVideoFile ? "video" : "image";

      const url = await uploadToCloudinary(file.buffer, folder, resource_type);
      uploadedFiles.push(url);
    }

    res.json({ files: uploadedFiles });
  } catch (error) {
    console.error("Error uploading media:", error);
    res.status(500).json({ message: error.message });
  }
};


// Public routes
router.get("/", getLandingPage);

// Admin routes
router.put("/", protect, admin, updateLandingPage);
router.post("/hero/upload", protect, admin, upload.array("media", 5), uploadHeroMedia);
router.post("/upload", protect, admin, upload.array("media", 5), uploadMedia); // Add general upload route

// Reels routes
router.post("/reels", protect, admin, upload.array("media", 2), addReel); // Upload video and optional thumbnail
router.delete("/reels/:reelId", protect, admin, deleteReel);
router.put("/reels", protect, admin, updateReelsSection);

module.exports = router; 