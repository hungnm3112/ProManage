const path = require('path');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Upload File Controller
 * Handles file uploads for photos, videos, and documents
 */

/**
 * Upload single file
 * POST /api/upload
 * @body file - File to upload (multipart/form-data)
 * @returns { filename, url, size, mimeType, uploadPath }
 */
exports.uploadFile = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    const file = req.file;

    // Determine file type category
    let fileType = 'file';
    if (file.mimetype.startsWith('image/')) {
      fileType = 'photo';
    } else if (file.mimetype.startsWith('video/')) {
      fileType = 'video';
    } else if (file.mimetype === 'application/pdf') {
      fileType = 'document';
    }

    // Construct file URL
    const fileUrl = `${req.protocol}://${req.get('host')}/${file.path.replace(/\\/g, '/')}`;

    const fileInfo = {
      filename: file.filename,
      originalName: file.originalname,
      url: fileUrl,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      mimeType: file.mimetype,
      fileType: fileType,
      uploadPath: file.path.replace(/\\/g, '/'),
      uploadedAt: new Date()
    };

    sendSuccess(res, 'File uploaded successfully', fileInfo);
  } catch (error) {
    console.error('Error uploading file:', error);
    sendError(res, error.message || 'Failed to upload file', 500);
  }
};

/**
 * Upload multiple files
 * POST /api/upload/multiple
 * @body files - Array of files (max 10)
 * @returns Array of { filename, url, size, mimeType }
 */
exports.uploadMultiple = async (req, res) => {
  try {
    // Check if files exist
    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No files uploaded', 400);
    }

    const files = req.files;

    // Process each file
    const filesInfo = files.map(file => {
      // Determine file type category
      let fileType = 'file';
      if (file.mimetype.startsWith('image/')) {
        fileType = 'photo';
      } else if (file.mimetype.startsWith('video/')) {
        fileType = 'video';
      } else if (file.mimetype === 'application/pdf') {
        fileType = 'document';
      }

      // Construct file URL
      const fileUrl = `${req.protocol}://${req.get('host')}/${file.path.replace(/\\/g, '/')}`;

      return {
        filename: file.filename,
        originalName: file.originalname,
        url: fileUrl,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        mimeType: file.mimetype,
        fileType: fileType,
        uploadPath: file.path.replace(/\\/g, '/'),
        uploadedAt: new Date()
      };
    });

    const summary = {
      totalFiles: filesInfo.length,
      totalSize: filesInfo.reduce((sum, file) => sum + file.size, 0),
      totalSizeFormatted: formatFileSize(filesInfo.reduce((sum, file) => sum + file.size, 0)),
      files: filesInfo
    };

    sendSuccess(res, `${filesInfo.length} file(s) uploaded successfully`, summary);
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    sendError(res, error.message || 'Failed to upload files', 500);
  }
};

/**
 * Upload photo
 * POST /api/upload/photo
 * @body photo - Photo file
 * @returns { filename, url, size, mimeType }
 */
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'No photo uploaded', 400);
    }

    const file = req.file;

    // Verify it's an image
    if (!file.mimetype.startsWith('image/')) {
      return sendError(res, 'File must be an image', 400);
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/${file.path.replace(/\\/g, '/')}`;

    const photoInfo = {
      filename: file.filename,
      originalName: file.originalname,
      url: fileUrl,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      mimeType: file.mimetype,
      fileType: 'photo',
      uploadPath: file.path.replace(/\\/g, '/'),
      uploadedAt: new Date()
    };

    sendSuccess(res, 'Photo uploaded successfully', photoInfo);
  } catch (error) {
    console.error('Error uploading photo:', error);
    sendError(res, error.message || 'Failed to upload photo', 500);
  }
};

/**
 * Upload video
 * POST /api/upload/video
 * @body video - Video file
 * @returns { filename, url, size, mimeType }
 */
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'No video uploaded', 400);
    }

    const file = req.file;

    // Verify it's a video
    if (!file.mimetype.startsWith('video/')) {
      return sendError(res, 'File must be a video', 400);
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/${file.path.replace(/\\/g, '/')}`;

    const videoInfo = {
      filename: file.filename,
      originalName: file.originalname,
      url: fileUrl,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      mimeType: file.mimetype,
      fileType: 'video',
      uploadPath: file.path.replace(/\\/g, '/'),
      uploadedAt: new Date()
    };

    sendSuccess(res, 'Video uploaded successfully', videoInfo);
  } catch (error) {
    console.error('Error uploading video:', error);
    sendError(res, error.message || 'Failed to upload video', 500);
  }
};

/**
 * Upload document (PDF)
 * POST /api/upload/document
 * @body document - PDF file
 * @returns { filename, url, size, mimeType }
 */
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'No document uploaded', 400);
    }

    const file = req.file;

    // Verify it's a PDF
    if (file.mimetype !== 'application/pdf') {
      return sendError(res, 'File must be a PDF document', 400);
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/${file.path.replace(/\\/g, '/')}`;

    const documentInfo = {
      filename: file.filename,
      originalName: file.originalname,
      url: fileUrl,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      mimeType: file.mimetype,
      fileType: 'document',
      uploadPath: file.path.replace(/\\/g, '/'),
      uploadedAt: new Date()
    };

    sendSuccess(res, 'Document uploaded successfully', documentInfo);
  } catch (error) {
    console.error('Error uploading document:', error);
    sendError(res, error.message || 'Failed to upload document', 500);
  }
};

/**
 * Upload multiple photos
 * POST /api/upload/photos
 * @body photos - Array of photo files (max 5)
 * @returns Array of photo info
 */
exports.uploadPhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No photos uploaded', 400);
    }

    const files = req.files;

    // Verify all files are images
    const invalidFiles = files.filter(file => !file.mimetype.startsWith('image/'));
    if (invalidFiles.length > 0) {
      return sendError(res, 'All files must be images', 400);
    }

    const photosInfo = files.map(file => {
      const fileUrl = `${req.protocol}://${req.get('host')}/${file.path.replace(/\\/g, '/')}`;

      return {
        filename: file.filename,
        originalName: file.originalname,
        url: fileUrl,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        mimeType: file.mimetype,
        fileType: 'photo',
        uploadPath: file.path.replace(/\\/g, '/'),
        uploadedAt: new Date()
      };
    });

    const summary = {
      totalPhotos: photosInfo.length,
      totalSize: photosInfo.reduce((sum, photo) => sum + photo.size, 0),
      totalSizeFormatted: formatFileSize(photosInfo.reduce((sum, photo) => sum + photo.size, 0)),
      photos: photosInfo
    };

    sendSuccess(res, `${photosInfo.length} photo(s) uploaded successfully`, summary);
  } catch (error) {
    console.error('Error uploading photos:', error);
    sendError(res, error.message || 'Failed to upload photos', 500);
  }
};

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
