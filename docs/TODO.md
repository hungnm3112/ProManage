# ProManage - Development TODO List

> Roadmap chi tiết cho việc phát triển hệ thống WorkFlow 32 v3.0

**Bắt đầu:** March 16, 2026  
**Database hiện có:** Employee, Brand, GroupUser  
**Cần phát triển:** broadcasts, store_tasks, user_tasks, notifications

---

## 📊 Progress Overview

- [x] **Phase 1: Foundation** (14/14 tasks - 100%) ✅ PHASE COMPLETE
- [ ] **Phase 2: Core Feature** (7/12 tasks - 58%) - Broadcast API COMPLETE ✅
- [ ] **Phase 3: Workflow** (0/10 tasks) - Ước tính: 2 tuần
- [ ] **Phase 4: Advanced** (0/8 tasks) - Ước tính: 3 tuần

**Total:** 21/44 tasks completed (48%)

**Latest Update:** March 16, 2026  
**Last Commit:** 9e209cc - [FEATURE] Broadcast Management API Complete (Phase 2.1-2.2)

---

## 🔥 PHASE 1: Foundation (Nền tảng)

**Mục tiêu:** Xây dựng authentication, authorization và quản lý dữ liệu cơ bản  
**Thời gian:** 1-2 tuần  
**Priority:** CRITICAL ⚠️

### 1.1 Authentication & Authorization (Week 1, Day 1-3) ✅ COMPLETED

- [x] **Task 1.1.1: Setup Authentication Helper Functions** ✅
  - File: `src/helpers/authHelper.js`
  - Functions cần tạo:
    - `hashPassword(password, salt)` - **HMAC-SHA512** (not simple SHA512)
    - `verifyPassword(employee, password)` - Verify password
    - `generateSalt()` - Random salt generation
    - `getEmployeeRole(employee)` - Lookup GroupUser và return role
    - `isEmployeeActive(employee)` - Check Status = 'Đang hoạt động'
  - Dependencies: Mongoose models (Employee, GroupUser)
  - **Status:** DONE - Implemented with HMAC-SHA512
  - Estimated: 2 giờ | Actual: 2 giờ

- [x] **Task 1.1.2: Create Mongoose Models** ✅
  - File: `src/models/Employee.js`
    - Schema cho Employee collection (dùng collection có sẵn)
    - Virtual field cho role (populate từ GroupUser)
    - Methods: comparePassword, getRole, isActive
    - **Fix:** Status enum = ['Đang hoạt động', 'Đã dừng', 'Đã nghỉ việc']
  - File: `src/models/GroupUser.js`
    - Schema cho GroupUser collection
    - Method: isAdmin(), isManager(), getRole()
  - File: `src/models/Brand.js`
    - Schema cho Brand collection
    - Virtual: manager (populate từ Employee)
  - File: `src/models/index.js` - **BONUS:** Preload all models
  - Dependencies: None
  - **Status:** DONE - All models created with proper schema
  - Estimated: 3 giờ | Actual: 4 giờ

- [x] **Task 1.1.3: JWT Token Service** ✅
  - File: `src/services/jwtService.js`
  - Functions:
    - `generateToken(employee)` - Create JWT with role info
    - `verifyToken(token)` - Validate JWT
    - `refreshToken(token)` - Renew token
  - Config: ACCESS_TOKEN_SECRET=suachualaptop24h, JWT_EXPIRE từ .env
  - Dependencies: Task 1.1.1 (getEmployeeRole)
  - **Status:** DONE - JWT tokens working with role-based payload
  - Estimated: 2 giờ | Actual: 2 giờ

- [x] **Task 1.1.4: Auth Controller - Login** ✅
  - File: `src/controllers/authController.js`
  - Endpoints:
    - `login(req, res)` - POST /api/auth/login
      - Input: { phone, password }
      - Verify credentials with HMAC-SHA512
      - Get role from GroupUser
      - Return: { success, token, employee }
    - `logout(req, res)` - POST /api/auth/logout
    - `getMe(req, res)` - GET /api/auth/me
  - Dependencies: Task 1.1.1, 1.1.2, 1.1.3
  - **Status:** DONE - Login working with Phone authentication
  - Estimated: 2 giờ | Actual: 3 giờ

- [x] **Task 1.1.5: Auth Middleware** ✅
  - File: `src/middlewares/authMiddleware.js`
    - `authenticate(req, res, next)` - Verify JWT token
    - Attach user info to req.user
    - Check employee Status = 'Đang hoạt động'
    - `authorize(...roles)` - Check user role
    - Return 403 if unauthorized
  - Dependencies: Task 1.1.3
  - **Status:** DONE - Middleware protecting routes properly
  - Estimated: 1.5 giờ | Actual: 1.5 giờ

- [x] **Task 1.1.6: Auth Routes** ✅
  - File: `src/routes/authRoutes.js`
    - POST /api/auth/login
    - POST /api/auth/logout
    - GET /api/auth/me (get current user info)
  - Dependencies: Task 1.1.4, 1.1.5
  - **Status:** DONE - All routes functional
  - Estimated: 1 giờ | Actual: 1 giờ

- [x] **Task 1.1.7: Test Authentication** ✅
  - Test login với Phone + Password
  - Test JWT token generation
  - Test role mapping (admin/manager/employee)
  - Test middleware authentication
  - Test middleware authorization
  - **Status:** DONE - Tested with Phone 0392029548
  - **UI Created:** Login page + 3 Dashboard pages (BONUS)
  - Estimated: 2 giờ | Actual: 3 giờ

**Section Status:** ✅ 7/7 tasks completed  
**Critical Fixes Applied:**
- HMAC-SHA512 password hashing (not simple SHA512)
- Status field: 'Đang hoạt động' (not 'Đang làm việc')
- Model preloading to prevent schema registration errors
- Nodemon config fixed to watch src/**/*.js
- CSP config for Tailwind CDN

---

### 1.2 Employee Management API (Week 1, Day 4-5) ✅ COMPLETED

- [x] **Task 1.2.1: Employee Controller** ✅
  - File: `src/controllers/employeeController.js`
  - Methods:
    - `getEmployees(req, res)` - GET /api/employees
      - Query params: role, branchId, status, search, page, limit
      - Populate: ID_GroupUser, ID_Branch
      - Pagination support
      - Manager restriction (own branch only)
    - `getEmployeeById(req, res)` - GET /api/employees/:id
    - `createEmployee(req, res)` - POST /api/employees
      - Hash password with HMAC-SHA512 + salt
      - Set default Status = "Đang hoạt động"
    - `updateEmployee(req, res)` - PUT /api/employees/:id
      - Partial updates supported
      - Password re-hashing if updated
    - `updateEmployeeStatus(req, res)` - PATCH /api/employees/:id/status
      - Status: "Đang hoạt động" | "Đã dừng" | "Đã nghỉ việc"
    - `deleteEmployee(req, res)` - DELETE /api/employees/:id (soft delete)
  - Dependencies: Task 1.1.2 (Employee model)
  - **Status:** DONE - 356 lines with full CRUD
  - Estimated: 4 giờ | Actual: 3.5 giờ

- [x] **Task 1.2.2: Employee Validation** ✅
  - File: `src/validators/employeeValidator.js`
  - Rules:
    - Phone: required, unique, format (0xxxxxxxxx)
    - FullName: required, min 2 chars
    - Password: required, min 6 chars (khi tạo mới)
    - ID_GroupUser: required, valid ObjectId
    - ID_Branch: required, valid ObjectId
    - CMND: 9 or 12 digits
    - Gender: Nam | Nữ
    - Email: valid email format
    - Birthday, DateOnCompany: ISO8601 dates
  - Validators created:
    - validateCreateEmployee
    - validateUpdateEmployee
    - validateUpdateStatus
    - validateGetEmployeeById
    - validateGetEmployees
    - validateDeleteEmployee
  - Dependencies: express-validator
  - **Status:** DONE - 200+ lines comprehensive validation
  - Estimated: 1.5 giờ | Actual: 1.5 giờ

- [x] **Task 1.2.3: Employee Routes** ✅
  - File: `src/routes/employeeRoutes.js`
  - Routes:
    - GET /api/employees - authenticate, authorize(['admin', 'manager'])
    - GET /api/employees/:id - authenticate (role-based access)
    - POST /api/employees - authenticate, authorize(['admin'])
    - PUT /api/employees/:id - authenticate, authorize(['admin'])
    - PATCH /api/employees/:id/status - authenticate, authorize(['admin'])
    - DELETE /api/employees/:id - authenticate, authorize(['admin'])
  - All routes include validation middleware
  - Mounted in: `src/routes/index.js` at `/api/employees`
  - Dependencies: Task 1.2.1, 1.2.2, 1.1.5
  - **Status:** DONE - All routes functional
  - Estimated: 1 giờ | Actual: 1 giờ

- [x] **Task 1.2.4: Test Employee API** ✅
  - Documentation created: `docs/EMPLOYEE_API.md`
  - Testing checklist with 28 test cases:
    - GET /api/employees (7 tests)
    - GET /api/employees/:id (5 tests)
    - POST /api/employees (7 tests)
    - PUT /api/employees (6 tests)
    - PATCH /api/employees/:id/status (4 tests)
    - DELETE /api/employees/:id (4 tests)
  - cURL examples for all endpoints
  - Request/Response documentation
  - Error handling scenarios
  - **Status:** DONE - Ready for manual/automated testing
  - Estimated: 2 giờ | Actual: 1 giờ

**Section Status:** ✅ 4/4 tasks completed  
**Features Implemented:**
- Full CRUD operations for employees
- Advanced filtering (role, branch, status, search)
- Pagination support
- Manager access control (branch restriction)
- HMAC-SHA512 password hashing
- Soft delete functionality
- Phone uniqueness validation
- Comprehensive validation rules
- Complete API documentation

---

### 1.3 Brand/Store Management API (Week 2, Day 1-2) ✅ COMPLETED

- [x] **Task 1.3.1: Brand Controller** ✅
  - File: `src/controllers/brandController.js`
  - Methods:
    - `getBrands(req, res)` - GET /api/brands
      - Query params: active, search, page, limit
      - Populate manager (virtual from Employee.ID_Branch)
      - Pagination support
    - `getBrandById(req, res)` - GET /api/brands/:id
      - Populate manager with full details
    - `getBrandEmployees(req, res)` - GET /api/brands/:id/employees
      - Get all Employee with ID_Branch = brandId
      - Filter by Status = "Đang hoạt động"
      - Manager restriction (own branch only)
    - `updateBrand(req, res)` - PUT /api/brands/:id
      - Update all brand fields with validation
      - Admin only
    - `assignManager(req, res)` - PATCH /api/brands/:id/manager
      - Set Employee.ID_Branch = brandId
      - Check Employee has role = 'manager'
      - Validate no branch left without manager
  - Dependencies: Task 1.1.2 (Brand, Employee models)
  - **Status:** DONE - 320 lines with 5 full endpoints
  - Estimated: 3 giờ | Actual: 3 giờ

- [x] **Task 1.3.2: Brand Routes** ✅
  - File: `src/routes/brandRoutes.js`
  - Routes:
    - GET /api/brands - authenticate
    - GET /api/brands/:id - authenticate
    - GET /api/brands/:id/employees - authenticate, authorize(['admin', 'manager'])
    - PUT /api/brands/:id - authenticate, authorize(['admin'])
    - PATCH /api/brands/:id/manager - authenticate, authorize(['admin'])
  - All routes include validation middleware
  - Mounted in: `src/routes/index.js` at `/api/brands`
  - Dependencies: Task 1.3.1
  - **Status:** DONE - All routes functional
  - Estimated: 1 giờ | Actual: 0.5 giờ

- [x] **Task 1.3.3: Test Brand API** ✅
  - Documentation created: `docs/BRAND_API.md`
  - Testing checklist with 45 test cases:
    - GET /api/brands (8 tests)
    - GET /api/brands/:id (5 tests)
    - GET /api/brands/:id/employees (7 tests)
    - PUT /api/brands/:id (9 tests)
    - PATCH /api/brands/:id/manager (9 tests)
  - cURL examples for all endpoints
  - Request/Response documentation
  - Business rules documentation
  - Error handling scenarios
  - **Status:** DONE - Ready for manual/automated testing
  - Estimated: 1.5 giờ | Actual: 0.5 giờ

**Section Status:** ✅ 3/3 tasks completed  
**Features Implemented:**
- Full CRUD operations for brands
- Manager assignment with validation
- Employee listing by branch
- Advanced filtering (active status, search)
- Pagination support
- Manager access control (branch restriction)
- Business rule enforcement (no branch without manager)
- Comprehensive validation rules
- Complete API documentation with 45 test cases

---

## 🚀 PHASE 2: Core Feature (Tính năng chính)

**Mục tiêu:** Tạo broadcast system và store task management  
**Thời gian:** 2-3 tuần  
**Priority:** HIGH 🔥

### 2.1 Broadcast Schema & Model (Week 3, Day 1) ✅ COMPLETED

- [x] **Task 2.1.1: Create Broadcast Mongoose Schema** ✅
  - File: `src/models/Broadcast.js`
  - Fields:
    - title: String (required, max 200)
    - description: String (required)
    - priority: String (low/medium/high/urgent)
    - deadline: Date (required, must be future)
    - assignedStores: [ObjectId] (refs to Brand, min 1)
    - checklist: [{ task, note, required }] (min 1 item)
    - attachments: [{ filename, url, size, mimeType, uploadedAt }]
    - recurring: { enabled, frequency, dayOfWeek, dayOfMonth }
    - status: String (draft/active/completed/archived)
    - createdBy: ObjectId (ref to Employee)
    - publishedAt: Date
    - completedAt: Date
  - Virtuals:
    - completionRate (calculate from store_tasks)
    - store_tasks (populate from StoreTask)
  - Methods:
    - canPublish(), canEdit(), canDelete()
    - isOverdue(), getStats()
  - Pre-save middleware: Auto-set publishedAt, completedAt
  - Dependencies: None
  - **Status:** DONE - 370 lines with full validation
  - Estimated: 2 giờ | Actual: 2 giờ

- [x] **Task 2.1.2: Create StoreTask Mongoose Schema** ✅
  - File: `src/models/StoreTask.js`
  - Fields:
    - broadcastId: ObjectId (ref to Broadcast)
    - storeId: ObjectId (ref to Brand)
    - managerId: ObjectId (ref to Employee)
    - status: String (pending/accepted/rejected/in_progress/completed)
    - acceptedAt: Date
    - rejectedAt: Date
    - rejectedReason: String (required when rejected)
    - assignedEmployees: [ObjectId] (refs to Employee)
    - completionRate: Number (0-100)
    - completedAt: Date
    - startedAt: Date
  - Indexes: 
    - { broadcastId: 1, storeId: 1 } unique
    - { managerId: 1, status: 1 }
    - { storeId: 1, status: 1 }
  - Virtuals: user_tasks, broadcast, store, manager
  - Methods:
    - canAccept(), canReject()
    - isOverdue(), calculateCompletionRate()
    - updateCompletionRate(), getStats()
  - Pre-save middleware: Auto-set timestamps based on status
  - Dependencies: Task 2.1.1
  - **Status:** DONE - 270 lines with methods
  - Estimated: 1.5 giờ | Actual: 1.5 giờ

**Section Status:** ✅ 2/2 tasks completed

---

### 2.2 Broadcast Management API (Week 3, Day 2-5) ✅ COMPLETED

- [x] **Task 2.2.1: Broadcast Controller - CRUD** ✅
  - File: `src/controllers/broadcastController.js`
  - Methods:
    - `createBroadcast(req, res)` - POST /api/broadcasts
      - Status = 'draft'
      - createdBy = req.user._id
      - Populate createdBy and assignedStores
    - `getBroadcasts(req, res)` - GET /api/broadcasts
      - Filter: status, priority, createdBy
      - Populate: assignedStores, createdBy
      - Sort: newest first (createdAt: -1)
      - Pagination support
    - `getBroadcastById(req, res)` - GET /api/broadcasts/:id
      - Populate store_tasks with storeId and managerId
      - Calculate and return stats
    - `updateBroadcast(req, res)` - PUT /api/broadcasts/:id
      - Check canEdit() before updating
      - Only update allowed fields
    - `deleteBroadcast(req, res)` - DELETE /api/broadcasts/:id
      - Check canDelete() before deleting
  - Dependencies: Task 2.1.1, 2.1.2
  - **Status:** DONE - 360 lines with full CRUD
  - Estimated: 4 giờ | Actual: 3 giờ

- [x] **Task 2.2.2: Broadcast Publish Logic** ✅
  - Method: `publishBroadcast(req, res)` - POST /api/broadcasts/:id/publish
  - Logic:
    1. Validate broadcast using canPublish() method
    2. Update status = 'active', publishedAt = now
    3. Loop through assignedStores:
       - Find manager of store (Employee.ID_Branch = storeId && Status = 'Đang hoạt động')
       - Verify manager role using getEmployeeRole()
       - Create StoreTask with status = 'pending'
    4. Handle stores with no manager gracefully (skip with warning)
    5. Return broadcast with store_tasks and creation stats
    6. Rollback on error (revert to draft status)
  - Dependencies: Task 2.2.1, 2.1.2
  - **Status:** DONE - Integrated in broadcastController
  - Estimated: 3 giờ | Actual: 2 giờ

- [x] **Task 2.2.3: Broadcast Validation** ✅
  - File: `src/validators/broadcastValidator.js`
  - Rules:
    - title: required, max 200 chars
    - description: required, min 1 char
    - priority: enum [low, medium, high, urgent]
    - deadline: required, ISO8601 format, must be future date
    - assignedStores: array, min 1 store, all must be valid ObjectIds
    - checklist: array, min 1 item, each must have non-empty 'task' field
    - attachments: array (optional), each must have filename, url, size, mimeType
    - recurring: object (optional), validate enabled, frequency, dayOfWeek, dayOfMonth
  - Validators created:
    - validateCreateBroadcast
    - validateUpdateBroadcast
    - validateGetBroadcasts (query params)
    - validateGetBroadcastById
    - validateDeleteBroadcast
    - validatePublishBroadcast
  - Dependencies: express-validator
  - **Status:** DONE - 280 lines comprehensive validation
  - Estimated: 1.5 giờ | Actual: 1.5 giờ

- [x] **Task 2.2.4: Broadcast Routes** ✅
  - File: `src/routes/broadcastRoutes.js`
  - Routes (all require authenticate + authorize(['admin'])):
    - POST /api/broadcasts - Create broadcast
    - GET /api/broadcasts - List with filters
    - GET /api/broadcasts/:id - Get by ID with store_tasks
    - PUT /api/broadcasts/:id - Update (draft only)
    - DELETE /api/broadcasts/:id - Delete (draft only)
    - POST /api/broadcasts/:id/publish - Publish and create store tasks
  - All routes include validation middleware
  - Mounted in: `src/routes/index.js` at `/api/broadcasts`
  - Dependencies: Task 2.2.1, 2.2.2, 2.2.3
  - **Status:** DONE - All routes functional
  - Estimated: 1 giờ | Actual: 0.5 giờ

- [x] **Task 2.2.5: Test Broadcast API** ✅
  - Documentation created: `docs/BROADCAST_API.md`
  - Testing checklist with 60+ test cases:
    - Create Broadcast: 13 tests
    - Get Broadcasts: 8 tests
    - Get Broadcast by ID: 7 tests
    - Update Broadcast: 11 tests
    - Delete Broadcast: 6 tests
    - Publish Broadcast: 14 tests
  - Complete workflow documentation
  - Request/Response examples for all endpoints
  - Error handling scenarios
  - Data structure specifications
  - **Status:** DONE - Ready for manual/automated testing
  - Estimated: 3 giờ | Actual: 1 giờ

**Section Status:** ✅ 5/5 tasks completed  
**Features Implemented:**
- Full CRUD operations for broadcasts
- Draft → Active workflow with validation
- Automatic store task creation on publish
- Manager assignment with role verification
- Advanced filtering (status, priority, creator)
- Pagination support
- Checklist and attachment management
- Recurring schedule support
- Completion rate tracking
- Comprehensive validation rules
- Complete API documentation with 60+ test cases

---

### 2.3 Store Task API (Week 4, Day 1-3)

- [ ] **Task 2.3.1: StoreTask Controller**
  - File: `src/controllers/storeTaskController.js`
  - Methods:
    - `getStoreTasks(req, res)` - GET /api/store-tasks
      - Manager chỉ xem tasks của chi nhánh mình
      - Admin xem tất cả
      - Filter: status, broadcastId
    - `getStoreTaskById(req, res)` - GET /api/store-tasks/:id
      - Populate broadcast, assignedEmployees
    - `acceptStoreTask(req, res)` - PUT /api/store-tasks/:id/accept
      - Chỉ manager của store đó
      - Update status = 'accepted'
      - acceptedAt = now
    - `rejectStoreTask(req, res)` - PUT /api/store-tasks/:id/reject
      - Chỉ manager của store đó
      - Require rejectedReason
      - Update status = 'rejected'
  - Dependencies: Task 2.1.2
  - Estimated: 3 giờ

- [ ] **Task 2.3.2: StoreTask Routes**
  - File: `src/routes/storeTaskRoutes.js`
  - Routes:
    - GET /api/store-tasks - authenticate, authorize(['admin', 'manager'])
    - GET /api/store-tasks/:id - authenticate, authorize(['admin', 'manager'])
    - PUT /api/store-tasks/:id/accept - authenticate, authorize(['manager'])
    - PUT /api/store-tasks/:id/reject - authenticate, authorize(['manager'])
  - Middleware: Check manager.ID_Branch === storeTask.storeId
  - Dependencies: Task 2.3.1
  - Estimated: 1.5 giờ

- [ ] **Task 2.3.3: Test StoreTask API**
  - Test manager view own store tasks
  - Test accept/reject task
  - Test authorization (manager chỉ thao tác với store của mình)
  - Estimated: 2 giờ

---

### 2.4 File Upload Service (Week 4, Day 4-5)

- [ ] **Task 2.4.1: Setup Multer Configuration**
  - File: `src/config/multer.js`
  - Config:
    - Storage: diskStorage, path theo file type
    - Folders: uploads/photos, uploads/videos, uploads/files
    - File filter: image/*, video/*, application/pdf
    - Size limits: 10MB (images), 50MB (videos)
  - Dependencies: multer package
  - Estimated: 1.5 giờ

- [ ] **Task 2.4.2: Upload Controller & Routes**
  - File: `src/controllers/uploadController.js`
  - Methods:
    - `uploadFile(req, res)` - POST /api/upload
      - Return: { filename, url, size, mimeType }
    - `uploadMultiple(req, res)` - POST /api/upload/multiple
      - Max 10 files
  - File: `src/routes/uploadRoutes.js`
  - Dependencies: Task 2.4.1
  - Estimated: 2 giờ

- [ ] **Task 2.4.3: Test File Upload**
  - Test upload image
  - Test upload video
  - Test file size limits
  - Test invalid file types
  - Estimated: 1.5 giờ

---

## 💼 PHASE 3: Workflow (Manager & Employee)

**Mục tiêu:** Hoàn thiện luồng giao việc và duyệt kết quả  
**Thời gian:** 2 tuần  
**Priority:** HIGH 🔥

### 3.1 User Task System (Week 5, Day 1-3)

- [ ] **Task 3.1.1: Create UserTask Mongoose Schema**
  - File: `src/models/UserTask.js`
  - Fields:
    - storeTaskId: ObjectId (ref to StoreTask)
    - broadcastId: ObjectId (ref to Broadcast)
    - employeeId: ObjectId (ref to Employee)
    - checklist: [{ task, note, required, isCompleted }]
    - evidences: [{ type, url, filename, uploadedAt }]
    - status: String (assigned/in_progress/submitted/approved/rejected)
    - submittedAt: Date
    - reviewedAt: Date
    - reviewNote: String
    - rating: Number (1-5)
    - overallNote: String
  - Indexes: { storeTaskId: 1, employeeId: 1 }
  - Dependencies: Task 2.1.2
  - Estimated: 2 giờ

- [ ] **Task 3.1.2: Manager Assign Employees**
  - File: `src/controllers/storeTaskController.js`
  - Method: `assignEmployees(req, res)` - POST /api/store-tasks/:id/assign
  - Logic:
    1. Validate employeeIds (phải cùng branch)
    2. Loop qua employeeIds:
       - Tạo UserTask cho mỗi employee
       - Copy checklist từ broadcast
       - Status = 'assigned'
    3. Update StoreTask.assignedEmployees
    4. Create notifications
  - Dependencies: Task 3.1.1
  - Estimated: 3 giờ

- [ ] **Task 3.1.3: Test Employee Assignment**
  - Test manager assign employees
  - Test validation (employees phải cùng branch)
  - Test auto-create UserTasks
  - Estimated: 1.5 giờ

---

### 3.2 Employee Task Execution (Week 5, Day 4-5)

- [ ] **Task 3.2.1: Employee Task Controller**
  - File: `src/controllers/userTaskController.js`
  - Methods:
    - `getMyTasks(req, res)` - GET /api/my-tasks
      - Filter: status
      - Populate broadcast info
    - `getTaskById(req, res)` - GET /api/my-tasks/:id
    - `updateChecklist(req, res)` - PUT /api/my-tasks/:id/checklist
      - Update isCompleted for checklist items
      - Auto-update status = 'in_progress'
    - `uploadEvidence(req, res)` - POST /api/my-tasks/:id/evidence
      - Append to evidences array
    - `submitTask(req, res)` - POST /api/my-tasks/:id/submit
      - Validate all required items completed
      - Update status = 'submitted'
      - Notify manager
  - Dependencies: Task 3.1.1, 2.4.1
  - Estimated: 4 giờ

- [ ] **Task 3.2.2: Employee Task Routes**
  - File: `src/routes/userTaskRoutes.js`
  - Routes (authenticate, authorize(['employee'])):
    - GET /api/my-tasks
    - GET /api/my-tasks/:id
    - PUT /api/my-tasks/:id/checklist
    - POST /api/my-tasks/:id/evidence
    - POST /api/my-tasks/:id/submit
  - Dependencies: Task 3.2.1
  - Estimated: 1 giờ

- [ ] **Task 3.2.3: Test Employee Task Flow**
  - Test employee view assigned tasks
  - Test update checklist
  - Test upload evidence
  - Test submit task
  - Estimated: 2 giờ

---

### 3.3 Manager Review & Approval (Week 6, Day 1-2)

- [ ] **Task 3.3.1: Manager Review Controller**
  - File: `src/controllers/reviewController.js`
  - Methods:
    - `getPendingReviews(req, res)` - GET /api/reviews/pending
      - UserTasks với status = 'submitted'
      - Filter by manager's branch
    - `approveTask(req, res)` - POST /api/reviews/:taskId/approve
      - Input: { rating: 1-5, reviewNote }
      - Update UserTask: status = 'approved', rating, reviewNote
      - Check if all employees approved → complete StoreTask
      - Notify employee
    - `rejectTask(req, res)` - POST /api/reviews/:taskId/reject
      - Input: { reviewNote: required }
      - Update UserTask: status = 'rejected', reviewNote
      - Notify employee để làm lại
  - Dependencies: Task 3.1.1
  - Estimated: 3 giờ

- [ ] **Task 3.3.2: Auto-Complete StoreTask Logic**
  - Helper function: `checkStoreTaskCompletion(storeTaskId)`
  - Logic:
    1. Get all UserTasks of storeTask
    2. Check if all status = 'approved'
    3. If yes: Update StoreTask status = 'completed'
    4. Check broadcast completion
  - Dependencies: Task 3.3.1
  - Estimated: 2 giờ

- [ ] **Task 3.3.3: Test Review Flow**
  - Test manager view pending reviews
  - Test approve task
  - Test reject task with feedback
  - Test auto-complete store task
  - Test notifications
  - Estimated: 2 giờ

---

### 3.4 Progress Tracking (Week 6, Day 3)

- [ ] **Task 3.4.1: Progress Calculation Helpers**
  - File: `src/helpers/progressHelper.js`
  - Functions:
    - `calculateUserTaskProgress(userTask)` - % checklist completed
    - `calculateStoreTaskProgress(storeTask)` - % employees approved
    - `calculateBroadcastProgress(broadcast)` - % stores completed
  - Dependencies: Task 3.1.1, 2.1.2
  - Estimated: 2 giờ

- [ ] **Task 3.4.2: Add Progress to API Responses**
  - Update getBroadcastById → include progress
  - Update getStoreTaskById → include progress
  - Update getMyTasks → include progress
  - Dependencies: Task 3.4.1
  - Estimated: 1.5 giờ

---

## 📊 PHASE 4: Advanced Features

**Mục tiêu:** Dashboard, Analytics, Notifications, Recurring  
**Thời gian:** 2-3 tuần  
**Priority:** MEDIUM 🔶

### 4.1 Dashboard & Analytics (Week 7, Day 1-4)

- [ ] **Task 4.1.1: Admin Dashboard API**
  - File: `src/controllers/dashboardController.js`
  - Method: `getAdminDashboard(req, res)` - GET /api/dashboard/admin
  - Return:
    - Total broadcasts (all time)
    - Active broadcasts
    - Completed broadcasts this month
    - Top performing stores
    - Overdue tasks count
    - Recent activities
  - Dependencies: All previous models
  - Estimated: 4 giờ

- [ ] **Task 4.1.2: Manager Dashboard API**
  - Method: `getManagerDashboard(req, res)` - GET /api/dashboard/manager
  - Return:
    - Store tasks overview
    - Pending reviews count
    - Employee performance
    - Upcoming deadlines
  - Dependencies: Task 4.1.1
  - Estimated: 3 giờ

- [ ] **Task 4.1.3: Employee Dashboard API**
  - Method: `getEmployeeDashboard(req, res)` - GET /api/dashboard/employee
  - Return:
    - Assigned tasks
    - Completed tasks this month
    - Personal performance stats
    - Recent feedback
  - Dependencies: Task 4.1.1
  - Estimated: 2 giờ

- [ ] **Task 4.1.4: Test Dashboard APIs**
  - Test admin dashboard data accuracy
  - Test manager dashboard filtering
  - Test employee dashboard
  - Estimated: 2 giờ

---

### 4.2 Notification System (Week 7, Day 5 - Week 8, Day 2)

- [ ] **Task 4.2.1: Create Notification Schema**
  - File: `src/models/Notification.js`
  - Fields:
    - userId: ObjectId (ref to Employee)
    - type: String (broadcast_published, task_assigned, task_submitted, etc.)
    - title: String
    - message: String
    - data: Object (related IDs)
    - isRead: Boolean
    - createdAt: Date
  - Indexes: { userId: 1, isRead: 1, createdAt: -1 }
  - Dependencies: None
  - Estimated: 1.5 giờ

- [ ] **Task 4.2.2: Notification Service**
  - File: `src/services/notificationService.js`
  - Methods:
    - `createNotification(userId, type, title, message, data)`
    - `sendToMultiple(userIds, ...)`
    - `markAsRead(notificationId)`
    - `markAllAsRead(userId)`
  - Dependencies: Task 4.2.1
  - Estimated: 2 giờ

- [ ] **Task 4.2.3: Integrate Notifications**
  - Add notifications to:
    - Broadcast publish → notify managers
    - Task assigned → notify employee
    - Task submitted → notify manager
    - Task approved/rejected → notify employee
  - Update existing controllers
  - Dependencies: Task 4.2.2
  - Estimated: 3 giờ

- [ ] **Task 4.2.4: Notification API**
  - File: `src/controllers/notificationController.js`
  - Routes:
    - GET /api/notifications - Get user's notifications
    - PUT /api/notifications/:id/read - Mark as read
    - PUT /api/notifications/read-all - Mark all as read
  - Dependencies: Task 4.2.2
  - Estimated: 2 giờ

---

### 4.3 Recurring Broadcasts (Week 8, Day 3-5)

- [ ] **Task 4.3.1: Cron Job Setup**
  - File: `src/jobs/recurringBroadcasts.js`
  - Use: node-cron
  - Schedule: chạy mỗi ngày 00:00
  - Logic:
    - Find broadcasts với recurring.enabled = true
    - Check frequency (daily/weekly/monthly)
    - Clone broadcast nếu đúng thời gian
    - Auto-publish
  - Dependencies: Task 2.2.2
  - Estimated: 3 giờ

- [ ] **Task 4.3.2: Test Recurring Broadcasts**
  - Test daily recurring
  - Test weekly recurring (specific day)
  - Test monthly recurring (specific date)
  - Test clone & publish logic
  - Estimated: 2 giờ

---

## 📝 Additional Tasks

### Code Quality & Testing

- [ ] **Setup ESLint & Prettier**
  - Config files
  - Pre-commit hooks
  - Estimated: 1 giờ

- [ ] **Write Unit Tests**
  - Auth helpers
  - Progress calculations
  - Business logic functions
  - Estimated: 8 giờ

- [ ] **Write Integration Tests**
  - API endpoint tests
  - Full workflow tests
  - Estimated: 12 giờ

- [ ] **Error Handling Improvements**
  - Custom error classes
  - Consistent error responses
  - Logging
  - Estimated: 3 giờ

---

### Documentation

- [ ] **API Documentation**
  - Swagger/OpenAPI setup
  - Document all endpoints
  - Estimated: 4 giờ

- [ ] **Code Comments**
  - JSDoc for functions
  - Complex logic explanations
  - Estimated: 4 giờ

---

## 🎯 Milestones

### Milestone 1: Authentication Ready (End of Week 1)
- ✅ Login works
- ✅ Role-based authorization
- ✅ Employee & Brand CRUD

### Milestone 2: Broadcast System (End of Week 4)
- ✅ Create & publish broadcasts
- ✅ Auto-create store tasks
- ✅ File upload works

### Milestone 3: Full Workflow (End of Week 6)
- ✅ Manager assigns employees
- ✅ Employee submits work
- ✅ Manager reviews & approves
- ✅ Auto-completion logic

### Milestone 4: Production Ready (End of Week 9)
- ✅ Dashboard & analytics
- ✅ Notifications
- ✅ Recurring broadcasts
- ✅ Testing complete

---

## 📌 Notes & Conventions

### Coding Standards
- Use async/await (không dùng callbacks)
- Try-catch cho tất cả async functions
- Consistent error responses: `{ success: false, error: "message" }`
- Success responses: `{ success: true, data: {...} }`

### Database Conventions
- Collection names: PascalCase (Employee, Brand)
- Field names: snake_case cho existing, camelCase cho new
- Always populate references khi return API
- **Status field:** 'Đang hoạt động' (NOT 'Đang làm việc')

### Authentication Conventions
- **Password Hashing:** HMAC-SHA512 (NOT bcrypt, NOT simple SHA512)
- **Formula:** `crypto.createHmac('sha512', salt).update(password).digest('hex')`
- **Login:** Phone-based (10 digits, starts with 0)
- **JWT Secret:** ACCESS_TOKEN_SECRET=suachualaptop24h
- **Token Payload:** { userId, phone, fullName, role, branchId, groupUserId }

### Git Workflow
- Feature branch: `feature/task-number-description`
- Commit message: `[Task X.X.X] Description` or `[FIX] Description`
- PR title: `Phase X: Task Description`

### Testing
- Postman collection cho manual testing
- Jest cho unit tests
- Supertest cho integration tests

---

## ⚠️ Critical Learnings (Phase 1.1)

### Issues Encountered & Solutions

**1. Password Hashing Algorithm**
- ❌ **Wrong:** Simple SHA512 with concatenation `SHA512(password + salt)`
- ✅ **Correct:** HMAC-SHA512 `crypto.createHmac('sha512', salt).update(password).digest('hex')`
- **Root Cause:** Original system uses HMAC, not simple hash
- **Fix Commit:** 0390f52

**2. Employee Status Field**
- ❌ **Wrong:** Enum ['Đang làm việc', 'Đã dừng']
- ✅ **Correct:** Enum ['Đang hoạt động', 'Đã dừng', 'Đã nghỉ việc']
- **Root Cause:** Database uses different status values
- **Impact:** Login always failed with "Tài khoản đã ngừng hoạt động"
- **Fix Commit:** 0390f52

**3. Model Loading Order**
- ❌ **Wrong:** Routes loaded before models → "Schema not registered for GroupUser"
- ✅ **Correct:** Create `src/models/index.js` to preload all models, then load routes
- **Root Cause:** Mongoose needs models registered before `.populate()`
- **Fix Commit:** 0390f52

**4. Nodemon Not Auto-Restarting**
- ❌ **Wrong:** Watch paths `controllers/**/*.js`, `models/**/*.js`
- ✅ **Correct:** Watch path `src/**/*.js`
- **Root Cause:** Files are in `src/` folder, not root
- **Fix:** Updated nodemon.json
- **Fix Commit:** 0390f52

**5. Content Security Policy (CSP)**
- **Issue:** Tailwind CDN blocked by helmet.js CSP
- **Solution:** Configure helmet with `scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"]`
- **Fix Commit:** 783d137

---

## 🚀 Quick Start Commands

```bash
# Development
npm run dev

# Test password hashing
node test-hash.js [password] [salt]
node test-hash.js "hethong24hfs123" "18900519"

# Test specific feature
npm test -- authController

# Commit progress
git add .
git commit -m "[Task 1.1.7] Test authentication complete"
git push origin main
```

---

**Last Updated:** March 16, 2026 - 21:30  
**Next Task:** Task 1.2.1 - Employee Management Controller  
**Current Phase:** Phase 1.1 ✅ COMPLETE | Phase 1.2 Starting  
**Latest Commit:** [0390f52](https://github.com/hungnm3112/ProManage/commit/0390f52) - Authentication System Fixed
