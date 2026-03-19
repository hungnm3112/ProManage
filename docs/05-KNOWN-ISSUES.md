# 05 - AUDIT CÁC VẤN ĐỀ ĐÃ BIẾT

**Ngày audit:** 19/03/2026  
**Cập nhật cuối:** 20/03/2026 (Phase 6)  
**Mục đích:** Ghi chép tất cả bugs, workarounds, technical debt  
**Phạm vi:** Toàn bộ codebase

---

## 📊 TỔNG QUAN

**Tổng số vấn đề:** 14
- ✅ Đã sửa: 4
- ⚠️ Known Issues: 6
- 🔧 Technical Debt: 4

**Mức độ ưu tiên:**
- 🔴 CRITICAL: 1 (DevTools - chỉ critical nếu production)
- 🟡 HIGH: 2
- 🟢 MEDIUM: 8
- ⚪ LOW: 3

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

### 2. Dashboard dùng sai UserTask ID ✅

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

## 📊 THỐNG KÊ VÀ ƯU TIÊN

### Theo mức độ nghiêm trọng:

| Mức độ | Đã sửa | Chưa sửa | Tổng |
|--------|--------|----------|------|
| 🔴 CRITICAL | 2 | 1 | 3 |
| 🟡 HIGH | 2 | 2 | 4 |
| 🟢 MEDIUM | 0 | 6 | 6 |
| ⚪ LOW | 0 | 3 | 3 |
| **TỔNG** | **4** | **12** | **16** |

### Roadmap sửa lỗi đề xuất:

**Sprint 0 (Trước Production):**
- #14: Disable DevTools in production (CRITICAL) - 30 phút

**Sprint 1 (Week 1):**
- #13: Setup tests infrastructure (HIGH)
- #5: Implement recurring broadcast scheduler (HIGH)
- #10: Thêm database indexes (MEDIUM)

**Sprint 2 (Week 2):**
- #8: Implement rate limiting (MEDIUM)
- #6: Thay console.log bằng proper logger (MEDIUM)
- #7: Add input sanitization (MEDIUM)

**Sprint 3 (Week 3):**
- #9: Implement refresh token (LOW)
- #11: Standardize validators (LOW)
- #12: Add Swagger documentation (LOW)

**Tổng effort ước tính:** 52-72 giờ (~2-3 tuần với 1 developer)

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

**KẾT THÚC AUDIT KNOWN ISSUES**
