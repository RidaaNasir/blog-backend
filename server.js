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
  "https://blog-frontend-2f8p.onrender.com"
];

// Single clean CORS middleware
app.use(
  cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        console.log('Origin not allowed:', origin);
        return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "Origin", "Accept"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400 // 24 hours
  })
);

// Debug middleware to log CORS-related headers
app.use((req, res, next) => {
  console.log('Request Origin:', req.headers.origin);
  console.log('Request Method:', req.method);
  console.log('Request Headers:', req.headers);
  
  // Add CORS headers manually
  if (req.headers.origin && allowedOrigins.includes(req.headers.origin)) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Origin, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
});

// Handle preflight requests
app.options('*', cors());

// Middleware to parse JSON and URL-encoded data
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files with proper CORS headers
app.use("/uploads", (req, res, next) => {
  // Add CORS headers for static files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Origin, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  next();
}, express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, path) => {
    // Set appropriate content type based on file extension
    if (path.endsWith('.mp4')) {
      res.set('Content-Type', 'video/mp4');
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.set('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    }
  }
}));

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
