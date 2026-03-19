# Technical - Database Schema

> MongoDB Database Schema cho WorkFlow 32 v3.0

## 📦 Collections Overview

Hệ thống sử dụng 7 collections:

1. **Employee** - Tài khoản người dùng (Admin, Manager, Employee) - **HIỆN TẠI**
2. **Branch** - Cửa hàng (32 chi nhánh) - **HIỆN TẠI** (Model: Brand, Collection: Branch)
3. **GroupUser** - Chức vụ/Phòng ban - **HIỆN TẠI**
4. **broadcasts** - Broadcasts do Admin tạo - **SẼ PHÁT TRIỂN**
5. **store_tasks** - Tasks assigned cho stores - **SẼ PHÁT TRIỂN**
6. **user_tasks** - Tasks assigned cho employees - **SẼ PHÁT TRIỂN**
7. **notifications** - Thông báo - **SẼ PHÁT TRIỂN**

---

## 👥 Employee Collection

**Collection hiện tại** chứa thông tin nhân viên (Admin, Manager, Employee).

```javascript
{
  _id: ObjectId("..."),
  Phone: String,                    // SĐT (dùng để login)
  FullName: String,                 // "Lê Phương Thảo"
  CMND: String,                     // Số CMND/CCCD
  ID_GroupUser: ObjectId,           // Ref to GroupUser (quyết định role)
  Password: String,                 // SHA-512 hashed với Salt
  Salt: String,                     // Salt cho password
  Address: String,                  // Địa chỉ
  Household: String,                // Hộ khẩu
  Level: String,                    // Trình độ học vấn
  TaxCode: String,                  // Mã số thuế
  Salary: String,                   // Lương cơ bản (stored as string)
  ResponsibilityAllowance: String,  // Phụ cấp trách nhiệm
  ExcessAllowance: String,          // Phụ cấp vượt mức
  ID_Branch: ObjectId,              // Ref to Brand (chi nhánh)
  Image: String,                    // URL ảnh đại diện
  DateRange_CMND: String,           // Ngày cấp CMND
  PlaceRange_CMND: String,          // Nơi cấp CMND
  DateOnCompany: String,            // Ngày vào công ty
  Status: String,                   // "Đang làm việc" | "Đã dừng"
  Gender: String,                   // "Nam" | "Nữ"
  Email: String,
  DateBirth: String,                // Ngày sinh
  BankNumber: String,               // Số tài khoản ngân hàng
  HealthInsurance: String,          // Số BHYT
  TimeStartHealthInsurance: String,
  StatusHealthInsurance: String,    // "Đang thực hiện" | ...
  HospitalRegisterHealthInsurance: String,
  PaymentLevelHealthInsurance: String,
  LunchAllowance: String,
  NightAllowance: String,
  NightDutySalary: String,
  NoonDutySalary: String,
  OtherAllowance: String,
  RevenuePercent: String,
  FundBranch: String,
  KPI_Branch: String,
  Coefficient: String,
  WarrantyOfEmployee: String,
  is_timekeeping_all: String,       // "true" | "false"
  HistoryWorkplace: String,         // JSON array stored as string
  HistoryHealthInsurence: String,   // JSON array stored as string
  HistorySalary: String,            // JSON array stored as string
  unsign_search: String,            // Search index (unsigned text)
  __v: String
}
```

### Indexes

```javascript
db.Employee.createIndex({ Phone: 1 }, { unique: true });
db.Employee.createIndex({ ID_GroupUser: 1 });
db.Employee.createIndex({ ID_Branch: 1 });
db.Employee.createIndex({ Status: 1 });
db.Employee.createIndex({ unsign_search: "text" });
```

### Example

```json
{
  "_id": ObjectId("67ebbc259565e3b1adfcd226"),
  "Phone": "0393588269",
  "FullName": "Lê Phương Thảo",
  "CMND": "",
  "ID_GroupUser": ObjectId("6068674daf647e4b14ebd0e4"),
  "Password": "60e19e09aafe50653f66819304b8cb329f427a4f3662f8c8eb5d2128aa075c08c7b480a6cb662fbb094ea119afbab38c8fab324a661884b49beff0971081ac5a",
  "Salt": "18900519",
  "Address": "",
  "Household": "",
  "Level": "Đại học",
  "TaxCode": "",
  "Salary": "0",
  "ResponsibilityAllowance": "0",
  "ExcessAllowance": "0",
  "ID_Branch": ObjectId("614e89ec571b99026b947639"),
  "Image": null,
  "DateRange_CMND": "1999-12-24",
  "PlaceRange_CMND": "Cục trưởng Cục cảnh sát",
  "DateOnCompany": "2025-04-24",
  "Status": "Đã dừng",
  "Gender": "Nam",
  "Email": "",
  "DateBirth": "2003-08-14",
  "BankNumber": "",
  "HealthInsurance": "",
  "is_timekeeping_all": "false",
  "HistoryWorkplace": "[ ]",
  "HistoryHealthInsurence": "[ ]",
  "HistorySalary": "[ ]",
  "unsign_search": "67ebbc259565e3b1adfcd226 Lê Phương Thảo Le Phuong Thao...",
  "__v": "0"
}
```

### ⚠️ Lưu ý quan trọng

- **Password**: Sử dụng SHA-512 + Salt (không phải bcrypt)
- **Boolean values**: Lưu dưới dạng String `"true"`/`"false"` thay vì Boolean
- **Numeric values**: Nhiều fields số lưu dưới dạng String
- **Phone**: Là unique identifier dùng để login (thay vì email)
- **Role**: Xác định qua `ID_GroupUser` (cần tra bảng GroupUser)

---

## 🏪 Branch Collection

**Collection hiện tại** chứa thông tin chi nhánh.

> **Lưu ý**: Model name là `Brand` nhưng MongoDB collection name là `Branch`  
> Trong code: `const Brand = require('./models/Brand')` → Collection: `Branch`

```javascript
{
  _id: ObjectId("..."),
  ID_System: ObjectId,              // System ID (không rõ mục đích)
  Name: String,                     // "Chi nhánh test"
  Map_Address: String,              // Địa chỉ đầy đủ
  Phone: String,                    // SĐT chi nhánh
  Image: String,                    // URL ảnh đại diện
  WifiAddress: String,              // JSON array: [{"ip_wifi": "...", "name_wifi": "..."}]
  Icon: String,                     // URL icon
  HeaderContent: String,            // Tiêu đề hiển thị
  CheckIn: String,                  // Giờ check-in "08:00:20"
  CheckOut: String,                 // Giờ check-out "18:00:00"
  LateIn: String,                   // Phút cho phép đi muộn
  OutOvertime: String,              // Phút tăng ca
  Active: String,                   // "true" | "false"
  Phone_Customer_Support: String,   // SĐT hỗ trợ khách hàng
  Phone_Feedback: String,           // SĐT nhận feedback
  Link_Description: String,         // Link mô tả (nullable)
  Active_Schedule: String,          // "true" | "false"
  PercentPayment: String            // % payment (stored as string)
}
```

### Indexes

```javascript
db.Branch.createIndex({ ID_System: 1 });
db.Branch.createIndex({ Active: 1 });
db.Branch.createIndex({ Name: "text" });
```

### Example

```json
{
  "_id": ObjectId("614bed04d921e2a3d3313f9e"),
  "ID_System": ObjectId("6044b6f839986b33cfc41a54"),
  "Name": "Chi nhánh test",
  "Map_Address": "87 kênh dương lê chân hải phòng",
  "Phone": "012345679",
  "Image": "1632761866743-1632536680518-1.png",
  "WifiAddress": "[ { \"ip_wifi\" : \"24:0b:2a:79:7d:ea\", \"name_wifi\" : \"\" } ]",
  "Icon": "1766823849629-LOGO-suachua3.png",
  "HeaderContent": "Thế giới công nghệ AP24h.test",
  "CheckIn": "08:00:20",
  "CheckOut": "18:00:00",
  "LateIn": "15",
  "OutOvertime": "30",
  "Active": "false",
  "Phone_Customer_Support": "0123456789",
  "Phone_Feedback": "0123456789",
  "Link_Description": null,
  "Active_Schedule": "false",
  "PercentPayment": "0"
}
```

### ⚠️ Lưu ý quan trọng

- **Active**: Lưu dưới dạng String `"true"`/`"false"` thay vì Boolean
- **WifiAddress**: JSON array được lưu dưới dạng String
- **Timing fields**: CheckIn, CheckOut, LateIn, OutOvertime lưu dưới dạng String
- **Không có managerId**: Cần tra ngược từ Employee.ID_Branch

---

## � GroupUser Collection

**Collection hiện tại** chứa thông tin chức vụ/phòng ban.

```javascript
{
  _id: ObjectId("..."),
  Name: String,                     // Tên chức vụ
  Description: String,              // Mô tả chức vụ
  Status: String,                   // "1" = active, "0" = inactive
  ID_GeneralGroupUser: ObjectId     // Reference (không rõ mục đích)
}
```

### Indexes

```javascript
db.GroupUser.createIndex({ Name: 1 });
db.GroupUser.createIndex({ Status: 1 });
db.GroupUser.createIndex({ Name: "text" });
```

### Example

```json
{
  "_id": ObjectId("60501866133af547e8009aea"),
  "Name": "Tổng giám đốc",
  "Description": "Quản lí cấp cao nhất của hệ thống",
  "Status": "1",
  "ID_GeneralGroupUser": ObjectId("60de6ed6b7f4ec66b778fb05")
}
```

### Role Mapping

**Admin roles** (các chức vụ có quyền admin):
- Tổng giám đốc
- Kho tổng
- Phó tổng giám đốc
- Giám đốc khu vực
- Phó giám đốc

**Manager role**:
- Giám đốc chi nhánh

**Employee role**:
- Tất cả các chức vụ khác

### ⚠️ Lưu ý quan trọng

- **Status**: Lưu dưới dạng String `"1"` (active) hoặc `"0"` (inactive)
- **Role determination**: Phải check `GroupUser.Name` để xác định role (admin/manager/employee)
- **Employee.ID_GroupUser**: Reference đến collection này để xác định chức vụ

---

## �📢 broadcasts Collection

**Collection mới** (sẽ phát triển) cho broadcast management.

```javascript
{
  _id: ObjectId("..."),
  title: String,
  description: String,
  priority: String,       // "low" | "medium" | "high" | "urgent"
  deadline: Date,
  assignedStores: [ObjectId],  // Refs to Brand (chi nhánh)
  checklist: [
    {
      task: String,
      note: String,
      required: Boolean
    }
  ],
  attachments: [
    {
      _id: ObjectId,
      filename: String,
      url: String,
      size: Number,
      mimeType: String
    }
  ],
  recurring: {
    enabled: Boolean,
    frequency: String,    // "daily" | "weekly" | "monthly"
    dayOfWeek: Number,    // 0-6 (Sunday-Saturday)
    dayOfMonth: Number    // 1-31
  },
  status: String,         // "draft" | "active" | "completed" | "archived"
  createdBy: ObjectId,    // Ref to Employee (admin)
  createdAt: Date,
  publishedAt: Date,
  completedAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
db.broadcasts.createIndex({ status: 1, deadline: 1 });
db.broadcasts.createIndex({ createdBy: 1 });
db.broadcasts.createIndex({ assignedStores: 1 });
db.broadcasts.createIndex({ priority: 1 });
```

### Example

```json
{
  "_id": ObjectId("60f1234567890abcdef11111"),
  "title": "Kiểm tra hệ thống điện",
  "description": "Kiểm tra toàn bộ hệ thống điện trong cửa hàng",
  "priority": "urgent",
  "deadline": ISODate("2026-03-20T23:59:59Z"),
  "assignedStores": [
    ObjectId("60f1234567890abcdef99999"),
    ObjectId("60f1234567890abcdef99998")
  ],
  "checklist": [
    {
      "task": "Kiểm tra bảng điện chính",
      "note": "Chụp 2 ảnh: tổng thể + chi tiết",
      "required": true
    },
    {
      "task": "Kiểm tra ổ cắm",
      "note": "Chụp 1 ảnh mỗi khu vực",
      "required": true
    }
  ],
  "attachments": [
    {
      "_id": ObjectId("60f1234567890abcdef22222"),
      "filename": "huong_dan.pdf",
      "url": "/uploads/files/file_001.pdf",
      "size": 1024000,
      "mimeType": "application/pdf"
    }
  ],
  "recurring": {
    "enabled": true,
    "frequency": "weekly",
    "dayOfWeek": 1
  },
  "status": "active",
  "createdBy": ObjectId("60f1234567890abcdef00000"),
  "createdAt": ISODate("2026-03-15T09:00:00Z"),
  "publishedAt": ISODate("2026-03-15T09:05:00Z"),
  "updatedAt": ISODate("2026-03-15T09:05:00Z")
}
```

---

## 🏪 store_tasks Collection

**Collection mới** (sẽ phát triển) = Broadcasts assigned to chi nhánh.

```javascript
{
  _id: ObjectId("..."),
  broadcastId: ObjectId,  // Ref to broadcasts
  storeId: ObjectId,      // Ref to Brand (chi nhánh)
  status: String,         // "pending" | "accepted" | "rejected" | "assigned" | "completed"
  acceptedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  rejectionNote: String,
  assignedEmployees: [ObjectId],  // Refs to Employee
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
db.store_tasks.createIndex({ broadcastId: 1, storeId: 1 }, { unique: true });
db.store_tasks.createIndex({ storeId: 1, status: 1 });
db.store_tasks.createIndex({ status: 1 });
```

### Example

```json
{
  "_id": ObjectId("60f1234567890abcdef33333"),
  "broadcastId": ObjectId("60f1234567890abcdef11111"),
  "storeId": ObjectId("60f1234567890abcdef99999"),
  "status": "assigned",
  "acceptedAt": ISODate("2026-03-15T10:00:00Z"),
  "assignedEmployees": [
    ObjectId("60f1234567890abcdef55555"),
    ObjectId("60f1234567890abcdef55556")
  ],
  "createdAt": ISODate("2026-03-15T09:05:00Z"),
  "updatedAt": ISODate("2026-03-15T10:30:00Z")
}
```

---

## 👤 user_tasks Collection

**Collection mới** (sẽ phát triển) = Tasks assigned to nhân viên.

```javascript
{
  _id: ObjectId("..."),
  storeTaskId: ObjectId,  // Ref to store_tasks
  employeeId: ObjectId,   // Ref to Employee
  broadcastId: ObjectId,  // Ref to broadcasts (denormalized for faster query)
  status: String,         // "pending" | "in_progress" | "completed" | "approved" | "rejected"
  checklist: [
    {
      _id: ObjectId,
      task: String,
      note: String,
      required: Boolean,
      isCompleted: Boolean,
      evidence: {
        photos: [
          {
            _id: ObjectId,
            url: String,
            thumbnailUrl: String,
            uploadedAt: Date,
            size: Number
          }
        ],
        videos: [
          {
            _id: ObjectId,
            url: String,
            thumbnailUrl: String,
            duration: Number,
            uploadedAt: Date,
            size: Number
          }
        ],
        note: String
      }
    }
  ],
  overallNote: String,
  completedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  managerFeedback: String,
  rating: Number,         // 1-5 stars
  revisionHistory: [
    {
      version: Number,
      rejectedAt: Date,
      reason: String,
      resubmittedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
db.user_tasks.createIndex({ employeeId: 1, status: 1 });
db.user_tasks.createIndex({ storeTaskId: 1 });
db.user_tasks.createIndex({ broadcastId: 1 });
db.user_tasks.createIndex({ status: 1, completedAt: -1 });
```

### Example

```json
{
  "_id": ObjectId("60f1234567890abcdef44444"),
  "storeTaskId": ObjectId("60f1234567890abcdef33333"),
  "employeeId": ObjectId("60f1234567890abcdef55555"),
  "broadcastId": ObjectId("60f1234567890abcdef11111"),
  "status": "approved",
  "checklist": [
    {
      "_id": ObjectId("60f1234567890abcdef66666"),
      "task": "Kiểm tra bảng điện chính",
      "note": "Chụp 2 ảnh",
      "required": true,
      "isCompleted": true,
      "evidence": {
        "photos": [
          {
            "_id": ObjectId("60f1234567890abcdef77777"),
            "url": "/uploads/photos/photo_001.jpg",
            "thumbnailUrl": "/uploads/thumbnails/photo_001.jpg",
            "uploadedAt": ISODate("2026-03-16T14:25:00Z"),
            "size": 2048000
          }
        ],
        "videos": [],
        "note": "Đã kiểm tra xong, mọi thứ OK"
      }
    }
  ],
  "overallNote": "Task hoàn thành tốt",
  "completedAt": ISODate("2026-03-16T14:30:00Z"),
  "approvedAt": ISODate("2026-03-17T09:00:00Z"),
  "managerFeedback": "Làm tốt lắm!",
  "rating": 5,
  "revisionHistory": [],
  "createdAt": ISODate("2026-03-15T10:30:00Z"),
  "updatedAt": ISODate("2026-03-17T09:00:00Z")
}
```

---

## 🔔 notifications Collection

**Collection mới** (sẽ phát triển) cho thông báo.

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId,       // Ref to Employee
  type: String,           // "broadcast_created" | "task_assigned" | "task_approved" | etc.
  title: String,
  message: String,
  data: Object,           // Additional data (taskId, broadcastId, etc.)
  isRead: Boolean,
  createdAt: Date
}
```

### Indexes

```javascript
db.notifications.createIndex({ userId: 1, isRead: 1, createdAt: -1 });
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // TTL 30 days
```

### Example

```json
{
  "_id": ObjectId("60f1234567890abcdef88888"),
  "userId": ObjectId("60f1234567890abcdef55555"),
  "type": "task_assigned",
  "title": "Task mới",
  "message": "Bạn có task mới: Kiểm tra hệ thống điện",
  "data": {
    "taskId": ObjectId("60f1234567890abcdef44444"),
    "broadcastId": ObjectId("60f1234567890abcdef11111")
  },
  "isRead": false,
  "createdAt": ISODate("2026-03-15T10:30:00Z")
}
```

---

## 🗂️ Files Storage

Files được lưu trên filesystem (hoặc S3):

```
/uploads/
  /files/          # PDF, documents
    file_001.pdf
  /photos/         # Images
    photo_001.jpg
  /thumbnails/     # Thumbnails
    photo_001.jpg
  /videos/         # Videos
    video_001.mp4
```

Metadata lưu trong collections (attachments, evidence).

---

## 🔗 Relationships

```
Employee (admin) → broadcasts
broadcasts → store_tasks → user_tasks
Brand ← store_tasks
Employee (manager) → Brand (via ID_Branch)
Employee (employee) → Brand (via ID_Branch)
Employee ← user_tasks

GroupUser → Employee (via ID_GroupUser - xác định role)
```

### Migration Notes

**Mapping collections hiện tại → mới:**
- `Brand` collection hiện tại → tương đương `stores` trong thiết kế mới
- `Employee` collection hiện tại → tương đương `users` trong thiết kế mới
- `ID_Branch` → `storeId` (reference to Brand)
- `ID_GroupUser` → Logic xác định `role` (admin/manager/employee)

---

## 📊 Aggregation Examples

### Broadcast completion stats

```javascript
db.broadcasts.aggregate([
  {
    $lookup: {
      from: "store_tasks",
      localField: "_id",
      foreignField: "broadcastId",
      as: "storeTasks"
    }
  },
  {
    $project: {
      title: 1,
      totalStores: { $size: "$assignedStores" },
      completedStores: {
        $size: {
          $filter: {
            input: "$storeTasks",
            cond: { $eq: ["$$this.status", "completed"] }
          }
        }
      }
    }
  }
]);
```

---

## 🔗 Liên quan

- **Architecture**: [architecture.md](architecture.md)
- **Business Logic**: [business-logic.md](business-logic.md)
- **Security**: [security.md](security.md)
