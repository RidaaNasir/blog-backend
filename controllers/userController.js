const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Blog = require("../models/Blog");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Register User
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).json({
        token: generateToken(user._id),
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin
        },
      });

    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get User Count
const getUserCount = async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error counting users:", error);
    res.status(500).json({ message: "Error counting users", error: error.message });
  }
};

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

// Get user by ID (Admin only)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get user's blogs
    const blogs = await Blog.find({ author: user.username });
    
    // Get user's comments
    const blogsWithComments = await Blog.find({
      "comments.user": user._id
    });
    
    // Extract just the comments by this user
    const comments = [];
    blogsWithComments.forEach(blog => {
      blog.comments.forEach(comment => {
        if (comment.user && comment.user.toString() === user._id.toString()) {
          comments.push({
            ...comment.toObject(),
            blogId: blog._id,
            blogTitle: blog.title
          });
        }
      });
    });
    
    res.status(200).json({
      user,
      activity: {
        blogs,
        comments
      }
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Don't allow deleting another admin
    if (user.isAdmin && req.user.id !== user._id.toString()) {
      return res.status(403).json({ message: "Cannot delete another admin user" });
    }
    
    // Delete the user
    await User.findByIdAndDelete(req.params.id);
    
    // Remove user's comments from blogs
    await Blog.updateMany(
      { "comments.user": req.params.id },
      { $pull: { comments: { user: req.params.id } } }
    );
    
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

// Update user admin status (Admin only)
const updateUserAdminStatus = async (req, res) => {
  try {
    const { isAdmin } = req.body;
    
    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ message: "isAdmin must be a boolean value" });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Don't allow removing admin status from yourself
    if (!isAdmin && req.user.id === user._id.toString()) {
      return res.status(403).json({ message: "Cannot remove your own admin status" });
    }
    
    user.isAdmin = isAdmin;
    await user.save();
    
    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, currentPassword, newPassword } = req.body;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Update basic info if provided
    if (username) user.username = username;
    if (email) user.email = email;
    
    // Update password if provided
    if (currentPassword && newPassword) {
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Set new password
      user.password = newPassword; // Will be hashed by pre-save hook
    }
    
    // Update profile picture if provided
    if (req.file) {
      // If there's an existing profile picture, you might want to delete it
      // This depends on how you're storing profile pictures
      
      // Save the new profile picture path
      user.profilePicture = req.file.filename;
    }
    
    // Save the updated user
    await user.save();
    
    // Return updated user without password
    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      profilePicture: user.profilePicture
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find the user without returning the password
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  getAllUsers, 
  getUserById, 
  deleteUser, 
  updateUserAdminStatus,
  updateUserProfile,
  getCurrentUser,
  getUserCount
};
