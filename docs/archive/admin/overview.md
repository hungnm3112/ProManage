# Admin - Overview

> Vai trò: **Quản trị viên hệ thống**  
> Level: **Cấp 1 (Cao nhất)**

## 👨‍💼 Mô tả vai trò

Admin là người quản lý toàn bộ hệ thống WorkFlow 32, chịu trách nhiệm:
- Phát sóng công việc (broadcasts) đến nhiều cửa hàng
- Theo dõi tiến độ tổng thể của tất cả cửa hàng
- Quản lý danh sách cửa hàng và nhân viên
- Xem báo cáo và thống kê tổng hợp
- Cấu hình recurring tasks (công việc lặp lại)

### Chức vụ có quyền Admin:
- **Tổng giám đốc**
- **Kho tổng**
- **Phó tổng giám đốc**
- **Giám đốc khu vực**
- **Phó giám đốc**

*Lưu ý: Chức vụ được xác định qua bảng GroupUser trong database.*

---

## 🎯 Quyền hạn

### ✅ Admin có thể:

1. **Broadcast Management**
   - Tạo task mới (draft mode)
   - Phát sóng task đến nhiều cửa hàng cùng lúc
   - Xem danh sách tất cả broadcasts
   - Chỉnh sửa/xóa broadcast (chỉ khi ở trạng thái draft)
   - Xem thống kê chi tiết từng broadcast

2. **Store Management**
   - Xem danh sách tất cả cửa hàng
   - Thêm/sửa/xóa cửa hàng
   - Xem danh sách nhân viên theo cửa hàng
   - Gán Trưởng chi nhánh cho cửa hàng

3. **User Management**
   - Tạo tài khoản cho Trưởng chi nhánh và Nhân viên
   - Cập nhật thông tin user
   - Vô hiệu hóa/kích hoạt tài khoản

4. **Analytics & Reports**
   - Xem dashboard tổng thể
   - Xem tiến độ theo cửa hàng
   - Xem tiến độ theo broadcast
   - Export báo cáo (future feature)

5. **System Settings**
   - Cấu hình recurring tasks
   - Cài đặt evidence requirements
   - Quản lý notifications

### ❌ Admin KHÔNG thể:

- Giao việc trực tiếp cho nhân viên (phải thông qua Trưởng chi nhánh)
- Duyệt kết quả công việc của nhân viên (quyền của Trưởng chi nhánh)
- Sửa/xóa broadcast đã phát sóng

---

## 🔄 Workflow chính

```
1. Tạo Broadcast (Draft)
   ↓
2. Cấu hình:
   - Tiêu đề, mô tả
   - Chọn cửa hàng target
   - Checklist template
   - Deadline
   - Evidence requirements
   - Recurring pattern (optional)
   ↓
3. Phát sóng (Publish)
   ↓
4. Hệ thống tự động:
   - Tạo store_task cho mỗi cửa hàng
   - Gửi notification cho Trưởng chi nhánh
   ↓
5. Theo dõi tiến độ:
   - Dashboard realtime
   - X/Y cửa hàng hoàn thành
   - Xem chi tiết từng cửa hàng
```

---

## 📊 Dashboard Overview

Admin dashboard hiển thị:

### Stats Cards
- **Tổng Broadcasts**: 50 (tất cả thời gian)
- **Active Broadcasts**: 12 (đang chạy)
- **Tổng cửa hàng**: 32
- **Active Stores**: 28 (đang có task)
- **Tổng nhân viên**: 300+

### Active Broadcasts
Danh sách broadcasts đang chạy với:
- Tiêu đề
- Progress bar (X/Y cửa hàng hoàn thành)
- % hoàn thành
- Deadline
- Priority badge

### Recent Activities
- "CH-A hoàn thành broadcast #123"
- "CH-B yêu cầu gia hạn deadline"
- "Broadcast #124 đã được tạo"

### Store Completion Stats
Biểu đồ cột hiển thị:
- Tiến độ từng cửa hàng
- So sánh performance giữa các stores

---

## 🎨 UI Components

### Broadcast Card
```
┌─────────────────────────────────────────┐
│ 📢 Kiểm tra hệ thống điện               │
│ Priority: [🔴 Urgent]                   │
│ Deadline: 2026-03-20                    │
│                                          │
│ [████████████░░░░░░░] 75%               │
│ 24/32 cửa hàng hoàn thành               │
│                                          │
│ Status breakdown:                        │
│ ✅ Completed: 24                        │
│ 🔵 In Progress: 6                       │
│ ⚪ Pending: 2                           │
│                                          │
│ [Xem chi tiết] [Thống kê]              │
└─────────────────────────────────────────┘
```

### Store Progress Table
```
| Cửa hàng | TCN      | Progress | Status      | Actions   |
|----------|----------|----------|-------------|-----------|
| CH-A     | Anh Tuấn | 100%     | ✅ Completed | [Chi tiết]|
| CH-B     | Chị Lan  | 60%      | 🔵 In Prog  | [Chi tiết]|
| CH-C     | Anh Nam  | 0%       | ⚪ Pending  | [Nhắc nhở]|
```

---

## 📱 Screens

### Main Screens
1. **Dashboard** - Tổng quan hệ thống
2. **Broadcasts** - Quản lý tất cả broadcasts
3. **Create Broadcast** - Form tạo broadcast mới
4. **Broadcast Detail** - Chi tiết và thống kê
5. **Stores** - Danh sách cửa hàng
6. **Users** - Quản lý người dùng
7. **Analytics** - Báo cáo và thống kê

Xem chi tiết từng screen tại:
- [Broadcast Management](broadcast-management.md)
- [Store Management](store-management.md)
- [Analytics](analytics.md)

---

## 🔗 Liên quan

- **API Reference**: [admin/api-reference.md](api-reference.md)
- **Broadcast Management**: [broadcast-management.md](broadcast-management.md)
- **Analytics**: [analytics.md](analytics.md)
- **Technical Architecture**: [../technical/architecture.md](../technical/architecture.md)
