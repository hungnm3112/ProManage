# 05 - AUDIT CÁC VẤN ĐỀ ĐÃ BIẾT

**Ngày audit:** 19/03/2026  
**Cập nhật cuối:** 20/03/2026 (Fixed Monthly Recurring Dropdown UI)  
**Mục đích:** Ghi chép bugs, workarounds, technical debt + Ready-to-code tasks  
**Phạm vi:** Toàn bộ codebase

**🆕 NEW SECTION:** Implementation Queue - Tasks với complete specs, ready để implement code

---

## 📊 TỔNG QUAN

**Tổng số vấn đề:** 15
- ✅ Đã sửa: 5
- 🚀 Implementation Queue: 5 (Ready to code)
- ⚠️ Known Issues: 5
- 🔧 Technical Debt: 4

**Mức độ ưu tiên:**
- 🔴 CRITICAL: 1 (DevTools - chỉ critical nếu production)
- 🟡 HIGH: 2
- 🟢 MEDIUM: 8
- ⚪ LOW: 4

**Implementation Queue Priority:**
- 🔴 P0 - API Refactoring: 3 tasks (REFACTOR-001, 002, 003) ✅ COMPLETED
- 🔴 P1 - Security: 1 task (SECURITY-001)
- 🟡 P2 - Performance: 1 task (PERF-001)

---

## ✅ CÁC BUG ĐÃ SỬA

### 1. Notification Model References Sai ✅

**Ngày phát hiện:** 19/03/2026  
**Ngày sửa:** 19/03/2026  
**Mức độ:** 🔴 CRITICAL  

**Mô tả vấn đề:**
- File: `src/models/Notification.js`
- Dòng 12 và 68: Ref tham chiếu đến model 'Nhan_vien' không tồn tại
- Đúng phải là 'Employee'

**Tác động:**
- Populate notification.userId thất bại
- Populate notification.data.employeeId thất bại
- Gây lỗi khi lấy thông tin người nhận thông báo

**Solution:**
```javascript
// TRƯỚC (SAI):
ref: 'Nhan_vien'

// SAU (ĐÚNG):
ref: 'Employee'
```

**Files đã sửa:**
- `src/models/Notification.js` (2 locations)

---

### 2. Monthly Recurring Dropdown chỉ có 10 ngày ✅

**Ngày phát hiện:** 20/03/2026  
**Ngày sửa:** 20/03/2026  
**Mức độ:** 🟡 HIGH  

**Mô tả vấn đề:**
- File: `src/views/pages/admin/dashboard.ejs` (lines 287-297, 718-729)
- Dropdown `#monthlyDay` chỉ có 10 options: 1,2,3,5,10,15,20,25,28,"last"
- Không thể chọn ngày 4,6-9,11-14,16-19,21-24,26-27,29-31
- Backend Broadcast model đã hỗ trợ 1-31 và "last", nhưng UI giới hạn

**Tác động:**
- Không thể tạo broadcast lặp lại cho các ngày như: 21 (ngày chốt lương), 27 (ngày trả lương), 30 (ngày đóng tiền thuê)
- Giảm tính linh hoạt của hệ thống
- UX rất kém cho admin

**Solution:**
- Thay thế `<select>` dropdown bằng `<input type="number" min="1" max="31">`
- Thêm checkbox "Ngày cuối tháng" để hỗ trợ "last"
- Khi checkbox checked, disable number input
- Cập nhật JavaScript xử lý logic tương ứng

**Files đã sửa:**
- `src/views/pages/admin/dashboard.ejs` - Thay dropdown bằng number input + checkbox (2 locations)
- `public/js/admin-dashboard.js` - Cập nhật logic xử lý checkbox và number input

**Kết quả:**
- ✅ UI giờ hỗ trợ đầy đủ 31 ngày + ngày cuối tháng
- ✅ Native HTML5 input validation (min/max)
- ✅ UX tốt hơn cho admin
- ✅ Không cần thay đổi backend code

---

### 3. Dashboard dùng sai UserTask ID ✅

**Ngày phát hiện:** 18/03/2026  
**Ngày sửa:** 18/03/2026  
**Mức độ:** 🟡 HIGH

**Mô tả vấn đề:**
- File: `src/controllers/dashboardController.js`
- Admin dashboard tasks by status endpoint
- Trả về StoreTask._id thay vì UserTask._id
- API reassign/delete cần UserTask._id để hoạt động

**Tác động:**
- Admin không thể reassign task từ dashboard
- Admin không thể delete task từ dashboard
- Phải tìm UserTask._id thủ công từ database

**Solution:**
- Thêm bước query UserTask để lấy userTaskId
- Thêm populate employeeId để lấy employeeName
- Trả về cả userTaskId và employeeName trong response

**Files đã sửa:**
- `src/controllers/dashboardController.js` - getTasksByStatus()

**Code snippet:**
```javascript
// Thêm query UserTask
const firstUserTask = await UserTask.findOne({ 
  storeTaskId: task._id 
})
  .populate('employeeId', 'FullName')
  .lean();

// Trả về đầy đủ thông tin
userTaskId: firstUserTask?._id || null,
employeeName: firstUserTask?.employeeId?.FullName || "Chưa giao"
```

---

### 3. Reassign không lưu oldEmployee reference ✅

**Ngày phát hiện:** 18/03/2026  
**Ngày sửa:** 18/03/2026  
**Mức độ:** 🟡 HIGH

**Mô tả vấn đề:**
- File: `src/controllers/broadcastController.js`
- updateUserTask (reassign) function
- Khi reassign cross-branch, cần xóa nhân viên cũ khỏi StoreTask cũ
- Nhưng employeeId đã bị overwrite trước khi xóa
- Dẫn đến xóa nhân viên mới khỏi StoreTask cũ (sai logic)

**Tác động:**
- Reassign cross-branch không hoạt động đúng
- Nhân viên cũ vẫn trong assignedEmployees của StoreTask cũ
- Nhân viên mới bị xóa khỏi StoreTask cũ nhầm

**Solution:**
```javascript
// LƯU oldEmployee TRƯỚC KHI update
const oldEmployee = userTask.employeeId;
const oldStoreTask = userTask.storeTaskId;

// SAU ĐÓ mới update
userTask.employeeId = newEmployee._id;

// Dùng oldEmployee để xóa
await StoreTask.findByIdAndUpdate(oldStoreTask, {
  $pull: { assignedEmployees: oldEmployee } // ĐÚNG
});
```

**Files đã sửa:**
- `src/controllers/broadcastController.js` - updateUserTask()

---

### 4. Read-Only Collections có operations bị cấm ✅

**Ngày phát hiện:** 19/03/2026  
**Ngày sửa:** 19/03/2026  
**Mức độ:** 🔴 CRITICAL

**Mô tả vấn đề:**
- Collections Employee, Brand, GroupUser đồng bộ từ hệ thống ngoài (HR/ERP/Permission)
- ProManage CHỈ có quyền ĐỌC
- Nhưng code có 6 endpoints CREATE/UPDATE/DELETE

**Tác động:**
- Nếu gọi các API này → Tạo data conflict với hệ thống ngoài
- Data sẽ bị ghi đè khi sync lần sau
- Mất đồng bộ giữa ProManage và hệ thống nguồn

**Endpoints đã xóa:**

**Employee (4 endpoints):**
- ❌ POST /api/employees (createEmployee)
- ❌ PUT /api/employees/:id (updateEmployee)
- ❌ PATCH /api/employees/:id/status (updateEmployeeStatus)
- ❌ DELETE /api/employees/:id (deleteEmployee)

**Brand (2 endpoints):**
- ❌ PUT /api/brands/:id (updateBrand)
- ❌ PATCH /api/brands/:id/manager (assignManager)

**Files đã sửa:**
- `src/controllers/employeeController.js` - Xóa 4 functions
- `src/controllers/brandController.js` - Xóa 2 functions
- `src/routes/employeeRoutes.js` - Xóa 4 routes
- `src/routes/brandRoutes.js` - Xóa 2 routes
- Thêm comment blocks giải thích READ-ONLY constraint

**Documentation:**
- Tạo persistent memory: `/memories/promanage-readonly-collections.md`
- Cập nhật audit docs với ⛔ READ-ONLY warnings

---

## ⚠️ KNOWN ISSUES (CHƯA SỬA)

### 5. Recurring Broadcasts chưa được tự động publish 🟡

**Ngày phát hiện:** Audit 19/03/2026  
**Mức độ:** 🟡 HIGH

**Mô tả vấn đề:**
- Có logic recurring trong Broadcast model (weekly/monthly)
- Có test file: `src/jobs/testRecurring.js`
- Nhưng KHÔNG có cron job hoặc scheduler thực tế
- Recurring broadcasts không tự động publish

**Tác động:**
- Admin phải publish thủ công mỗi lần
- Mất đi tính năng tự động hóa
- Test file chỉ để demo, không chạy production

**Files liên quan:**
- `src/models/Broadcast.js` - có schema recurring
- `src/jobs/testRecurring.js` - test code không chạy
- THIẾU: scheduler service (node-cron, agenda, bull, v.v.)

**Giải pháp đề xuất:**
1. Cài đặt node-cron hoặc agenda
2. Tạo `src/jobs/recurringBroadcastJob.js`
3. Chạy mỗi ngày 00:00 để check và publish broadcasts đủ điều kiện
4. Log vào database hoặc file

**Ước tính effort:** 4-6 giờ

---

### 6. Console.log còn nhiều trong production code 🟢

**Ngày phát hiện:** Audit 19/03/2026  
**Mức độ:** 🟢 MEDIUM

**Mô tả vấn đề:**
- 30+ console.log/warn/error statements trong code
- Production không nên dùng console.log (hiệu suất thấp)
- Đã có logger middleware nhưng không dùng nhất quán

**Files bị ảnh hưởng:**
- `src/controllers/brandController.js` - 3 console.error
- `src/controllers/employeeController.js` - nhiều console.error
- `src/helpers/authHelper.js` - console.error
- `src/helpers/progressHelper.js` - 2 console.error
- `src/services/emailService.js` - console.log/error
- `src/models/Broadcast.js` - console.warn
- `src/jobs/testRecurring.js` - 20+ console.log (test file OK)
- `src/config/database.js` - console.log/error

**Giải pháp đề xuất:**
1. Thay thế tất cả console.* bằng logger middleware
2. Cấu hình logger cho production (Winston hoặc Bunyan)
3. Log vào file thay vì console
4. Thêm log rotation

**Ước tính effort:** 2-3 giờ

---

### 7. Không có input sanitization cho XSS 🟢

**Ngày phát hiện:** Audit 19/03/2026  
**Mức độ:** 🟢 MEDIUM

**Mô tả vấn đề:**
- Validators chỉ check format, không sanitize HTML/JS
- User có thể inject HTML tags trong title, description, reviewNote
- Có thể gây XSS attack khi render trong UI

**Fields có nguy cơ:**
- Broadcast: title, description
- UserTask: overallNote
- Review: reviewNote, reason (reject)
- StoreTask: rejectedReason

**Endpoints cần sanitization:**
- [POST /api/broadcasts](03-API-REFERENCE.md#post-apibroadcasts) - title, description
- [POST /api/reviews/:taskId/approve](03-API-REFERENCE.md#post-apireviewstaskidapprove) - reviewNote
- [POST /api/reviews/:taskId/reject](03-API-REFERENCE.md#post-apireviewstaskidreject) - reason
- [PUT /api/store-tasks/:id/reject](03-API-REFERENCE.md#put-apistoretasksidreject) - rejectedReason

**Giải pháp đề xuất:**
1. Cài đặt `validator` hoặc `xss` package
2. Sanitize input trong validators
3. Hoặc escape output trong frontend

**Code mẫu:**
```javascript
const xss = require('xss');

// Trong validator
.customSanitizer(value => xss(value))
```

**Ước tính effort:** 2-3 giờ

---

### 8. Không có rate limiting cho APIs 🟢

**Ngày phát hiện:** Audit 19/03/2026  
**Mức độ:** 🟢 MEDIUM

**Mô tả vấn đề:**
- Không có middleware rate limiting
- APIs có thể bị spam/brute force
- Đặc biệt nguy hiểm cho:
  - POST /api/auth/login (brute force password)
  - POST /api/upload/* (spam file uploads - 6 endpoints)
  - POST /api/broadcasts/:id/assign (tạo nhiều tasks)

**Endpoints bị ảnh hưởng:**
- [POST /api/upload](03-API-REFERENCE.md#post-apiupload) - Single file
- [POST /api/upload/multiple](03-API-REFERENCE.md#post-apiuploadmultiple) - Max 10 files
- [POST /api/upload/photo](03-API-REFERENCE.md#post-apiuploadphoto) - Image only
- [POST /api/upload/photos](03-API-REFERENCE.md#post-apiuploadphotos) - Max 5 photos
- [POST /api/upload/video](03-API-REFERENCE.md#post-apiuploadvideo) - Max 50MB
- [POST /api/upload/document](03-API-REFERENCE.md#post-apiuploaddocument) - PDF only

**Tác động:**
- Dễ bị DDoS attack
- Server overload
- Database overload
- Storage space exhaustion (upload spam)

**Giải pháp đề xuất:**
1. Cài đặt `express-rate-limit`
2. Áp dụng cho:
   - Login: 5 attempts / 15 phút / IP
   - Upload: 20 files / giờ / user
   - APIs khác: 100 requests / 15 phút / user

**Ước tính effort:** 1-2 giờ

---

### 9. JWT không có refresh token mechanism ⚪

**Ngày phát hiện:** Audit 19/03/2026  
**Mức độ:** ⚪ LOW

**Mô tả vấn đề:**
- Chỉ có access token (JWT)
- Không có refresh token
- Token hết hạn → user phải login lại
- Không có cơ chế revoke token

**Tác động:**
- User experience kém (phải login thường xuyên)
- Không thể logout user từ server side
- Token bị đánh cắp → không thu hồi được

**Giải pháp đề xuất:**
1. Implement refresh token flow
2. Lưu refresh tokens trong database
3. Access token: 15 phút
4. Refresh token: 7 ngày
5. Endpoint POST /api/auth/refresh

**Ước tính effort:** 4-6 giờ

---

### 10. Thiếu database indexes cho query hiệu suất 🟢

**Ngày phát hiện:** Audit 19/03/2026  
**Mức độ:** 🟢 MEDIUM

**Mô tả vấn đề:**
- Nhiều queries filter theo các trường không có index
- Hiệu suất giảm khi data lớn

**Queries cần optimize:**

**UserTask:**
- `{ employeeId: xxx }` - query rất thường xuyên
- `{ storeTaskId: xxx, status: 'submitted' }` - review flow
- `{ broadcastId: xxx, employeeId: xxx }` - check duplicate

**StoreTask:**
- `{ managerId: xxx }` - manager dashboard
- `{ storeId: xxx }` - filter by store
- `{ broadcastId: xxx, storeId: xxx }` - assign logic

**Notification:**
- `{ userId: xxx, isRead: false }` - unread count

**Indexes đề xuất:**
```javascript
// UserTask
userTaskSchema.index({ employeeId: 1 });
userTaskSchema.index({ storeTaskId: 1, status: 1 });
userTaskSchema.index({ broadcastId: 1, employeeId: 1 }, { unique: true });

// StoreTask
storeTaskSchema.index({ managerId: 1 });
storeTaskSchema.index({ broadcastId: 1, storeId: 1 }, { unique: true });

// Notification
notificationSchema.index({ userId: 1, isRead: 1 });
```

**Ước tính effort:** 1-2 giờ

---

## 🔧 TECHNICAL DEBT

### 11. Validators không nhất quán ⚪

**Ngày phát hiện:** Audit 19/03/2026  
**Mức độ:** ⚪ LOW

**Mô tả vấn đề:**
- Một số endpoints có validators, một số không
- Một số validate trong controller, một số trong middleware
- Không có pattern nhất quán

**Ví dụ không nhất quán:**
- `broadcastController.createBroadcast` - validate trong controller
- `storeTaskRoutes` - dùng validator middleware
- `userTaskController` - validate inline

**Giải pháp đề xuất:**
1. Tất cả validation qua validator middleware
2. Tách validation logic khỏi controller logic
3. Tạo validators cho tất cả endpoints

**Ước tính effort:** 3-4 giờ

---

### 12. Không có API documentation (Swagger) ⚪

**Ngày phát hiện:** Audit 19/03/2026  
**Mức độ:** ⚪ LOW

**Mô tả vấn đề:**
- Không có Swagger/OpenAPI docs
- Frontend phải đọc code để biết API contract
- Khó onboard developer mới

**Giải pháp đề xuất:**
1. Cài đặt `swagger-jsdoc` và `swagger-ui-express`
2. Document tất cả endpoints với JSDoc comments
3. Expose tại /api-docs

**Ước tính effort:** 8-12 giờ (cho tất cả 46 endpoints)

---

### 13. Thiếu unit tests và integration tests 🟡

**Ngày phát hiện:** Audit 19/03/2026  
**Mức độ:** 🟡 HIGH

**Mô tả vấn đề:**
- Hoàn toàn không có tests
- Regression bugs dễ xảy ra
- Refactoring rất rủi ro

**Giải pháp đề xuất:**
1. Setup Jest + Supertest
2. Viết tests cho:
   - Critical flows: Auth, Broadcast publish, Task assignment
   - Helper functions: authHelper, progressHelper
   - Model methods: canSubmit(), canReview(), etc.
3. Setup CI/CD để run tests tự động

**Ước tính effort:** 20-30 giờ (cho coverage 70%)

---

### 14. DevTools endpoints exposed in production 🔴

**Ngày phát hiện:** 20/03/2026 (Phase 5 documentation)  
**Mức độ:** 🔴 CRITICAL (nếu deploy production)

**Mô tả vấn đề:**
- Có 2 endpoints DevTools bypass authentication hoàn toàn
- Được tạo cho development testing
- Nếu không disable trong production → CRITICAL SECURITY RISK

**Endpoints nguy hiểm:**
- [GET /api/dev/accounts](03-API-REFERENCE.md#get-apidevaccounts) - List test accounts (password exposed)
- [POST /api/dev/quick-login](03-API-REFERENCE.md#post-apidevquick-login) - Login without password

**Tác động:**
- Bất kỳ ai có thể login vào bất kỳ tài khoản nào
- Không cần password
- Lộ credentials của test accounts
- Complete authentication bypass

**Giải pháp đề xuất:**
1. **Option 1 (Recommended):** Xóa routes khỏi production build
   ```javascript
   // src/routes/index.js
   if (process.env.NODE_ENV === 'development') {
     app.use('/api/dev', devToolsRoutes);
   }
   ```

2. **Option 2:** Middleware check environment
   ```javascript
   // devToolsRoutes.js
   router.use((req, res, next) => {
     if (process.env.NODE_ENV !== 'development') {
       return res.status(403).json({ message: 'DevTools disabled in production' });
     }
     next();
   });
   ```

3. **Option 3:** Remove routes completely from production codebase

**Files cần sửa:**
- `src/routes/devToolsRoutes.js` - Add environment check
- `src/routes/index.js` - Conditional registration
- `.env.production` - Set NODE_ENV=production

**Ước tính effort:** 30 phút - 1 giờ

**Ưu tiên:** 🔴 MUST FIX before production deployment

---

## 📋 WORKAROUNDS HIỆN TẠI

### Workaround 1: Manager phải assign thủ công broadcast recurring

**Liên quan đến Issue:** #5 (Recurring broadcasts)

**Hiện tại:**
- Admin tạo broadcast với recurring = true
- Nhưng không tự động publish
- Admin hoặc manager phải nhớ publish thủ công đúng ngày

**Rủi ro:**
- Quên publish → task trễ
- Không scale với nhiều recurring broadcasts

---

### Workaround 2: Admin tasks reassign phải tìm userTaskId thủ công

**Liên quan đến Issue:** #2 (FIXME)

**Trước 18/03/2026:**
- Dashboard chỉ trả về StoreTask._id
- Admin phải vào MongoDB Compass
- Tìm UserTask theo storeTaskId
- Copy UserTask._id để reassign

**Sau 18/03/2026:**
- ✅ ĐÃ SỬA - Dashboard giờ trả về userTaskId

---

### Workaround 3: Không thể thu hồi JWT token bị leak

**Liên quan đến Issue:** #9 (JWT refresh token)

**Hiện tại:**
- Nếu token bị đánh cắp → không có cách revoke
- Phải đợi token expire (24 giờ)
- Hoặc thay đổi JWT_SECRET (logout tất cả users)

**Rủi ro:**
- Security incident kéo dài 24 giờ
- Không thể force logout user cụ thể

---

## � IMPLEMENTATION QUEUE (Ready to Code)

**Mục đích:** Danh sách tasks đã được analyze, có đủ documentation, ready để implement code  
**Workflow:** Known Issue → Queue (prioritize) → Implementation → Bugs Đã Sửa

---

### 🔴 PRIORITY 0 - API Refactoring (March 20, 2026)

#### REFACTOR-001: Implement /api/admin/user-tasks routes ⏳

**Status:** 📋 Ready to implement  
**Related docs updated:** ✅ 01-BUSINESS-LOGIC.md § 2.8, 2.9 | ✅ 03-API-REFERENCE.md § 10  
**Related issues:** N/A (enhancement, not bug fix)  
**Blocking:** None  
**Effort estimate:** 2-3 giờ

**Documentation references:**
- [01-BUSINESS-LOGIC.md § 2.8](01-BUSINESS-LOGIC.md#28-reassign-usertask) - Reassign UserTask logic
- [01-BUSINESS-LOGIC.md § 2.9](01-BUSINESS-LOGIC.md#29-delete-usertask) - Delete UserTask logic
- [03-API-REFERENCE.md § 1️⃣0️⃣ ADMIN](03-API-REFERENCE.md#1️⃣0️⃣-admin) - Complete API specs

**Files to CREATE:**
- `src/controllers/adminController.js`
  - Function: `reassignUserTask(req, res)`
  - Function: `deleteUserTask(req, res)`
- `src/routes/adminRoutes.js`
  - Route: `PUT /api/admin/user-tasks/:id`
  - Route: `DELETE /api/admin/user-tasks/:id`

**Files to UPDATE:**
- `src/routes/index.js` - Register adminRoutes
- `src/middleware/authMiddleware.js` - Verify `authorizeAdmin` middleware exists

**Implementation checklist:**
- [ ] Create adminController.js with 2 functions
- [ ] Implement reassignUserTask() logic (6 steps from Business Logic)
- [ ] Implement deleteUserTask() logic (7 steps from Business Logic)
- [ ] Create adminRoutes.js with 2 routes
- [ ] Apply authorizeAdmin middleware to both routes
- [ ] Register routes in index.js under `/api/admin`
- [ ] Test: Admin can reassign/delete (200)
- [ ] Test: Manager/Employee get 403
- [ ] Test: Invalid userTaskId gets 404
- [ ] Test: Completed task cannot be deleted (400)

**Validation requirements:**
- Authorization: `req.user.role === 'admin'`
- UserTask must exist and not completed
- Employee must be active (Trang_thai = "1")
- Cross-store reassign: Handle 2 StoreTasks atomically

**Success criteria:**
- All 10 checklist items passed
- Response format matches 03-API-REFERENCE.md
- No violations of Rules 1-7
- Code passes manual testing in UI

**Commit format:**
```bash
git checkout -b feature/REFACTOR-001-admin-routes
# ... implement ...
git commit -m "feat(admin): implement /api/admin/user-tasks routes

- Add adminController with reassignUserTask and deleteUserTask
- Add adminRoutes with PUT/DELETE /api/admin/user-tasks/:id
- Apply authorizeAdmin middleware
- Refs: 01-BUSINESS-LOGIC § 2.8, 2.9
- Refs: 03-API-REFERENCE § 10"
```

---

#### REFACTOR-002: Deprecate old broadcast user-task routes ⏳

**Status:** 🔗 Blocked by REFACTOR-001  
**Related docs updated:** ✅ 01-BUSINESS-LOGIC.md | ✅ 03-API-REFERENCE.md  
**Related issues:** Bug #2, #3 (context)  
**Blocking:** REFACTOR-001 must be completed first  
**Effort estimate:** 30 phút

**Documentation references:**
- [03-API-REFERENCE.md - Deprecated routes](03-API-REFERENCE.md#put-apibroadcastsuser-taskstaskid)

**Files to UPDATE:**
- `src/controllers/broadcastController.js`
  - Function: `updateUserTask()` - Add deprecation warning log
  - Function: `deleteUserTask()` - Add deprecation warning log
- `src/routes/broadcastRoutes.js`
  - Add comments marking routes as deprecated

**Implementation checklist:**
- [ ] Add console.warn in updateUserTask: "DEPRECATED: Use PUT /api/admin/user-tasks/:id"
- [ ] Add console.warn in deleteUserTask: "DEPRECATED: Use DELETE /api/admin/user-tasks/:id"
- [ ] Add JSDoc @deprecated tags
- [ ] Update route comments in broadcastRoutes.js
- [ ] Verify old routes still work (backward compatibility)
- [ ] Document migration path in code comments

**Success criteria:**
- Old routes still functional
- Deprecation warnings logged
- Clear migration instructions in code

**Commit format:**
```bash
git commit -m "refactor(broadcast): mark user-task admin routes as deprecated

- Add deprecation warnings to updateUserTask/deleteUserTask
- Document migration to /api/admin/user-tasks
- Maintain backward compatibility
- Related: REFACTOR-001"
```

---

#### REFACTOR-003: Remove /brands/:id/employees endpoint ⏳

**Status:** 📋 Ready to implement  
**Related docs updated:** ✅ 01-BUSINESS-LOGIC.md § 7.2 | ✅ 03-API-REFERENCE.md  
**Related issues:** Bug #4 (READ-ONLY context)  
**Blocking:** None  
**Effort estimate:** 1 giờ

**Documentation references:**
- [01-BUSINESS-LOGIC.md § 7.2](01-BUSINESS-LOGIC.md#72-brand-management) - Deprecated endpoint note
- [03-API-REFERENCE.md - Brands](03-API-REFERENCE.md#get-apibrandsidemployees) - Migration guide

**Files to UPDATE:**
- `src/controllers/brandController.js`
  - Remove function: `getBrandEmployees()`
  - OR mark deprecated with warning
- `src/routes/brandRoutes.js`
  - Remove route: `GET /api/brands/:id/employees`
  - OR mark deprecated

**Implementation options:**

**Option A - Hard removal (Recommended):**
- Delete function completely
- Delete route completely
- Users must use `GET /api/employees?branchId=xxx`

**Option B - Soft deprecation:**
- Keep function but add deprecation warning
- Return 410 Gone with migration message

**Implementation checklist (Option B recommended for safety):**
- [ ] Update getBrandEmployees() to return 410 Gone
- [ ] Response body includes migration instructions
- [ ] Log deprecation warning
- [ ] Update route comment: "DEPRECATED - Use GET /api/employees?branchId=xxx"
- [ ] Test: Endpoint returns 410 with clear message
- [ ] Verify GET /api/employees?branchId works correctly

**Success criteria:**
- Endpoint returns 410 Gone
- Error message includes: "Use GET /api/employees?branchId={id}"
- No breaking changes for systems using new endpoint

**Commit format:**
```bash
git commit -m "refactor(brands): deprecate GET /brands/:id/employees

- Return 410 Gone with migration instructions
- Redirect users to GET /api/employees?branchId=xxx
- Refs: 01-BUSINESS-LOGIC § 7.2
- Related: API refactoring March 20, 2026"
```

---

### 🔴 PRIORITY 1 - Critical Security (Before Production)

#### SECURITY-001: Disable DevTools in production ⏳

**Status:** 📋 Ready to implement  
**Related docs updated:** ✅ 03-API-REFERENCE.md § 11  
**Related issues:** Issue #14 (DevTools exposed)  
**Blocking:** None  
**Effort estimate:** 30 phút

**Documentation references:**
- [05-KNOWN-ISSUES.md § 14](05-KNOWN-ISSUES.md#14-devtools-endpoints-exposed-in-production-🔴) - Full issue description
- [03-API-REFERENCE.md § DEV TOOLS](03-API-REFERENCE.md#1️⃣1️⃣-dev-tools)

**Files to UPDATE:**
- `src/routes/index.js` - Conditional registration
- `src/routes/devToolsRoutes.js` - Add environment check middleware
- `.env.production` - Add NODE_ENV=production

**Implementation checklist:**
- [ ] Add environment check in index.js (Option 1)
- [ ] OR add middleware in devToolsRoutes.js (Option 2)
- [ ] Create .env.production with NODE_ENV=production
- [ ] Test: DevTools work in development (NODE_ENV=development)
- [ ] Test: DevTools blocked in production (403 Forbidden)
- [ ] Verify GET /api/dev/accounts returns 403
- [ ] Verify POST /api/dev/quick-login returns 403

**Code snippet (Option 1 - Recommended):**
```javascript
// src/routes/index.js
if (process.env.NODE_ENV === 'development') {
  app.use('/api/dev', devToolsRoutes);
  console.log('⚠️  DevTools enabled (development mode)');
} else {
  console.log('✅ DevTools disabled (production mode)');
}
```

**Success criteria:**
- Production build has no /api/dev endpoints
- Development build works normally
- Clear console messages about DevTools status

**Commit format:**
```bash
git commit -m "fix(security): disable DevTools endpoints in production

- Add NODE_ENV check in routes registration
- Create .env.production with production config
- Prevent authentication bypass in production
- Fixes: Issue #14
- Priority: CRITICAL"
```

---

### 🟡 PRIORITY 2 - Performance & Quality

#### PERF-001: Add database indexes ⏳

**Status:** 📋 Ready to implement  
**Related docs updated:** N/A (code-only)  
**Related issues:** Issue #10 (Database indexes)  
**Blocking:** None  
**Effort estimate:** 1-2 giờ

**Files to UPDATE:**
- `src/models/UserTask.js` - Add 3 indexes
- `src/models/StoreTask.js` - Add 2 indexes  
- `src/models/Notification.js` - Add 1 index

**Implementation checklist:**
- [ ] Add UserTask indexes (employeeId, storeTaskId+status, broadcastId+employeeId)
- [ ] Add StoreTask indexes (managerId, broadcastId+storeId)
- [ ] Add Notification index (userId+isRead)
- [ ] Test query performance before/after
- [ ] Verify unique constraints work correctly
- [ ] Document index purposes in code comments

**Commit format:**
```bash
git commit -m "perf(db): add indexes for frequently queried fields

- UserTask: employeeId, storeTaskId+status, broadcastId+employeeId
- StoreTask: managerId, broadcastId+storeId
- Notification: userId+isRead
- Resolves: Issue #10"
```

---

## �📊 THỐNG KÊ VÀ ƯU TIÊN

### Theo mức độ nghiêm trọng:

| Mức độ | Đã sửa | Chưa sửa | Tổng |
|--------|--------|----------|------|
| 🔴 CRITICAL | 2 | 1 | 3 |
| 🟡 HIGH | 2 | 2 | 4 |
| 🟢 MEDIUM | 0 | 6 | 6 |
| ⚪ LOW | 0 | 3 | 3 |
| **TỔNG** | **4** | **12** | **16** |

### Roadmap sửa lỗi đề xuất:

**🚀 Implementation Queue (Ready to Code):**
- See [IMPLEMENTATION QUEUE](#-implementation-queue-ready-to-code) section above for detailed specs

**Sprint 0 (Trước Production) - CRITICAL:**
- SECURITY-001: Disable DevTools in production - 30 phút ⚡
- REFACTOR-001: Implement /api/admin routes - 2-3 giờ
- REFACTOR-002: Deprecate old routes - 30 phút
- REFACTOR-003: Remove /brands/:id/employees - 1 giờ

**Sprint 1 (Week 1) - HIGH:**
- PERF-001: Add database indexes - 1-2 giờ
- #13: Setup tests infrastructure (HIGH)
- #5: Implement recurring broadcast scheduler (HIGH)

**Sprint 2 (Week 2) - MEDIUM:**
- #8: Implement rate limiting (MEDIUM)
- #6: Thay console.log bằng proper logger (MEDIUM)
- #7: Add input sanitization (MEDIUM)

**Sprint 3 (Week 3) - LOW:**
- #9: Implement refresh token (LOW)
- #11: Standardize validators (LOW)
- #12: Add Swagger documentation (LOW)

**Tổng effort ước tính:** 
- Implementation Queue: ~5-7 giờ (P0-P1)
- Known Issues: ~52-72 giờ
- **Grand Total:** ~57-79 giờ (~2-3 tuần với 1 developer)

---

## 🔍 GHI CHÚ AUDIT

**Phương pháp audit:**
1. Đọc toàn bộ controllers, models, helpers
2. Grep search cho TODO/FIXME/BUG comments
3. Review conversation history cho bugs đã report
4. Kiểm tra security best practices
5. Kiểm tra performance patterns

**Files đã review:**
- 10 controllers
- 7 models
- 3 helpers
- 10 routes
- 4 validators
- 3 services
- 2 middlewares
- 1 config

**Không review:**
- Frontend code (ngoài scope)
- Infrastructure/DevOps (ngoài scope)

---

## 📝 IMPLEMENTATION QUEUE NOTES

**Purpose:** Bridge giữa documentation và implementation  
**Lifecycle:** Issue/Enhancement → Queue → Implementation → Bugs Đã Sửa

**How to use:**
1. **For AI implementation:** 
   ```
   "Implement REFACTOR-001 from 05-KNOWN-ISSUES.md § Implementation Queue"
   ```
2. **For developers:**
   - Read task spec trong Implementation Queue
   - Create feature branch: `feature/TASK-ID-description`
   - Follow checklist
   - Commit theo format đã định
   - Move task to "Bugs Đã Sửa" when done

**Queue management:**
- ⏳ = Ready to implement
- 🔗 = Blocked by other tasks
- ✅ = Completed (move to "Bugs Đã Sửa")

**Maintenance:**
- Review queue mỗi sprint
- Update priorities khi cần
- Archive completed tasks to CHANGELOG

---

**KẾT THÚC AUDIT KNOWN ISSUES**
