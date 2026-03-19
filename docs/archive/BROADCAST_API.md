# Broadcast Management API

> Complete API documentation for Broadcast system endpoints

**Base URL:** `http://localhost:3000/api/broadcasts`  
**Authentication:** Required (JWT Bearer Token)  
**Authorization:** Admin only  
**Created:** March 16, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Broadcast Workflow](#broadcast-workflow)
4. [Endpoints Overview](#endpoints-overview)
5. [API Reference](#api-reference)
   - [POST /api/broadcasts](#1-create-broadcast)
   - [GET /api/broadcasts](#2-get-all-broadcasts)
   - [GET /api/broadcasts/:id](#3-get-broadcast-by-id)
   - [PUT /api/broadcasts/:id](#4-update-broadcast)
   - [DELETE /api/broadcasts/:id](#5-delete-broadcast)
   - [POST /api/broadcasts/:id/publish](#6-publish-broadcast)
6. [Data Structures](#data-structures)
7. [Testing Checklist](#testing-checklist)
8. [Error Responses](#error-responses)

---

## Overview

The Broadcast Management API allows admins to create, manage, and publish work broadcasts to multiple branches/stores. When a broadcast is published, store tasks are automatically created for each assigned store and assigned to the store's manager.

### Key Features

- Create and manage draft broadcasts
- Assign broadcasts to multiple stores
- Define checklists for task completion
- Attach files (images, videos, documents)
- Set deadlines and priorities
- Publish broadcasts to create store tasks
- Track completion rates across stores

---

## Authentication

All endpoints require JWT authentication via Bearer token in the `Authorization` header:

```bash
Authorization: Bearer <your-jwt-token>
```

All endpoints also require **admin role** authorization.

To obtain a token, login via `POST /api/auth/login`.

---

## Broadcast Workflow

### 1. Draft Phase
- Admin creates broadcast with `status: 'draft'`
- Can be edited and deleted
- Not visible to stores/managers yet

### 2. Publish Phase
- Admin publishes broadcast via `/broadcasts/:id/publish`
- Status changes to `active`
- Store tasks automatically created for each assigned store
- Managers receive notifications (future feature)

### 3. Active Phase
- Cannot be edited or deleted
- Managers can accept/reject tasks
- Track completion across stores

### 4. Completion/Archive Phase
- Status changes to `completed` when all stores finish
- Can be archived for record keeping

---

## Endpoints Overview

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/broadcasts` | Admin | Create a new broadcast (draft) |
| GET | `/api/broadcasts` | Admin | Get all broadcasts with filtering |
| GET | `/api/broadcasts/:id` | Admin | Get broadcast by ID with store tasks |
| PUT | `/api/broadcasts/:id` | Admin | Update broadcast (draft only) |
| DELETE | `/api/broadcasts/:id` | Admin | Delete broadcast (draft only) |
| POST | `/api/broadcasts/:id/publish` | Admin | Publish broadcast and create store tasks |

---

## API Reference

### 1. Create Broadcast

Create a new broadcast in draft status.

**Endpoint:** `POST /api/broadcasts`  
**Access:** Admin only

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Broadcast title (max 200 chars) |
| description | string | Yes | Detailed description |
| priority | string | No | Priority level: `low`, `medium`, `high`, `urgent` (default: `medium`) |
| deadline | Date | Yes | Task deadline (must be future date) |
| assignedStores | ObjectId[] | Yes | Array of store IDs (min 1) |
| checklist | ChecklistItem[] | Yes | Array of checklist items (min 1) |
| attachments | Attachment[] | No | Array of file attachments |
| recurring | Recurring | No | Recurring schedule settings |

**ChecklistItem Structure:**
```json
{
  "task": "string (required)",
  "note": "string (optional)",
  "required": "boolean (default: true)"
}
```

**Attachment Structure:**
```json
{
  "filename": "string (required)",
  "url": "string (required)",
  "size": "number (required)",
  "mimeType": "string (required)"
}
```

**Recurring Structure:**
```json
{
  "enabled": "boolean (default: false)",
  "frequency": "daily | weekly | monthly",
  "dayOfWeek": "number (0-6, for weekly)",
  "dayOfMonth": "number (1-31, for monthly)"
}
```

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/broadcasts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Kiểm tra vệ sinh chi nhánh tuần 11",
    "description": "Kiểm tra toàn bộ vệ sinh cửa hàng, bao gồm khu vực khách hàng và kho",
    "priority": "high",
    "deadline": "2026-03-20T17:00:00.000Z",
    "assignedStores": [
      "507f1f77bcf86cd799439011",
      "507f1f77bcf86cd799439012"
    ],
    "checklist": [
      {
        "task": "Kiểm tra khu vực tiếp khách",
        "note": "Chú ý bàn ghế và trang trí",
        "required": true
      },
      {
        "task": "Kiểm tra khu vực kho",
        "note": "Sắp xếp hàng hóa gọn gàng",
        "required": true
      },
      {
        "task": "Kiểm tra nhà vệ sinh",
        "required": true
      }
    ],
    "attachments": [
      {
        "filename": "checklist_template.pdf",
        "url": "https://example.com/files/checklist.pdf",
        "size": 102400,
        "mimeType": "application/pdf"
      }
    ]
  }'
```

#### Response Example (201 Created)

```json
{
  "success": true,
  "message": "Broadcast created successfully",
  "data": {
    "broadcast": {
      "_id": "65f9a1b2c3d4e5f6a7b8c9d0",
      "title": "Kiểm tra vệ sinh chi nhánh tuần 11",
      "description": "Kiểm tra toàn bộ vệ sinh cửa hàng...",
      "priority": "high",
      "deadline": "2026-03-20T17:00:00.000Z",
      "assignedStores": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "Name": "Chi nhánh Hà Nội 1",
          "Map_Address": "123 Phố Huế",
          "Phone": "0123456789"
        },
        {
          "_id": "507f1f77bcf86cd799439012",
          "Name": "Chi nhánh HCM 1",
          "Map_Address": "456 Nguyễn Huệ",
          "Phone": "0987654321"
        }
      ],
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
          "note": "Sắp xếp hàng hóa gọn gàng",
          "required": true
        },
        {
          "_id": "65f9a1b2c3d4e5f6a7b8c9d3",
          "task": "Kiểm tra nhà vệ sinh",
          "required": true
        }
      ],
      "attachments": [
        {
          "_id": "65f9a1b2c3d4e5f6a7b8c9d4",
          "filename": "checklist_template.pdf",
          "url": "https://example.com/files/checklist.pdf",
          "size": 102400,
          "mimeType": "application/pdf",
          "uploadedAt": "2026-03-16T10:30:00.000Z"
        }
      ],
      "recurring": {
        "enabled": false
      },
      "status": "draft",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439013",
        "FullName": "Nguyễn Admin",
        "Phone": "0901234567",
        "Email": "admin@example.com"
      },
      "createdAt": "2026-03-16T10:30:00.000Z",
      "updatedAt": "2026-03-16T10:30:00.000Z"
    }
  }
}
```

---

### 2. Get All Broadcasts

Retrieve all broadcasts with optional filtering and pagination.

**Endpoint:** `GET /api/broadcasts`  
**Access:** Admin only

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status: `draft`, `active`, `completed`, `archived` |
| priority | string | No | Filter by priority: `low`, `medium`, `high`, `urgent` |
| createdBy | ObjectId | No | Filter by creator ID |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20, max: 100) |

#### Request Example

```bash
# Get all active broadcasts
curl -X GET "http://localhost:3000/api/broadcasts?status=active&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get high priority broadcasts
curl -X GET "http://localhost:3000/api/broadcasts?priority=high" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "message": "Broadcasts fetched successfully",
  "data": {
    "broadcasts": [
      {
        "_id": "65f9a1b2c3d4e5f6a7b8c9d0",
        "title": "Kiểm tra vệ sinh chi nhánh tuần 11",
        "description": "Kiểm tra toàn bộ vệ sinh...",
        "priority": "high",
        "deadline": "2026-03-20T17:00:00.000Z",
        "status": "active",
        "createdBy": {
          "_id": "507f1f77bcf86cd799439013",
          "FullName": "Nguyễn Admin",
          "Phone": "0901234567",
          "Email": "admin@example.com"
        },
        "assignedStores": [
          {
            "_id": "507f1f77bcf86cd799439011",
            "Name": "Chi nhánh Hà Nội 1",
            "Active": "true"
          }
        ],
        "publishedAt": "2026-03-16T11:00:00.000Z",
        "createdAt": "2026-03-16T10:30:00.000Z",
        "updatedAt": "2026-03-16T11:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 3. Get Broadcast by ID

Retrieve detailed information about a specific broadcast including store tasks.

**Endpoint:** `GET /api/broadcasts/:id`  
**Access:** Admin only

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Broadcast ID |

#### Request Example

```bash
curl -X GET "http://localhost:3000/api/broadcasts/65f9a1b2c3d4e5f6a7b8c9d0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "message": "Broadcast fetched successfully",
  "data": {
    "broadcast": {
      "_id": "65f9a1b2c3d4e5f6a7b8c9d0",
      "title": "Kiểm tra vệ sinh chi nhánh tuần 11",
      "description": "Kiểm tra toàn bộ vệ sinh cửa hàng...",
      "priority": "high",
      "deadline": "2026-03-20T17:00:00.000Z",
      "assignedStores": [...],
      "checklist": [...],
      "attachments": [...],
      "status": "active",
      "createdBy": {...},
      "publishedAt": "2026-03-16T11:00:00.000Z",
      "store_tasks": [
        {
          "_id": "65f9a1b2c3d4e5f6a7b8c9e0",
          "broadcastId": "65f9a1b2c3d4e5f6a7b8c9d0",
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
          "acceptedAt": "2026-03-16T11:15:00.000Z",
          "completionRate": 33,
          "createdAt": "2026-03-16T11:00:00.000Z"
        },
        {
          "_id": "65f9a1b2c3d4e5f6a7b8c9e1",
          "storeId": {
            "_id": "507f1f77bcf86cd799439012",
            "Name": "Chi nhánh HCM 1"
          },
          "managerId": {
            "_id": "507f1f77bcf86cd799439015",
            "FullName": "Lê Manager",
            "Phone": "0912345679"
          },
          "status": "pending",
          "completionRate": 0,
          "createdAt": "2026-03-16T11:00:00.000Z"
        }
      ]
    },
    "stats": {
      "total": 2,
      "pending": 1,
      "accepted": 1,
      "rejected": 0,
      "in_progress": 0,
      "completed": 0,
      "completionRate": 0
    }
  }
}
```

---

### 4. Update Broadcast

Update a broadcast (only draft status can be updated).

**Endpoint:** `PUT /api/broadcasts/:id`  
**Access:** Admin only

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Broadcast ID |

#### Request Body

All fields are optional. Only include fields you want to update.

| Field | Type | Description |
|-------|------|-------------|
| title | string | Broadcast title (max 200 chars) |
| description | string | Detailed description |
| priority | string | `low`, `medium`, `high`, `urgent` |
| deadline | Date | Task deadline (must be future date) |
| assignedStores | ObjectId[] | Array of store IDs (min 1) |
| checklist | ChecklistItem[] | Array of checklist items (min 1) |
| attachments | Attachment[] | Array of file attachments |
| recurring | Recurring | Recurring schedule settings |

#### Request Example

```bash
curl -X PUT "http://localhost:3000/api/broadcasts/65f9a1b2c3d4e5f6a7b8c9d0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Kiểm tra vệ sinh chi nhánh tuần 11 - CẬP NHẬT",
    "priority": "urgent",
    "deadline": "2026-03-21T17:00:00.000Z"
  }'
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "message": "Broadcast updated successfully",
  "data": {
    "broadcast": {
      "_id": "65f9a1b2c3d4e5f6a7b8c9d0",
      "title": "Kiểm tra vệ sinh chi nhánh tuần 11 - CẬP NHẬT",
      "priority": "urgent",
      "deadline": "2026-03-21T17:00:00.000Z",
      "status": "draft",
      ...
    }
  }
}
```

#### Error Responses

```json
// 400 Bad Request (Not draft status)
{
  "success": false,
  "message": "Only draft broadcasts can be edited"
}

// 404 Not Found
{
  "success": false,
  "message": "Broadcast not found"
}
```

---

### 5. Delete Broadcast

Delete a broadcast (only draft status can be deleted).

**Endpoint:** `DELETE /api/broadcasts/:id`  
**Access:** Admin only

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Broadcast ID |

#### Request Example

```bash
curl -X DELETE "http://localhost:3000/api/broadcasts/65f9a1b2c3d4e5f6a7b8c9d0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "message": "Broadcast deleted successfully",
  "data": {
    "deletedId": "65f9a1b2c3d4e5f6a7b8c9d0"
  }
}
```

#### Error Responses

```json
// 400 Bad Request (Not draft status)
{
  "success": false,
  "message": "Only draft broadcasts can be deleted"
}

// 404 Not Found
{
  "success": false,
  "message": "Broadcast not found"
}
```

---

### 6. Publish Broadcast

Publish a broadcast and automatically create store tasks for assigned stores.

**Endpoint:** `POST /api/broadcasts/:id/publish`  
**Access:** Admin only

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Broadcast ID |

#### Publishing Rules

Broadcast can only be published if:
1. Status is `draft`
2. Has at least one assigned store
3. Has at least one checklist item
4. Has a deadline
5. Deadline is in the future

#### What Happens on Publish

1. Broadcast status changes to `active`
2. `publishedAt` timestamp is set
3. For each assigned store:
   - Find active manager of the store
   - Create a `StoreTask` with status `pending`
   - Assign task to the manager
4. Return number of tasks created/failed

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/broadcasts/65f9a1b2c3d4e5f6a7b8c9d0/publish" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "message": "Broadcast published successfully",
  "data": {
    "broadcast": {
      "_id": "65f9a1b2c3d4e5f6a7b8c9d0",
      "title": "Kiểm tra vệ sinh chi nhánh tuần 11",
      "status": "active",
      "publishedAt": "2026-03-16T11:00:00.000Z",
      "store_tasks": [
        {
          "_id": "65f9a1b2c3d4e5f6a7b8c9e0",
          "storeId": {
            "_id": "507f1f77bcf86cd799439011",
            "Name": "Chi nhánh Hà Nội 1"
          },
          "managerId": {
            "_id": "507f1f77bcf86cd799439014",
            "FullName": "Trần Manager",
            "Phone": "0912345678"
          },
          "status": "pending"
        },
        {
          "_id": "65f9a1b2c3d4e5f6a7b8c9e1",
          "storeId": {
            "_id": "507f1f77bcf86cd799439012",
            "Name": "Chi nhánh HCM 1"
          },
          "managerId": {
            "_id": "507f1f77bcf86cd799439015",
            "FullName": "Lê Manager",
            "Phone": "0912345679"
          },
          "status": "pending"
        }
      ],
      ...
    },
    "storeTasksCreated": 2,
    "storeTasksFailed": 0
  }
}
```

#### Error Responses

```json
// 400 Bad Request (Not draft)
{
  "success": false,
  "message": "Only draft broadcasts can be published"
}

// 400 Bad Request (No assigned stores)
{
  "success": false,
  "message": "Broadcast must have at least one assigned store"
}

// 400 Bad Request (No checklist)
{
  "success": false,
  "message": "Broadcast must have a checklist"
}

// 400 Bad Request (Past deadline)
{
  "success": false,
  "message": "Deadline must be in the future"
}

// 404 Not Found
{
  "success": false,
  "message": "Broadcast not found"
}
```

---

## Data Structures

### Broadcast Status Flow

```
draft → active → completed → archived
         ↓
      (cannot edit/delete after this point)
```

### Priority Levels

- `low` - Normal tasks, flexible deadlines
- `medium` - Standard priority (default)
- `high` - Important tasks, strict deadlines
- `urgent` - Critical tasks requiring immediate attention

### Checklist Item

```typescript
{
  task: string;        // Required: Task description
  note?: string;       // Optional: Additional notes
  required: boolean;   // Default: true
}
```

### Attachment

```typescript
{
  filename: string;    // Required: Original filename
  url: string;         // Required: File URL
  size: number;        // Required: File size in bytes
  mimeType: string;    // Required: MIME type (e.g., 'image/jpeg')
  uploadedAt: Date;    // Auto-set: Upload timestamp
}
```

### Recurring Schedule

```typescript
{
  enabled: boolean;              // Default: false
  frequency?: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;            // 0-6 (Sunday-Saturday), for weekly
  dayOfMonth?: number;           // 1-31, for monthly
}
```

---

## Testing Checklist

### Create Broadcast (POST /api/broadcasts)
- [ ] Create broadcast with all required fields
- [ ] Create broadcast with attachments
- [ ] Create broadcast with recurring schedule
- [ ] Fail with missing title (400)
- [ ] Fail with missing description (400)
- [ ] Fail with missing deadline (400)
- [ ] Fail with past deadline (400)
- [ ] Fail with empty assignedStores (400)
- [ ] Fail with invalid store ID (400)
- [ ] Fail with empty checklist (400)
- [ ] Fail with checklist item missing task (400)
- [ ] Fail without authentication (401)
- [ ] Fail without admin role (403)

### Get Broadcasts (GET /api/broadcasts)
- [ ] Get all broadcasts without filters
- [ ] Filter by status (draft, active, completed, archived)
- [ ] Filter by priority (low, medium, high, urgent)
- [ ] Filter by createdBy
- [ ] Test pagination (page and limit)
- [ ] Test invalid status filter (400)
- [ ] Fail without authentication (401)
- [ ] Fail without admin role (403)

### Get Broadcast by ID (GET /api/broadcasts/:id)
- [ ] Get draft broadcast
- [ ] Get active broadcast with store_tasks populated
- [ ] Get broadcast with statistics
- [ ] Fail with invalid ID format (400)
- [ ] Fail with non-existent ID (404)
- [ ] Fail without authentication (401)
- [ ] Fail without admin role (403)

### Update Broadcast (PUT /api/broadcasts/:id)
- [ ] Update draft broadcast successfully
- [ ] Update single field
- [ ] Update multiple fields
- [ ] Fail to update active broadcast (400)
- [ ] Fail to update completed broadcast (400)
- [ ] Fail with empty body (400)
- [ ] Fail with invalid deadline (400)
- [ ] Fail with past deadline (400)
- [ ] Fail with non-existent ID (404)
- [ ] Fail without authentication (401)
- [ ] Fail without admin role (403)

### Delete Broadcast (DELETE /api/broadcasts/:id)
- [ ] Delete draft broadcast successfully
- [ ] Fail to delete active broadcast (400)
- [ ] Fail to delete completed broadcast (400)
- [ ] Fail with non-existent ID (404)
- [ ] Fail without authentication (401)
- [ ] Fail without admin role (403)

### Publish Broadcast (POST /api/broadcasts/:id/publish)
- [ ] Publish draft broadcast successfully
- [ ] Verify store tasks created for all assigned stores
- [ ] Verify each store task has correct manager
- [ ] Verify storeTasksCreated count is correct
- [ ] Fail to publish already active broadcast (400)
- [ ] Fail with broadcast missing assignedStores (400)
- [ ] Fail with broadcast missing checklist (400)
- [ ] Fail with broadcast missing deadline (400)
- [ ] Fail with past deadline (400)
- [ ] Handle stores with no manager gracefully
- [ ] Verify rollback on error (broadcast stays draft)
- [ ] Fail with non-existent ID (404)
- [ ] Fail without authentication (401)
- [ ] Fail without admin role (403)

---

## Error Responses

### Common HTTP Status Codes

| Status Code | Description | Example |
|-------------|-------------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Broadcast created successfully |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions (not admin) |
| 404 | Not Found | Broadcast not found |
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

## Next Steps

1. **Test all endpoints** using the checklist above
2. **Implement Store Task API** (Phase 2.3)
   - Manager accept/reject tasks
   - View store tasks by branch
   - Track completion
3. **Implement File Upload Service** (Phase 2.4)
   - Upload attachments for broadcasts
   - Store files securely
4. **Add Notifications** (Future)
   - Notify managers when broadcast is published
   - Notify admin when tasks are completed

---

**Last Updated:** March 16, 2026  
**Version:** 1.0  
**Author:** ProManage Team
