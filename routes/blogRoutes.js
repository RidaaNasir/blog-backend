const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware"); // Middleware for handling file uploads
const { protect, admin } = require("../middleware/authMiddleware"); // Middleware for authentication
const adminMiddleware = require("../middleware/adminMiddleware"); // Middleware for admin auth
const {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlogById,
  deleteBlogById,
  uploadBlogImage,
  likeBlog,
  unlikeBlog,
  commentOnBlog,
  unlikeComment,
  getBlogCount,
  getCommentCount
} = require("../controllers/BlogController");

// Public Routes
router.get("/", getAllBlogs); // Get all blogs with optional filtering
router.get("/count", getBlogCount); // Get total count of blogs
router.get("/comments/count", getCommentCount); // Get total count of comments
router.get("/:id", getBlogById); // Get a single blog by ID

// Only logged in users can like and comment 
router.post("/:id/like", protect, likeBlog);
router.post("/:id/unlike", protect, unlikeBlog);
router.post("/:id/comment", protect, commentOnBlog);
router.post("/:id/comment/:commentId/unlike", protect, unlikeComment);

// Admin Routes (secured with adminMiddleware)
// Create blog with multiple media files (up to 7)
router.post("/", adminMiddleware, upload.array("media", 7), createBlog);

// Update blog with multiple media files
router.put("/:id", adminMiddleware, upload.array("media", 7), updateBlogById);

// Delete a blog
router.delete("/:id", adminMiddleware, deleteBlogById);

// Legacy route for single image upload (for backward compatibility)
router.post("/:id/uploads", adminMiddleware, upload.single("image"), uploadBlogImage);

module.exports = router;



