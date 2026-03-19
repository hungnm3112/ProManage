# Store Manager - Employee Review ⭐

> **KEY FEATURE**: Duyệt hoặc yêu cầu làm lại kết quả công việc của nhân viên

## 🎯 Tổng quan

Đây là tính năng **QUAN TRỌNG NHẤT** của vai trò Trưởng Chi Nhánh. Sau khi nhân viên hoàn thành công việc và nộp báo cáo (evidence), TCN phải:
- **Review** evidence (ảnh, video, documents)
- **Approve** nếu đạt yêu cầu
- **Request Revision** nếu cần làm lại

---

## 🔄 Workflow

```
1. Nhân viên hoàn thành checklist (100%)
   ↓
2. Nhân viên upload evidence:
   - Ảnh (3 files)
   - Video (1 file)
   - Notes: "Đã kiểm tra xong..."
   ↓
3. Nhân viên click [Hoàn thành & Nộp báo cáo]
   ↓
4. Hệ thống:
   - Update user_task.status → "submitted"
   - Update user_task.submittedAt → now()
   - Send notification cho TCN: "NV X đã nộp báo cáo"
   ↓
5. TCN vào tab "Chờ duyệt" → Thấy task mới
   ↓
6. TCN click task → Xem evidence screen
   ↓
7. TCN review evidence:
   - Xem từng ảnh (zoom, rotate)
   - Xem video
   - Đọc notes
   ↓
8a. [✅ APPROVE PATH]
    TCN click [Duyệt]
    ├─ Nhập comment (optional): "Làm tốt lắm!"
    ├─ Confirm
    └─ Hệ thống:
        ├─ user_task.status → "approved"
        ├─ user_task.approvedAt → now()
        ├─ Notification cho NV: "Task đã được duyệt"
        ├─ Update store_task.employeesApproved += 1
        └─ Nếu TẤT CẢ NV approved:
            ├─ store_task.status → "completed"
            └─ Notification cho Admin: "CH-A hoàn thành"

8b. [❌ REVISION PATH]
    TCN click [Làm lại]
    ├─ REQUIRED nhập comment: "Ảnh bị mờ, chụp lại"
    ├─ Confirm
    └─ Hệ thống:
        ├─ Lưu revision history (evidence + review cũ)
        ├─ user_task.status → "revision_required"
        ├─ user_task.review → { status: "rejected", comment, reviewedAt }
        ├─ Reset evidence: { photos: [], videos: [], notes: "" }
        ├─ Notification cho NV: "Cần làm lại: Ảnh bị mờ..."
        └─ NV quay lại làm từ bước 2
```

---

## 📱 UI Screen: Review Evidence

### Layout

```
┌─────────────────────────────────────────────────┐
│ ← Quay lại          Duyệt kết quả               │
├─────────────────────────────────────────────────┤
│                                                  │
│ 👨 Nhân viên: Anh Bình                          │
│ 📅 Nộp báo cáo: 2026-03-18 14:30               │
│ ⏰ Task: Kiểm tra hệ thống điện                 │
│                                                  │
│ ┌───────────────────────────────────────────┐  │
│ │ Tabs: [Checklist] [Báo cáo]              │  │
│ └───────────────────────────────────────────┘  │
│                                                  │
│ === TAB: Báo cáo ===                            │
│                                                  │
│ 📷 Ảnh (3/10):                                  │
│ ┌─────────┬─────────┬─────────┐               │
│ │ [🖼️ #1] │ [🖼️ #2] │ [🖼️ #3] │              │
│ └─────────┴─────────┴─────────┘               │
│ Click để phóng to                               │
│                                                  │
│ 🎥 Video (1/3):                                 │
│ ┌─────────────────────────────────────┐        │
│ │ [▶️] video_20260318_143025.mp4      │        │
│ │ Duration: 00:45                      │        │
│ │ Size: 12.4 MB                        │        │
│ └─────────────────────────────────────┘        │
│                                                  │
│ 📄 Documents (0):                               │
│ (Không bắt buộc)                                │
│                                                  │
│ 📝 Ghi chú:                                     │
│ ┌─────────────────────────────────────┐        │
│ │ Đã kiểm tra tất cả các hạng mục:    │        │
│ │ - Tủ điện chính: OK                 │        │
│ │ - Dây nối đất: OK                   │        │
│ │ - Cầu dao: OK                       │        │
│ │ Mọi thứ hoạt động bình thường.      │        │
│ └─────────────────────────────────────┘        │
│                                                  │
│ ┌─────────────────────────────────────┐        │
│ │ [✅ Duyệt]  [❌ Yêu cầu làm lại]    │        │
│ └─────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

### Tab: Checklist

Hiển thị checklist đã hoàn thành:
```
✅ Kiểm tra tủ điện chính
   Hoàn thành: 2026-03-18 14:10

✅ Kiểm tra dây nối đất
   Hoàn thành: 2026-03-18 14:20

✅ Test cầu dao
   Hoàn thành: 2026-03-18 14:25

Completion: 100% (3/3 items)
```

---

## ✅ Approve Flow

### Click [Duyệt]

**Popup xác nhận:**
```
┌─────────────────────────────────────┐
│ Xác nhận duyệt kết quả              │
├─────────────────────────────────────┤
│                                      │
│ Nhân viên: Anh Bình                 │
│ Task: Kiểm tra hệ thống điện        │
│                                      │
│ Comment (optional):                  │
│ [____________________________]      │
│ VD: "Làm tốt lắm!", "OK"            │
│                                      │
│ [Hủy]          [Xác nhận duyệt]    │
└─────────────────────────────────────┘
```

### API Call

```javascript
POST /api/user-tasks/:userTaskId/approve

Body: {
  comment: "Làm tốt lắm!"
}

Response: {
  success: true,
  userTask: {
    _id: "...",
    status: "approved",
    approvedAt: "2026-03-18T15:00:00Z",
    review: {
      status: "approved",
      reviewedBy: "manager_001",
      reviewedAt: "2026-03-18T15:00:00Z",
      comment: "Làm tốt lắm!"
    }
  },
  storeTask: {
    employeesApproved: 7,
    totalEmployees: 10,
    overallProgress: 70
  }
}
```

### Hệ thống xử lý

```javascript
// 1. Update user_task
userTask.status = 'approved';
userTask.approvedAt = new Date();
userTask.review = {
  status: 'approved',
  reviewedBy: managerId,
  reviewedAt: new Date(),
  comment: comment || 'Đã duyệt'
};

// 2. Update store_task
storeTask.employeesApproved += 1;
storeTask.overallProgress = (employeesApproved / totalEmployees) * 100;

// 3. Check: TẤT CẢ nhân viên approved?
if (employeesApproved === totalEmployees) {
  storeTask.managerStatus = 'completed';
  storeTask.completedAt = new Date();
  
  // 4. Update broadcast
  broadcast.completedStores += 1;
  
  // 5. Notification cho Admin
  createNotification({
    userId: broadcast.createdBy,
    type: 'store_completed',
    title: 'Cửa hàng hoàn thành task',
    message: `${storeName} đã hoàn thành: ${broadcast.title}`
  });
}

// 6. Notification cho nhân viên
createNotification({
  userId: userTask.userId,
  type: 'task_approved',
  title: 'Task đã được duyệt',
  message: comment || 'Công việc của bạn đã được duyệt'
});
```

---

## ❌ Request Revision Flow

### Click [Yêu cầu làm lại]

**Popup:**
```
┌─────────────────────────────────────┐
│ Yêu cầu nhân viên làm lại            │
├─────────────────────────────────────┤
│                                      │
│ Nhân viên: Anh Bình                 │
│ Task: Kiểm tra hệ thống điện        │
│                                      │
│ ⚠️ Lý do (REQUIRED):                │
│ [____________________________]      │
│ [____________________________]      │
│                                      │
│ VD:                                  │
│ - "Ảnh bị mờ, chụp lại rõ hơn"      │
│ - "Thiếu video test cầu dao"        │
│ - "Notes chưa đủ chi tiết"          │
│                                      │
│ [Hủy]          [Xác nhận]           │
└─────────────────────────────────────┘
```

**Validation:**
- Comment REQUIRED (không được để trống)
- Min length: 10 ký tự

### API Call

```javascript
POST /api/user-tasks/:userTaskId/request-revision

Body: {
  comment: "Ảnh bị mờ, chụp lại rõ hơn. Video test cầu dao thiếu."
}

Response: {
  success: true,
  userTask: {
    status: "revision_required",
    review: {
      status: "rejected",
      reviewedBy: "manager_001",
      reviewedAt: "2026-03-18T15:10:00Z",
      comment: "Ảnh bị mờ..."
    },
    revisions: [
      {
        submittedAt: "2026-03-18T14:30:00Z",
        evidence: { photos: [...], videos: [...] },
        review: { status: "rejected", comment: "..." }
      }
    ]
  }
}
```

### Hệ thống xử lý

```javascript
// 1. Lưu revision history
if (!userTask.revisions) userTask.revisions = [];
userTask.revisions.push({
  submittedAt: userTask.submittedAt,
  evidence: userTask.evidence,
  review: {
    status: 'rejected',
    reviewedBy: managerId,
    reviewedAt: new Date(),
    comment: comment
  }
});

// 2. Update user_task status
userTask.status = 'revision_required';
userTask.review = {
  status: 'rejected',
  reviewedBy: managerId,
  reviewedAt: new Date(),
  comment: comment
};

// 3. Reset evidence (để NV upload lại)
userTask.submittedAt = null;
userTask.evidence = {
  photos: [],
  videos: [],
  documents: [],
  notes: ''
};

// 4. Update store_task (giảm employeesCompleted)
if (storeTask.employeesCompleted > 0) {
  storeTask.employeesCompleted -= 1;
}

// 5. Notification cho nhân viên
createNotification({
  userId: userTask.userId,
  type: 'task_revision_required',
  title: 'Cần làm lại task',
  message: `Lý do: ${comment}`
});
```

### Nhân viên nhận notification

```
┌─────────────────────────────────────┐
│ 🔔 Thông báo mới                    │
├─────────────────────────────────────┤
│ ❌ Cần làm lại task                 │
│                                      │
│ Task: Kiểm tra hệ thống điện        │
│                                      │
│ Phản hồi từ TCN:                    │
│ "Ảnh bị mờ, chụp lại rõ hơn.        │
│  Video test cầu dao thiếu."         │
│                                      │
│ [Xem task]                          │
└─────────────────────────────────────┘
```

Nhân viên quay lại task → Làm lại → Nộp báo cáo mới

---

## 📊 Revision History

### UI hiển thị lần làm lại

Khi nhân viên đã làm lại 1-2 lần, TCN xem được lịch sử:

```
┌─────────────────────────────────────────┐
│ 📜 Lịch sử làm lại (2 lần)              │
├─────────────────────────────────────────┤
│                                          │
│ Lần 2: 2026-03-18 16:00 (Hiện tại)     │
│ Status: Chờ duyệt                       │
│ Evidence: 4 ảnh, 1 video                │
│                                          │
│ Lần 1: 2026-03-18 14:30                │
│ ❌ Rejected by: Chị Lan                 │
│ Comment: "Ảnh bị mờ, chụp lại..."       │
│ Evidence: 3 ảnh, 1 video                │
│ [Xem evidence cũ]                       │
│                                          │
│ Lần 0: (Original submission)            │
│ ❌ Rejected by: Chị Lan                 │
│ Comment: "Video test cầu dao thiếu"     │
│ Evidence: 3 ảnh, 0 video                │
│ [Xem evidence cũ]                       │
└─────────────────────────────────────────┘
```

---

## 🎨 Additional UI Features

### Batch Review (Future)

Cho phép TCN duyệt nhiều tasks cùng lúc:

```
☑ Anh B - Kiểm tra điện [3 ảnh, 1 video]
☑ Chị C - Kiểm tra điện [4 ảnh, 1 video]
☐ Anh D - Kiểm tra điện [2 ảnh, 0 video] ⚠️ Thiếu video

[Duyệt tất cả đã chọn (2)]
```

### Quick Comments

Gợi ý comment nhanh:
```
[Làm tốt!] [OK] [Hoàn hảo]
[Ảnh mờ] [Thiếu video] [Notes chưa đủ]
```

---

## 🔗 Liên quan

- **API Reference**: [api-reference.md](api-reference.md#review)
- **Task Assignment**: [task-assignment.md](task-assignment.md)
- **Business Logic**: [../technical/business-logic.md](../technical/business-logic.md#review)
- **Employee Evidence Submission**: [../employee/evidence-submission.md](../employee/evidence-submission.md)
