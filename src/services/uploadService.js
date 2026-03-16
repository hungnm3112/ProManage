const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/app');

class UploadService {
  constructor() {
    // Create upload directory if it doesn't exist
    const uploadDir = config.upload.uploadPath;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }

  // Configure storage
  getStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, config.upload.uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });
  }

  // File filter
  fileFilter(req, file, cb) {
    const allowedTypes = config.upload.allowedTypes;
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
    }
  }

  // Single file upload
  single(fieldName) {
    return multer({
      storage: this.getStorage(),
      limits: {
        fileSize: config.upload.maxFileSize
      },
      fileFilter: this.fileFilter
    }).single(fieldName);
  }

  // Multiple files upload
  multiple(fieldName, maxCount = 5) {
    return multer({
      storage: this.getStorage(),
      limits: {
        fileSize: config.upload.maxFileSize
      },
      fileFilter: this.fileFilter
    }).array(fieldName, maxCount);
  }

  // Delete file
  deleteFile(filePath) {
    const fullPath = path.join(__dirname, '../../', filePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  }

  // Get file info
  getFileInfo(file) {
    return {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    };
  }
}

module.exports = new UploadService();
