const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { protect, admin } = require("./middleware/authMiddleware");
const landingPageRoutes = require("./routes/landingPageRoutes");
const blogRoutes = require("./routes/blogRoutes");
const userRoutes = require("./routes/userRoutes");
const siteSettingsRoutes = require("./routes/siteSettingsRoutes");
const upload = require("./middleware/uploadMiddleware");

const app = express();

// Allow only specific origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://food-blog-4fj3.vercel.app", // <-- This is the correct frontend URL
];


// Single clean CORS middleware
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  })
);

// Middleware to parse JSON and URL-encoded data
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} - From: ${req.ip}`
  );
  console.log("Request Headers:", JSON.stringify(req.headers, null, 2));
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] Completed ${
        res.statusCode
      } in ${duration}ms`
    );
  });
  next();
});

// Cache control middleware
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Serve static files (uploaded images, files, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test endpoint
app.get("/api/test", (req, res) => {
  console.log("Test endpoint hit!");
  res.json({ message: "Backend API is working properly!" });
});

// API routes
app.use("/api/landing-page", landingPageRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/users", userRoutes);
app.use("/api/site-settings", siteSettingsRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Exit process if DB connection fails
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("API Error:", err);
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("Backend is Running ✅");
});

// Start server
const PORT = process.env.PORT || 5003;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});
