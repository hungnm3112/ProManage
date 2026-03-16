# Manager - API Reference

> Tài liệu API endpoints cho Manager (Trưởng chi nhánh)

## 🔐 Authentication

Manager API yêu cầu JWT token với `role: "manager"`.

```javascript
headers: {
  'Authorization': 'Bearer <MANAGER_JWT_TOKEN>',
  'Content-Type': 'application/json'
}
```

---

## 📊 Dashboard API

### GET /api/manager/dashboard

Lấy dashboard stats và data

**Response:**
```json
{
  "stats": {
    "pendingBroadcasts": 3,
    "activeTasks": 5,
    "completedThisMonth": 12,
    "teamMembers": 10
  },
  "pendingBroadcasts": [
    {
      "_id": "broadcast_001",
      "title": "Kiểm tra hệ thống điện",
      "priority": "urgent",
      "deadline": "2026-03-20T23:59:59Z",
      "storeTaskId": "store_task_001"
    }
  ],
  "activeTasks": [
    {
      "_id": "store_task_002",
      "broadcast": {
        "title": "Cập nhật bảng giá"
      },
      "totalAssigned": 10,
      "completed": 6,
      "progress": 60,
      "deadline": "2026-03-22T23:59:59Z"
    }
  ],
  "reviewQueue": [
    {
      "_id": "user_task_101",
      "employee": {
        "name": "Nguyễn Văn A"
      },
      "broadcast": {
        "title": "Kiểm tra hệ thống điện"
      },
      "completedAt": "2026-03-16T14:30:00Z",
      "evidenceCount": {
        "photos": 3,
        "videos": 1
      }
    }
  ]
}
```

---

## 📢 Broadcasts API

### GET /api/manager/broadcasts

Lấy broadcasts assigned cho cửa hàng

**Query:**
- `status`: "pending", "accepted", "rejected", "completed"
- `priority`: "low", "medium", "high", "urgent"

**Response:**
```json
{
  "broadcasts": [
    {
      "_id": "broadcast_001",
      "title": "Kiểm tra hệ thống điện",
      "description": "...",
      "priority": "urgent",
      "deadline": "2026-03-20T23:59:59Z",
      "storeTaskId": "store_task_001",
      "status": "pending",
      "checklist": [...],
      "attachments": [...]
    }
  ]
}
```

---

## 📋 Store Tasks API

### GET /api/manager/store-tasks

Lấy danh sách store tasks (tasks của cửa hàng)

**Query:**
- `status`: "pending", "accepted", "assigned", "completed"

**Response:**
```json
{
  "storeTasks": [
    {
      "_id": "store_task_001",
      "broadcastId": "broadcast_001",
      "broadcast": {
        "title": "Kiểm tra hệ thống điện"
      },
      "storeId": "store_001",
      "status": "assigned",
      "totalAssigned": 7,
      "completed": 4,
      "progress": 57.14,
      "acceptedAt": "2026-03-15T10:00:00Z"
    }
  ]
}
```

---

### POST /api/manager/store-tasks/:id/accept

Chấp nhận broadcast

**Response:**
```json
{
  "success": true,
  "storeTask": {
    "_id": "store_task_001",
    "status": "accepted",
    "acceptedAt": "2026-03-15T10:00:00Z"
  }
}
```

---

### POST /api/manager/store-tasks/:id/reject

Từ chối broadcast

**Body:**
```json
{
  "reason": "deadline_too_tight",
  "note": "Cửa hàng đang thiếu người"
}
```

**Response:**
```json
{
  "success": true,
  "storeTask": {
    "status": "rejected",
    "rejectedAt": "2026-03-15T10:30:00Z",
    "rejectionReason": "deadline_too_tight",
    "rejectionNote": "..."
  }
}
```

---

### POST /api/manager/store-tasks/:id/assign

Phân công task cho nhân viên

**Body:**
```json
{
  "employeeIds": [
    "employee_001",
    "employee_002",
    "employee_003"
  ],
  "note": "Hoàn thành trước 18/03 nhé"
}
```

**Response:**
```json
{
  "success": true,
  "userTasksCreated": 3,
  "notifications": 3
}
```

---

### GET /api/manager/store-tasks/:id/progress

Xem tiến độ task

**Response:**
```json
{
  "storeTask": {
    "_id": "store_task_001",
    "broadcast": {
      "title": "Kiểm tra hệ thống điện",
      "deadline": "2026-03-20T23:59:59Z"
    },
    "totalAssigned": 7,
    "completed": 4,
    "inProgress": 2,
    "pending": 1,
    "progress": 57.14
  },
  "userTasks": [
    {
      "_id": "user_task_001",
      "employee": {
        "_id": "employee_001",
        "name": "Nguyễn Văn A"
      },
      "status": "completed",
      "checklistProgress": 100,
      "completedAt": "2026-03-16T14:30:00Z"
    }
  ]
}
```

---

### POST /api/manager/store-tasks/:id/remind

Nhắc nhở nhân viên chưa hoàn thành

**Body:**
```json
{
  "employeeIds": ["employee_004", "employee_005"],
  "message": "Còn 3 ngày đến deadline!"
}
```

**Response:**
```json
{
  "success": true,
  "notificationsSent": 2
}
```

---

## 👥 User Tasks API (Employee Tasks)

### GET /api/manager/user-tasks

Lấy danh sách user tasks (tasks của nhân viên trong cửa hàng)

**Query:**
- `storeTaskId`: Filter by store task
- `status`: "pending", "in_progress", "completed", "approved", "rejected"
- `employeeId`: Filter by employee

**Response:**
```json
{
  "userTasks": [
    {
      "_id": "user_task_001",
      "employee": {
        "_id": "employee_001",
        "name": "Nguyễn Văn A"
      },
      "broadcast": {
        "title": "Kiểm tra hệ thống điện"
      },
      "status": "completed",
      "completedAt": "2026-03-16T14:30:00Z",
      "checklist": [
        {
          "task": "Kiểm tra bảng điện",
          "isCompleted": true,
          "evidence": {
            "photos": [...]
          }
        }
      ]
    }
  ]
}
```

---

### GET /api/manager/user-tasks/:id

Xem chi tiết user task (để review)

**Response:**
```json
{
  "userTask": {
    "_id": "user_task_001",
    "employee": {
      "name": "Nguyễn Văn A",
      "email": "a@example.com"
    },
    "broadcast": {
      "title": "Kiểm tra hệ thống điện",
      "description": "..."
    },
    "status": "completed",
    "completedAt": "2026-03-16T14:30:00Z",
    "checklist": [
      {
        "task": "Kiểm tra bảng điện chính",
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
          "note": "Đã kiểm tra xong, mọi thứ OK"
        }
      }
    ],
    "overallNote": "Task hoàn thành tốt"
  }
}
```

---

### POST /api/manager/user-tasks/:id/approve

Duyệt task của employee

**Body:**
```json
{
  "feedback": "Làm tốt lắm!",
  "rating": 5
}
```

**Response:**
```json
{
  "success": true,
  "userTask": {
    "_id": "user_task_001",
    "status": "approved",
    "approvedAt": "2026-03-17T09:00:00Z",
    "managerFeedback": "Làm tốt lắm!",
    "rating": 5
  }
}
```

---

### POST /api/manager/user-tasks/:id/reject

Reject task (yêu cầu làm lại)

**Body:**
```json
{
  "reason": "Ảnh chưa rõ ràng",
  "details": "Cần chụp lại ảnh bảng điện, ảnh hiện tại bị mờ"
}
```

**Response:**
```json
{
  "success": true,
  "userTask": {
    "_id": "user_task_001",
    "status": "rejected",
    "rejectedAt": "2026-03-17T09:00:00Z",
    "managerFeedback": "Ảnh chưa rõ ràng",
    "revisionHistory": [
      {
        "version": 1,
        "rejectedAt": "2026-03-17T09:00:00Z",
        "reason": "Ảnh chưa rõ ràng"
      }
    ]
  }
}
```

---

### PUT /api/manager/user-tasks/:id/reassign

Reassign task sang employee khác

**Body:**
```json
{
  "newEmployeeId": "employee_007",
  "reason": "Employee cũ đã nghỉ việc"
}
```

---

## 👥 Team Management API

### GET /api/manager/employees

Lấy danh sách nhân viên trong cửa hàng

**Response:**
```json
{
  "employees": [
    {
      "_id": "employee_001",
      "name": "Nguyễn Văn A",
      "email": "a@example.com",
      "isActive": true,
      "stats": {
        "totalTasks": 20,
        "completedTasks": 19,
        "completionRate": 95,
        "avgCompletionTime": 1.8
      }
    }
  ]
}
```

---

### GET /api/manager/team-performance

Team performance stats

**Response:**
```json
{
  "employees": [
    {
      "_id": "employee_001",
      "name": "Nguyễn Văn A",
      "completionRate": 95,
      "totalTasks": 20,
      "completedTasks": 19,
      "avgCompletionTime": 1.8
    }
  ],
  "average": {
    "completionRate": 86,
    "avgCompletionTime": 2.3
  }
}
```

---

## 📊 Stats API

### GET /api/manager/stats

Overall manager stats

**Response:**
```json
{
  "broadcasts": {
    "pending": 3,
    "active": 5,
    "completed": 12
  },
  "employees": {
    "total": 10,
    "available": 8,
    "busy": 2
  },
  "performance": {
    "avgCompletionTime": 2.5,
    "onTimeRate": 85.5
  }
}
```

---

## 🔔 Notifications API

### GET /api/notifications

Lấy notifications (same as admin)

---

### PUT /api/notifications/:id/read

Đánh dấu đã đọc

---

## 🔒 Error Responses

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Manager access required"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Store task not found"
}
```

---

## 🔗 Liên quan

- **Task Assignment**: [task-assignment.md](task-assignment.md)
- **Employee Review**: [employee-review.md](employee-review.md)
- **Dashboard**: [dashboard.md](dashboard.md)
