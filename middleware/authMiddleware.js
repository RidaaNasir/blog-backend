const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Ensure User model is imported if needed

// Protect middleware - verifies user is authenticated
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader);

  // ✅ Allow GET requests without authentication
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No auth token provided, checking if GET request...");
    if (req.method === "GET") {
      console.log("GET request allowed without authentication");
      return next(); // Allow access to public routes
    }
    console.log("Non-GET request rejected due to missing token");
    return res.status(401).json({ message: "Authorization token required" });
  }

  const token = authHeader.split(" ")[1];
  console.log("Token extracted:", token ? "Token exists" : "No token");

  try {
    // 🔹 Verify and decode the JWT
    console.log("Verifying token with secret:", process.env.JWT_SECRET ? "Secret exists" : "No secret");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded successfully:", decoded.id);

    // 🔹 Check if the user exists in the database (optional but recommended)
    const user = await User.findById(decoded.id).select("-password"); // Exclude password field
    console.log("User lookup result:", user ? "User found" : "User not found");

    if (!user) {
      console.log("User not found in database");
      return res.status(401).json({ message: "User not found" });
    }

    // 🔹 Attach user details to request object
    req.user = {
      id: user._id,
      username: user.username, // ✅ Ensure `username` is stored
      email: user.email,
      isAdmin: user.isAdmin,
    };
    console.log("User attached to request:", req.user.username);

    next(); // Move to the next middleware or controller
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Admin middleware - verifies user is an admin
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    console.log("Admin access granted to:", req.user.username);
    next();
  } else {
    console.log("Admin access denied:", req.user ? req.user.username : "No user");
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};

// For backward compatibility
const authMiddleware = protect;

module.exports = { protect, admin, authMiddleware };
