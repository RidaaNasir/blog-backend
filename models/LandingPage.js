const mongoose = require('mongoose');

const landingPageSchema = new mongoose.Schema({
  hero: {
    title: { type: String, default: "Welcome to Delicious Bites" },
    subtitle: { type: String, default: "Discover amazing recipes and cooking tips" },
    images: [{ type: String }],
    video: { type: String },
    ctaText: { type: String, default: "Explore Recipes" },
    ctaLink: { type: String, default: "/blogs" }
  },
  featuredContent: {
    title: { type: String, default: "Featured Recipes" },
    description: { type: String, default: "Our most popular and delicious recipes" },
    items: [{
      id: String,
      title: String,
      image: String,
      link: String
    }]
  },
  about: {
    title: { type: String, default: "About Delicious Bites" },
    content: { type: String, default: "A food blog dedicated to sharing delicious recipes and cooking tips from around the world." },
    image: { type: String }
  },
  testimonials: [{
    id: String,
    name: String,
    role: String,
    content: String,
    avatar: String
  }],
  reels: {
    title: { type: String, default: "Food Reels" },
    description: { type: String, default: "Watch our latest food reels and get inspired" },
    items: [{
      id: String,
      title: String,
      videoUrl: String,
      thumbnail: String,
      createdAt: { type: Date, default: Date.now }
    }]
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LandingPage', landingPageSchema); 