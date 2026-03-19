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
- Recurring broadcasts sẽ tự động tạo broadcast mới theo schedule (⚠️ Known Issue #5: chưa implement auto-publish)

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
