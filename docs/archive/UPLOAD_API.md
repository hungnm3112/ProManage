# File Upload API

> Complete API documentation for file upload endpoints

**Base URL:** `http://localhost:3000/api/upload`  
**Authentication:** Required (JWT Bearer Token)  
**Authorization:** All authenticated users  
**Created:** March 16, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [File Type Support](#file-type-support)
4. [Size Limits](#size-limits)
5. [Endpoints Overview](#endpoints-overview)
6. [API Reference](#api-reference)
   - [POST /api/upload](#1-upload-single-file)
   - [POST /api/upload/multiple](#2-upload-multiple-files)
   - [POST /api/upload/photo](#3-upload-photo)
   - [POST /api/upload/photos](#4-upload-multiple-photos)
   - [POST /api/upload/video](#5-upload-video)
   - [POST /api/upload/document](#6-upload-document)
7. [Testing Checklist](#testing-checklist)
8. [Error Responses](#error-responses)

---

## Overview

The File Upload API provides endpoints for uploading images, videos, and PDF documents. Files are stored in organized directories and accessible via static URLs.

### Key Features

- Upload single or multiple files
- Support for images, videos, and PDF documents
- Automatic file type detection and organization
- Size validation based on file type
- Unique filename generation to prevent conflicts
- Static file serving for uploaded content

### Storage Structure

```
uploads/
├── photos/     # Images (jpg, png, gif, webp)
├── videos/     # Videos (mp4, avi, mov, wmv, flv, mkv)
└── files/      # Documents (pdf)
```

---

## Authentication

All endpoints require JWT authentication via Bearer token:

```bash
Authorization: Bearer <your-jwt-token>
```

To obtain a token, login via `POST /api/auth/login`.

---

## File Type Support

### Images
- **MIME types:** `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
- **Extensions:** .jpg, .jpeg, .png, .gif, .webp
- **Storage:** `uploads/photos/`
- **Max size:** 10MB

### Videos
- **MIME types:** `video/mp4`, `video/avi`, `video/quicktime`, `video/x-ms-wmv`, `video/x-flv`, `video/x-matroska`
- **Extensions:** .mp4, .avi, .mov, .wmv, .flv, .mkv
- **Storage:** `uploads/videos/`
- **Max size:** 50MB

### Documents
- **MIME types:** `application/pdf`
- **Extensions:** .pdf
- **Storage:** `uploads/files/`
- **Max size:** 5MB

---

## Size Limits

| File Type | Maximum Size |
|-----------|--------------|
| Images | 10 MB |
| Videos | 50 MB |
| Documents (PDF) | 5 MB |

**Note:** These limits are enforced server-side. Files exceeding the limit will be rejected with a 400 error.

---

## Endpoints Overview

| Method | Endpoint | Max Files | File Types | Description |
|--------|----------|-----------|------------|-------------|
| POST | `/api/upload` | 1 | Any supported | Upload single file |
| POST | `/api/upload/multiple` | 10 | Any supported | Upload multiple files |
| POST | `/api/upload/photo` | 1 | Images only | Upload single photo |
| POST | `/api/upload/photos` | 5 | Images only | Upload multiple photos |
| POST | `/api/upload/video` | 1 | Videos only | Upload single video |
| POST | `/api/upload/document` | 1 | PDF only | Upload single document |

---

## API Reference

### 1. Upload Single File

Upload a single file of any supported type.

**Endpoint:** `POST /api/upload`  
**Access:** All authenticated users

#### Request Headers

```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Request Body (Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | File to upload (image, video, or PDF) |

#### Request Example (cURL)

```bash
curl -X POST "http://localhost:3000/api/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/image.jpg"
```

#### Request Example (JavaScript Fetch)

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "filename": "sample_image-1710584520123-987654321.jpg",
    "originalName": "sample image.jpg",
    "url": "http://localhost:3000/uploads/photos/sample_image-1710584520123-987654321.jpg",
    "size": 245678,
    "sizeFormatted": "239.92 KB",
    "mimeType": "image/jpeg",
    "fileType": "photo",
    "uploadPath": "uploads/photos/sample_image-1710584520123-987654321.jpg",
    "uploadedAt": "2026-03-16T12:35:20.123Z"
  }
}
```

---

### 2. Upload Multiple Files

Upload up to 10 files in a single request.

**Endpoint:** `POST /api/upload/multiple`  
**Access:** All authenticated users

#### Request Body (Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| files | File[] | Yes | Array of files (max 10, any supported type) |

#### Request Example (cURL)

```bash
curl -X POST "http://localhost:3000/api/upload/multiple" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.png" \
  -F "files=@/path/to/document.pdf"
```

#### Request Example (JavaScript)

```javascript
const formData = new FormData();
Array.from(fileInput.files).forEach(file => {
  formData.append('files', file);
});

const response = await fetch('http://localhost:3000/api/upload/multiple', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "message": "3 file(s) uploaded successfully",
  "data": {
    "totalFiles": 3,
    "totalSize": 1543210,
    "totalSizeFormatted": "1.47 MB",
    "files": [
      {
        "filename": "image1-1710584520123-111111111.jpg",
        "originalName": "image1.jpg",
        "url": "http://localhost:3000/uploads/photos/image1-1710584520123-111111111.jpg",
        "size": 245678,
        "sizeFormatted": "239.92 KB",
        "mimeType": "image/jpeg",
        "fileType": "photo",
        "uploadPath": "uploads/photos/image1-1710584520123-111111111.jpg",
        "uploadedAt": "2026-03-16T12:35:20.123Z"
      },
      {
        "filename": "image2-1710584520124-222222222.png",
        "originalName": "image2.png",
        "url": "http://localhost:3000/uploads/photos/image2-1710584520124-222222222.png",
        "size": 512345,
        "sizeFormatted": "500.34 KB",
        "mimeType": "image/png",
        "fileType": "photo",
        "uploadPath": "uploads/photos/image2-1710584520124-222222222.png",
        "uploadedAt": "2026-03-16T12:35:20.124Z"
      },
      {
        "filename": "document-1710584520125-333333333.pdf",
        "originalName": "document.pdf",
        "url": "http://localhost:3000/uploads/files/document-1710584520125-333333333.pdf",
        "size": 785187,
        "sizeFormatted": "766.78 KB",
        "mimeType": "application/pdf",
        "fileType": "document",
        "uploadPath": "uploads/files/document-1710584520125-333333333.pdf",
        "uploadedAt": "2026-03-16T12:35:20.125Z"
      }
    ]
  }
}
```

---

### 3. Upload Photo

Upload a single photo (images only).

**Endpoint:** `POST /api/upload/photo`  
**Access:** All authenticated users

#### Request Body (Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| photo | File | Yes | Image file (.jpg, .png, .gif, .webp) |

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/upload/photo" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "photo=@/path/to/photo.jpg"
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "message": "Photo uploaded successfully",
  "data": {
    "filename": "photo-1710584520123-987654321.jpg",
    "originalName": "photo.jpg",
    "url": "http://localhost:3000/uploads/photos/photo-1710584520123-987654321.jpg",
    "size": 245678,
    "sizeFormatted": "239.92 KB",
    "mimeType": "image/jpeg",
    "fileType": "photo",
    "uploadPath": "uploads/photos/photo-1710584520123-987654321.jpg",
    "uploadedAt": "2026-03-16T12:35:20.123Z"
  }
}
```

---

### 4. Upload Multiple Photos

Upload multiple photos (max 5, images only).

**Endpoint:** `POST /api/upload/photos`  
**Access:** All authenticated users

#### Request Body (Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| photos | File[] | Yes | Array of image files (max 5) |

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/upload/photos" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "photos=@/path/to/photo1.jpg" \
  -F "photos=@/path/to/photo2.png"
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "message": "2 photo(s) uploaded successfully",
  "data": {
    "totalPhotos": 2,
    "totalSize": 758023,
    "totalSizeFormatted": "740.26 KB",
    "photos": [
      {
        "filename": "photo1-1710584520123-111111111.jpg",
        "originalName": "photo1.jpg",
        "url": "http://localhost:3000/uploads/photos/photo1-1710584520123-111111111.jpg",
        "size": 245678,
        "sizeFormatted": "239.92 KB",
        "mimeType": "image/jpeg",
        "fileType": "photo",
        "uploadPath": "uploads/photos/photo1-1710584520123-111111111.jpg",
        "uploadedAt": "2026-03-16T12:35:20.123Z"
      },
      {
        "filename": "photo2-1710584520124-222222222.png",
        "originalName": "photo2.png",
        "url": "http://localhost:3000/uploads/photos/photo2-1710584520124-222222222.png",
        "size": 512345,
        "sizeFormatted": "500.34 KB",
        "mimeType": "image/png",
        "fileType": "photo",
        "uploadPath": "uploads/photos/photo2-1710584520124-222222222.png",
        "uploadedAt": "2026-03-16T12:35:20.124Z"
      }
    ]
  }
}
```

---

### 5. Upload Video

Upload a single video.

**Endpoint:** `POST /api/upload/video`  
**Access:** All authenticated users

#### Request Body (Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| video | File | Yes | Video file (.mp4, .avi, .mov, etc.) |

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/upload/video" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "video=@/path/to/video.mp4"
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": {
    "filename": "video-1710584520123-987654321.mp4",
    "originalName": "video.mp4",
    "url": "http://localhost:3000/uploads/videos/video-1710584520123-987654321.mp4",
    "size": 15728640,
    "sizeFormatted": "15 MB",
    "mimeType": "video/mp4",
    "fileType": "video",
    "uploadPath": "uploads/videos/video-1710584520123-987654321.mp4",
    "uploadedAt": "2026-03-16T12:35:20.123Z"
  }
}
```

---

### 6. Upload Document

Upload a PDF document.

**Endpoint:** `POST /api/upload/document`  
**Access:** All authenticated users

#### Request Body (Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| document | File | Yes | PDF file only |

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/upload/document" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@/path/to/document.pdf"
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "filename": "document-1710584520123-987654321.pdf",
    "originalName": "document.pdf",
    "url": "http://localhost:3000/uploads/files/document-1710584520123-987654321.pdf",
    "size": 785187,
    "sizeFormatted": "766.78 KB",
    "mimeType": "application/pdf",
    "fileType": "document",
    "uploadPath": "uploads/files/document-1710584520123-987654321.pdf",
    "uploadedAt": "2026-03-16T12:35:20.123Z"
  }
}
```

---

## Testing Checklist

### POST /api/upload

- [ ] Upload image (.jpg, .png, .gif, .webp)
- [ ] Upload video (.mp4, .avi, .mov)
- [ ] Upload PDF document
- [ ] Verify file is saved in correct directory
- [ ] Verify unique filename generation
- [ ] Verify URL is accessible (can download file)
- [ ] Test file size validation (reject >10MB for images)
- [ ] Test invalid file type (e.g., .exe, .zip)
- [ ] Test without authentication (401)
- [ ] Test without file in request (400)

### POST /api/upload/multiple

- [ ] Upload multiple files (2-5 files)
- [ ] Upload maximum allowed (10 files)
- [ ] Upload mixed types (images + PDF)
- [ ] Verify all files saved correctly
- [ ] Verify totalSize calculation
- [ ] Test exceeding file limit (>10 files, expect 400)
- [ ] Test without authentication (401)
- [ ] Test without files in request (400)

### POST /api/upload/photo

- [ ] Upload valid image (.jpg)
- [ ] Upload valid image (.png)
- [ ] Upload valid image (.gif)
- [ ] Test invalid type (PDF, expect 400)
- [ ] Test size limit (>10MB, expect 400)
- [ ] Test without authentication (401)

### POST /api/upload/photos

- [ ] Upload 2-5 photos
- [ ] Upload maximum allowed (5 photos)
- [ ] Test exceeding limit (>5 photos, expect 400)
- [ ] Test with non-image file (expect 400)
- [ ] Test without authentication (401)

### POST /api/upload/video

- [ ] Upload valid video (.mp4)
- [ ] Upload valid video (.avi)
- [ ] Upload valid video (.mov)
- [ ] Test size limit (>50MB, expect 400)
- [ ] Test invalid type (image, expect 400)
- [ ] Test without authentication (401)

### POST /api/upload/document

- [ ] Upload valid PDF
- [ ] Test invalid type (image, expect 400)
- [ ] Test size limit (>5MB, expect 400)
- [ ] Test without authentication (401)

### Static File Serving

- [ ] Access uploaded file via URL
- [ ] Test 404 for non-existent file
- [ ] Verify correct MIME type headers

---

## Error Responses

### Common HTTP Status Codes

| Status Code | Description | Example |
|-------------|-------------|---------|
| 200 | Success | File uploaded successfully |
| 400 | Bad Request | No file uploaded, invalid file type, size exceeded |
| 401 | Unauthorized | Missing or invalid JWT token |
| 500 | Internal Server Error | Unexpected server error |

### Error Response Format

```json
{
  "success": false,
  "message": "Error description here"
}
```

### Common Error Messages

#### No File Uploaded
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

#### File Type Not Allowed
```json
{
  "success": false,
  "message": "File type not allowed. Only images (jpg, png, gif, webp), videos (mp4, avi, mov, wmv, flv, mkv), and PDF are allowed."
}
```

#### File Size Exceeded
```json
{
  "success": false,
  "message": "File sample.jpg exceeds maximum size of 10MB"
}
```

#### Too Many Files
```json
{
  "success": false,
  "message": "Too many files uploaded"
}
```

#### File Must Be Image
```json
{
  "success": false,
  "message": "File must be an image"
}
```

#### File Must Be Video
```json
{
  "success": false,
  "message": "File must be a video"
}
```

#### File Must Be PDF
```json
{
  "success": false,
  "message": "File must be a PDF document"
}
```

---

## Integration Examples

### Upload Evidence for User Task

When an employee completes a task, they upload photo/video evidence:

```javascript
// Employee submits task with evidence
const formData = new FormData();
formData.append('files', photoFile1);
formData.append('files', photoFile2);
formData.append('files', videoFile);

// 1. Upload files
const uploadResponse = await fetch('http://localhost:3000/api/upload/multiple', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${employeeToken}`
  },
  body: formData
});

const uploadResult = await uploadResponse.json();
const evidenceUrls = uploadResult.data.files.map(file => ({
  type: file.fileType,
  url: file.url,
  filename: file.filename
}));

// 2. Submit user task with evidences
const taskSubmit = await fetch(`http://localhost:3000/api/user-tasks/${taskId}/submit`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${employeeToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    evidences: evidenceUrls,
    overallNote: 'Task completed successfully'
  })
});
```

### Upload Broadcast Attachments

When admin creates a broadcast with attachments:

```javascript
// Upload documents for broadcast
const formData = new FormData();
formData.append('files', pdfFile1);
formData.append('files', imageFile);

const uploadResponse = await fetch('http://localhost:3000/api/upload/multiple', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  },
  body: formData
});

const uploadResult = await uploadResponse.json();
const attachments = uploadResult.data.files.map(file => ({
  filename: file.originalName,
  url: file.url,
  size: file.size
}));

// Create broadcast with attachments
const broadcast = await fetch('http://localhost:3000/api/broadcasts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'New Broadcast',
    description: 'Details...',
    attachments: attachments,
    // ... other fields
  })
});
```

---

## File Naming Convention

Uploaded files are automatically renamed to prevent conflicts:

**Format:** `{sanitizedName}-{timestamp}-{randomNumber}{extension}`

**Example:**
- Original: `my photo (1).jpg`
- Uploaded: `my_photo__1_-1710584520123-987654321.jpg`

**Benefits:**
- Prevents filename conflicts
- Allows tracing upload time
- Sanitizes special characters
- Preserves original extension

---

## Next Steps

1. **Test all endpoints** using the checklist above
2. **Integrate with User Tasks** (Phase 3.2)
   - Employee uploads evidence photos/videos
   - Store evidence URLs in UserTask model
3. **Integrate with Broadcasts** (Optional enhancement)
   - Admin attaches documents to broadcasts
   - Store attachment URLs in Broadcast model
4. **Add file deletion** (Future)
   - DELETE endpoint to remove uploaded files
   - Cleanup orphaned files

---

**Last Updated:** March 16, 2026  
**Version:** 1.0  
**Author:** ProManage Team
