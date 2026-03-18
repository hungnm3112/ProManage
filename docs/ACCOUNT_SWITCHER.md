# 🔄 Account Switcher - Quick Testing Tool

## Mục đích
Tool để đổi nhanh giữa các tài khoản Admin/Manager/Employee mà không cần login/logout.

## 🚀 Cách sử dụng

### 1. Khởi động server
```bash
npm run dev
```

### 2. Truy cập dashboard bất kỳ
- http://localhost:5000/admin/dashboard
- http://localhost:5000/manager/dashboard  
- http://localhost:5000/employee/dashboard

### 3. Tìm nút Account Switcher
- **Vị trí:** Góc dưới bên phải màn hình
- **Biểu tượng:** Nút tròn màu indigo với icon đổi mũi tên
- **Hover text:** "Quick Switch Account (Dev Tool)"

### 4. Click vào nút → Hiện modal danh sách accounts

### 5. Chọn account muốn đổi
- **Hiển thị:** Tên, Chức vụ, Chi nhánh, SĐT
- **Nhóm:** Admin / Manager / Employee
- **Current Account:** Hiển thị màu xanh ở đầu

### 6. Click vào account → Tự động đổi và reload

## 📋 Features

✅ **Auto-load accounts** - Tự động lấy danh sách từ DB  
✅ **Group by role** - Phân nhóm Admin/Manager/Employee  
✅ **Show current** - Highlight tài khoản hiện tại  
✅ **Quick switch** - 1 click là đổi ngay  
✅ **Auto reload** - Tự động reload page sau khi đổi  
✅ **Dev only** - Chỉ hoạt động trên localhost  

## ⚙️ Technical Details

### API Endpoints

**GET /api/dev/accounts**
- Lấy danh sách tất cả employees đang hoạt động
- Group theo role (admin, manager, employee)
- Limit 50 accounts

**POST /api/dev/quick-login**
```json
{
  "employeeId": "6281fe4747efbf2d56f61fb4"
}
```
Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "employee": {
    "_id": "6281fe4747efbf2d56f61fb4",
    "fullName": "Nguyễn Mạnh Hùng ADMIN",
    "role": "admin",
    "groupUser": "Tổng giám đốc",
    "branchName": "Chi nhánh A",
    ...
  }
}
```

### Files Created

1. **src/routes/devRoutes.js** - API endpoints
2. **public/js/account-switcher.js** - UI component
3. **src/routes/index.js** - Route registration (updated)
4. **src/views/pages/*/dashboard.ejs** - Script inclusion (updated)

## 🔒 Security

**⚠️ CHỈ HOẠT ĐỘNG TRONG DEV MODE**

- Check `NODE_ENV !== 'production'` trong API
- Check `localhost` hoặc `192.168.x.x` trong UI
- **KHÔNG BAO GIỜ DEPLOY VÀO PRODUCTION**

## 🧪 Testing Workflow

### Scenario 1: Test Admin → Manager → Employee

```
1. Login với account bất kỳ
2. Vào Admin Dashboard
3. Click Account Switcher button (góc dưới phải)
4. Click vào Manager account → Auto switch
5. Verify Manager Dashboard load đúng
6. Click Account Switcher → Chọn Employee
7. Verify Employee Dashboard load đúng
```

### Scenario 2: Test Cross-branch Manager

```
1. Switch to Manager Chi nhánh A
2. Verify chỉ thấy tasks của chi nhánh A
3. Switch to Manager Chi nhánh B  
4. Verify chỉ thấy tasks của chi nhánh B
```

### Scenario 3: Test Employee Assignment

```
1. Switch to Manager account
2. Assign task cho Employee
3. Switch to Employee account
4. Verify nhận được task mới
5. Submit task
6. Switch back to Manager
7. Verify pending review
```

## 📊 Account Display Format

```
┌─────────────────────────────────────┐
│ ✓ Current Account                   │
│ Nguyễn Mạnh Hùng ADMIN             │
│ Tổng giám đốc - Chi nhánh X        │
│ Role: admin                         │
└─────────────────────────────────────┘

┌─ 👑 Admin Accounts (3) ────────────┐
│ [Nguyễn Văn A]                     │
│ Tổng giám đốc                      │
│ Văn phòng Hà Nội                   │
│ 📱 0393588269                       │
│                                     │
│ [Trần Thị B]                       │
│ Phó tổng giám đốc                  │
│ Văn phòng HCM                      │
│ 📱 0392029548                       │
└─────────────────────────────────────┘

┌─ 👔 Manager Accounts (5) ──────────┐
│ ...                                 │
└─────────────────────────────────────┘

┌─ 👤 Employee Accounts (20) ────────┐
│ ...                                 │
└─────────────────────────────────────┘
```

## 🎯 Next Steps

Sau khi có Account Switcher, bạn có thể:

1. ✅ Test full workflow mà không cần login/logout
2. ✅ Verify authorization (Manager chỉ thấy chi nhánh của mình)
3. ✅ Test real-time updates (assign task → switch account → verify)
4. ✅ Debug role-specific features nhanh chóng
5. ✅ Demo cho stakeholders (chuyển role trong vài giây)

## 🐛 Troubleshooting

**Không thấy nút Account Switcher?**
- Check console: có lỗi load accounts không?
- Check URL: phải là localhost hoặc 192.168.x.x
- Refresh page (Ctrl+R)

**Click vào account không đổi được?**
- Check console: có lỗi API không?
- Check server logs: POST /api/dev/quick-login
- Verify employeeId có đúng trong DB không

**Đổi account nhưng dashboard vẫn hiển thị cũ?**
- Check localStorage: `localStorage.getItem('employee')`
- Hard refresh (Ctrl+Shift+R)
- Clear cache và refresh

## 📝 Vietnamese Shortcuts

```javascript
// Quick check current account in console
JSON.parse(localStorage.getItem('employee'))

// Manual switch (paste employeeId)
accountSwitcher.switchTo('6281fe4747efbf2d56f61fb4')

// Reload accounts list
accountSwitcher.loadAccounts()
```

---

**Ready to test!** 🚀

Refresh dashboard page và bắt đầu test workflow!
