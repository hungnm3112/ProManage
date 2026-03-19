# Manager - Task Assignment

> Quy trình nhận broadcast và phân công nhân viên

## 🔔 Nhận Broadcast từ Admin

### Notification

Khi Admin publish broadcast → Manager nhận thông báo:

```
┌─────────────────────────────────────────┐
│ 🔔 Thông báo mới                        │
├─────────────────────────────────────────┤
│ 📢 Broadcast mới: Kiểm tra hệ thống điện│
│                                          │
│ Priority: 🔴 Urgent                     │
│ Deadline: 20/03/2026                    │
│                                          │
│ [Từ chối]         [Xem chi tiết]       │
└─────────────────────────────────────────┘
```

### API: Lấy broadcasts assigned

```javascript
GET /api/manager/broadcasts?status=pending

Response: {
  broadcasts: [
    {
      _id: "broadcast_001",
      title: "Kiểm tra hệ thống điện",
      description: "Kiểm tra toàn bộ...",
      priority: "urgent",
      deadline: "2026-03-20T23:59:59Z",
      createdBy: {
        name: "Admin"
      },
      storeTaskId: "store_task_001", // Task của cửa hàng này
      status: "pending", // pending, accepted, rejected
      checklist: [
        {
          task: "Kiểm tra bảng điện chính",
          note: "Chụp 2 ảnh",
          required: true
        }
      ],
      attachments: [...]
    }
  ]
}
```

---

## ✅ Chấp nhận Broadcast

### Flow

```
1. Manager xem chi tiết broadcast
2. Đọc yêu cầu, checklist, deadline
3. Click "Chấp nhận" (hoặc "Từ chối" nếu không hợp lý)
4. Nếu chấp nhận → Chuyển sang màn "Phân công nhân viên"
```

### UI: Xem chi tiết broadcast

```
┌─────────────────────────────────────────────────────┐
│ ← Back         Kiểm tra hệ thống điện               │
├─────────────────────────────────────────────────────┤
│ Priority: 🔴 Urgent                                 │
│ Deadline: 20/03/2026 (còn 5 ngày)                  │
│ Created by: Admin | 15/03/2026 09:00               │
│                                                      │
│ 📝 Mô tả:                                           │
│ Kiểm tra toàn bộ hệ thống điện trong cửa hàng...   │
│                                                      │
│ ✅ Checklist (3 items):                             │
│ 1. ☑ Kiểm tra bảng điện chính                       │
│    → Chụp 2 ảnh: tổng thể + chi tiết               │
│ 2. ☑ Kiểm tra ổ cắm                                 │
│    → Chụp 1 ảnh mỗi khu vực                         │
│ 3. ☑ Kiểm tra đèn chiếu sáng                        │
│                                                      │
│ 📎 File đính kèm (1):                               │
│ 📄 huong_dan.pdf [Download]                        │
│                                                      │
│ [Từ chối]                          [Chấp nhận]     │
└─────────────────────────────────────────────────────┘
```

### API: Accept broadcast

```javascript
POST /api/manager/store-tasks/:id/accept

Response: {
  success: true,
  storeTask: {
    _id: "store_task_001",
    status: "accepted",
    acceptedAt: "2026-03-15T10:00:00Z"
  }
}
```

---

## 👥 Phân công Nhân viên

### UI

Sau khi accept → Màn phân công:

```
┌─────────────────────────────────────────────────────┐
│ Phân công: Kiểm tra hệ thống điện                  │
├─────────────────────────────────────────────────────┤
│ Deadline: 20/03/2026                                │
│                                                      │
│ 👥 Chọn nhân viên (10 người):                       │
│                                                      │
│ ┌─────────────────────────────────────────┐        │
│ │ ☑ Nguyễn Văn A (employee_001)           │        │
│ │ ☑ Trần Thị B (employee_002)             │        │
│ │ ☐ Lê Văn C (employee_003) [Đang nghỉ]   │        │
│ │ ☑ Phạm Thị D (employee_004)             │        │
│ │ ☑ Hoàng Văn E (employee_005)            │        │
│ │ ☐ Đặng Thị F (employee_006) [Bận task]  │        │
│ │ ...                                      │        │
│ └─────────────────────────────────────────┘        │
│ [☑ Chọn tất cả] [☐ Bỏ chọn tất cả]                │
│                                                      │
│ Đã chọn: 7/10 nhân viên                            │
│                                                      │
│ Ghi chú thêm (optional):                            │
│ [_____________________________________________]     │
│                                                      │
│ [Hủy]                         [Phân công ngay]     │
└─────────────────────────────────────────────────────┘
```

### API: Assign to employees

```javascript
POST /api/manager/store-tasks/:id/assign

Body: {
  employeeIds: [
    "employee_001",
    "employee_002",
    "employee_004",
    "employee_005"
  ],
  note: "Hoàn thành trước 18/03 nhé các bạn"
}

Response: {
  success: true,
  userTasksCreated: 4,
  notifications: 4
}
```

**Backend logic:**
1. Tạo `user_tasks` cho từng employee
2. Gửi notification cho employees
3. Cập nhật store_task status = "assigned"

---

## 📊 Theo dõi tiến độ

### Dashboard: Assigned Tasks

```
┌─────────────────────────────────────────────────────┐
│ Tasks đang phân công                                │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📢 Kiểm tra hệ thống điện                           │
│ [████████████░░░░░░░░] 57% (4/7 NV hoàn thành)      │
│ Deadline: 20/03/2026 | Priority: 🔴 Urgent         │
│                                                      │
│ Nhân viên:                                          │
│ • ✅ Nguyễn Văn A - Đã hoàn thành (16/03 14:30)    │
│ • ✅ Trần Thị B - Đã hoàn thành (16/03 15:00)      │
│ • 🔵 Phạm Thị D - Đang làm (50% checklist)         │
│ • ⚪ Hoàng Văn E - Chưa bắt đầu                     │
│                                                      │
│ [Xem chi tiết] [Nhắc nhở NV chưa làm]              │
└─────────────────────────────────────────────────────┘
```

### API: Xem tiến độ task

```javascript
GET /api/manager/store-tasks/:id/progress

Response: {
  storeTask: {
    _id: "store_task_001",
    broadcast: {
      title: "Kiểm tra hệ thống điện",
      deadline: "2026-03-20T23:59:59Z"
    },
    totalAssigned: 7,
    completed: 4,
    inProgress: 2,
    pending: 1,
    progress: 57.14
  },
  userTasks: [
    {
      _id: "user_task_001",
      employee: {
        _id: "employee_001",
        name: "Nguyễn Văn A"
      },
      status: "completed",
      checklistProgress: 100,
      completedAt: "2026-03-16T14:30:00Z"
    },
    {
      _id: "user_task_002",
      employee: {
        _id: "employee_004",
        name: "Phạm Thị D"
      },
      status: "in_progress",
      checklistProgress: 50,
      lastUpdatedAt: "2026-03-17T10:00:00Z"
    },
    // ...
  ]
}
```

---

## 🔔 Nhắc nhở Nhân viên

### UI

Nếu employee chưa làm hoặc làm chậm:

```
┌─────────────────────────────────────────┐
│ Nhắc nhở nhân viên                 [X]  │
├─────────────────────────────────────────┤
│                                          │
│ Task: Kiểm tra hệ thống điện             │
│ Deadline: 20/03/2026 (còn 3 ngày)       │
│                                          │
│ Nhân viên chưa hoàn thành (3):          │
│ ☑ Phạm Thị D (đang làm - 50%)           │
│ ☑ Hoàng Văn E (chưa bắt đầu)            │
│ ☑ Nguyễn Văn F (chưa bắt đầu)           │
│                                          │
│ Nội dung nhắc nhở:                       │
│ [Còn 3 ngày đến deadline, nhớ hoàn...]  │
│                                          │
│ [Hủy]              [Gửi nhắc nhở]       │
└─────────────────────────────────────────┘
```

### API

```javascript
POST /api/manager/store-tasks/:id/remind

Body: {
  employeeIds: ["employee_004", "employee_005"],
  message: "Còn 3 ngày đến deadline, nhớ hoàn thành nhé!"
}

Response: {
  success: true,
  notificationsSent: 2
}
```

---

## ❌ Từ chối Broadcast

### Khi nào từ chối?

- Deadline quá gấp, không hợp lý
- Yêu cầu không rõ ràng
- Cửa hàng đang thiếu nhân lực
- Có lý do đặc biệt khác

### UI

```
┌─────────────────────────────────────────┐
│ Từ chối broadcast                  [X]  │
├─────────────────────────────────────────┤
│                                          │
│ Task: Kiểm tra hệ thống điện             │
│                                          │
│ Lý do từ chối: *                        │
│ (•) Deadline quá gấp                    │
│ ( ) Yêu cầu không rõ ràng               │
│ ( ) Thiếu nhân lực                      │
│ ( ) Lý do khác                          │
│                                          │
│ Ghi chú thêm:                            │
│ [____________________________________]  │
│ [____________________________________]  │
│                                          │
│ ⚠️ Admin sẽ nhận được thông báo         │
│                                          │
│ [Hủy]                      [Xác nhận]   │
└─────────────────────────────────────────┘
```

### API

```javascript
POST /api/manager/store-tasks/:id/reject

Body: {
  reason: "deadline_too_tight",
  note: "Cửa hàng đang thiếu người, deadline 5 ngày là không đủ"
}

Response: {
  success: true,
  storeTask: {
    status: "rejected",
    rejectedAt: "2026-03-15T10:30:00Z"
  }
}
```

Admin sẽ nhận notification và có thể:
- Điều chỉnh deadline
- Gửi lại broadcast
- Liên hệ trực tiếp manager

---

## 🔄 Reassign Task

Manager có thể reassign nếu cần:

```javascript
PUT /api/manager/user-tasks/:userTaskId/reassign

Body: {
  newEmployeeId: "employee_007",
  reason: "Employee cũ đã nghỉ việc"
}
```

---

## 📊 Stats

```javascript
GET /api/manager/stats

Response: {
  broadcasts: {
    pending: 3,      // Chưa accept
    active: 5,       // Đang làm
    completed: 12    // Hoàn thành
  },
  employees: {
    total: 10,
    available: 8,
    busy: 2
  },
  performance: {
    avgCompletionTime: 2.5, // days
    onTimeRate: 85.5        // %
  }
}
```

---

## 🔗 Liên quan

- **Manager Overview**: [overview.md](overview.md)
- **Employee Review**: [employee-review.md](employee-review.md)
- **Dashboard**: [dashboard.md](dashboard.md)
- **API Reference**: [api-reference.md](api-reference.md#manager)
