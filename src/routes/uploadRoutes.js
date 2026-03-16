const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middlewares/authMiddleware');
const { 
  uploadSingle, 
  uploadMultiple, 
  uploadPhoto, 
  uploadVideo, 
  uploadDocument,
  uploadPhotos,
  validateFileSize 
} = require('../config/multer');

/**
 * File Upload Routes
 * 
 * All routes require authentication
 * File size limits:
 * - Images: 10MB
 * - Videos: 50MB
 * - Documents: 5MB
 */

/**
 * @route   POST /api/upload
 * @desc    Upload a single file (any supported type)
 * @access  Private (authenticated users)
 * @body    file (multipart/form-data)
 */
router.post(
  '/',
  authenticate,
  uploadSingle,
  validateFileSize,
  uploadController.uploadFile
);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple files (max 10)
 * @access  Private (authenticated users)
 * @body    files[] (multipart/form-data)
 */
router.post(
  '/multiple',
  authenticate,
  uploadMultiple,
  validateFileSize,
  uploadController.uploadMultiple
);

/**
 * @route   POST /api/upload/photo
 * @desc    Upload a single photo
 * @access  Private (authenticated users)
 * @body    photo (multipart/form-data, image only)
 */
router.post(
  '/photo',
  authenticate,
  uploadPhoto,
  validateFileSize,
  uploadController.uploadPhoto
);

/**
 * @route   POST /api/upload/photos
 * @desc    Upload multiple photos (max 5)
 * @access  Private (authenticated users)
 * @body    photos[] (multipart/form-data, images only)
 */
router.post(
  '/photos',
  authenticate,
  uploadPhotos,
  validateFileSize,
  uploadController.uploadPhotos
);

/**
 * @route   POST /api/upload/video
 * @desc    Upload a single video
 * @access  Private (authenticated users)
 * @body    video (multipart/form-data, video only)
 */
router.post(
  '/video',
  authenticate,
  uploadVideo,
  validateFileSize,
  uploadController.uploadVideo
);

/**
 * @route   POST /api/upload/document
 * @desc    Upload a single document (PDF)
 * @access  Private (authenticated users)
 * @body    document (multipart/form-data, PDF only)
 */
router.post(
  '/document',
  authenticate,
  uploadDocument,
  validateFileSize,
  uploadController.uploadDocument
);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the maximum limit'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field in file upload'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload failed'
    });
  }
  next();
});

module.exports = router;
