# Employee - API Reference

> Tài liệu API endpoints cho Employee (Nhân viên)

## 🔐 Authentication

Employee API yêu cầu JWT token với `role: "employee"`.

```javascript
headers: {
  'Authorization': 'Bearer <EMPLOYEE_JWT_TOKEN>',
  'Content-Type': 'application/json'
}
```

---

## 📊 Dashboard API

### GET /api/employee/dashboard

Lấy dashboard data

**Response:**
```json
{
  "stats": {
    "newTasks": 3,
    "inProgress": 2,
    "completedThisMonth": 15
  },
  "urgentTasks": [
    {
      "_id": "user_task_001",
      "broadcast": {
        "title": "Kiểm tra hệ thống điện",
        "priority": "urgent",
        "deadline": "2026-03-20T23:59:59Z"
      },
      "progress": 33.33,
      "checklistCompleted": 1,
      "checklistTotal": 3
    }
  ],
  "activeTasks": [...],
  "pendingTasks": [...]
}
```

---

## 📋 Tasks API

### GET /api/employee/tasks

Lấy danh sách tasks

**Query:**
- `status`: "pending", "in_progress", "completed", "approved", "rejected"
- `priority`: "low", "medium", "high", "urgent"

**Response:**
```json
{
  "tasks": [
    {
      "_id": "user_task_001",
      "broadcast": {
        "title": "Kiểm tra hệ thống điện",
        "description": "...",
        "priority": "urgent",
        "deadline": "2026-03-20T23:59:59Z"
      },
      "assignedBy": {
        "name": "Anh Tuấn (TCN)"
      },
      "status": "pending",
      "progress": 0,
      "checklist": [
        {
          "_id": "check_001",
          "task": "Kiểm tra bảng điện chính",
          "note": "Chụp 2 ảnh",
          "required": true,
          "isCompleted": false
        }
      ],
      "attachments": [...]
    }
  ]
}
```

---

### GET /api/employee/tasks/:id

Lấy chi tiết task

**Response:**
```json
{
  "task": {
    "_id": "user_task_001",
    "broadcast": {
      "title": "Kiểm tra hệ thống điện",
      "description": "Kiểm tra toàn bộ...",
      "priority": "urgent",
      "deadline": "2026-03-20T23:59:59Z"
    },
    "assignedBy": {
      "name": "Anh Tuấn (TCN)"
    },
    "status": "in_progress",
    "progress": 33.33,
    "checklist": [
      {
        "_id": "check_001",
        "task": "Kiểm tra bảng điện chính",
        "note": "Chụp 2 ảnh: tổng thể + chi tiết",
        "required": true,
        "isCompleted": true,
        "evidence": {
          "photos": [
            {
              "_id": "photo_001",
              "url": "/uploads/photos/photo_001.jpg",
              "uploadedAt": "2026-03-16T14:25:00Z"
            }
          ],
          "videos": [],
          "note": "Đã kiểm tra xong"
        }
      },
      {
        "_id": "check_002",
        "task": "Kiểm tra ổ cắm",
        "required": true,
        "isCompleted": false
      }
    ],
    "attachments": [
      {
        "_id": "file_001",
        "filename": "huong_dan.pdf",
        "url": "/uploads/files/file_001.pdf"
      }
    ]
  }
}
```

---

## ✅ Checklist API

### POST /api/employee/user-tasks/:taskId/checklist/:checklistId/evidence

Upload evidence (ảnh/video) cho checklist item

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (FormData):**
```javascript
const formData = new FormData();
formData.append('photos', file1);
formData.append('photos', file2);
formData.append('videos', videoFile);
formData.append('note', 'Đã kiểm tra xong, mọi thứ OK');
```

**Response:**
```json
{
  "success": true,
  "checklist": {
    "_id": "check_001",
    "isCompleted": true,
    "evidence": {
      "photos": [
        {
          "_id": "photo_001",
          "url": "/uploads/photos/photo_001.jpg",
          "thumbnailUrl": "/uploads/thumbnails/photo_001.jpg",
          "uploadedAt": "2026-03-16T14:25:00Z",
          "size": 2048000
        }
      ],
      "videos": [
        {
          "_id": "video_001",
          "url": "/uploads/videos/video_001.mp4",
          "thumbnailUrl": "/uploads/thumbnails/video_001.jpg",
          "uploadedAt": "2026-03-16T14:26:00Z",
          "duration": 30,
          "size": 10240000
        }
      ],
      "note": "Đã kiểm tra xong, mọi thứ OK"
    }
  }
}
```

---

### PUT /api/employee/user-tasks/:taskId/checklist/:checklistId/evidence

Cập nhật evidence (khi làm lại hoặc chỉnh sửa)

**Body (FormData):** (same as POST)

**Response:** (same as POST)

---

### DELETE /api/employee/user-tasks/:taskId/checklist/:checklistId/evidence/:evidenceId

Xóa 1 ảnh/video

**Response:**
```json
{
  "success": true,
  "message": "Evidence deleted"
}
```

---

## 📊 Progress API

### PUT /api/employee/user-tasks/:taskId/progress

Cập nhật progress (auto-save khi hoàn thành checklist item)

**Body:**
```json
{
  "checklistItemId": "check_001",
  "isCompleted": true
}
```

**Response:**
```json
{
  "success": true,
  "userTask": {
    "_id": "user_task_001",
    "progress": 33.33,
    "status": "in_progress"
  }
}
```

---

## ✅ Submit API

### POST /api/employee/user-tasks/:taskId/submit

Submit task (hoàn thành toàn bộ)

**Body:**
```json
{
  "overallNote": "Task hoàn thành tốt, mọi thứ OK"
}
```

**Response:**
```json
{
  "success": true,
  "userTask": {
    "_id": "user_task_001",
    "status": "completed",
    "completedAt": "2026-03-16T14:30:00Z",
    "overallNote": "Task hoàn thành tốt"
  }
}
```

**Backend:**
1. Kiểm tra tất cả required checklist items đã hoàn thành
2. Cập nhật status = "completed"
3. Gửi notification cho Manager
4. Thêm vào review queue

---

### POST /api/employee/user-tasks/:taskId/resubmit

Submit lại task sau khi làm lại (revision)

**Body:**
```json
{
  "overallNote": "Đã chỉnh sửa theo yêu cầu"
}
```

**Response:**
```json
{
  "success": true,
  "userTask": {
    "_id": "user_task_001",
    "status": "completed",
    "completedAt": "2026-03-17T10:00:00Z",
    "revisionCount": 1,
    "revisionHistory": [
      {
        "version": 1,
        "rejectedAt": "2026-03-17T09:00:00Z",
        "reason": "Ảnh chưa rõ ràng",
        "resubmittedAt": "2026-03-17T10:00:00Z"
      }
    ]
  }
}
```

---

## 📊 Stats API

### GET /api/employee/stats

Lấy personal stats

**Response:**
```json
{
  "thisMonth": {
    "totalTasks": 18,
    "completedTasks": 15,
    "completionRate": 83.33,
    "onTimeTasks": 14,
    "avgRating": 4.2
  },
  "thisWeek": {
    "completedTasks": 3,
    "avgRating": 4.5
  },
  "streak": {
    "current": 7,
    "longest": 15
  },
  "allTime": {
    "totalTasks": 120,
    "completedTasks": 115,
    "avgRating": 4.3
  }
}
```

---

## 🔔 Notifications API

### GET /api/notifications

Lấy notifications

**Query:**
- `isRead`: true/false
- `limit`: 20

**Response:**
```json
{
  "notifications": [
    {
      "_id": "notif_001",
      "userId": "employee_001",
      "type": "task_assigned",
      "title": "Task mới",
      "message": "Bạn có task mới: Kiểm tra hệ thống điện",
      "data": {
        "taskId": "user_task_001"
      },
      "isRead": false,
      "createdAt": "2026-03-15T10:00:00Z"
    },
    {
      "_id": "notif_002",
      "type": "task_approved",
      "title": "Task được duyệt",
      "message": "Task 'Cập nhật bảng giá' đã được duyệt",
      "data": {
        "taskId": "user_task_002",
        "rating": 5,
        "feedback": "Làm tốt lắm!"
      },
      "isRead": false,
      "createdAt": "2026-03-15T09:00:00Z"
    }
  ]
}
```

---

### PUT /api/notifications/:id/read

Đánh dấu đã đọc

---

### PUT /api/notifications/read-all

Đánh dấu tất cả đã đọc

---

## 📁 File Upload API

### POST /api/upload/photo

Upload ảnh

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (FormData):**
```javascript
formData.append('file', photoFile);
formData.append('type', 'evidence');
```

**Response:**
```json
{
  "success": true,
  "file": {
    "_id": "photo_001",
    "url": "/uploads/photos/photo_001.jpg",
    "thumbnailUrl": "/uploads/thumbnails/photo_001.jpg",
    "size": 2048000,
    "mimeType": "image/jpeg",
    "width": 1920,
    "height": 1080
  }
}
```

**Validation:**
- Max size: 10MB
- Allowed types: jpg, jpeg, png
- Auto compress if > 5MB
- Auto generate thumbnail

---

### POST /api/upload/video

Upload video

**Body (FormData):**
```javascript
formData.append('file', videoFile);
formData.append('type', 'evidence');
```

**Response:**
```json
{
  "success": true,
  "file": {
    "_id": "video_001",
    "url": "/uploads/videos/video_001.mp4",
    "thumbnailUrl": "/uploads/thumbnails/video_001.jpg",
    "size": 10240000,
    "mimeType": "video/mp4",
    "duration": 30
  }
}
```

**Validation:**
- Max size: 50MB
- Max duration: 60s
- Allowed types: mp4, mov
- Auto generate thumbnail (first frame)

---

## 🔒 Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "checklist": "All required items must be completed"
  }
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "You don't have permission to access this task"
}
```

**413 Payload Too Large:**
```json
{
  "success": false,
  "error": "File too large",
  "maxSize": "10MB"
}
```

---

## 🔗 Liên quan

- **Task Completion**: [task-completion.md](task-completion.md)
- **Evidence Submission**: [evidence-submission.md](evidence-submission.md)
- **Dashboard**: [dashboard.md](dashboard.md)
