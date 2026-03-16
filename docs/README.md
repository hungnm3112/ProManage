# WorkFlow 32 - Documentation

> **Version**: v3.0  
> **Architecture**: Hierarchical Broadcast System (3-Tier)  
> **Scale**: 32 stores, 300+ employees

## 📚 Cấu trúc Documentation

Documentation được tổ chức theo **vai trò người dùng** để dễ dàng tra cứu khi nhận phản hồi từ khách hàng.

---

## 👥 Theo vai trò

### 🔴 [Admin (Quản trị viên)](admin/)
Quản lý toàn hệ thống, phát sóng task, theo dõi tổng thể.

- **[Overview](admin/overview.md)** - Vai trò và quyền hạn
- **[Broadcast Management](admin/broadcast-management.md)** - Tạo và phát sóng task
- **[Store Management](admin/store-management.md)** - Quản lý cửa hàng, nhân viên
- **[Analytics](admin/analytics.md)** - Dashboard và báo cáo
- **[API Reference](admin/api-reference.md)** - API endpoints cho Admin

### 🟡 [Store Manager (Trưởng Chi Nhánh)](manager/)
Nhận task từ Admin, giao việc cho nhân viên, duyệt kết quả.

- **[Overview](manager/overview.md)** - Vai trò và quyền hạn
- **[Task Assignment](manager/task-assignment.md)** - Nhận và giao việc
- **[Employee Review ⭐](manager/employee-review.md)** - Duyệt kết quả nhân viên (KEY FEATURE)
- **[Dashboard](manager/dashboard.md)** - Giao diện quản lý
- **[API Reference](manager/api-reference.md)** - API endpoints cho Manager

### 🟢 [Employee (Nhân viên)](employee/)
Nhận task từ TCN, làm việc, báo cáo kết quả.

- **[Overview](employee/overview.md)** - Vai trò và quyền hạn
- **[Task Completion](employee/task-completion.md)** - Làm việc theo checklist
- **[Evidence Submission](employee/evidence-submission.md)** - Nộp báo cáo (ảnh, video, file)
- **[Dashboard](employee/dashboard.md)** - Giao diện làm việc
- **[API Reference](employee/api-reference.md)** - API endpoints cho Employee

---

## 🔧 Technical Documentation

### [Technical](technical/)
Tài liệu kỹ thuật cho Developer.

- **[Architecture](technical/architecture.md)** - Kiến trúc 3-tier, tech stack
- **[Database Schema](technical/database-schema.md)** - MongoDB collections và schemas
- **[Business Logic](technical/business-logic.md)** - Core functions và workflows
- **[Security](technical/security.md)** - Authentication, middleware, permissions
- **[Deployment](technical/deployment.md)** - Setup hướng dẫn, roadmap

---

## 🚀 Quick Start

**Workflow tổng quan:**
```
Admin → Phát sóng task → Nhiều cửa hàng
   ↓
Store Manager → Nhận task → Giao cho nhân viên
   ↓
Employee → Làm việc → Nộp báo cáo (ảnh, video)
   ↓
Store Manager → Duyệt/Yêu cầu làm lại
   ↓
Admin → Theo dõi tiến độ tổng thể
```

**Tech Stack:**
- Backend: Node.js + Express.js
- Database: MongoDB (Mongoose)
- Auth: JWT + bcrypt
- File Upload: Multer
- Real-time: Socket.io

---

## 📖 Cách sử dụng Documentation

### Khi nhận phản hồi từ khách hàng:

**Ví dụ 1**: "Admin không thấy được tiến độ cửa hàng A"
→ Đọc: [admin/analytics.md](admin/analytics.md) + [admin/api-reference.md](admin/api-reference.md)

**Ví dụ 2**: "Trưởng chi nhánh muốn có thể từ chối task từ Admin"
→ Đọc: [manager/task-assignment.md](manager/task-assignment.md)

**Ví dụ 3**: "Nhân viên upload ảnh bị lỗi"
→ Đọc: [employee/evidence-submission.md](employee/evidence-submission.md) + [technical/security.md](technical/security.md)

**Ví dụ 4**: "Cần thêm tính năng gửi thông báo realtime"
→ Đọc: [technical/architecture.md](technical/architecture.md) + [technical/deployment.md](technical/deployment.md)

---

## 🔄 Version History

- **v3.0** (Current) - Hierarchical Broadcast System with Manager Approval
- **v2.8** - Multi-user Progress Tracking (Peer-to-peer)
- **v2.0-2.7** - Core Features

---

**Last Updated**: March 16, 2026
