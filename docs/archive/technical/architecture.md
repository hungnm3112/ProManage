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
│   ├── Branch (HIỆN TẠI - stores, model: Brand)
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

**MVC Architecture** - Model-View-Controller pattern with clear separation of concerns.

```
ProManage/
├── src/                        # Source code (MVC)
│   ├── config/                 # Configuration
│   │   ├── database.js         # MongoDB connection
│   │   └── multer.js           # File upload config (10MB images, 50MB videos)
│   │
│   ├── models/                 # Models - Database schemas (Mongoose)
│   │   ├── index.js            # Model registry (preload to prevent schema errors)
│   │   ├── Employee.js         # Employee model (existing DB collection)
│   │   ├── GroupUser.js        # User roles (admin/manager/employee)
│   │   ├── Brand.js            # Store/Branch model
│   │   ├── Broadcast.js        # Broadcast with recurring support
│   │   ├── StoreTask.js        # Tasks assigned to stores
│   │   ├── UserTask.js         # Tasks assigned to employees
│   │   └── Notification.js     # User notifications
│   │
│   ├── views/                  # Views - EJS templates (MVC Views)
│   │   ├── pages/              # ✅ EJS templates (NO inline CSS/JS)
│   │   │   ├── login.ejs       # Login page → links /css/login.css, /js/login.js
│   │   │   ├── admin/
│   │   │   │   └── dashboard.ejs     # Admin dashboard → links /js/admin-dashboard.js
│   │   │   ├── manager/
│   │   │   │   └── dashboard.ejs     # Manager dashboard → links /js/manager-dashboard.js
│   │   │   └── employee/
│   │   │       └── dashboard.ejs     # Employee dashboard → links /js/employee-dashboard.js
│   │   ├── layouts/            # EJS layouts (future - master templates)
│   │   ├── partials/           # Reusable components (future - header, footer, nav)
│   │   └── errors/             # Error pages (future - 404, 500, etc.)
│   │
│   ├── controllers/            # Controllers - Business logic
│   │   ├── authController.js           # Login, logout, getMe
│   │   ├── employeeController.js       # Employee CRUD
│   │   ├── brandController.js          # Brand/Store CRUD
│   │   ├── broadcastController.js      # Create, publish broadcasts
│   │   ├── storeTaskController.js      # Accept, reject, assign employees
│   │   ├── userTaskController.js       # Employee task execution
│   │   ├── reviewController.js         # Manager approve/reject tasks
│   │   ├── dashboardController.js      # Analytics for all roles
│   │   ├── notificationController.js   # View and manage notifications
│   │   └── uploadController.js         # File upload endpoints
│   │
│   ├── routes/                 # Express routes - API endpoints
│   │   ├── index.js            # Route registry (mounts all routes)
│   │   ├── authRoutes.js       # POST /api/auth/login
│   │   ├── employeeRoutes.js   # /api/employees/*
│   │   ├── brandRoutes.js      # /api/brands/*
│   │   ├── broadcastRoutes.js  # /api/broadcasts/*
│   │   ├── storeTaskRoutes.js  # /api/store-tasks/*
│   │   ├── userTaskRoutes.js   # /api/my-tasks/*
│   │   ├── reviewRoutes.js     # /api/reviews/*
│   │   ├── dashboardRoutes.js  # /api/dashboard/*
│   │   ├── notificationRoutes.js # /api/notifications/*
│   │   └── uploadRoutes.js     # /api/upload/*
│   │
│   ├── middlewares/            # Express middleware
│   │   ├── authMiddleware.js   # authenticate(), authorize(roles)
│   │   ├── errorHandler.js     # Global error handler
│   │   └── logger.js           # Request logging
│   │
│   ├── services/               # Business services (reusable logic)
│   │   ├── notificationService.js  # Create, send notifications
│   │   └── jwtService.js           # Generate, verify JWT tokens
│   │
│   ├── helpers/                # Helper functions
│   │   ├── authHelper.js       # Password hashing (HMAC-SHA512), role checking
│   │   ├── progressHelper.js   # Calculate task completion rates
│   │   └── responseHandler.js  # sendSuccess(), sendError()
│   │
│   ├── validators/             # Input validation (express-validator)
│   │   ├── broadcastValidator.js
│   │   ├── userTaskValidator.js
│   │   └── reviewValidator.js
│   │
│   ├── jobs/                   # Cron jobs
│   │   ├── recurringBroadcasts.js  # Daily cron at 00:00 (Asia/Ho_Chi_Minh)
│   │   └── testRecurring.js        # Manual testing script
│   │
│   └── utils/                  # Utilities
│       └── responseHandler.js  # Standard API responses
│
├── public/                     # ✅ Static assets ONLY (NOT views)
│   ├── css/                    # Stylesheets (separated from templates)
│   │   ├── login.css           # Login page styles (.gradient-bg)
│   │   └── dashboard.css       # Dashboard common styles
│   ├── js/                     # Client-side JavaScript (separated from templates)
│   │   ├── login.js            # Login form logic, authentication
│   │   ├── admin-dashboard.js  # Admin dashboard data loading, rendering
│   │   ├── manager-dashboard.js    # Manager dashboard logic
│   │   └── employee-dashboard.js   # Employee dashboard logic
│   └── images/                 # Static images (logos, icons)
│
├── uploads/                    # User uploaded files (served as static)
│   ├── photos/                 # Evidence photos (max 10MB)
│   ├── videos/                 # Evidence videos (max 50MB)
│   └── documents/              # PDF, Word, Excel files
│
├── docs/                       # Documentation
│   ├── TODO.md                 # Development roadmap (46/46 tasks - 100%)
│   ├── TESTING_GUIDE.md        # Complete testing guide
│   ├── QUICK_REFERENCE.md      # Quick API reference
│   ├── admin/                  # Admin documentation
│   ├── manager/                # Manager documentation
│   ├── employee/               # Employee documentation
│   └── technical/              # Technical documentation
│       ├── architecture.md     # This file
│       ├── database-schema.md  # Database design
│       ├── business-logic.md   # Business rules
│       ├── security.md         # Security practices
│       └── deployment.md       # Deployment guide
│
├── .env                        # Environment variables (PORT=5000, JWT secret, MongoDB URI)
├── .gitignore                  # Git ignore patterns
├── package.json                # Dependencies and scripts
├── nodemon.json                # Nodemon configuration (auto-restart)
├── server.js                   # ✅ Entry point (Express app, routes mounting)
└── README.md                   # Project overview
```

### 🎯 Key Architectural Decisions:

**1. MVC Separation:**
- ✅ **Models** in `src/models/` - Database schemas only
- ✅ **Views** in `src/views/pages/` - HTML templates (NOT in public/)
- ✅ **Controllers** in `src/controllers/` - Business logic

**2. Static vs Dynamic:**
- ✅ `public/` - CSS, JS, Images (static assets)
- ✅ `src/views/pages/` - HTML pages (served via routes)
- ✅ `uploads/` - User-generated content

**3. Routes Structure:**
- All API routes under `/api/*`
- HTML pages served via direct routes (`/login`, `/admin/dashboard`)
- No `.html` extension in URLs

**4. Authentication Flow:**
- HMAC-SHA512 password hashing (NOT simple SHA512)
- JWT tokens with role information
- Middleware-based authorization by role

**5. View Layer Architecture (EJS + Separated Assets):**
- ✅ **EJS Templates** in `src/views/pages/` - Server-rendered HTML
- ✅ **CSS Separation** - All styles in `public/css/` (NO inline `<style>`)
- ✅ **JS Separation** - All client logic in `public/js/` (NO inline `<script>`)
- ✅ **MVC Compliance** - Clean separation of concerns:
  - **Models**: `src/models/` - Data schemas
  - **Views**: `src/views/pages/` - EJS templates (presentation only)
  - **Controllers**: `src/controllers/` - Business logic

**Benefits of Separation:**
```
Before (❌ Anti-pattern):
login.html
  ├── <style>.gradient-bg { ... }</style>     # ❌ Inline CSS
  └── <script>loginForm.submit(...)</script>   # ❌ Inline JS

After (✅ Proper MVC):
login.ejs
  ├── <link rel="stylesheet" href="/css/login.css">    # ✅ Separated CSS
  └── <script src="/js/login.js"></script>              # ✅ Separated JS

public/css/login.css          # ✅ Reusable, cacheable
public/js/login.js            # ✅ Testable, maintainable
```

**Implementation:**
- Server.js: `app.set('view engine', 'ejs')`
- Routes: `res.render('admin/dashboard')` (NOT `res.sendFile(...)`)
- Static middleware: Serves `/css/`, `/js/`, `/images/` from `public/`
- Browser caching: CSS/JS cached by CDN, templates rendered fresh

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
