# Changelog

Tất cả các thay đổi quan trọng của dự án ProManage sẽ được ghi lại trong file này.

Format dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
và project tuân theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Unit tests cho tất cả endpoints
- Recurring broadcasts auto-publish
- Database indexes để tăng performance
- XSS sanitization cho inputs
- Rate limiting cho API
- JWT refresh token mechanism
- Swagger API documentation

---

## [3.0.0] - 2026-03-xx

### 🚀 Major Refactor — Task Assignment v3.0

**Mục tiêu:** Đơn giản hóa luồng giao việc — bỏ Manager accept/reject, Admin giao thẳng cho nhân viên, người phụ trách điều phối checklist.

#### Thay đổi kiến trúc chính

- **Bỏ Manager accept/reject flow** — StoreTask không còn status `pending`/`accepted`/`rejected`, chỉ còn `in_progress` / `completed`
- **1 UserTask per StoreTask** — chỉ người phụ trách (assignedPerson) có UserTask; người phụ trách vừa làm vừa quản lý
- **Checklist delegation** — người phụ trách phân công từng checklist item cho đồng nghiệp qua `PUT /user-tasks/:id/assign-item`
- **Checklist review** — người phụ trách duyệt từng item khi đồng nghiệp hoàn thành qua `PUT /user-tasks/:id/review-item`
- **Admin clone broadcast** — thêm nút "Nhân bản" trên dashboard để sao chép metadata broadcast

#### Models (`src/models/`)

**StoreTask.js:**
- `managerId: required` → `assignedPersonId: optional` (admin chỉ định người phụ trách)
- Status enum: `['pending','accepted','rejected','in_progress','completed']` → `['in_progress','completed']`
- Bỏ các field: `acceptedAt`, `rejectedAt`, `rejectedReason`
- Bỏ methods: `canAccept()`, `canReject()`
- `calculateCompletionRate()` — đếm required checklist items thay vì đếm UserTask
- Virtual: `manager` → `assignedPerson`

**UserTask.js:**
- Bổ sung vào mỗi checklist item: `assignedTo`, `reviewStatus`, `reviewedAt`, `reviewedBy`, `reviewNote`
- Thêm index multikey: `{ 'checklist.assignedTo': 1 }`

**Broadcast.js:**
- Thêm field `sourceId: ObjectId` — trỏ về broadcast gốc khi clone

#### Controllers & Routes

**storeTaskController.js:**
- Xóa `acceptStoreTask()` và `rejectStoreTask()`
- `assignEmployees()` — giờ là admin-only, tạo 1 UserTask duy nhất cho employee[0] (= assignedPerson), set status `in_progress` ngay

**userTaskController.js:**
- Thêm `assignChecklistItem()` — người phụ trách gán checklist item cho đồng nghiệp
- Thêm `reviewChecklistItem()` — người phụ trách duyệt/từ chối item

**adminController.js:**
- Xóa `reassignUserTask()` và `addEmployeeToStoreTask()`
- Thêm `getCloneData()` — lấy metadata broadcast để pre-fill form tạo mới

**Routes removed:**
- `PUT /api/store-tasks/:id/accept`
- `PUT /api/store-tasks/:id/reject`
- `PUT /api/admin/user-tasks/:id` (reassign)
- `POST /api/admin/store-tasks/:id/add-employee`

**Routes added:**
- `PUT /api/user-tasks/:id/assign-item`
- `PUT /api/user-tasks/:id/review-item`
- `GET /api/admin/broadcasts/:id/clone-data`

#### Frontend (`public/js/admin-dashboard.js`)
- Bỏ KPI card `pendingConfirmTasks`
- Bỏ tab/filter `pending-confirm`
- `renderStoreTaskRow()` — hiển thị `assignedPersonName` thay `managerName`
- `renderUserTaskRow()` — hiển thị người phụ trách với badge 👑; bỏ nút "Sửa"
- Thêm nút "Nhân bản" trên mỗi broadcast group
- `renderStoreEmployees()` — employee đầu tiên được chọn hiển thị badge 👑 Phụ trách
- Thêm function `handleCloneBroadcast()` — gọi clone-data API và pre-fill form tạo broadcast

#### Dashboard (`src/controllers/dashboardController.js`)
- `getAdminDashboard()` — bỏ `pendingConfirmTasks`, overdue filter chỉ dùng `in_progress`
- `getAdminTasksByStatus()` — bỏ `pending-confirm` case; `managerId` → `assignedPersonId` populate; response mới: 1 UserTask per StoreTask, trả về `assignedPersonName`, `checklistAssigned`



## [2.2.0] - 2026-03-21

### 🐛 Bug Fixes

#### Brand Controller (`src/controllers/brandController.js`)
- **Fix:** `Active_Schedule` trong MongoDB lưu kiểu **Boolean thực** (true/false), KHÔNG phải String "true"/"false" như Mongoose schema khai báo. Hệ quả: Mongoose tự cast query `true` → `'true'` (string) theo schema → không match Boolean trong DB → 0 chi nhánh trả về. Sửa 3 nơi: (1) `src/models/Brand.js` — đổi `Active_Schedule: String` → `Boolean`; (2) `src/controllers/brandController.js` — giữ `filter.Active_Schedule = true`; (3) docs `02-DATABASE-SCHEMA.md`, `03-API-REFERENCE.md` — cập nhật kiểu dữ liệu đúng.

#### Admin Controller (`src/controllers/adminController.js`)
- **Fix:** `notificationService.createNotification` được gọi sai — object `{}` được truyền làm tham số đầu tiên thay vì positional args. Hàm có signature `(userId, type, title, message, data)`. Sửa ở 3 vị trí: notify new employee (reassign), notify old employee (reassign), notify employee (delete/cancel).

#### Notification Model (`src/models/Notification.js`)
- **Fix:** Thiếu 2 enum values trong trường `type`: `task_reassigned` và `task_cancelled`. Khi adminController gọi createNotification với 2 loại này, Mongoose ValidationError xảy ra. Đã thêm cả 2 vào enum.

#### Admin Dashboard UI (`public/js/admin-dashboard.js`)
- **Fix:** `canEdit` condition sai — dùng `task.status !== 'approved'` nhưng StoreTask không có status 'approved' (đó là UserTask status), khiến nút Sửa/Xóa luôn hiện ngay cả với completed tasks. Đổi thành `task.status !== 'completed'`.
- **Fix:** `buildEditRecurringData('onetime')` trả về `{ enabled: false, frequency: 'onetime' }` — `'onetime'` không có trong Broadcast schema enum `['daily','weekly','monthly','yearly']`, gây 400 ValidationError khi lưu. Đổi thành early return `{ enabled: false }`.
- **Fix:** Auto-refresh `setInterval(loadDashboard, 30000)` gọi `loadDashboard()` mỗi 30s, và `loadDashboard` luôn gọi `loadTaskList('completed')` — reset filter + re-render accordion, collapse hết trạng thái đang mở của user. Sửa: (1) dùng `currentTaskFilter` thay vì hardcode `'completed'`; (2) setInterval chỉ gọi `loadDashboard(false)` để refresh KPI mà không re-render task list.

#### Dashboard View (`src/views/pages/admin/dashboard.ejs`)
- **Fix:** `errorModal` (z-50) bị che khuất bởi `editTaskDetailsModal` (z-50) vì modal edit được khai báo sau trong DOM, nên stacking order cao hơn ở cùng z-index. Đổi `errorModal` sang `z-[60]`.

### ✨ Enhancements

#### Admin Dashboard — Quản lý nhân viên trong task (`public/js/admin-dashboard.js`, `src/controllers/dashboardController.js`, `src/controllers/adminController.js`, `src/routes/adminRoutes.js`)
- **Feature:** Level 3 accordion hiện thị `Tên · Chức vụ` (dòng 1) và `SĐT · done/required/total checklist` (dòng 2). Backend trả thêm `employeePosition` (từ ID_GroupUser) và `checklistRequired` (số item bắt buộc).
- **Feature:** Edit modal hiển thị TẤT CẢ nhân viên được giao (không chỉ 1), mỗi người có nút X để xóa ngay lập tức (DELETE UserTask).
- **Feature:** Endpoint mới `POST /api/admin/store-tasks/:id/add-employee` cho phép admin thêm nhân viên vào StoreTask đã tồn tại mà không ảnh hưởng nhân viên cũ. Edit modal dùng endpoint này thay vì reassign.
- **Fix:** Edit modal trước đây thực hiện reassign (thay thế nhân viên cũ bằng mới) khi user muốn thêm nhân viên thứ 2 → chỉ còn 1 người. Nay đã tách riêng "thêm" và "reassign".

#### Admin Dashboard Accordion 3 tầng (`public/js/admin-dashboard.js`, `src/controllers/dashboardController.js`)
- **Backend:** Đổi `UserTask.findOne` → `UserTask.find` trong `getAdminTasksByStatus` để lấy TẤT CẢ nhân viên của mỗi StoreTask. Response thêm `broadcastId`, `userTasks[]` (mảng UserTask với status, checklist progress), `employeeCount`.
- **Frontend:** Thay thế flat list bằng accordion 3 tầng:
  - **Level 1** — Broadcast group (collapsed mặc định): group StoreTask theo `broadcastId`, hiển thị tên broadcast, số chi nhánh, số nhân viên, priority, deadline.
  - **Level 2** — Chi nhánh (collapsed mặc định): storeName, managerName, employeeCount, completionPercent, status badge.
  - **Level 3** — Nhân viên: employeeName, phone, checklist progress, status badge; nút **Sửa** và **Xóa** per UserTask.
- Thêm helper `getUserTaskStatusBadge(status)`, hàm `renderAccordionView`, `renderStoreTaskRow`, `renderUserTaskRow`, `attachAccordionListeners`.

---

## [2.1.0] - 2026-03-20

### 🎉 Major: Documentation Enhancement Complete

#### Added
- **Phase 5 Complete**: Enhanced all 46 API endpoints to full format
  - Full HTTP request/response examples for every endpoint
  - JSON schemas with parameter tables
  - Validation rules chi tiết
  - All error codes (400, 401, 403, 404) documented
  - Implementation details (file, function references)
  - cURL examples ready-to-use
  - Critical warnings and technical debt notes
  - Cross-references between docs
  
- **Upload Endpoints** (6 endpoints fully documented):
  - POST /api/upload - Single file upload (max 50MB)
  - POST /api/upload/multiple - Max 10 files
  - POST /api/upload/photo - Image only (max 10MB)
  - POST /api/upload/photos - Max 5 photos for evidence
  - POST /api/upload/video - Max 50MB with transcoding
  - POST /api/upload/document - PDF only (max 5MB)
  
- **DevTools Endpoints** (2 endpoints with CRITICAL warnings):
  - GET /api/dev/accounts - Account switcher for testing
  - POST /api/dev/quick-login - Quick login bypass auth
  - 🔴 CRITICAL security warnings added (must disable in production)

- **Phase 6 Complete**: Updated Implementation Status & Known Issues
  - Updated feature count: 59 → 64 features
  - Health score: 93% → 94% (60/64 working)
  - Added DevTools & Upload categories to tracking
  - Cross-referenced all issues to API docs
  - Added Issue #14: DevTools security risk (CRITICAL)
  - Updated roadmap with Sprint 0 for production security

#### Changed
- **03-API-REFERENCE.md**: Enhanced 28 additional endpoints
  - Employees (2 endpoints): Data type warnings, read-only constraints
  - Brands (3 endpoints): Naming confusion documented
  - StoreTasks (4 endpoints): Manager authorization, auto behaviors
  - Reviews (3 endpoints): Approval flow, XSS warnings
  - Dashboard (4 endpoints): Role-based stats, authorization
  - Notifications (4 endpoints): Filtering, badge counts
  - Upload (6 endpoints): File size limits, MIME types, security
  - DevTools (2 endpoints): Development-only warnings
  
- **04-IMPLEMENTATION-STATUS.md**:
  - Total features: 59 → 64 (+5 from Upload & DevTools)
  - Working features: 55 → 60 (+5)
  - Overall completion: 74% → 76%
  - Added version history tracking (v1.0 → v1.3)
  
- **05-KNOWN-ISSUES.md**:
  - Total issues: 12 → 14 (+2 new)
  - Added Issue #14: DevTools security (CRITICAL)
  - Updated Issue #7: XSS with specific endpoints
  - Updated Issue #8: Rate limiting with 6 upload endpoints
  - Updated roadmap: 50-70 hrs → 52-72 hrs
  - Added Sprint 0 for pre-production DevTools fix
  
- **02-DATABASE-SCHEMA.md**:
  - Fixed status consistency for Notification refs bug
  - Updated Critical Issues section: NOT FIXED → FIXED
  - Aligned with Recommendations section (both now show FIXED)

#### Technical Rules Applied (Across all 28 new endpoints)
- **Rule 6**: Data type constraints documented (String booleans, numbers)
- **Rule 7**: Authorization matrix enforced (Admin/Manager/Employee)
- **Rule 8**: Technical debt warnings (XSS, Rate Limiting, Tests)
- **Rule 9**: Auto behaviors documented (Status transitions, notifications)

#### Commits
- `2bc9a19`: docs: Hoàn thành Phase 5 - Enhanced 46 API endpoints
- `4872891`: docs: Hoàn thành Phase 6 - Status & Issues tracking
- `a37b229`: docs: Fix status consistency trong DB schema

---

## [2.0.0] - 2026-03-19

### 🎉 Major: Documentation Restructure

#### Added
- **Phase 1 Complete**: Audit toàn diện hệ thống (5 bước, 2.5 giờ)
- **docs/00-README.md**: Navigation hub chính (294 dòng, tiếng Việt)
- **docs/01-BUSINESS-LOGIC.md**: 9 workflows đầy đủ (1145 dòng)
  - Authentication & Authorization
  - Broadcast Management
  - StoreTask Workflow
  - UserTask Workflow
  - Review System
  - Dashboards (Admin/Manager/Employee)
  - Read-Only Collections (Employee/Brand/GroupUser)
  - Notifications
  - File Uploads
- **docs/02-DATABASE-SCHEMA.md**: 7 models với schemas đầy đủ
  - 3 READ-ONLY: Employee, Brand, GroupUser
  - 4 Writable: User, Broadcast, StoreTask, UserTask, Review, Notification, Upload
- **docs/03-API-REFERENCE.md**: 46 endpoints documented
  - Auth (4 endpoints)
  - Broadcasts (8 endpoints)
  - StoreTasks (12 endpoints)
  - UserTasks (10 endpoints)
  - Reviews (6 endpoints)
  - Dashboard (5 endpoints)
  - Read-Only (7 endpoints)
  - Notifications (4 endpoints)
  - Uploads (3 endpoints)
- **docs/04-IMPLEMENTATION-STATUS.md**: Feature tracking (59 features)
  - 55 ✅ working
  - 5 🐛 buggy
  - 8 📋 planned
- **docs/05-KNOWN-ISSUES.md**: Bug registry (14 issues)
  - 4 fixed (2 CRITICAL, 2 HIGH)
  - 10 known issues
  - Roadmap 50-70 hours
- **docs/06-DEVELOPMENT-WORKFLOW.md**: 6-step development process
  - Define Logic in MD
  - Check API Impact
  - Implement Code
  - Test in UI
  - Debug Loop
  - Update Documentation
- **docs/CHANGELOG.md**: Version history (this file)
- **docs/archive/**: Archived old documentation (12 items)
  - TODO.md, QUICK_REFERENCE.md
  - 7 API docs cũ
  - 4 folders cũ (proposals, admin, manager, employee, technical)

#### Changed
- Documentation language: 100% tiếng Việt
- Source of Truth: Docs-first approach (MD → Code)
- Git commits: Always tiếng Việt
- Workflow: MD-first development enforced

#### Fixed
- [#1] **CRITICAL**: Notification refs sai khi reassign UserTask
  - `oldEmployee`, `newEmployee`, `manager` refs không đúng
  - Fixed: 19/03/2026
  - Files: `controllers/userTaskController.js`
  - Impact: Notifications giờ có refs chính xác
- [#4] **CRITICAL**: READ-ONLY collections có operations bị cấm
  - Employee/Brand/GroupUser có DELETE/PUT endpoints
  - Fixed: 19/03/2026
  - Files: `routes/employeeRoutes.js`, `routes/brandRoutes.js`, `routes/groupUserRoutes.js`
  - Impact: Chỉ còn GET operations, mutations bị block

---

## [1.2.0] - 2026-03-18

### Fixed
- [#2] **CRITICAL**: Dashboard Employee trả về UserTask sai
  - `GET /api/dashboard/employee` query sai ID
  - Trả về tasks của người khác
  - Fixed: 18/03/2026
  - Files: `controllers/dashboardController.js`
  - Impact: Employee giờ chỉ thấy tasks của mình
- [#3] **HIGH**: Reassign UserTask mất oldEmployee reference
  - Khi reassign, không lưu `oldEmployee` field
  - Fixed: 18/03/2026
  - Files: `controllers/userTaskController.js`
  - Impact: History tracking hoạt động đúng

### Changed
- Improved error messages cho dashboard endpoints
- Added validation cho reassign operations

---

## [1.1.0] - 2026-03-15

### Added
- Employee dashboard với task statistics
- Manager dashboard với team overview
- Admin dashboard với system stats
- Recent activity tracking
- Task analytics (completion rates, timing)

### Changed
- Enhanced dashboard queries với better performance
- Improved role-based filtering

---

## [1.0.0] - 2026-03-01

### 🎉 Initial Release

#### Added

**Authentication System**
- JWT-based authentication với bcrypt hashing
- Login, Register, Get Current User, Logout
- Role-based access: Admin, Manager, Employee
- 24-hour token expiry

**Broadcast Management**
- Create, Read, Update, Delete broadcasts
- Draft, Scheduled, Published status workflow
- Auto-create notifications on publish
- Admin-only access
- Manager/Employee read-only for published broadcasts

**StoreTask System**
- Create, Read, Update, Delete store tasks
- Multi-brand assignment
- Draft, Published, Cancelled, Archived status
- Auto-create UserTasks on publish
- Admin/Manager management
- Employee read-only for published tasks

**UserTask Workflow**
- Auto-creation from StoreTasks
- Assign/Reassign functionality
- Status: pending, in_progress, completed, done, rejected
- Employee self-service (start, complete)
- Manager oversight (assign, reassign)
- Review request system

**Review System**
- Manager/Admin review submissions
- Approve/Reject functionality
- Updates UserTask status
- Review comments and feedback

**Read-Only Collections**
- Employee data (từ hệ thống khác)
- Brand data (từ hệ thống khác)
- GroupUser data (từ hệ thống khác)
- GET-only operations
- No mutations allowed

**Notifications**
- Auto-create on broadcast publish
- Auto-create on storetask publish
- Auto-create on task assignment
- User-specific notification list
- Mark as read functionality

**File Uploads**
- Image uploads với validation
- File uploads (PDF, DOCX)
- Public URL access
- Multer integration

**Infrastructure**
- MongoDB database với Mongoose
- Express.js REST API
- CORS configuration
- Global error handling
- JWT middleware protection

---

## Version History Summary

| Version | Date | Type | Description |
|---------|------|------|-------------|
| 2.0.0 | 2026-03-19 | 📖 Major | Documentation restructure, 2 critical bugs fixed |
| 1.2.0 | 2026-03-18 | 🐛 Bugfix | 2 critical bugs fixed (dashboard, reassign) |
| 1.1.0 | 2026-03-15 | ✨ Feature | Dashboard system added |
| 1.0.0 | 2026-03-01 | 🎉 Release | Initial working version |

---

## Types of Changes

- `Added` - Tính năng mới
- `Changed` - Thay đổi functionality hiện tại
- `Deprecated` - Tính năng sẽ bị xóa trong tương lai
- `Removed` - Tính năng đã bị xóa
- `Fixed` - Bug fixes
- `Security` - Security fixes

---

## Git Commit Format

All commits sử dụng tiếng Việt với format:

```
[type]: Mô tả ngắn gọn

- Detail 1
- Detail 2
- Detail 3
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `refactor:` - Code refactor (no behavior change)
- `test:` - Add/update tests
- `chore:` - Maintenance tasks

**Examples:**

```bash
# Feature
git commit -m "feat: Thêm scheduled broadcasts

- Thêm publishAt field vào Broadcast model
- Validate publishAt phải là thời gian tương lai
- Update API docs với scheduled broadcast flow"

# Bug fix
git commit -m "fix: Sửa lỗi dashboard trả về UserTask sai

- Query dashboard theo req.user._id thay vì hardcode
- Test với nhiều employees OK
- Update KNOWN-ISSUES.md đánh dấu #2 fixed"

# Documentation
git commit -m "docs: Hoàn thành Phase 1 - Audit Toàn Diện

- Tạo 4 audit files (models, endpoints, logic, issues)
- Document 9 workflows đầy đủ
- Track 14 issues (4 fixed, 10 known)
- Estimate roadmap 50-70 hours"
```

---

## Links

- [Business Logic](01-BUSINESS-LOGIC.md) - Complete workflow documentation
- [Database Schema](02-DATABASE-SCHEMA.md) - All models and schemas
- [API Reference](03-API-REFERENCE.md) - All 46 endpoints
- [Implementation Status](04-IMPLEMENTATION-STATUS.md) - Feature tracking
- [Known Issues](05-KNOWN-ISSUES.md) - Bug tracking and roadmap
- [Development Workflow](06-DEVELOPMENT-WORKFLOW.md) - How to develop

---

## Maintenance

**Cách update CHANGELOG:**

1. **Khi bắt đầu feature mới:**
   - Thêm vào `[Unreleased] > Added`
   - Mô tả ngắn gọn

2. **Khi fix bug:**
   - Thêm vào `[Unreleased] > Fixed`
   - Link tới issue number (#N)

3. **Khi release version mới:**
   - Di chuyển `[Unreleased]` thành `[X.Y.Z] - YYYY-MM-DD`
   - Tạo `[Unreleased]` section mới ở đầu
   - Update version history summary

**Never:**
- ❌ Xóa entries cũ
- ❌ Edit entries đã release
- ❌ Quên link tới issue numbers

**Always:**
- ✅ Keep entries concise
- ✅ Group by type (Added/Changed/Fixed)
- ✅ Include impact/affected files
- ✅ Link to related docs

---

**Last Updated:** 19/03/2026
