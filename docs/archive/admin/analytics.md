# Admin - Analytics & Dashboard

> Dashboard tổng quan và báo cáo hệ thống

## 📊 Admin Dashboard

### Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│ WorkFlow 32 - Admin Dashboard              [User: Admin]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 📊 Stats Cards                                              │
│ ┌────────────┬────────────┬────────────┬────────────┐      │
│ │ 📢 Total   │ 🔵 Active  │ ✅ Completed│ 🏪 Stores  │      │
│ │ Broadcasts │ Broadcasts │ This Month  │ Active     │      │
│ │    50      │     12     │      8      │   28/32    │      │
│ └────────────┴────────────┴────────────┴────────────┘      │
│                                                              │
│ 📈 Active Broadcasts (12)                                   │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 📢 Kiểm tra hệ thống điện                            │   │
│ │ [████████████████████░░░░░░░] 75% (24/32 stores)     │   │
│ │ Deadline: 2026-03-20 | Priority: 🔴 Urgent          │   │
│ │ [Xem chi tiết]                                       │   │
│ ├──────────────────────────────────────────────────────┤   │
│ │ 📢 Cập nhật bảng giá                                 │   │
│ │ [██████░░░░░░░░░░░░░░] 40% (13/32 stores)           │   │
│ │ Deadline: 2026-03-22 | Priority: 🟡 Medium          │   │
│ │ [Xem chi tiết]                                       │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ 🏪 Store Performance                                        │
│ [Chart: Bar/Column showing completion rate by store]        │
│                                                              │
│ 📅 Recent Activities                                        │
│ • 14:30 - CH-A hoàn thành "Kiểm tra hệ thống điện"         │
│ • 14:15 - Broadcast #124 được tạo                          │
│ • 13:45 - CH-B yêu cầu gia hạn deadline (Rejected)         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Stats Cards

### API: Get Dashboard Stats

```javascript
GET /api/admin/dashboard

Response: {
  broadcasts: {
    total: 50,
    active: 12,
    completedThisMonth: 8,
    draft: 3
  },
  stores: {
    total: 32,
    active: 28,
    inactive: 4
  },
  employees: {
    total: 305,
    managers: 32,
    workers: 273
  },
  completion: {
    overall: 87.5, // %
    thisWeek: 92.3,
    thisMonth: 85.6
  }
}
```

### UI Components

```javascript
function StatsCard({ title, value, icon, trend }) {
  return (
    <div className="stats-card">
      <div className="icon">{icon}</div>
      <div className="content">
        <h3>{title}</h3>
        <div className="value">{value}</div>
        {trend && (
          <div className={`trend ${trend > 0 ? 'up' : 'down'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

// Usage
<StatsCard 
  title="Active Broadcasts"
  value={12}
  icon="📢"
  trend={+5.2}
/>
```

---

## 📈 Broadcast Detail Analytics

### Click vào broadcast → Xem chi tiết

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back                Kiểm tra hệ thống điện                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Created: 2026-03-15 | Deadline: 2026-03-20                 │
│ Created by: Admin | Priority: 🔴 Urgent                     │
│                                                              │
│ 🎯 Overall Progress                                         │
│ [████████████████████░░░░░░░] 75%                          │
│ 24/32 cửa hàng hoàn thành                                   │
│                                                              │
│ 📊 Status Breakdown                                         │
│ ┌────────────┬────────────┬────────────┐                   │
│ │ ✅ Done    │ 🔵 Working │ ⚪ Pending │                   │
│ │    24      │      6     │      2     │                   │
│ │   (75%)    │    (19%)   │     (6%)   │                   │
│ └────────────┴────────────┴────────────┘                   │
│                                                              │
│ 🏪 Store Progress (Sort by: [Progress ▼])                  │
│ ┌──────┬───────────┬──────────┬──────────┬──────────┐     │
│ │ Store│ Manager   │ Progress │ NV Done  │ Status   │     │
│ ├──────┼───────────┼──────────┼──────────┼──────────┤     │
│ │ CH-A │ Anh Tuấn  │ 100%     │ 10/10    │ ✅ Done  │     │
│ │ CH-B │ Chị Lan   │ 60%      │ 6/10     │ 🔵 Work  │     │
│ │ CH-C │ Anh Nam   │ 0%       │ 0/8      │ ⚪ Pend  │     │
│ │ ...  │           │          │          │          │     │
│ └──────┴───────────┴──────────┴──────────┴──────────┘     │
│                                                              │
│ 📅 Timeline                                                 │
│ • 2026-03-15 09:00 - Broadcast created                     │
│ • 2026-03-15 09:05 - Published to 32 stores                │
│ • 2026-03-16 14:30 - CH-A completed (first)                │
│ • 2026-03-17 10:15 - CH-B in progress                      │
│ • 2026-03-18 16:00 - CH-D completed                        │
│                                                              │
│ [Export Report] [Send Reminder] [Archive]                  │
└─────────────────────────────────────────────────────────────┘
```

### API: Broadcast Stats

```javascript
GET /api/broadcasts/:id/stats

Response: {
  broadcast: {
    _id: "...",
    title: "Kiểm tra hệ thống điện",
    totalStores: 32,
    completedStores: 24,
    overallProgress: 75
  },
  statusBreakdown: {
    completed: 24,
    inProgress: 6,
    pending: 2
  },
  storesDetail: [
    {
      store: {
        _id: "store_001",
        code: "CH-A",
        name: "Chi nhánh Quận 1"
      },
      manager: {
        name: "Nguyễn Văn Tuấn"
      },
      progress: 100,
      totalEmployees: 10,
      employeesCompleted: 10,
      employeesApproved: 10,
      status: "completed",
      completedAt: "2026-03-16T14:30:00Z"
    },
    // ...
  ],
  timeline: [
    {
      timestamp: "2026-03-15T09:00:00Z",
      event: "broadcast_created",
      description: "Broadcast created"
    },
    // ...
  ]
}
```

---

## 🏪 Store Performance Analytics

### Biểu đồ cột (Bar Chart)

```
Completion Rate by Store (Tháng 3/2026)

100% ┤     ██          ██  
 90% ┤     ██  ██  ██  ██  ██
 80% ┤ ██  ██  ██  ██  ██  ██  ██
 70% ┤ ██  ██  ██  ██  ██  ██  ██  ██
 60% ┤ ██  ██  ██  ██  ██  ██  ██  ██  ██
 50% ┤ ██  ██  ██  ██  ██  ██  ██  ██  ██
     └───────────────────────────────────
      CH-A CH-B CH-D CH-E CH-F ... CH-C
      98%  95%  92%  90%  87%  ... 45%
```

### Bảng xếp hạng

```
┌─────────────────────────────────────────────────────┐
│ 🏆 Top Performers (Tháng này)                       │
├─────────────────────────────────────────────────────┤
│ 🥇 CH-A - Quận 1                                    │
│    • Completion: 98% (49/50 tasks)                  │
│    • Avg time: 1.2 ngày                             │
│    • Perfect score: 5/5 tasks                       │
│                                                      │
│ 🥈 CH-B - Quận 3                                    │
│    • Completion: 95% (47/50 tasks)                  │
│    • Avg time: 1.5 ngày                             │
│                                                      │
│ 🥉 CH-D - Quận 7                                    │
│    • Completion: 92% (46/50 tasks)                  │
│    • Avg time: 1.8 ngày                             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ⚠️ Needs Attention                                  │
├─────────────────────────────────────────────────────┤
│ CH-C - Quận 5                                       │
│ • Completion: 45% (22/50 tasks)                     │
│ • Avg time: 5.2 ngày (slow)                         │
│ • 3 tasks overdue                                    │
│ [Send Reminder] [Contact Manager]                   │
└─────────────────────────────────────────────────────┘
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
│ 📢2│     │     │     │     │ ⏰3 │     │
│ new │     │     │     │     │ due │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  22 │  23 │  24 │  25 │  26 │  27 │  28 │
│ ⏰1│     │     │     │     │     │     │
│ due │     │     │     │     │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

📢 = Broadcast created
⏰ = Deadline
✅ = Completed
```

---

## 📊 Reports & Export

### Generate Report

```
┌─────────────────────────────────────────┐
│ Tạo báo cáo                        [X]  │
├─────────────────────────────────────────┤
│                                          │
│ Loại báo cáo:                           │
│ (•) Broadcast Summary                   │
│ ( ) Store Performance                   │
│ ( ) Employee Performance                │
│ ( ) Custom Report                       │
│                                          │
│ Khoảng thời gian:                       │
│ From: [📅 01/03/2026] To: [📅 31/03/2026]│
│                                          │
│ Filters:                                 │
│ Stores: [All ▼]                         │
│ Priority: [All ▼]                       │
│ Status: [☑ Completed ☑ Pending]        │
│                                          │
│ Format:                                  │
│ (•) PDF  ( ) Excel  ( ) CSV            │
│                                          │
│ [Cancel]              [Generate Report] │
└─────────────────────────────────────────┘
```

### API: Export Report

```javascript
POST /api/admin/reports/generate

Body: {
  type: "broadcast_summary",
  dateFrom: "2026-03-01",
  dateTo: "2026-03-31",
  filters: {
    stores: ["store_001", "store_002"],
    priority: ["high", "urgent"],
    status: ["completed"]
  },
  format: "pdf"
}

Response: {
  success: true,
  reportUrl: "/downloads/report_202603_12345.pdf",
  expiresAt: "2026-03-18T23:59:59Z"
}
```

---

## 🔔 Notifications & Alerts

### Alert Rules

Admin có thể set alerts:

```
┌─────────────────────────────────────────┐
│ Alert Settings                          │
├─────────────────────────────────────────┤
│ ☑ Broadcast 50% completed               │
│ ☑ Broadcast 100% completed              │
│ ☑ Store overdue task (> 2 days)         │
│ ☑ Store completion < 50%                │
│ ☐ Daily summary report (6:00 AM)        │
│                                          │
│ Send via:                                │
│ ☑ In-app notification                   │
│ ☑ Email                                 │
│ ☐ SMS                                   │
└─────────────────────────────────────────┘
```

---

## 🔗 Liên quan

- **Broadcast Management**: [broadcast-management.md](broadcast-management.md)
- **Store Management**: [store-management.md](store-management.md)
- **API Reference**: [api-reference.md](api-reference.md#analytics)
