# Employee - Overview

> Vai trò: **Nhân viên**  
> Level: **Cấp 3 (Thực thi)**

## 👷 Mô tả vai trò

Nhân viên là người trực tiếp thực hiện công việc, chịu trách nhiệm:
- Nhận task từ Trưởng Chi Nhánh
- Làm việc theo checklist được giao
- **Báo cáo kết quả** bằng ảnh, video, tài liệu
- Xem phản hồi từ TCN
- Làm lại nếu bị yêu cầu

### Chức vụ có quyền Employee:
- Tất cả các chức vụ khác (không phải Admin hoặc Manager)

*Lưu ý: Chức vụ được xác định qua bảng GroupUser trong database.*

---

## 🎯 Quyền hạn

### ✅ Employee có thể:

1. **Task Management**
   - Xem tasks được giao cho mình
   - Xem chi tiết task (checklist, deadline, requirements)
   - Accept task (xác nhận nhận việc)

2. **Work Execution**
   - Update checklist items (tick/untick)
   - Theo dõi completion rate của mình
   - Xem deadline còn bao lâu

3. **Evidence Submission** ⭐
   - Upload ảnh (tối đa 10)
   - Upload video (tối đa 3)
   - Upload documents (tối đa 5)
   - Nhập notes/ghi chú
   - Submit báo cáo khi hoàn thành 100%

4. **Review Feedback**
   - Xem phản hồi từ TCN
   - Xem lý do nếu bị yêu cầu làm lại
   - Làm lại và nộp báo cáo mới

5. **Dashboard**
   - Xem tất cả tasks của mình
   - Filter theo status
   - Thống kê cá nhân

### ❌ Employee KHÔNG thể:

- Tạo task mới
- Giao task cho người khác
- Xem tasks của nhân viên khác
- Duyệt kết quả
- Chỉnh sửa checklist template

---

## 🔄 Workflow chính

```
1. Nhận notification "Task mới từ TCN"
   ↓
2. Vào app → Tab "Tasks của tôi"
   ↓
3. Xem task:
   - Tiêu đề
   - Checklist
   - Deadline
   - Evidence requirements
   ↓
4. Accept task (xác nhận nhận việc)
   ↓
5. Bắt đầu làm việc:
   - Tick checklist items khi làm xong
   - Completion tự động tính: X/Y items
   ↓
6. Khi hoàn thành 100% checklist:
   - Tab "Báo cáo" được enable
   ↓
7. Upload evidence:
   - Chụp ảnh (hoặc chọn từ thư viện)
   - Quay video (hoặc chọn từ thư viện)
   - Upload documents (optional)
   - Nhập notes (ghi chú chi tiết)
   ↓
8. Validation:
   - Check min/max ảnh, video
   - Check file size
   - Check notes length
   ↓
9. Click [Hoàn thành & Nộp báo cáo]
   ↓
10. Task status → "submitted"
    → TCN nhận notification "Chờ duyệt"
    ↓
11. Chờ TCN review...
    ↓
12a. [✅ APPROVED]
     - Notification: "Task đã được duyệt"
     - Task status → "approved"
     - Có thể xem comment từ TCN

12b. [❌ REVISION REQUIRED]
     - Notification: "Cần làm lại: [lý do]"
     - Task status → "revision_required"
     - Evidence bị reset
     - Quay lại bước 7 (upload lại evidence)
```

---

## 📊 Dashboard Overview

Employee dashboard hiển thị:

### Stats Cards
- **Assigned Tasks**: 10 (được giao)
- **Completed**: 35 (hoàn thành tổng)
- **Approved**: 30 (đã được duyệt)
- **Revision**: 2 (cần làm lại)

### Task List

**Filter:**
```
[Tất cả] [Đang làm] [Chờ duyệt] [Cần làm lại] [Đã duyệt]
```

**Task Card:**
```
┌─────────────────────────────────────────┐
│ 🔵 Kiểm tra hệ thống điện               │
│ Deadline: 2026-03-20 (còn 2 ngày)       │
│                                          │
│ Checklist: 2/3 ✓ (67%)                  │
│ [██████░░░] 67%                         │
│                                          │
│ Status: Đang làm                         │
│                                          │
│ [Xem chi tiết]                          │
└─────────────────────────────────────────┘
```

**Task Card (Revision Required):**
```
┌─────────────────────────────────────────┐
│ ⚠️ Kiểm tra kho hàng                    │
│ Deadline: 2026-03-19 (còn 1 ngày)       │
│                                          │
│ ❌ Cần làm lại                          │
│ Phản hồi từ TCN:                         │
│ "Ảnh bị mờ, chụp lại rõ hơn. Video      │
│  test cầu dao thiếu."                    │
│                                          │
│ [Làm lại ngay]                          │
└─────────────────────────────────────────┘
```

---

## 🎨 UI Components

### Task Detail Screen

```
┌─────────────────────────────────────────────────┐
│ ← Quay lại          Kiểm tra hệ thống điện     │
├─────────────────────────────────────────────────┤
│                                                  │
│ 📅 Deadline: 2026-03-20 17:00 (còn 2 ngày)     │
│ 👨‍💼 Giao bởi: Chị Lan (TCN)                    │
│ 📊 Status: Đang làm                             │
│                                                  │
│ ┌───────────────────────────────────────────┐  │
│ │ Tabs: [Checklist] [Báo cáo]              │  │
│ └───────────────────────────────────────────┘  │
│                                                  │
│ === TAB: Checklist ===                          │
│                                                  │
│ Tiến độ: 2/3 (67%)                              │
│ [██████░░░] 67%                                 │
│                                                  │
│ ✅ Kiểm tra tủ điện chính                       │
│    Hoàn thành: 2026-03-18 14:10                │
│                                                  │
│ ✅ Kiểm tra dây nối đất                         │
│    Hoàn thành: 2026-03-18 14:20                │
│                                                  │
│ ☐ Test cầu dao                                  │
│    [Đánh dấu hoàn thành]                        │
│                                                  │
│ ⚠️ Hoàn thành TẤT CẢ checklist để nộp báo cáo  │
└─────────────────────────────────────────────────┘
```

### Tab: Báo cáo (Evidence)

**Khi chưa hoàn thành checklist:**
```
🔒 Tab này sẽ mở khi bạn hoàn thành tất cả checklist
```

**Khi đã hoàn thành 100%:**
```
┌─────────────────────────────────────────────────┐
│ 📷 Ảnh (1-10 ảnh, bắt buộc)                     │
│                                                  │
│ [+ Chụp ảnh] [+ Chọn từ thư viện]              │
│                                                  │
│ ┌─────────┬─────────┬─────────┐               │
│ │ [🖼️ #1] │ [🖼️ #2] │ [🖼️ #3] │              │
│ │ [X]     │ [X]     │ [X]     │ ← Xóa       │
│ └─────────┴─────────┴─────────┘               │
│                                                  │
│ 🎥 Video (0-3 video, không bắt buộc)            │
│                                                  │
│ [+ Quay video] [+ Chọn từ thư viện]            │
│                                                  │
│ ┌─────────────────────────────────────┐        │
│ │ [▶️] video_20260318.mp4             │        │
│ │ 00:45 | 12.4 MB [X]                 │        │
│ └─────────────────────────────────────┘        │
│                                                  │
│ 📄 Documents (0-5 files, không bắt buộc)        │
│                                                  │
│ [+ Upload file]                                 │
│                                                  │
│ 📝 Ghi chú (bắt buộc, tối thiểu 20 ký tự)       │
│                                                  │
│ [____________________________________________]  │
│ [____________________________________________]  │
│ [____________________________________________]  │
│                                                  │
│ Character count: 0/20                            │
│                                                  │
│ ┌─────────────────────────────────────┐        │
│ │ [Hoàn thành & Nộp báo cáo]          │        │
│ └─────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

---

## 🔗 Liên quan

- **API Reference**: [api-reference.md](api-reference.md)
- **Task Completion**: [task-completion.md](task-completion.md)
- **Evidence Submission**: [evidence-submission.md](evidence-submission.md) ⭐
- **Dashboard**: [dashboard.md](dashboard.md)
