# Technical - Architecture

> **System Design**: 3-Tier Hierarchical Broadcast System

## 🏗️ Kiến trúc tổng quan

WorkFlow 32 v3.0 sử dụng kiến trúc **3-Tier Hierarchical** với vai trò rõ ràng:

```
┌─────────────────────────────────────────────────┐
│                   ADMIN (Cấp 1)                 │
│              Broadcast Management               │
│   - Tạo và phát sóng broadcasts                │
│   - Theo dõi tiến độ tổng thể                   │
│   - Quản lý stores và users                     │
└─────────────────┬───────────────────────────────┘
                  │ Phát sóng 1→N
                  ↓
┌─────────────────────────────────────────────────┐
│          STORE MANAGER (Cấp 2) x 32            │
│          Task Assignment & Review               │
│   - Nhận broadcasts từ Admin                    │
│   - Giao việc cho nhân viên                     │
│   - **Duyệt kết quả nhân viên** ⭐              │
└─────────────────┬───────────────────────────────┘
                  │ Giao việc 1→M
                  ↓
┌─────────────────────────────────────────────────┐
│           EMPLOYEE (Cấp 3) x 300+              │
│            Task Execution & Report              │
│   - Làm việc theo checklist                     │
│   - Báo cáo bằng ảnh/video/docs                │
│   - Nhận feedback từ Manager                    │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
```
Node.js v18+
├── Express.js v4.18
│   ├── Routing
│   ├── Middleware
│   └── Error handling
├── Mongoose v7.0 (MongoDB ODM)
│   ├── Schema validation
│   ├── Hooks & middleware
│   └── Population
└── Dependencies
    ├── jsonwebtoken (JWT auth)
    ├── bcryptjs (Password hashing)
    ├── multer (File upload)
    ├── express-validator (Input validation)
    ├── cors (Cross-origin)
    ├── helmet (Security headers)
    ├── morgan (Logging)
    └── node-cron (Recurring tasks)
```

### Database
```
MongoDB v6.0+
├── Collections (7):
│   ├── Employee (HIỆN TẠI - users)
│   ├── Brand (HIỆN TẠI - stores)
│   ├── GroupUser (HIỆN TẠI - chức vụ)
│   ├── broadcasts (SẼ PHÁT TRIỂN)
│   ├── store_tasks (SẼ PHÁT TRIỂN)
│   ├── user_tasks (SẼ PHÁT TRIỂN)
│   └── notifications (SẼ PHÁT TRIỂN)
└── Indexes
    ├── Compound indexes
    ├── Text indexes (search)
    └── Geo indexes (future)
```

### Storage
```
File Storage
├── Local (Development)
│   └── uploads/
│       ├── photos/
│       ├── videos/
│       └── documents/
└── Cloud (Production)
    ├── AWS S3 (recommended)
    │   ├── Bucket: promanage-evidence
    │   ├── Regions: ap-southeast-1
    │   └── CDN: CloudFront
    └── Or Cloudinary
        └── Automatic image optimization
```

### Real-time (Future)
```
Socket.io v4.5
├── Namespaces:
│   ├── /admin - Admin notifications
│   ├── /manager - Manager notifications
│   └── /employee - Employee notifications
└── Events:
    ├── broadcast:new
    ├── task:assigned
    ├── task:submitted
    ├── task:reviewed
    └── task:completed
```

### Frontend (Future)
```
React v18 + TypeScript
├── State Management: Zustand/Redux
├── UI Library: Ant Design / MUI
├── Forms: React Hook Form
├── API Client: Axios
├── Real-time: Socket.io-client
└── Mobile: React Native (future)
```

---

## 📊 Data Flow

### 1. Broadcast Creation Flow

```
Admin Dashboard
   ↓ POST /api/broadcasts
Express Route
   ↓
Auth Middleware (JWT verify)
   ↓
Authorize Middleware (role: admin)
   ↓
Validation Middleware (express-validator)
   ↓
Broadcast Controller
   ↓
Business Logic Service
   ├─ Create broadcast document
   ├─ Create store_tasks (1 per store)
   ├─ Create notifications (1 per manager)
   └─ Return broadcast ID
   ↓
MongoDB (Write)
   ↓
Response → Admin
```

### 2. Employee Submission Flow

```
Employee App
   ↓ POST /api/user-tasks/:id/evidence/photos
Express Route
   ↓
Auth Middleware
   ↓
File Upload Middleware (Multer)
   ├─ Validate file type
   ├─ Validate file size
   ├─ Save to uploads/photos/
   └─ Return file path
   ↓
User Task Controller
   ├─ Push file URL to evidence.photos[]
   ├─ Save user_task
   └─ Return updated task
   ↓
MongoDB (Update)
   ↓
Response → Employee

...

Employee submits report
   ↓ POST /api/user-tasks/:id/submit
Express Route
   ↓
User Task Controller
   ├─ Validate evidence requirements
   ├─ Update status → "submitted"
   ├─ Update store_task progress
   ├─ Create notification for manager
   └─ Return success
   ↓
MongoDB (Update)
   ↓
Socket.io emit → Manager (future)
   ↓
Manager Dashboard (Real-time update)
```

### 3. Manager Review Flow

```
Manager Dashboard
   ↓ POST /api/user-tasks/:id/approve
Express Route
   ↓
Auth Middleware
   ↓
Review Controller
   ├─ Update user_task status → "approved"
   ├─ Update store_task.employeesApproved += 1
   ├─ Check if all employees approved
   │  └─ If yes:
   │     ├─ store_task.status → "completed"
   │     ├─ broadcast.completedStores += 1
   │     └─ Notification for Admin
   └─ Notification for Employee
   ↓
MongoDB (Update)
   ↓
Response → Manager
```

---

## 🔐 Security Architecture

### Authentication Flow

```
Login Request
   ↓
POST /api/auth/login { phone, password }
   ↓
Auth Controller
   ├─ Find employee by phone (EmployeeModel)
   ├─ Check Status === 'Đang làm việc'
   ├─ Verify password (SHA-512 + Salt)
   ├─ If valid:
   │  ├─ Get role from ID_GroupUser lookup
   │  ├─ Generate JWT token
   │  │  └─ Payload: { id, phone, role, branchId }
   │  │  └─ Secret: process.env.JWT_SECRET
   │  │  └─ Expires: 7 days
   │  └─ Return { employee, token }
   └─ If invalid: 401 Unauthorized
   ↓
Client stores token
   └─ localStorage.setItem('token', token)
```

### Authorization Flow

```
API Request
   ↓
Header: Authorization: Bearer <token>
   ↓
Auth Middleware
   ├─ Extract token
   ├─ Verify JWT
   ├─ Decode payload → req.user
   └─ If invalid: 401 Unauthorized
   ↓
Authorize Middleware
   ├─ Check req.user.role
   ├─ Match against allowed roles
   │  └─ authorize('admin', 'manager')
   └─ If not allowed: 403 Forbidden
   ↓
Controller
```

### File Upload Security

```
Upload Request
   ↓
Multer Middleware
   ├─ Check file type (fileFilter)
   ├─ Check file size (limits)
   ├─ Generate unique filename
   │  └─ timestamp-random-originalname
   ├─ Save to uploads/
   └─ Attach to req.file
   ↓
Controller
   ├─ Validate ownership (user uploads for their task)
   ├─ Save file path to database
   └─ Return file URL
```

---

## 📁 Folder Structure

```
ProManage/
├── src/
│   ├── config/
│   │   ├── database.js        # MongoDB connection
│   │   ├── multer.js           # File upload config
│   │   └── environment.js      # Env variables
│   │
│   ├── models/                 # Mongoose models
│   │   ├── User.js
│   │   ├── Store.js
│   │   ├── Broadcast.js
│   │   ├── StoreTask.js
│   │   ├── UserTask.js
│   │   └── Notification.js
│   │
│   ├── controllers/            # Business logic
│   │   ├── authController.js
│   │   ├── broadcastController.js
│   │   ├── storeTaskController.js
│   │   ├── userTaskController.js
│   │   ├── reviewController.js
│   │   └── notificationController.js
│   │
│   ├── routes/                 # Express routes
│   │   ├── auth.js
│   │   ├── broadcasts.js
│   │   ├── storeTasks.js
│   │   ├── userTasks.js
│   │   └── notifications.js
│   │
│   ├── middleware/             # Express middleware
│   │   ├── auth.js             # JWT verification
│   │   ├── authorize.js        # Role-based access
│   │   ├── upload.js           # Multer config
│   │   ├── errorHandler.js     # Global error handler
│   │   └── validate.js         # Input validation
│   │
│   ├── services/               # Business services
│   │   ├── broadcastService.js
│   │   ├── notificationService.js
│   │   └── fileService.js
│   │
│   ├── utils/                  # Utilities
│   │   ├── helpers.js
│   │   └── constants.js
│   │
│   └── jobs/                   # Cron jobs
│       └── recurringTasks.js
│
├── uploads/                    # Uploaded files
│   ├── photos/
│   ├── videos/
│   └── documents/
│
├── docs/                       # Documentation
│   ├── admin/
│   ├── manager/
│   ├── employee/
│   └── technical/
│
├── .env                        # Environment variables
├── .gitignore
├── package.json
├── server.js                   # Entry point
└── README.md
```

---

## 🔄 Deployment Architecture

### Development

```
localhost:3000
   ↓
Express Server (Node.js)
   ↓
MongoDB (localhost:27017)
   ↓
File Storage (local uploads/)
```

### Production

```
Client (Browser/Mobile App)
   ↓ HTTPS
Load Balancer (Nginx/AWS ALB)
   ↓
Express Servers (PM2 cluster x4)
   ├─ Instance 1 (port 3001)
   ├─ Instance 2 (port 3002)
   ├─ Instance 3 (port 3003)
   └─ Instance 4 (port 3004)
   ↓
MongoDB Atlas (Replica Set)
   ├─ Primary (ap-southeast-1a)
   ├─ Secondary (ap-southeast-1b)
   └─ Secondary (ap-southeast-1c)
   ↓
File Storage
   ├─ AWS S3 (Evidence files)
   └─ CloudFront CDN (Delivery)
```

---

## 📈 Scalability Considerations

### Horizontal Scaling
- **API Servers**: PM2 cluster mode (4-8 instances)
- **Database**: MongoDB sharding (when > 100GB)
- **File Storage**: CDN distribution (CloudFront)

### Caching Strategy
```
Redis (Future)
├── Session cache (JWT blacklist)
├── API response cache (dashboard stats)
├── File metadata cache
└── Real-time data (Socket.io adapter)
```

### Performance Optimization
- **Database**: Indexes on frequent queries
- **API**: Pagination (limit 20 items/page)
- **Files**: Image compression (80% quality)
- **Network**: Gzip compression

---

## 🔗 Liên quan

- **Database Schema**: [database-schema.md](database-schema.md)
- **Business Logic**: [business-logic.md](business-logic.md)
- **Security**: [security.md](security.md)
- **Deployment**: [deployment.md](deployment.md)
