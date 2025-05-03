const express = require("express");
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getAllUsers, 
  getUserById, 
  deleteUser, 
  updateUserAdminStatus,
  updateUserProfile,
  getCurrentUser,
  getUserCount
} = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/count", getUserCount);

// User profile routes (authenticated)
router.get("/profile", protect, getCurrentUser);
router.put("/profile", protect, upload.single("profilePicture"), updateUserProfile);

// Admin routes
router.get("/", protect, admin, getAllUsers);
router.get("/:id", protect, admin, getUserById);
router.delete("/:id", protect, admin, deleteUser);
router.put("/:id/admin", protect, admin, updateUserAdminStatus);

module.exports = router;
