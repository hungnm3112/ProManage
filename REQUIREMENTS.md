# WorkFlow 32 - Documentation Index

> **Version**: v3.0  
> **Architecture**: Hierarchical Broadcast System (3-Tier)  
> **Scale**: 32 stores, 300+ employees

## 📚 Documentation được tổ chức theo vai trò người dùng

Documentation này được thiết kế để dễ dàng tra cứu khi nhận phản hồi từ khách hàng. Mỗi vai trò có thư mục riêng với tài liệu chi tiết.

**👉 Xem [docs/README.md](docs/README.md) để bắt đầu**

---

## 🚀 Quick Start

### Workflow tổng quan:
```
Admin → Phát sóng task → Nhiều cửa hàng
   ↓
Store Manager → Nhận task → Giao cho nhân viên
   ↓
Employee → Làm việc → Nộp báo cáo (ảnh, video)
   ↓
Store Manager → Duyệt/Yêu cầu làm lại ⭐
   ↓
Admin → Theo dõi tiến độ tổng thể
```

### Tech Stack:
- Backend: Node.js + Express.js
- Database: MongoDB (Mongoose)
- Auth: JWT + bcrypt
- File Upload: Multer
- Real-time: Socket.io

---

## 👥 Documentation theo vai trò

### 🔴 [Admin (Quản trị viên)](docs/admin/)
Quản lý toàn hệ thống, phát sóng task, theo dõi tổng thể.

- [Overview](docs/admin/overview.md) - Vai trò và quyền hạn
- [Broadcast Management](docs/admin/broadcast-management.md) - Tạo và phát sóng task ⭐
- [Store Management](docs/admin/store-management.md) - Quản lý cửa hàng
- [Analytics](docs/admin/analytics.md) - Dashboard và báo cáo
- [API Reference](docs/admin/api-reference.md) - API endpoints

### 🟡 [Store Manager (Trưởng Chi Nhánh)](docs/manager/)
Nhận task từ Admin, giao việc cho nhân viên, duyệt kết quả.

- [Overview](docs/manager/overview.md) - Vai trò và quyền hạn
- [Task Assignment](docs/manager/task-assignment.md) - Nhận và giao việc
- [Employee Review](docs/manager/employee-review.md) - Duyệt kết quả nhân viên ⭐⭐
- [Dashboard](docs/manager/dashboard.md) - Giao diện quản lý
- [API Reference](docs/manager/api-reference.md) - API endpoints

### 🟢 [Employee (Nhân viên)](docs/employee/)
Nhận task từ TCN, làm việc, báo cáo kết quả.

- [Overview](docs/employee/overview.md) - Vai trò và quyền hạn
- [Task Completion](docs/employee/task-completion.md) - Làm việc theo checklist
- [Evidence Submission](docs/employee/evidence-submission.md) - Nộp báo cáo ⭐
- [Dashboard](docs/employee/dashboard.md) - Giao diện làm việc
- [API Reference](docs/employee/api-reference.md) - API endpoints

---

## 🔧 Technical Documentation

### [Technical](docs/technical/)
Tài liệu kỹ thuật cho Developer.

- [Architecture](docs/technical/architecture.md) - Kiến trúc 3-tier, tech stack ⭐
- [Database Schema](docs/technical/database-schema.md) - MongoDB collections
- [Business Logic](docs/technical/business-logic.md) - Core functions
- [Security](docs/technical/security.md) - Authentication, middleware
- [Deployment](docs/technical/deployment.md) - Setup và roadmap

---

## 💡 Cách sử dụng Documentation

### Khi nhận phản hồi từ khách hàng:

**Ví dụ 1**: *"Admin không thấy được tiến độ cửa hàng A"*
- → Đọc: [admin/analytics.md](docs/admin/analytics.md)
- → Kiểm tra: [admin/api-reference.md](docs/admin/api-reference.md)

**Ví dụ 2**: *"Trưởng chi nhánh muốn có thể từ chối task từ Admin"*
- → Đọc: [manager/task-assignment.md](docs/manager/task-assignment.md)
- → Feature request: Thêm vào roadmap

**Ví dụ 3**: *"Nhân viên upload ảnh bị lỗi"*
- → Đọc: [employee/evidence-submission.md](docs/employee/evidence-submission.md)
- → Kiểm tra: [technical/security.md](docs/technical/security.md) (Multer config)

**Ví dụ 4**: *"Cần thêm tính năng gửi thông báo realtime"*
- → Đọc: [technical/architecture.md](docs/technical/architecture.md)
