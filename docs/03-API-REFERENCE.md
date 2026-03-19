# Audit: API Endpoints

**Date:** March 19, 2026  
**Audited by:** AI Assistant  
**Purpose:** Complete inventory of all API endpoints

---

## 📊 OVERVIEW

**Total Endpoints:** 46  
**Route Files:** 12  
**Base Path:** `/api`

**⚠️ CRITICAL:** Employee, Brand, GroupUser collections are **READ-ONLY** (synced from external systems)

### Endpoints by Domain
- Authentication: 3 endpoints
- Employees: 2 endpoints (READ ONLY)
- Brands/Stores: 3 endpoints (READ ONLY)
- Broadcasts: 9 endpoints
- Store Tasks: 5 endpoints
- User Tasks (My Tasks): 5 endpoints
- Reviews: 3 endpoints
- Dashboard: 4 endpoints
- Notifications: 4 endpoints
- Upload: 6 endpoints
- Dev Tools: 2 endpoints

---

## ⛔ READ-ONLY COLLECTIONS

**Date Implemented:** March 19, 2026  
**Files Modified:** employeeController.js, brandController.js, employeeRoutes.js, brandRoutes.js

### External Data Sources

The following collections are **synced from external systems** and are **READ-ONLY** in ProManage:

1. **Employee** (collection: `Employee`)
   - Source: External HR system
   - Access: ✅ Read | ❌ Create | ❌ Update | ❌ Delete
   - Endpoints: 2 GET operations only
   
2. **Brand** (collection: `Branch`)
   - Source: External ERP/Store management system
   - Access: ✅ Read | ❌ Create | ❌ Update | ❌ Delete
   - Endpoints: 3 GET operations only
   
3. **GroupUser** (collection: `GroupUser`)
   - Source: External Permission/Role system
   - Access: ✅ Read (via populate) | ❌ Any CRUD
   - Endpoints: None (accessed via Employee population)

### Writable Collections (ProManage Owns)

- ✅ **Broadcast** - Admin creates task broadcasts
- ✅ **StoreTask** - Auto-created when broadcast published
- ✅ **UserTask** - Created when manager assigns employees
- ✅ **Notification** - System-generated notifications

### Why This Matters

**For AI Code Generation:**
- ❌ Never generate CREATE/UPDATE/DELETE operations for Employee, Brand, GroupUser
- ✅ Only READ operations allowed for external collections
- ✅ Can reference Employee/Brand IDs in ProManage-owned collections
- ✅ Authentication reads Employee data but doesn't modify it

**For API Consumers:**
- Employee/Brand/GroupUser data managed by external systems
- Use ProManage APIs to read and reference this data
- Manage actual Employee/Brand/GroupUser data in source systems

### Removed Endpoints (March 19, 2026)

**Employee (4 endpoints removed):**
- ~~POST /api/employees~~ - createEmployee
- ~~PUT /api/employees/:id~~ - updateEmployee
- ~~PATCH /api/employees/:id/status~~ - updateEmployeeStatus
- ~~DELETE /api/employees/:id~~ - deleteEmployee

**Brand (2 endpoints removed):**
- ~~PUT /api/brands/:id~~ - updateBrand
- ~~PATCH /api/brands/:id/manager~~ - assignManager (would modify Employee.ID_Branch)

---

## 1️⃣ AUTHENTICATION

**Base Path:** `/api/auth`  
**File:** `src/routes/authRoutes.js`  
**Controller:** `src/controllers/authController.js`

### POST /api/auth/login
- **Description:** Login với phone + password
- **Access:** Public
- **Middleware:** None
- **Controller:** `login()`
- **Body:** `{ phone, password }`
- **Response:** `{ token, employee }`

### POST /api/auth/logout
- **Description:** Logout (client xóa token)
- **Access:** Private (authenticated)
- **Middleware:** `authenticate`
- **Controller:** `logout()`

### GET /api/auth/me
- **Description:** Get thông tin user hiện tại
- **Access:** Private (authenticated)
- **Middleware:** `authenticate`
- **Controller:** `getMe()`
- **Response:** Employee info with role

---

## 2️⃣ EMPLOYEES ⛔ READ-ONLY

**Base Path:** `/api/employees`  
**File:** `src/routes/employeeRoutes.js`  
**Controller:** `src/controllers/employeeController.js`  
**Validators:** `src/validators/employeeValidator.js`

**⚠️ CRITICAL:** Employee collection synced from external HR system. **READ ONLY - NO CREATE/UPDATE/DELETE**

### GET /api/employees
- **Description:** Get all employees with filtering
- **Access:** Private (Admin, Manager)
- **Middleware:** `authenticate`, `authorize('admin', 'manager')`
- **Validator:** `validateGetEmployees`
- **Controller:** `getEmployees()`
- **Query Params:** 
  - `search` - Search by name/phone
  - `status` - Filter by status
  - `branchId` - Filter by branch
  - `role` - Filter by role
  - `page`, `limit` - Pagination

### GET /api/employees/:id
- **Description:** Get employee by ID
- **Access:** Private (All authenticated users)
- **Middleware:** `authenticate`
- **Validator:** `validateGetEmployeeById`
- **Controller:** `getEmployeeById()`
- **Params:** `id` - Employee ObjectId

### ❌ REMOVED OPERATIONS (March 19, 2026)

The following endpoints were **removed** because Employee data is managed by external HR system:

- ~~POST /api/employees~~ - createEmployee() - ❌ REMOVED
- ~~PUT /api/employees/:id~~ - updateEmployee() - ❌ REMOVED  
- ~~PATCH /api/employees/:id/status~~ - updateEmployeeStatus() - ❌ REMOVED
- ~~DELETE /api/employees/:id~~ - deleteEmployee() - ❌ REMOVED

**Reason:** Employee collection is synced from external HR system, ProManage can only READ data.

---

## 3️⃣ BRANDS / STORES ⛔ READ-ONLY

**Base Path:** `/api/brands`  
**File:** `src/routes/brandRoutes.js`  
**Controller:** `src/controllers/brandController.js`  
**Validators:** `src/validators/brandValidator.js`

**⚠️ CRITICAL:** Brand (Branch) collection synced from external ERP system. **READ ONLY - NO CREATE/UPDATE/DELETE**

### GET /api/brands
- **Description:** Get all brands with filtering
- **Access:** Private (All authenticated users)
- **Middleware:** `authenticate`
- **Validator:** `validateGetBrands`
- **Controller:** `getBrands()`
- **Query Params:** 
  - `search` - Search by name
  - `active` - Filter by active status
  - `page`, `limit` - Pagination

### GET /api/brands/:id
- **Description:** Get brand by ID
- **Access:** Private (All authenticated users)
- **Middleware:** `authenticate`
- **Validator:** `validateGetBrandById`
- **Controller:** `getBrandById()`
- **Params:** `id` - Brand ObjectId

### GET /api/brands/:id/employees
- **Description:** Get all employees of a brand
- **Access:** Private (Admin, Manager)
- **Middleware:** `authenticate`, `authorize('admin', 'manager')`
- **Validator:** `validateGetBrandEmployees`
- **Controller:** `getBrandEmployees()`
- **Params:** `id` - Brand ObjectId
- **Note:** Manager can only see their own branch employees

### ❌ REMOVED OPERATIONS (March 19, 2026)

The following endpoints were **removed** because Brand data is managed by external ERP system:

- ~~PUT /api/brands/:id~~ - updateBrand() - ❌ REMOVED
- ~~PATCH /api/brands/:id/manager~~ - assignManager() - ❌ REMOVED (would modify Employee.ID_Branch)

**Reason:** Brand collection is synced from external ERP system, ProManage can only READ data.

---

## 4️⃣ BROADCASTS

**Base Path:** `/api/broadcasts`  
**File:** `src/routes/broadcastRoutes.js`  
**Controller:** `src/controllers/broadcastController.js`  
**Validators:** `src/validators/broadcastValidator.js`

### POST /api/broadcasts
- **Description:** Create a new broadcast (draft status)
- **Access:** Private (Admin only)
- **Middleware:** `authenticate`, `authorize('admin')`
- **Validator:** `validateCreateBroadcast`
- **Controller:** `createBroadcast()`
- **Body:**
  - `title` - String (required)
  - `description` - String (required)
  - `priority` - 'low' | 'medium' | 'high' | 'urgent'
  - `deadline` - Date (required)
  - `assignedStores` - Array of Brand IDs (required)
  - `checklist` - Array of checklist items
  - `attachments` - Array of attachment objects
  - `recurring` - Recurring pattern object

### GET /api/broadcasts
- **Description:** Get all broadcasts with filtering
- **Access:** Private (Admin only)
- **Middleware:** `authenticate`, `authorize('admin')`
- **Validator:** `validateGetBroadcasts`
- **Controller:** `getBroadcasts()`
- **Query Params:**
  - `status` - Filter by status
  - `priority` - Filter by priority
  - `search` - Search by title
  - `page`, `limit` - Pagination

### GET /api/broadcasts/:id
- **Description:** Get broadcast by ID with store tasks
- **Access:** Private (Admin only)
- **Middleware:** `authenticate`, `authorize('admin')`
- **Validator:** `validateGetBroadcastById`
- **Controller:** `getBroadcastById()`
- **Params:** `id` - Broadcast ObjectId
- **Response:** Broadcast with populated store tasks

### PUT /api/broadcasts/:id
- **Description:** Update broadcast (only draft status)
- **Access:** Private (Admin only)
- **Middleware:** `authenticate`, `authorize('admin')`
- **Validator:** `validateUpdateBroadcast`
- **Controller:** `updateBroadcast()`
- **Params:** `id` - Broadcast ObjectId
- **Body:** Updated broadcast fields
- **Note:** Can only update draft broadcasts

### DELETE /api/broadcasts/:id
- **Description:** Delete broadcast (only draft status)
- **Access:** Private (Admin only)
- **Middleware:** `authenticate`, `authorize('admin')`
- **Validator:** `validateDeleteBroadcast`
- **Controller:** `deleteBroadcast()`
- **Params:** `id` - Broadcast ObjectId
- **Note:** Can only delete draft broadcasts

### POST /api/broadcasts/:id/publish
- **Description:** Publish broadcast and create store tasks
- **Access:** Private (Admin only)
- **Middleware:** `authenticate`, `authorize('admin')`
- **Validator:** `validatePublishBroadcast`
- **Controller:** `publishBroadcast()`
- **Params:** `id` - Broadcast ObjectId
- **Note:** Creates StoreTask for each assigned store, notifies managers

### POST /api/broadcasts/:id/assign
- **Description:** Assign broadcast to stores or employees
- **Access:** Private (Admin only)
- **Middleware:** `authenticate`, `authorize('admin')`
- **Validator:** `validateAssignBroadcast`
- **Controller:** `assignBroadcast()`
- **Params:** `id` - Broadcast ObjectId
- **Body:** 
  - `storeAssignments` - Array of `{ storeId, employeeIds }`
  - OR `employeeIds` - Array of Employee IDs

### PUT /api/broadcasts/user-tasks/:taskId
- **Description:** Update a user task (admin can edit task details and reassign)
- **Access:** Private (Admin only)
- **Middleware:** `authenticate`, `authorize('admin')`
- **Validator:** `validateUpdateUserTask`
- **Controller:** `updateUserTask()`
- **Params:** `taskId` - UserTask ObjectId
- **Body:** `{ employeeId }` - New employee for reassignment
- **Note:** ⚠️ Uses userTaskId (not storeTaskId) - FIXED March 18, 2026

### DELETE /api/broadcasts/user-tasks/:taskId
- **Description:** Delete a user task (cannot delete completed tasks)
- **Access:** Private (Admin only)
- **Middleware:** `authenticate`, `authorize('admin')`
- **Validator:** `validateDeleteUserTask`
- **Controller:** `deleteUserTask()`
- **Params:** `taskId` - UserTask ObjectId
- **Note:** ⚠️ Uses userTaskId - FIXED March 18, 2026

---

## 5️⃣ STORE TASKS

**Base Path:** `/api/store-tasks`  
**File:** `src/routes/storeTaskRoutes.js`  
**Controller:** `src/controllers/storeTaskController.js`  
**Validators:** `src/validators/storeTaskValidator.js`

### GET /api/store-tasks
- **Description:** Get all store tasks with filtering
- **Access:** Private (Admin, Manager)
- **Middleware:** `authenticate`, `authorize('admin', 'manager')`
- **Validator:** `validateGetStoreTasks`
- **Controller:** `getStoreTasks()`
- **Query Params:**
  - `status` - Filter by status
  - `storeId` - Filter by store
  - `broadcastId` - Filter by broadcast
  - `page`, `limit` - Pagination
- **Note:** Manager can only see their own store's tasks

### GET /api/store-tasks/:id
- **Description:** Get store task by ID
- **Access:** Private (Admin, Manager)
- **Middleware:** `authenticate`, `authorize('admin', 'manager')`
- **Validator:** `validateGetStoreTaskById`
- **Controller:** `getStoreTaskById()`
- **Params:** `id` - StoreTask ObjectId
- **Note:** Manager can only see their own store's tasks

### PUT /api/store-tasks/:id/accept
- **Description:** Accept a store task
- **Access:** Private (Manager only)
- **Middleware:** `authenticate`, `authorize('manager')`
- **Validator:** `validateAcceptStoreTask`
- **Controller:** `acceptStoreTask()`
- **Params:** `id` - StoreTask ObjectId
- **Note:** Only manager of the store can accept

### PUT /api/store-tasks/:id/reject
- **Description:** Reject a store task
- **Access:** Private (Manager only)
- **Middleware:** `authenticate`, `authorize('manager')`
- **Validator:** `validateRejectStoreTask`
- **Controller:** `rejectStoreTask()`
- **Params:** `id` - StoreTask ObjectId
- **Body:** `{ reason }` - Rejection reason (required)
- **Note:** Only manager of the store can reject

### POST /api/store-tasks/:id/assign
- **Description:** Assign employees to a store task
- **Access:** Private (Manager only)
- **Middleware:** `authenticate`, `authorize('manager')`
- **Validator:** `validateAssignEmployees`
- **Controller:** `assignEmployees()`
- **Params:** `id` - StoreTask ObjectId
- **Body:** `{ employeeIds }` - Array of Employee IDs
- **Note:** Creates UserTask for each employee

---

## 6️⃣ USER TASKS (MY TASKS)

**Base Path:** `/api/my-tasks`  
**File:** `src/routes/userTaskRoutes.js`  
**Controller:** `src/controllers/userTaskController.js`  
**Validators:** `src/validators/userTaskValidator.js`

### GET /api/my-tasks
- **Description:** Get all tasks assigned to current employee
- **Access:** Private (Employee)
- **Middleware:** `authenticate`, `authorize('employee')`
- **Validator:** `validateGetMyTasks`
- **Controller:** `getMyTasks()`
- **Query Params:**
  - `status` - Filter by status
  - `page`, `limit` - Pagination

### GET /api/my-tasks/:id
- **Description:** Get task details by ID
- **Access:** Private (Employee)
- **Middleware:** `authenticate`, `authorize('employee')`
- **Validator:** `validateGetTaskById`
- **Controller:** `getTaskById()`
- **Params:** `id` - UserTask ObjectId

### PUT /api/my-tasks/:id/checklist
- **Description:** Update checklist items
- **Access:** Private (Employee)
- **Middleware:** `authenticate`, `authorize('employee')`
- **Validator:** `validateUpdateChecklist`
- **Controller:** `updateChecklist()`
- **Params:** `id` - UserTask ObjectId
- **Body:** `{ checklist }` - Updated checklist array

### POST /api/my-tasks/:id/evidence
- **Description:** Add evidence files to task
- **Access:** Private (Employee)
- **Middleware:** `authenticate`, `authorize('employee')`
- **Validator:** `validateUploadEvidence`
- **Controller:** `uploadEvidence()`
- **Params:** `id` - UserTask ObjectId
- **Body:** `{ evidences }` - Array of evidence objects (url, type, filename)

### POST /api/my-tasks/:id/submit
- **Description:** Submit task for review
- **Access:** Private (Employee)
- **Middleware:** `authenticate`, `authorize('employee')`
- **Validator:** `validateSubmitTask`
- **Controller:** `submitTask()`
- **Params:** `id` - UserTask ObjectId
- **Note:** All required checklist items must be completed

---

## 7️⃣ REVIEWS

**Base Path:** `/api/reviews`  
**File:** `src/routes/reviewRoutes.js`  
**Controller:** `src/controllers/reviewController.js`  
**Validators:** `src/validators/reviewValidator.js`

### GET /api/reviews/pending
- **Description:** Get all pending reviews (submitted user tasks)
- **Access:** Private (Manager)
- **Middleware:** `authenticate`, `authorize('manager')`
- **Validator:** `validateGetPendingReviews`
- **Controller:** `getPendingReviews()`
- **Response:** List of UserTasks with status 'submitted'

### POST /api/reviews/:taskId/approve
- **Description:** Approve an employee task
- **Access:** Private (Manager)
- **Middleware:** `authenticate`, `authorize('manager')`
- **Validator:** `validateApproveTask`
- **Controller:** `approveTask()`
- **Params:** `taskId` - UserTask ObjectId
- **Body:** 
  - `rating` - Number (1-5, optional)
  - `reviewNote` - String (optional)

### POST /api/reviews/:taskId/reject
- **Description:** Reject an employee task
- **Access:** Private (Manager)
- **Middleware:** `authenticate`, `authorize('manager')`
- **Validator:** `validateRejectTask`
- **Controller:** `rejectTask()`
- **Params:** `taskId` - UserTask ObjectId
- **Body:** `{ reason }` - Rejection reason (required)

---

## 8️⃣ DASHBOARD

**Base Path:** `/api/dashboard`  
**File:** `src/routes/dashboardRoutes.js`  
**Controller:** `src/controllers/dashboardController.js`

### GET /api/dashboard/admin
- **Description:** Get admin dashboard data
- **Access:** Private (Admin only)
- **Middleware:** `authenticate`, `authorize('admin')`
- **Controller:** `getAdminDashboard()`
- **Response:**
  - Total broadcasts, tasks, completion rates
  - Tasks by status (pending, in-progress, overdue, completed)
  - Recent activity

### GET /api/dashboard/admin/tasks/:status
- **Description:** Get admin tasks by status
- **Access:** Private (Admin only)
- **Middleware:** `authenticate`, `authorize('admin')`
- **Controller:** `getAdminTasksByStatus()`
- **Params:** `status` - 'completed' | 'overdue' | 'in-progress' | 'pending-confirm'
- **Response:** List of UserTasks with userTaskId and employeeName
- **Note:** ⚠️ Returns userTaskId for reassign/delete - FIXED March 18, 2026

### GET /api/dashboard/manager
- **Description:** Get manager dashboard data
- **Access:** Private (Manager only)
- **Middleware:** `authenticate`, `authorize('manager')`
- **Controller:** `getManagerDashboard()`
- **Response:**
  - Store tasks for manager's branch
  - Employee performance
  - Pending reviews

### GET /api/dashboard/employee
- **Description:** Get employee dashboard data
- **Access:** Private (Employee only)
- **Middleware:** `authenticate`, `authorize('employee')`
- **Controller:** `getEmployeeDashboard()`
- **Response:**
  - My tasks
  - Overdue tasks
  - Completion history

---

## 9️⃣ NOTIFICATIONS

**Base Path:** `/api/notifications`  
**File:** `src/routes/notificationRoutes.js`  
**Controller:** `src/controllers/notificationController.js`

### GET /api/notifications
- **Description:** Get user's notifications with pagination and filters
- **Access:** Private (Authenticated)
- **Middleware:** `authenticate`
- **Controller:** `getNotifications()`
- **Query Params:**
  - `type` - Filter by notification type
  - `isRead` - Filter by read status
  - `page`, `limit` - Pagination

### GET /api/notifications/unread/count
- **Description:** Get unread notification count
- **Access:** Private (Authenticated)
- **Middleware:** `authenticate`
- **Controller:** `getUnreadCount()`
- **Response:** `{ count }`

### PUT /api/notifications/read-all
- **Description:** Mark all notifications as read
- **Access:** Private (Authenticated)
- **Middleware:** `authenticate`
- **Controller:** `markAllAsRead()`

### PUT /api/notifications/:id/read
- **Description:** Mark specific notification as read
- **Access:** Private (Authenticated)
- **Middleware:** `authenticate`
- **Controller:** `markAsRead()`
- **Params:** `id` - Notification ObjectId

---

## 🔟 UPLOAD

**Base Path:** `/api/upload`  
**File:** `src/routes/uploadRoutes.js`  
**Controller:** `src/controllers/uploadController.js`  
**Middleware:** Multer file upload middleware

**File Size Limits:**
- Images: 10MB
- Videos: 50MB
- Documents: 5MB

### POST /api/upload
- **Description:** Upload a single file (any supported type)
- **Access:** Private (Authenticated)
- **Middleware:** `authenticate`, `uploadSingle`, `validateFileSize`
- **Controller:** `uploadFile()`
- **Body:** `file` (multipart/form-data)
- **Response:** `{ url, filename, size, mimeType }`

### POST /api/upload/multiple
- **Description:** Upload multiple files (max 10)
- **Access:** Private (Authenticated)
- **Middleware:** `authenticate`, `uploadMultiple`, `validateFileSize`
- **Controller:** `uploadMultiple()`
- **Body:** `files[]` (multipart/form-data)
- **Response:** Array of file objects

### POST /api/upload/photo
- **Description:** Upload a single photo
- **Access:** Private (Authenticated)
- **Middleware:** `authenticate`, `uploadPhoto`, `validateFileSize`
- **Controller:** `uploadPhoto()`
- **Body:** `photo` (multipart/form-data, image only)

### POST /api/upload/photos
- **Description:** Upload multiple photos (max 5)
- **Access:** Private (Authenticated)
- **Middleware:** `authenticate`, `uploadPhotos`, `validateFileSize`
- **Controller:** `uploadPhotos()`
- **Body:** `photos[]` (multipart/form-data, images only)

### POST /api/upload/video
- **Description:** Upload a single video
- **Access:** Private (Authenticated)
- **Middleware:** `authenticate`, `uploadVideo`, `validateFileSize`
- **Controller:** `uploadVideo()`
- **Body:** `video` (multipart/form-data, video only)

### POST /api/upload/document
- **Description:** Upload a single document (PDF)
- **Access:** Private (Authenticated)
- **Middleware:** `authenticate`, `uploadDocument`, `validateFileSize`
- **Controller:** `uploadDocument()`
- **Body:** `document` (multipart/form-data, PDF only)

---

## 1️⃣1️⃣ DEV TOOLS

**Base Path:** `/api/dev`  
**File:** `src/routes/devRoutes.js`  
**Note:** ⚠️ **ONLY for development - DISABLED in production**

### GET /api/dev/accounts
- **Description:** Get list of all active employees for quick switching
- **Access:** Public (dev only)
- **Controller:** Dev route handler
- **Response:** Accounts grouped by role (admin, manager, employee)
- **Note:** Returns 403 if `NODE_ENV === 'production'`

### POST /api/dev/quick-login
- **Description:** Quick login without password (dev only)
- **Access:** Public (dev only)
- **Controller:** Dev route handler
- **Body:** `{ employeeId }` - Employee ObjectId
- **Response:** `{ token, employee }`
- **Note:** Returns 403 if `NODE_ENV === 'production'`

---

## 📋 ROUTE MOUNTING

**File:** `src/routes/index.js`

```javascript
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/brands', brandRoutes);
router.use('/broadcasts', broadcastRoutes);
router.use('/store-tasks', storeTaskRoutes);
router.use('/my-tasks', userTaskRoutes);
router.use('/reviews', reviewRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);
router.use('/dev', devRoutes);
```

All routes are mounted under `/api` prefix in `server.js`:
```javascript
app.use('/api', routes);
```

---

## ⚠️ ISSUES & NOTES

### Critical Issues

**None currently** - All legacy routes (users, projects, tasks) have been removed.

### Recent Fixes (March 18-19, 2026)

1. **✅ Task Reassignment Bug Fixed**
   - Endpoint: `PUT /api/broadcasts/user-tasks/:taskId`
   - Issue: Dashboard was passing storeTaskId instead of userTaskId
   - Fix: Dashboard API now returns userTaskId field
   - Status: FIXED

2. **✅ Task Deletion Bug Fixed**
   - Endpoint: `DELETE /api/broadcasts/user-tasks/:taskId`
   - Issue: Used wrong ID parameter
   - Fix: Now uses userTaskId from dashboard
   - Status: FIXED

3. **✅ Legacy Routes Removed (March 19, 2026)**
   - Removed: `/api/users`, `/api/projects`, `/api/tasks`
   - Reason: Legacy models deleted, not used in ProManage
   - Files deleted: userRoutes.js, projectRoutes.js, taskRoutes.js

### Access Control Patterns

**Public Routes (1):**
- POST /api/auth/login

**Authenticated Only (15):**
- All auth routes (except login)
- All upload routes
- All notification routes
- Dev tools (dev env only)

**Role-Based Access:**
- **Admin Only (24 endpoints):**
  - All broadcast CRUD operations
  - Employee CRUD (create, update, delete, status)
  - Brand update, manager assignment
  - Admin dashboard
  
- **Manager Only (8 endpoints):**
  - Store task accept/reject/assign
  - Review approve/reject
  - Manager dashboard
  - Pending reviews
  
- **Employee Only (5 endpoints):**
  - My tasks CRUD
  - Checklist update
  - Evidence upload
  - Task submission
  - Employee dashboard

- **Admin + Manager (5 endpoints):**
  - Get employees (filtered by branch for manager)
  - Get brands/employees
  - Get store tasks (filtered for manager)

---

## 📊 ENDPOINT STATISTICS

### By HTTP Method
- **GET:** 18 endpoints (39%)
- **POST:** 16 endpoints (35%)
- **PUT:** 7 endpoints (15%)
- **PATCH:** 3 endpoints (7%)
- **DELETE:** 2 endpoints (4%)

### By Access Level
- **Public:** 1 endpoint (2%)
- **Authenticated:** 15 endpoints (33%)
- **Admin Only:** 18 endpoints (39%)
- **Manager Only:** 8 endpoints (17%)
- **Employee Only:** 5 endpoints (11%)
- **Multi-role:** 3 endpoints (7%)

### By Domain
1. Broadcasts: 9 endpoints (20%)
2. Upload: 6 endpoints (13%)
3. Store Tasks: 5 endpoints (11%)
4. User Tasks: 5 endpoints (11%)
5. Dashboard: 4 endpoints (9%)
6. Notifications: 4 endpoints (9%)
7. Authentication: 3 endpoints (7%)
8. Reviews: 3 endpoints (7%)
9. Brands: 3 endpoints (7%)
10. Employees: 2 endpoints (4%)
11. Dev Tools: 2 endpoints (4%)

### Changes from Initial Audit
- **Removed:** 6 endpoints (Employee CRUD x4, Brand update x2)
- **Reason:** Employee, Brand, GroupUser collections are READ-ONLY (external sync)
- **Total:** 52 → 46 endpoints (-12% reduction)

---

## ✅ CRUD COVERAGE

### Complete CRUD
- ✅ **Broadcasts:** Full CRUD (List, Get, Create, Update, Delete) + Publish/Assign

### Partial CRUD / Read-Only
- ⛔ **Employees:** READ ONLY (List, Get)
  - Reason: **Data synced from external HR system**
  - No CREATE/UPDATE/DELETE allowed in ProManage
  
- ⛔ **Brands:** READ ONLY (List, Get, Get Employees)
  - Reason: **Data synced from external ERP system**
  - No CREATE/UPDATE/DELETE allowed in ProManage
  
- ⛔ **GroupUser:** READ ONLY (no direct endpoints, populate only)
  - Reason: **Data synced from external permission system**
  
- ⚠️ **Store Tasks:** Read only via API
  - Reason: Created automatically when broadcast is published
  
- ⚠️ **User Tasks:** Read + Update (no Create/Delete from employee)
  - Reason: Created by manager assignment, deleted by admin only

### Workflow Operations (Non-CRUD)
- Broadcast: Publish, Assign
- Store Task: Accept, Reject, Assign Employees
- User Task: Update Checklist, Upload Evidence, Submit
- Review: Approve, Reject
- Notification: Mark as Read, Read All

---

## 🔍 MISSING ENDPOINTS (Recommendations)

### Suggested Additions

1. **Brand Management (Admin)**
   - POST /api/brands - Create new brand
   - DELETE /api/brands/:id - Delete brand

2. **Broadcast Templates**
   - GET /api/broadcasts/templates - Get saved templates
   - POST /api/broadcasts/templates - Save as template

3. **Analytics**
   - GET /api/analytics/employee/:id - Employee performance
   - GET /api/analytics/store/:id - Store performance
   - GET /api/analytics/broadcast/:id - Broadcast completion stats

4. **Bulk Operations**
   - POST /api/broadcasts/:id/assign-bulk - Bulk employee assignment
   - PUT /api/my-tasks/bulk-update - Bulk checklist update

5. **Search**
   - GET /api/search?q=query - Global search across entities

---

## 📝 AUDIT NOTES

**Audit Duration:** ~30 minutes  
**Route Files Scanned:** 12  
**Total Endpoints:** 52  
**Authentication:** JWT-based with role authorization  
**Validation:** Express validators on all data-mutating endpoints

**Next Steps:**
1. Test all endpoints for route conflicts
2. Verify authentication/authorization middleware
3. Document request/response schemas
4. Create API integration tests
5. Generate Postman/Swagger documentation

---

**End of API Endpoints Audit**
