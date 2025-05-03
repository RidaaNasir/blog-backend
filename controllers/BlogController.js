const Blog = require("../models/Blog");
const fs = require("fs");
const path = require("path");

// Get All Blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const { search, startDate, endDate } = req.query;
    
    // Build query object
    const query = {};
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set the end date to the end of the day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endOfDay;
      }
    }
    
    console.log("Query:", JSON.stringify(query));
    
    // Find blogs with the constructed query
    const blogs = await Blog.find(query).sort({ createdAt: -1 }); // Sort by newest first
    
    // Process each blog to ensure image paths are correct
    const processedBlogs = blogs.map(blog => {
      const blogObj = blog.toObject();
      
      // Log the original image path for debugging
      console.log("Original blog image path:", blogObj.image);
      
      // Fix image path if it exists
      if (blogObj.image) {
        // Make sure the image path is correct - don't modify it if it already starts with /uploads
        if (!blogObj.image.startsWith('/uploads')) {
          blogObj.image = `/uploads/${blogObj.image.split('uploads/').pop()}`;
        }
        console.log("Processed blog image path:", blogObj.image);
      }
      
      // Process media array if it exists
      if (blogObj.media && blogObj.media.length > 0) {
        blogObj.media = blogObj.media.map(item => {
          if (item.url && !item.url.startsWith('/uploads')) {
            item.url = `/uploads/${item.url.split('uploads/').pop()}`;
          }
          return item;
        });
      }
      
      return blogObj;
    });
    
    res.status(200).json(processedBlogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Error fetching blogs", error });
  }
};

// Get Blog Count
exports.getBlogCount = async (req, res) => {
  try {
    const count = await Blog.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error counting blogs:", error);
    res.status(500).json({ message: "Error counting blogs", error });
  }
};

// Get Comment Count
exports.getCommentCount = async (req, res) => {
  try {
    // Aggregate to count all comments across all blogs
    const result = await Blog.aggregate([
      { $project: { commentCount: { $size: { $ifNull: ["$comments", []] } } } },
      { $group: { _id: null, totalComments: { $sum: "$commentCount" } } }
    ]);
    
    const count = result.length > 0 ? result[0].totalComments : 0;
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error counting comments:", error);
    res.status(500).json({ message: "Error counting comments", error });
  }
};

// Get Blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Return the blog with the image path as is
    const blogObj = blog.toObject();
    
    res.status(200).json(blogObj);
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ message: "Error fetching blog", error });
  }
};

exports.likeBlog = async (req, res) => {
  console.log("likeBlog - User Info:", req.user); // Ensure this is set correctly
  const { id } = req.params;

  if (!req.user || !req.user.id) {
    console.error("likeBlog - No user provided in request");
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    console.log(`likeBlog - Looking for blog with ID: ${id}`);
    const blog = await Blog.findById(id);
    if (!blog) {
      console.log("Blog not found");
      return res.status(404).json({ message: "Blog not found" });
    }

    console.log(`likeBlog - Checking if user ${req.user.id} already liked blog`);
    // Convert ObjectId to string for comparison
    const userLiked = blog.likes.some(like => like.toString() === req.user.id.toString());
    
    if (userLiked) {
      console.log("User already liked this blog");
      return res.status(400).json({ message: "You already liked this blog" });
    }

    console.log(`likeBlog - Adding user ${req.user.id} to likes array`);
    blog.likes.push(req.user.id);
    await blog.save();
    console.log("Blog liked successfully");

    res
      .status(200)
      .json({ message: "Blog liked successfully", likes: blog.likes.length });
  } catch (error) {
    console.error("Error liking the blog:", error);
    res.status(500).json({ message: "Error liking the blog", error: error.message });
  }
};

exports.unlikeBlog = async (req, res) => {
  console.log("unlikeBlog - User:", req.user); // Log to check if user info is set
  const { id } = req.params;

  if (!req.user || !req.user.id) {
    console.error("unlikeBlog - No user provided in request");
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    console.log(`unlikeBlog - Looking for blog with ID: ${id}`);
    const blog = await Blog.findById(id);
    if (!blog) {
      console.log("Blog not found");
      return res.status(404).json({ message: "Blog not found" });
    }

    console.log(`unlikeBlog - Checking if user ${req.user.id} has liked blog`);
    // Convert ObjectId to string for comparison
    const userLiked = blog.likes.some(like => like.toString() === req.user.id.toString());
    
    if (!userLiked) {
      console.log("User hasn't liked this blog yet");
      return res
        .status(400)
        .json({ message: "You haven't liked this blog yet" });
    }

    console.log(`unlikeBlog - Removing user ${req.user.id} from likes array`);
    // Remove the user's ID from the likes array
    blog.likes = blog.likes.filter(
      (like) => like.toString() !== req.user.id.toString()
    );
    await blog.save();
    console.log("Blog unliked successfully");

    res
      .status(200)
      .json({ message: "Blog unliked successfully", likes: blog.likes.length });
  } catch (error) {
    console.error("Error unliking the blog:", error);
    res.status(500).json({ message: "Error unliking the blog", error: error.message });
  }
};

// Add function to unlike a comment
exports.unlikeComment = async (req, res) => {
  const { id, commentId } = req.params;

  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Find the comment index
    const commentIndex = blog.comments.findIndex(
      comment => comment._id.toString() === commentId
    );
    
    if (commentIndex === -1) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if the user is the author of the comment
    const comment = blog.comments[commentIndex];
    if (comment.user && comment.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "You can only unlike your own comments" });
    }

    // Remove the comment using splice
    blog.comments.splice(commentIndex, 1);
    await blog.save();

    res.status(200).json({
      message: "Comment unliked successfully",
      comments: blog.comments,
    });
  } catch (error) {
    console.error("Error unliking the comment:", error);
    res.status(500).json({ message: "Error unliking the comment", error });
  }
};

exports.commentOnBlog = async (req, res) => {
  const { comment } = req.body; // Extract comment text from request body
  const { id } = req.params; // Blog ID from URL params

  try {
    // Find the blog by ID
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Make sure we have a user from the authentication middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User authentication required" });
    }

    // Log debugging information
    console.log("Commenting on blog:", {
      blogId: id,
      userId: req.user.id,
      username: req.user.username,
      commentData: comment
    });

    // Ensure comment text is provided
    if (!comment || !comment.text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // Construct new comment (Use `comment` instead of `text`)
    const newComment = {
      comment: comment.text, // ✅ Fix: Change `text` to `comment`
      author: comment.author || req.user.username || "Anonymous",
      user: req.user.id, // Get user ID from the auth middleware
      createdAt: new Date(), // Explicitly set the creation date
    };

    // Add the new comment to the blog's comments array
    blog.comments.push(newComment);

    // Save the updated blog
    await blog.save();

    // Send response with updated comments
    res
      .status(200)
      .json({
        message: "Comment posted successfully",
        comments: blog.comments,
      });
  } catch (error) {
    console.error("🔥 Error in commentOnBlog:", error);
    res.status(500).json({ message: "Error posting the comment", error });
  }
};

// Upload Blog Image
exports.uploadBlogImage = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // If the blog already has an image, delete the old one
    if (blog.image) {
      const oldImagePath = path.resolve(__dirname, "../", blog.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Save the new image path
    blog.image = req.file ? `uploads/blogs${req.file.filename}` : null; // Save relative path
    await blog.save();

    res.status(200).json({
      message: "Image uploaded successfully",
      blog,
    });
  } catch (error) {
    console.error("Error uploading blog image:", error);
    res.status(500).json({ message: "Error uploading image", error });
  }
};

// Create Blog
exports.createBlog = async (req, res) => {
  try {
    const { title, content, author } = req.body;

    // Create a new blog object
    const blogData = {
      title,
      content,
      author,
      media: []
    };

    // Handle multiple files
    if (req.files && req.files.length > 0) {
      // Process each uploaded file
      req.files.forEach(file => {
        try {
          const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
          
          // Create a URL that will work with the static file serving
          let url;
          if (file.path) {
            const relativePath = file.path.replace(/\\/g, '/');
            const pathParts = relativePath.split('uploads/');
            url = `/uploads/${pathParts.length > 1 ? pathParts[1] : relativePath}`;
          } else if (file.buffer) {
            // Handle memory storage - save the file to disk
            const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
            const uploadDir = path.join(__dirname, '../uploads/blogs');
            
            // Ensure directory exists
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
            
            const filePath = path.join(uploadDir, filename);
            fs.writeFileSync(filePath, file.buffer);
            url = `/uploads/blogs/${filename}`;
          } else {
            throw new Error('Invalid file object');
          }
          
          blogData.media.push({
            type: fileType,
            url: url,
            caption: req.body[`caption_${file.originalname || file.filename}`] || ''
          });
        } catch (fileError) {
          console.error('Error processing file:', fileError);
          // Continue with other files
        }
      });

      // Set the first image as the main image for backward compatibility
      const firstImage = blogData.media.find(item => item.type === 'image');
      if (firstImage) {
        blogData.image = firstImage.url;
      }
    } else if (req.file) {
      // Handle single file upload for backward compatibility
      try {
        const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
        
        // Create a URL that will work with the static file serving
        let url;
        if (req.file.path) {
          const relativePath = req.file.path.replace(/\\/g, '/');
          const pathParts = relativePath.split('uploads/');
          url = `/uploads/${pathParts.length > 1 ? pathParts[1] : relativePath}`;
        } else if (req.file.buffer) {
          // Handle memory storage - save the file to disk
          const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(req.file.originalname);
          const uploadDir = path.join(__dirname, '../uploads/blogs');
          
          // Ensure directory exists
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          const filePath = path.join(uploadDir, filename);
          fs.writeFileSync(filePath, req.file.buffer);
          url = `/uploads/blogs/${filename}`;
        } else {
          throw new Error('Invalid file object');
        }
        
        blogData.media.push({
          type: fileType,
          url: url,
          caption: req.body.caption || ''
        });
        
        // Set as main image if it's an image
        if (fileType === 'image') {
          blogData.image = url;
        }
      } catch (fileError) {
        console.error('Error processing file:', fileError);
      }
    }

    // Create and save the blog
    const blog = new Blog(blogData);
    const savedBlog = await blog.save();

    res.status(201).json(savedBlog);
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ message: "Error creating blog", error });
  }
};

// Update Blog by ID
exports.updateBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    
    // Find the blog to update
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Update basic fields
    blog.title = title || blog.title;
    blog.content = content || blog.content;

    // Handle media updates
    if (req.files && req.files.length > 0) {
      // Process each uploaded file
      req.files.forEach(file => {
        const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
        // Create a URL that will work with the static file serving
        const relativePath = file.path.replace(/\\/g, '/');
        const url = `/uploads/${relativePath.split('uploads/')[1]}`;
        
        // Add new media
        blog.media.push({
          type: fileType,
          url: url,
          caption: req.body[`caption_${file.filename}`] || ''
        });
      });

      // Ensure we don't exceed 7 media items
      if (blog.media.length > 7) {
        blog.media = blog.media.slice(-7);
      }

      // Update the main image if needed
      if (!blog.image) {
        const firstImage = blog.media.find(item => item.type === 'image');
        if (firstImage) {
          blog.image = firstImage.url;
        }
      }
    } else if (req.file) {
      // Handle single file upload for backward compatibility
      const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
      // Create a URL that will work with the static file serving
      const relativePath = req.file.path.replace(/\\/g, '/');
      const url = `/uploads/${relativePath.split('uploads/')[1]}`;
      
      // Add new media
      blog.media.push({
        type: fileType,
        url: url,
        caption: req.body.caption || ''
      });
      
      // Ensure we don't exceed 7 media items
      if (blog.media.length > 7) {
        blog.media = blog.media.slice(-7);
      }
      
      // Update the main image if it's an image and no main image exists
      if (fileType === 'image' && !blog.image) {
        blog.image = url;
      }
    }

    // Handle media deletions
    if (req.body.deleteMedia && Array.isArray(req.body.deleteMedia)) {
      req.body.deleteMedia.forEach(mediaId => {
        const mediaIndex = blog.media.findIndex(m => m._id.toString() === mediaId);
        if (mediaIndex !== -1) {
          blog.media.splice(mediaIndex, 1);
        }
      });
    }

    // Save the updated blog
    const updatedBlog = await blog.save();
    res.status(200).json(updatedBlog);
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ message: "Error updating blog", error });
  }
};

// Delete Blog (for reference)
exports.deleteBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the blog by ID
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Delete the associated image file if it exists
    if (blog.image) {
      const imagePath = path.join(__dirname, "../uploads/blogs", blog.image); // Ensure correct path
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`Deleted image file: ${imagePath}`);
      }
    }

    // Delete the blog from the database
    await Blog.findByIdAndDelete(id);
    console.log(`Deleted blog with ID: ${id}`);
    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Error deleting blog", error });
  }
};