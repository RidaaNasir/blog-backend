const path = require('path');
const fs = require('fs');

// Function to upload image and return the file path
const uploadImage = async (file, folder) => {
  try {
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    
    // Move file to upload directory
    const filePath = path.join(folder, filename);
    fs.writeFileSync(path.join(__dirname, '../uploads', filePath), file.buffer);

    return filePath;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

module.exports = {
  uploadImage
}; 