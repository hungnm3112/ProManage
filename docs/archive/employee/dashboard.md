# Employee - Dashboard

> Giao diện dashboard dành cho Nhân viên

## 📱 Mobile-First Design

Dashboard tối ưu cho mobile (employees chủ yếu dùng điện thoại):

```
┌──────────────────────────┐
│ WorkFlow 32              │
│ [☰] Nguyễn Văn A  [🔔3] │
├──────────────────────────┤
│ 📊 My Tasks              │
│ ┌──────┬──────┬──────┐  │
│ │⚪ New│🔵 Doing│✅Done│  │
│ │  3   │   2   │  15  │  │
│ └──────┴──────┴──────┘  │
│                           │
│ ⚠️ Urgent (1)            │
│ ┌──────────────────────┐ │
│ │📢 Kiểm tra hệ thống  │ │
│ │⏰ 20/03 (5 ngày)    │ │
│ │[██░░░░] 33%         │ │
│ │[Tiếp tục]           │ │
│ └──────────────────────┘ │
│                           │
│ 🔵 Đang làm (2)          │
│ ┌──────────────────────┐ │
│ │📢 Cập nhật bảng giá  │ │
│ │⏰ 22/03 (7 ngày)    │ │
│ │[██████░░] 66%       │ │
│ │[Tiếp tục]           │ │
│ └──────────────────────┘ │
│                           │
│ ⚪ Chưa bắt đầu (2)      │
│ [Swipe để xem...]        │
└──────────────────────────┘
```

---

## 📊 Stats Cards

### API

```javascript
GET /api/employee/dashboard

Response: {
  stats: {
    newTasks: 3,
    inProgress: 2,
    completedThisMonth: 15
  },
  urgentTasks: [
    {
      _id: "user_task_001",
      broadcast: {
        title: "Kiểm tra hệ thống điện",
        priority: "urgent",
        deadline: "2026-03-20T23:59:59Z"
      },
      progress: 33.33,
      checklistCompleted: 1,
      checklistTotal: 3
    }
  ],
  activeTasks: [
    {
      _id: "user_task_002",
      broadcast: {
        title: "Cập nhật bảng giá",
        priority: "medium",
        deadline: "2026-03-22T23:59:59Z"
      },
      progress: 66.67,
      checklistCompleted: 2,
      checklistTotal: 3
    }
  ],
  pendingTasks: [...]
}
```

---

## 🔔 Task List

### Task Card Component

```
┌──────────────────────────────────────────┐
│ 📢 Kiểm tra hệ thống điện                │
├──────────────────────────────────────────┤
│ Priority: 🔴 Urgent                      │
│ Deadline: 20/03/2026 (5 ngày)           │
│                                           │
│ Progress:                                 │
│ [███████░░░░░░░░░] 33%                   │
│ 1/3 checklist items hoàn thành           │
│                                           │
│ ✅ Kiểm tra bảng điện - Done             │
│ ⚪ Kiểm tra ổ cắm - Pending              │
│ ⚪ Kiểm tra đèn - Pending                │
│                                           │
│ [Tiếp tục làm]                           │
└──────────────────────────────────────────┘
```

### Status badges

- 🔴 Urgent
- 🟡 High
- 🟢 Medium
- ⚪ Low

### Deadline colors

- **Đỏ**: < 2 ngày
- **Cam**: 2-5 ngày
- **Xanh**: > 5 ngày

---

## ⚪ New Tasks (Chưa bắt đầu)

```
┌──────────────────────────┐
│ ⚪ New Tasks (3)         │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │📢 Task A             │ │
│ │⏰ 25/03             │ │
│ │[Bắt đầu]            │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │📢 Task B             │ │
│ │⏰ 28/03             │ │
│ │[Bắt đầu]            │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

Click "Bắt đầu" → Chuyển sang màn Task Detail (xem [task-completion.md](task-completion.md))

---

## 🔵 In Progress (Đang làm)

```
┌──────────────────────────┐
│ 🔵 In Progress (2)       │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │📢 Task C             │ │
│ │[████░░] 66%         │ │
│ │⏰ 22/03             │ │
│ │[Tiếp tục]           │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

---

## ✅ Completed (Đã hoàn thành)

### List view

```
┌──────────────────────────┐
│ ✅ Completed (15)        │
│ Filter: [Tháng này ▼]   │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │✅ Task D             │ │
│ │⏰ 18/03 (2 ngày trước)│ │
│ │👑 Đã duyệt          │ │
│ │⭐⭐⭐⭐⭐           │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │✅ Task E             │ │
│ │⏰ 17/03             │ │
│ │👑 Đã duyệt          │ │
│ │⭐⭐⭐⭐            │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### API

```javascript
GET /api/employee/tasks?status=approved

Response: {
  tasks: [
    {
      _id: "user_task_101",
      broadcast: {
        title: "Task D"
      },
      completedAt: "2026-03-18T14:30:00Z",
      approvedAt: "2026-03-18T16:00:00Z",
      managerFeedback: "Làm tốt lắm!",
      rating: 5
    }
  ]
}
```

---

## ⚠️ Rejected Tasks (Cần làm lại)

```
┌──────────────────────────┐
│ ⚠️ Needs Revision (1)    │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │📢 Task F             │ │
│ │💬 "Ảnh chưa rõ..."  │ │
│ │[Làm lại ngay]       │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

---

## 📅 Calendar View (Optional)

```
March 2026
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  15 │  16 │  17 │  18 │  19 │  20 │  21 │
│     │     │     │     │     │⏰ 2│     │
│     │     │     │     │     │ due │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  22 │  23 │  24 │  25 │  26 │  27 │  28 │
│⏰ 1│     │     │     │     │     │     │
│ due │     │     │     │     │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

---

## 🔔 Notifications

### Notification panel

```
┌─────────────────────────────┐
│ 🔔 Thông báo (3)            │
├─────────────────────────────┤
│ • 📢 Task mới: Kiểm tra...  │
│   5 phút trước              │
│                              │
│ • ✅ Task "Cập nhật..." đã  │
│   được duyệt (⭐⭐⭐⭐⭐) │
│   1 giờ trước               │
│                              │
│ • ⚠️ Deadline gần: Task A   │
│   còn 2 ngày                │
│   2 giờ trước               │
│                              │
│ [Xem tất cả]                │
└─────────────────────────────┘
```

---

## 🏆 Performance Stats

### Personal stats

```
┌─────────────────────────────┐
│ 🏆 Thành tích của bạn       │
├─────────────────────────────┤
│ Tháng này:                   │
│ • Hoàn thành: 15/18 (83%)   │
│ • Đúng deadline: 14/15      │
│ • Avg rating: ⭐⭐⭐⭐ (4.2)│
│                              │
│ Streak: 🔥 7 ngày liên tục  │
│                              │
│ [Xem chi tiết]              │
└─────────────────────────────┘
```

### API

```javascript
GET /api/employee/stats

Response: {
  thisMonth: {
    totalTasks: 18,
    completedTasks: 15,
    completionRate: 83.33,
    onTimeTasks: 14,
    avgRating: 4.2
  },
  streak: {
    current: 7,
    longest: 15
  }
}
```

---

## 📱 Bottom Navigation

```
┌─────────────────────────────┐
│ [🏠 Home] [📋 Tasks] [📊 Stats] [👤 Me] │
└─────────────────────────────┘
```

---

## 🔍 Search & Filter

```
┌─────────────────────────────┐
│ 🔍 [Tìm kiếm tasks...]      │
├─────────────────────────────┤
│ Filter:                      │
│ Status: [All ▼]             │
│ Priority: [All ▼]           │
│ Date: [All time ▼]          │
└─────────────────────────────┘
```

---

## 🌙 Dark Mode Support

Employee dashboard hỗ trợ dark mode (tiết kiệm pin):

```
┌──────────────────────────┐
│ Settings                  │
├──────────────────────────┤
│ Appearance:               │
│ (•) Auto                 │
│ ( ) Light                │
│ ( ) Dark                 │
└──────────────────────────┘
```

---

## 📲 Push Notifications

Employee nhận push notifications khi:
- Task mới được giao
- Deadline gần (1 ngày trước)
- Task được duyệt
- Task bị reject (cần làm lại)

---

## 🔗 Liên quan

- **Employee Overview**: [overview.md](overview.md)
- **Task Completion**: [task-completion.md](task-completion.md)
- **Evidence Submission**: [evidence-submission.md](evidence-submission.md)
- **API Reference**: [api-reference.md](api-reference.md#employee-dashboard)
