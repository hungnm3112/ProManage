# Admin - Store Management

> Quản lý cửa hàng và nhân viên trong hệ thống

## 🏪 Tổng quan

Admin có toàn quyền quản lý:
- Danh sách cửa hàng (32 stores)
- Thông tin cửa hàng (tên, địa chỉ, mã code)
- Trưởng chi nhánh phụ trách
- Danh sách nhân viên theo cửa hàng

---

## 📋 Quản lý Cửa hàng

### Danh sách cửa hàng

**UI Table:**
```
┌──────┬────────────┬─────────────────┬─────────────┬─────────┬──────────┐
│ Code │ Tên CH     │ Trưởng CN       │ NV          │ Status  │ Actions  │
├──────┼────────────┼─────────────────┼─────────────┼─────────┼──────────┤
│ CH-A │ Quận 1     │ Anh Tuấn        │ 10 người    │ ✅ Hoạt │ [Edit]   │
│ CH-B │ Quận 3     │ Chị Lan         │ 12 người    │ ✅ Hoạt │ [Edit]   │
│ CH-C │ Quận 5     │ (Chưa gán TCN)  │ 0 người     │ ⚠️ Thiếu│ [Edit]   │
│ CH-D │ Quận 7     │ Anh Nam         │ 8 người     │ ✅ Hoạt │ [Edit]   │
└──────┴────────────┴─────────────────┴─────────────┴─────────┴──────────┘

Filter: [Tất cả] [Hoạt động] [Thiếu TCN] [Không hoạt động]
Sort by: [Tên] [Code] [Số NV]
```

### API: Lấy danh sách cửa hàng

```javascript
GET /api/stores?page=1&limit=20&status=active

Response: {
  stores: [
    {
      _id: "store_001",
      code: "CH-A",
      name: "Chi nhánh Quận 1",
      address: "123 Nguyễn Huệ, Q1, HCM",
      managerId: "user_manager_001",
      managerName: "Nguyễn Văn Tuấn",
      employeeCount: 10,
      isActive: true,
      createdAt: "2026-01-15T00:00:00Z"
    },
    // ...
  ],
  pagination: {
    total: 32,
    page: 1,
    limit: 20,
    pages: 2
  }
}
```

---

## ➕ Tạo cửa hàng mới

### Form

```
┌─────────────────────────────────────────┐
│ Tạo cửa hàng mới                  [X]   │
├─────────────────────────────────────────┤
│                                          │
│ Mã code: [CH-___]                       │
│ (Tự động generate hoặc nhập thủ công)   │
│                                          │
│ Tên cửa hàng: [________________]        │
│                                          │
│ Địa chỉ:                                 │
│ [____________________________________]  │
│ [____________________________________]  │
│                                          │
│ Số điện thoại: [______________]         │
│                                          │
│ Trưởng chi nhánh:                        │
│ [🔍 Chọn từ danh sách users...]         │
│ Hoặc [+ Tạo tài khoản TCN mới]          │
│                                          │
│ Ghi chú (optional):                      │
│ [____________________________________]  │
│                                          │
│ [Hủy]                    [Tạo cửa hàng] │
└─────────────────────────────────────────┘
```

### API

```javascript
POST /api/stores

Body: {
  code: "CH-E",
  name: "Chi nhánh Quận 10",
  address: "456 Lê Hồng Phong, Q10, HCM",
  phone: "0901234567",
  managerId: "user_123", // Chọn từ users có role: manager
  notes: "Cửa hàng mới khai trương"
}

Response: {
  success: true,
  store: {
    _id: "store_033",
    code: "CH-E",
    name: "Chi nhánh Quận 10",
    // ...
  }
}
```

---

## ✏️ Chỉnh sửa cửa hàng

### Form

```
┌─────────────────────────────────────────┐
│ Chỉnh sửa: CH-A                    [X]  │
├─────────────────────────────────────────┤
│                                          │
│ Mã code: CH-A (Không thể sửa)           │
│                                          │
│ Tên: [Chi nhánh Quận 1_______]         │
│                                          │
│ Địa chỉ: [123 Nguyễn Huệ, Q1___]       │
│                                          │
│ TCN: Anh Tuấn (tuanle@...)              │
│ [Thay đổi TCN]                          │
│                                          │
│ Nhân viên: 10 người [Xem danh sách]    │
│                                          │
│ Trạng thái:                              │
│ (•) Hoạt động  ( ) Tạm ngưng           │
│                                          │
│ [Hủy]    [Lưu thay đổi]    [Xóa CH]    │
└─────────────────────────────────────────┘
```

### API

```javascript
PUT /api/stores/:id

Body: {
  name: "Chi nhánh Quận 1 - Updated",
  address: "123 Nguyễn Huệ, Q1, HCM",
  managerId: "user_new_manager",
  isActive: true
}
```

---

## 👥 Quản lý Nhân viên

### Xem nhân viên theo cửa hàng

```
┌─────────────────────────────────────────────────────────┐
│ Nhân viên - CH-A (10 người)                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [+ Thêm nhân viên]                                      │
│                                                          │
│ ┌────┬─────────────┬──────────────┬─────────┬─────────┐ │
│ │ STT│ Họ tên      │ Email        │ Role    │ Actions │ │
│ ├────┼─────────────┼──────────────┼─────────┼─────────┤ │
│ │ 1  │ Anh Tuấn    │ tuan@...     │ 👑 TCN  │ [Edit]  │ │
│ │ 2  │ Anh Bình    │ binh@...     │ 👤 NV   │ [Edit]  │ │
│ │ 3  │ Chị Hoa     │ hoa@...      │ 👤 NV   │ [Edit]  │ │
│ │ ...│             │              │         │         │ │
│ └────┴─────────────┴──────────────┴─────────┴─────────┘ │
└─────────────────────────────────────────────────────────┘
```

### API: Lấy nhân viên theo cửa hàng

```javascript
GET /api/stores/:storeId/employees

Response: {
  store: {
    _id: "store_001",
    code: "CH-A",
    name: "Chi nhánh Quận 1"
  },
  employees: [
    {
      _id: "user_001",
      name: "Nguyễn Văn Tuấn",
      email: "tuan@example.com",
      role: "manager",
      isActive: true
    },
    {
      _id: "user_002",
      name: "Trần Văn Bình",
      email: "binh@example.com",
      role: "employee",
      isActive: true
    }
    // ...
  ]
}
```

---

## ➕ Thêm nhân viên vào cửa hàng

### Cách 1: Tạo user mới

```
┌─────────────────────────────────────────┐
│ Thêm nhân viên mới - CH-A          [X]  │
├─────────────────────────────────────────┤
│                                          │
│ Họ tên: [________________]              │
│                                          │
│ Email: [________________@example.com]    │
│                                          │
│ Số điện thoại: [______________]         │
│                                          │
│ Vai trò:                                 │
│ ( ) Trưởng chi nhánh (thay thế hiện tại)│
│ (•) Nhân viên                           │
│                                          │
│ Mật khẩu mặc định:                       │
│ [Auto-generate: 123456]                 │
│ ☑ Gửi email thông báo tài khoản         │
│                                          │
│ [Hủy]                    [Tạo tài khoản]│
└─────────────────────────────────────────┘
```

### API

```javascript
POST /api/stores/:storeId/employees

Body: {
  name: "Nguyễn Thị Mai",
  email: "mai@example.com",
  phone: "0987654321",
  role: "employee", // or "manager"
  password: "123456", // auto-generated
  sendEmail: true
}

Response: {
  success: true,
  user: {
    _id: "user_new",
    name: "Nguyễn Thị Mai",
    email: "mai@example.com",
    role: "employee",
    storeId: "store_001"
  }
}
```

### Cách 2: Assign user đã có vào cửa hàng

Nếu có user chưa thuộc cửa hàng nào:

```javascript
PUT /api/users/:userId

Body: {
  storeId: "store_001"
}
```

---

## 🗑️ Xóa cửa hàng

### Quy tắc

**❌ KHÔNG thể xóa nếu:**
- Có broadcasts đang hoạt động
- Có tasks chưa hoàn thành
- Có nhân viên đang active

**✅ Có thể xóa nếu:**
- Không có tasks nào liên quan
- Tất cả nhân viên đã được chuyển sang cửa hàng khác
- Cửa hàng đang ở trạng thái "Tạm ngưng"

### Warning Modal

```
┌─────────────────────────────────────────┐
│ ⚠️ Xác nhận xóa cửa hàng               │
├─────────────────────────────────────────┤
│                                          │
│ Bạn có chắc muốn xóa:                   │
│ CH-E - Chi nhánh Quận 10                │
│                                          │
│ ⚠️ Hành động này KHÔNG THỂ hoàn tác!    │
│                                          │
│ Trước khi xóa, hãy đảm bảo:             │
│ ✓ Chuyển nhân viên sang CH khác         │
│ ✓ Không có tasks đang chạy              │
│ ✓ Đã backup dữ liệu nếu cần             │
│                                          │
│ Nhập "XOA CH-E" để xác nhận:            │
│ [________________]                      │
│                                          │
│ [Hủy]                    [Xác nhận xóa] │
└─────────────────────────────────────────┘
```

---

## 📊 Store Statistics

Mỗi cửa hàng hiển thị stats:

```
┌─────────────────────────────────────────┐
│ CH-A - Quận 1                           │
├─────────────────────────────────────────┤
│ 📊 Thống kê:                            │
│ - Nhân viên: 10 (1 TCN, 9 NV)          │
│ - Tasks assigned: 45 (tháng này)        │
│ - Completion rate: 92%                   │
│ - Avg response time: 2.3 ngày           │
│                                          │
│ 📈 Performance:                         │
│ [████████████████░░░░] 92%              │
│ Top 3/32 cửa hàng                       │
└─────────────────────────────────────────┘
```

---

## 🔗 Liên quan

- **Admin Overview**: [overview.md](overview.md)
- **Analytics Dashboard**: [analytics.md](analytics.md)
- **API Reference**: [api-reference.md](api-reference.md#stores)
