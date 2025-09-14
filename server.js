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
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "https://food-blog-4fj3.vercel.app",
  "https://blog-backend-iurp.onrender.com",
  "http://localhost:5003",
  "http://localhost:5173",
  "https://blog-frontend-2f8p.onrender.com",
];

// Single clean CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow non-browser requests
      if (allowedOrigins.indexOf(origin) === -1) {
        console.log("Origin not allowed:", origin);
        return callback(
          new Error("The CORS policy does not allow this origin."),
          false
        );
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Origin",
      "Accept",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400,
  })
);

// Handle preflight requests
app.options("*", cors());

// Middleware to parse JSON and URL-encoded data
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ FIXED: Serve static uploads folder
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".mp4")) {
        res.set("Content-Type", "video/mp4");
      } else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
        res.set("Content-Type", "image/jpeg");
      } else if (filePath.endsWith(".png")) {
        res.set("Content-Type", "image/png");
      }
      res.set("Access-Control-Allow-Origin", "*"); // allow cross-origin
      res.set("Cache-Control", "public, max-age=31536000"); // cache 1 year
    },
  })
);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} - From: ${req.ip}`
  );
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
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Test endpoint
app.get("/api/test", (req, res) => {
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
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("API Error:", err);
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
