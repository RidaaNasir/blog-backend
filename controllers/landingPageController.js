const LandingPage = require("../models/LandingPage");
const { saveFile, saveImage, isVideo } = require("../utils/fileUpload");
const { v4: uuidv4 } = require('uuid');

// Get landing page content
const getLandingPage = async (req, res) => {
  try {
    let landingPage = await LandingPage.findOne();
    if (!landingPage) {
      landingPage = await LandingPage.create({
        hero: {
          title: "Welcome to Delicious Bites",
          subtitle: "Discover amazing recipes and cooking tips",
          images: [],
          video: ""
        },
        featuredContent: {
          title: "Featured Recipes",
          description: "Our most popular and delicious recipes",
          items: []
        },
        about: {
          title: "About Delicious Bites",
          content: "A food blog dedicated to sharing delicious recipes and cooking tips from around the world.",
          image: ""
        },
        testimonials: [],
        reels: {
          title: "Food Reels",
          description: "Watch our latest food reels and get inspired",
          items: []
        }
      });
    }

    // Process media URLs - always use deployed URL
    const baseUrl = 'https://blog-backend-iurp.onrender.com';

    // Process hero images
    if (landingPage.hero.images && landingPage.hero.images.length > 0) {
      landingPage.hero.images = landingPage.hero.images.map(image => {
        if (!image.startsWith('http')) {
          return `${baseUrl}${image}`;
        }
        return image;
      });
    }

    // Process hero video
    if (landingPage.hero.video && !landingPage.hero.video.startsWith('http')) {
      landingPage.hero.video = `${baseUrl}${landingPage.hero.video}`;
    }

    // Process about image
    if (landingPage.about.image && !landingPage.about.image.startsWith('http')) {
      landingPage.about.image = `${baseUrl}${landingPage.about.image}`;
    }

    // Process reels
    if (landingPage.reels && landingPage.reels.items) {
      landingPage.reels.items = landingPage.reels.items.map(reel => {
        if (reel.videoUrl && !reel.videoUrl.startsWith('http')) {
          reel.videoUrl = `${baseUrl}${reel.videoUrl}`;
        }
        if (reel.thumbnail && !reel.thumbnail.startsWith('http')) {
          reel.thumbnail = `${baseUrl}${reel.thumbnail}`;
        }
        return reel;
      });
    }

    res.json(landingPage);
  } catch (error) {
    console.error("Error fetching landing page:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update landing page content
const updateLandingPage = async (req, res) => {
  try {
    const updates = req.body;
    let landingPage = await LandingPage.findOne();
    
    if (!landingPage) {
      landingPage = new LandingPage(updates);
    } else {
      Object.assign(landingPage, updates);
    }
    
    await landingPage.save();
    res.json(landingPage);
  } catch (error) {
    console.error("Error updating landing page:", error);
    res.status(500).json({ message: error.message });
  }
};

// Upload hero media (images or video)
const uploadHeroMedia = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const landingPage = await LandingPage.findOne();
    if (!landingPage) {
      return res.status(404).json({ message: "Landing page not found" });
    }

    const uploadedFiles = [];
    for (const file of req.files) {
      const isVideoFile = file.mimetype.startsWith('video/');
      
      if (isVideoFile) {
        landingPage.hero.video = file.path;
      } else {
        if (!landingPage.hero.images) {
          landingPage.hero.images = [];
        }
        landingPage.hero.images.push(file.path);
      }
      uploadedFiles.push(file.path);
    }

    await landingPage.save();
    res.json({ files: uploadedFiles, landingPage });
  } catch (error) {
    console.error("Error uploading hero media:", error);
    res.status(500).json({ message: error.message });
  }
};

// Add a new reel
const addReel = async (req, res) => {
  try {
    console.log("Add reel request received:", { 
      files: req.files ? req.files.length : 'none',
      body: req.body,
      fileFields: req.files ? req.files.map(f => Object.keys(f)) : []
    });
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No video file uploaded" });
    }

    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const landingPage = await LandingPage.findOne();
    if (!landingPage) {
      return res.status(404).json({ message: "Landing page not found" });
    }

    // Process video file
    console.log("Files received:", req.files.map(f => ({ 
      name: f.originalname, 
      type: f.mimetype,
      size: f.size,
      fieldname: f.fieldname
    })));
    
    // Check if any file is a video
    const videoFile = req.files.find(file => 
      file.mimetype && file.mimetype.startsWith('video/')
    );
    
    if (!videoFile) {
      return res.status(400).json({ message: "No valid video file found. Please upload a video file." });
    }
    
    console.log("Video file found:", { 
      name: videoFile.originalname, 
      type: videoFile.mimetype,
      size: videoFile.size
    });
    
    try {
      const videoPath = await saveFile(videoFile, 'landing-page/reels');
      console.log("Video saved at:", videoPath);
      
      // Process thumbnail (if provided)
      let thumbnailPath = '';
      const thumbnailFile = req.files.find(file => 
        file.mimetype && file.mimetype.startsWith('image/')
      );
      
      if (thumbnailFile) {
        console.log("Thumbnail found:", { 
          name: thumbnailFile.originalname, 
          type: thumbnailFile.mimetype,
          size: thumbnailFile.size
        });
        thumbnailPath = await saveImage(thumbnailFile, 'landing-page/reels/thumbnails');
        console.log("Thumbnail saved at:", thumbnailPath);
      }

      // Initialize reels if it doesn't exist
      if (!landingPage.reels) {
        landingPage.reels = {
          title: "Food Reels",
          description: "Watch our latest food reels and get inspired",
          items: []
        };
      }

      // Add new reel
      const newReel = {
        id: uuidv4(),
        title,
        videoUrl: videoPath,
        thumbnail: thumbnailPath,
        createdAt: new Date()
      };

      landingPage.reels.items.push(newReel);
      await landingPage.save();

      res.status(201).json({ reel: newReel, landingPage });
    } catch (error) {
      console.error("Error processing files:", error);
      return res.status(500).json({ message: "Error processing files: " + error.message });
    }
  } catch (error) {
    console.error("Error adding reel:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a reel
const deleteReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    
    const landingPage = await LandingPage.findOne();
    if (!landingPage || !landingPage.reels) {
      return res.status(404).json({ message: "Landing page or reels not found" });
    }

    // Filter out the reel to delete
    landingPage.reels.items = landingPage.reels.items.filter(reel => reel.id !== reelId);
    
    await landingPage.save();
    res.json({ message: "Reel deleted successfully", landingPage });
  } catch (error) {
    console.error("Error deleting reel:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update reels section title and description
const updateReelsSection = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    const landingPage = await LandingPage.findOne();
    if (!landingPage) {
      return res.status(404).json({ message: "Landing page not found" });
    }

    // Initialize reels if it doesn't exist
    if (!landingPage.reels) {
      landingPage.reels = {
        items: []
      };
    }

    if (title) landingPage.reels.title = title;
    if (description) landingPage.reels.description = description;
    
    await landingPage.save();
    res.json({ landingPage });
  } catch (error) {
    console.error("Error updating reels section:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLandingPage,
  updateLandingPage,
  uploadHeroMedia,
  addReel,
  deleteReel,
  updateReelsSection
}; 