const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // You can customize folder & resource_type based on file mimetype
    let folder = "blog-uploads";
    let resource_type = "image";

    if (file.mimetype.startsWith("video/")) {
      resource_type = "video";
      folder = "blog-uploads/videos";
    } else if (file.mimetype.startsWith("image/")) {
      resource_type = "image";
      folder = "blog-uploads/images";
    }

    return {
      folder: folder,
      resource_type: resource_type,
      format: undefined, // Keep original format
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`, // Optional: unique public id
    };
  },
});

// Create multer upload instance using Cloudinary storage
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept only images and videos
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  },
});

module.exports = upload;
