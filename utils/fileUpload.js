const fs = require('fs');
const path = require('path');

const saveFile = async (file, folder) => {
  try {
    console.log("Saving file:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      folder: folder
    });

    // Create folder if it doesn't exist
    const uploadDir = path.join(__dirname, '../uploads', folder);
    console.log("Upload directory:", uploadDir);
    
    if (!fs.existsSync(uploadDir)) {
      console.log("Creating directory:", uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.mimetype.split('/')[1];
    // Don't include folder in filename to avoid path duplication
    const filename = `${uniqueSuffix}.${extension}`;
    const filepath = path.join(uploadDir, filename);
    
    console.log("File will be saved at:", filepath);

    // Check if file.buffer exists
    if (!file.buffer) {
      console.error("File buffer is missing");
      throw new Error("File buffer is missing");
    }

    // Save file
    await fs.promises.writeFile(filepath, file.buffer);
    console.log("File saved successfully");

    // Return relative URL path
    return `/uploads/${folder}/${filename}`;
  } catch (error) {
    console.error("Error saving file:", error);
    throw new Error('Failed to save file: ' + error.message);
  }
};

// For backward compatibility
const saveImage = saveFile;

// Determine if a file is a video based on mimetype or filename
const isVideo = (file) => {
  // If file is an object with mimetype property
  if (file && file.mimetype) {
    return file.mimetype.startsWith('video/');
  }
  
  // If file is a string (filename)
  if (typeof file === 'string') {
    const ext = path.extname(file).toLowerCase();
    return ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv'].includes(ext);
  }
  
  return false;
};

module.exports = {
  saveFile,
  saveImage,
  isVideo
}; 