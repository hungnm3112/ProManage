# ProManage - Quick Reference Guide

## 🌐 Server URLs

**Base URL:** `http://localhost:5000`  
**API URL:** `http://localhost:5000/api`

### Web Pages
- Login: `http://localhost:5000/login.html`
- Admin Dashboard: `http://localhost:5000/admin.html`
- Manager Dashboard: `http://localhost:5000/manager.html`
- Employee Dashboard: `http://localhost:5000/employee.html`

---

## 🔑 Quick Login

```bash
# Admin Login
POST http://localhost:5000/api/auth/login
{
  "phone": "0392029548",
  "password": "123456"
}
```

**Lưu token để dùng cho các request sau:**
```
Authorization: Bearer <your_token>
```

---

## 📍 All API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Employees (Admin)
- `GET /api/employees` - List all
- `GET /api/employees/:id` - Get by ID
- `POST /api/employees` - Create
- `PUT /api/employees/:id` - Update
- `PATCH /api/employees/:id/status` - Update status
- `DELETE /api/employees/:id` - Delete

### Brands (Admin)
- `GET /api/brands` - List all
- `GET /api/brands/:id` - Get by ID
- `POST /api/brands` - Create
- `PUT /api/brands/:id` - Update
- `DELETE /api/brands/:id` - Delete

### Broadcasts (Admin)
- `GET /api/broadcasts` - List all
- `GET /api/broadcasts/:id` - Get by ID
- `POST /api/broadcasts` - Create (draft)
- `PUT /api/broadcasts/:id` - Update (draft only)
- `DELETE /api/broadcasts/:id` - Delete (draft only)
- `POST /api/broadcasts/:id/publish` - Publish → creates StoreTask + notify managers

### Store Tasks (Manager)
- `GET /api/store-tasks` - List (filtered by manager's branch)
- `GET /api/store-tasks/:id` - Get by ID
- `POST /api/store-tasks/:id/accept` - Accept task
- `POST /api/store-tasks/:id/reject` - Reject task
- `POST /api/store-tasks/:id/assign` - Assign employees → creates UserTask + notify employees

### Employee Tasks (Employee)
- `GET /api/my-tasks` - List my tasks
- `GET /api/my-tasks/:id` - Get task detail
- `PUT /api/my-tasks/:id/checklist` - Update checklist item
- `POST /api/my-tasks/:id/evidence` - Upload evidence (photo/video)
- `POST /api/my-tasks/:id/submit` - Submit for review → notify manager

### Reviews (Manager)
- `GET /api/reviews/pending` - List pending reviews
- `POST /api/reviews/:taskId/approve` - Approve task → notify employee
- `POST /api/reviews/:taskId/reject` - Reject task → notify employee

### Dashboards
- `GET /api/dashboard/admin` - Admin analytics
- `GET /api/dashboard/manager` - Manager analytics
- `GET /api/dashboard/employee` - Employee analytics

### Notifications
- `GET /api/notifications` - Get notifications (paginated)
- `GET /api/notifications/unread/count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

### File Upload
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files
- `DELETE /api/upload/:filename` - Delete file

---

## 🔄 Complete Workflow (Summary)

### 1. Admin Creates & Publishes Broadcast
```bash
# Create
POST /api/broadcasts
{
  "title": "Store Inspection",
  "description": "Monthly inspection",
  "priority": "high",
  "deadline": "2026-03-20T17:00:00Z",
  "assignedStores": ["<brand_id>"],
  "checklist": [
    {"task": "Check cleanliness", "required": true},
    {"task": "Take photos", "required": true}
  ]
}

# Publish (creates StoreTask + notify managers)
POST /api/broadcasts/:id/publish
```

### 2. Manager Accepts & Assigns
```bash
# Accept
POST /api/store-tasks/:id/accept

# Assign employees (creates UserTask + notify employees)
POST /api/store-tasks/:id/assign
{
  "employeeIds": ["<emp_id_1>", "<emp_id_2>"]
}
```

### 3. Employee Completes Task
```bash
# Update checklist
PUT /api/my-tasks/:id/checklist
{"index": 0, "isCompleted": true}

# Upload evidence
POST /api/my-tasks/:id/evidence
(multipart/form-data with file)

# Submit (notify manager)
POST /api/my-tasks/:id/submit
{"overallNote": "Completed"}
```

### 4. Manager Reviews
```bash
# Approve (notify employee)
POST /api/reviews/:taskId/approve
{
  "rating": 5,
  "reviewNote": "Great job!"
}

# OR Reject (notify employee)
POST /api/reviews/:taskId/reject
{
  "reviewNote": "Please retake photos"
}
```

### 5. Auto-Completion
- When ALL UserTasks approved → StoreTask auto-completes
- Manager gets notification

---

## 📊 Sample Test Data

### Create Broadcast with Daily Recurring
```json
{
  "title": "Daily Store Opening Checklist",
  "description": "Tasks to complete every morning",
  "priority": "medium",
  "deadline": "2026-03-17T10:00:00.000Z",
  "assignedStores": ["<brand_id>"],
  "checklist": [
    {"task": "Turn on lights", "required": true},
    {"task": "Check cash register", "required": true},
    {"task": "Clean entrance", "required": false}
  ],
  "recurring": {
    "enabled": true,
    "frequency": "daily"
  }
}
```

### Create Broadcast with Weekly Recurring (Every Monday)
```json
{
  "title": "Weekly Sales Report",
  "description": "Submit weekly sales report every Monday",
  "priority": "high",
  "deadline": "2026-03-24T17:00:00.000Z",
  "assignedStores": ["<brand_id>"],
  "checklist": [
    {"task": "Sales summary", "required": true},
    {"task": "Inventory status", "required": true}
  ],
  "recurring": {
    "enabled": true,
    "frequency": "weekly",
    "dayOfWeek": 1
  }
}
```

### Create Broadcast with Monthly Recurring (1st of month)
```json
{
  "title": "Monthly Inventory Count",
  "description": "Complete inventory count on first day of month",
  "priority": "urgent",
  "deadline": "2026-04-05T23:59:00.000Z",
  "assignedStores": ["<brand_id>"],
  "checklist": [
    {"task": "Count all items", "required": true},
    {"task": "Upload report", "required": true}
  ],
  "recurring": {
    "enabled": true,
    "frequency": "monthly",
    "dayOfMonth": 1
  }
}
```

---

## 🎯 Test Checklist

- [ ] Login with admin account
- [ ] Create broadcast (draft)
- [ ] Publish broadcast → Check managers receive notification
- [ ] Login as manager
- [ ] View store tasks
- [ ] Accept store task
- [ ] Assign employees → Check employees receive notification
- [ ] Login as employee
- [ ] View my tasks
- [ ] Update checklist items
- [ ] Upload evidence
- [ ] Submit task → Check manager receives notification
- [ ] Login as manager
- [ ] View pending reviews
- [ ] Approve task → Check employee receives notification
- [ ] Check StoreTask auto-completes (if all UserTasks approved)
- [ ] View dashboard analytics (admin/manager/employee)
- [ ] Check notifications list
- [ ] Mark notifications as read
- [ ] Verify recurring broadcast (check cron job runs at 00:00)

---

## 💡 Pro Tips

1. **Use Postman/Thunder Client**
   - Tạo environment với base_url, admin_token, manager_token, employee_token
   - Dễ switch giữa các users

2. **Check Server Logs**
   - Terminal chạy `npm run dev` để xem errors/warnings
   - Notification logs show khi gửi thông báo

3. **MongoDB Compass**
   - Connect để xem data trực tiếp
   - URI: xem trong `.env` file

4. **Test Recurring Manually**
   ```bash
   node src/jobs/testRecurring.js
   ```

5. **File Uploads**
   - Max 10MB cho images
   - Max 50MB cho videos
   - Files saved to `/uploads` folder

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check token format: `Bearer <token>` |
| 403 Forbidden | Wrong user role (e.g., employee accessing admin endpoint) |
| 404 Not Found | Check endpoint URL or resource ID |
| 400 Bad Request | Check required fields, validation rules |
| Server not running | Run `npm run dev` |
| Can't login | Check phone & password, verify user exists in DB |

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Date:** March 16, 2026
