// middleware/adminMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

   if (!user || !user.isAdmin) {
  return res.status(403).json({ message: "Access denied. Admins only." });
}


    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ message: "Access denied", error });
  }
};

module.exports = adminMiddleware;
