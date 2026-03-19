# 03 - AUDIT LOGIC NGHIỆP VỤ (HIỆN TẠI)

**Ngày audit:** 19/03/2026  
**Mục đích:** Ghi chép logic nghiệp vụ thực tế đang chạy trong code  
**Phạm vi:** Tất cả controllers trong `src/controllers/`

---

## 📊 TỔNG QUAN

**Controllers đã rà soát:** 10
- ✅ authController.js
- ✅ broadcastController.js
- ✅ storeTaskController.js
- ✅ userTaskController.js
- ✅ reviewController.js
- ✅ dashboardController.js
- ⛔ employeeController.js (CHỈ ĐỌC)
- ⛔ brandController.js (CHỈ ĐỌC)
- ✅ notificationController.js
- ✅ uploadController.js

**Khái niệm chính:**
- **Cấu trúc dữ liệu:** Broadcast → StoreTask → UserTask
- **Collections chỉ đọc:** Employee, Brand (Branch), GroupUser (từ hệ thống ngoài)
- **Collections có thể ghi:** Broadcast, StoreTask, UserTask, Notification
- **Hệ thống vai trò:** admin, manager, employee (từ GroupUser)
- **Xác thực:** Phone + HMAC-SHA512 với Salt

---

## 🔐 QUY TRÌNH 1: XÁC THỰC & PHÂN QUYỀN

**File:** `src/controllers/authController.js`  
**Trạng thái:** ✅ Hoạt động

### 1.1 Quy trình đăng nhập

**Endpoint:** `POST /api/auth/login`  
**Quyền truy cập:** Công khai

**Kiểm tra đầu vào:**
- `phone` bắt buộc
- `password` bắt buộc

**Quy trình xử lý:**
1. Tìm Employee theo Phone (bao gồm Password + Salt)
2. Populate ID_GroupUser và ID_Branch
3. Kiểm tra nhân viên đang hoạt động (Status === 'Đang hoạt động')
4. Xác minh mật khẩu dùng SHA-512 + Salt (KHÔNG dùng bcrypt)
   - Dùng helper `verifyPassword(employee, password)`
5. Lấy vai trò từ GroupUser (admin/manager/employee)
6. Tạo JWT token với `generateToken(employee)`
7. Trả về token + thông tin nhân viên (loại bỏ thông tin nhạy cảm)

**Quy tắc nghiệp vụ:**
- Không đăng nhập được với tài khoản không hoạt động → 403
- Sai phone/password → 401 (cùng message để bảo mật)
- Xác minh mật khẩu dùng HMAC-SHA512 + salt riêng mỗi nhân viên

**Dữ liệu trả về:**
```javascript
{
  success: true,
  token: "JWT_TOKEN",
  employee: {
    _id, phone, fullName, email, role, 
    branchId, branchName, groupUser, image, status
  }
}
```

### 1.2 Lấy thông tin người dùng hiện tại

**Endpoint:** `GET /api/auth/me`  
**Quyền truy cập:** Riêng tư (tất cả vai trò)

**Quy trình:**
1. Lấy userId từ `req.user` (được set bởi authenticate middleware)
2. Tìm Employee và populate GroupUser + Branch
3. Lấy vai trò từ GroupUser
4. Trả về thông tin nhân viên

**Quy tắc nghiệp vụ:**
- Yêu cầu JWT token hợp lệ
- Trả về 404 nếu không tìm thấy nhân viên (tài khoản đã xóa)

### 1.3 Đăng xuất

**Endpoint:** `POST /api/auth/logout`  
**Quyền truy cập:** Riêng tư

**Quy trình:**
- JWT stateless, xử lý đăng xuất ở client (xóa token)
- Server chỉ trả về success message

---

## 📢 QUY TRÌNH 2: QUẢN LÝ BROADCAST

**File:** `src/controllers/broadcastController.js`  
**Trạng thái:** ✅ Hoạt động

### 2.1 Tạo Broadcast (Bản nháp)

**Endpoint:** `POST /api/broadcasts`  
**Quyền:** Riêng tư (chỉ admin)

**Dữ liệu đầu vào:**
- title (bắt buộc)
- description
- priority (low/medium/high)
- deadline (Date)
- assignedStores (mảng Brand IDs)
- checklist (mảng các task)
- attachments (mảng URLs)
- recurring (mẫu weekly/monthly)

**Quy trình:**
1. Tạo Broadcast với status='draft'
2. Set createdBy = người dùng hiện tại
3. Lưu vào database
4. Populate creator và stores
5. Trả về broadcast

**Quy tắc nghiệp vụ:**
- Tất cả broadcast mới đều bắt đầu ở trạng thái 'draft'
- Chỉ có thể edit khi ở draft (trừ admin)
- assignedStores là Brand (Branch) IDs

### 2.2 Lấy danh sách Broadcast

**Endpoint:** `GET /api/broadcasts`  
**Quyền:** Riêng tư (chỉ admin)

**Bộ lọc:**
- status (draft/active/completed/cancelled)
- priority (low/medium/high)
- createdBy (Employee ID)
- page, limit (phân trang)

**Quy trình:**
1. Xây dựng filter dựa trên query params
2. Thực thi với phân trang
3. Populate createdBy và assignedStores
4. Sắp xếp mới nhất trước
5. Trả về với metadata phân trang

### 2.3 Lấy chi tiết Broadcast

**Endpoint:** `GET /api/broadcasts/:id`  
**Quyền:** Riêng tư (chỉ admin)

**Quy trình:**
1. Tìm broadcast theo ID
2. Populate createdBy, assignedStores, store_tasks
3. Nếu không phải draft, tính stats dùng `broadcast.getStats()`
4. Trả về broadcast + stats

**Stats bao gồm:**
- Tổng số stores
- Số lượng accepted/rejected/pending
- Tỷ lệ hoàn thành
- v.v.

### 2.4 Cập nhật Broadcast

**Endpoint:** `PUT /api/broadcasts/:id`  
**Quyền:** Riêng tư (chỉ admin)

**Các trường được phép cập nhật:**
- title, description, priority, deadline
- assignedStores, checklist, attachments
- recurring

**Quy tắc nghiệp vụ:**
- Admin luôn có thể edit
- Non-admin chỉ edit draft (dùng `broadcast.canEdit()`)
- Không thay đổi status trực tiếp (dùng publish/delete endpoints)
- Không edit broadcast đã published/completed (trừ admin)

**Quy trình:**
1. Tìm broadcast
2. Kiểm tra quyền (admin hoặc draft status)
3. Filter updates chỉ các trường cho phép
4. Apply updates
5. Lưu và trả về

### 2.5 Xóa Broadcast

**Endpoint:** `DELETE /api/broadcasts/:id`  
**Quyền:** Riêng tư (chỉ admin)

**Quy tắc nghiệp vụ:**
- Chỉ xóa được draft (dùng `broadcast.canDelete()`)
- Không xóa được broadcast đã published/active
- Chỉ xóa document broadcast (không cascade sang StoreTasks)

### 2.6 Phát hành Broadcast ⭐

**Endpoint:** `POST /api/broadcasts/:id/publish`  
**Quyền:** Riêng tư (chỉ admin)

**Quy trình:**
1. Tìm broadcast và populate assignedStores
2. Kiểm tra `broadcast.canPublish()`:
   - Phải ở trạng thái draft
   - Phải có assignedStores
3. Cập nhật broadcast:
   - status = 'active'
   - publishedAt = hiện tại
4. **Tạo StoreTask cho mỗi store được assign:**
   - Tìm manager của store (Employee với ID_Branch=store VÀ GroupUser=vai trò manager)
   - Tạo StoreTask:
     - broadcastId, storeId, managerId
     - status = 'pending'
   - Bỏ qua nếu không tìm thấy manager (log warning)
5. **Gửi notification cho tất cả managers**
6. Trả về broadcast + creation stats

**Quy tắc nghiệp vụ:**
- Phải có ít nhất một store được assign
- Mỗi store nhận một StoreTask
- Chỉ manager đang hoạt động nhận task
- Nếu không tìm thấy manager cho store, bỏ qua tạo StoreTask
- Rollback broadcast status về draft nếu có lỗi

**Tác động:**
- Tạo N StoreTask documents (N = số lượng stores được assign)
- Gửi N notifications cho managers
- Chuyển broadcast status từ draft → active

### 2.7 Giao việc Broadcast ⭐

**Endpoint:** `POST /api/broadcasts/:id/assign`  
**Quyền:** Riêng tư (chỉ admin)

**Hai chế độ giao việc:**

#### Chế độ 1: Giao cho Stores với Nhân viên cụ thể

**Dữ liệu đầu vào:**
```javascript
{
  storeAssignments: [
    { storeId: "...", employeeIds: ["...", "..."] }
  ]
}
```

**Quy trình mỗi store:**
1. Tìm store (Brand)
2. Tìm manager cho StoreTask (hoặc dùng nhân viên đầu tiên làm fallback)
3. Kiểm tra StoreTask đã tồn tại cho broadcast+store này chưa:
   - Nếu tồn tại VÀ đã có assignees → Từ chối (đề xuất edit)
   - Nếu tồn tại VÀ chưa có assignees → Cập nhật assignedEmployees
   - Nếu chưa tồn tại → Tạo StoreTask mới
4. **Tạo UserTask cho mỗi employeeId:**
   - Kiểm tra UserTask đã tồn tại cho broadcast+employee chưa
   - Nếu tồn tại → Bỏ qua với error message
   - Sao chép checklist từ broadcast
   - Tạo UserTask với status='assigned'
5. Thêm employeeIds vào StoreTask.assignedEmployees
6. Cập nhật StoreTask status thành 'in_progress' nếu đang 'accepted'
7. Gửi notification cho mỗi nhân viên được assign

**Quy tắc nghiệp vụ:**
- Không giao cùng nhân viên cho cùng broadcast hai lần
- Tất cả nhân viên phải thuộc cùng branch với store
- Nhân viên phải đang hoạt động (Status='Đang hoạt động')
- Nếu store đã được giao cho người khác → Error message

#### Chế độ 2: Giao cho Nhân viên riêng lẻ

**Dữ liệu đầu vào:**
```javascript
{
  employeeIds: ["...", "...", "..."]
}
```

**Quy trình mỗi nhân viên:**
1. Tìm employee
2. Kiểm tra employee đang hoạt động và có branch
3. Kiểm tra UserTask đã tồn tại → Bỏ qua với error
4. Tìm hoặc tạo StoreTask cho branch của nhân viên:
   - Tìm manager của branch đó
   - Dùng employee làm fallback nếu không có manager
   - Tạo StoreTask nếu chưa tồn tại
5. Tạo UserTask cho employee
6. Thêm employee vào StoreTask.assignedEmployees

**Quy tắc nghiệp vụ:**
- Employee phải có ID_Branch   
- Employee phải đang hoạt động
- Không giao cùng broadcast cho cùng employee hai lần
- Tạo/dùng StoreTask cho branch của employee

**Bước cuối cùng:**
- Nếu broadcast status='draft' VÀ có UserTasks được tạo → Cập nhật thành 'active'
- Trả về tổng kết: số lượng created + errors/warnings

### 2.8 Cập nhật UserTask (Chuyển giao) ⭐

**Endpoint:** `PUT /api/broadcasts/user-tasks/:taskId`  
**Quyền:** Riêng tư (chỉ admin)

**Mục đích:** Admin có thể edit UserTask và chuyển giao cho nhân viên khác

**Dữ liệu đầu vào:**
- employeeId (để chuyển giao)
- title, description, priority, deadline (để edit broadcast)
- checklist (để cập nhật task checklist)

**Quy trình:**
1. Tìm UserTask theo taskId
2. Kiểm tra task đã hoàn thành chưa → Không edit được task đã hoàn thành
3. **Nếu chuyển giao (employeeId thay đổi):**
   a. Tìm nhân viên mới, kiểm tra:
      - Employee tồn tại
      - Employee đang hoạt động
      - Employee chưa có task này
   b. **Lưu tham chiếu nhân viên cũ** (quan trọng!)
   c. Cập nhật userTask.employeeId thành nhân viên mới
   d. **Nếu nhân viên mới ở branch khác:**
      - Tìm/tạo StoreTask cho branch mới
      - Xóa nhân viên cũ khỏi StoreTask cũ.assignedEmployees
      - Thêm nhân viên mới vào StoreTask mới.assignedEmployees
      - Cập nhật userTask.storeTaskId thành StoreTask mới
4. **Nếu edit các trường broadcast:**
   - Cập nhật document Broadcast (title, description, priority, deadline, checklist)
   - Cập nhật UserTask.checklist khớp với broadcast checklist mới
5. Lưu thay đổi

**Quy tắc nghiệp vụ:**
- Không edit được task đã approved
- Không chuyển giao nếu nhân viên mới đã có task này
- Phải dùng UserTask._id (không phải StoreTask._id)
- Chuyển giao cross-branch cập nhật cả hai StoreTasks
- Cập nhật checklist reset isCompleted thành false

**Lịch sử bug:**
- ✅ ĐÃ SỬA 18/03/2026: Dashboard dùng sai ID (StoreTask._id thay vì UserTask._id)
- ✅ ĐÃ SỬA 18/03/2026: Logic chuyển giao giờ lưu tham chiếu oldEmployee trước khi cập nhật

### 2.9 Xóa UserTask ⭐

**Endpoint:** `DELETE /api/broadcasts/user-tasks/:taskId`  
**Quyền:** Riêng tư (chỉ admin)

**Quy trình:**
1. Tìm UserTask theo taskId
2. Kiểm tra đã hoàn thành chưa → Không xóa được task đã hoàn thành
3. **Xóa employee khỏi StoreTask.assignedEmployees**
4. **Nếu StoreTask không còn assignedEmployees:**
   - Xóa luôn StoreTask (dọn dẹp)
5. Xóa UserTask

**Quy tắc nghiệp vụ:**
- Không xóa được task đã approved (đề xuất truy cập trực tiếp database nếu cần)
- Phải dùng UserTask._id (không phải StoreTask._id)
- Cascade sang StoreTask nếu rỗng

**Lịch sử bug:**
- ✅ ĐÃ SỬA 18/03/2026: Dùng sai ID (StoreTask._id thay vì UserTask._id)

---

## 📦 QUY TRÌNH 3: QUẢN LÝ STORE TASK

**File:** `src/controllers/storeTaskController.js`  
**Trạng thái:** ✅ Hoạt động

### 3.1 Lấy danh sách Store Tasks

**Endpoint:** `GET /api/store-tasks`  
**Quyền:** Riêng tư (admin, manager)

**Bộ lọc:**
- status (pending/accepted/rejected/in_progress/completed)
- broadcastId
- page, limit

**Quy tắc nghiệp vụ:**
- Manager CHỈ xem task của store mình
  - Filter: storeId = manager's ID_Branch
- Admin xem tất cả tasks

**Populations:**
- broadcastId (title, description, priority, deadline, status)
- storeId (Name, Map_Address, Phone)
- managerId (FullName, Phone, Email)
- assignedEmployees (FullName, Phone)

### 3.2 Lấy chi tiết Store Task

**Endpoint:** `GET /api/store-tasks/:id`  
**Quyền:** Riêng tư (admin, manager)

**Quy tắc nghiệp vụ:**
- Manager chỉ xem task từ store của mình (kiểm tra ID_Branch)

**Response bao gồm:**
- Dữ liệu storeTask đầy đủ
- Stats từ `storeTask.getStats()`
- Cờ isOverdue từ `storeTask.isOverdue()`

### 3.3 Chấp nhận Store Task

**Endpoint:** `PUT /api/store-tasks/:id/accept`  
**Quyền:** Riêng tư (chỉ manager)

**Quy trình:**
1. Tìm StoreTask
2. Xác minh người gọi là manager được assign
3. Kiểm tra `storeTask.canAccept()`:
   - Phải ở trạng thái 'pending'
4. Cập nhật:
   - status = 'accepted'
   - acceptedAt = hiện tại
5. Lưu và trả về

**Quy tắc nghiệp vụ:**
- Chỉ manager được assign mới accept được
- Chỉ accept được pending tasks
- KHÔNG chuyển sang in_progress (điều đó xảy ra khi nhân viên được assign)

### 3.4 Từ chối Store Task

**Endpoint:** `PUT /api/store-tasks/:id/reject`  
**Quyền:** Riêng tư (chỉ manager)

**Dữ liệu đầu vào:** rejectedReason (bắt buộc)

**Quy trình:**
1. Kiểm tra rejectedReason không rỗng
2. Tìm StoreTask
3. Xác minh người gọi là manager được assign
4. Kiểm tra `storeTask.canReject()`:
   - Phải ở trạng thái 'pending'
5. Cập nhật:
   - status = 'rejected'
   - rejectedReason = lý do
   - rejectedAt = hiện tại
6. Lưu và trả về

**Quy tắc nghiệp vụ:**
- Chỉ manager được assign mới reject được
- Lý do từ chối là bắt buộc
- Chỉ reject được pending tasks

### 3.5 Giao nhân viên cho Task

**Endpoint:** `POST /api/store-tasks/:id/assign`  
**Quyền:** Riêng tư (chỉ manager)

**Dữ liệu đầu vào:** employeeIds (mảng)

**Quy trình:**
1. Kiểm tra mảng employeeIds không rỗng
2. Tìm StoreTask và populate broadcast
3. Xác minh người gọi là manager được assign
4. Kiểm tra task status = 'accepted' (phải accept trước khi giao)
5. **Với mỗi employeeId:**
   a. Tìm employee
   b. Kiểm tra:
      - Employee tồn tại
      - Employee thuộc cùng branch với StoreTask
      - Employee đang hoạt động
   c. Kiểm tra employee đã được assign chưa (bỏ qua nếu tồn tại)
   d. **Sao chép checklist từ broadcast:**
      - Map broadcast.checklist sang UserTask.checklist
      - Set isCompleted=false cho tất cả items
   e. **Tạo UserTask:**
      - storeTaskId, broadcastId, employeeId
      - checklist (copied from broadcast)
      - status = 'assigned'
      - evidences = []
   f. Gửi notification cho employee
6. **Cập nhật StoreTask:**
   - Thêm employeeIds mới vào assignedEmployees (tránh trùng)
   - Cập nhật status thành 'in_progress' nếu đang 'accepted'
   - Set startedAt = hiện tại
7. Trả về tổng kết + userTasks đã tạo

**Quy tắc nghiệp vụ:**
- Task phải được accepted trước khi giao nhân viên
- Tất cả nhân viên phải thuộc cùng branch với store
- Tất cả nhân viên phải đang hoạt động
- Bỏ qua nếu nhân viên đã được assign (không tạo UserTasks trùng)
- Checklist được copy từ Broadcast tại thời điểm assign

**Tác động:**
- Tạo N UserTask documents
- Gửi N notifications
- Chuyển StoreTask từ 'accepted' → 'in_progress'

---

## ✅ QUY TRÌNH 4: THỰC HIỆN USER TASK (Nhân viên)

**File:** `src/controllers/userTaskController.js`  
**Trạng thái:** ✅ Hoạt động

### 4.1 Lấy danh sách Task của tôi

**Endpoint:** `GET /api/my-tasks`  
**Quyền:** Riêng tư (employee)

**Bộ lọc:**
- status (assigned/in_progress/submitted/approved/rejected)
- page, limit

**Quy trình:**
1. Filter: employeeId = người dùng hiện tại
2. Apply status filter nếu chỉ định
3. Populate broadcastId và storeTaskId với storeId
4. Sắp xếp mới nhất trước
5. Thêm stats cho mỗi task dùng `task.getStats()`

**Stats bao gồm:**
- Tổng số checklist items
- Số items đã hoàn thành
- Số items bắt buộc
- Tỷ lệ tiến độ
- v.v.

### 4.2 Lấy chi tiết Task

**Endpoint:** `GET /api/my-tasks/:id`  
**Quyền:** Riêng tư (employee)

**Quy tắc nghiệp vụ:**
- Nhân viên CHỈ xem task của mình
  - Kiểm tra: userTask.employeeId === người dùng hiện tại

**Populations:**
- broadcastId (chi tiết đầy đủ bao gồm attachments)
- storeTaskId → storeId (chi tiết branch)
- employeeId (chi tiết nhân viên)

### 4.3 Cập nhật Checklist

**Endpoint:** `PUT /api/my-tasks/:id/checklist`  
**Quyền:** Riêng tư (employee)

**Dữ liệu đầu vào:**
```javascript
{
  checklist: [
    { _id: "item_id", isCompleted: true },
    { _id: "item_id2", isCompleted: false }
  ]
}
```

**Quy trình:**
1. Kiểm tra checklist là mảng
2. Tìm UserTask
3. Xác minh quyền sở hữu (kiểm tra employeeId)
4. Kiểm tra `userTask.canUpdate()`:
   - Có thể cập nhật nếu status là assigned/in_progress/rejected
   - Không cập nhật được nếu submitted/approved
5. **Cập nhật mỗi checklist item:**
   - Tìm item theo _id
   - Cập nhật isCompleted
   - Nếu hoàn thành: set completedAt = hiện tại
   - Nếu bỏ hoàn thành: set completedAt = null
6. **Tự động cập nhật status:**
   - Nếu status='assigned' → Chuyển sang 'in_progress'
7. Lưu và trả về

**Quy tắc nghiệp vụ:**
- Chỉ cập nhật được task của mình  
- Không cập nhật được task đã submitted/approved
- Lần cập nhật checklist đầu tiên tự động chuyển status sang in_progress
- Timestamps theo dõi khi mỗi item được hoàn thành

### 4.4 Upload minh chứng

**Endpoint:** `POST /api/my-tasks/:id/evidence`  
**Quyền:** Riêng tư (employee)

**Dữ liệu đầu vào:**
```javascript
{
  evidences: [
    { type: "photo", url: "...", filename: "..." },
    { type: "video", url: "...", filename: "..." }
  ]
}
```

**Kiểm tra:**
- evidences phải là mảng không rỗng
- Mỗi evidence phải có: type, url, filename
- type phải là: photo/video/document/file

**Quy trình:**
1. Tìm UserTask
2. Xác minh quyền sở hữu
3. Kiểm tra `userTask.canUpdate()` (giống checklist)
4. **Thêm evidences vào mảng:**
   - Push mỗi evidence với uploadedAt timestamp
5. **Tự động cập nhật status:**
   - Nếu status='assigned' → Chuyển sang 'in_progress'
6. Lưu và trả về

**Quy tắc nghiệp vụ:**
- Chỉ cập nhật được task của mình
- Không upload được lên task đã submitted/approved
- URL minh chứng đến từ upload endpoint
- Không giới hạn số lượng evidences

### 4.5 Nộp Task để duyệt

**Endpoint:** `POST /api/my-tasks/:id/submit`  
**Quyền:** Riêng tư (employee)

**Dữ liệu đầu vào:** overallNote (tùy chọn)

**Quy trình:**
1. Tìm UserTask và populate broadcast và storeTask
2. Xác minh quyền sở hữu
3. Kiểm tra `userTask.canSubmit()`:
   - Tất cả checklist items **bắt buộc** phải hoàn thành
   - Status phải là in_progress hoặc rejected
4. Cập nhật UserTask:
   - status = 'submitted'
   - submittedAt = hiện tại
   - overallNote = ghi chú (nếu có)
5. **Cập nhật StoreTask status:**
   - Nếu StoreTask status='accepted' → Chuyển sang 'in_progress'
   - Set startedAt = hiện tại
6. **Gửi notification cho manager**
7. Trả về task

**Quy tắc nghiệp vụ:**
- Không nộp được nếu các item bắt buộc chưa hoàn thành
- Có thể nộp lại nếu trước đó bị rejected
- Lần nộp đầu tiên từ bất kỳ nhân viên nào chuyển StoreTask sang in_progress
- Manager nhận notification để duyệt

**Kiểm tra (canSubmit):**
```javascript
// Pseudo-code
requiredItems = checklist.filter(item => item.required)
allRequiredCompleted = requiredItems.every(item => item.isCompleted)

if (!allRequiredCompleted) {
  return { canSubmit: false, reason: "Required items not completed" }
}
```

---

## 👍 QUY TRÌNH 5: DUYỆT TASK & PHÊ DUYỆT (Manager)

**File:** `src/controllers/reviewController.js`  
**Trạng thái:** ✅ Hoạt động

### 5.1 Lấy danh sách chờ duyệt

**Endpoint:** `GET /api/reviews/pending`  
**Quyền:** Riêng tư (manager)

**Quy trình:**
1. Tìm tất cả StoreTasks do manager hiện tại quản lý
2. Lấy storeTaskIds
3. **Query UserTasks:**
   - storeTaskId in storeTaskIds
   - status = 'submitted'
4. Populate employeeId, broadcastId, storeTaskId→storeId
5. Sắp xếp cũ nhất trước (submittedAt tăng dần)
6. Thêm stats cho mỗi task
7. Trả về với phân trang

**Quy tắc nghiệp vụ:**
- Manager chỉ xem duyệt từ store của mình
- Sắp xếp cũ nhất trước (FIFO review)

### 5.2 Phê duyệt Task

**Endpoint:** `POST /api/reviews/:taskId/approve`  
**Quyền:** Riêng tư (manager)

**Dữ liệu đầu vào:**
- rating (1-5)
- reviewNote (tùy chọn)

**Quy trình:**
1. Tìm UserTask và populate storeTask
2. Xác minh manager sở hữu task này (kiểm tra storeTask.managerId)
3. Kiểm tra `userTask.canReview()`:
   - Status phải là 'submitted'
4. Cập nhật UserTask:
   - status = 'approved'
   - rating = rating
   - reviewNote = ghi chú
   - reviewedAt = hiện tại
5. **Gọi `checkStoreTaskCompletion(storeTaskId)`:**
   - Lấy tất cả UserTasks cho StoreTask này
   - Nếu TẤT CẢ đều approved:
     - Cập nhật StoreTask status = 'completed'
     - Set completedAt = hiện tại
     - Tính completionRate = 100%
   - Ngược lại:
     - Cập nhật completionRate = (approved / total) * 100
6. **Gửi notification cho nhân viên** (phê duyệt)
7. Trả về task

**Quy tắc nghiệp vụ:**
- Chỉ manager được assign mới approve được
- Chỉ approve được submitted tasks
- Lưu rating 1-5
- Tự động hoàn thành StoreTask khi tất cả UserTasks được approved
- Completion rate theo dõi tiến độ

**Helper: checkStoreTaskCompletion()**
- Tìm tất cả UserTasks cho StoreTask
- Kiểm tra tất cả đã approved chưa
- Cập nhật StoreTask status và completionRate
- Chạy sau mỗi approve/reject

### 5.3 Từ chối Task

**Endpoint:** `POST /api/reviews/:taskId/reject`  
**Quyền:** Riêng tư (manager)

**Dữ liệu đầu vào:** reviewNote (bắt buộc)

**Quy trình:**
1. Kiểm tra reviewNote không rỗng
2. Tìm UserTask và populate storeTask
3. Xác minh manager sở hữu task này
4. Kiểm tra `userTask.canReview()` (status='submitted')
5. Cập nhật UserTask:
   - status = 'rejected'
   - reviewNote = ghi chú
   - reviewedAt = hiện tại
6. Gọi `checkStoreTaskCompletion()` (cập nhật completion rate)
7. **Gửi notification cho nhân viên** (từ chối kèm lý do)
8. Trả về task

**Quy tắc nghiệp vụ:**
- Ghi chú duyệt là bắt buộc cho từ chối
- Nhân viên có thể nộp lại sau khi sửa vấn đề
- Task quay về nhân viên (chưa chuyển về in_progress)
- Nhân viên phải cập nhật và nộp lại

---

## 📊 QUY TRÌNH 6: PHÂN TÍCH DASHBOARD

**File:** `src/controllers/dashboardController.js`  
**Trạng thái:** ✅ Hoạt động

### 6.1 Dashboard Admin

**Endpoint:** `GET /api/dashboard/admin`  
**Quyền:** Riêng tư (chỉ admin)

**Dữ liệu trả về:**

**Thống kê tổng quan:**
- totalBroadcasts (tổng tất cả)
- activeBroadcasts (đã published, chưa quá hạn)
- completedThisMonth (tháng hiện tại)
- **Thẻ KPI (dựa trên StoreTask):**
  - completedTasks (StoreTask.status='completed')
  - overdueTasks (StoreTask chưa hoàn thành + broadcast quá deadline)
  - inProgressTasks (StoreTask.status='in_progress')
  - pendingConfirmTasks (StoreTask.status='pending')
- pendingReviews (UserTask.status='submitted')
- totalStores (số lượng Branch)
- totalEmployees (chỉ đang hoạt động)

**Phân bổ trạng thái:**
- Tổng hợp trạng thái Broadcast (draft/active/completed/cancelled)

**Phân bổ Task (tháng này):**
- Tổng hợp trạng thái UserTask (assigned/in_progress/submitted/approved/rejected)

**Top Stores hoạt động tốt (tháng này):**
- Stores sắp xếp theo completedTasks count
- Bao gồm avgCompletionRate
- Chỉ top 5

**Hoạt động gần đây:**
- 10 broadcasts cuối (mới nhất trước)
- Bao gồm title, status, priority, creator

**Tính toán:**
- Dùng MongoDB aggregation để hiệu quả
- Filter theo tháng hiện tại (startOfMonth đến endOfMonth)
- Join collections (lookup) cho tên store

### 6.2 Admin Tasks theo trạng thái

**Endpoint:** `GET /api/dashboard/admin/tasks/:status`  
**Quyền:** Riêng tư (chỉ admin)

**Tùy chọn trạng thái:**
- 'completed' - StoreTasks đã hoàn thành
- 'overdue' - Quá deadline, chưa hoàn thành
- 'in-progress' - Đang tiến hành
- 'pending-confirm' - Chờ manager chấp nhận

**Quy trình:**
1. Xây dựng query dựa trên status
2. **Với 'overdue':**
   - Tìm StoreTasks với status in [pending, accepted, in_progress]
   - Populate broadcastId
   - Filter broadcast.deadline < hiện tại
3. Với các loại khác: query StoreTask trực tiếp
4. **Với mỗi StoreTask:**
   - Tìm UserTask đầu tiên (để lấy userTaskId và employeeId)
   - Populate tên nhân viên
5. **Format response:**
   - broadcastTitle, storeName, managerName, employeeName
   - deadline, status, priority, completionPercent
   - **userTaskId** (cho reassign/delete operations)
   - Các timestamps khác nhau

**Quy tắc nghiệp vụ:**
- Trả về userTaskId (QUAN TRỌNG cho reassign/delete)
- Trả về employeeName hoặc "Chưa giao" nếu chưa assign
- Tính overdue dựa trên broadcast deadline
- Sắp xếp phù hợp theo status

**Lịch sử bug:**
- ✅ ĐÃ SỬA 18/03/2026: Thêm trường userTaskId và employeeName

### 6.3 Dashboard Manager

**Endpoint:** `GET /api/dashboard/manager`  
**Quyền:** Riêng tư (chỉ manager)

**Dữ liệu trả về:**

**Thống kê tổng quan:**
- totalTasks (StoreTasks của manager)
- Phân tích theo status: pending, accepted, in_progress, completed, rejected
- overdueTasks (quá deadline)
- pendingReviews (số lượng UserTasks đã submitted)

**Duyệt gần đây:**
- 5 UserTasks đã submitted cuối
- Bao gồm tên nhân viên, tiêu đề broadcast, priority, deadline

**Hiệu suất nhân viên (tháng này):**
- Tổng hợp UserTasks theo nhân viên
- Hiển thị số task theo status mỗi nhân viên
- Chỉ top 10 nhân viên

**Deadline sắp tới:**
- StoreTasks đến hạn trong 7 ngày tới
- Chưa hoàn thành
- Sắp xếp theo deadline (sớm nhất trước)
- Giới hạn 10

**Quy tắc nghiệp vụ:**
- Manager chỉ xem dữ liệu store của mình
- Thống kê hiệu suất tính theo tháng
- Cửa sổ deadline sắp tới = 7 ngày

### 6.4 Dashboard Nhân viên

**Endpoint:** `GET /api/dashboard/employee`  
**Quyền:** Riêng tư (chỉ employee)

**Dữ liệu trả về:**

**Thống kê tổng quan:**
- totalTasks (UserTasks của nhân viên)
- Phân tích theo status: assigned, in_progress, submitted, approved, rejected
- completedThisMonth (approved tháng này)
- avgRating (trung bình tất cả ratings nhận được)

**Đánh giá gần đây:**
- 5 task approved/rejected cuối với reviewNote
- Bao gồm tiêu đề broadcast, status, rating, ghi chú, reviewedAt

**Tasks quá hạn:**
- UserTasks chưa hoàn thành + broadcast quá deadline
- Sắp xếp theo deadline

**Tasks sắp tới:**
- Tasks đến hạn trong 7 ngày tới
- Sắp xếp theo deadline

**Quy tắc nghiệp vụ:**
- Nhân viên chỉ xem task của mình
- Trung bình rating tính từ task approved only
- Loại trừ feedback không có reviewNote

---

## ⛔ QUY TRÌNH 7: COLLECTIONS CHỈ ĐỌC

**Files:** 
- `src/controllers/employeeController.js`
- `src/controllers/brandController.js`

**Trạng thái:** ⛔ CHỈ ĐỌC (Nguồn dữ liệu ngoài)

### 7.1 Quản lý Nhân viên (CHỈ ĐỌC)

**Nguồn:** Hệ thống HR bên ngoài  
**Collection:** Employee  
**Quyền ProManage:** CHỈ ĐỌC

**Thao tác cho phép:**

**GET /api/employees**
- Liệt kê nhân viên với bộ lọc
- Query: role, branchId, status, search, page, limit
- Manager chỉ xem nhân viên branch mình
- Admin xem tất cả nhân viên

**GET /api/employees/:id**
- Lấy chi tiết nhân viên
- Populate ID_GroupUser và ID_Branch

**❌ CÁC THAO TÁC ĐÃ XÓA (19/03/2026):**
- ~~POST /api/employees~~ (tạo)
- ~~PUT /api/employees/:id~~ (cập nhật)
- ~~PATCH /api/employees/:id/status~~ (cập nhật trạng thái)
- ~~DELETE /api/employees/:id~~ (xóa)

**Quy tắc nghiệp vụ:**
- **KHÔNG THỂ tạo/cập nhật/xóa nhân viên**
- Dữ liệu Employee đồng bộ từ hệ thống HR ngoài
- ProManage chỉ ĐỌC dữ liệu employee để xác thực và giao việc
- Xác thực ĐỌC Employee.Password và Employee.Salt nhưng KHÔNG GHI

**Sử dụng trong ProManage:**
- Xác thực (đăng nhập)
- Giao task (tham chiếu employeeId)
- Kiểm soát truy cập Manager/admin
- Hiển thị chi tiết user trong UI

### 7.2 Quản lý Brand/Branch (CHỈ ĐỌC)

**Nguồn:** Hệ thống ERP bên ngoài  
**Collection:** Branch (tên model: Brand)  
**Quyền ProManage:** CHỈ ĐỌC

**Thao tác cho phép:**

**GET /api/brands**
- Liệt kê tất cả stores/branches
- Query: page, limit

**GET /api/brands/:id**
- Lấy chi tiết branch

**GET /api/brands/:id/employees**
- Lấy nhân viên của branch
- Dùng Employee collection với ID_Branch filter

**❌ CÁC THAO TÁC ĐÃ XÓA (19/03/2026):**
- ~~PUT /api/brands/:id~~ (cập nhật)
- ~~PATCH /api/brands/:id/manager~~ (assign manager)

**Quy tắc nghiệp vụ:**
- **KHÔNG THỂ tạo/cập nhật/xóa branches**
- Dữ liệu Branch đồng bộ từ hệ thống ERP ngoài
- ProManage chỉ ĐỌC dữ liệu branch để giao task
- Assign manager xử lý trong hệ thống ngoài

**Sử dụng trong ProManage:**
- Giao task cho stores
- Tham chiếu StoreTask.storeId
- Lọc branch của manager
- Hiển thị chi tiết store trong UI

### 7.3 GroupUser (Vai trò) - CHỈ ĐỌC

**Nguồn:** Hệ thống Phân quyền bên ngoài  
**Collection:** GroupUser  
**Quyền ProManage:** CHỈ ĐỌC

**Không có Controller riêng (đọc qua populate Employee)**

**Quy tắc nghiệp vụ:**
- **KHÔNG THỂ tạo/cập nhật/xóa vai trò**
- GroupUser định nghĩa vai trò nhân viên (admin/manager/employee)
- Đồng bộ từ hệ thống quản lý phân quyền ngoài
- Đọc qua Employee.ID_GroupUser populate

**Sử dụng trong ProManage:**
- Xác định vai trò trong helper `getEmployeeRole()`
- Kiểm tra ủy quyền
- Hiển thị vai trò nhân viên trong responses

---

## 🔔 QUY TRÌNH 8: THÔNG BÁO

**File:** `src/controllers/notificationController.js`  
**Trạng thái:** ✅ Hoạt động

### 8.1 Lấy danh sách Thông báo

**Endpoint:** `GET /api/notifications`  
**Quyền:** Riêng tư (tất cả vai trò)

**Query:**
- isRead (bộ lọc true/false)
- page, limit

**Quy trình:**
1. Filter: userId = người dùng hiện tại
2. Apply bộ lọc isRead nếu chỉ định
3. Sắp xếp mới nhất trước
4. Populate data.broadcastId và data.employeeId
5. Trả về với phân trang

### 8.2 Lấy số lượng chưa đọc

**Endpoint:** `GET /api/notifications/unread/count`  
**Quyền:** Riêng tư (tất cả vai trò)

**Quy trình:**
1. Đếm notifications với:
   - userId = người dùng hiện tại
   - isRead = false
2. Trả về số lượng

### 8.3 Đánh dấu đã đọc

**Endpoint:** `PUT /api/notifications/:id/read`  
**Quyền:** Riêng tư (tất cả vai trò)

**Quy trình:**
1. Tìm notification
2. Xác minh quyền sở hữu (kiểm tra userId)
3. Gọi `notificationService.markAsRead(id)`
4. Trả về thành công

### 8.4 Đánh dấu tất cả đã đọc

**Endpoint:** `PUT /api/notifications/read-all`  
**Quyền:** Riêng tư (tất cả vai trò)

**Quy trình:**
1. Gọi `notificationService.markAllAsRead(userId)`
2. Trả về số lượng notifications đã cập nhật

**Quy tắc nghiệp vụ:**
- Người dùng chỉ truy cập notification của mình
- Notifications tạo bởi notificationService
- Loại: broadcast_published, task_assigned, task_submitted, task_approved, task_rejected

---

## 📤 QUY TRÌNH 9: UPLOAD FILE

**File:** `src/controllers/uploadController.js`  
**Trạng thái:** ✅ Hoạt động

### 9.1 Upload file đơn

**Endpoint:** `POST /api/upload`  
**Quyền:** Riêng tư (tất cả vai trò)

**Quy trình:**
1. Kiểm tra file tồn tại trong request
2. Xác định loại file từ mimetype:
   - image/* → 'photo'
   - video/* → 'video'
   - application/pdf → 'document'
   - khác → 'file'
3. Tạo URL file
4. Trả về thông tin file:
   - filename, originalName, url, size
   - mimeType, fileType, uploadPath
   - uploadedAt

**Quy tắc nghiệp vụ:**
- Dùng multer middleware để xử lý upload
- Files lưu trong thư mục uploads/
- Filename bao gồm timestamp để tránh xung đột
- Trả về URL để lưu trong mảng evidences

### 9.2 Upload nhiều files

**Endpoint:** `POST /api/upload/multiple`  
**Quyền:** Riêng tư (tất cả vai trò)

**Quy trình:**
1. Kiểm tra files tồn tại trong request
2. Xử lý mỗi file giống upload đơn
3. Trả về mảng thông tin files

**Quy tắc nghiệp vụ:**
- Giới hạn tối đa 10 files mỗi lần
- Mỗi file có size tối đa (cấu hình trong multer)
- Trả về mảng URLs để lưu vào evidences

---

## 📋 TÓM TẮT LOGIC NGHIỆP VỤ

### Luồng chính:

1. **Admin tạo Broadcast** → status='draft'
2. **Admin publish Broadcast** → tạo StoreTask cho mỗi store → gửi notification cho managers
3. **Manager accept/reject StoreTask** → nếu accept, có thể giao nhân viên
4. **Manager assign nhân viên** → tạo UserTask → gửi notification
5. **Nhân viên làm task** → cập nhật checklist, upload evidences
6. **Nhân viên nộp task** → status='submitted' → gửi notification cho manager
7. **Manager duyệt** → approve (với rating) hoặc reject (với lý do)
8. **Tự động hoàn thành StoreTask** → khi tất cả UserTasks approved

### Ràng buộc quan trọng:

- **Employee, Brand, GroupUser:** CHỈ ĐỌC - đồng bộ từ hệ thống ngoài
- **Manager:** Chỉ quản lý store của mình
- **Employee:** Chỉ xem và làm task của mình
- **Admin:** Toàn quyền quản lý broadcasts và reassign tasks
- **Checklist bắt buộc:** Phải hoàn thành trước khi nộp
- **Cross-branch reassign:** Tự động cập nhật cả hai StoreTasks

### Lịch sử bug đã sửa:

- ✅ 18/03/2026: Dashboard dùng sai UserTask._id
- ✅ 18/03/2026: Reassign không lưu oldEmployee reference
- ✅ 19/03/2026: Notification refs sai model name
- ✅ 19/03/2026: Xóa các operations bị cấm trên collections chỉ đọc

---

**KẾT THÚC AUDIT LOGIC NGHIỆP VỤ**
