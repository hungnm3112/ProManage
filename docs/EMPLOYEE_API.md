# Employee Management API

> API endpoints để quản lý nhân viên

## Base URL
```
http://localhost:5000/api/employees
```

## Authentication
Tất cả endpoints đều yêu cầu JWT token trong header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Get All Employees
```http
GET /api/employees
```

**Authorization:** Admin, Manager

**Query Parameters:**
- `role` (optional): Filter by role (`admin`, `manager`, `employee`)
- `branchId` (optional): Filter by branch ID
- `status` (optional): Filter by status (`Đang hoạt động`, `Đã dừng`, `Đã nghỉ việc`)
- `search` (optional): Search by name, phone, or email
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "Phone": "0392029548",
      "FullName": "Nguyen Van A",
      "Email": "user@example.com",
      "Status": "Đang hoạt động",
      "ID_GroupUser": {
        "_id": "...",
        "Name": "Nhân viên kho",
        "Description": "..."
      },
      "ID_Branch": {
        "_id": "...",
        "Name": "Chi nhánh 1",
        "Map_Address": "...",
        "Phone": "..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

**Example cURL:**
```bash
curl -X GET "http://localhost:5000/api/employees?status=Đang hoạt động&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. Get Employee by ID
```http
GET /api/employees/:id
```

**Authorization:** All authenticated users (managers can only see their branch employees)

**Parameters:**
- `id` (required): Employee MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "Phone": "0392029548",
    "FullName": "Nguyen Van A",
    "Email": "user@example.com",
    "Status": "Đang hoạt động",
    "Birthday": "1990-01-01",
    "Address": "...",
    "Gender": "Nam",
    "CMND": "123456789",
    "ID_GroupUser": { ... },
    "ID_Branch": { ... }
  }
}
```

**Example cURL:**
```bash
curl -X GET "http://localhost:5000/api/employees/65f8a..." \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Create Employee
```http
POST /api/employees
```

**Authorization:** Admin only

**Request Body:**
```json
{
  "Phone": "0912345678",
  "FullName": "Nguyen Van B",
  "Email": "nvb@example.com",
  "Password": "password123",
  "ID_GroupUser": "65f8a...",
  "ID_Branch": "65f8b...",
  "CMND": "123456789",
  "Birthday": "1990-05-15",
  "Address": "123 Street, City",
  "Gender": "Nam",
  "Level": "Đại học",
  "TaxCode": "1234567890",
  "Salary": "15000000",
  "DateOnCompany": "2024-01-01"
}
```

**Required Fields:**
- `Phone` (10 digits, starts with 0)
- `FullName` (min 2 chars)
- `Password` (min 6 chars)
- `ID_GroupUser` (valid ObjectId)
- `ID_Branch` (valid ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Tạo nhân viên thành công",
  "data": { ... }
}
```

**Example cURL:**
```bash
curl -X POST "http://localhost:5000/api/employees" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Phone": "0912345678",
    "FullName": "Nguyen Van B",
    "Password": "password123",
    "ID_GroupUser": "65f8a...",
    "ID_Branch": "65f8b..."
  }'
```

---

### 4. Update Employee
```http
PUT /api/employees/:id
```

**Authorization:** Admin only

**Parameters:**
- `id` (required): Employee MongoDB ObjectId

**Request Body:** (all fields optional)
```json
{
  "Phone": "0912345678",
  "FullName": "Nguyen Van B Updated",
  "Email": "updated@example.com",
  "Password": "newpassword123",
  "ID_GroupUser": "65f8a...",
  "ID_Branch": "65f8b...",
  "CMND": "987654321",
  "Birthday": "1990-05-15",
  "Address": "New Address",
  "Gender": "Nam",
  "Level": "Thạc sĩ",
  "TaxCode": "9876543210",
  "Salary": "20000000",
  "DateOnCompany": "2024-01-01",
  "Image": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cập nhật nhân viên thành công",
  "data": { ... }
}
```

**Example cURL:**
```bash
curl -X PUT "http://localhost:5000/api/employees/65f8a..." \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "FullName": "Nguyen Van B Updated",
    "Salary": "20000000"
  }'
```

---

### 5. Update Employee Status
```http
PATCH /api/employees/:id/status
```

**Authorization:** Admin only

**Parameters:**
- `id` (required): Employee MongoDB ObjectId

**Request Body:**
```json
{
  "status": "Đang hoạt động"
}
```

**Valid Status Values:**
- `Đang hoạt động`
- `Đã dừng`
- `Đã nghỉ việc`

**Response:**
```json
{
  "success": true,
  "message": "Đã chuyển trạng thái nhân viên sang: Đang hoạt động",
  "data": { ... }
}
```

**Example cURL:**
```bash
curl -X PATCH "http://localhost:5000/api/employees/65f8a.../status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Đã dừng"
  }'
```

---

### 6. Delete Employee (Soft Delete)
```http
DELETE /api/employees/:id
```

**Authorization:** Admin only

**Parameters:**
- `id` (required): Employee MongoDB ObjectId

**Note:** This is a soft delete - changes status to `Đã nghỉ việc`

**Response:**
```json
{
  "success": true,
  "message": "Đã xóa nhân viên (soft delete)",
  "data": { ... }
}
```

**Example cURL:**
```bash
curl -X DELETE "http://localhost:5000/api/employees/65f8a..." \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Số điện thoại đã được sử dụng"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Token không hợp lệ hoặc đã hết hạn"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Không có quyền truy cập"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Không tìm thấy nhân viên"
}
```

---

## Testing Checklist

### 1. Get All Employees
- [ ] Admin can get all employees
- [ ] Manager can only get their branch employees
- [ ] Filter by role works
- [ ] Filter by branch works
- [ ] Filter by status works
- [ ] Search functionality works
- [ ] Pagination works

### 2. Get Employee by ID
- [ ] Admin can get any employee
- [ ] Manager can get own branch employees
- [ ] Manager cannot get other branch employees
- [ ] Employee can get their own info
- [ ] Invalid ID returns 404

### 3. Create Employee
- [ ] Admin can create employee
- [ ] Manager cannot create employee (403)
- [ ] Duplicate phone returns 400
- [ ] Password is hashed with HMAC-SHA512
- [ ] Salt is generated and saved
- [ ] Default status is 'Đang hoạt động'
- [ ] Validation errors return 400

### 4. Update Employee
- [ ] Admin can update employee
- [ ] Manager cannot update (403)
- [ ] Phone uniqueness check works
- [ ] Password update works (new hash + salt)
- [ ] Partial updates work
- [ ] Invalid ID returns 404

### 5. Update Status
- [ ] Admin can change status
- [ ] Manager cannot change status (403)
- [ ] Invalid status returns 400
- [ ] Status change is reflected

### 6. Delete Employee
- [ ] Admin can delete (soft delete)
- [ ] Manager cannot delete (403)
- [ ] Status changes to 'Đã nghỉ việc'
- [ ] Employee still exists in DB

---

## Next Steps

After testing Employee API:
1. ✅ Task 1.2.1: Employee Controller (DONE)
2. ✅ Task 1.2.2: Employee Validation (DONE)
3. ✅ Task 1.2.3: Employee Routes (DONE)
4. ⏳ Task 1.2.4: Test Employee API (IN PROGRESS)
5. → Task 1.3.1: Brand Management Controller

---

**Last Updated:** March 16, 2026
