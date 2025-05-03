const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'video'], required: true },
  url: { type: String, required: true },
  caption: { type: String }
});

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: `User`}],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: `User`},
      author: { type: String, default: "Anonymous" },
      comment: {type: String, required:true},
      createdAt: { type: Date, default: Date.now },
    },
  ],
  media: [mediaSchema],
  image: { type: String },
});

module.exports = mongoose.model("Blog", blogSchema);
