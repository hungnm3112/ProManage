const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Multer Configuration for File Uploads
 * 
 * Supported file types:
 * - Images: jpg, jpeg, png, gif, webp
 * - Videos: mp4, avi, mov, wmv, flv, mkv
 * - Documents: pdf
 * 
 * Size limits:
 * - Images: 10MB
 * - Videos: 50MB
 * - Documents: 5MB
 */

// Create upload directories if they don't exist
const uploadDirs = [
  'uploads',
  'uploads/photos',
  'uploads/videos',
  'uploads/files'
];

uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '../../', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/files'; // Default

    if (file.mimetype.startsWith('image/')) {
      uploadPath = 'uploads/photos';
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath = 'uploads/videos';
    } else if (file.mimetype === 'application/pdf') {
      uploadPath = 'uploads/files';
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp-randomString-originalName
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

// File filter - only allow specific file types
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/x-matroska'];
  const allowedDocumentTypes = ['application/pdf'];

  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes, ...allowedDocumentTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Only images (jpg, png, gif, webp), videos (mp4, avi, mov, wmv, flv, mkv), and PDF are allowed.`), false);
  }
};

// Size limits
const limits = {
  fileSize: 50 * 1024 * 1024 // 50MB (max for videos)
};

// Multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

// Middleware for validating file sizes based on type
const validateFileSize = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  const files = req.files || [req.file];
  
  for (const file of files) {
    const maxSize = getMaxSizeForFileType(file.mimetype);
    
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return res.status(400).json({
        success: false,
        message: `File ${file.originalname} exceeds maximum size of ${maxSizeMB}MB`
      });
    }
  }

  next();
};

// Helper function to get max size for file type
function getMaxSizeForFileType(mimetype) {
  if (mimetype.startsWith('image/')) {
    return 10 * 1024 * 1024; // 10MB for images
  } else if (mimetype.startsWith('video/')) {
    return 50 * 1024 * 1024; // 50MB for videos
  } else if (mimetype === 'application/pdf') {
    return 5 * 1024 * 1024; // 5MB for PDFs
  }
  return 10 * 1024 * 1024; // Default 10MB
}

// Export upload instances
module.exports = {
  // Single file upload
  uploadSingle: upload.single('file'),
  
  // Multiple files upload (max 10 files)
  uploadMultiple: upload.array('files', 10),
  
  // Specific field uploads
  uploadPhoto: upload.single('photo'),
  uploadVideo: upload.single('video'),
  uploadDocument: upload.single('document'),
  
  // Multiple photos (max 5)
  uploadPhotos: upload.array('photos', 5),
  
  // Size validation middleware
  validateFileSize,
  
  // Helper function to get file URL
  getFileUrl: (req, filename) => {
    return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
  },
  
  // Helper function to delete file
  deleteFile: (filePath) => {
    return new Promise((resolve, reject) => {
      const fullPath = path.join(__dirname, '../../', filePath);
      fs.unlink(fullPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};
