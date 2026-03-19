# Changelog

Tất cả các thay đổi quan trọng của dự án ProManage sẽ được ghi lại trong file này.

Format dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
và project tuân theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **FEATURE-CHECKLIST.md**: Template đầy đủ cho feature development
  - Checklist 6 bước chi tiết
  - Example walkthrough (Schedule Broadcast)
  - Debug scenarios và solutions
  - Time tracking template

### Planned
- Unit tests cho tất cả endpoints
- Recurring broadcasts auto-publish
- Database indexes để tăng performance
- XSS sanitization cho inputs
- Rate limiting cho API
- JWT refresh token mechanism
- Swagger API documentation
- Console.log cleanup

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
