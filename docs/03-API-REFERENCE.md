# API Reference - ProManage

**Last Updated:** March 19, 2026  
**Version:** 2.0  
**Purpose:** Complete API documentation với examples, validation rules, và critical warnings

---

## 🚨 CRITICAL RULES - ĐỌC TRƯỚC KHI CODE

### ⛔ Rule 1: READ-ONLY Collections (KHÔNG BAO GIỜ được vi phạm)

**3 Collections TUYỆT ĐỐI READ-ONLY:**
- `Employee` - Synced từ HR system
- `Brand` (Branch) - Synced từ ERP system  
- `GroupUser` - Synced từ Permission system

**Bị CẤM:**
- ❌ `POST` - Create operations
- ❌ `PUT/PATCH` - Update operations
- ❌ `DELETE` - Delete operations

**Chỉ được phép:**
- ✅ `GET` - Read operations only
- ✅ Reference bằng ObjectId trong collections khác

**Tại sao:** Dữ liệu được manage bởi external systems. ProManage chỉ đọc để reference.

**Nếu vi phạm:** Data inconsistency, sync conflicts, system corruption

---

### 🔑 Rule 2: Phân biệt userTaskId vs storeTaskId (Bug #2, #3 - FIXED 18/03/2026)

**userTaskId:**
- ID của **UserTask document** (task assigned to 1 employee)
- Dùng cho: `/api/broadcasts/user-tasks/:taskId` (reassign, delete)
- Dùng cho: `/api/my-tasks/:id` (employee operations)
- Dùng cho: `/api/reviews/:taskId` (review, approve, reject)

**storeTaskId:**
- ID của **StoreTask document** (task for 1 store/branch)
- Dùng cho: `/api/store-tasks/:id` (manager operations)
- Dùng cho: Reference trong UserTask.storeTaskId field

**KHÔNG BAO GIỜ:**
- ❌ Dùng storeTaskId cho reassign/delete operations
- ❌ Dùng userTaskId cho store-level operations

**Bug đã fix (18/03):**
- Admin reassign/delete trước đây dùng nhầm storeTaskId → 404 errors
- Đã fix thành dùng userTaskId → works correctly

**Nếu vi phạm:** 404 Not Found, xóa sai task, reassign sai employee

---

### 📎 Rule 3: Model References - Dùng 'Employee' (không phải 'Nhan_vien')

**Trong Mongoose Models:**
- ✅ Đúng: `ref: 'Employee'` 
- ❌ SAI: `ref: 'Nhan_vien'`

**Tại sao:**
- Collection name trong DB: `Employee` (không có dấu gạch dưới)
- Mongoose model name: `Employee`
- Nếu dùng sai ref → Populate fails

**Ví dụ đúng:**
```javascript
// UserTask model
employeeId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Employee',  // ✅ ĐÚNG
  required: true
}

// Notification model  
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Employee',  // ✅ ĐÚNG
  required: true
}
```

**Ví dụ SAI:**
```javascript
employeeId: {
  ref: 'Nhan_vien'  // ❌ SAI - populate sẽ fail
}
```

**Nếu vi phạm:** Populate returns null, relationship broken, data not loaded

---

### ⚠️ Rule 4: Required Checklist Validation (Business Rule)

**Submit UserTask:**
- **TẤT CẢ** checklist items có `required: true` PHẢI `completed: true`
- Validation này là **NGHIÊM NGẶT**, không bypass được
- Frontend PHẢI validate trước khi submit

**Nếu vi phạm:** 400 Bad Request, manager reject task, employee phải làm lại

---

### 🔄 Rule 5: Status Transitions (Accept ≠ In Progress)

**StoreTask Status Flow:**
1. `pending` → Manager nhận task
2. `accepted` → Manager accept (NOT in_progress yet!)
3. `in_progress` → Manager assign employees (UserTasks created)
4. `completed` → All UserTasks done

**Common Mistake:** Accept ≠ In Progress!
- Accept chỉ là manager đồng ý làm
- In Progress là khi có employees được assigned

**Nếu vi phạm:** UI hiển thị sai, logic flow broken, notifications sai

---

### 🔢 Rule 6: Data Type Constraints (Legacy Database Issues)

**Vấn đề:** Database cũ có nhiều kiểu dữ liệu không chuẩn

**Boolean as String:**
- ❌ `Active: "true"/"false"` (Brand model)
- ❌ `Active_Schedule: "true"/"false"` (Brand model)
- ❌ `is_timekeeping_all: "true"/"false"` (Employee model)
- ✅ **Phải parse:** `JSON.parse(value)` hoặc `value === "true"`

**Number as String:**
- ❌ `Salary: "5000000"` (Employee model) - String, không phải Number
- ❌ `Allowance: "500000"` - String
- ✅ **Phải parse:** `parseInt(value)` hoặc `parseFloat(value)` trước khi tính toán

**Status Inconsistency:**
- Collection `GroupUser`: `Trang_thai: 1` hoặc `0` (Number)
- Collection `Brand`: `Active: "true"/"false"` (String)
- Collection `Broadcast/UserTask`: `status: 'draft'/'published'` (String enum)
- ✅ **Phải check từng collection** để biết format đúng

**Khi code:**
```javascript
// ❌ SAI - Assume boolean
if (employee.is_timekeeping_all) { ... }

// ✅ ĐÚNG - Parse string to boolean
if (employee.is_timekeeping_all === "true") { ... }

// ❌ SAI - Tính toán trực tiếp
const total = employee.Salary + employee.Allowance;  // "5000000" + "500000" = "5000000500000" (string concat!)

// ✅ ĐÚNG - Parse trước
const total = parseInt(employee.Salary) + parseInt(employee.Allowance);  // 5500000
```

**API Response Behavior:**
- GET /api/employees/:id sẽ trả về đúng kiểu dữ liệu từ DB (string)
- Frontend PHẢI parse khi cần tính toán hoặc logic checks
- Backend validators hiện chưa normalize data types (Technical Debt)

---

### 🔐 Rule 7: Authorization Matrix (Chi tiết phân quyền)

| Endpoint Category | Admin | Manager | Employee |
|-------------------|-------|---------|----------|
| **Auth** | ✅ All | ✅ All | ✅ All |
| **Broadcasts** | ✅ Full CRUD | ❌ None | ❌ None |
| **StoreTasks** | ✅ View All | ✅ Own Store Only | ❌ None |
| **UserTasks (My Tasks)** | ✅ View All + Reassign/Delete | ❌ None | ✅ Own Tasks Only |
| **Reviews** | ✅ View All | ✅ Own Store Employees Only | ❌ None |
| **Dashboard** | ✅ System Stats | ✅ Store Stats | ✅ Personal Stats |
| **Employees** | ✅ Read All | ✅ Read All | ✅ Read All |
| **Brands** | ✅ Read All | ✅ Read All | ✅ Read All |
| **Notifications** | ✅ Own | ✅ Own | ✅ Own |
| **Uploads** | ✅ All | ✅ All | ✅ All |

**Manager Restrictions (CRITICAL):**
- Manager chỉ thao tác với **StoreTask có storeId = Manager's ID_Branch**
- Check: `employee.ID_Branch._id === storeTask.storeId`
- Manager chỉ review **UserTask của employees thuộc store mình**
- Check: `userTask.employeeId.ID_Branch === manager.ID_Branch`

**Employee Restrictions (CRITICAL):**
- Employee chỉ xem/update **UserTask có employeeId = req.user._id**
- Check: `userTask.employeeId.toString() === req.user._id.toString()`
- Không được xem tasks của người khác (403 Forbidden)

**Implementation:**
```javascript
// Manager authorization example
if (req.user.role === 'manager') {
  const storeTask = await StoreTask.findById(id).populate('storeId');
  const manager = await Employee.findById(req.user._id).populate('ID_Branch');
  
  if (storeTask.storeId._id.toString() !== manager.ID_Branch._id.toString()) {
    return res.status(403).json({ message: 'Not your store' });
  }
}

// Employee authorization example
if (req.user.role === 'employee') {
  const userTask = await UserTask.findById(id);
  
  if (userTask.employeeId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your task' });
  }
}
```

---

### ⚠️ Rule 8: Technical Debt & Security Warnings

**🚨 MISSING FEATURES - Cần implement:**

**1. XSS Sanitization (CRITICAL - Known Issue #7):**
- ❌ Hiện chưa có sanitization cho user inputs
- Risk fields: `title`, `description`, `reviewNote`, `reason`, `checklist.title`
- **Attack vector:** `<script>alert('XSS')</script>` trong title → Execute khi render
- **Workaround:** Frontend phải escape HTML khi display
- **Fix needed:** Implement `sanitize-html` library ở backend validators
- **Priority:** MEDIUM (có workaround)

**2. Rate Limiting (CRITICAL - Known Issue #8):**
- ❌ Không có rate limiting cho bất kỳ endpoint nào
- Vulnerable endpoints:
  - `POST /api/auth/login` - Brute force attacks
  - `POST /api/upload/*` - Server overload
  - `POST /api/broadcasts/:id/assign` - Spam assignments
- **Attack vector:** 1000 req/sec → Server crash
- **Workaround:** Cloudflare rate limiting (nếu có)
- **Fix needed:** Implement `express-rate-limit` middleware
- **Priority:** HIGH (no workaround)

**3. JWT Refresh Token (Known Issue #9):**
- ❌ Chỉ có Access Token (24h expiry)
- ❌ Không có Refresh Token mechanism
- **Security issue:** Không thu hồi token được nếu bị rò rỉ
- **Current behavior:** 
  - User login → Token expires after 24h
  - Phải login lại để get token mới
  - Không logout được từ server-side
- **Workaround:** Client-side logout (delete token)
- **Fix needed:** Implement refresh token flow
- **Priority:** LOW (acceptable for internal system)

**4. Validators Không Nhất Quán (Known Issue #11):**
- ❌ Một số endpoints thiếu validators
- ❌ Validation rules không consistent
- **Examples:**
  - `POST /api/broadcasts` - Full validators ✅
  - `PUT /api/broadcasts/:id/publish` - Minimal validators ⚠️
  - Some endpoints dùng Joi, some dùng manual checks
- **Impact:** Inconsistent error messages, data quality issues
- **Priority:** MEDIUM

**5. Thiếu Database Indexes (Known Issue #10):**
- ❌ Queries chậm với large datasets
- Missing indexes:
  - `UserTask.employeeId` - Frequent queries
  - `Notification.userId + isRead` - Dashboard queries
  - `Broadcast.status + deadline` - Admin filtering
- **Impact:** Slow queries (>500ms với 10k+ records)
- **Priority:** MEDIUM (optimize later)

**6. Thiếu Unit Tests (Known Issue #13):**
- ❌ 0% test coverage
- ❌ Không có integration tests
- **Risk:** Regressions khi refactor
- **Priority:** HIGH (long-term stability)

**Khi document API:**
- Ghi chú rõ endpoints nào vulnerable
- Warning về missing sanitization/rate limiting
- Khuyến nghị frontend implement mitigations

---

### 🔄 Rule 9: Auto Behaviors & Side Effects

**Auto Status Transitions:**

**UserTask Status Auto-Change:**
1. **assigned → in_progress:**
   - Trigger: Lần đầu update checklist HOẶC upload evidence đầu tiên
   - Code: `if (status === 'assigned') { status = 'in_progress' }`
   - Impact: Employee không cần manually "start" task
   
2. **in_progress → submitted:**
   - Trigger: Employee call POST /api/my-tasks/:id/submit
   - Validation: ALL required checklist items MUST be completed
   - Impact: Manager nhận notification

3. **submitted → approved/rejected:**
   - Trigger: Manager approve/reject
   - Impact: UserTask.completedAt set (if approved)

**StoreTask Completion Rate:**
- Auto-calculate: `completedUserTasks / totalUserTasks * 100`
- Trigger: Mỗi khi UserTask status thay đổi
- Impact: Dashboard stats update real-time

**Notification Auto-Create:**
| Event | Recipients | Type |
|-------|-----------|------|
| Broadcast publish | All store managers | 'broadcast_published' |
| StoreTask assigned | Specific employees | 'task_assigned' |
| UserTask submitted | Store manager | 'task_submitted' |
| Review approved | Employee | 'task_approved' |
| Review rejected | Employee | 'task_rejected' |
| Task reassigned | Old + New employees | 'task_reassigned' |

**Critical Validations (ALWAYS enforced):**
- ✅ Submit task: ALL `required: true` checklist items → `completed: true`
- ✅ Reassign: Task NOT completed yet
- ✅ Delete: Task NOT completed yet
- ✅ Publish broadcast: Deadline > current time
- ✅ Manager operations: storeId === manager.ID_Branch

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

---

### POST /api/auth/login

**Mô tả:** Đăng nhập với số điện thoại và mật khẩu

**Access:** 🌐 Public (không cần token)  
**Business Logic:** [01-BUSINESS-LOGIC.md § Authentication](01-BUSINESS-LOGIC.md#1-authentication--authorization)

**Request:**

```http
POST /api/auth/login HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "phone": "0987654321",
  "password": "password123"
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | string | ✅ Yes | Số điện thoại (10 số) |
| `password` | string | ✅ Yes | Mật khẩu (min 6 ký tự) |

**Validation Rules:**
- `phone`: Phải là 10 chữ số, bắt đầu bằng 0
- `password`: Không được rỗng
- Employee phải tồn tại trong database
- Password phải match (HMAC-SHA512 + salt)
- Employee phải có status active

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "employee": {
      "_id": "65f1234567890abcdef12345",
      "ID_Nhan_vien": "NV001",
      "Ho_ten": "Nguyễn Văn A",
      "So_dien_thoai": "0987654321",
      "ID_Branch": {
        "_id": "65f1234567890abcdef11111",
        "Ten_thuong_hieu": "Chi nhánh HCM"
      },
      "ID_GroupUser": {
        "_id": "65f1234567890abcdef22222",
        "Ten_nhom": "Quản lý"
      },
      "role": "manager"
    }
  }
}
```

**Response 400 (Bad Request):**

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Số điện thoại không hợp lệ",
    "Mật khẩu không được để trống"
  ]
}
```

**Response 401 (Unauthorized):**

```json
{
  "success": false,
  "message": "Số điện thoại hoặc mật khẩu không đúng"
}
```

**Response 403 (Forbidden):**

```json
{
  "success": false,
  "message": "Tài khoản đã bị vô hiệu hóa"
}
```

**Implementation:**
- File: `src/controllers/authController.js`
- Function: `login()`
- Lines: ~15-60

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0987654321",
    "password": "password123"
  }'
```

**Notes:**
- Token expires sau 24 giờ
- Password được hash bằng HMAC-SHA512 + salt
- Role được map từ GroupUser.Ten_nhom:
  - "Quản trị hệ thống" → "admin"
  - "Quản lý" → "manager"
  - "Nhân viên" → "employee"

⚠️ **SECURITY WARNING - Rate Limiting (Known Issue #8):**
- Endpoint này **KHÔNG có rate limiting**
- **Vulnerability:** Brute-force attacks có thể thử unlimited password combinations
- **Attack vector:** Attacker thử 1000+ mật khẩu/phút → Có thể crack weak passwords
- **Workaround:** Sử dụng Cloudflare rate limiting (nếu có) hoặc firewall rules
- **Fix needed:** Implement `express-rate-limit` (5 attempts/15 min per IP)
- **Priority:** HIGH - Critical security issue

⚠️ **SECURITY WARNING - No Refresh Token (Known Issue #9):**
- Chỉ có Access Token (24h expiry), **không có Refresh Token mechanism**
- **Consequence:** Không thể thu hồi token nếu bị rò rỉ
- Logout chỉ work ở client-side (delete local token)
- Server không track active sessions → Token vẫn valid until expired
- **Fix needed:** Implement refresh token flow với token rotation
- **Priority:** LOW - Acceptable for internal system

---

### POST /api/auth/logout

**Mô tả:** Đăng xuất (client-side token removal)

**Access:** 🔒 Private (authenticated user)  
**Business Logic:** [01-BUSINESS-LOGIC.md § Authentication](01-BUSINESS-LOGIC.md#1-authentication--authorization)

**Request:**

```http
POST /api/auth/logout HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Headers:**

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Authorization` | string | ✅ Yes | Bearer {token} |

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

**Response 401 (Unauthorized):**

```json
{
  "success": false,
  "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

**Implementation:**
- File: `src/controllers/authController.js`
- Function: `logout()`
- Lines: ~62-70

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Notes:**
- Server không lưu token (stateless JWT)
- Logout chỉ trả về success message
- Client phải xóa token khỏi localStorage/memory
- Token vẫn valid cho đến khi hết hạn

---

### GET /api/auth/me

**Mô tả:** Lấy thông tin user hiện tại (authenticated user info)

**Access:** 🔒 Private (authenticated user)  
**Business Logic:** [01-BUSINESS-LOGIC.md § Authentication](01-BUSINESS-LOGIC.md#1-authentication--authorization)

**Request:**

```http
GET /api/auth/me HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Headers:**

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Authorization` | string | ✅ Yes | Bearer {token} |

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "_id": "65f1234567890abcdef12345",
    "ID_Nhan_vien": "NV001",
    "Ho_ten": "Nguyễn Văn A",
    "So_dien_thoai": "0987654321",
    "Ngay_sinh": "1990-01-15T00:00:00.000Z",
    "Dia_chi": "123 Nguyễn Huệ, Q1, HCM",
    "ID_Branch": {
      "_id": "65f1234567890abcdef11111",
      "ID_Thuong_hieu": "TH001",
      "Ten_thuong_hieu": "Chi nhánh HCM",
      "Dia_chi": "456 Lý Tự Trọng, Q1, HCM"
    },
    "ID_GroupUser": {
      "_id": "65f1234567890abcdef22222",
      "ID_Nhom": "NHOM_QL",
      "Ten_nhom": "Quản lý",
      "MoTa": "Quản lý chi nhánh"
    },
    "Ngay_bat_dau_lam": "2023-01-01T00:00:00.000Z",
    "Trang_thai": 1,
    "role": "manager",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2026-03-19T00:00:00.000Z"
  }
}
```

**Response 401 (Unauthorized):**

```json
{
  "success": false,
  "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

**Response 404 (Not Found):**

```json
{
  "success": false,
  "message": "Không tìm thấy thông tin nhân viên"
}
```

**Implementation:**
- File: `src/controllers/authController.js`
- Function: `getMe()`
- Lines: ~72-95

**cURL Example:**

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Notes:**
- Trả về full employee info với populated Branch và GroupUser
- `role` field được computed từ GroupUser.Ten_nhom
- Dùng để verify token và get current user context
- Frontend nên call API này sau khi login để cache user info

---

## 2️⃣ EMPLOYEES ⛔ READ-ONLY

**Base Path:** `/api/employees`  
**File:** `src/routes/employeeRoutes.js`  
**Controller:** `src/controllers/employeeController.js`  
**Validators:** `src/validators/employeeValidator.js`

**⚠️ CRITICAL:** Employee collection synced from external HR system. **READ ONLY - NO CREATE/UPDATE/DELETE**

---

### GET /api/employees

**Mô tả:** Lấy danh sách tất cả employees với filtering và pagination

**Access:** 🔒 Admin, Manager  
**Business Logic:** [01-BUSINESS-LOGIC.md § Authentication](01-BUSINESS-LOGIC.md#1-authentication--authorization)

**Request:**

```http
GET /api/employees?search=nguyen&branchId=65f1234567890abcdef11111&page=1&limit=20 HTTP/1.1
Host: localhost:5000
Authorization: Bearer {ADMIN_OR_MANAGER_TOKEN}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | ❌ No | Tìm kiếm theo tên hoặc số điện thoại |
| `status` | string | ❌ No | Filter: '1' (active) hoặc '0' (inactive) |
| `branchId` | ObjectId | ❌ No | Filter theo chi nhánh |
| `role` | string | ❌ No | Filter: 'admin' \| 'manager' \| 'employee' |
| `page` | number | ❌ No | Số trang (default: 1) |
| `limit` | number | ❌ No | Items per page (default: 20, max: 100) |

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "_id": "65f1234567890abcdef12345",
        "Ho_va_ten": "Nguyễn Văn A",
        "So_dien_thoai": "0987654321",
        "Email": "nguyenvana@example.com",
        "ID_Branch": {
          "_id": "65f1234567890abcdef11111",
          "Ten_chi_nhanh": "Chi nhánh Quận 1"
        },
        "ID_nhom": {
          "_id": "65f1234567890abcdef22222",
          "Ten_nhom": "Nhân viên"
        },
        "role": "employee",
        "Trang_thai": "1",
        "is_timekeeping_all": "true",
        "Salary": "5000000",
        "createdAt": "2026-01-15T08:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 87,
      "itemsPerPage": 20
    }
  }
}
```

**Response 403 (Not Authorized):**

```json
{
  "success": false,
  "message": "Chỉ Admin và Manager được xem danh sách employees"
}
```

**Implementation:**
- File: `src/controllers/employeeController.js`
- Function: `getEmployees()`

**cURL Example:**

```bash
curl -X GET "http://localhost:5000/api/employees?search=nguyen&page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Notes:**
- Manager có thể xem tất cả employees (không giới hạn theo branch của mình)
- Search hỗ trợ partial match với tên và số điện thoại
- Results được populate với Branch và GroupUser info
- Role field được computed từ GroupUser.Ten_nhom

⚠️ **DATA TYPE WARNING (Rule 6):**
- `Trang_thai`: String "1" (active) hoặc "0" (inactive) - **KHÔNG phải Boolean**
- `is_timekeeping_all`: String "true"/"false" - **KHÔNG phải Boolean**
- `Salary`: String "5000000" - **KHÔNG phải Number**
- **Frontend PHẢI parse** khi cần logic checks hoặc calculations:
  ```javascript
  // Check active status
  const isActive = employee.Trang_thai === "1";  // NOT: if (employee.Trang_thai)
  
  // Check timekeeping
  const canTrackAll = employee.is_timekeeping_all === "true";  // NOT: if (employee.is_timekeeping_all)
  
  // Calculate total
  const salary = parseInt(employee.Salary);  // NOT: employee.Salary + bonus
  ```

⚠️ **READ-ONLY WARNING (Rule 1):**
- Employee data synced từ external HR system
- **KHÔNG có** CREATE/UPDATE/DELETE operations
- Muốn thay đổi employee info → Phải thay đổi trong HR system

---

### GET /api/employees/:id

**Mô tả:** Lấy chi tiết employee theo ID

**Access:** 🔒 Private (All authenticated users)  
**Business Logic:** [01-BUSINESS-LOGIC.md § Authentication](01-BUSINESS-LOGIC.md#1-authentication--authorization)

**Request:**

```http
GET /api/employees/65f1234567890abcdef12345 HTTP/1.1
Host: localhost:5000
Authorization: Bearer {TOKEN}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | ObjectId | ✅ Yes | Employee ObjectId |

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "_id": "65f1234567890abcdef12345",
    "Ho_va_ten": "Nguyễn Văn A",
    "So_dien_thoai": "0987654321",
    "Email": "nguyenvana@example.com",
    "ID_Branch": {
      "_id": "65f1234567890abcdef11111",
      "Ten_chi_nhanh": "Chi nhánh Quận 1",
      "Dia_chi": "123 Nguyễn Huệ, Quận 1",
      "Active": "true"
    },
    "ID_nhom": {
      "_id": "65f1234567890abcdef22222",
      "Ten_nhom": "Nhân viên",
      "Trang_thai": 1
    },
    "role": "employee",
    "Trang_thai": "1",
    "is_timekeeping_all": "true",
    "Salary": "5000000",
    "Allowance": "500000",
    "createdAt": "2026-01-15T08:00:00.000Z",
    "updatedAt": "2026-03-10T14:30:00.000Z"
  }
}
```

**Response 404 (Employee Not Found):**

```json
{
  "success": false,
  "message": "Không tìm thấy employee"
}
```

**Implementation:**
- File: `src/controllers/employeeController.js`
- Function: `getEmployeeById()`

**cURL Example:**

```bash
curl -X GET http://localhost:5000/api/employees/65f1234567890abcdef12345 \
  -H "Authorization: Bearer TOKEN"
```

**Notes:**
- Tất cả users authenticated đều xem được employee info (không restrict)
- Response includes full Branch và GroupUser details (populated)
- Role field computed từ GroupUser.Ten_nhom mapping
- Dùng cho display employee profile, assign tasks, etc.

⚠️ **DATA TYPE WARNING (Rule 6):**
- Tất cả numeric fields (`Salary`, `Allowance`) đều là **String**, không phải Number
- Boolean fields (`is_timekeeping_all`) là **String "true"/"false"**
- Status fields không nhất quán:
  - `Employee.Trang_thai`: String "1"/"0"
  - `Branch.Active`: String "true"/"false"
  - `GroupUser.Trang_thai`: Number 1/0
- **PHẢI kiểm tra từng field** để parse đúng

⚠️ **MODEL REFERENCE WARNING (Rule 3):**
- `ID_Branch` refs to model `'Brand'` (not `'Branch'`!)
- `ID_nhom` refs to model `'GroupUser'`
- Populate sử dụng: `.populate('ID_Branch ID_nhom')`
- Collection names: `Branch` (for Brand), `Group_User` (for GroupUser)

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

**Mô tả:** Lấy danh sách tất cả brands/stores với filtering và pagination

**Access:** 🔒 Private (All authenticated users)  
**Business Logic:** [01-BUSINESS-LOGIC.md § Store Management](01-BUSINESS-LOGIC.md#3-storetask-workflow)

**Request:**

```http
GET /api/brands?search=quận&active=true&page=1&limit=20 HTTP/1.1
Host: localhost:5000
Authorization: Bearer {TOKEN}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | ❌ No | Tìm kiếm theo tên chi nhánh |
| `active` | string | ❌ No | Filter: "true" (active) hoặc "false" (inactive) |
| `page` | number | ❌ No | Số trang (default: 1) |
| `limit` | number | ❌ No | Items per page (default: 20, max: 100) |

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "brands": [
      {
        "_id": "65f1234567890abcdef11111",
        "Ten_chi_nhanh": "Chi nhánh Quận 1",
        "Dia_chi": "123 Nguyễn Huệ, Quận 1, TP.HCM",
        "Dien_thoai": "0289876543",
        "Active": "true",
        "Active_Schedule": "true",
        "createdAt": "2025-12-01T08:00:00.000Z"
      },
      {
        "_id": "65f1234567890abcdef11112",
        "Ten_chi_nhanh": "Chi nhánh Quận 3",
        "Dia_chi": "456 Lê Văn Sỹ, Quận 3, TP.HCM",
        "Dien_thoai": "0289876544",
        "Active": "true",
        "Active_Schedule": "false",
        "createdAt": "2025-12-05T08:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 52,
      "itemsPerPage": 20
    }
  }
}
```

**Implementation:**
- File: `src/controllers/brandController.js`
- Function: `getBrands()`

**cURL Example:**

```bash
curl -X GET "http://localhost:5000/api/brands?active=true&page=1" \
  -H "Authorization: Bearer TOKEN"
```

**Notes:**
- Tất cả authenticated users đều có thể xem brands (không restrict theo role)
- Dùng để populate dropdowns, display store info, assign broadcasts
- Search hỗ trợ partial match với tên chi nhánh

⚠️ **DATA TYPE WARNING (Rule 6):**
- `Active`: String **"true"/"false"** - KHÔNG phải Boolean!
- `Active_Schedule`: String **"true"/"false"** - KHÔNG phải Boolean!
- **Frontend PHẢI parse:**
  ```javascript
  // Check if brand is active
  const isActive = brand.Active === "true";  // NOT: if (brand.Active)
  
  // Check if schedule is active
  const hasSchedule = brand.Active_Schedule === "true";  // NOT: if (brand.Active_Schedule)
  ```

⚠️ **READ-ONLY WARNING (Rule 1):**
- Brand data synced từ external ERP system
- **KHÔNG có** CREATE/UPDATE/DELETE operations
- Muốn thêm/sửa store → Phải thay đổi trong ERP system

---

### GET /api/brands/:id

**Mô tả:** Lấy chi tiết brand/store theo ID

**Access:** 🔒 Private (All authenticated users)  
**Business Logic:** [01-BUSINESS-LOGIC.md § Store Management](01-BUSINESS-LOGIC.md#3-storetask-workflow)

**Request:**

```http
GET /api/brands/65f1234567890abcdef11111 HTTP/1.1
Host: localhost:5000
Authorization: Bearer {TOKEN}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | ObjectId | ✅ Yes | Brand ObjectId |

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "_id": "65f1234567890abcdef11111",
    "Ten_chi_nhanh": "Chi nhánh Quận 1",
    "Dia_chi": "123 Nguyễn Huệ, Quận 1, TP.HCM",
    "Dien_thoai": "0289876543",
    "Email": "quan1@example.com",
    "Active": "true",
    "Active_Schedule": "true",
    "Ghi_chu": "Chi nhánh trung tâm",
    "createdAt": "2025-12-01T08:00:00.000Z",
    "updatedAt": "2026-02-15T10:30:00.000Z"
  }
}
```

**Response 404 (Brand Not Found):**

```json
{
  "success": false,
  "message": "Không tìm thấy brand"
}
```

**Implementation:**
- File: `src/controllers/brandController.js`
- Function: `getBrandById()`

**cURL Example:**

```bash
curl -X GET http://localhost:5000/api/brands/65f1234567890abcdef11111 \
  -H "Authorization: Bearer TOKEN"
```

**Notes:**
- Tất cả authenticated users xem được detail
- Dùng để display store profile, check active status
- Không populate employees (dùng GET /api/brands/:id/employees riêng)

⚠️ **DATA TYPE WARNING (Rule 6):**
- `Active` và `Active_Schedule`: **String "true"/"false"**, không phải Boolean
- **Inconsistency:** Brand status dùng String, Employee status dùng "1"/"0", GroupUser status dùng Number 1/0

⚠️ **NAMING CONFUSION:**
- **Model name:** `Brand` (trong code)
- **Collection name:** `Branch` (trong MongoDB)
- **Display name:** "Chi nhánh" hoặc "Store" (trong UI)
- **Field tham chiếu:** `ID_Branch` (trong Employee model)

---

### GET /api/brands/:id/employees

**Mô tả:** Lấy danh sách employees thuộc brand/store này

**Access:** 🔒 Admin, Manager  
**Business Logic:** [01-BUSINESS-LOGIC.md § Store Management](01-BUSINESS-LOGIC.md#3-storetask-workflow)

**Request:**

```http
GET /api/brands/65f1234567890abcdef11111/employees HTTP/1.1
Host: localhost:5000
Authorization: Bearer {MANAGER_TOKEN}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | ObjectId | ✅ Yes | Brand ObjectId |

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "brand": {
      "_id": "65f1234567890abcdef11111",
      "Ten_chi_nhanh": "Chi nhánh Quận 1"
    },
    "employees": [
      {
        "_id": "65f1234567890abcdef12345",
        "Ho_va_ten": "Nguyễn Văn A",
        "So_dien_thoai": "0987654321",
        "Email": "nguyenvana@example.com",
        "ID_nhom": {
          "_id": "65f1234567890abcdef22222",
          "Ten_nhom": "Nhân viên"
        },
        "role": "employee",
        "Trang_thai": "1"
      },
      {
        "_id": "65f1234567890abcdef12346",
        "Ho_va_ten": "Trần Thị B",
        "So_dien_thoai": "0987654322",
        "Email": "tranthib@example.com",
        "ID_nhom": {
          "_id": "65f1234567890abcdef22223",
          "Ten_nhom": "Quản lý"
        },
        "role": "manager",
        "Trang_thai": "1"
      }
    ],
    "total": 15
  }
}
```

**Response 403 (Not Authorized - Manager accessing another branch):**

```json
{
  "success": false,
  "message": "Bạn chỉ được xem employees của chi nhánh mình"
}
```

**Response 404 (Brand Not Found):**

```json
{
  "success": false,
  "message": "Không tìm thấy brand"
}
```

**Implementation:**
- File: `src/controllers/brandController.js`
- Function: `getBrandEmployees()`

**cURL Example:**

```bash
curl -X GET http://localhost:5000/api/brands/65f1234567890abcdef11111/employees \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

**Notes:**
- **Admin:** Có thể xem employees của tất cả branches
- **Manager:** Chỉ xem được employees của branch mình (check `manager.ID_Branch === brandId`)
- Dùng để assign tasks, manage team, view org chart

⚠️ **AUTHORIZATION LOGIC (Rule 7):**
- **Manager restriction:**
  ```javascript
  if (req.user.role === 'manager') {
    const manager = await Employee.findById(req.user._id).populate('ID_Branch');
    if (manager.ID_Branch._id.toString() !== brandId) {
      return res.status(403).json({ message: 'Bạn chỉ được xem employees của chi nhánh mình' });
    }
  }
  ```
- **Admin:** No restriction, full access

⚠️ **DATA TYPE WARNING (Rule 6):**
- Employee fields vẫn có data type issues:
  - `Trang_thai`: String "1"/"0"
  - `is_timekeeping_all`: String "true"/"false"
  - Frontend phải parse khi cần logic checks

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

---

### POST /api/broadcasts

**Mô tả:** Tạo broadcast mới (status = draft)

**Access:** 🔒 Admin only  
**Business Logic:** [01-BUSINESS-LOGIC.md § Broadcast Management](01-BUSINESS-LOGIC.md#2-broadcast-management)

**Request:**

```http
POST /api/broadcasts HTTP/1.1
Host: localhost:5000
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "title": "Kiểm tra vệ sinh cửa hàng tháng 3",
  "description": "Kiểm tra và đảm bảo vệ sinh toàn bộ cửa hàng",
  "priority": "high",
  "deadline": "2026-03-31T23:59:59.000Z",
  "assignedStores": ["65f1234567890abcdef11111", "65f1234567890abcdef11112"],
  "checklist": [
    {
      "title": "Lau sàn nhà",
      "description": "Lau sạch toàn bộ sàn",
      "required": true
    },
    {
      "title": "Chụp ảnh sau khi hoàn thành",
      "required": true
    }
  ],
  "attachments": [
    {
      "url": "https://example.com/guide.pdf",
      "filename": "huong-dan-ve-sinh.pdf",
      "type": "document"
    }
  ],
  "recurring": {
    "enabled": true,
    "frequency": "monthly",
    "interval": 1,
    "dayOfMonth": 25
  }
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ Yes | Tiêu đề broadcast (max 200 chars) |
| `description` | string | ✅ Yes | Mô tả chi tiết |
| `priority` | string | ❌ No | 'low' \| 'medium' \| 'high' \| 'urgent' (default: 'medium') |
| `deadline` | Date | ✅ Yes | Deadline (phải là thời gian tương lai) |
| `assignedStores` | array | ✅ Yes | Array of Brand ObjectIds |
| `checklist` | array | ❌ No | Array of checklist items |
| `attachments` | array | ❌ No | Array of attachment objects |
| `recurring` | object | ❌ No | Recurring pattern config |

**Checklist Item Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ Yes | Tiêu đề item |
| `description` | string | ❌ No | Mô tả chi tiết |
| `required` | boolean | ❌ No | Item bắt buộc? (default: false) |

**Recurring Pattern Schema:**

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `enabled` | boolean | - | Bật recurring? |
| `frequency` | string | 'daily' \| 'weekly' \| 'monthly' | Tần suất lặp lại |
| `interval` | number | 1-12 | Lặp lại mỗi N period |
| `dayOfWeek` | number | 0-6 | Ngày trong tuần (0=CN, nếu weekly) |
| `dayOfMonth` | number | 1-31 | Ngày trong tháng (nếu monthly) |

**Validation Rules:**
- `title`: Required, max 200 chars
- `description`: Required
- `deadline`: Phải là thời gian tương lai
- `assignedStores`: Phải có ít nhất 1 store, stores phải tồn tại
- `priority`: Phải thuộc ['low', 'medium', 'high', 'urgent']
- `recurring.frequency`: Nếu có recurring, phải có frequency
- `recurring.dayOfMonth`: Nếu monthly, phải có dayOfMonth (1-31)

**Response 201 (Success):**

```json
{
  "success": true,
  "message": "Broadcast đã được tạo thành công",
  "data": {
    "_id": "65f9876543210fedcba98765",
    "title": "Kiểm tra vệ sinh cửa hàng tháng 3",
    "description": "Kiểm tra và đảm bảo vệ sinh toàn bộ cửa hàng",
    "priority": "high",
    "status": "draft",
    "deadline": "2026-03-31T23:59:59.000Z",
    "assignedStores": ["65f1234567890abcdef11111", "65f1234567890abcdef11112"],
    "checklist": [...],
    "attachments": [...],
    "recurring": {...},
    "createdBy": "65f1234567890abcdef12345",
    "createdAt": "2026-03-19T10:00:00.000Z",
    "updatedAt": "2026-03-19T10:00:00.000Z"
  }
}
```

**Response 400 (Bad Request):**

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Deadline phải là thời gian tương lai",
    "Phải chọn ít nhất 1 cửa hàng"
  ]
}
```

**Response 403 (Forbidden):**

```json
{
  "success": false,
  "message": "Chỉ Admin mới có quyền tạo broadcast"
}
```

**Implementation:**
- File: `src/controllers/broadcastController.js`
- Function: `createBroadcast()`

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/broadcasts \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Kiểm tra vệ sinh tháng 3",
    "description": "Kiểm tra vệ sinh toàn bộ cửa hàng",
    "priority": "high",
    "deadline": "2026-03-31T23:59:59.000Z",
    "assignedStores": ["65f1234567890abcdef11111"],
    "checklist": [
      {"title": "Lau sàn", "required": true}
    ]
  }'
```

**Notes:**
- Broadcast được tạo với status="draft"
- Chưa tạo StoreTasks (phải publish trước)
- Admin có thể edit/delete broadcast ở trạng thái draft

⚠️ **WARNING - Recurring Broadcasts (Known Issue #5):**
- Mặc dù schema hỗ trợ `recurring` pattern (daily/weekly/monthly)
- **CHƯA CÓ CRON JOB** tự động publish broadcasts theo schedule
- Admin phải **PUBLISH THỦ CÔNG** mỗi lần cho đến khi scheduler được implement
- Recurring config hiện chỉ lưu trữ, không trigger auto-publish
- Roadmap: Cần implement cron job để auto-create & publish (estimated 8-12 hours)
- **Workaround hiện tại:** Admin tự tạo broadcast mới theo schedule thủ công

⚠️ **SECURITY WARNING - XSS Sanitization (Known Issue #7):**
- Các fields `title`, `description` **KHÔNG được sanitize** ở backend
- **Attack vector:** `<script>alert('XSS')</script>` trong title → Execute khi render HTML
- **Vulnerability:** Nếu Admin account bị compromise, attacker có thể inject malicious scripts
- **Workaround:** Frontend PHẢI escape HTML khi display:
  - ❌ `innerHTML` - KHÔNG dùng
  - ✅ `textContent` hoặc React auto-escape - PHẢI dùng
- **Fix needed:** Implement `sanitize-html` library ở `validateCreateBroadcast`
- **Priority:** MEDIUM - Có workaround ở frontend, chỉ Admin có quyền create

---

### GET /api/broadcasts

**Mô tả:** Lấy danh sách tất cả broadcasts (Admin view)

**Access:** 🔒 Admin only  
**Business Logic:** [01-BUSINESS-LOGIC.md § Broadcast Management](01-BUSINESS-LOGIC.md#2-broadcast-management)

**Request:**

```http
GET /api/broadcasts?status=published&priority=high&page=1&limit=20 HTTP/1.1
Host: localhost:5000
Authorization: Bearer {ADMIN_TOKEN}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | ❌ No | Filter: 'draft' \| 'published' |
| `priority` | string | ❌ No | Filter: 'low' \| 'medium' \| 'high' \| 'urgent' |
| `search` | string | ❌ No | Search trong title/description |
| `page` | number | ❌ No | Page number (default: 1) |
| `limit` | number | ❌ No | Items per page (default: 20) |

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "broadcasts": [
      {
        "_id": "65f9876543210fedcba98765",
        "title": "Kiểm tra vệ sinh tháng 3",
        "priority": "high",
        "status": "published",
        "deadline": "2026-03-31T23:59:59.000Z",
        "assignedStores": [
          {
            "_id": "65f1234567890abcdef11111",
            "Ten_thuong_hieu": "Chi nhánh HCM"
          }
        ],
        "createdBy": {
          "_id": "65f1234567890abcdef12345",
          "Ho_ten": "Admin User"
        },
        "createdAt": "2026-03-19T10:00:00.000Z",
        "totalStoreTasks": 5,
        "completedStoreTasks": 2
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 45,
      "itemsPerPage": 20
    }
  }
}
```

**cURL Example:**

```bash
curl -X GET "http://localhost:5000/api/broadcasts?status=published&page=1" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### GET /api/broadcasts/:id

**Mô tả:** Lấy chi tiết 1 broadcast với StoreTasks

**Access:** 🔒 Admin only  
**Business Logic:** [01-BUSINESS-LOGIC.md § Broadcast Management](01-BUSINESS-LOGIC.md#2-broadcast-management)

**Request:**

```http
GET /api/broadcasts/65f9876543210fedcba98765 HTTP/1.1
Host: localhost:5000
Authorization: Bearer {ADMIN_TOKEN}
```

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "_id": "65f9876543210fedcba98765",
    "title": "Kiểm tra vệ sinh tháng 3",
    "description": "Kiểm tra toàn bộ",
    "priority": "high",
    "status": "published",
    "deadline": "2026-03-31T23:59:59.000Z",
    "assignedStores": [...],
    "checklist": [...],
    "storeTasks": [
      {
        "_id": "65f9876543210fedcba98766",
        "storeId": {
          "_id": "65f1234567890abcdef11111",
          "Ten_thuong_hieu": "Chi nhánh HCM"
        },
        "status": "in_progress",
        "assignedEmployees": [
          {
            "_id": "65f1234567890abcdef12346",
            "Ho_ten": "Nguyễn Văn B"
          }
        ],
        "completionRate": 50
      }
    ],
    "createdAt": "2026-03-19T10:00:00.000Z"
  }
}
```

**Response 404:**

```json
{
  "success": false,
  "message": "Không tìm thấy broadcast"
}
```

**cURL Example:**

```bash
curl -X GET http://localhost:5000/api/broadcasts/65f9876543210fedcba98765 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### PUT /api/broadcasts/:id

**Mô tả:** Update broadcast (chỉ draft được edit)

**Access:** 🔒 Admin only  
**Business Logic:** [01-BUSINESS-LOGIC.md § Broadcast Management](01-BUSINESS-LOGIC.md#2-broadcast-management)

**Request:**

```http
PUT /api/broadcasts/65f9876543210fedcba98765 HTTP/1.1
Host: localhost:5000
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "title": "Kiểm tra vệ sinh tháng 3 (updated)",
  "priority": "urgent",
  "deadline": "2026-03-30T23:59:59.000Z"
}
```

**Validation:**
- Chỉ update được broadcast có status="draft"
- Không update được published broadcasts

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Broadcast đã được cập nhật",
  "data": {
    "_id": "65f9876543210fedcba98765",
    "title": "Kiểm tra vệ sinh tháng 3 (updated)",
    "priority": "urgent",
    "status": "draft",
    ...
  }
}
```

**Response 400 (Broadcast đã published):**

```json
{
  "success": false,
  "message": "Không thể sửa broadcast đã published"
}
```

**cURL Example:**

```bash
curl -X PUT http://localhost:5000/api/broadcasts/65f9876543210fedcba98765 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated title", "priority": "urgent"}'
```

---

### DELETE /api/broadcasts/:id

**Mô tả:** Xóa broadcast (chỉ draft được xóa)

**Access:** 🔒 Admin only  
**Business Logic:** [01-BUSINESS-LOGIC.md § Broadcast Management](01-BUSINESS-LOGIC.md#2-broadcast-management)

**Request:**

```http
DELETE /api/broadcasts/65f9876543210fedcba98765 HTTP/1.1
Host: localhost:5000
Authorization: Bearer {ADMIN_TOKEN}
```

**Validation:**
- Chỉ xóa được broadcast có status="draft"
- Không xóa được published broadcasts (đã có StoreTasks)

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Broadcast đã được xóa"
}
```

**Response 400 (Broadcast đã published):**

```json
{
  "success": false,
  "message": "Không thể xóa broadcast đã published"
}
```

**cURL Example:**

```bash
curl -X DELETE http://localhost:5000/api/broadcasts/65f9876543210fedcba98765 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### POST /api/broadcasts/:id/publish

**Mô tả:** Publish broadcast → Tạo StoreTasks cho các stores → Notify managers

**Access:** 🔒 Admin only  
**Business Logic:** [01-BUSINESS-LOGIC.md § Broadcast Management](01-BUSINESS-LOGIC.md#2-broadcast-management)

**Request:**

```http
POST /api/broadcasts/65f9876543210fedcba98765/publish HTTP/1.1
Host: localhost:5000
Authorization: Bearer {ADMIN_TOKEN}
```

**Validation:**
- Broadcast phải có status="draft"
- Phải có assignedStores
- Deadline phải là thời gian tương lai

**Process:**
1. Validate broadcast draft
2. Tìm manager cho mỗi store (từ Employee.ID_Branch + GroupUser role)
3. Tạo StoreTask cho mỗi store
4. Tạo Notification cho mỗi manager
5. Update broadcast status → "published"

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Broadcast đã được publish",
  "data": {
    "broadcast": {
      "_id": "65f9876543210fedcba98765",
      "status": "published",
      ...
    },
    "storeTasksCreated": 5,
    "notificationsSent": 5
  }
}
```

**Response 400 (Broadcast không phải draft):**

```json
{
  "success": false,
  "message": "Chỉ có thể publish broadcast ở trạng thái draft"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/broadcasts/65f9876543210fedcba98765/publish \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Notes:**
- Sau khi publish, không thể edit/delete broadcast
- StoreTasks được auto-create với status="pending"
- Managers nhận notification ngay lập tức

⚠️ **WARNING - Duplicate UserTask Bug:**
- **Known Issue:** Nếu publish lại StoreTask (hoặc re-assign employees), có thể tạo DUPLICATE UserTasks
- Root cause: Logic chưa check existing UserTask trước khi create
- **Workaround:** 
  - Kiểm tra kỹ trước khi publish
  - Không publish lại broadcast đã published
  - Dùng reassign endpoint thay vì publish lại
- **Fix needed:** Add check `UserTask.findOne({ employeeId, storeTaskId })` trước khi create
- Impact: Employee có thể thấy duplicate tasks trong dashboard
- Priority: MEDIUM (có workaround)

⚠️ **SECURITY WARNING - Rate Limiting (Known Issue #8):**
- Endpoint publish **KHÔNG có rate limiting**
- **Attack vector:** Spam publish → Tạo hàng ngàn UserTask/StorTask → Database/server overload
- **Impact:** Server crash nếu broadcast assign to 500+ employees và publish 100+ lần
- **Workaround:** Business logic limit (chỉ Admin có quyền publish) + Monitor logs
- **Fix needed:** Rate limit 10 requests/minute per user
- **Priority:** MEDIUM - Chỉ Admin access, nhưng vẫn risky

---

### POST /api/broadcasts/:id/assign

**Mô tả:** Assign broadcast directly đến stores hoặc employees (2 modes)

**Access:** 🔒 Admin only  
**Business Logic:** [01-BUSINESS-LOGIC.md § Broadcast Management](01-BUSINESS-LOGIC.md#2-broadcast-management)

**Request Mode 1 (Store Assignments):**

```http
POST /api/broadcasts/65f9876543210fedcba98765/assign HTTP/1.1
Host: localhost:5000
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "storeAssignments": [
    {
      "storeId": "65f1234567890abcdef11111",
      "employeeIds": ["65f1234567890abcdef12346", "65f1234567890abcdef12347"]
    },
    {
      "storeId": "65f1234567890abcdef11112",
      "employeeIds": ["65f1234567890abcdef12348"]
    }
  ]
}
```

**Request Mode 2 (Direct Employee Assignment):**

```http
POST /api/broadcasts/65f9876543210fedcba98765/assign HTTP/1.1
Host: localhost:5000
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "employeeIds": ["65f1234567890abcdef12346", "65f1234567890abcdef12347"]
}
```

**Process:**
- **Mode 1:** Tạo/Update StoreTasks → Assign employees → Create UserTasks
- **Mode 2:** Direct assign employees → Create UserTasks (auto-detect stores)

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Assign thành công",
  "data": {
    "storeTasksCreated": 2,
    "userTasksCreated": 3,
    "notificationsSent": 3
  }
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/broadcasts/65f9876543210fedcba98765/assign \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storeAssignments": [
      {
        "storeId": "65f1234567890abcdef11111",
        "employeeIds": ["65f1234567890abcdef12346"]
      }
    ]
  }'
```

---

### PUT /api/broadcasts/user-tasks/:taskId

**Mô tả:** Reassign UserTask sang employee khác (Admin feature)

**Access:** 🔒 Admin only  
**Business Logic:** [01-BUSINESS-LOGIC.md § UserTask Workflow](01-BUSINESS-LOGIC.md#4-usertask-workflow)

⚠️ **FIXED March 18, 2026:** Dùng `userTaskId` (không phải storeTaskId)

**Request:**

```http
PUT /api/broadcasts/user-tasks/65fa123456789abcdef00001 HTTP/1.1
Host: localhost:5000
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "employeeId": "65f1234567890abcdef12349"
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `employeeId` | string | ✅ Yes | ObjectId của employee mới |

**Validation:**
- UserTask phải tồn tại
- UserTask chưa completed
- Employee mới phải active
- Employee mới không được có task này rồi

**Process:**
1. Find UserTask by taskId
2. Update UserTask.employeeId → new employee
3. Nếu employee mới thuộc store khác:
   - Find/Create StoreTask cho store mới
   - Update UserTask.storeTaskId
   - Remove từ old StoreTask.assignedEmployees
   - Add vào new StoreTask.assignedEmployees
4. Create notification cho employee mới
5. Create notification cho old employee (task removed)

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Reassign thành công",
  "data": {
    "userTask": {
      "_id": "65fa123456789abcdef00001",
      "employeeId": "65f1234567890abcdef12349",
      "oldEmployeeId": "65f1234567890abcdef12346",
      ...
    }
  }
}
```

**Response 400 (Task đã completed):**

```json
{
  "success": false,
  "message": "Không thể reassign task đã hoàn thành"
}
```

**Implementation:**
- File: `src/controllers/broadcastController.js`
- Function: `updateUserTask()` (renamed from reassignTask)
- **Bug History:** Trước đây dùng sai storeTaskId, đã fix 18/03/2026

**cURL Example:**

```bash
curl -X PUT http://localhost:5000/api/broadcasts/user-tasks/65fa123456789abcdef00001 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"employeeId": "65f1234567890abcdef12349"}'
```

**Notes:**
- ⚠️ Endpoint parameter là `taskId` = **userTaskId** (không phải storeTaskId)
- Có thể reassign cross-store (tự động xử lý StoreTask changes)
- Không tạo UserTask mới - chỉ update existing UserTask
- Old employee và new employee đều nhận notification

---

### DELETE /api/broadcasts/user-tasks/:taskId

**Mô tả:** Xóa UserTask (Admin feature, không xóa được completed tasks)

**Access:** 🔒 Admin only  
**Business Logic:** [01-BUSINESS-LOGIC.md § UserTask Workflow](01-BUSINESS-LOGIC.md#4-usertask-workflow)

⚠️ **FIXED March 18, 2026:** Dùng `userTaskId` (không phải storeTaskId)

**Request:**

```http
DELETE /api/broadcasts/user-tasks/65fa123456789abcdef00001 HTTP/1.1
Host: localhost:5000
Authorization: Bearer {ADMIN_TOKEN}
```

**Validation:**
- UserTask phải có userTaskId (phải đã assigned)
- UserTask chưa completed

**Process:**
1. Find UserTask by taskId
2. Delete UserTask document
3. Remove từ StoreTask.assignedEmployees
4. Update StoreTask completion rate
5. Create notification cho employee (task cancelled)

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "UserTask đã được xóa"
}
```

**Response 400 (Task đã completed):**

```json
{
  "success": false,
  "message": "Không thể xóa task đã hoàn thành"
}
```

**Implementation:**
- File: `src/controllers/broadcastController.js`
- Function: `deleteUserTask()` (renamed from deleteTask)
- **Bug History:** Trước đây dùng sai storeTaskId, đã fix 18/03/2026

**cURL Example:**

```bash
curl -X DELETE http://localhost:5000/api/broadcasts/user-tasks/65fa123456789abcdef00001 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Notes:**
- ⚠️ Endpoint parameter là `taskId` = **userTaskId** (không phải storeTaskId)
- UserTask document bị xóa hoàn toàn
- StoreTask completion rate được recalculate
- Employee nhận notification task bị cancelled

---

## 5️⃣ STORE TASKS

**Base Path:** `/api/store-tasks`  
**File:** `src/routes/storeTaskRoutes.js`  
**Controller:** `src/controllers/storeTaskController.js`  
**Validators:** `src/validators/storeTaskValidator.js`

### GET /api/store-tasks

**Mô tả:** Lấy danh sách tất cả StoreTasks với filtering và pagination

**Access:** 🔒 Admin, Manager  
**Business Logic:** [01-BUSINESS-LOGIC.md § StoreTask Workflow](01-BUSINESS-LOGIC.md#3-storetask-workflow)

**Request:**

```http
GET /api/store-tasks?status=pending&storeId=65f1234567890abcdef11111&page=1&limit=20 HTTP/1.1
Host: localhost:5000
Authorization: Bearer {MANAGER_TOKEN}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | ❌ No | Filter: 'pending' \| 'accepted' \| 'in_progress' \| 'completed' \| 'rejected' |
| `storeId` | ObjectId | ❌ No | Filter theo cửa hàng |
| `broadcastId` | ObjectId | ❌ No | Filter theo broadcast |
| `page` | number | ❌ No | Số trang (default: 1) |
| `limit` | number | ❌ No | Items per page (default: 20, max: 100) |

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "storeTasks": [
      {
        "_id": "65f9876543210fedcba98766",
        "broadcastId": {
          "_id": "65f9876543210fedcba98765",
          "title": "Kiểm tra vệ sinh tháng 3"
        },
        "storeId": {
          "_id": "65f1234567890abcdef11111",
          "Ten_chi_nhanh": "Chi nhánh Quận 1"
        },
        "status": "pending",
        "priority": "high",
        "deadline": "2026-03-31T23:59:59.000Z",
        "assignedEmployees": [],
        "completionRate": 0,
        "createdAt": "2026-03-19T08:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 35,
      "itemsPerPage": 20
    }
  }
}
```

**Response 403 (Manager accessing other store's tasks):**

```json
{
  "success": false,
  "message": "Bạn chỉ được xem tasks của cửa hàng mình"
}
```

**Implementation:**
- File: `src/controllers/storeTaskController.js`
- Function: `getStoreTasks()`

**cURL Example:**

```bash
curl -X GET "http://localhost:5000/api/store-tasks?status=pending" \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

**Notes:**
- **Admin:** Xem tất cả StoreTasks của all stores
- **Manager:** Chỉ xem StoreTasks của store mình (filter by manager.ID_Branch)
- Results được populate với broadcast và store info
- `completionRate` computed from UserTasks progress

⚠️ **AUTHORIZATION LOGIC (Rule 7):**
- **Manager restriction:**
  ```javascript
  if (req.user.role === 'manager') {
    const manager = await Employee.findById(req.user._id).populate('ID_Branch');
    query.storeId = manager.ID_Branch._id;  // Auto-filter
  }
  ```
- **Admin:** No filter, xem tất cả

---

### GET /api/store-tasks/:id

**Mô tả:** Lấy chi tiết StoreTask theo ID

**Access:** 🔒 Admin, Manager (own store)  
**Business Logic:** [01-BUSINESS-LOGIC.md § StoreTask Workflow](01-BUSINESS-LOGIC.md#3-storetask-workflow)

**Request:**

```http
GET /api/store-tasks/65f9876543210fedcba98766 HTTP/1.1
Host: localhost:5000
Authorization: Bearer {MANAGER_TOKEN}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | ObjectId | ✅ Yes | StoreTask ObjectId |

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "_id": "65f9876543210fedcba98766",
    "broadcastId": {
      "_id": "65f9876543210fedcba98765",
      "title": "Kiểm tra vệ sinh tháng 3",
      "description": "Kiểm tra và đảm bảo vệ sinh toàn bộ cửa hàng",
      "priority": "high",
      "checklist": [
        {
          "title": "Lau sàn nhà",
          "required": true
        }
      ],
      "attachments": []
    },
    "storeId": {
      "_id": "65f1234567890abcdef11111",
      "Ten_chi_nhanh": "Chi nhánh Quận 1",
      "Dia_chi": "123 Nguyễn Huệ, Quận 1"
    },
    "status": "in_progress",
    "priority": "high",
    "deadline": "2026-03-31T23:59:59.000Z",
    "assignedEmployees": [
      "65f1234567890abcdef12346",
      "65f1234567890abcdef12347"
    ],
    "assignedBy": {
      "_id": "65f1234567890abcdef12345",
      "Ho_va_ten": "Trần Thị Manager"
    },
    "acceptedAt": "2026-03-20T08:00:00.000Z",
    "acceptedBy": "65f1234567890abcdef12345",
    "completionRate": 65,
    "userTasks": [
      {
        "_id": "65fa123456789abcdef00001",
        "employeeId": "65f1234567890abcdef12346",
        "status": "in_progress",
        "progress": 50
      },
      {
        "_id": "65fa123456789abcdef00002",
        "employeeId": "65f1234567890abcdef12347",
        "status": "approved",
        "progress": 100
      }
    ],
    "createdAt": "2026-03-19T08:00:00.000Z"
  }
}
```

**Response 403 (Manager accessing other store's task):**

```json
{
  "success": false,
  "message": "Bạn không có quyền xem task này"
}
```

**Response 404 (StoreTask Not Found):**

```json
{
  "success": false,
  "message": "Không tìm thấy StoreTask"
}
```

**Implementation:**
- File: `src/controllers/storeTaskController.js`
- Function: `getStoreTaskById()`

**cURL Example:**

```bash
curl -X GET http://localhost:5000/api/store-tasks/65f9876543210fedcba98766 \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

**Notes:**
- Manager chỉ xem được StoreTask của store mình
- Response includes full broadcast details (checklist, attachments)
- Includes array of UserTasks với employee progress
- `completionRate` = average progress của tất cả UserTasks

⚠️ **AUTHORIZATION LOGIC (Rule 7):**
- **Manager validation:**
  ```javascript
  if (req.user.role === 'manager') {
    const manager = await Employee.findById(req.user._id).populate('ID_Branch');
    const storeTask = await StoreTask.findById(id).populate('storeId');
    
    if (storeTask.storeId._id.toString() !== manager.ID_Branch._id.toString()) {
      return res.status(403).json({ message: 'Không có quyền xem' });
    }
  }
  ```

---

### PUT /api/store-tasks/:id/accept

**Mô tả:** Manager chấp nhận StoreTask (status: pending → accepted)

**Access:** 🔒 Manager only (own store)  
**Business Logic:** [01-BUSINESS-LOGIC.md § StoreTask Workflow](01-BUSINESS-LOGIC.md#3-storetask-workflow)

**Request:**

```http
PUT /api/store-tasks/:id/accept HTTP/1.1
Host: localhost:5000
Authorization: Bearer {MANAGER_TOKEN}
```

**Validation:**
- Manager phải là manager của store này (check Employee.ID_Branch)
- StoreTask phải có status="pending"
- StoreTask chưa bị reject hoặc complete

**Process:**
1. Validate manager owns this store
2. Check StoreTask status = "pending"
3. Update status → "accepted"
4. Set acceptedAt timestamp
5. Set acceptedBy = manager employeeId
6. Create notification cho admin (task accepted)

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "StoreTask đã được chấp nhận",
  "data": {
    "_id": "65f9876543210fedcba98766",
    "broadcastId": "65f9876543210fedcba98765",
    "storeId": "65f1234567890abcdef11111",
    "status": "accepted",
    "acceptedAt": "2026-03-20T08:00:00.000Z",
    "acceptedBy": "65f1234567890abcdef12345"
  }
}
```

**Response 403 (Not Manager of This Store):**

```json
{
  "success": false,
  "message": "Bạn không phải manager của cửa hàng này"
}
```

**Response 400 (Already Accepted/Rejected):**

```json
{
  "success": false,
  "message": "StoreTask đã được xử lý rồi"
}
```

**Implementation:**
- File: `src/controllers/storeTaskController.js`
- Function: `acceptStoreTask()`

**cURL Example:**

```bash
curl -X PUT http://localhost:5000/api/store-tasks/65f9876543210fedcba98766/accept \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

⚠️ **CRITICAL - Status Transition Logic:**
- Khi accept: status chuyển `pending` → `accepted`
- **KHÔNG Tự động** chuyển sang `in_progress`!
- Status `in_progress` chỉ kích hoạt khi:
  - Manager assign employees (POST /api/store-tasks/:id/assign)
  - UserTasks được tạo
  - Có ít nhất 1 employee được giao việc
- **Workflow đúng:**
  1. Admin publish broadcast → StoreTask status="pending"
  2. Manager accept → StoreTask status="accepted"
  3. Manager assign employees → StoreTask status="in_progress" + create UserTasks
  4. Employees làm việc → UserTask status changes
  5. All UserTasks done → StoreTask status="completed"
- **Common mistake:** Developers nghĩ accept = in_progress → SAI!
- **Frontend UX:** Sau khi accept, hiện button "Assign Employees" để manager giao việc

---

### PUT /api/store-tasks/:id/reject

**Mô tả:** Manager từ chối StoreTask với lý do (status: pending/accepted → rejected)

**Access:** 🔒 Manager only (own store)  
**Business Logic:** [01-BUSINESS-LOGIC.md § StoreTask Workflow](01-BUSINESS-LOGIC.md#3-storetask-workflow)

**Request:**

```http
PUT /api/store-tasks/65f9876543210fedcba98766/reject HTTP/1.1
Host: localhost:5000
Authorization: Bearer {MANAGER_TOKEN}
Content-Type: application/json

{
  "reason": "Cửa hàng đang sửa chữa, không thể thực hiện task này"
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | ✅ Yes | Lý do từ chối (min 10 chars) |

**Validation:**
- Manager phải là manager của store này
- StoreTask phải có status="pending" hoặc "accepted"
- Reason không được rỗng và phải đủ 10 ký tự

**Process:**
1. Validate manager owns this store
2. Check StoreTask status = "pending" or "accepted"
3. Update status → "rejected"
4. Set rejectedAt timestamp
5. Set rejectedBy = manager employeeId
6. Set rejectionReason = reason
7. Delete tất cả UserTasks đã assigned (nếu có)
8. Create notification cho Admin và employees (task cancelled)

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "StoreTask đã bị từ chối",
  "data": {
    "_id": "65f9876543210fedcba98766",
    "status": "rejected",
    "rejectedAt": "2026-03-20T09:00:00.000Z",
    "rejectedBy": "65f1234567890abcdef12345",
    "rejectionReason": "Cửa hàng đang sửa chữa, không thể thực hiện task này",
    "userTasksDeleted": 2
  }
}
```

**Response 400 (Invalid Status):**

```json
{
  "success": false,
  "message": "Chỉ có thể reject task ở trạng thái pending hoặc accepted"
}
```

**Response 403 (Not Manager of This Store):**

```json
{
  "success": false,
  "message": "Bạn không phải manager của cửa hàng này"
}
```

**Implementation:**
- File: `src/controllers/storeTaskController.js`
- Function: `rejectStoreTask()`

**cURL Example:**

```bash
curl -X PUT http://localhost:5000/api/store-tasks/65f9876543210fedcba98766/reject \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Cửa hàng đang sửa chữa"}'
```

**Notes:**
- Reject task sẽ **xóa tất cả UserTasks** đã assigned (employees không còn task này)
- Admin và employees nhận notification task cancelled
- Manager cần provide lý do hợp lệ (min 10 chars)

⚠️ **AUTHORIZATION LOGIC (Rule 7):**
- Manager phải own store: `manager.ID_Branch === storeTask.storeId`
- Không reject được task của store khác (403)

⚠️ **SIDE EFFECT - UserTask Deletion:**
- Tất cả UserTasks liên quan đều bị **xóa**
- Employees nhận notification: "Task {title} đã bị hủy bởi manager: {reason}"
- Database cleanup: `UserTask.deleteMany({ storeTaskId })`

---

### POST /api/store-tasks/:id/assign

**Mô tả:** Manager assign employees vào StoreTask → Tạo UserTasks (status: accepted → in_progress)

**Access:** 🔒 Manager only (own store)  
**Business Logic:** [01-BUSINESS-LOGIC.md § StoreTask Workflow](01-BUSINESS-LOGIC.md#3-storetask-workflow)

**Request:**

```http
POST /api/store-tasks/65f9876543210fedcba98766/assign HTTP/1.1
Host: localhost:5000
Authorization: Bearer {MANAGER_TOKEN}
Content-Type: application/json

{
  "employeeIds": [
    "65f1234567890abcdef12346",
    "65f1234567890abcdef12347",
    "65f1234567890abcdef12348"
  ]
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `employeeIds` | array | ✅ Yes | Array of Employee ObjectIds (min 1) |

**Validation:**
- Manager phải là manager của store này
- StoreTask phải có status="accepted" (phải accept trước)
- Employee IDs phải tồn tại và active
- Employees phải thuộc store này (check ID_Branch)

**Process:**
1. Validate manager owns store
2. Check StoreTask status = "accepted"
3. Validate tất cả employees thuộc store này
4. Tạo UserTask cho mỗi employee:
   - Copy checklist từ broadcast
   - Set status = "assigned"
   - Set employeeId, storeTaskId, broadcastId
5. Update StoreTask:
   - status → "in_progress"
   - assignedEmployees ← add employeeIds
   - assignedBy = manager employeeId
   - assignedAt = current timestamp
6. Create notifications cho mỗi employee

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Assign thành công",
  "data": {
    "storeTask": {
      "_id": "65f9876543210fedcba98766",
      "status": "in_progress",
      "assignedEmployees": [
        "65f1234567890abcdef12346",
        "65f1234567890abcdef12347",
        "65f1234567890abcdef12348"
      ],
      "assignedBy": "65f1234567890abcdef12345",
      "assignedAt": "2026-03-20T10:00:00.000Z"
    },
    "userTasksCreated": 3,
    "notificationsSent": 3
  }
}
```

**Response 400 (StoreTask not accepted):**

```json
{
  "success": false,
  "message": "StoreTask phải được accept trước khi assign employees"
}
```

**Response 400 (Employee not in this store):**

```json
{
  "success": false,
  "message": "Employee 65f1234567890abcdef12349 không thuộc cửa hàng này",
  "invalidEmployeeIds": ["65f1234567890abcdef12349"]
}
```

**Response 403 (Not Manager of This Store):**

```json
{
  "success": false,
  "message": "Bạn không phải manager của cửa hàng này"
}
```

**Implementation:**
- File: `src/controllers/storeTaskController.js`
- Function: `assignEmployees()`

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/store-tasks/65f9876543210fedcba98766/assign \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeIds": [
      "65f1234567890abcdef12346",
      "65f1234567890abcdef12347"
    ]
  }'
```

**Notes:**
- Phải **accept StoreTask trước** khi assign employees
- Mỗi employee nhận 1 UserTask riêng biệt
- UserTask status ban đầu: "assigned" (chưa start)
- StoreTask status tự động chuyển sang "in_progress"
- Employees nhận real-time notification

⚠️ **AUTO BEHAVIOR - Status Transition (Rule 9):**
- Assign employees → **StoreTask status: "accepted" → "in_progress"**
- Không cần manually chuyển status
- UserTask.status = "assigned" (chờ employee start làm việc)

⚠️ **AUTHORIZATION LOGIC (Rule 7):**
- Manager chỉ assign được employees **thuộc store mình**:
  ```javascript
  const employees = await Employee.find({ 
    _id: { $in: employeeIds },
    ID_Branch: manager.ID_Branch  // PHẢI cùng store
  });
  
  if (employees.length !== employeeIds.length) {
    return res.status(400).json({ message: 'Một số employees không thuộc store này' });
  }
  ```

⚠️ **NOTIFICATION AUTO-CREATE (Rule 9):**
- Mỗi employee nhận notification:
  - Type: `'task_assigned'`
  - Message: "Bạn được giao task: {broadcast.title}"
  - Link to: `/my-tasks/{userTaskId}`

---

## 6️⃣ USER TASKS (MY TASKS)

**Base Path:** `/api/my-tasks`  
**File:** `src/routes/userTaskRoutes.js`  
**Controller:** `src/controllers/userTaskController.js`  
**Validators:** `src/validators/userTaskValidator.js`

---

### GET /api/my-tasks

**Mô tả:** Lấy danh sách tasks của employee hiện tại

**Access:** 🔒 Employee only  
**Business Logic:** [01-BUSINESS-LOGIC.md § UserTask Workflow](01-BUSINESS-LOGIC.md#4-usertask-workflow)

**Request:**

```http
GET /api/my-tasks?status=in_progress&page=1&limit=20 HTTP/1.1
Host: localhost:5000
Authorization: Bearer {EMPLOYEE_TOKEN}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | ❌ No | Filter: 'pending' \| 'in_progress' \| 'submitted' \| 'approved' \| 'rejected' |
| `page` | number | ❌ No | Page number (default: 1) |
| `limit` | number | ❌ No | Items per page (default: 20) |

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "_id": "65fa123456789abcdef00001",
        "broadcastId": {
          "_id": "65f9876543210fedcba98765",
          "title": "Kiểm tra vệ sinh tháng 3"
        },
        "storeTaskId": "65f9876543210fedcba98766",
        "employeeId": "65f1234567890abcdef12346",
        "status": "in_progress",
        "priority": "high",
        "deadline": "2026-03-31T23:59:59.000Z",
        "checklist": [
          {
            "title": "Lau sàn nhà",
            "description": "Lau sạch toàn bộ sàn",
            "required": true,
            "completed": false
          },
          {
            "title": "Chụp ảnh",
            "required": true,
            "completed": false
          }
        ],
        "progress": 0,
        "evidences": [],
        "assignedAt": "2026-03-20T08:00:00.000Z",
        "startedAt": "2026-03-20T09:00:00.000Z",
        "isOverdue": false
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 35,
      "itemsPerPage": 20
    },
    "summary": {
      "pending": 5,
      "in_progress": 10,
      "submitted": 3,
      "approved": 15,
      "rejected": 2,
      "overdue": 1
    }
  }
}
```

**Response 403 (Not Employee Role):**

```json
{
  "success": false,
  "message": "Chỉ nhân viên mới có quyền xem tasks của mình"
}
```

**Implementation:**
- File: `src/controllers/userTaskController.js`
- Function: `getMyTasks()`

**cURL Example:**

```bash
curl -X GET "http://localhost:5000/api/my-tasks?status=in_progress" \
  -H "Authorization: Bearer EMPLOYEE_TOKEN"
```

**Notes:**
- Chỉ trả về tasks của employee hiện tại (filter by req.user._id)
- Tasks được populate với broadcast info
- `isOverdue` được computed dựa trên deadline
- `progress` = % checklist items completed

---

### GET /api/my-tasks/:id

**Mô tả:** Lấy chi tiết 1 task của employee

**Access:** 🔒 Employee only (own task)  
**Business Logic:** [01-BUSINESS-LOGIC.md § UserTask Workflow](01-BUSINESS-LOGIC.md#4-usertask-workflow)

**Request:**

```http
GET /api/my-tasks/65fa123456789abcdef00001 HTTP/1.1
Host: localhost:5000
Authorization: Bearer {EMPLOYEE_TOKEN}
```

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "_id": "65fa123456789abcdef00001",
    "broadcastId": {
      "_id": "65f9876543210fedcba98765",
      "title": "Kiểm tra vệ sinh tháng 3",
      "description": "Kiểm tra và đảm bảo vệ sinh toàn bộ cửa hàng",
      "priority": "high",
      "attachments": [
        {
          "url": "https://example.com/guide.pdf",
          "filename": "huong-dan-ve-sinh.pdf",
          "type": "document"
        }
      ]
    },
    "storeTaskId": {
      "_id": "65f9876543210fedcba98766",
      "storeId": {
        "_id": "65f1234567890abcdef11111",
        "Ten_thuong_hieu": "Chi nhánh HCM"
      }
    },
    "employeeId": {
      "_id": "65f1234567890abcdef12346",
      "Ho_ten": "Nguyễn Văn B",
      "So_dien_thoai": "0987654322"
    },
    "status": "in_progress",
    "priority": "high",
    "deadline": "2026-03-31T23:59:59.000Z",
    "checklist": [
      {
        "title": "Lau sàn nhà",
        "description": "Lau sạch toàn bộ sàn, đặc biệt chú ý góc khuất",
        "required": true,
        "completed": false
      },
      {
        "title": "Chụp ảnh sau khi hoàn thành",
        "required": true,
        "completed": false
      }
    ],
    "progress": 0,
    "evidences": [],
    "assignedAt": "2026-03-20T08:00:00.000Z",
    "startedAt": "2026-03-20T09:00:00.000Z",
    "submittedAt": null,
    "completedAt": null,
    "isOverdue": false,
    "daysUntilDeadline": 11
  }
}
```

**Response 403 (Not Own Task):**

```json
{
  "success": false,
  "message": "Bạn không có quyền xem task này"
}
```

**Response 404 (Task Not Found):**

```json
{
  "success": false,
  "message": "Không tìm thấy task"
}
```

**Implementation:**
- File: `src/controllers/userTaskController.js`
- Function: `getTaskById()`

**cURL Example:**

```bash
curl -X GET http://localhost:5000/api/my-tasks/65fa123456789abcdef00001 \
  -H "Authorization: Bearer EMPLOYEE_TOKEN"
```

**Notes:**
- Validate employee chỉ xem được own tasks
- Full populate: broadcast, storeTask, store info
- `daysUntilDeadline` computed từ current date
- Attachments từ broadcast được include

---

### PUT /api/my-tasks/:id/checklist

**Mô tả:** Update checklist items (mark completed/uncompleted)

**Access:** 🔒 Employee only (own task)  
**Business Logic:** [01-BUSINESS-LOGIC.md § UserTask Workflow](01-BUSINESS-LOGIC.md#4-usertask-workflow)

**Request:**

```http
PUT /api/my-tasks/65fa123456789abcdef00001/checklist HTTP/1.1
Host: localhost:5000
Authorization: Bearer {EMPLOYEE_TOKEN}
Content-Type: application/json

{
  "checklist": [
    {
      "title": "Lau sàn nhà",
      "description": "Lau sạch toàn bộ sàn",
      "required": true,
      "completed": true
    },
    {
      "title": "Chụp ảnh",
      "required": true,
      "completed": false
    }
  ]
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `checklist` | array | ✅ Yes | Full checklist array với updates |

**Validation:**
- Employee phải own task này
- Task phải có status: 'in_progress' hoặc 'rejected'
- Không sửa được checklist của task đã submitted/approved
- Checklist array phải match số lượng items gốc

**Process:**
1. Validate ownership và status
2. Update checklist items
3. Recalculate progress (% completed)
4. Save UserTask
5. Update StoreTask completion rate

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Checklist đã được cập nhật",
  "data": {
    "_id": "65fa123456789abcdef00001",
    "checklist": [...],
    "progress": 50,
    "completedItems": 1,
    "totalItems": 2
  }
}
```

**Response 400 (Cannot Update):**

```json
{
  "success": false,
  "message": "Không thể update checklist của task đã submitted"
}
```

**Response 403 (Not Own Task):**

```json
{
  "success": false,
  "message": "Bạn không có quyền update task này"
}
```

**Implementation:**
- File: `src/controllers/userTaskController.js`
- Function: `updateChecklist()`

**cURL Example:**

```bash
curl -X PUT http://localhost:5000/api/my-tasks/65fa123456789abcdef00001/checklist \
  -H "Authorization: Bearer EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checklist": [
      {"title": "Lau sàn", "required": true, "completed": true},
      {"title": "Chụp ảnh", "required": true, "completed": false}
    ]
  }'
```

**Notes:**
- Progress tự động recalculate
- StoreTask completion rate cũng được update
- Chỉ update được khi task đang in_progress hoặc rejected

⚠️ **AUTO BEHAVIOR - Status Transition:**
- **Lần đầu tiên** update checklist khi task còn `assigned` → **Tự động chuyển sang `in_progress`**
- Logic: `if (status === 'assigned' && isFirstChecklistUpdate) { status = 'in_progress'; startedAt = new Date(); }`
- Impact: Employee không cần manually "start" task
- **Progress auto-calculation:**
  - `completedItems = checklist.filter(i => i.completed).length`
  - `progress = (completedItems / checklist.length) * 100`
- **Side effect:** StoreTask completion rate recalculated:
  - Lặp qua tất cả UserTasks của StoreTask
  - Calculate average progress của store
- **Notification:** Không tạo notification khi update checklist (chỉ khi submit)

---

### POST /api/my-tasks/:id/evidence

**Mô tả:** Upload evidence (photos/videos) cho task

**Access:** 🔒 Employee only (own task)  
**Business Logic:** [01-BUSINESS-LOGIC.md § UserTask Workflow](01-BUSINESS-LOGIC.md#4-usertask-workflow)

**Request:**

```http
POST /api/my-tasks/65fa123456789abcdef00001/evidence HTTP/1.1
Host: localhost:5000
Authorization: Bearer {EMPLOYEE_TOKEN}
Content-Type: application/json

{
  "evidences": [
    {
      "url": "https://example.com/uploads/proof1.jpg",
      "filename": "san-nha-sau-khi-lau.jpg",
      "type": "image",
      "uploadedAt": "2026-03-20T10:00:00.000Z"
    },
    {
      "url": "https://example.com/uploads/video1.mp4",
      "filename": "qua-trinh-ve-sinh.mp4",
      "type": "video",
      "uploadedAt": "2026-03-20T10:05:00.000Z"
    }
  ]
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `evidences` | array | ✅ Yes | Array of evidence objects |

**Evidence Object Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | ✅ Yes | Public URL của file (from /api/upload) |
| `filename` | string | ✅ Yes | Original filename |
| `type` | string | ✅ Yes | 'image' \| 'video' \| 'document' |
| `uploadedAt` | Date | ❌ No | Upload timestamp (auto if not provided) |

**Validation:**
- Employee phải own task
- Task phải có status: 'in_progress' hoặc 'rejected'
- URLs phải valid
- Type phải thuộc ['image', 'video', 'document']

**Process:**
1. Validate ownership
2. Validate evidence objects
3. Append evidences vào existing array (không replace)
4. Save UserTask

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Evidence đã được thêm",
  "data": {
    "_id": "65fa123456789abcdef00001",
    "evidences": [
      {
        "url": "https://example.com/uploads/proof1.jpg",
        "filename": "san-nha-sau-khi-lau.jpg",
        "type": "image",
        "uploadedAt": "2026-03-20T10:00:00.000Z"
      },
      {
        "url": "https://example.com/uploads/video1.mp4",
        "filename": "qua-trinh-ve-sinh.mp4",
        "type": "video",
        "uploadedAt": "2026-03-20T10:05:00.000Z"
      }
    ],
    "totalEvidences": 2
  }
}
```

**Response 400 (Invalid Evidence):**

```json
{
  "success": false,
  "message": "Evidence không hợp lệ",
  "errors": [
    "URL không được để trống",
    "Type phải là image, video hoặc document"
  ]
}
```

**Response 403 (Not Own Task):**

```json
{
  "success": false,
  "message": "Bạn không có quyền upload evidence cho task này"
}
```

**Implementation:**
- File: `src/controllers/userTaskController.js`
- Function: `uploadEvidence()`

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/my-tasks/65fa123456789abcdef00001/evidence \
  -H "Authorization: Bearer EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "evidences": [
      {
        "url": "https://example.com/uploads/proof1.jpg",
        "filename": "proof.jpg",
        "type": "image"
      }
    ]
  }'
```

**Notes:**
- Files phải được upload trước qua `/api/upload` endpoints
- Evidence array append, không replace existing evidences
- Có thể upload nhiều evidences trong 1 request
- Employee có thể xóa evidence bằng cách gửi full array mới (không có API riêng để xóa)

⚠️ **AUTO BEHAVIOR - Status Transition:**
- **Lần đầu tiên** upload evidence khi task còn `assigned` → **Tự động chuyển sang `in_progress`**
- Logic tương tự checklist update: `if (status === 'assigned') { status = 'in_progress'; startedAt = new Date(); }`
- Impact: Employee chỉ cần upload photo/video đầu tiên là task auto-start
- **Evidence limit:** Không giới hạn số lượng evidences (nhưng nên limit ở frontend)

⚠️ **SECURITY WARNING - Rate Limiting (Known Issue #8):**
- Upload endpoint **KHÔNG có rate limiting**
- **Attack vector:** Spam upload → Storage overload
- **Workaround:** Limit file size (max 10MB/file) + total uploads/day
- **Fix needed:** Rate limit 20 uploads/hour per employee
- **Priority:** MEDIUM

---

### POST /api/my-tasks/:id/submit

**Mô tả:** Submit task để manager review (all required checklist items must be completed)

**Access:** 🔒 Employee only (own task)  
**Business Logic:** [01-BUSINESS-LOGIC.md § UserTask Workflow](01-BUSINESS-LOGIC.md#4-usertask-workflow)

**Request:**

```http
POST /api/my-tasks/65fa123456789abcdef00001/submit HTTP/1.1
Host: localhost:5000
Authorization: Bearer {EMPLOYEE_TOKEN}
```

**Validation:**
- Employee phải own task
- Task phải có status: 'in_progress' hoặc 'rejected'
- **Tất cả required checklist items phải completed = true**
- Phải có ít nhất 1 evidence (tùy config broadcast)

**Process:**
1. Validate ownership
2. Check all required checklist items completed
3. Check evidences exist (nếu required)
4. Update task status → 'submitted'
5. Set submittedAt timestamp
6. Create notification cho manager
7. Update StoreTask status (nếu cần)

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Task đã được submit để review",
  "data": {
    "_id": "65fa123456789abcdef00001",
    "status": "submitted",
    "submittedAt": "2026-03-20T14:30:00.000Z",
    "progress": 100,
    "nextStep": "Chờ manager review"
  }
}
```

**Response 400 (Required Items Not Done):**

```json
{
  "success": false,
  "message": "Chưa hoàn thành đủ checklist items",
  "errors": [
    "Item 'Chụp ảnh sau khi hoàn thành' (required) chưa hoàn thành"
  ],
  "incompleteItems": [
    {
      "title": "Chụp ảnh sau khi hoàn thành",
      "required": true,
      "completed": false
    }
  ]
}
```

**Response 400 (No Evidence):**

```json
{
  "success": false,
  "message": "Phải upload ít nhất 1 evidence (ảnh/video) trước khi submit"
}
```

**Response 403 (Not Own Task):**

```json
{
  "success": false,
  "message": "Bạn không có quyền submit task này"
}
```

**Implementation:**
- File: `src/controllers/userTaskController.js`
- Function: `submitTask()`

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/my-tasks/65fa123456789abcdef00001/submit \
  -H "Authorization: Bearer EMPLOYEE_TOKEN"
```

**Notes:**
- Submit chỉ thành công khi:
  - ✅ All required checklist items completed
  - ✅ Có evidences (nếu broadcast require)
  - ✅ Task đang in_progress hoặc rejected
- Sau khi submit:
  - Status → 'submitted'
  - Manager nhận notification
  - Employee không edit được task nữa (chờ review)
- Nếu manager reject:
  - Status → 'rejected'
  - Employee phải fix và submit lại

⚠️ **CRITICAL VALIDATION:**
- **TẤT CẢ** checklist items có `required: true` **BẮT BUỘC** phải `completed: true`
- Validation **NGHIÊM NGẶT:** Thiếu 1 item required là API trả về 400 Bad Request
- Frontend PHẢI validate trước khi gọi API submit

⚠️ **AUTO BEHAVIOR - Status Transition:**
- Submit thành công → Status: `in_progress` → `submitted`
- `submittedAt` được set = current timestamp
- **Notification auto-create:**
  - Type: `'task_submitted'`
  - Recipient: Manager của store (storeTask.storeId → manager)
  - Message: "{EmployeeName} đã nộp task {TaskTitle}"
- Manager nhận thông báo real-time (nếu có WebSocket) hoặc khi refresh dashboard
- Employee **không thể edit** task sau khi submit (phải đợi review)
- **Side effect:** StoreTask completion rate recalculated:
  - `completedCount = UserTasks.filter(ut => ut.status === 'approved').length`
  - `completionRate = (completedCount / totalUserTasks) * 100`
- Error message sẽ liệt kê chính xác items nào chưa hoàn thành
- **Không được phép** skip validation này - đây là business rule cốt lõi
- Manager sẽ reject nếu employee submit task không đủ yêu cầu

---

## 7️⃣ REVIEWS

**Base Path:** `/api/reviews`  
**File:** `src/routes/reviewRoutes.js`  
**Controller:** `src/controllers/reviewController.js`  
**Validators:** `src/validators/reviewValidator.js`

### GET /api/reviews/pending

**Mô tả:** Lấy danh sách tasks đang chờ review (status = 'submitted')

**Access:** 🔒 Manager only  
**Business Logic:** [01-BUSINESS-LOGIC.md § UserTask Workflow](01-BUSINESS-LOGIC.md#4-usertask-workflow)

**Request:**

```http
GET /api/reviews/pending HTTP/1.1
Host: localhost:5000
Authorization: Bearer {MANAGER_TOKEN}
```

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "pendingTasks": [
      {
        "_id": "65fa123456789abcdef00001",
        "broadcastId": {
          "_id": "65f9876543210fedcba98765",
          "title": "Kiểm tra vệ sinh tháng 3"
        },
        "employeeId": {
          "_id": "65f1234567890abcdef12346",
          "Ho_va_ten": "Nguyễn Văn A",
          "So_dien_thoai": "0987654321"
        },
        "storeTaskId": "65f9876543210fedcba98766",
        "status": "submitted",
        "priority": "high",
        "deadline": "2026-03-31T23:59:59.000Z",
        "progress": 100,
        "evidences": [
          {
            "url": "https://example.com/uploads/proof1.jpg",
            "filename": "san-nha-sau-khi-lau.jpg",
            "type": "image"
          }
        ],
        "submittedAt": "2026-03-25T14:30:00.000Z",
        "daysWaiting": 2
      }
    ],
    "total": 5
  }
}
```

**Implementation:**
- File: `src/controllers/reviewController.js`
- Function: `getPendingReviews()`

**cURL Example:**

```bash
curl -X GET http://localhost:5000/api/reviews/pending \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

**Notes:**
- Manager chỉ xem tasks của employees thuộc store mình
- Tasks được sort theo submittedAt (oldest first)
- Includes evidences và progress để manager review
- `daysWaiting` computed = current date - submittedAt

⚠️ **AUTHORIZATION LOGIC (Rule 7):**
- Manager chỉ xem **UserTasks của employees thuộc store mình**:
  ```javascript
  const manager = await Employee.findById(req.user._id).populate('ID_Branch');
  const employees = await Employee.find({ ID_Branch: manager.ID_Branch });
  const employeeIds = employees.map(e => e._id);
  
  const tasks = await UserTask.find({ 
    employeeId: { $in: employeeIds },
    status: 'submitted'
  });
  ```

---

### POST /api/reviews/:taskId/approve

**Mô tả:** Manager approve task của employee (status: submitted → approved)

**Access:** 🔒 Manager only  
**Business Logic:** [01-BUSINESS-LOGIC.md § UserTask Workflow](01-BUSINESS-LOGIC.md#4-usertask-workflow)

**Request:**

```http
POST /api/reviews/65fa123456789abcdef00001/approve HTTP/1.1
Host: localhost:5000
Authorization: Bearer {MANAGER_TOKEN}
Content-Type: application/json

{
  "rating": 5,
  "reviewNote": "Làm rất tốt, sàn nhà sạch sẽ"
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rating` | number | ❌ No | Đánh giá 1-5 sao |
| `reviewNote` | string | ❌ No | Ghi chú review |

**Validation:**
- UserTask phải có status="submitted"
- Manager phải là manager của store này (employee.ID_Branch = manager.ID_Branch)
- Rating (nếu có) phải từ 1-5

**Process:**
1. Validate manager owns employee's store
2. Check UserTask status = "submitted"
3. Update UserTask:
   - status → "approved"
   - reviewedBy = manager employeeId
   - reviewedAt = current timestamp
   - rating, reviewNote (if provided)
   - completedAt = current timestamp
4. Update StoreTask completion rate
5. Create notification cho employee (task approved)

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Task đã được approve",
  "data": {
    "_id": "65fa123456789abcdef00001",
    "status": "approved",
    "rating": 5,
    "reviewNote": "Làm rất tốt, sàn nhà sạch sẽ",
    "reviewedBy": "65f1234567890abcdef12345",
    "reviewedAt": "2026-03-27T10:00:00.000Z",
    "completedAt": "2026-03-27T10:00:00.000Z"
  }
}
```

**Response 400 (Task not submitted):**

```json
{
  "success": false,
  "message": "Chỉ có thể approve task ở trạng thái submitted"
}
```

**Response 403 (Not Manager of Employee's Store):**

```json
{
  "success": false,
  "message": "Bạn không có quyền review task này"
}
```

**Implementation:**
- File: `src/controllers/reviewController.js`
- Function: `approveTask()`

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/reviews/65fa123456789abcdef00001/approve \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5, "reviewNote": "Làm tốt lắm!"}'
```

**Notes:**
- Rating optional nhưng recommended (để track employee performance)
- ReviewNote optional (để give feedback)
- Employee nhận notification với rating và note
- Task completion được tính vào dashboard stats

⚠️ **AUTO BEHAVIOR - Completion (Rule 9):**
- Approve → Set `completedAt` timestamp
- StoreTask completion rate auto-recalculated:
  - Count approved UserTasks / total UserTasks
  - Update StoreTask.completionRate
- **Notification auto-create:**
  - Type: `'task_approved'`
  - Recipient: Employee
  - Message: "Task '{title}' đã được approve" + rating/note

⚠️ **SECURITY WARNING - XSS (Rule 8):**
- `reviewNote` field **KHÔNG được sanitize**
- Attack vector: Manager inject malicious script
- Workaround: Frontend escape HTML khi display
- Priority: LOW (chỉ Manager có thể tạo reviewNote)

---

### POST /api/reviews/:taskId/reject

**Mô tả:** Manager reject task của employee (status: submitted → rejected)

**Access:** 🔒 Manager only  
**Business Logic:** [01-BUSINESS-LOGIC.md § UserTask Workflow](01-BUSINESS-LOGIC.md#4-usertask-workflow)

**Request:**

```http
POST /api/reviews/65fa123456789abcdef00001/reject HTTP/1.1
Host: localhost:5000
Authorization: Bearer {MANAGER_TOKEN}
Content-Type: application/json

{
  "reason": "Sàn nhà chưa sạch, còn nhiều vết bẩn ở góc. Vui lòng làm lại."
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | ✅ Yes | Lý do reject (min 10 chars) |

**Validation:**
- UserTask phải có status="submitted"
- Manager phải là manager của store này
- Reason không được rỗng và min 10 ký tự

**Process:**
1. Validate manager owns employee's store
2. Check UserTask status = "submitted"
3. Update UserTask:
   - status → "rejected"
   - rejectedBy = manager employeeId
   - rejectedAt = current timestamp
   - rejectionReason = reason
4. Create notification cho employee (task rejected với reason)
5. Employee phải fix và submit lại

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Task đã bị reject",
  "data": {
    "_id": "65fa123456789abcdef00001",
    "status": "rejected",
    "rejectionReason": "Sàn nhà chưa sạch, còn nhiều vết bẩn ở góc. Vui lòng làm lại.",
    "rejectedBy": "65f1234567890abcdef12345",
    "rejectedAt": "2026-03-27T11:00:00.000Z"
  }
}
```

**Response 400 (Task not submitted):**

```json
{
  "success": false,
  "message": "Chỉ có thể reject task ở trạng thái submitted"
}
```

**Response 403 (Not Manager of Employee's Store):**

```json
{
  "success": false,
  "message": "Bạn không có quyền review task này"
}
```

**Implementation:**
- File: `src/controllers/reviewController.js`
- Function: `rejectTask()`

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/reviews/65fa123456789abcdef00001/reject \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Sàn nhà chưa sạch, làm lại"}'
```

**Notes:**
- Employee nhận notification với lý do reject chi tiết
- Task quay về status="rejected", employee có thể edit và submit lại
- Reason phải đủ rõ ràng để employee biết cần fix gì
- Employee có thể submit lại nhiều lần (không limit)

⚠️ **AUTO BEHAVIOR - Re-work Flow (Rule 9):**
- Reject → Task quay về editable state
- Employee có thể:
  - Update checklist
  - Upload thêm evidences
  - Submit lại khi đã fix
- **Notification auto-create:**
  - Type: `'task_rejected'`
  - Recipient: Employee
  - Message: "Task '{title}' bị reject: {reason}"

⚠️ **SECURITY WARNING - XSS (Rule 8):**
- `reason` field **KHÔNG được sanitize**
- Attack vector: Manager inject script trong rejection reason
- Workaround: Frontend escape HTML
- Priority: LOW

---

## 8️⃣ DASHBOARD

**Base Path:** `/api/dashboard`  
**File:** `src/routes/dashboardRoutes.js`  
**Controller:** `src/controllers/dashboardController.js`

### GET /api/dashboard/admin

**Mô tả:** Lấy toàn bộ dashboard stats cho Admin (system-wide)

**Access:** 🔒 Admin only  

**Request:**

```http
GET /api/dashboard/admin HTTP/1.1
Host: localhost:5000
Authorization: Bearer {ADMIN_TOKEN}
```

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalBroadcasts": 125,
      "totalStoreTasks": 450,
      "totalUserTasks": 2340,
      "totalEmployees": 285,
      "totalStores": 45,
      "systemCompletionRate": 78.5
    },
    "tasksByStatus": {
      "pending": 150,
      "in_progress": 842,
      "submitted": 125,
      "approved": 1123,
      "rejected": 100,
      "overdue": 85
    },
    "recentBroadcasts": [
      {
        "_id": "65f9876543210fedcba98765",
        "title": "Kiểm tra vệ sinh tháng 3",
        "status": "published",
        "deadline": "2026-03-31T23:59:59.000Z",
        "assignedStores": 12,
        "completionRate": 65
      }
    ],
    "topPerformingStores": [
      {
        "storeId": "65f1234567890abcdef11111",
        "storeName": "Chi nhánh Quận 1",
        "completionRate": 95,
        "tasksCompleted": 48
      }
    ]
  }
}
```

**Implementation:**
- File: `src/controllers/dashboardController.js`
- Function: `getAdminDashboard()`

**cURL Example:**

```bash
curl -X GET http://localhost:5000/api/dashboard/admin \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Notes:**
- System-wide stats across all stores
- Completion rates calculated from UserTask statuses
- Recent broadcasts limit 10, sorted by createdAt DESC
- Top stores limit 5, sorted by completionRate DESC

---

### GET /api/dashboard/admin/tasks/:status

**Mô tả:** Lấy danh sách UserTasks theo status (Admin view)

**Access:** 🔒 Admin only  

**Request:**

```http
GET /api/dashboard/admin/tasks/overdue HTTP/1.1
Host: localhost:5000
Authorization: Bearer {ADMIN_TOKEN}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | ✅ Yes | 'completed' \| 'overdue' \| 'in-progress' \| 'pending-confirm' |

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "userTaskId": "65fa123456789abcdef00001",
        "broadcastTitle": "Kiểm tra vệ sinh tháng 3",
        "employeeId": "65f1234567890abcdef12346",
        "employeeName": "Nguyễn Văn A",
        "storeName": "Chi nhánh Quận 1",
        "status": "in_progress",
        "progress": 50,
        "deadline": "2026-03-31T23:59:59.000Z",
        "daysOverdue": 3
      }
    ],
    "total": 85
  }
}
```

**Implementation:**
- File: `src/controllers/dashboardController.js`
- Function: `getAdminTasksByStatus()`

**cURL Example:**

```bash
curl -X GET http://localhost:5000/api/dashboard/admin/tasks/overdue \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Notes:**
- ⚠️ Returns `userTaskId` for reassign/delete operations (FIXED March 18, 2026)
- Status 'pending-confirm' = submitted tasks waiting for manager review
- Overdue tasks: deadline < current date AND status NOT approved
- Response includes employee info for quick reassign

---

### GET /api/dashboard/manager

**Mô tả:** Lấy dashboard stats cho Manager (store-level)

**Access:** 🔒 Manager only  

**Request:**

```http
GET /api/dashboard/manager HTTP/1.1
Host: localhost:5000
Authorization: Bearer {MANAGER_TOKEN}
```

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "store": {
      "_id": "65f1234567890abcdef11111",
      "Ten_chi_nhanh": "Chi nhánh Quận 1"
    },
    "summary": {
      "totalStoreTasks": 25,
      "totalUserTasks": 125,
      "totalEmployees": 15,
      "storeCompletionRate": 82.5
    },
    "tasksByStatus": {
      "pending": 5,
      "accepted": 2,
      "in_progress": 35,
      "submitted": 8,
      "approved": 65,
      "rejected": 10,
      "overdue": 3
    },
    "pendingReviews": [
      {
        "_id": "65fa123456789abcdef00001",
        "broadcastTitle": "Kiểm tra vệ sinh tháng 3",
        "employeeName": "Nguyễn Văn A",
        "submittedAt": "2026-03-25T14:30:00.000Z",
        "daysWaiting": 2
      }
    ],
    "employeePerformance": [
      {
        "employeeId": "65f1234567890abcdef12346",
        "employeeName": "Nguyễn Văn A",
        "tasksCompleted": 28,
        "tasksInProgress": 5,
        "averageRating": 4.5,
        "completionRate": 85
      }
    ]
  }
}
```

**Implementation:**
- File: `src/controllers/dashboardController.js`
- Function: `getManagerDashboard()`

**cURL Example:**

```bash
curl -X GET http://localhost:5000/api/dashboard/manager \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

**Notes:**
- Manager chỉ xem stats của store mình (filter by manager.ID_Branch)
- Pending reviews = submitted UserTasks cần approval
- Employee performance sorted by completionRate DESC
- Average rating calculated from approved tasks

⚠️ **AUTHORIZATION LOGIC (Rule 7):**
- Chỉ show data của **store mình**:
  ```javascript
  const manager = await Employee.findById(req.user._id).populate('ID_Branch');
  const storeId = manager.ID_Branch._id;
  
  const storeTasks = await StoreTask.find({ storeId });
  const employees = await Employee.find({ ID_Branch: storeId });
  ```

---

### GET /api/dashboard/employee

**Mô tả:** Lấy dashboard stats cho Employee (personal tasks)

**Access:** 🔒 Employee only  

**Request:**

```http
GET /api/dashboard/employee HTTP/1.1
Host: localhost:5000
Authorization: Bearer {EMPLOYEE_TOKEN}
```

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTasks": 45,
      "tasksCompleted": 35,
      "tasksInProgress": 8,
      "tasksOverdue": 2,
      "completionRate": 77.8,
      "averageRating": 4.2
    },
    "myTasks": [
      {
        "_id": "65fa123456789abcdef00001",
        "broadcastTitle": "Kiểm tra vệ sinh tháng 3",
        "status": "in_progress",
        "priority": "high",
        "deadline": "2026-03-31T23:59:59.000Z",
        "progress": 50,
        "isOverdue": false,
        "daysUntilDeadline": 4
      }
    ],
    "overdueTasks": [
      {
        "_id": "65fa123456789abcdef00003",
        "broadcastTitle": "Báo cáo doanh thu tháng 2",
        "status": "in_progress",
        "deadline": "2026-03-15T23:59:59.000Z",
        "daysOverdue": 12
      }
    ],
    "recentCompleted": [
      {
        "_id": "65fa123456789abcdef00002",
        "broadcastTitle": "Kiểm tra kho hàng",
        "completedAt": "2026-03-18T16:00:00.000Z",
        "rating": 5,
        "reviewNote": "Làm tốt lắm!"
      }
    ]
  }
}
```

**Implementation:**
- File: `src/controllers/dashboardController.js`
- Function: `getEmployeeDashboard()`

**cURL Example:**

```bash
curl -X GET http://localhost:5000/api/dashboard/employee \
  -H "Authorization: Bearer EMPLOYEE_TOKEN"
```

**Notes:**
- Employee chỉ xem tasks của chính mình (filter by employeeId = req.user._id)
- My tasks: in_progress + submitted, sorted by deadline ASC
- Overdue tasks: deadline < current date AND status NOT approved
- Recent completed: limit 5, sorted by completedAt DESC
- Average rating from approved tasks

⚠️ **AUTHORIZATION LOGIC (Rule 7):**
- Chỉ show **own tasks**:
  ```javascript
  const employeeId = req.user._id;
  const tasks = await UserTask.find({ employeeId });
  ```
- Không xem được tasks của người khác

---

## 9️⃣ NOTIFICATIONS

**Base Path:** `/api/notifications`  
**File:** `src/routes/notificationRoutes.js`  
**Controller:** `src/controllers/notificationController.js`

### GET /api/notifications

**Mô tả:** Lấy danh sách notifications của user hiện tại

**Access:** 🔒 Private (All authenticated)  

**Request:**

```http
GET /api/notifications?type=task_assigned&isRead=false&page=1&limit=20 HTTP/1.1
Host: localhost:5000
Authorization: Bearer {TOKEN}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | ❌ No | Filter: 'task_assigned' \| 'task_submitted' \| 'task_approved' \| 'task_rejected' |
| `isRead` | boolean | ❌ No | Filter: true (read) \| false (unread) |
| `page` | number | ❌ No | Page number (default: 1) |
| `limit` | number | ❌ No | Items per page (default: 20, max: 100) |

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "65fc123456789abcdef00001",
        "userId": "65f1234567890abcdef12346",
        "type": "task_assigned",
        "title": "Task mới được giao",
        "message": "Bạn được giao task: Kiểm tra vệ sinh tháng 3",
        "data": {
          "taskId": "65fa123456789abcdef00001",
          "broadcastTitle": "Kiểm tra vệ sinh tháng 3"
        },
        "isRead": false,
        "createdAt": "2026-03-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 52,
      "itemsPerPage": 20
    },
    "unreadCount": 15
  }
}
```

**Implementation:**
- File: `src/controllers/notificationController.js`
- Function: `getNotifications()`

**cURL Example:**

```bash
curl -X GET "http://localhost:5000/api/notifications?isRead=false" \
  -H "Authorization: Bearer TOKEN"
```

**Notes:**
- User chỉ xem được notifications của mình (filter by userId = req.user._id)
- Notifications sorted by createdAt DESC (mới nhất đầu tiên)
- `data` field chứa contextual info (taskId, broadcastTitle, etc.)

---

### GET /api/notifications/unread/count

**Mô tả:** Lấy số lượng notifications chưa đọc

**Access:** 🔒 Private (All authenticated)  

**Request:**

```http
GET /api/notifications/unread/count HTTP/1.1
Host: localhost:5000
Authorization: Bearer {TOKEN}
```

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "count": 15
  }
}
```

**Implementation:**
- File: `src/controllers/notificationController.js`
- Function: `getUnreadCount()`

**cURL Example:**

```bash
curl -X GET http://localhost:5000/api/notifications/unread/count \
  -H "Authorization: Bearer TOKEN"
```

**Notes:**
- Dùng để hiển badge count trên UI (notification bell icon)
- Chỉ count notifications của current user với isRead=false
- Real-time update khi có notification mới (nếu có WebSocket)

---

### PUT /api/notifications/read-all

**Mô tả:** Đánh dấu tất cả notifications là đã đọc

**Access:** 🔒 Private (All authenticated)  

**Request:**

```http
PUT /api/notifications/read-all HTTP/1.1
Host: localhost:5000
Authorization: Bearer {TOKEN}
```

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Đã đánh dấu tất cả thông báo là đã đọc",
  "data": {
    "modifiedCount": 15
  }
}
```

**Implementation:**
- File: `src/controllers/notificationController.js`
- Function: `markAllAsRead()`

**cURL Example:**

```bash
curl -X PUT http://localhost:5000/api/notifications/read-all \
  -H "Authorization: Bearer TOKEN"
```

**Notes:**
- Update tất cả notifications của user: `isRead = true`
- `modifiedCount` = số notifications được update
- Dùng khi user click "Mark all as read" button

---

### PUT /api/notifications/:id/read

**Mô tả:** Đánh dấu 1 notification là đã đọc

**Access:** 🔒 Private (All authenticated)  

**Request:**

```http
PUT /api/notifications/65fc123456789abcdef00001/read HTTP/1.1
Host: localhost:5000
Authorization: Bearer {TOKEN}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | ObjectId | ✅ Yes | Notification ObjectId |

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Thông báo đã được đánh dấu là đã đọc",
  "data": {
    "_id": "65fc123456789abcdef00001",
    "isRead": true,
    "readAt": "2026-03-20T11:00:00.000Z"
  }
}
```

**Response 403 (Not Own Notification):**

```json
{
  "success": false,
  "message": "Bạn không có quyền đánh dấu notification này"
}
```

**Response 404 (Notification Not Found):**

```json
{
  "success": false,
  "message": "Không tìm thấy notification"
}
```

**Implementation:**
- File: `src/controllers/notificationController.js`
- Function: `markAsRead()`

**cURL Example:**

```bash
curl -X PUT http://localhost:5000/api/notifications/65fc123456789abcdef00001/read \
  -H "Authorization: Bearer TOKEN"
```

**Notes:**
- User chỉ mark được own notifications (validate userId = req.user._id)
- Set `isRead = true` và `readAt = current timestamp`
- Dùng khi user click vào notification item

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

---

### POST /api/upload

**Mô tả:** Upload 1 file bất kỳ (image/video/document)

**Access:** 🔒 Private (All authenticated)  

**Request:**

```http
POST /api/upload HTTP/1.1
Host: localhost:5000
Authorization: Bearer {TOKEN}
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="image.jpg"
Content-Type: image/jpeg

<binary data>
--boundary--
```

**Request Body (multipart/form-data):**
- Field name: `file`
- File types: image/*, video/*, application/pdf
- Max size: 50MB

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "url": "https://example.com/uploads/1710840000000-image.jpg",
    "filename": "image.jpg",
    "originalName": "my-photo.jpg",
    "size": 2048576,
    "mimeType": "image/jpeg",
    "uploadedAt": "2026-03-20T12:00:00.000Z"
  }
}
```

**Response 400 (File validation error):**

```json
{
  "success": false,
  "message": "File size exceeds 50MB limit"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/file.jpg"
```

**Notes:**
- Dùng Multer middleware để handle multipart upload
- Files lưu trên server hoặc cloud storage (S3, Cloudinary, etc.)
- URL returned có thể dùng ngay trong evidences hoặc attachments

⚠️ **SECURITY WARNING - Rate Limiting (Rule 8):**
- **KHÔNG có rate limiting** cho upload endpoints
- Attack vector: Spam uploads → Storage overload
- Workaround: Monitor disk space, implement cleanup cron job
- Fix needed: Rate limit 50 uploads/hour per user
- Priority: MEDIUM

---

### POST /api/upload/multiple

**Mô tả:** Upload nhiều files cùng lúc (max 10 files)

**Access:** 🔒 Private (All authenticated)  

**Request:**

```http
POST /api/upload/multiple HTTP/1.1
Host: localhost:5000
Authorization: Bearer {TOKEN}
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="files"; filename="image1.jpg"
[binary data]
--boundary
Content-Disposition: form-data; name="files"; filename="image2.jpg"
[binary data]
--boundary--
```

**Request Body (multipart/form-data):**
- Field name: `files` (array)
- Max files: 10
- Max size per file: 50MB

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Uploaded 3 files successfully",
  "data": {
    "files": [
      {
        "url": "https://example.com/uploads/1710840000000-image1.jpg",
        "filename": "image1.jpg",
        "size": 1024000,
        "mimeType": "image/jpeg"
      },
      {
        "url": "https://example.com/uploads/1710840000001-image2.jpg",
        "filename": "image2.jpg",
        "size": 2048000,
        "mimeType": "image/jpeg"
      }
    ],
    "totalSize": 3072000,
    "count": 2
  }
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/upload/multiple \
  -H "Authorization: Bearer TOKEN" \
  -F "files=@/path/to/file1.jpg" \
  -F "files=@/path/to/file2.jpg"
```

**Notes:**
- Tối đa 10 files per request
- Tổng size < 500MB recommended
- Partial success KHÔNG support - tất cả upload hoặc không upload gì

---

### POST /api/upload/photo

**Mô tả:** Upload 1 ảnh (image only)

**Access:** 🔒 Private (All authenticated)  

**Request Body (multipart/form-data):**
- Field name: `photo`
- File types: image/* (jpg, png, gif, webp)
- Max size: 10MB

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "url": "https://example.com/uploads/photo-1710840000000.jpg",
    "filename": "photo.jpg",
    "size": 512000,
    "mimeType": "image/jpeg",
    "dimensions": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/upload/photo \
  -H "Authorization: Bearer TOKEN" \
  -F "photo=@/path/to/photo.jpg"
```

**Notes:**
- Chỉ accept image MIME types
- Optional: Auto-resize hoặc compress nếu quá lớn
- Optional: Generate thumbnail

---

### POST /api/upload/photos

**Mô tả:** Upload nhiều ảnh cùng lúc (max 5 photos)

**Access:** 🔒 Private (All authenticated)  

**Request Body (multipart/form-data):**
- Field name: `photos` (array)
- File types: image/* only
- Max files: 5
- Max size per file: 10MB

**Response 200 (Success):**

```json
{
  "success": true,
  "message": "Uploaded 3 photos successfully",
  "data": {
    "photos": [
      {
        "url": "https://example.com/uploads/photo1.jpg",
        "filename": "photo1.jpg",
        "size": 512000
      },
      {
        "url": "https://example.com/uploads/photo2.jpg",
        "filename": "photo2.jpg",
        "size": 768000
      }
    ],
    "count": 2
  }
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/upload/photos \
  -H "Authorization: Bearer TOKEN" \
  -F "photos=@/path/to/photo1.jpg" \
  -F "photos=@/path/to/photo2.jpg"
```

**Notes:**
- Dùng cho evidence upload (UserTask.evidences)
- Max 5 photos để tránh quá tải
- Recommended: Compress images trước khi upload (frontend)

---

### POST /api/upload/video

**Mô tả:** Upload 1 video

**Access:** 🔒 Private (All authenticated)  

**Request Body (multipart/form-data):**
- Field name: `video`
- File types: video/* (mp4, mov, avi, webm)
- Max size: 50MB

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "url": "https://example.com/uploads/video-1710840000000.mp4",
    "filename": "video.mp4",
    "size": 25600000,
    "mimeType": "video/mp4",
    "duration": 120
  }
}
```

**Response 400 (File too large):**

```json
{
  "success": false,
  "message": "Video size exceeds 50MB limit. Please compress the video."
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/upload/video \
  -H "Authorization: Bearer TOKEN" \
  -F "video=@/path/to/video.mp4"
```

**Notes:**
- 50MB limit có thể nhỏ cho video dài
- Recommended: Frontend compress video trước upload
- Optional: Generate video thumbnail
- Optional: Transcode to standard format (mp4 H.264)

⚠️ **PERFORMANCE WARNING:**
- Video uploads có thể mất thời gian (50MB @ 5Mbps = ~80 seconds)
- Frontend nên show progress bar
- Consider upload to cloud storage (S3, Cloudinary) thay vì local server

---

### POST /api/upload/document

**Mô tả:** Upload 1 document (PDF only)

**Access:** 🔒 Private (All authenticated)  

**Request Body (multipart/form-data):**
- Field name: `document`
- File types: application/pdf only
- Max size: 5MB

**Response 200 (Success):**

```json
{
  "success": true,
  "data": {
    "url": "https://example.com/uploads/document-1710840000000.pdf",
    "filename": "guide.pdf",
    "size": 2048000,
    "mimeType": "application/pdf",
    "pages": 15
  }
}
```

**Response 400 (Invalid file type):**

```json
{
  "success": false,
  "message": "Only PDF files are allowed"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/upload/document \
  -H "Authorization: Bearer TOKEN" \
  -F "document=@/path/to/guide.pdf"
```

**Notes:**
- Chỉ accept PDF (application/pdf MIME type)
- Dùng cho broadcast attachments (hướng dẫn, checklist)
- Optional: Extract text hoặc metadata từ PDF

---

## 1️⃣1️⃣ DEV TOOLS

**Base Path:** `/api/dev`  
**File:** `src/routes/devRoutes.js`  

⚠️ **CRITICAL:** **ONLY for development - DISABLED in production**

---

### GET /api/dev/accounts

**Mô tả:** Lấy danh sách accounts để quick switch (Dev only)

**Access:** 🌐 Public (Development only)  

**Request:**

```http
GET /api/dev/accounts HTTP/1.1
Host: localhost:5000
```

**Response 200 (Success - Development):**

```json
{
  "success": true,
  "data": {
    "accounts": {
      "admin": [
        {
          "_id": "65f1234567890abcdef12340",
          "Ho_va_ten": "Admin System",
          "So_dien_thoai": "0900000001",
          "role": "admin"
        }
      ],
      "manager": [
        {
          "_id": "65f1234567890abcdef12345",
          "Ho_va_ten": "Trần Thị Manager",
          "So_dien_thoai": "0900000010",
          "role": "manager",
          "storeName": "Chi nhánh Quận 1"
        }
      ],
      "employee": [
        {
          "_id": "65f1234567890abcdef12346",
          "Ho_va_ten": "Nguyễn Văn A",
          "So_dien_thoai": "0987654321",
          "role": "employee",
          "storeName": "Chi nhánh Quận 1"
        }
      ]
    }
  }
}
```

**Response 403 (Production):**

```json
{
  "success": false,
  "message": "Dev tools are disabled in production"
}
```

**Implementation:**
- File: `src/routes/devRoutes.js`
- Function: Inline route handler

**cURL Example:**

```bash
curl -X GET http://localhost:5000/api/dev/accounts
```

**Notes:**
- **CHỈ hoạt động khi `NODE_ENV !== 'production'`**
- Trả về 403 nếu production environment
- Dùng cho Account Switcher UI (dev testing)
- Grouped by role để dễ chọn
- Limit 5 accounts per role

⚠️ **SECURITY WARNING:**
- **TUYỆT ĐỐI** disable trong production
- Expose tất cả employee info (security risk)
- Check environment variable: `if (process.env.NODE_ENV === 'production') { return 403; }`

---

### POST /api/dev/quick-login

**Mô tả:** Quick login không cần password (Dev only)

**Access:** 🌐 Public (Development only)  

**Request:**

```http
POST /api/dev/quick-login HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "employeeId": "65f1234567890abcdef12346"
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `employeeId` | ObjectId | ✅ Yes | Employee ObjectId to login as |

**Response 200 (Success - Development):**

```json
{
  "success": true,
  "message": "Quick login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "employee": {
      "_id": "65f1234567890abcdef12346",
      "Ho_va_ten": "Nguyễn Văn A",
      "So_dien_thoai": "0987654321",
      "role": "employee",
      "ID_Branch": {
        "_id": "65f1234567890abcdef11111",
        "Ten_chi_nhanh": "Chi nhánh Quận 1"
      }
    }
  }
}
```

**Response 403 (Production):**

```json
{
  "success": false,
  "message": "Dev tools are disabled in production"
}
```

**Response 404 (Employee Not Found):**

```json
{
  "success": false,
  "message": "Employee not found"
}
```

**Implementation:**
- File: `src/routes/devRoutes.js`
- Function: Inline route handler

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/dev/quick-login \
  -H "Content-Type: application/json" \
  -d '{"employeeId": "65f1234567890abcdef12346"}'
```

**Notes:**
- **CHỈ hoạt động khi `NODE_ENV !== 'production'`**
- KHÔNG cần password - bypass authentication
- Generate JWT token ngay lập tức
- Dùng để test với nhiều role khác nhau (admin, manager, employee)
- Frontend: Account Switcher dropdown → Click account → Quick login

⚠️ **SECURITY WARNING - CRITICAL:**
- **TUYỆT ĐỐI** disable trong production
- **BYPASS toàn bộ authentication** - Anyone can login as anyone!
- **MUST CHECK:** `if (process.env.NODE_ENV === 'production') { return 403; }`
- Nếu expose endpoint này trong production → **CRITICAL SECURITY BREACH**
- Recommended: Remove route registration trong production build

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
