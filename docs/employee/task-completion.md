# Employee - Task Completion

> Quy trình nhận task và hoàn thành checklist

## 🔔 Nhận Task

### Notification

Khi Manager assign task → Employee nhận thông báo:

```
┌─────────────────────────────────────────┐
│ 🔔 Task mới được giao                   │
├─────────────────────────────────────────┤
│ 📢 Kiểm tra hệ thống điện               │
│                                          │
│ Từ: Anh Tuấn (TCN)                      │
│ Deadline: 20/03/2026                    │
│ Priority: 🔴 Urgent                     │
│                                          │
│ [Xem chi tiết]                          │
└─────────────────────────────────────────┘
```

### API: Lấy tasks assigned

```javascript
GET /api/employee/tasks?status=pending

Response: {
  tasks: [
    {
      _id: "user_task_001",
      broadcast: {
        title: "Kiểm tra hệ thống điện",
        description: "Kiểm tra toàn bộ hệ thống điện...",
        priority: "urgent",
        deadline: "2026-03-20T23:59:59Z"
      },
      assignedBy: {
        name: "Anh Tuấn (TCN)"
      },
      status: "pending",
      checklist: [
        {
          _id: "check_001",
          task: "Kiểm tra bảng điện chính",
          note: "Chụp 2 ảnh: tổng thể + chi tiết",
          required: true,
          isCompleted: false
        },
        {
          _id: "check_002",
          task: "Kiểm tra ổ cắm",
          note: "Chụp 1 ảnh mỗi khu vực",
          required: true,
          isCompleted: false
        }
      ],
      attachments: [...]
    }
  ]
}
```

---

## 📋 Xem Chi tiết Task

### UI

```
┌─────────────────────────────────────────────────────┐
│ ← Back         Kiểm tra hệ thống điện               │
├─────────────────────────────────────────────────────┤
│ Priority: 🔴 Urgent                                 │
│ Deadline: 20/03/2026 (còn 5 ngày)                  │
│ Assigned by: Anh Tuấn (TCN) | 15/03/2026           │
│                                                      │
│ 📝 Mô tả:                                           │
│ Kiểm tra toàn bộ hệ thống điện trong cửa hàng...   │
│                                                      │
│ ✅ Checklist (0/3 hoàn thành):                      │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ ☐ 1. Kiểm tra bảng điện chính *             │    │
│ │    💡 Chụp 2 ảnh: tổng thể + chi tiết       │    │
│ │    [Bắt đầu]                                 │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ ☐ 2. Kiểm tra ổ cắm *                       │    │
│ │    💡 Chụp 1 ảnh mỗi khu vực                │    │
│ │    [Bắt đầu]                                 │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ ☐ 3. Kiểm tra đèn chiếu sáng *              │    │
│ │    [Bắt đầu]                                 │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ 📎 File đính kèm (1):                               │
│ 📄 huong_dan.pdf [Download]                        │
│                                                      │
│ [Bắt đầu làm task]                                  │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Hoàn thành từng Checklist Item

### Click "Bắt đầu" → Modal upload

```
┌─────────────────────────────────────────┐
│ ✅ Kiểm tra bảng điện chính        [X]  │
├─────────────────────────────────────────┤
│                                          │
│ 💡 Hướng dẫn:                           │
│ Chụp 2 ảnh: tổng thể + chi tiết         │
│                                          │
│ 📷 Ảnh (0/2):                           │
│ ┌─────────┬─────────┐                  │
│ │ [+ Ảnh] │ [+ Ảnh] │                  │
│ └─────────┴─────────┘                  │
│                                          │
│ 🎥 Video (optional):                    │
│ [+ Thêm video]                          │
│                                          │
│ 📝 Ghi chú (optional):                  │
│ [____________________________________]  │
│ [____________________________________]  │
│                                          │
│ [Hủy]              [Hoàn thành item]   │
└─────────────────────────────────────────┘
```

### Upload ảnh

Click [+ Ảnh] → Mở camera hoặc thư viện ảnh:

```
┌─────────────────────────────────────────┐
│ Chọn nguồn ảnh                          │
├─────────────────────────────────────────┤
│ 📷 Chụp ảnh ngay                        │
│ 🖼️ Chọn từ thư viện                     │
│ [Hủy]                                   │
└─────────────────────────────────────────┘
```

Sau khi chọn/chụp:

```
┌─────────────────────────────────────────┐
│ 📷 Ảnh (2/2):                           │
│ ┌─────────┬─────────┐                  │
│ │ [img_1] │ [img_2] │                  │
│ │  [X]    │  [X]    │  ← Delete button│
│ └─────────┴─────────┘                  │
│                                          │
│ ✅ Đủ số lượng yêu cầu                  │
└─────────────────────────────────────────┘
```

### API: Upload evidence

```javascript
POST /api/employee/user-tasks/:taskId/checklist/:checklistId/evidence

Body (FormData): {
  photos: [file1, file2],
  videos: [file3],
  note: "Đã kiểm tra xong, mọi thứ OK"
}

Response: {
  success: true,
  checklist: {
    _id: "check_001",
    isCompleted: true,
    evidence: {
      photos: [
        {
          _id: "photo_001",
          url: "/uploads/photos/photo_001.jpg",
          uploadedAt: "2026-03-16T14:25:00Z"
        },
        {
          _id: "photo_002",
          url: "/uploads/photos/photo_002.jpg",
          uploadedAt: "2026-03-16T14:26:00Z"
        }
      ],
      videos: [],
      note: "Đã kiểm tra xong, mọi thứ OK"
    }
  }
}
```

### UI sau khi hoàn thành item

```
┌─────────────────────────────────────────────────┐
│ ✅ 1. Kiểm tra bảng điện chính * ✅ Hoàn thành │
│    📷 2 ảnh | 📝 Đã kiểm tra xong...           │
│    [Xem lại] [Chỉnh sửa]                       │
└─────────────────────────────────────────────────┘
```

---

## 🔁 Progress Auto-save

Mỗi khi hoàn thành 1 checklist item → Tự động cập nhật progress:

```javascript
PUT /api/employee/user-tasks/:taskId/progress

Body: {
  checklistItemId: "check_001",
  isCompleted: true
}

Response: {
  success: true,
  userTask: {
    progress: 33.33, // 1/3 items
    status: "in_progress"
  }
}
```

---

## 📊 Theo dõi Progress

### Progress bar

```
┌─────────────────────────────────────────┐
│ Task: Kiểm tra hệ thống điện            │
├─────────────────────────────────────────┤
│ Progress:                                │
│ [███████████░░░░░░░░░] 66%              │
│ 2/3 items hoàn thành                    │
│                                          │
│ Deadline: 20/03/2026 (còn 4 ngày)       │
└─────────────────────────────────────────┘
```

---

## ✅ Submit Task (Hoàn thành toàn bộ)

Khi hoàn thành tất cả checklist items → Button "Submit":

```
┌─────────────────────────────────────────┐
│ ✅ Tất cả items đã hoàn thành           │
│                                          │
│ Ghi chú cuối cho TCN (optional):        │
│ [____________________________________]  │
│ [____________________________________]  │
│                                          │
│ [Review lại]           [Submit task]    │
└─────────────────────────────────────────┘
```

### API: Submit task

```javascript
POST /api/employee/user-tasks/:taskId/submit

Body: {
  overallNote: "Task hoàn thành tốt, mọi thứ OK"
}

Response: {
  success: true,
  userTask: {
    _id: "user_task_001",
    status: "completed",
    completedAt: "2026-03-16T14:30:00Z",
    overallNote: "Task hoàn thành tốt"
  }
}
```

Backend:
1. Cập nhật status = "completed"
2. Gửi notification cho Manager
3. Thêm vào review queue của Manager

---

## 🔄 Revision (Làm lại)

Nếu Manager reject → Employee nhận notification:

```
┌─────────────────────────────────────────┐
│ ⚠️ Task cần làm lại                     │
├─────────────────────────────────────────┤
│ 📢 Kiểm tra hệ thống điện               │
│                                          │
│ Feedback từ TCN:                         │
│ "Ảnh chưa rõ ràng, cần chụp lại ảnh    │
│  bảng điện"                             │
│                                          │
│ [Xem chi tiết & làm lại]                │
└─────────────────────────────────────────┘
```

### UI: Revision view

```
┌─────────────────────────────────────────────────────┐
│ ⚠️ Làm lại: Kiểm tra hệ thống điện                 │
├─────────────────────────────────────────────────────┤
│ 📝 Feedback từ TCN:                                 │
│ "Ảnh chưa rõ ràng, cần chụp lại ảnh bảng điện"     │
│                                                      │
│ ✅ Checklist:                                       │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ ⚠️ 1. Kiểm tra bảng điện chính (Cần sửa)   │    │
│ │    📷 2 ảnh hiện tại: [img_1] [img_2]       │    │
│ │    [Chụp lại ảnh]                           │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ ✅ 2. Kiểm tra ổ cắm (OK)                   │    │
│ │    📷 3 ảnh                                  │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ [Submit lại]                                        │
└─────────────────────────────────────────────────────┘
```

### API: Update evidence

Cập nhật lại evidence cho checklist item cần sửa:

```javascript
PUT /api/employee/user-tasks/:taskId/checklist/:checklistId/evidence

Body (FormData): {
  photos: [new_file1, new_file2],
  note: "Đã chụp lại rõ hơn"
}

Response: {
  success: true,
  checklist: {
    evidence: {
      photos: [...],
      note: "Đã chụp lại rõ hơn"
    }
  }
}
```

Sau đó submit lại:

```javascript
POST /api/employee/user-tasks/:taskId/resubmit

Body: {
  overallNote: "Đã chỉnh sửa theo yêu cầu"
}

Response: {
  success: true,
  userTask: {
    status: "completed",
    completedAt: "2026-03-17T10:00:00Z",
    revisionCount: 1
  }
}
```

---

## 📱 Mobile UI

Optimized cho mobile (employees dùng điện thoại):

```
┌──────────────────────┐
│ Task Detail          │
│ [<] Kiểm tra ... [•]│
├──────────────────────┤
│ ⏰ 20/03 (5 ngày)   │
│ 🔴 Urgent            │
│                       │
│ ✅ Progress 2/3      │
│ [████████░░░] 66%   │
│                       │
│ 📋 Checklist:        │
│ ┌──────────────────┐ │
│ │✅ Bảng điện      │ │
│ │  2 ảnh           │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │✅ Ổ cắm         │ │
│ │  3 ảnh           │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │☐ Đèn chiếu sáng │ │
│ │  [BẮT ĐẦU]      │ │
│ └──────────────────┘ │
│                       │
│ [📝 Ghi chú]         │
│ [✅ SUBMIT TASK]    │
└──────────────────────┘
```

---

## 🔗 Liên quan

- **Employee Overview**: [overview.md](overview.md)
- **Evidence Submission**: [evidence-submission.md](evidence-submission.md)
- **Dashboard**: [dashboard.md](dashboard.md)
- **API Reference**: [api-reference.md](api-reference.md#employee)
