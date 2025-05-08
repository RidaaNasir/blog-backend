const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { protect, admin } = require('./middleware/authMiddleware');
const landingPageRoutes = require('./routes/landingPageRoutes');
const blogRoutes = require('./routes/blogRoutes');
const userRoutes = require('./routes/userRoutes');
const siteSettingsRoutes = require('./routes/siteSettingsRoutes');
const upload = require('./middleware/uploadMiddleware');

const app = express();

// Updated CORS configuration for localhost
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Allow frontend requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - From: ${req.ip}`);
  
  // Log request headers to check for CORS and auth issues
  console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
  
  // Log when response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] Completed ${res.statusCode} in ${duration}ms`);
  });
  
  next();
});

// Add cache control middleware
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit!');
  return res.json({ message: 'Backend API is working properly!' });
});

// API Routes
app.use("/api/landing-page", landingPageRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/users", userRoutes);
app.use("/api/site-settings", siteSettingsRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5003;
app.get("/", (req, res) => {
  res.send("Backend is Running ✅");
});

// Listen on all interfaces to ensure it's accessible locally
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access locally at: http://localhost:${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://food-blog-dusky-seven.vercel.app/", // <-- Replace with your real deployed frontend URL
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  })
);

