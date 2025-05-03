const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure directories exist
const ensureDirectoriesExist = () => {
  const dirs = [
    path.join(__dirname, "../uploads"),
    path.join(__dirname, "../uploads/blogs"),
    path.join(__dirname, "../uploads/profiles"),
    path.join(__dirname, "../uploads/videos"),
    path.join(__dirname, "../uploads/landing"),
    path.join(__dirname, "../uploads/landing-page"),
    path.join(__dirname, "../uploads/landing-page/reels"),
    path.join(__dirname, "../uploads/landing-page/reels/thumbnails")
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureDirectoriesExist();

// Configure multer for memory storage
const storage = multer.memoryStorage();



// Create multer instance with configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // Increased to 50MB to accommodate videos
  },
  fileFilter: (req, file, cb) => {
    console.log("Processing file upload:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

module.exports = upload;

/*
BASICALLY — with the first code I can upload videos while creating the blog.

--- ✅ Works for Blog Uploads Using Disk Storage --- 

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure necessary upload folders exist
const ensureDirectoriesExist = () => {
  const dirs = [
    path.join(__dirname, "../uploads"),
    path.join(__dirname, "../uploads/blogs"),
    path.join(__dirname, "../uploads/profiles"),
    path.join(__dirname, "../uploads/videos"),
    path.join(__dirname, "../uploads/landing"),
    path.join(__dirname, "../uploads/landing-page"),
    path.join(__dirname, "../uploads/landing-page/reels"),
    path.join(__dirname, "../uploads/landing-page/reels/thumbnails")
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureDirectoriesExist();

const multerDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/blogs")); // Save to 'blogs' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Add timestamp to avoid name clashes
  },
});

const upload = multer({ storage: multerDiskStorage });

module.exports = upload;


--- ⚠️ Works for Reels Upload Only (with memory storage) ---
// Note: This can fail if you try to save memory buffer to disk manually but it’s undefined.

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create folders if not already present
const ensureDirectoriesExist = () => {
  const dirs = [
    path.join(__dirname, "../uploads"),
    path.join(__dirname, "../uploads/blogs"),
    path.join(__dirname, "../uploads/profiles"),
    path.join(__dirname, "../uploads/videos"),
    path.join(__dirname, "../uploads/landing"),
    path.join(__dirname, "../uploads/landing-page"),
    path.join(__dirname, "../uploads/landing-page/reels"),
    path.join(__dirname, "../uploads/landing-page/reels/thumbnails")
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureDirectoriesExist();

// Use memory storage — useful when you're processing files in memory (e.g. resizing images before saving)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max size
  },
  fileFilter: (req, file, cb) => {
    console.log("Processing file upload:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });

    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true); // Accept only images or videos
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  }
});

module.exports = upload;


❓ Why does memoryStorage version fail sometimes with error: "File buffer is missing"?
➡️ Because `memoryStorage` keeps files in memory (RAM), and if you're trying to save them to disk yourself later using `fs.writeFile()`, you must access `file.buffer`.
If your logic accidentally skips handling `file.buffer`, it throws "File buffer is missing".

✅ SOLUTION:
• Use `diskStorage` when you want multer to save the files directly.
• Use `memoryStorage` only when you're doing in-memory transformations (like compressing, thumbnailing etc.) **and** then save them manually.

Hope this clears it up!
*/
