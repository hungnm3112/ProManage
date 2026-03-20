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
- `password` bắt buộc (không giới hạn độ dài tối thiểu)

**⚠️ THAY ĐỔI (20/03/2026):**
- **Trước:** Password yêu cầu tối thiểu 6 ký tự (HTML5 validation)
- **Sau:** Bỏ giới hạn tối thiểu - cho phép mật khẩu từ 1 ký tự trở lên
- **Lý do:** Linh hoạt hơn cho hệ thống test/dev và mật khẩu đơn giản

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

**Endpoint:** `PUT /api/admin/user-tasks/:id`  
**Quyền:** Riêng tư (chỉ admin)

**⚠️ REFACTOR (20/03/2026):**
- **Cũ:** `PUT /api/broadcasts/user-tasks/:taskId` ❌ (không RESTful)
- **Mới:** `PUT /api/admin/user-tasks/:id` ✅ (chuẩn REST, rõ quyền)

**Mục đích:** Admin có thể edit thông tin công việc VÀ/HOẶC chuyển giao cho nhân viên khác

**Dữ liệu đầu vào (Request Body):**
- `employeeId` (optional) - ID nhân viên mới để chuyển giao
- `title` (optional) - Tiêu đề công việc mới
- `description` (optional) - Mô tả công việc mới
- `priority` (optional) - Mức độ ưu tiên (low/medium/high/urgent)
- `deadline` (optional) - Thời hạn hoàn thành mới
- `checklist` (optional) - Danh sách checklist items mới
- `recurring` (optional) - Cấu hình lặp lại công việc

**3 trường hợp sử dụng:**
1. **Edit only (không giao lại):** Gửi các trường broadcast (title, description, ...), KHÔNG gửi employeeId → Backend chỉ cập nhật Broadcast, giữ nguyên nhân viên
2. **Reassign only (không edit):** Chỉ gửi employeeId → Backend chỉ thực hiện giao lại, không thay đổi thông tin công việc
3. **Edit + Reassign:** Gửi cả broadcast fields VÀ employeeId → Backend cập nhật cả hai

**🎨 GIAO DIỆN EDIT (Modal Unified):**

**Cấu trúc modal:**
```
┌─────────────────────────────────────────┐
│  Sửa Chi tiết Công việc                 │
├─────────────────────────────────────────┤
│  📝 Thông tin cơ bản                    │
│     - Tiêu đề *                         │
│     - Mô tả *                           │
│     - Mức độ ưu tiên *                  │
├─────────────────────────────────────────┤
│  ✅ Checklist                            │
│     - Danh sách công việc               │
│     - Nút thêm item                     │
├─────────────────────────────────────────┤
│  ⏰ Thời hạn hoàn thành *                │
│     - Tabs: One-time / Daily / ...     │
│     - Date/Time pickers                 │
│     - Preview deadline tiếp theo        │
├─────────────────────────────────────────┤
│  👤 Giao lại cho nhân viên (Tùy chọn)   │
│                                         │
│     📌 Đang giao cho:                   │
│     ┌─────────────────────────────┐    │
│     │ 👤 Nguyễn Văn A             │    │
│     │ 📞 0901234567 • CN Quận 1   │    │
│     └─────────────────────────────┘    │
│                                         │
│     ━━━ Chọn nhân viên mới ━━━         │
│     ┌─────────┬──────────┐             │
│     │Chi nhánh│Nhân viên │  ← Tabs    │
│     └─────────┴──────────┘             │
│                                         │
│     [Tab Chi nhánh:]                    │
│       🔍 Tìm kiếm chi nhánh...          │
│       ┌─────────────────────────┐      │
│       │ 🏪 CN Quận 1            │      │
│       │ 📍 123 Nguyễn Huệ      │      │
│       ├─────────────────────────┤      │
│       │ 🏪 CN Quận 3            │      │
│       └─────────────────────────┘      │
│                                         │
│     [Tab Nhân viên:]                    │
│       🔍 Tìm kiếm nhân viên...          │
│       ┌─────────────────────────┐      │
│       │ 👤 Nguyễn Văn A         │      │
│       │ 📞 0901234567 • CN Q1   │      │
│       ├─────────────────────────┤      │
│       │ 👤 Trần Thị B           │      │
│       └─────────────────────────┘      │
│                                         │
│     [Nhân viên đã chọn:]                │
│       ┌─────────────────────────┐      │
│       │ ✅ Nguyễn Văn A         │      │
│       │    0901234567 • CN Q1    [×]   │
│       └─────────────────────────┘      │
├─────────────────────────────────────────┤
│           [Hủy]  [Lưu thay đổi]        │
└─────────────────────────────────────────┘
```

**Modal phụ khi chọn Chi nhánh:**
```
┌─────────────────────────────────────────┐
│  Chọn nhân viên - CN Quận 1             │
├─────────────────────────────────────────┤
│  🔍 Tìm kiếm nhân viên...               │
│  ┌─────────────────────────────────┐   │
│  │ ☐ Nguyễn Văn A                  │   │
│  │   📞 0901... • Nhân viên        │   │
│  ├─────────────────────────────────┤   │
│  │ ☐ Trần Văn B                    │   │
│  │   📞 0902... • Nhân viên        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Đã chọn: 2 nhân viên                   │
│           [Hủy]  [Xác nhận]            │
└─────────────────────────────────────────┘
```

**⚡ LUỒNG THAO TÁC NGƯỜI DÙNG:**

**Option 1: Chỉ edit thông tin (không giao lại)**
1. Admin mở modal edit task
2. Modal hiển thị **"Đang giao cho: [Tên nhân viên hiện tại]"** ở đầu section giao lại
3. Sửa title, description, priority, checklist, deadline
4. Bỏ qua phần "Chọn nhân viên mới" (không chọn gì)
5. Click "Lưu thay đổi"
6. → Backend cập nhật Broadcast fields, KHÔNG thay đổi employeeId, nhân viên hiện tại giữ nguyên

**Option 2: Giao lại cho nhân viên cụ thể (Tab Nhân viên)**
1. Admin mở modal edit task
2. Modal hiển thị **"Đang giao cho: [Tên nhân viên hiện tại]"**
3. Xem thông tin nhân viên hiện tại (tên, số điện thoại, chi nhánh)
4. Click tab "Nhân viên" trong section "Chọn nhân viên mới"
5. Tìm kiếm và click chọn 1 nhân viên KHÁC
6. Nhân viên mới hiện trong "Nhân viên đã chọn"
7. Click "Lưu thay đổi"
8. → Backend cập nhật employeeId, thực hiện reassign logic, gửi notification

**Option 3: Giao lại qua Chi nhánh (Tab Chi nhánh)**
1. Admin mở modal edit task
2. Modal hiển thị **"Đang giao cho: [Tên nhân viên hiện tại]"**
3. Click tab "Chi nhánh" trong section "Chọn nhân viên mới"
4. Click chọn 1 chi nhánh
5. → Mở modal phụ "Chọn nhân viên - [Tên CN]"
6. Tìm kiếm và chọn 1 nhân viên từ chi nhánh đó
7. Click "Xác nhận" → Đóng modal phụ
8. Nhân viên mới đã chọn hiện trong "Nhân viên đã chọn"
9. Click "Lưu thay đổi"
10. → Backend cập nhật employeeId, thực hiện reassign logic

**Option 4: Edit + Giao lại cùng lúc**
1. Admin mở modal edit task, xem thông tin nhân viên hiện tại
2. Sửa title, description, deadline, v.v.
3. Chọn nhân viên mới từ tab Chi nhánh hoặc Nhân viên
4. Click "Lưu thay đổi"
5. → Backend cập nhật CẢ broadcast fields VÀ employeeId

**⚠️ QUY TẮC UI:**

**Hiển thị thông tin nhân viên hiện tại:**
- Khi mở modal edit, **luôn hiển thị** section "Đang giao cho" với thông tin nhân viên đang được giao:
  - Tên nhân viên
  - Số điện thoại
  - Tên chi nhánh
- Section này **không thể chỉnh sửa** (read-only display)
- Giúp admin biết task đang giao cho ai trước khi quyết định giao lại

**Chọn nhân viên mới (Giao lại):**
- Phần "Chọn nhân viên mới" luôn là **tùy chọn** (optional)
- Nếu không chọn nhân viên mới → Chỉ edit, không reassign, giữ nguyên nhân viên hiện tại
- Chỉ được chọn **1 nhân viên duy nhất** (single selection)
- Tab Chi nhánh → Chọn store → Mở modal chọn employees của store đó
- Tab Nhân viên → Chọn trực tiếp từ danh sách tất cả nhân viên
- Có nút "×" để xóa nhân viên đã chọn và chọn lại
- UI tabs giống y hệt Assign Modal (tái sử dụng style)
- Khi chọn nhân viên mới, hiển thị trong "Nhân viên đã chọn" ở dưới tabs

**🔧 QUY TRÌNH XỬ LÝ BACKEND:**

**Yêu cầu API cho Modal Edit (Load thông tin hiện tại):**
- **Dashboard API** (`GET /api/dashboard/admin/tasks/:status`) phải trả về:
  - `employeeId`: ID nhân viên hiện tại được giao
  - `employeeName`: Tên đầy đủ nhân viên
  - `employeePhone`: Số điện thoại nhân viên
  - `employeeBranch`: Tên chi nhánh của nhân viên
- Frontend dùng dữ liệu này để hiển thị section "Đang giao cho" khi mở modal
- Nếu task chưa được giao (`employeeId: null`), hiển thị "Chưa giao cho nhân viên"

**Xử lý request cập nhật:**

1. Tìm UserTask theo id
2. Xác thực quyền admin (middleware `authorizeAdmin`)
3. **Populate employeeId** để lấy thông tin nhân viên hiện tại (cần cho reassign logic và notifications)
4. Kiểm tra task đã hoàn thành chưa → Không edit được task đã hoàn thành (status='completed' hoặc 'approved')
5. Khởi tạo flags theo dõi: `updatedBroadcast = false`, `reassigned = false`

6. **PART 1 - Cập nhật Broadcast (nếu có các trường edit):**
   - **Nếu có ít nhất 1 trong:** title, description, priority, deadline, checklist, recurring
   - Tìm Broadcast document theo userTask.broadcastId
   - Cập nhật các fields được gửi lên:
     - `broadcast.title` ← title (nếu có)
     - `broadcast.description` ← description (nếu có)
     - `broadcast.priority` ← priority (nếu có)
     - `broadcast.deadline` ← new Date(deadline) (nếu có)
     - `broadcast.checklist` ← checklist array (nếu có)
     - `broadcast.recurring` ← recurring object (nếu có)
   - Lưu broadcast: `await broadcast.save()`
   - **Nếu checklist thay đổi:**
     - Cập nhật `userTask.checklist` với format:
       ```javascript
       userTask.checklist = checklist.map(item => ({
         task: typeof item === 'string' ? item : item.task,
         required: typeof item === 'object' ? item.required : true,
         isCompleted: false,  // Reset completion status
         completedAt: null
       }))
       ```
   - Set flag: `updatedBroadcast = true`

7. **PART 2 - Giao lại cho nhân viên mới (OPTIONAL):**
   - **Chỉ xử lý nếu:** `newEmployeeId` được gửi lên VÀ khác với nhân viên hiện tại
   - **Kiểm tra:** `if (newEmployeeId && newEmployeeId !== userTask.employeeId._id.toString())`
   - a. Tìm nhân viên mới: `await Employee.findById(newEmployeeId).populate('ID_Branch')`
   - b. Validate nhân viên mới:
      - Employee tồn tại → Error 404 "Không tìm thấy employee mới"
      - Employee đang hoạt động (`Trang_thai === "1"` hoặc `Status === 'Đang hoạt động'`) → Error 400
      - Employee chưa có task này (tìm `UserTask` với `broadcastId` + `employeeId` này) → Error 400 "Nhân viên đã có task này rồi"
   - c. **Lưu tham chiếu nhân viên cũ** (quan trọng cho notifications!): `const oldEmployee = userTask.employeeId`
   - d. Cập nhật: `userTask.employeeId = newEmployeeId`
   - e. **Kiểm tra cross-branch reassign:**
      - So sánh `oldBranchId` vs `newBranchId`
      - **Nếu khác branch:**
        - Tìm hoặc tạo StoreTask mới cho branch mới:
          ```javascript
          let newStoreTask = await StoreTask.findOne({
            broadcastId: userTask.broadcastId._id,
            storeId: newBranchId
          })
          ```
        - **Nếu chưa có StoreTask:**
          - Tìm manager của branch mới (role='manager' hoặc fallback)
          - Tạo StoreTask mới với managerId, status='pending', assignedEmployees=[newEmployeeId]
        - **Nếu đã có StoreTask:**
          - Thêm newEmployeeId vào `assignedEmployees` (nếu chưa có)
        - Cập nhật `userTask.storeTaskId = newStoreTask._id`
        - **Dọn dẹp StoreTask cũ:**
          - Xóa oldEmployee._id khỏi `oldStoreTask.assignedEmployees`
          - Lưu oldStoreTask
      - **Nếu cùng branch:**
        - Giữ nguyên StoreTask (không cần làm gì)
   - f. **Tạo notifications:**
      - Notification cho nhân viên mới (type='task_assigned')
      - Notification cho nhân viên cũ (type='task_reassigned')
   - g. Set flag: `reassigned = true`

8. **Lưu UserTask:** `await userTask.save()`

9. **Xác định action text cho response:**
   ```javascript
   let actionText = 'cập nhật';
   if (updatedBroadcast && reassigned) {
     actionText = 'cập nhật và giao lại';
   } else if (reassigned) {
     actionText = 'giao lại';
   }
   ```

10. **Trả về response:**
    ```json
    {
      "success": true,
      "message": "Đã [actionText] công việc thành công",
      "data": {
        "userTask": {
          "_id": "...",
          "employeeId": "...",
          "storeTaskId": "...",
          "status": "...",
          "updatedBroadcast": true/false,
          "reassigned": true/false
        }
      }
    }
    ```

**Quy tắc nghiệp vụ:**
- **Chỉ admin** có quyền (route prefix `/api/admin/`)
- **Modal luôn hiển thị nhân viên hiện tại** trước khi cho phép giao lại
- **Ít nhất 1 field phải được cung cấp:** Edit fields (title, description, ...) HOẶC employeeId
- **employeeId là OPTIONAL:** Nếu không gửi → Giữ nguyên nhân viên hiện tại, chỉ edit thông tin
- Không edit được task đã approved (status='approved')
- Không edit được task đã completed (status='completed')
- **Reassign chỉ xảy ra NẾU:** employeeId được gửi VÀ khác với nhân viên hiện tại
- Không chuyển giao nếu nhân viên mới đã có task này (kiểm tra broadcast + employee unique)
- Phải dùng UserTask._id (không phải StoreTask._id)
- Chuyển giao cross-branch cập nhật cả hai StoreTasks (remove old, add new)
- Cập nhật checklist reset isCompleted thành false cho tất cả items
- **Giao diện cho phép chọn 1 nhân viên duy nhất** (khác với assign có thể chọn nhiều)
- UI tái sử dụng tabs Chi nhánh/Nhân viên từ Assign Modal
- **Dashboard API phải populate và trả về employeeName, employeePhone, employeeBranch** để hiển thị
- **Response message động:** "Đã cập nhật công việc thành công" / "Đã giao lại công việc thành công" / "Đã cập nhật và giao lại công việc thành công"
- **Response bao gồm flags:** `updatedBroadcast` (true/false) và `reassigned` (true/false) để frontend biết action nào đã thực hiện

**Lợi ích API mới:**
- ✅ RESTful chuẩn: UserTask là resource, dùng PUT method
- ✅ Rõ quyền hạn: `/admin/` prefix → chỉ admin có thể gọi
- ✅ Tách biệt: `/my-tasks` (employee) vs `/admin/user-tasks` (admin)
- ✅ Giảm risk nhầm ID: Route rõ ràng → ít sai hơn
- ✅ UI nhất quán: Tái sử dụng pattern từ Assign Modal

**Lịch sử thay đổi:**
- ✅ ĐÃ SỬA 18/03/2026: Dashboard dùng sai ID (StoreTask._id thay vì UserTask._id)
- ✅ ĐÃ SỬA 18/03/2026: Logic chuyển giao giờ lưu tham chiếu oldEmployee trước khi cập nhật
- ✅ IMPROVED 20/03/2026: API chuẩn hóa `/api/admin/user-tasks/:id` (RESTful)
- ✅ UI REFACTOR 20/03/2026: 
  - Di chuyển phần Giao lại xuống dưới Deadline
  - Thay đổi từ simple search box sang tabs Chi nhánh/Nhân viên
  - Tái sử dụng UI pattern từ Assign Modal
  - Cho phép chọn qua store hoặc trực tiếp employee
- ✅ ENHANCED 20/03/2026:
  - **Thêm hiển thị thông tin nhân viên hiện tại** trong modal edit
  - Section "Đang giao cho" hiển thị tên, SĐT, chi nhánh nhân viên đang được giao
  - Dashboard API bổ sung trả về: employeeName, employeePhone, employeeBranch
  - Giúp admin biết task đang giao cho ai trước khi quyết định giao lại
- ✅ **MAJOR FIX 20/03/2026 - Backend hỗ trợ Edit + Reassign linh hoạt:**
  - **Bug:** Backend `reassignUserTask()` chỉ hỗ trợ reassign, bắt buộc phải có employeeId
  - **Problem:** User không thể edit task mà không giao lại (lỗi 404 "Không tìm thấy employee mới")
  - **Fix:** Viết lại controller để hỗ trợ 3 trường hợp:
    1. Edit only: Gửi broadcast fields, không gửi employeeId → Chỉ cập nhật Broadcast
    2. Reassign only: Chỉ gửi employeeId → Chỉ giao lại
    3. Edit + Reassign: Gửi cả hai → Cập nhật cả Broadcast và giao lại
  - **Implementation:**
    - PART 1: Kiểm tra có broadcast fields → Cập nhật Broadcast + checklist
    - PART 2: Kiểm tra có employeeId VÀ khác nhân viên hiện tại → Thực hiện reassign logic
    - Response trả về flags `updatedBroadcast` và `reassigned` để frontend biết action nào đã xảy ra
    - Success message động: "cập nhật" / "giao lại" / "cập nhật và giao lại"
  - **Code structure:** Phân tách rõ ràng 2 parts logic, dễ maintain và debug
  - **Validation:** employeeId trở thành optional, ít nhất 1 field phải được gửi

### 2.9 Xóa UserTask ⭐

**Endpoint:** `DELETE /api/admin/user-tasks/:id`  
**Quyền:** Riêng tư (chỉ admin)

**⚠️ REFACTOR (20/03/2026):**
- **Cũ:** `DELETE /api/broadcasts/user-tasks/:taskId` ❌
- **Mới:** `DELETE /api/admin/user-tasks/:id` ✅

**Quy trình:**
1. Tìm UserTask theo id
2. Xác thực quyền admin
3. Kiểm tra đã hoàn thành chưa → Không xóa được task đã hoàn thành
3. **Xóa employee khỏi StoreTask.assignedEmployees**
4. **Nếu StoreTask không còn assignedEmployees:**
   - Xóa luôn StoreTask (dọn dẹp)
5. Xóa UserTask

**Quy tắc nghiệp vụ:**
- **Chỉ admin** có quyền xóa UserTask
- Không xóa được task đã approved (đề xuất truy cập trực tiếp database nếu cần)
- Phải dùng UserTask._id (không phải StoreTask._id)
- Cascade sang StoreTask nếu rỗng

**Lịch sử bug:**
- ✅ ĐÃ SỬA 18/03/2026: Dùng sai ID (StoreTask._id thay vì UserTask._id)
- ✅ IMPROVED 20/03/2026: API chuẩn hóa `/api/admin/user-tasks/:id`

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
   - **Populate employeeId.Phone và employeeId.ID_Branch** (nested populate)
   - Lấy thông tin nhân viên: Ho_va_ten/FullName, Phone, ID_Branch.Name/ID_Branch.Map_Address
5. **Format response:**
   - broadcastTitle, storeName, managerName
   - **employeeId, employeeName, employeePhone, employeeBranch** (thông tin nhân viên được giao)
   - deadline, status, priority, completionPercent
   - **userTaskId** (cho reassign/delete operations)
   - Các timestamps khác nhau

**Quy tắc nghiệp vụ:**
- Trả về userTaskId (QUAN TRỌNG cho reassign/delete)
- **Trả về đầy đủ thông tin nhân viên:** employeeName, employeePhone, employeeBranch
- Nếu chưa assign: employeeName="Chưa giao", employeePhone=null, employeeBranch=null
- Tính overdue dựa trên broadcast deadline
- Sắp xếp phù hợp theo status

**Lịch sử bug:**
- ✅ ĐÃ SỬA 18/03/2026: Thêm trường userTaskId và employeeName
- ✅ **ENHANCED 20/03/2026:** Thêm employeePhone và employeeBranch cho modal Edit hiển thị thông tin nhân viên hiện tại

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
- Query: role, **branchId**, status, search, page, limit
- Manager chỉ xem nhân viên branch mình (auto-filter)
- Admin xem tất cả nhân viên
- **Dùng `?branchId=xxx` thay vì `/api/brands/:id/employees`**

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
- Không populate employees (dùng `GET /api/employees?branchId=xxx` riêng)

**⚠️ DEPRECATED (20/03/2026):**
- ~~`GET /api/brands/:id/employees`~~ → Dùng `GET /api/employees?branchId=xxx` thay thế
- Lý do: RESTful hơn, Employee là resource chính, branch chỉ là filter

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
