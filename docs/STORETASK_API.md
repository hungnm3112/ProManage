# Store Task Management API

> Complete API documentation for StoreTask management endpoints

**Base URL:** `http://localhost:3000/api/store-tasks`  
**Authentication:** Required (JWT Bearer Token)  
**Authorization:** Admin, Manager  
**Created:** March 16, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Authorization Rules](#authorization-rules)
4. [Endpoints Overview](#endpoints-overview)
5. [API Reference](#api-reference)
   - [GET /api/store-tasks](#1-get-all-store-tasks)
   - [GET /api/store-tasks/:id](#2-get-store-task-by-id)
   - [PUT /api/store-tasks/:id/accept](#3-accept-store-task)
   - [PUT /api/store-tasks/:id/reject](#4-reject-store-task)
6. [Store Task Status Flow](#store-task-status-flow)
7. [Testing Checklist](#testing-checklist)
8. [Error Responses](#error-responses)

---

## Overview

The Store Task Management API allows managers to view and manage tasks assigned to their stores. When an admin publishes a broadcast, store tasks are automatically created for each assigned store and assigned to the store's manager.

### Key Features

- View store tasks assigned to your store (managers) or all stores (admins)
- Accept or reject tasks with reasons
- Track task progress and completion
- Filter by status and broadcast
- Automatic creation when broadcasts are published

---

## Authentication

All endpoints require JWT authentication via Bearer token in the `Authorization` header:

```bash
Authorization: Bearer <your-jwt-token>
```

To obtain a token, login via `POST /api/auth/login`.

---

## Authorization Rules

### Admin
- Can view **all store tasks** across all branches
- Can view detailed information for any store task
- **Cannot** accept or reject tasks (this is manager's responsibility)

### Manager
- Can view **only tasks assigned to their store** (where `storeId === manager.ID_Branch`)
- Can view detailed information for their store's tasks
- Can **accept** pending tasks
- Can **reject** pending tasks with a reason
- **Cannot** view or modify other stores' tasks

### Employee
- **No access** to store task endpoints

---

## Endpoints Overview

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/store-tasks` | Admin, Manager | Get all store tasks with filtering |
| GET | `/api/store-tasks/:id` | Admin, Manager | Get store task by ID |
| PUT | `/api/store-tasks/:id/accept` | Manager only | Accept a store task |
| PUT | `/api/store-tasks/:id/reject` | Manager only | Reject a store task |

---

## API Reference

### 1. GET All Store Tasks

Retrieve all store tasks with optional filtering.

**Endpoint:** `GET /api/store-tasks`  
**Access:** Admin, Manager

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status: `pending`, `accepted`, `rejected`, `in_progress`, `completed` |
| broadcastId | ObjectId | No | Filter by broadcast ID |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20, max: 100) |

#### Authorization Logic

- **Admin:** Returns all store tasks matching filters
- **Manager:** Returns only tasks where `storeId === manager.ID_Branch`

#### Request Example

```bash
# Get all pending tasks (Admin)
curl -X GET "http://localhost:3000/api/store-tasks?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get tasks for specific broadcast (Manager)
curl -X GET "http://localhost:3000/api/store-tasks?broadcastId=65f9a1b2c3d4e5f6a7b8c9d0" \
  -H "Authorization: Bearer MANAGER_JWT_TOKEN"

# Get accepted tasks (Manager - will only see own store)
curl -X GET "http://localhost:3000/api/store-tasks?status=accepted" \
  -H "Authorization: Bearer MANAGER_JWT_TOKEN"
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "message": "Store tasks fetched successfully",
  "data": {
    "storeTasks": [
      {
        "_id": "65f9a1b2c3d4e5f6a7b8c9e0",
        "broadcastId": {
          "_id": "65f9a1b2c3d4e5f6a7b8c9d0",
          "title": "Kiểm tra vệ sinh chi nhánh tuần 11",
          "description": "Kiểm tra toàn bộ vệ sinh...",
          "priority": "high",
          "deadline": "2026-03-20T17:00:00.000Z",
          "status": "active"
        },
        "storeId": {
          "_id": "507f1f77bcf86cd799439011",
          "Name": "Chi nhánh Hà Nội 1",
          "Map_Address": "123 Phố Huế",
          "Phone": "0123456789"
        },
        "managerId": {
          "_id": "507f1f77bcf86cd799439014",
          "FullName": "Trần Manager",
          "Phone": "0912345678",
          "Email": "manager@example.com"
        },
        "status": "pending",
        "completionRate": 0,
        "assignedEmployees": [],
        "createdAt": "2026-03-16T11:00:00.000Z",
        "updatedAt": "2026-03-16T11:00:00.000Z"
      },
      {
        "_id": "65f9a1b2c3d4e5f6a7b8c9e1",
        "broadcastId": {
          "_id": "65f9a1b2c3d4e5f6a7b8c9d1",
          "title": "Báo cáo doanh thu tuần 11",
          "priority": "medium",
          "deadline": "2026-03-18T17:00:00.000Z"
        },
        "storeId": {
          "_id": "507f1f77bcf86cd799439011",
          "Name": "Chi nhánh Hà Nội 1"
        },
        "managerId": {
          "_id": "507f1f77bcf86cd799439014",
          "FullName": "Trần Manager",
          "Phone": "0912345678"
        },
        "status": "accepted",
        "acceptedAt": "2026-03-16T11:30:00.000Z",
        "completionRate": 50,
        "assignedEmployees": [
          {
            "_id": "507f1f77bcf86cd799439015",
            "FullName": "Nguyễn Văn A",
            "Phone": "0912345679"
          }
        ],
        "createdAt": "2026-03-16T11:00:00.000Z",
        "updatedAt": "2026-03-16T11:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### 2. GET Store Task by ID

Retrieve detailed information about a specific store task.

**Endpoint:** `GET /api/store-tasks/:id`  
**Access:** Admin, Manager

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Store task ID |

#### Authorization Logic

- **Admin:** Can view any store task
- **Manager:** Can only view tasks where `storeId === manager.ID_Branch`

#### Request Example

```bash
curl -X GET "http://localhost:3000/api/store-tasks/65f9a1b2c3d4e5f6a7b8c9e0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "message": "Store task fetched successfully",
  "data": {
    "storeTask": {
      "_id": "65f9a1b2c3d4e5f6a7b8c9e0",
      "broadcastId": {
        "_id": "65f9a1b2c3d4e5f6a7b8c9d0",
        "title": "Kiểm tra vệ sinh chi nhánh tuần 11",
        "description": "Kiểm tra toàn bộ vệ sinh cửa hàng...",
        "priority": "high",
        "deadline": "2026-03-20T17:00:00.000Z",
        "assignedStores": [...],
        "checklist": [
          {
            "_id": "65f9a1b2c3d4e5f6a7b8c9d1",
            "task": "Kiểm tra khu vực tiếp khách",
            "note": "Chú ý bàn ghế và trang trí",
            "required": true
          },
          {
            "_id": "65f9a1b2c3d4e5f6a7b8c9d2",
            "task": "Kiểm tra khu vực kho",
            "required": true
          }
        ],
        "status": "active",
        "createdBy": {...}
      },
      "storeId": {
        "_id": "507f1f77bcf86cd799439011",
        "Name": "Chi nhánh Hà Nội 1",
        "Map_Address": "123 Phố Huế",
        "Phone": "0123456789"
      },
      "managerId": {
        "_id": "507f1f77bcf86cd799439014",
        "FullName": "Trần Manager",
        "Phone": "0912345678",
        "Email": "manager@example.com"
      },
      "status": "accepted",
      "acceptedAt": "2026-03-16T11:30:00.000Z",
      "completionRate": 50,
      "assignedEmployees": [
        {
          "_id": "507f1f77bcf86cd799439015",
          "FullName": "Nguyễn Văn A",
          "Phone": "0912345679",
          "Email": "employee@example.com"
        }
      ],
      "createdAt": "2026-03-16T11:00:00.000Z",
      "updatedAt": "2026-03-16T11:30:00.000Z"
    },
    "stats": {
      "total": 2,
      "assigned": 0,
      "in_progress": 1,
      "submitted": 0,
      "approved": 1,
      "rejected": 0,
      "completionRate": 50
    },
    "isOverdue": false
  }
}
```

#### Error Responses

```json
// 403 Forbidden (Manager trying to view other store's task)
{
  "success": false,
  "message": "You can only view tasks of your own store"
}

// 404 Not Found
{
  "success": false,
  "message": "Store task not found"
}
```

---

### 3. Accept Store Task

Accept a pending store task.

**Endpoint:** `PUT /api/store-tasks/:id/accept`  
**Access:** Manager only

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Store task ID |

#### Business Rules

1. Only the assigned manager can accept the task (`managerId === currentUser._id`)
2. Task must be in `pending` status
3. Status changes to `accepted`
4. `acceptedAt` timestamp is set

#### Request Example

```bash
curl -X PUT "http://localhost:3000/api/store-tasks/65f9a1b2c3d4e5f6a7b8c9e0/accept" \
  -H "Authorization: Bearer MANAGER_JWT_TOKEN"
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "message": "Store task accepted successfully",
  "data": {
    "storeTask": {
      "_id": "65f9a1b2c3d4e5f6a7b8c9e0",
      "broadcastId": {
        "_id": "65f9a1b2c3d4e5f6a7b8c9d0",
        "title": "Kiểm tra vệ sinh chi nhánh tuần 11",
        "deadline": "2026-03-20T17:00:00.000Z"
      },
      "storeId": {
        "_id": "507f1f77bcf86cd799439011",  
        "Name": "Chi nhánh Hà Nội 1",
        "Map_Address": "123 Phố Huế",
        "Phone": "0123456789"
      },
      "managerId": {
        "_id": "507f1f77bcf86cd799439014",
        "FullName": "Trần Manager",
        "Phone": "0912345678",
        "Email": "manager@example.com"
      },
      "status": "accepted",
      "acceptedAt": "2026-03-16T11:30:00.000Z",
      "completionRate": 0,
      "createdAt": "2026-03-16T11:00:00.000Z",
      "updatedAt": "2026-03-16T11:30:00.000Z"
    }
  }
}
```

#### Error Responses

```json
// 400 Bad Request (Not pending)
{
  "success": false,
  "message": "Only pending tasks can be accepted"
}

// 403 Forbidden (Not assigned manager)
{
  "success": false,
  "message": "Only the assigned manager can accept this task"
}

// 404 Not Found
{
  "success": false,
  "message": "Store task not found"
}
```

---

### 4. Reject Store Task

Reject a pending store task with a reason.

**Endpoint:** `PUT /api/store-tasks/:id/reject`  
**Access:** Manager only

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Store task ID |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| rejectedReason | string | Yes | Reason for rejection (5-500 chars) |

#### Business Rules

1. Only the assigned manager can reject the task (`managerId === currentUser._id`)
2. Task must be in `pending` status
3. Must provide `rejectedReason`
4. Status changes to `rejected`
5. `rejectedAt` timestamp is set

#### Request Example

```bash
curl -X PUT "http://localhost:3000/api/store-tasks/65f9a1b2c3d4e5f6a7b8c9e0/reject" \
  -H "Authorization: Bearer MANAGER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectedReason": "Chi nhánh đang thiếu nhân sự không đủ khả năng hoàn thành trong deadline"
  }'
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "message": "Store task rejected successfully",
  "data": {
    "storeTask": {
      "_id": "65f9a1b2c3d4e5f6a7b8c9e0",
      "broadcastId": {
        "_id": "65f9a1b2c3d4e5f6a7b8c9d0",
        "title": "Kiểm tra vệ sinh chi nhánh tuần 11",
        "deadline": "2026-03-20T17:00:00.000Z"
      },
      "storeId": {
        "_id": "507f1f77bcf86cd799439011",
        "Name": "Chi nhánh Hà Nội 1",
        "Map_Address": "123 Phố Huế",
        "Phone": "0123456789"
      },
      "managerId": {
        "_id": "507f1f77bcf86cd799439014",
        "FullName": "Trần Manager",
        "Phone": "0912345678",
        "Email": "manager@example.com"
      },
      "status": "rejected",
      "rejectedReason": "Chi nhánh đang thiếu nhân sự không đủ khả năng hoàn thành trong deadline",
      "rejectedAt": "2026-03-16T11:35:00.000Z",
      "completionRate": 0,
      "createdAt": "2026-03-16T11:00:00.000Z",
      "updatedAt": "2026-03-16T11:35:00.000Z"
    }
  }
}
```

#### Error Responses

```json
// 400 Bad Request (Missing reason)
{
  "success": false,
  "message": "Rejection reason is required"
}

// 400 Bad Request (Reason too short)
{
  "success": false,
  "message": "Rejection reason must be between 5 and 500 characters"
}

// 400 Bad Request (Not pending)
{
  "success": false,
  "message": "Only pending tasks can be rejected"
}

// 403 Forbidden (Not assigned manager)
{
  "success": false,
  "message": "Only the assigned manager can reject this task"
}

// 404 Not Found
{
  "success": false,
  "message": "Store task not found"
}
```

---

## Store Task Status Flow

### Status Lifecycle

```
pending → accepted → in_progress → completed
   ↓
rejected (terminal state)
```

### Status Descriptions

| Status | Description | Can Accept? | Can Reject? | Next Status |
|--------|-------------|-------------|-------------|-------------|
| `pending` | Task just created, waiting for manager's decision | ✅ Yes | ✅ Yes | `accepted` or `rejected` |
| `accepted` | Manager accepted the task | ❌ No | ❌ No | `in_progress` (when employees start) |
| `rejected` | Manager rejected the task | ❌ No | ❌ No | Terminal state |
| `in_progress` | Employees are working on the task | ❌ No | ❌ No | `completed` |
| `completed` | All user tasks approved | ❌ No | ❌ No | Terminal state |

### Timestamps

- `createdAt`: When task was created (auto - on publish broadcast)
- `acceptedAt`: When manager accepted (auto - on accept)
- `rejectedAt`: When manager rejected (auto - on reject)
- `startedAt`: When status changed to `in_progress` (auto)
- `completedAt`: When status changed to `completed` (auto)
- `updatedAt`: Last update time (auto)

---

## Testing Checklist

### GET /api/store-tasks

- [ ] Admin can view all store tasks
- [ ] Manager can only view their own store's tasks
- [ ] Filter by status (pending, accepted, rejected, in_progress, completed)
- [ ] Filter by broadcastId
- [ ] Test pagination (page and limit)
- [ ] Test invalid status filter (400)
- [ ] Test invalid broadcastId format (400)
- [ ] Employee cannot access (403)
- [ ] Unauthenticated cannot access (401)

### GET /api/store-tasks/:id

- [ ] Admin can view any store task
- [ ] Manager can view their own store's task
- [ ] Manager cannot view other store's task (403)
- [ ] Verify stats are calculated correctly
- [ ] Verify isOverdue flag is correct
- [ ] Test with invalid ID format (400)
- [ ] Test with non-existent ID (404)
- [ ] Employee cannot access (403)
- [ ] Unauthenticated cannot access (401)

### PUT /api/store-tasks/:id/accept

- [ ] Manager can accept pending task of their store
- [ ] Manager cannot accept other store's task (403)
- [ ] Admin cannot accept task (403)
- [ ] Cannot accept already accepted task (400)
- [ ] Cannot accept rejected task (400)
- [ ] Verify acceptedAt is set
- [ ] Verify status changes to 'accepted'
- [ ] Test with invalid ID format (400)
- [ ] Test with non-existent ID (404)
- [ ] Unauthenticated cannot access (401)

### PUT /api/store-tasks/:id/reject

- [ ] Manager can reject pending task of their store
- [ ] Manager cannot reject other store's task (403)
- [ ] Admin cannot reject task (403)
- [ ] Cannot reject already accepted task (400)
- [ ] Cannot reject already rejected task (400)
- [ ] Fail without rejectedReason (400)
- [ ] Fail with reason too short (<5 chars) (400)
- [ ] Fail with reason too long (>500 chars) (400)
- [ ] Verify rejectedAt is set
- [ ] Verify rejectedReason is saved
- [ ] Verify status changes to 'rejected'
- [ ] Test with invalid ID format (400)
- [ ] Test with non-existent ID (404)
- [ ] Unauthenticated cannot access (401)

---

## Error Responses

### Common HTTP Status Codes

| Status Code | Description | Example |
|-------------|-------------|---------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Store task not found |
| 500 | Internal Server Error | Unexpected server error |

### Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "message": "Error description here"
}
```

---

## Integration with Broadcasts

### How Store Tasks are Created

1. Admin creates a broadcast in `draft` status
2. Admin publishes the broadcast via `POST /api/broadcasts/:id/publish`
3. System automatically:
   - Finds all assigned stores
   - For each store, finds the active manager
   - Creates a `StoreTask` with `status: 'pending'`
   - Assigns the task to the manager

### Manager Workflow

```
1. Manager logs in
2. Manager views pending tasks: GET /api/store-tasks?status=pending
3. Manager reviews task details: GET /api/store-tasks/:id
4. Manager decides:
   a. Accept: PUT /api/store-tasks/:id/accept
   b. Reject: PUT /api/store-tasks/:id/reject (with reason)
5. If accepted, manager assigns employees (future feature - User Tasks)
6. Employees complete tasks
7. Manager reviews and approves
8. Status changes to 'completed'
```

---

## Next Steps

1. **Test all endpoints** using the checklist above
2. **Implement User Task API** (Phase 3.1)
   - Assign tasks to individual employees
   - Track individual progress
   - Submit evidence (photos, videos)
   - Manager review and approve
3. **Add Notifications** (Future)
   - Notify managers when new tasks arrive
   - Notify admin when tasks are rejected
   - Notify employees when assigned to tasks

---

**Last Updated:** March 16, 2026  
**Version:** 1.0  
**Author:** ProManage Team
