# 📋 DANH SÁCH CÔNG VIỆC TÁI CẤU TRÚC PROMANAGE

**Ngày bắt đầu:** March 19, 2026  
**Phương pháp:** Manual, từng bước, review kỹ  
**Test:** Song song trong mỗi phase  
**Thời gian ước tính:** 3-4 giờ (chia nhiều sessions)

---

## 🎯 MỤC TIÊU
- ✅ Tái cấu trúc docs thành Source of Truth
- ✅ Audit code hiện tại để hiểu logic thực tế
- ✅ Xây dựng workflow: Logic MD → Code → Test → Fix
- ✅ Document tất cả APIs với examples
- ✅ Track implementation status & known issues

---

## PHASE 1: AUDIT & INVENTORY (1-2 giờ)

### 📦 Step 1.1: Audit Database Models (30 phút)

**Mục tiêu:** Hiểu rõ database schema thực tế

- [x] 1.1.1 - List tất cả files trong `src/models/`
- [x] 1.1.2 - Đọc từng model file, extract schema definitions
- [x] 1.1.3 - Document fields, types, refs, virtuals, methods
- [x] 1.1.4 - Identify relationships (populate paths)
- [x] 1.1.5 - Note collection names (Employee vs Nhan_vien issues)
- [x] 1.1.6 - Check for inconsistencies (ref names vs model names)
- [x] 1.1.7 - Create diagram: Model relationships
- [x] 1.1.8 - Write `audit/01-DATABASE-MODELS.md`

**Test song song:**
- [x] Verify model names match requires in controllers
- [x] Check database connection code
- [x] Test: Require all models, no errors

**Output:** `audit/01-DATABASE-MODELS.md`

---

### 🔌 Step 1.2: Audit API Endpoints (45 phút)

**Mục tiêu:** Liệt kê toàn bộ API endpoints

- [x] 1.2.1 - Scan `src/routes/` folder
- [X] 1.2.2 - Extract all route definitions:
  - [z] authRoutes.js
  - [z] employeeRoutes.js
  - [z] brandRoutes.js (stores)
  - [Z] broadcastRoutes.js
  - [z] storeTaskRoutes.js
  - [Z] userTaskRoutes.js (my-tasks)
  - [z] dashboardRoutes.js
  - [Z] uploadRoutes.js
  - [Z] notificationRoutes.js (if exists)
- [x] 1.2.3 - For each endpoint, document:
  - HTTP method + path
  - Middleware (auth, authorize)
  - Controller function
  - File location + line number
- [X] 1.2.4 - Group by domain (Auth, Employees, Broadcasts, etc)
- [X] 1.2.5 - Identify duplicate/conflicting routes
- [X] 1.2.6 - Check for missing CRUD operations
- [X] 1.2.7 - Write `audit/02-API-ENDPOINTS-RAW.md`

**Test song song:**
- [X] Check app.js/server.js route mounting
- [x] Verify no route conflicts
- [X] Test: Start server, no route errors

**Output:** `audit/02-API-ENDPOINTS-RAW.md`

---

### 🧠 Step 1.3: Audit Business Logic (60 phút) ✅ COMPLETE

**Mục tiêu:** Hiểu workflows thực tế trong code

- [x] 1.3.1 - Scan all controllers in `src/controllers/`:
  - [x] authController.js
  - [x] employeeController.js
  - [x] brandController.js
  - [x] broadcastController.js
  - [x] storeTaskController.js
  - [x] userTaskController.js (my-tasks)
  - [x] dashboardController.js
  - [x] uploadController.js
  - [x] notificationController.js
  - [x] reviewController.js
- [x] 1.3.2 - For each controller, extract:
  - Function name + purpose
  - Business rules implemented
  - Validation logic
  - Database operations
  - Side effects (notifications, etc)
- [x] 1.3.3 - Map workflows:
  - [x] Auth flow (login → token)
  - [x] Broadcast creation → publish
  - [x] Broadcast assign (2 modes)
  - [x] StoreTask accept → assign
  - [x] UserTask submit → review → approve
  - [x] Task reassignment (recently fixed)
  - [x] Task deletion (recently fixed)
  - [x] Read-only enforcement
- [x] 1.3.4 - Identify state machines (Broadcast, StoreTask, UserTask status flows)
- [x] 1.3.5 - Note inconsistencies between workflows (none found)
- [x] 1.3.6 - Document edge cases & error handling
- [x] 1.3.7 - Write `audit/03-BUSINESS-LOGIC-CURRENT.md`

**Test song song:**
- [x] Verified: Login flow uses HMAC-SHA512
- [x] Verified: Publish creates StoreTasks
- [x] Verified: Assign creates UserTasks
- [x] Verified: Reassign uses userTaskId (bug fixed)
- [x] Verified: Delete uses userTaskId (bug fixed)
- [x] Verified: Read-only collections enforced
- [x] Document all workflows in audit doc

**Output:** `audit/03-BUSINESS-LOGIC-CURRENT.md` ✅

---

### 🐛 Step 1.4: Audit Known Issues (30 phút)

**Mục tiêu:** Document tất cả bugs đã biết

- [x] 1.4.1 - Review recent chat history for bugs fixed
- [x] 1.4.2 - Scan code for TODO comments
- [x] 1.4.3 - Check console.error, console.log statements
- [x] 1.4.4 - Review git commit messages for bug fixes
- [x] 1.4.5 - List bugs đã biết:
  - [x] Reassign task used wrong ID (FIXED March 18)
  - [x] Delete task used wrong ID (FIXED March 18)
  - [x] UserTask ref 'Nhan_vien' (FIXED March 18)
  - [x] Dashboard API missing userTaskId (FIXED March 18)
  - [x] Any other bugs?
- [x] 1.4.6 - Document workarounds currently in place
- [x] 1.4.7 - Write `audit/04-KNOWN-ISSUES-HISTORY.md`

**Test song song:**
- [x] Test fixed bugs to confirm they're fixed
- [x] Try to find new bugs in UI
- [x] Document any new issues found

**Output:** `audit/04-KNOWN-ISSUES-HISTORY.md`

---

### 📊 Step 1.5: Review Audit Results (15 phút)

**Mục tiêu:** Tổng hợp và review audit

- [x] 1.5.1 - Review all 4 audit documents
- [x] 1.5.2 - Identify major discrepancies
- [x] 1.5.3 - Note areas needing immediate attention
- [x] 1.5.4 - Create summary: `audit/00-AUDIT-SUMMARY.md`
- [x] 1.5.5 - Get approval before Phase 2

**Output:** `audit/00-AUDIT-SUMMARY.md` + approval to continue

---

## PHASE 2: CREATE NEW DOCS STRUCTURE (30 phút)

### 🗂️ Step 2.1: Archive Old Docs (10 phút)

**Mục tiêu:** Di chuyển docs cũ vào archive

- [x] 2.1.1 - Create `docs/archive/` folder
- [x] 2.1.2 - Move old files:
  - [x] `mv docs/TODO.md docs/archive/`
  - [x] `mv docs/QUICK_REFERENCE.md docs/archive/`
  - [x] `mv docs/proposals docs/archive/`
  - [x] `mv docs/admin docs/archive/`
  - [x] `mv docs/manager docs/archive/`
  - [x] `mv docs/employee docs/archive/`
  - [x] `mv docs/technical docs/archive/`
  - [x] `mv docs/BROADCAST_API.md docs/archive/`
  - [x] `mv docs/STORETASK_API.md docs/archive/`
  - [x] `mv docs/EMPLOYEE_API.md docs/archive/`
  - [x] `mv docs/BRAND_API.md docs/archive/`
  - [x] `mv docs/UPLOAD_API.md docs/archive/`
  - [x] Keep: README.md, TESTING_GUIDE.md, UI-GUIDELINES.md, DEBUGGING_403.md, ACCOUNT_SWITCHER.md
- [x] 2.1.3 - Git commit archive

**Test:** 
- [x] Verify no broken links in remaining docs

---

### 📁 Step 2.2: Create New Structure (10 phút)

**Mục tiêu:** Tạo docs structure mới

- [x] 2.2.1 - Create new files:
  - [x] `docs/00-README.md`
  - [x] `docs/01-BUSINESS-LOGIC.md`
  - [x] `docs/02-DATABASE-SCHEMA.md`
  - [x] `docs/03-API-REFERENCE.md`
  - [x] `docs/04-IMPLEMENTATION-STATUS.md`
  - [x] `docs/05-KNOWN-ISSUES.md`
  - [x] `docs/06-DEVELOPMENT-WORKFLOW.md`
  - [x] `docs/CHANGELOG.md`
- [x] 2.2.2 - Add headers & basic structure to each
- [x] 2.2.3 - Git commit initial structure

---

### 📝 Step 2.3: Populate Core Files (10 phút)

**Mục tiêu:** Viết nội dung cơ bản

- [x] 2.3.1 - Write `docs/00-README.md`:
  - Navigation to all docs
  - How to use docs
  - Quick start guide
- [x] 2.3.2 - Write `docs/06-DEVELOPMENT-WORKFLOW.md`:
  - Define 6-step workflow (Logic → API → Code → Test → Debug → Update Docs)
  - Rules (never code without MD, etc)
  - Templates for each step
- [x] 2.3.3 - Git commit with descriptive message

**Output:** Clean, navigable docs structure

---

## PHASE 3: DEFINE THE WORKFLOW (30 phút)

### 🔄 Step 3.1: Document Development Workflow (20 phút)

**Mục tiêu:** Define quy trình development rõ ràng

- [ ] 3.1.1 - Write detailed workflow in `docs/06-DEVELOPMENT-WORKFLOW.md`:
  - [ ] **Step 1: Define Logic in MD**
    - Update 01-BUSINESS-LOGIC.md with feature requirements
    - Define expected behavior, validation rules, error cases
    - Review & approve logic before coding
  - [ ] **Step 2: Check API Impact**
    - Update 03-API-REFERENCE.md if new endpoints needed
    - Update 02-DATABASE-SCHEMA.md if schema changes needed
    - Document request/response formats
  - [ ] **Step 3: Implement Code**
    - Read logic from MD files
    - Implement controllers, services, models
    - Follow existing patterns
    - Add comments referencing MD sections
  - [ ] **Step 4: Test in UI**
    - Manual testing in browser
    - Check happy path & edge cases
    - Document test results
  - [ ] **Step 5: Debug Loop (if bugs found)**
    - a) Check: Does code follow MD logic?
      - Yes → MD logic is wrong, update MD
      - No → Code doesn't follow MD, fix code
    - b) List all fixes needed
    - c) Apply fixes
    - d) Return to Step 4
  - [ ] **Step 6: Update Documentation**
    - Mark feature as DONE in 04-IMPLEMENTATION-STATUS.md
    - Update CHANGELOG.md
    - Remove from 05-KNOWN-ISSUES.md if fixing bug
    - Commit with clear message
- [ ] 3.1.2 - Add examples for each step
- [ ] 3.1.3 - Add decision trees (when to update MD vs fix code)
- [ ] 3.1.4 - Add commit message templates

---

### ✅ Step 3.2: Create Workflow Checklist (10 phút)

**Mục tiêu:** Template cho feature mới

- [ ] 3.2.1 - Create `docs/FEATURE-CHECKLIST.md` template
- [ ] 3.2.2 - Checklist for each new feature development
- [ ] 3.2.3 - Example: Adding a new feature walkthrough

**Output:** Clear workflow that AI & developers can follow

---

## PHASE 4: CONSOLIDATE BUSINESS LOGIC (2 giờ)

### 🧩 Step 4.1: Define Core Concepts (30 phút)

**Mục tiêu:** Document core concepts của hệ thống

- [ ] 4.1.1 - Write "Core Concepts" section in `docs/01-BUSINESS-LOGIC.md`:
  - [ ] Task Hierarchy
    - Broadcast (Admin creates)
    - StoreTask (per branch, manager manages)
    - UserTask (per employee, employee executes)
  - [ ] Task States & Transitions
    - Draft → Published → Accepted → In Progress → Submitted → Approved
  - [ ] Role Permissions
    - Admin: full control
    - Manager: branch tasks only
    - Employee: own tasks only
  - [ ] Notification Rules
    - When to send notifications
    - Who receives notifications
  - [ ] ID Types Explained
    - broadcastId (Broadcast document ID)
    - storeTaskId (StoreTask document ID)
    - userTaskId (UserTask document ID)
    - Why multiple IDs exist and when to use which
- [ ] 4.1.2 - Create state diagrams (ASCII or Mermaid)
- [ ] 4.1.3 - Document validation rules across system
- [ ] 4.1.4 - Explain authentication & authorization

**Test:**
- [ ] Verify concepts match code reality (from audit)
- [ ] Get confirmation concepts are correct

---

### 📝 Step 4.2: Document Workflows (90 phút)

**Mục tiêu:** Document tất cả workflows chi tiết

- [ ] 4.2.1 - **Workflow 1: Authentication & Authorization**
  - Login process (Phone + Password)
  - Password hashing (HMAC-SHA512 + Salt)
  - JWT token generation
  - Role mapping (GroupUser → admin/manager/employee)
  - Token validation
  
- [ ] 4.2.2 - **Workflow 2: Broadcast Management**
  - Create broadcast (draft status)
  - Edit broadcast (draft only)
  - Publish broadcast
    - Validation: must be draft, must select stores
    - Creates StoreTask for each selected store
    - Finds manager for each store
    - Sends notifications to managers
    - Changes broadcast status to 'published'
  - Recurring broadcasts (weekly/monthly patterns)
  - Delete broadcast (draft only)
  
- [ ] 4.2.3 - **Workflow 3: Store Task Management**
  - Manager receives notification
  - View store task details
  - Accept task
    - Validation: must be manager of that store
    - Changes status to 'accepted'
    - Records acceptedAt timestamp
  - Reject task
    - Requires rejection reason
    - Changes status to 'rejected'
    - Notifies admin
  - Assign employees
    - Select employees from branch
    - Creates UserTask for each employee
    - Sends notifications to employees
    - Changes StoreTask status to 'in_progress'
    
- [ ] 4.2.4 - **Workflow 4: User Task Management**
  - Employee receives notification
  - View task details (checklist, deadline, etc)
  - Update checklist items
    - Mark as completed
    - Cannot mark required items as optional
  - Upload evidence (photos/videos)
    - Stores file URLs
  - Submit for review
    - Validation: all required checklist items must be done
    - Changes status to 'pending_review'
    - Notifies manager
    
- [ ] 4.2.5 - **Workflow 5: Review & Approval**
  - Manager receives review notification
  - View submission (checklist + evidence)
  - Approve task
    - Changes status to 'approved'
    - Records completedAt timestamp
    - Updates StoreTask completion rate
    - Notifies employee
  - Reject submission
    - Requires rejection reason
    - Changes status back to 'in_progress'
    - Notifies employee to redo
    
- [ ] 4.2.6 - **Workflow 6: Task Reassignment** ⚠️
  - Current implementation (FIXED March 18, 2026)
  - Admin only feature
  - Uses UserTask ID (not StoreTask ID)
  - Process:
    - Find existing UserTask by userTaskId
    - Update employeeId to new employee
    - If new employee in different branch:
      - Find/create StoreTask for new branch
      - Update userTask.storeTaskId
      - Remove from old StoreTask.assignedEmployees
      - Add to new StoreTask.assignedEmployees
    - Does NOT create new UserTask - updates existing one
  - Validation:
    - Task must not be completed
    - New employee must be active
    - New employee cannot already have this task
    
- [ ] 4.2.7 - **Workflow 7: Task Deletion** ⚠️
  - Current implementation (FIXED March 18, 2026)
  - Admin only feature
  - Uses UserTask ID (not StoreTask ID)
  - Validation:
    - Task must have userTaskId (must be assigned)
    - Task must not be completed
  - Process:
    - Delete UserTask document
    - Remove from StoreTask.assignedEmployees
    - Update StoreTask completion rate
    
- [ ] 4.2.8 - **Workflow 8: Dashboard Analytics**
  - Admin dashboard
    - Total broadcasts, tasks, completion rates
    - Tasks by status (pending, in-progress, overdue, completed)
    - Task list with userTaskId and employeeName (FIXED March 18)
  - Manager dashboard
    - Store tasks for manager's branch
    - Employee performance
    - Pending reviews
  - Employee dashboard
    - My tasks
    - Overdue tasks
    - Completion history

**For each workflow, document:**
- **Who:** Who can perform this action (role)
- **Prerequisites:** What must be true before starting
- **Steps:** Detailed step-by-step logic
- **Validation:** All validation rules
- **State Changes:** What DB changes happen
- **Side Effects:** Notifications, cascading updates
- **Error Cases:** What can go wrong and how to handle
- **Current Status:** ✅ Working | ⚠️ Buggy | 🚧 In Progress | 📋 Planned

**Test song song:**
- [ ] Test each workflow in UI as documented
- [ ] Document actual behavior vs expected
- [ ] Note any discrepancies between MD and reality

**Output:** Comprehensive `docs/01-BUSINESS-LOGIC.md` (Source of Truth)

---

## PHASE 5: CONSOLIDATE API REFERENCE (1.5 giờ)

**Mục tiêu:** Document tất cả API endpoints với examples

**Template for each endpoint:**
```markdown
### [METHOD] /api/path/:param

**Auth:** admin | manager | employee | public

**Description:** What this endpoint does

**Request:**
- Headers: Authorization, Content-Type
- Params: :id (ObjectId)
- Query: ?page=1&limit=10
- Body:
```json
{
  "field": "value"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

**Response (Error 400/404/500):**
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["validation error 1"]
}
```

**Business Logic:** Link to section in 01-BUSINESS-LOGIC.md

**Validation Rules:**
- Field X is required
- Field Y must be unique
- etc

**Implementation:**
- File: `src/controllers/xxxController.js`
- Function: `functionName()`
- Line: ~123-145

**Test Example:**
```bash
curl -X POST http://localhost:5000/api/path \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'
```
```

---

### 📡 Step 5.1: Document Authentication APIs (15 phút)

- [ ] 5.1.1 - POST /api/auth/login
- [ ] 5.1.2 - POST /api/auth/logout
- [ ] 5.1.3 - GET /api/auth/me

**Test:** Test with curl/Postman, verify examples work

---

### 👥 Step 5.2: Document Employee APIs (20 phút)

- [ ] 5.2.1 - GET /api/employees
- [ ] 5.2.2 - GET /api/employees/:id
- [ ] 5.2.3 - POST /api/employees
- [ ] 5.2.4 - PUT /api/employees/:id
- [ ] 5.2.5 - PATCH /api/employees/:id/status
- [ ] 5.2.6 - DELETE /api/employees/:id

**Test:** Test each endpoint, verify permissions

---

### 🏪 Step 5.3: Document Brand/Store APIs (15 phút)

- [ ] 5.3.1 - GET /api/brands
- [ ] 5.3.2 - GET /api/brands/:id
- [ ] 5.3.3 - POST /api/brands
- [ ] 5.3.4 - PUT /api/brands/:id
- [ ] 5.3.5 - DELETE /api/brands/:id

**Test:** Test CRUD operations

---

### 📢 Step 5.4: Document Broadcast APIs (20 phút)

- [ ] 5.4.1 - GET /api/broadcasts
- [ ] 5.4.2 - GET /api/broadcasts/:id
- [ ] 5.4.3 - POST /api/broadcasts
- [ ] 5.4.4 - PUT /api/broadcasts/:id
- [ ] 5.4.5 - DELETE /api/broadcasts/:id
- [ ] 5.4.6 - POST /api/broadcasts/:id/publish
- [ ] 5.4.7 - PUT /api/broadcasts/user-tasks/:taskId (reassign)
- [ ] 5.4.8 - DELETE /api/broadcasts/user-tasks/:taskId (delete)

**Test:** 
- [ ] Broadcast lifecycle
- [ ] Reassignment with correct userTaskId
- [ ] Deletion with correct userTaskId

---

### 📦 Step 5.5: Document Store Task APIs (15 phút)

- [ ] 5.5.1 - GET /api/store-tasks
- [ ] 5.5.2 - GET /api/store-tasks/:id
- [ ] 5.5.3 - POST /api/store-tasks/:id/accept
- [ ] 5.5.4 - POST /api/store-tasks/:id/reject
- [ ] 5.5.5 - POST /api/store-tasks/:id/assign

**Test:** Test manager workflows

---

### ✅ Step 5.6: Document User Task APIs (15 phút)

- [ ] 5.6.1 - GET /api/my-tasks
- [ ] 5.6.2 - GET /api/my-tasks/:id
- [ ] 5.6.3 - PUT /api/my-tasks/:id/checklist
- [ ] 5.6.4 - POST /api/my-tasks/:id/evidence
- [ ] 5.6.5 - POST /api/my-tasks/:id/submit

**Test:** Test employee workflows

---

### 📊 Step 5.7: Document Dashboard APIs (15 phút)

- [ ] 5.7.1 - GET /api/dashboard/admin
- [ ] 5.7.2 - GET /api/dashboard/admin/tasks/:status
- [ ] 5.7.3 - GET /api/dashboard/manager
- [ ] 5.7.4 - GET /api/dashboard/employee

**Test:** Verify userTaskId and employeeName in response

---

### 📤 Step 5.8: Document Upload & Other APIs (15 phút)

- [ ] 5.8.1 - POST /api/upload/single
- [ ] 5.8.2 - POST /api/upload/multiple
- [ ] 5.8.3 - DELETE /api/upload/:filename
- [ ] 5.8.4 - Notification endpoints (if exist)

**Output:** Complete `docs/03-API-REFERENCE.md`

---

## PHASE 6: IMPLEMENTATION STATUS & ISSUES (45 phút)

### ✅ Step 6.1: Document Implementation Status (30 phút)

**Mục tiêu:** Track what's done, what's buggy, what's planned

- [ ] 6.1.1 - Write `docs/04-IMPLEMENTATION-STATUS.md`:

**Structure:**
```markdown
# Implementation Status

Last Updated: March 19, 2026

## ✅ WORKING FEATURES

### Authentication & Authorization
- [x] Login with Phone + HMAC-SHA512 ✅ Tested
- [x] JWT token generation ✅ Tested
- [x] Role-based access (admin/manager/employee) ✅ Tested
- [x] Protected routes ✅ Tested

### Employee Management
- [x] List employees ✅ Tested
- [x] Create employee ✅ Tested
- [x] Update employee ✅ Tested
- [x] Update status ✅ Tested
- [x] Delete employee ✅ Tested

... (continue for all features)

## ⚠️ KNOWN BUGS

See `05-KNOWN-ISSUES.md` for details

## 🚧 IN PROGRESS

(None currently)

## 📋 PLANNED (Not Started)

- [ ] Email notifications
- [ ] Mobile app support
- [ ] Advanced analytics
```

- [ ] 6.1.2 - Cross-reference with audit results
- [ ] 6.1.3 - Mark status of each workflow in 01-BUSINESS-LOGIC.md

**Test:** Verify status by actually testing features

---

### 🐛 Step 6.2: Document Known Issues (15 phút)

**Mục tiêu:** Registry of all bugs

- [ ] 6.2.1 - Write `docs/05-KNOWN-ISSUES.md`:

**Structure:**
```markdown
# Known Issues & Bugs

Last Updated: March 19, 2026

## 🎉 RECENTLY FIXED

### BUG-001: Task reassignment used wrong ID
**Status:** ✅ FIXED (March 18, 2026)
**Severity:** Critical
**Issue:** Dashboard passed StoreTask._id to reassign API, but API expects UserTask._id
**Impact:** Reassignment always failed with 404
**Root Cause:** Dashboard API didn't return userTaskId field
**Fix:** 
- Modified `getAdminTasksByStatus()` to populate UserTask and return userTaskId
- Modified `confirmEditReassignBtn` to use `task.userTaskId`
**Files Changed:**
- `src/controllers/dashboardController.js`
- `public/js/admin-dashboard.js`
**Commit:** 29cd689

... (continue for all fixed bugs)

## 🐛 ACTIVE BUGS

(None currently known)

## ⚠️ KNOWN LIMITATIONS

### LIMIT-001: No email notifications
**Impact:** Users don't receive email alerts
**Workaround:** In-app notifications only
**Priority:** Medium
**Planned Fix:** Phase 5 (future)
```

- [ ] 6.2.2 - Priority ranking (Critical/High/Medium/Low)
- [ ] 6.2.3 - Link to relevant sections in other docs

**Output:** 
- `docs/04-IMPLEMENTATION-STATUS.md`
- `docs/05-KNOWN-ISSUES.md`

---

## PHASE 7: DATABASE SCHEMA CONSOLIDATION (30 phút)

### 📊 Step 7.1: Write Database Schema (30 phút)

**Mục tiêu:** Complete database documentation

- [ ] 7.1.1 - Write `docs/02-DATABASE-SCHEMA.md` from audit:

**For each model:**
- Collection name (actual in MongoDB)
- Model name (in code)
- Schema definition (all fields with types)
- Indexes
- Virtual fields
- Instance methods
- Static methods
- Relationships (refs, populates)
- Example document (from database)

**Models to document:**
- [ ] 7.1.2 - Employee model
  - Collection: `Employee`
  - Ref issues: Fixed to use 'Employee' not 'Nhan_vien'
- [ ] 7.1.3 - Brand model (stores)
  - Collection: `Branch`
  - Model name: `Brand`
- [ ] 7.1.4 - GroupUser model (roles)
- [ ] 7.1.5 - Broadcast model
- [ ] 7.1.6 - StoreTask model
  - Virtual: `user_tasks`
- [ ] 7.1.7 - UserTask model
  - Fixed ref: 'Employee' not 'Nhan_vien'
- [ ] 7.1.8 - Notification model (if exists)

- [ ] 7.1.9 - Create ER diagram (text/Mermaid)
- [ ] 7.1.10 - Document ID types & when to use which

**Output:** `docs/02-DATABASE-SCHEMA.md`

---

## PHASE 8: FINALIZATION (30 phút)

### 📝 Step 8.1: Write CHANGELOG (10 phút)

**Mục tiêu:** Track all changes

- [ ] 8.1.1 - Write `docs/CHANGELOG.md`:

```markdown
# Changelog

## [Unreleased]

### March 19, 2026 - Docs Restructure
- Tái cấu trúc hoàn toàn docs folder
- Tạo Source of Truth documentation
- Archive old docs
- New workflow: Logic MD → Code → Test → Fix

### March 18, 2026 - Bug Fixes
- Fixed task reassignment bug (wrong ID type)
- Fixed task deletion bug (wrong ID type)
- Fixed UserTask model ref from 'Nhan_vien' to 'Employee'
- Dashboard API now returns userTaskId and employeeName
- Fixed reassign logic to use oldEmployee reference

### March 16, 2026 - Project Setup
- Initial project setup
- Phase 1-4 complete (from old TODO.md)
```

---

### ✅ Step 8.2: Final Review (15 phút)

**Mục tiêu:** Quality check

- [ ] 8.2.1 - Review all 7 main docs for completeness
- [ ] 8.2.2 - Check internal links work
- [ ] 8.2.3 - Verify code examples are correct
- [ ] 8.2.4 - Update `docs/00-README.md` navigation
- [ ] 8.2.5 - Spell check & grammar
- [ ] 8.2.6 - Ensure consistent formatting

---

### 💾 Step 8.3: Commit & Push (5 phút)

**Mục tiêu:** Save work to GitHub

- [ ] 8.3.1 - Git status check
- [ ] 8.3.2 - Git add all docs
- [ ] 8.3.3 - Commit: "Tái cấu trúc hoàn toàn docs - Source of Truth hoàn chỉnh"
- [ ] 8.3.4 - Push to GitHub
- [ ] 8.3.5 - Verify on GitHub web

---

## 📊 PROGRESS TRACKING

### Phase Completion
- [x] PHASE 1: Audit & Inventory (3/5 steps) 🔄 IN PROGRESS
- [ ] PHASE 2: Create Structure (0/3 steps)
- [ ] PHASE 3: Define Workflow (0/2 steps)
- [ ] PHASE 4: Business Logic (0/2 steps)
- [ ] PHASE 5: API Reference (0/8 steps)
- [ ] PHASE 6: Status & Issues (0/2 steps)
- [ ] PHASE 7: Database Schema (0/1 step)
- [ ] PHASE 8: Finalization (0/3 steps)

### Overall Progress: 3/26 major steps complete (12%)

---

## 📁 DELIVERABLES

**Audit Files:**
- [ ] `audit/00-AUDIT-SUMMARY.md`
- [x] `audit/01-DATABASE-MODELS.md` ✅
- [x] `audit/02-API-ENDPOINTS-RAW.md` ✅
- [x] `audit/03-BUSINESS-LOGIC-CURRENT.md` ✅
- [ ] `audit/04-KNOWN-ISSUES-HISTORY.md`

**Main Docs:**
- [ ] `docs/00-README.md` - Navigation
- [ ] `docs/01-BUSINESS-LOGIC.md` - ⭐ Source of Truth
- [ ] `docs/02-DATABASE-SCHEMA.md` - Complete schema
- [ ] `docs/03-API-REFERENCE.md` - All endpoints
- [ ] `docs/04-IMPLEMENTATION-STATUS.md` - What works
- [ ] `docs/05-KNOWN-ISSUES.md` - Bug registry
- [ ] `docs/06-DEVELOPMENT-WORKFLOW.md` - ⭐ The Workflow
- [ ] `docs/CHANGELOG.md` - Change history

**Archive:**
- [ ] `docs/archive/` - Old docs moved

---

## 🚀 NEXT SESSION

**When starting next session:**
1. Review this TODO file
2. Check last completed checkbox
3. Continue from next unchecked item
4. Update progress tracking
5. Commit after each phase completion

---

## 📝 NOTES & DECISIONS

**Session 1 (March 19, 2026 - Morning):**
- Decided on Option 1: Manual & thorough approach
- Chose Phase 1→2→3... sequential execution
- Will test in parallel with documentation
- Estimated 3-4 hours total, split across multiple sessions
- Started Phase 1.1: Database Models Audit

**Session 2 (March 19, 2026 - Afternoon):**
- Completed Phase 1.1: Database Models (15 min - faster than 30m estimate)
- Found and fixed Notification model bug (refs)
- Deleted legacy models (User, Project, Task + 9 files)
- Completed Phase 1.2: API Endpoints (30 min - faster than 45m estimate)
- Enforced read-only constraint (removed 6 endpoints)
- Completed Phase 1.3: Business Logic (45 min - faster than 60m estimate)
- Audited 10 controllers, documented 50+ functions
- Mapped all 9 workflows including state transitions
- Documented authorization matrix and critical business rules

**Key Decisions:**
- Use `docs-new/` for work in progress
- Keep old `docs/` until ready to replace
- Test everything as we document
- AI will create audit first, then human reviews before proceeding
- Always use Vietnamese for git commits (saved in memory)

---

## ⏱️ TIME TRACKING

**Estimated vs Actual:**
- Phase 1.1: Est 30m | Actual: 15m ✅
- Phase 1.2: Est 45m | Actual: 30m ✅
- Phase 1.3: Est 60m | Actual: 45m ✅
- Phase 1.4: Est 30m | Actual: ___
- Phase 1.5: Est 15m | Actual: ___
- Phase 2: Est 30m | Actual: ___
- Phase 3: Est 30m | Actual: ___
- Phase 4: Est 2h | Actual: ___
- Phase 5: Est 1.5h | Actual: ___
- Phase 6: Est 45m | Actual: ___
- Phase 7: Est 30m | Actual: ___
- Phase 8: Est 30m | Actual: ___

**Total: Est 3-4h | Actual: 1h 30m so far (Phase 1: 3/5 steps done)**

---

## 🎯 SUCCESS CRITERIA

Project is complete when:
- [x] All checkboxes above are checked
- [x] All 8 main docs are written and reviewed
- [x] All APIs are documented with working examples
- [x] All workflows are tested and verified
- [x] Code matches documentation
- [x] Pushed to GitHub
- [x] Team can use docs to develop new features

---

**Ready to begin Phase 1, Step 1.1: Audit Database Models**
