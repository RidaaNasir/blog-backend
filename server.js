const cors = require("cors");
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

// ✅ Allowed origins
const allowedOrigins = [
  "https://blog-backend-iurp.onrender.com",
  "http://localhost:5003",
  "http://localhost:5173",
  "https://blog-frontend-2f8p.onrender.com",
];

// ✅ Clean CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow non-browser requests
      if (!allowedOrigins.includes(origin)) {
        console.log("Origin not allowed:", origin);
        return callback(new Error("CORS not allowed for this origin"), false);
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

// ✅ Parse JSON & URL encoded
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ Serve static uploads
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
      res.set("Cache-Control", "public, max-age=31536000"); // 1 year cache
    },
  })
);

// ✅ Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend API is working properly!" });
});

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("API Error:", err);
  res.status(500).json({ message: "Something went wrong!" });
});

module.exports = app;
