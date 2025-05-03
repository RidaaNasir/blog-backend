const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const upload = require('../middleware/uploadMiddleware');
const {
  getLandingPage,
  updateLandingPage,
  uploadHeroMedia,
  addReel,
  deleteReel,
  updateReelsSection
} = require('../controllers/landingPageController');

// Define the general media upload controller
const uploadMedia = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadedFiles = [];
    for (const file of req.files) {
      const { saveFile, saveImage, isVideo } = require('../utils/fileUpload');
      const isVideoFile = isVideo(file.originalname);
      const savedPath = isVideoFile 
        ? await saveFile(file, 'landing-page')
        : await saveImage(file, 'landing-page');
      
      uploadedFiles.push(savedPath);
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