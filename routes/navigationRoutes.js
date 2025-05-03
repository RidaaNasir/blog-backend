const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");

// Mock data storage (replace with database in production)
let navigationItems = [
  {
    id: "1",
    label: "Home",
    url: "/",
    isExternal: false
  },
  {
    id: "2",
    label: "Recipes",
    url: "/blogs",
    isExternal: false
  },
  {
    id: "3",
    label: "About",
    url: "/about",
    isExternal: false
  },
  {
    id: "4",
    label: "Contact",
    url: "/contact",
    isExternal: false
  }
];

// Get navigation menu items
router.get("/", async (req, res) => {
  try {
    res.status(200).json(navigationItems);
  } catch (error) {
    console.error("Error fetching navigation items:", error);
    res.status(500).json({ message: "Error fetching navigation items" });
  }
});

// Update navigation menu items (admin only)
router.put("/", protect, admin, async (req, res) => {
  try {
    navigationItems = req.body;
    res.status(200).json({ message: "Navigation menu updated successfully" });
  } catch (error) {
    console.error("Error updating navigation menu:", error);
    res.status(500).json({ message: "Error updating navigation menu" });
  }
});

module.exports = router; 