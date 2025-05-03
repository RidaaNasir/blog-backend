const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const SiteSettings = require("../models/SiteSettings");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/site");
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const fileType = req.body.type || "image";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, fileType + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|svg|ico/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error("Only image files are allowed!"));
  }
});

// Get site settings
router.get("/", async (req, res) => {
  try {
    const siteSettings = await SiteSettings.getSiteSettings();
    res.status(200).json(siteSettings);
  } catch (error) {
    console.error("Error fetching site settings:", error);
    res.status(500).json({ message: "Error fetching site settings" });
  }
});

// Update site settings (admin only)
router.put("/", protect, admin, async (req, res) => {
  try {
    console.log("Updating site settings with data:", req.body);
    
    // Get current settings or create if not exists
    let siteSettings = await SiteSettings.getSiteSettings();
    
    // Update fields from request body
    if (req.body.siteTitle) siteSettings.siteTitle = req.body.siteTitle;
    if (req.body.siteDescription) siteSettings.siteDescription = req.body.siteDescription;
    if (req.body.primaryColor) siteSettings.primaryColor = req.body.primaryColor;
    if (req.body.secondaryColor) siteSettings.secondaryColor = req.body.secondaryColor;
    if (req.body.footerText) siteSettings.footerText = req.body.footerText;
    
    // Handle nested socialMedia object
    if (req.body.socialMedia) {
      siteSettings.socialMedia = {
        ...siteSettings.socialMedia,
        ...req.body.socialMedia
      };
    }
    
    // Handle contact info
    if (req.body.contactEmail) siteSettings.contactEmail = req.body.contactEmail;
    if (req.body.contactPhone) siteSettings.contactPhone = req.body.contactPhone;
    if (req.body.address) siteSettings.address = req.body.address;
    
    // Save updated settings
    await siteSettings.save();
    
    res.status(200).json({ 
      message: "Site settings updated successfully",
      settings: siteSettings
    });
  } catch (error) {
    console.error("Error updating site settings:", error);
    res.status(500).json({ message: "Error updating site settings" });
  }
});

// Upload logo or favicon (admin only)
router.post("/upload", protect, admin, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const imageType = req.body.type || "image";
    const imageUrl = `/uploads/site/${req.file.filename}`;
    
    // Get current settings
    const siteSettings = await SiteSettings.getSiteSettings();
    
    // Update the appropriate setting based on the type
    if (imageType === "logo") {
      siteSettings.logo = imageUrl;
    } else if (imageType === "favicon") {
      siteSettings.favicon = imageUrl;
    }
    
    // Save the settings
    await siteSettings.save();
    
    res.status(200).json({
      message: `${imageType} uploaded successfully`,
      imageUrl: imageUrl,
      settings: siteSettings
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Error uploading image" });
  }
});

module.exports = router; 