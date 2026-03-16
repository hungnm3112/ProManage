# Store Manager - Overview

> Vai trò: **Trưởng Chi Nhánh**  
> Level: **Cấp 2 (Trung gian)**

## 👨‍💼 Mô tả vai trò

Trưởng Chi Nhánh (TCN) là cầu nối giữa Admin và Nhân viên, chịu trách nhiệm:
- Nhận task từ Admin (thông qua broadcast)
- Giao việc cho nhân viên trong cửa hàng
- **Duyệt hoặc yêu cầu làm lại** kết quả công việc của nhân viên
- Theo dõi tiến độ cửa hàng mình quản lý
- Báo cáo lên Admin về tình hình thực hiện

### Chức vụ có quyền Manager:
- **Giám đốc chi nhánh**

*Lưu ý: Chức vụ được xác định qua bảng GroupUser trong database.*

---

## 🎯 Quyền hạn

### ✅ Store Manager có thể:

1. **Task Management**
   - Xem tất cả tasks được giao cho cửa hàng mình
   - Accept/Reject task từ Admin (nếu không khả thi)
   - Giao việc cho nhân viên trong cửa hàng
   - Xem tiến độ tất cả nhân viên

2. **Employee Assignment**
   - Chọn nhân viên phù hợp cho từng task
   - Chia checklist items cho từng người (nếu cần)
   - Reassign task nếu nhân viên nghỉ việc/bận

3. **⭐ Review & Approval (KEY FEATURE)**
   - Xem báo cáo của nhân viên (ảnh, video, file)
   - **Duyệt** kết quả nếu đạt yêu cầu
   - **Yêu cầu làm lại** với comment cụ thể
   - Xem lịch sử revision

4. **Dashboard & Reports**
   - Xem dashboard cửa hàng
   - Thống kê nhân viên (ai làm nhiều nhất, ai chậm deadline)
   - Export báo cáo cửa hàng (future)

5. **Employee Management (Limited)**
   - Xem danh sách nhân viên của cửa hàng
   - KHÔNG thể thêm/xóa nhân viên (quyền của Admin)

### ❌ Store Manager KHÔNG thể:

- Tạo broadcast (chỉ Admin)
- Duyệt kết quả của nhân viên cửa hàng khác
- Chỉnh sửa checklist template từ Admin
- Xem task của cửa hàng khác

---

## 🔄 Workflow chính

```
1. Nhận notification "Task mới từ Admin"
   ↓
2. Xem chi tiết task:
   - Tiêu đề, mô tả
   - Checklist template
   - Deadline
   - Evidence requirements
   ↓
3. Quyết định:
   [Accept] → Tiếp tục
   [Reject] → Gửi lý do lên Admin (future feature)
   ↓
4. Chọn nhân viên:
   - Chọn từ danh sách nhân viên cửa hàng
   - Có thể chia checklist cho từng người
   ↓
5. Giao việc → Nhân viên nhận notification
   ↓
6. Theo dõi tiến độ:
   - Dashboard realtime
   - X/Y nhân viên hoàn thành
   ↓
7. **Nhân viên nộp báo cáo** → Notification "Chờ duyệt"
   ↓
8. Xem evidence:
   - Ảnh, video, documents
   - Notes từ nhân viên
   ↓
9. Quyết định:
   [✅ Duyệt] → Task completed
   [❌ Làm lại] → Nhân viên nhận notification + comment
   ↓
10. Nếu TẤT CẢ nhân viên approved:
    → Store task completed
    → Admin nhận notification
```

---

## 📊 Dashboard Overview

Manager dashboard hiển thị:

### Stats Cards
- **Pending Tasks**: 3 (chưa nhận)
- **In Progress**: 8 (đang làm)
- **Completed**: 45 (hoàn thành tuần này)
- **Pending Reviews**: 5 (chờ duyệt) ⭐

### Tabs
1. **Chưa nhận** (3)
   - Tasks mới từ Admin
   - Chưa accept

2. **Đang làm** (8)
   - Tasks đã giao cho nhân viên
   - Tiến độ X/Y nhân viên

3. **⭐ Chờ duyệt** (5) - TAB QUAN TRỌNG NHẤT
   - Nhân viên đã nộp báo cáo
   - Cần review và approve/reject

4. **Hoàn thành** (45)
   - Tasks đã completed
   - Lịch sử

### Employee Stats
```
┌──────────────┬──────────┬────────────┬─────────┐
│ Nhân viên    │ Assigned │ Completed  │ Pending │
├──────────────┼──────────┼────────────┼─────────┤
│ Anh B        │ 10       │ 8 (80%)   │ 2       │
│ Chị C        │ 12       │ 10 (83%)  │ 2       │
│ Anh D        │ 8        │ 5 (63%)   │ 3       │
└──────────────┴──────────┴────────────┴─────────┘
```

---

## 🎨 UI Components

### Task Card (Pending)
```
┌─────────────────────────────────────────┐
│ ⚪ Kiểm tra hệ thống điện               │
│ Từ: Admin                                │
│ Deadline: 2026-03-20 (còn 4 ngày)       │
│                                          │
│ Checklist: 3 items                       │
│ Evidence: Ảnh (1-10), Video (0-3)       │
│                                          │
│ [Accept] [Từ chối]                      │
└─────────────────────────────────────────┘
```

### Task Card (In Progress)
```
┌─────────────────────────────────────────┐
│ 🔵 Kiểm tra hệ thống điện               │
│ Deadline: 2026-03-20 (còn 4 ngày)       │
│                                          │
│ Progress: 6/10 nhân viên (60%)          │
│ [██████░░░░] 60%                        │
│                                          │
│ ✅ Completed: 6                         │
│ 🔵 Working: 3                           │
│ ⚪ Not started: 1                       │
│                                          │
│ [Xem chi tiết]                          │
└─────────────────────────────────────────┘
```

### Review Card (Pending Review) ⭐
```
┌─────────────────────────────────────────┐
│ 👨 Anh Bình                             │
│ Nộp báo cáo: 2026-03-18 14:30          │
│                                          │
│ Tabs: [Checklist] [Báo cáo]            │
│                                          │
│ === Báo cáo ===                         │
│ 📷 Ảnh (3):                             │
│ [🖼️] [🖼️] [🖼️] ← Click để phóng to  │
│                                          │
│ 🎥 Video (1):                           │
│ [▶️ video_20260318.mp4]                │
│                                          │
│ 📝 Ghi chú:                             │
│ "Đã kiểm tra tất cả, mọi thứ hoạt động │
│  bình thường. Tủ điện đã được vệ sinh." │
│                                          │
│ [✅ Duyệt] [❌ Làm lại]                │
└─────────────────────────────────────────┘
```

---

## 🔗 Liên quan

- **API Reference**: [api-reference.md](api-reference.md)
- **Task Assignment**: [task-assignment.md](task-assignment.md)
- **Employee Review**: [employee-review.md](employee-review.md) ⭐
- **Dashboard**: [dashboard.md](dashboard.md)
