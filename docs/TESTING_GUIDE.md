# ProManage WorkFlow 32 v3.0 - Testing Guide

> Hướng dẫn test toàn bộ hệ thống ProManage

**Server URL:** `http://localhost:5000`  
**API Base URL:** `http://localhost:5000/api`  
**Date:** March 16, 2026

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Phase 1: Foundation Testing](#phase-1-foundation-testing)
4. [Phase 2: Core Features Testing](#phase-2-core-features-testing)
5. [Phase 3: Workflow Testing](#phase-3-workflow-testing)
6. [Phase 4: Advanced Features Testing](#phase-4-advanced-features-testing)
7. [Complete Workflow Testing](#complete-workflow-testing)

---

## 🚀 Quick Start

### 1. Start Server

```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:5000`

### 2. Check Health

```bash
GET http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "ProManage API is running",
  "version": "1.0.0",
  "status": "healthy",
  "timestamp": "2026-03-16T..."
}
```

### 3. Access Web UI

- Login Page: `http://localhost:5000/login.html`
- Admin Dashboard: `http://localhost:5000/admin.html`
- Manager Dashboard: `http://localhost:5000/manager.html`
- Employee Dashboard: `http://localhost:5000/employee.html`

---

## 🔐 Authentication

### Login Endpoint

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "phone": "0392029548",
  "password": "123456"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "employee": {
      "_id": "...",
      "FullName": "...",
      "Phone": "0392029548",
      "role": "admin"
    }
  }
}
```

**Save the token** - Sử dụng token này cho tất cả các request tiếp theo:

```
Authorization: Bearer <your_token>
```

### Get Current User

```
GET http://localhost:5000/api/auth/me
Authorization: Bearer <your_token>
```

---

## 📍 Phase 1: Foundation Testing

### 1.1 Employee Management

#### Get All Employees
```
GET http://localhost:5000/api/employees
Authorization: Bearer <admin_token>
```

#### Get Employee by ID
```
GET http://localhost:5000/api/employees/:id
Authorization: Bearer <admin_token>
```

#### Create Employee (Admin Only)
```
POST http://localhost:5000/api/employees
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "FullName": "Nguyen Van Test",
  "Phone": "0901234567",
  "Email": "test@example.com",
  "Password": "123456",
  "ID_GroupUser": "<group_user_id>",
  "ID_Branch": "<brand_id>",
  "Status": "Đang hoạt động"
}
```

#### Update Employee
```
PUT http://localhost:5000/api/employees/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "FullName": "Updated Name",
  "Email": "updated@example.com"
}
```

#### Update Employee Status
```
PATCH http://localhost:5000/api/employees/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "Đã dừng"
}
```

### 1.2 Brand Management

#### Get All Brands
```
GET http://localhost:5000/api/brands
Authorization: Bearer <admin_token>
```

#### Create Brand
```
POST http://localhost:5000/api/brands
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "Name": "Chi nhánh Test",
  "Map_Address": "123 Test Street",
  "Phone": "0281234567"
}
```

---

## 📡 Phase 2: Core Features Testing

### 2.1 Broadcast Management

#### Create Broadcast (Draft)
```
POST http://localhost:5000/api/broadcasts
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Broadcast Test - Daily Recurring",
  "description": "Test broadcast with daily recurring",
  "priority": "high",
  "deadline": "2026-03-20T17:00:00.000Z",
  "assignedStores": [
    "<brand_id_1>",
    "<brand_id_2>"
  ],
  "checklist": [
    {
      "task": "Check store cleanliness",
      "note": "Focus on customer areas",
      "required": true
    },
    {
      "task": "Verify inventory",
      "note": "Count all items",
      "required": true
    },
    {
      "task": "Take photos",
      "note": "Upload at least 3 photos",
      "required": false
    }
  ],
  "recurring": {
    "enabled": true,
    "frequency": "daily"
  }
}
```

#### Get All Broadcasts
```
GET http://localhost:5000/api/broadcasts
Authorization: Bearer <admin_token>
```

#### Get Broadcast by ID
```
GET http://localhost:5000/api/broadcasts/:id
Authorization: Bearer <admin_token>
```

#### Update Broadcast (Draft Only)
```
PUT http://localhost:5000/api/broadcasts/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Updated Title",
  "priority": "urgent"
}
```

#### Publish Broadcast
```
POST http://localhost:5000/api/broadcasts/:id/publish
Authorization: Bearer <admin_token>
```

**This will:**
- Change status from 'draft' to 'active'
- Create StoreTask for each assigned store
- Send notifications to all managers

### 2.2 Store Task Management (Manager)

#### Get Store Tasks (Manager View)
```
GET http://localhost:5000/api/store-tasks
Authorization: Bearer <manager_token>
```

Manager chỉ thấy tasks của store mình quản lý.

#### Get Store Task by ID
```
GET http://localhost:5000/api/store-tasks/:id
Authorization: Bearer <manager_token>
```

#### Accept Store Task
```
POST http://localhost:5000/api/store-tasks/:id/accept
Authorization: Bearer <manager_token>
```

#### Reject Store Task
```
POST http://localhost:5000/api/store-tasks/:id/reject
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "rejectionReason": "Not enough staff available"
}
```

### 2.3 File Upload

#### Upload Single File
```
POST http://localhost:5000/api/upload/single
Authorization: Bearer <user_token>
Content-Type: multipart/form-data

file: <select file>
```

#### Upload Multiple Files
```
POST http://localhost:5000/api/upload/multiple
Authorization: Bearer <user_token>
Content-Type: multipart/form-data

files: <select multiple files>
```

---

## 👥 Phase 3: Workflow Testing

### 3.1 Assign Employees (Manager)

```
POST http://localhost:5000/api/store-tasks/:storeTaskId/assign
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "employeeIds": [
    "<employee_id_1>",
    "<employee_id_2>",
    "<employee_id_3>"
  ]
}
```

**This will:**
- Create UserTask for each employee
- Copy checklist from broadcast
- Send notification to each employee
- Update StoreTask status to 'in_progress'

### 3.2 Employee Task Execution

#### Get My Tasks (Employee View)
```
GET http://localhost:5000/api/my-tasks
Authorization: Bearer <employee_token>
```

**Query params:**
- `status`: 'assigned', 'in_progress', 'submitted', 'approved', 'rejected'
- `page`: Page number
- `limit`: Items per page

#### Get Task Detail
```
GET http://localhost:5000/api/my-tasks/:taskId
Authorization: Bearer <employee_token>
```

#### Update Checklist
```
PUT http://localhost:5000/api/my-tasks/:taskId/checklist
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "index": 0,
  "isCompleted": true
}
```

#### Upload Evidence
```
POST http://localhost:5000/api/my-tasks/:taskId/evidence
Authorization: Bearer <employee_token>
Content-Type: multipart/form-data

file: <select image/video>
```

#### Submit Task for Review
```
POST http://localhost:5000/api/my-tasks/:taskId/submit
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "overallNote": "All tasks completed successfully"
}
```

**Requirements:**
- All required checklist items must be completed
- Will send notification to manager

### 3.3 Manager Review

#### Get Pending Reviews
```
GET http://localhost:5000/api/reviews/pending
Authorization: Bearer <manager_token>
```

Shows all submitted UserTasks from manager's branch.

#### Approve Task
```
POST http://localhost:5000/api/reviews/:taskId/approve
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "rating": 5,
  "reviewNote": "Excellent work!"
}
```

**Rating:** 1-5 stars  
**This will:**
- Update UserTask status to 'approved'
- Send notification to employee
- Check if all employees completed → auto-complete StoreTask

#### Reject Task
```
POST http://localhost:5000/api/reviews/:taskId/reject
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "reviewNote": "Please retake photos with better lighting"
}
```

**reviewNote is required** for rejection.  
Employee can then fix and resubmit.

---

## 🎯 Phase 4: Advanced Features Testing

### 4.1 Dashboard Analytics

#### Admin Dashboard
```
GET http://localhost:5000/api/dashboard/admin
Authorization: Bearer <admin_token>
```

**Returns:**
- Total broadcasts
- Active broadcasts
- Completed broadcasts this month
- Top 5 performing stores
- Overdue tasks count
- Recent activities

#### Manager Dashboard
```
GET http://localhost:5000/api/dashboard/manager
Authorization: Bearer <manager_token>
```

**Returns:**
- Store tasks overview (by status)
- Pending reviews count
- Employee performance (ratings)
- Upcoming deadlines (next 7 days)

#### Employee Dashboard
```
GET http://localhost:5000/api/dashboard/employee
Authorization: Bearer <employee_token>
```

**Returns:**
- Assigned tasks count
- Completed tasks this month
- Personal performance (average rating)
- Recent feedback from reviews

### 4.2 Notifications

#### Get Notifications
```
GET http://localhost:5000/api/notifications
Authorization: Bearer <user_token>
```

**Query params:**
- `isRead`: 'true' or 'false'
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### Get Unread Count
```
GET http://localhost:5000/api/notifications/unread/count
Authorization: Bearer <user_token>
```

#### Mark as Read
```
PUT http://localhost:5000/api/notifications/:id/read
Authorization: Bearer <user_token>
```

#### Mark All as Read
```
PUT http://localhost:5000/api/notifications/read-all
Authorization: Bearer <user_token>
```

### 4.3 Recurring Broadcasts

Recurring broadcasts run automatically via cron job at **00:00 daily** (Asia/Ho_Chi_Minh).

#### Create Weekly Recurring Broadcast
```
POST http://localhost:5000/api/broadcasts
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Weekly Store Report",
  "description": "Submit weekly performance report",
  "priority": "medium",
  "deadline": "2026-03-22T23:59:00.000Z",
  "assignedStores": ["<brand_id>"],
  "checklist": [
    {
      "task": "Sales report",
      "required": true
    }
  ],
  "recurring": {
    "enabled": true,
    "frequency": "weekly",
    "dayOfWeek": 1
  }
}
```

**dayOfWeek:** 0=Sunday, 1=Monday, ..., 6=Saturday

#### Create Monthly Recurring Broadcast
```json
{
  "recurring": {
    "enabled": true,
    "frequency": "monthly",
    "dayOfMonth": 1
  }
}
```

**dayOfMonth:** 1-31

#### Manual Test Recurring Logic
```bash
node src/jobs/testRecurring.js
```

---

## 🔄 Complete Workflow Testing

### Scenario: Admin Creates Broadcast → Manager Assigns → Employee Completes → Manager Approves

#### Step 1: Admin Login
```
POST http://localhost:5000/api/auth/login
{
  "phone": "0392029548",
  "password": "123456"
}
```
Save admin token.

#### Step 2: Create Broadcast
```
POST http://localhost:5000/api/broadcasts
Authorization: Bearer <admin_token>
{
  "title": "Store Inspection - March 16",
  "description": "Monthly store inspection",
  "priority": "high",
  "deadline": "2026-03-18T17:00:00.000Z",
  "assignedStores": ["<brand_id>"],
  "checklist": [
    {
      "task": "Check cleanliness",
      "required": true
    },
    {
      "task": "Take photos",
      "required": true
    }
  ]
}
```
Save broadcast ID.

#### Step 3: Publish Broadcast
```
POST http://localhost:5000/api/broadcasts/:broadcastId/publish
Authorization: Bearer <admin_token>
```

This creates StoreTask and notifies managers.

#### Step 4: Manager Login
```
POST http://localhost:5000/api/auth/login
{
  "phone": "<manager_phone>",
  "password": "<manager_password>"
}
```
Save manager token.

#### Step 5: Manager Views Store Tasks
```
GET http://localhost:5000/api/store-tasks
Authorization: Bearer <manager_token>
```

#### Step 6: Manager Accepts Task
```
POST http://localhost:5000/api/store-tasks/:storeTaskId/accept
Authorization: Bearer <manager_token>
```

#### Step 7: Manager Assigns Employees
```
POST http://localhost:5000/api/store-tasks/:storeTaskId/assign
Authorization: Bearer <manager_token>
{
  "employeeIds": ["<employee_id_1>", "<employee_id_2>"]
}
```

Employees receive notifications.

#### Step 8: Employee Login
```
POST http://localhost:5000/api/auth/login
{
  "phone": "<employee_phone>",
  "password": "<employee_password>"
}
```
Save employee token.

#### Step 9: Employee Views Tasks
```
GET http://localhost:5000/api/my-tasks
Authorization: Bearer <employee_token>
```

#### Step 10: Employee Updates Checklist
```
PUT http://localhost:5000/api/my-tasks/:userTaskId/checklist
Authorization: Bearer <employee_token>
{
  "index": 0,
  "isCompleted": true
}
```

Repeat for all checklist items.

#### Step 11: Employee Uploads Evidence
```
POST http://localhost:5000/api/my-tasks/:userTaskId/evidence
Authorization: Bearer <employee_token>
Content-Type: multipart/form-data

file: <select photo>
```

#### Step 12: Employee Submits Task
```
POST http://localhost:5000/api/my-tasks/:userTaskId/submit
Authorization: Bearer <employee_token>
{
  "overallNote": "Completed all tasks"
}
```

Manager receives notification.

#### Step 13: Manager Reviews Task
```
GET http://localhost:5000/api/reviews/pending
Authorization: Bearer <manager_token>
```

#### Step 14: Manager Approves Task
```
POST http://localhost:5000/api/reviews/:userTaskId/approve
Authorization: Bearer <manager_token>
{
  "rating": 5,
  "reviewNote": "Great job!"
}
```

Employee receives notification.

#### Step 15: Check Auto-Completion
If all employees approved → StoreTask auto-completes.

```
GET http://localhost:5000/api/store-tasks/:storeTaskId
Authorization: Bearer <manager_token>
```

Status should be 'completed'.

#### Step 16: View Dashboard Analytics
```
GET http://localhost:5000/api/dashboard/admin
Authorization: Bearer <admin_token>
```

See updated statistics.

---

## 🧪 Testing Tools

### Postman Collection

Import this collection for easier testing:

1. Create new Postman Collection
2. Add environment variables:
   - `base_url`: `http://localhost:5000`
   - `admin_token`: `<your_admin_token>`
   - `manager_token`: `<your_manager_token>`
   - `employee_token`: `<your_employee_token>`

### cURL Examples

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0392029548","password":"123456"}'
```

#### Get Broadcasts (with token)
```bash
curl -X GET http://localhost:5000/api/broadcasts \
  -H "Authorization: Bearer <your_token>"
```

#### Create Broadcast
```bash
curl -X POST http://localhost:5000/api/broadcasts \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Broadcast",
    "description": "Testing",
    "priority": "medium",
    "deadline": "2026-03-20T17:00:00.000Z",
    "assignedStores": ["<brand_id>"],
    "checklist": [{"task":"Test","required":true}]
  }'
```

---

## 📊 Test Data

### Default Test Users

| Role | Phone | Password | Purpose |
|------|--------|----------|---------|
| Admin | 0392029548 | 123456 | Create broadcasts, view all data |
| Manager | (check DB) | (check DB) | Manage store tasks, assign employees |
| Employee | (check DB) | (check DB) | Complete tasks |

### Sample Broadcast Scenarios

1. **Daily Recurring** - Store opening checklist
2. **Weekly Recurring** - Weekly sales report (every Monday)
3. **Monthly Recurring** - Monthly inventory count (1st of month)
4. **One-time Urgent** - Emergency maintenance

---

## ✅ Expected Behaviors

### Notification Triggers

| Event | Who Gets Notified | Type |
|-------|------------------|------|
| Broadcast Published | All managers of assigned stores | `broadcast_published` |
| Employee Assigned | Assigned employee | `task_assigned` |
| Task Submitted | Manager of the store | `task_submitted` |
| Task Approved | Employee who submitted | `task_approved` |
| Task Rejected | Employee who submitted | `task_rejected` |
| StoreTask Completed | Manager | `store_task_completed` |

### Auto-Completion Logic

- **UserTask** completes when employee submits and manager approves
- **StoreTask** completes when ALL UserTasks are approved
- **Broadcast** shows completion rate based on StoreTask completion

### Recurring Broadcasts

- Cron job runs daily at 00:00 (Asia/Ho_Chi_Minh)
- Checks all active broadcasts with `recurring.enabled = true`
- Clones and publishes if frequency matches today
- New deadline calculated based on original duration

---

## 🐛 Common Issues

### 1. 401 Unauthorized
- Check if token is valid
- Token format: `Authorization: Bearer <token>`
- Token might have expired (check JWT_EXPIRE in .env)

### 2. 403 Forbidden
- User role doesn't have permission
- Example: Employee trying to access admin endpoints

### 3. 404 Not Found
- Check endpoint URL spelling
- Check if resource ID exists in database

### 4. 400 Bad Request
- Check request body format
- Required fields might be missing
- Validation errors (check error message)

### 5. 500 Internal Server Error
- Check server logs
- Database connection issues
- Missing dependencies

---

## 📞 Support

For issues or questions:
- Check server logs: Terminal running `npm run dev`
- Check MongoDB data: Use MongoDB Compass
- Review error messages in API responses

---

**Last Updated:** March 16, 2026  
**Version:** 1.0.0  
**Status:** ✅ All 46 tasks complete - Production Ready!
