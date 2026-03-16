# Admin - API Reference

> Tài liệu API endpoints cho Admin

## 🔐 Authentication

Tất cả API yêu cầu JWT token trong header:

```javascript
headers: {
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json'
}
```

Admin token có `role: "admin"` trong payload.

---

## 📢 Broadcasts API

### GET /api/broadcasts

Lấy danh sách broadcasts (có phân trang)

**Query Parameters:**
- `page` (number): Trang hiện tại (default: 1)
- `limit` (number): Số items/trang (default: 20)
- `status` (string): "active", "completed", "draft"
- `priority` (string): "low", "medium", "high", "urgent"
- `search` (string): Tìm kiếm theo title

**Response:**
```json
{
  "broadcasts": [
    {
      "_id": "broadcast_001",
      "title": "Kiểm tra hệ thống điện",
      "description": "Kiểm tra toàn bộ...",
      "priority": "urgent",
      "deadline": "2026-03-20T23:59:59Z",
      "assignedStores": ["store_001", "store_002"],
      "totalStores": 32,
      "completedStores": 24,
      "overallProgress": 75,
      "createdBy": "admin_001",
      "createdAt": "2026-03-15T09:00:00Z",
      "status": "active"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

---

### POST /api/broadcasts

Tạo broadcast mới

**Body:**
```json
{
  "title": "Kiểm tra hệ thống điện",
  "description": "Kiểm tra toàn bộ hệ thống điện...",
  "priority": "urgent",
  "deadline": "2026-03-20T23:59:59Z",
  "assignedStores": ["store_001", "store_002"],
  "checklist": [
    {
      "task": "Kiểm tra bảng điện chính",
      "note": "Chụp 2 ảnh: tổng thể + chi tiết",
      "required": true
    }
  ],
  "attachments": ["file_001.pdf"],
  "recurring": {
    "enabled": true,
    "frequency": "weekly",
    "dayOfWeek": 1
  }
}
```

**Response:**
```json
{
  "success": true,
  "broadcast": {
    "_id": "broadcast_new",
    "title": "...",
    "status": "draft"
  }
}
```

---

### PUT /api/broadcasts/:id

Cập nhật broadcast

**Body:** (same as POST)

**Response:**
```json
{
  "success": true,
  "broadcast": { ... }
}
```

---

### POST /api/broadcasts/:id/publish

Publish broadcast (gửi đến stores)

**Response:**
```json
{
  "success": true,
  "tasksCreated": 32,
  "notificationsSent": 32
}
```

---

### DELETE /api/broadcasts/:id

Xóa broadcast (chỉ nếu status = draft)

**Response:**
```json
{
  "success": true,
  "message": "Broadcast deleted"
}
```

---

### GET /api/broadcasts/:id/stats

Lấy stats chi tiết broadcast

**Response:** (xem [analytics.md](analytics.md))

---

## 🏪 Stores API

### GET /api/stores

Lấy danh sách cửa hàng

**Query:**
- `status`: "active", "inactive"
- `search`: Tìm theo tên/code

**Response:**
```json
{
  "stores": [
    {
      "_id": "store_001",
      "code": "CH-A",
      "name": "Chi nhánh Quận 1",
      "address": "123 Nguyễn Huệ, Q1, HCM",
      "managerId": "user_manager_001",
      "managerName": "Nguyễn Văn Tuấn",
      "employeeCount": 10,
      "isActive": true,
      "createdAt": "2026-01-15T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### POST /api/stores

Tạo cửa hàng mới

**Body:**
```json
{
  "code": "CH-E",
  "name": "Chi nhánh Quận 10",
  "address": "456 Lê Hồng Phong, Q10, HCM",
  "phone": "0901234567",
  "managerId": "user_123",
  "notes": "Cửa hàng mới khai trương"
}
```

**Response:**
```json
{
  "success": true,
  "store": { ... }
}
```

---

### PUT /api/stores/:id

Cập nhật cửa hàng

**Body:**
```json
{
  "name": "Chi nhánh Quận 1 - Updated",
  "address": "...",
  "managerId": "user_new_manager",
  "isActive": true
}
```

---

### DELETE /api/stores/:id

Xóa cửa hàng (nếu không có tasks)

---

### GET /api/stores/:id/employees

Lấy nhân viên của cửa hàng

**Response:**
```json
{
  "store": { ... },
  "employees": [
    {
      "_id": "user_001",
      "name": "Nguyễn Văn Tuấn",
      "email": "tuan@example.com",
      "role": "manager",
      "isActive": true
    }
  ]
}
```

---

### POST /api/stores/:storeId/employees

Thêm nhân viên mới vào cửa hàng

**Body:**
```json
{
  "name": "Nguyễn Thị Mai",
  "email": "mai@example.com",
  "phone": "0987654321",
  "role": "employee",
  "password": "123456",
  "sendEmail": true
}
```

---

## 👥 Users API

### GET /api/users

Lấy danh sách users (all)

**Query:**
- `role`: "admin", "manager", "employee"
- `storeId`: Filter by store
- `isActive`: true/false

**Response:**
```json
{
  "users": [
    {
      "_id": "user_001",
      "name": "Nguyễn Văn Tuấn",
      "email": "tuan@example.com",
      "phone": "0901234567",
      "role": "manager",
      "storeId": "store_001",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### POST /api/users

Tạo user mới (bất kỳ role nào)

**Body:**
```json
{
  "name": "Nguyễn Văn A",
  "email": "a@example.com",
  "phone": "0987654321",
  "password": "123456",
  "role": "manager",
  "storeId": "store_001"
}
```

---

### PUT /api/users/:id

Cập nhật user

**Body:**
```json
{
  "name": "...",
  "role": "employee",
  "storeId": "store_002",
  "isActive": false
}
```

---

### DELETE /api/users/:id

Xóa user (soft delete: set isActive = false)

---

### PUT /api/users/:id/reset-password

Reset mật khẩu user

**Body:**
```json
{
  "newPassword": "new_password_123",
  "sendEmail": true
}
```

---

## 📊 Analytics API

### GET /api/admin/dashboard

Dashboard stats

**Response:**
```json
{
  "broadcasts": {
    "total": 50,
    "active": 12,
    "completedThisMonth": 8,
    "draft": 3
  },
  "stores": {
    "total": 32,
    "active": 28,
    "inactive": 4
  },
  "employees": {
    "total": 305,
    "managers": 32,
    "workers": 273
  },
  "completion": {
    "overall": 87.5,
    "thisWeek": 92.3,
    "thisMonth": 85.6
  }
}
```

---

### POST /api/admin/reports/generate

Generate report

**Body:**
```json
{
  "type": "broadcast_summary",
  "dateFrom": "2026-03-01",
  "dateTo": "2026-03-31",
  "filters": {
    "stores": ["store_001"],
    "priority": ["high", "urgent"],
    "status": ["completed"]
  },
  "format": "pdf"
}
```

**Response:**
```json
{
  "success": true,
  "reportUrl": "/downloads/report_202603_12345.pdf",
  "expiresAt": "2026-03-18T23:59:59Z"
}
```

---

## 🔔 Notifications API

### GET /api/notifications

Lấy thông báo

**Query:**
- `isRead`: true/false
- `limit`: 20

**Response:**
```json
{
  "notifications": [
    {
      "_id": "notif_001",
      "userId": "admin_001",
      "type": "broadcast_completed",
      "title": "Broadcast hoàn thành",
      "message": "Kiểm tra hệ thống điện đã hoàn thành",
      "data": {
        "broadcastId": "broadcast_001"
      },
      "isRead": false,
      "createdAt": "2026-03-18T14:30:00Z"
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

### POST /api/upload

Upload file (ảnh, PDF, video)

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (FormData):**
```javascript
const formData = new FormData();
formData.append('file', fileBlob);
formData.append('type', 'broadcast_attachment'); // or 'evidence'
```

**Response:**
```json
{
  "success": true,
  "file": {
    "_id": "file_001",
    "filename": "document.pdf",
    "url": "/uploads/files/file_001.pdf",
    "size": 1024000,
    "mimeType": "application/pdf"
  }
}
```

---

## 🔒 Security

### Rate Limiting

- General APIs: 100 requests/minute
- Upload APIs: 10 requests/minute
- Login: 5 requests/minute

### Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Token invalid or expired"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Admin access required"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "title": "Title is required"
  }
}
```

---

## 🔗 Liên quan

- **Broadcast Management**: [broadcast-management.md](broadcast-management.md)
- **Store Management**: [store-management.md](store-management.md)
- **Analytics**: [analytics.md](analytics.md)
