# Manager - Dashboard

> Giao diện dashboard dành cho Trưởng chi nhánh

## 📊 Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│ WorkFlow 32 - Manager Dashboard        [User: Anh Tuấn]    │
│ CH-A - Chi nhánh Quận 1                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 📊 Quick Stats                                              │
│ ┌──────────────┬──────────────┬──────────────┬────────────┐│
│ │ 📢 Pending   │ 🔵 Active    │ ✅ Completed │ 👥 Team    ││
│ │ Broadcasts   │ Tasks        │ This Month   │ Members    ││
│ │      3       │      5       │      12      │  10 người  ││
│ └──────────────┴──────────────┴──────────────┴────────────┘│
│                                                              │
│ 🔔 Pending Broadcasts (3) - Cần xử lý                      │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 📢 Kiểm tra hệ thống điện                            │   │
│ │ Priority: 🔴 Urgent | Deadline: 20/03/2026          │   │
│ │ [Từ chối]                      [Chấp nhận & phân công]   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ 🔵 Active Tasks (5) - Đang thực hiện                       │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 📢 Cập nhật bảng giá                                 │   │
│ │ [███████████░░░░░░░░░] 60% (6/10 NV)                 │   │
│ │ Deadline: 22/03/2026 | 4 NV đang làm, 2 chưa bắt đầu │   │
│ │ [Xem chi tiết] [Nhắc nhở NV]                         │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ✅ Cần duyệt (7) - Employee đã hoàn thành                  │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 👤 Nguyễn Văn A - Kiểm tra hệ thống điện            │   │
│ │ Hoàn thành: 16/03 14:30 | 3 ảnh, 1 video đính kèm    │   │
│ │ [Xem & duyệt]                                        │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ 👥 Team Performance                                         │
│ [Chart showing employee completion rates]                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Stats Cards

### API

```javascript
GET /api/manager/dashboard

Response: {
  stats: {
    pendingBroadcasts: 3,
    activeTasks: 5,
    completedThisMonth: 12,
    teamMembers: 10
  },
  pendingBroadcasts: [
    {
      _id: "broadcast_001",
      title: "Kiểm tra hệ thống điện",
      priority: "urgent",
      deadline: "2026-03-20T23:59:59Z",
      storeTaskId: "store_task_001"
    }
  ],
  activeTasks: [
    {
      _id: "store_task_002",
      broadcast: {
        title: "Cập nhật bảng giá"
      },
      totalAssigned: 10,
      completed: 6,
      progress: 60,
      deadline: "2026-03-22T23:59:59Z"
    }
  ],
  reviewQueue: [
    {
      _id: "user_task_101",
      employee: {
        name: "Nguyễn Văn A"
      },
      broadcast: {
        title: "Kiểm tra hệ thống điện"
      },
      completedAt: "2026-03-16T14:30:00Z",
      evidenceCount: {
        photos: 3,
        videos: 1
      }
    }
  ]
}
```

---

## 🔔 Pending Broadcasts

### Card component

Mỗi broadcast pending hiển thị:
- Title
- Priority (color-coded)
- Deadline (màu đỏ nếu gần deadline)
- Actions: [Từ chối] hoặc [Chấp nhận]

Click "Chấp nhận" → Chuyển sang màn phân công (xem [task-assignment.md](task-assignment.md))

---

## 🔵 Active Tasks

### Card component

```
┌──────────────────────────────────────────────────────┐
│ 📢 Cập nhật bảng giá                                 │
├──────────────────────────────────────────────────────┤
│ Progress: [███████████░░░░░░░░░] 60%                 │
│ 6/10 nhân viên hoàn thành                            │
│                                                       │
│ Deadline: 22/03/2026 (còn 4 ngày)                    │
│ Priority: 🟡 Medium                                  │
│                                                       │
│ ✅ Đã xong (6):                                      │
│ • Nguyễn Văn A, Trần Thị B, Lê Văn C...             │
│                                                       │
│ 🔵 Đang làm (2):                                     │
│ • Phạm Thị D (50%), Hoàng Văn E (30%)                │
│                                                       │
│ ⚪ Chưa bắt đầu (2):                                 │
│ • Nguyễn Văn F, Trần Thị G                           │
│                                                       │
│ [Xem chi tiết]  [Nhắc nhở NV chưa làm]              │
└──────────────────────────────────────────────────────┘
```

### Click "Xem chi tiết"

→ Chuyển sang màn task detail (xem [task-assignment.md](task-assignment.md#theo-dõi-tiến-độ))

---

## ✅ Review Queue

### Card component

```
┌──────────────────────────────────────────────────────┐
│ 👤 Nguyễn Văn A                                      │
│ Task: Kiểm tra hệ thống điện                         │
├──────────────────────────────────────────────────────┤
│ Hoàn thành: 16/03/2026 14:30                        │
│ Deadline: 20/03/2026 (sớm 4 ngày ✅)                │
│                                                       │
│ Evidence:                                             │
│ • 🖼️ 3 ảnh                                           │
│ • 🎥 1 video                                         │
│ • ✅ Checklist: 3/3 items                            │
│                                                       │
│ Ghi chú NV:                                          │
│ "Đã kiểm tra xong, mọi thứ OK"                       │
│                                                       │
│ [Xem & duyệt]                                        │
└──────────────────────────────────────────────────────┘
```

Click "Xem & duyệt" → Màn review chi tiết (xem [employee-review.md](employee-review.md))

---

## 👥 Team Performance

### Chart: Bar chart completion rate

```
Team Performance - Tháng 3/2026

100% ┤         ██
 90% ┤     ██  ██  ██
 80% ┤ ██  ██  ██  ██  ██
 70% ┤ ██  ██  ██  ██  ██
 60% ┤ ██  ██  ██  ██  ██  ██
 50% ┤ ██  ██  ██  ██  ██  ██
     └────────────────────────
      A   B   C   D   E   F
     95% 90% 88% 85% 82% 75%

Avg: 86%
```

### API

```javascript
GET /api/manager/team-performance

Response: {
  employees: [
    {
      _id: "employee_001",
      name: "Nguyễn Văn A",
      completionRate: 95,
      totalTasks: 20,
      completedTasks: 19,
      avgCompletionTime: 1.8 // days
    },
    // ...
  ],
  average: {
    completionRate: 86,
    avgCompletionTime: 2.3
  }
}
```

---

## 📅 Calendar View

### Broadcast timeline

```
March 2026
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  15 │  16 │  17 │  18 │  19 │  20 │  21 │
│     │ ✅2│     │     │     │ ⏰1 │     │
│     │     │     │     │     │ due │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  22 │  23 │  24 │  25 │  26 │  27 │  28 │
│ ⏰1│     │     │     │     │     │     │
│ due │     │     │     │     │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

✅ = Tasks completed
⏰ = Deadlines
```

---

## 🔔 Notifications Panel

### Sidebar

```
┌─────────────────────────────────────────┐
│ 🔔 Thông báo (5 chưa đọc)              │
├─────────────────────────────────────────┤
│ • 📢 Broadcast mới: Kiểm tra...        │
│   5 phút trước                          │
│                                          │
│ • ✅ Nguyễn Văn A hoàn thành task       │
│   1 giờ trước                           │
│                                          │
│ • ⚠️ Deadline gần: Cập nhật bảng giá   │
│   2 giờ trước                           │
│                                          │
│ [Xem tất cả]                            │
└─────────────────────────────────────────┘
```

---

## 🔍 Search & Filters

### UI

```
┌─────────────────────────────────────────┐
│ 🔍 [Tìm kiếm broadcasts, tasks...]     │
├─────────────────────────────────────────┤
│ Filters:                                 │
│ Status: [All ▼] [Active] [Completed]   │
│ Priority: [All ▼] [Urgent] [High]      │
│ Date: [Last 7 days ▼]                   │
└─────────────────────────────────────────┘
```

---

## 📊 Quick Actions

### Floating button

```
┌─────┐
│  +  │ ← Floating Action Button
└─────┘

Click → Menu:
• 📢 Tạo broadcast tùy chỉnh (nếu được phép)
• 👥 Xem team
• 📊 Xem báo cáo
• 🔔 Gửi thông báo nhóm
```

---

## 📱 Mobile Responsive

Dashboard tối ưu cho mobile:

```
┌──────────────────────┐
│ WorkFlow 32          │
│ [☰] CH-A  [🔔3] [👤]│
├──────────────────────┤
│ 📊 Stats             │
│ ┌──────┬──────┐      │
│ │📢 3  │🔵 5  │      │
│ │Pend  │Active│      │
│ └──────┴──────┘      │
│ ┌──────┬──────┐      │
│ │✅ 12 │👥 10 │      │
│ │Done  │Team  │      │
│ └──────┴──────┘      │
│                       │
│ 🔔 Pending (3)       │
│ [Swipe cards...]     │
│                       │
│ 🔵 Active (5)        │
│ [Swipe cards...]     │
│                       │
│ ✅ Review (7)        │
│ [Swipe cards...]     │
└──────────────────────┘
```

---

## 🔗 Liên quan

- **Manager Overview**: [overview.md](overview.md)
- **Task Assignment**: [task-assignment.md](task-assignment.md)
- **Employee Review**: [employee-review.md](employee-review.md)
- **API Reference**: [api-reference.md](api-reference.md#manager-dashboard)
