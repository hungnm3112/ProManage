# ProManage - Project Management System

Project Management System được xây dựng với Node.js theo mô hình MVC.

## 🚀 Tính năng

- ✅ Quản lý dự án và nhiệm vụ
- ✅ Xác thực và phân quyền người dùng
- ✅ RESTful API
- ✅ Upload files
- ✅ Validation dữ liệu
- ✅ Error handling
- ✅ Logging

## 📋 Yêu cầu hệ thống

- Node.js >= 18.0.0
- MongoDB >= 5.0
- npm >= 9.0.0

## 🛠️ Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd ProManage
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Cấu hình môi trường:
```bash
cp .env.example .env
```
Chỉnh sửa file `.env` với thông tin cấu hình của bạn.

4. Khởi động server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📁 Cấu trúc dự án

```
ProManage/
├── src/
│   ├── config/          # Cấu hình
│   ├── models/          # Database models
│   ├── views/           # View templates
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── middlewares/     # Middleware functions
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── validators/      # Input validation
├── public/              # Static files
├── tests/               # Test files
└── logs/                # Log files
```

## 🔧 Scripts

- `npm start` - Khởi động server (production)
- `npm run dev` - Khởi động server (development với nodemon - auto restart khi code thay đổi)
- `npm test` - Chạy tests
- `npm run test:watch` - Chạy tests ở chế độ watch

### Development với Nodemon

Server sẽ tự động restart khi:
- File `.js` hoặc `.json` thay đổi
- Các thư mục: `routes/`, `controllers/`, `models/`, `middleware/`, `config/`, `services/`

Để restart thủ công, gõ `rs` trong terminal đang chạy nodemon.

**Cấu hình:** Xem file `nodemon.json` để tùy chỉnh.

---

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất

### Users
- `GET /api/users` - Lấy danh sách users
- `GET /api/users/:id` - Lấy thông tin user
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user

### Projects
- `GET /api/projects` - Lấy danh sách projects
- `POST /api/projects` - Tạo project mới
- `GET /api/projects/:id` - Lấy chi tiết project
- `PUT /api/projects/:id` - Cập nhật project
- `DELETE /api/projects/:id` - Xóa project

### Tasks
- `GET /api/tasks` - Lấy danh sách tasks
- `POST /api/tasks` - Tạo task mới
- `GET /api/tasks/:id` - Lấy chi tiết task
- `PUT /api/tasks/:id` - Cập nhật task
- `DELETE /api/tasks/:id` - Xóa task

## 🤝 Contributing

Contributions, issues và feature requests đều được chào đón!

## 📄 License

[MIT](LICENSE)
