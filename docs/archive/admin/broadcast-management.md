# Admin - Broadcast Management

> Tính năng chính: **Phát sóng công việc đến nhiều cửa hàng**

## 🎯 Tổng quan

Broadcast là tính năng cho phép Admin tạo 1 công việc và phát sóng đến nhiều cửa hàng cùng lúc. Mỗi cửa hàng sẽ nhận được 1 `store_task` riêng, do Trưởng chi nhánh quản lý.

---

## 📝 Tạo Broadcast

### Bước 1: Tạo Draft

**Form fields:**

```javascript
{
  title: "Kiểm tra hệ thống điện",
  description: "Kiểm tra tất cả hệ thống điện, đảm bảo an toàn...",
  
  // Target stores
  targetStoreIds: ["store_001", "store_002", "store_003"],
  
  // Checklist template
  checklistTemplate: [
    { title: "Kiểm tra tủ điện chính", order: 1 },
    { title: "Kiểm tra dây nối đất", order: 2 },
    { title: "Test cầu dao", order: 3 }
  ],
  
  // Deadline
  deadline: "2026-03-20T17:00:00Z",
  
  // Priority
  priority: "high", // low | medium | high | urgent
  
  // Evidence requirements
  requireEvidence: true,
  evidenceConfig: {
    photos: { min: 1, max: 10, required: true },
    videos: { min: 0, max: 3, required: false },
    documents: { min: 0, max: 5, required: false },
    notes: { required: true, minLength: 20 }
  },
  
  // Recurring (optional)
  isRecurring: true,
  recurrencePattern: "monthly", // daily | weekly | monthly | yearly
  recurrenceDay: 1, // Ngày 1 hàng tháng
}
```

### Bước 2: Preview

Hệ thống hiển thị preview:
- Danh sách cửa hàng sẽ nhận task
- Tên Trưởng chi nhánh từng cửa hàng
- Checklist template
- Evidence requirements

### Bước 3: Publish

Khi click [Phát sóng], hệ thống sẽ:

1. **Update broadcast status** → `published`
2. **Tạo store_task** cho mỗi cửa hàng:
   ```javascript
   {
     broadcastId: broadcast._id,
     storeId: "store_001",
     managerId: "user_TCN_A",
     deadline: broadcast.deadline,
     managerStatus: "pending",
     totalEmployees: 0,
     employeesCompleted: 0,
     overallProgress: 0
   }
   ```

3. **Gửi notifications** cho tất cả Trưởng chi nhánh:
   ```javascript
   {
     userId: managerId,
     type: "new_broadcast",
     title: "Task mới từ Admin",
     message: "Bạn có task mới: Kiểm tra hệ thống điện"
   }
   ```

---

## 📊 Theo dõi tiến độ

### Broadcast Detail Screen

**Header:**
```
┌─────────────────────────────────────────────────┐
│ 📢 Kiểm tra hệ thống điện                       │
│ Created: 2026-03-15 | Deadline: 2026-03-20     │
│ Priority: [🔴 Urgent]                           │
│                                                  │
│ Overall Progress:                                │
│ [████████████████████░░░░░░░] 75%               │
│ 24/32 cửa hàng hoàn thành                       │
└─────────────────────────────────────────────────┘
```

**Status Breakdown:**
```
✅ Completed:     24 stores (75%)
🔵 In Progress:    6 stores (19%)
⚪ Pending:         2 stores (6%)
```

**Store Progress Table:**
```
┌──────────┬───────────┬──────────┬────────────┬─────────────┐
│ Cửa hàng │ TCN       │ Progress │ NV done/total│ Status     │
├──────────┼───────────┼──────────┼──────────────┼────────────┤
│ CH-A     │ Anh Tuấn  │ 100%     │ 10/10       │ ✅ Done    │
│ CH-B     │ Chị Lan   │ 60%      │ 6/10        │ 🔵 Working │
│ CH-C     │ Anh Nam   │ 0%       │ 0/8         │ ⚪ Pending │
└──────────┴───────────┴──────────┴──────────────┴────────────┘
```

Click vào từng cửa hàng → Xem chi tiết:
- Danh sách nhân viên được giao
- Tiến độ từng nhân viên
- Evidence đã nộp
- Comments từ TCN

---

## 🔄 Recurring Broadcasts

### Cấu hình

```javascript
{
  isRecurring: true,
  recurrencePattern: "weekly",  // Lặp hàng tuần
  recurrenceDay: 1,             // Thứ 2 mỗi tuần
}
```

**Patterns hỗ trợ:**
- `daily`: Hàng ngày
- `weekly`: Hàng tuần (chọn thứ mấy)
- `monthly`: Hàng tháng (chọn ngày nào)
- `yearly`: Hàng năm (chọn ngày/tháng)

### Cơ chế hoạt động

1. **Khi broadcast hoàn thành** (tất cả stores done):
   - Hệ thống đánh dấu `completedAt`
   - Tính `nextGenerationDate` theo pattern

2. **Cron job chạy mỗi ngày** (6:00 AM):
   - Tìm broadcasts có `nextGenerationDate <= today`
   - Tự động tạo broadcast mới với:
     - Cùng title, description, checklist
     - Deadline mới (+ offset theo pattern)
     - Status = `published`
     - Gửi notification cho TCN

3. **Broadcast mới** được tạo:
   ```javascript
   {
     title: "Kiểm tra hệ thống điện", // Giữ nguyên
     isRecurring: true,
     originalBroadcastId: "broadcast_001", // Link về broadcast gốc
     publishedAt: new Date()
   }
   ```

### UI Indicator

Broadcasts có recurring sẽ hiển thị:
```
🔄 Lặp lại: Hàng tuần (Thứ 2)
📅 Task tiếp theo: 2026-03-24
```

---

## ✏️ Chỉnh sửa Broadcast

### Quy tắc:

**✅ Có thể sửa:**
- Broadcast đang ở trạng thái `draft`
- Mọi field đều có thể thay đổi

**❌ KHÔNG thể sửa:**
- Broadcast đã `published`
- Lý do: Đã tạo store_tasks, việc sửa sẽ gây inconsistency

### Workaround nếu cần sửa broadcast đã publish:

1. **Clone** broadcast (tạo bản copy)
2. **Sửa** bản copy
3. **Publish** bản mới
4. **Archive** broadcast cũ (không xóa để giữ lịch sử)

---

## 🗑️ Xóa Broadcast

### Quy tắc:

**✅ Có thể xóa:**
- Broadcast ở trạng thái `draft`

**❌ KHÔNG thể xóa:**
- Broadcast đã `published`
- Phải **archive** thay vì xóa

### Archive workflow:

```javascript
// Update broadcast
{
  status: "archived",
  archivedAt: new Date(),
  archivedBy: adminId
}

// Giữ lại tất cả data để audit
// Ẩn khỏi danh sách active broadcasts
```

---

## 🎨 UI Components

### Create Broadcast Form

```
┌─────────────────────────────────────────────────┐
│ 📢 Tạo Broadcast Mới                            │
├─────────────────────────────────────────────────┤
│                                                  │
│ Tiêu đề: [____________________________]         │
│                                                  │
│ Mô tả:                                          │
│ [____________________________________________]  │
│ [____________________________________________]  │
│                                                  │
│ Chọn cửa hàng:                                  │
│ [🔍 Tìm kiếm...]                                │
│ ☑ CH-A (Anh Tuấn)   ☑ CH-B (Chị Lan)          │
│ ☐ CH-C (Anh Nam)    ☑ CH-D (Chị Hoa)          │
│ [Chọn tất cả] [Bỏ chọn]                        │
│                                                  │
│ Checklist:                                      │
│ 1. [Kiểm tra tủ điện] [X]                      │
│ 2. [Kiểm tra dây nối đất] [X]                  │
│ 3. [Test cầu dao] [X]                          │
│ [+ Thêm item]                                   │
│                                                  │
│ Deadline: [📅 20/03/2026] [⏰ 17:00]           │
│                                                  │
│ Priority: ( ) Low (•) Medium ( ) High ( ) Urgent│
│                                                  │
│ ☑ Yêu cầu báo cáo:                              │
│   ├─ Ảnh: Min [1] Max [10] ☑ Bắt buộc         │
│   ├─ Video: Min [0] Max [3] ☐ Bắt buộc        │
│   └─ Notes: ☑ Bắt buộc (tối thiểu 20 ký tự)   │
│                                                  │
│ ☑ Lặp lại:                                      │
│   ├─ Tần suất: [Hàng tháng ▼]                 │
│   └─ Vào ngày: [1 ▼]                           │
│                                                  │
│ [Lưu nháp] [Preview] [Phát sóng ngay]         │
└─────────────────────────────────────────────────┘
```

---

## 🔗 Liên quan

- **API Reference**: [api-reference.md](api-reference.md#broadcasts)
- **Business Logic**: [../technical/business-logic.md](../technical/business-logic.md#admin-broadcast)
- **Database Schema**: [../technical/database-schema.md](../technical/database-schema.md#broadcasts)
