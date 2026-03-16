# Brand Management API

> Complete API documentation for Brand/Store management endpoints

**Base URL:** `http://localhost:3000/api/brands`  
**Authentication:** Required (JWT Bearer Token)  
**Created:** March 16, 2026

---

## Table of Contents

1. [Authentication](#authentication)
2. [Endpoints Overview](#endpoints-overview)
3. [API Reference](#api-reference)
   - [GET /api/brands](#1-get-all-brands)
   - [GET /api/brands/:id](#2-get-brand-by-id)
   - [GET /api/brands/:id/employees](#3-get-brand-employees)
   - [PUT /api/brands/:id](#4-update-brand)
   - [PATCH /api/brands/:id/manager](#5-assign-manager)
4. [Testing Checklist](#testing-checklist)
5. [Error Responses](#error-responses)

---

## Authentication

All endpoints require JWT authentication via Bearer token in the `Authorization` header:

```bash
Authorization: Bearer <your-jwt-token>
```

To obtain a token, login via `POST /api/auth/login`.

---

## Endpoints Overview

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/brands` | All authenticated users | Get all brands with filtering |
| GET | `/api/brands/:id` | All authenticated users | Get brand by ID |
| GET | `/api/brands/:id/employees` | Admin, Manager | Get all employees of a brand |
| PUT | `/api/brands/:id` | Admin only | Update brand information |
| PATCH | `/api/brands/:id/manager` | Admin only | Assign manager to a branch |

---

## API Reference

### 1. GET All Brands

Retrieve all brands with optional filtering and pagination.

**Endpoint:** `GET /api/brands`  
**Access:** All authenticated users

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| active | string | No | Filter by active status | `true` or `false` |
| search | string | No | Search in brand name (case-insensitive) | `Chi nhánh 1` |
| page | number | No | Page number (default: 1) | `1` |
| limit | number | No | Items per page (default: 20, max: 100) | `10` |

#### Request Example

```bash
# Get all active brands
curl -X GET "http://localhost:3000/api/brands?active=true&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search brands by name
curl -X GET "http://localhost:3000/api/brands?search=Hà Nội" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "data": {
    "brands": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "Name": "Chi nhánh Hà Nội 1",
        "Map_Address": "123 Phố Huế, Hà Nội",
        "Phone": "0123456789",
        "Active": "true",
        "Image": "https://example.com/branch1.jpg",
        "CheckIn": "08:00:00",
        "CheckOut": "17:00:00",
        "Phone_Customer_Support": "0987654321",
        "manager": {
          "_id": "507f1f77bcf86cd799439012",
          "FullName": "Nguyễn Văn A",
          "Phone": "0912345678",
          "ID_GroupUser": {
            "_id": "507f1f77bcf86cd799439013",
            "GroupName": "Manager"
          }
        }
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
  },
  "message": "Brands fetched successfully"
}
```

---

### 2. GET Brand by ID

Retrieve detailed information about a specific brand.

**Endpoint:** `GET /api/brands/:id`  
**Access:** All authenticated users

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Brand ID |

#### Request Example

```bash
curl -X GET "http://localhost:3000/api/brands/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "data": {
    "brand": {
      "_id": "507f1f77bcf86cd799439011",
      "Name": "Chi nhánh Hà Nội 1",
      "Map_Address": "123 Phố Huế, Hà Nội",
      "Phone": "0123456789",
      "Active": "true",
      "Image": "https://example.com/branch1.jpg",
      "Icon": "https://example.com/icon1.png",
      "HeaderContent": "Welcome to our branch",
      "CheckIn": "08:00:00",
      "CheckOut": "17:00:00",
      "LateIn": "08:15:00",
      "OutOvertime": "17:30:00",
      "Phone_Customer_Support": "0987654321",
      "Phone_Feedback": "0987654322",
      "Active_Schedule": "true",
      "manager": {
        "_id": "507f1f77bcf86cd799439012",
        "FullName": "Nguyễn Văn A",
        "Phone": "0912345678",
        "Email": "manager@example.com",
        "ID_GroupUser": {
          "_id": "507f1f77bcf86cd799439013",
          "GroupName": "Manager"
        }
      }
    }
  },
  "message": "Brand fetched successfully"
}
```

#### Error Responses

```json
// 404 Not Found
{
  "success": false,
  "message": "Brand not found"
}
```

---

### 3. GET Brand Employees

Retrieve all active employees of a specific brand.

**Endpoint:** `GET /api/brands/:id/employees`  
**Access:** Admin, Manager (manager can only see their own branch)

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Brand ID |

#### Request Example

```bash
curl -X GET "http://localhost:3000/api/brands/507f1f77bcf86cd799439011/employees" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "data": {
    "brand": {
      "_id": "507f1f77bcf86cd799439011",
      "Name": "Chi nhánh Hà Nội 1"
    },
    "employees": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "FullName": "Nguyễn Văn A",
        "Phone": "0912345678",
        "Email": "nva@example.com",
        "Status": "Đang hoạt động",
        "ID_GroupUser": {
          "_id": "507f1f77bcf86cd799439013",
          "GroupName": "Manager"
        },
        "ID_Branch": {
          "_id": "507f1f77bcf86cd799439011",
          "Name": "Chi nhánh Hà Nội 1"
        }
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "FullName": "Trần Thị B",
        "Phone": "0912345679",
        "Email": "ttb@example.com",
        "Status": "Đang hoạt động",
        "ID_GroupUser": {
          "_id": "507f1f77bcf86cd799439015",
          "GroupName": "Employee"
        },
        "ID_Branch": {
          "_id": "507f1f77bcf86cd799439011",
          "Name": "Chi nhánh Hà Nội 1"
        }
      }
    ],
    "total": 2
  },
  "message": "Brand employees fetched successfully"
}
```

#### Error Responses

```json
// 403 Forbidden (Manager trying to access another branch)
{
  "success": false,
  "message": "You can only view employees of your own branch"
}

// 404 Not Found
{
  "success": false,
  "message": "Brand not found"
}
```

---

### 4. UPDATE Brand

Update brand/store information.

**Endpoint:** `PUT /api/brands/:id`  
**Access:** Admin only

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Brand ID |

#### Request Body

All fields are optional. Only include fields you want to update.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| Name | string | Brand name | Min 2 chars |
| Map_Address | string | Address | Max 500 chars |
| Phone | string | Phone number | Format: 0xxxxxxxxx (10 digits) |
| Image | string | Image URL | Valid URL |
| WifiAddress | string | WiFi addresses (JSON array) | - |
| Icon | string | Icon URL | Valid URL |
| HeaderContent | string | Header content | Max 1000 chars |
| CheckIn | string | Check-in time | Format: HH:mm:ss |
| CheckOut | string | Check-out time | Format: HH:mm:ss |
| LateIn | string | Late check-in threshold | Format: HH:mm:ss |
| OutOvertime | string | Overtime checkout threshold | Format: HH:mm:ss |
| Active | string | Active status | `"true"` or `"false"` |
| Phone_Customer_Support | string | Customer support phone | Format: 0xxxxxxxxx |
| Phone_Feedback | string | Feedback phone | Format: 0xxxxxxxxx |
| Link_Description | string | Description link | Valid URL |
| Active_Schedule | string | Schedule active status | `"true"` or `"false"` |
| PercentPayment | string | Payment percentage | - |

#### Request Example

```bash
curl -X PUT "http://localhost:3000/api/brands/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Chi nhánh Hà Nội 1 - Updated",
    "Phone": "0123456789",
    "Active": "true",
    "CheckIn": "08:30:00",
    "CheckOut": "17:30:00"
  }'
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "data": {
    "brand": {
      "_id": "507f1f77bcf86cd799439011",
      "Name": "Chi nhánh Hà Nội 1 - Updated",
      "Map_Address": "123 Phố Huế, Hà Nội",
      "Phone": "0123456789",
      "Active": "true",
      "CheckIn": "08:30:00",
      "CheckOut": "17:30:00"
    }
  },
  "message": "Brand updated successfully"
}
```

#### Error Responses

```json
// 400 Bad Request (No valid fields)
{
  "success": false,
  "message": "No valid update fields provided"
}

// 404 Not Found
{
  "success": false,
  "message": "Brand not found"
}

// 400 Bad Request (Validation error)
{
  "success": false,
  "message": "Phone must be 10 digits starting with 0"
}
```

---

### 5. Assign Manager

Assign or reassign a manager to a brand/store.

**Endpoint:** `PATCH /api/brands/:id/manager`  
**Access:** Admin only

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Brand ID |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| employeeId | ObjectId | Yes | ID of employee to assign as manager |

#### Business Rules

1. Employee must be active (`Status: 'Đang hoạt động'`)
2. Employee must have `manager` role (via ID_GroupUser lookup)
3. If employee is already managing another branch:
   - That branch must have at least one other manager
   - Cannot leave a branch without a manager

#### Request Example

```bash
curl -X PATCH "http://localhost:3000/api/brands/507f1f77bcf86cd799439011/manager" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "507f1f77bcf86cd799439012"
  }'
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "data": {
    "brand": {
      "_id": "507f1f77bcf86cd799439011",
      "Name": "Chi nhánh Hà Nội 1"
    },
    "manager": {
      "_id": "507f1f77bcf86cd799439012",
      "FullName": "Nguyễn Văn A",
      "Phone": "0912345678",
      "Email": "nva@example.com",
      "Status": "Đang hoạt động",
      "ID_GroupUser": {
        "_id": "507f1f77bcf86cd799439013",
        "GroupName": "Manager"
      },
      "ID_Branch": {
        "_id": "507f1f77bcf86cd799439011",
        "Name": "Chi nhánh Hà Nội 1"
      }
    }
  },
  "message": "Manager assigned successfully"
}
```

#### Error Responses

```json
// 400 Bad Request (Missing employeeId)
{
  "success": false,
  "message": "Employee ID is required"
}

// 404 Not Found (Brand not found)
{
  "success": false,
  "message": "Brand not found"
}

// 404 Not Found (Employee not found)
{
  "success": false,
  "message": "Employee not found"
}

// 400 Bad Request (Employee not active)
{
  "success": false,
  "message": "Employee must be active to be assigned as manager"
}

// 400 Bad Request (Not a manager)
{
  "success": false,
  "message": "Employee must have manager role to be assigned as manager"
}

// 400 Bad Request (Would leave branch without manager)
{
  "success": false,
  "message": "Cannot reassign this manager. Their current branch has no other managers."
}
```

---

## Testing Checklist

### 1. GET /api/brands

- [ ] Get all brands without filters (default pagination)
- [ ] Filter by active status (`active=true`)
- [ ] Filter by active status (`active=false`)
- [ ] Search by brand name (partial match, case-insensitive)
- [ ] Test pagination (page=1, limit=5)
- [ ] Test pagination boundaries (page=999, should return empty array)
- [ ] Verify manager virtual population
- [ ] Test without authentication (should fail with 401)

### 2. GET /api/brands/:id

- [ ] Get brand by valid ID
- [ ] Get brand by invalid ID format (should fail with 400)
- [ ] Get brand by non-existent ID (should fail with 404)
- [ ] Verify manager is populated
- [ ] Test without authentication (should fail with 401)

### 3. GET /api/brands/:id/employees

- [ ] Get employees as admin (any branch)
- [ ] Get employees as manager (own branch)
- [ ] Get employees as manager (other branch, should fail with 403)
- [ ] Get employees as employee role (should fail with 403)
- [ ] Verify only active employees are returned (`Status: 'Đang hoạt động'`)
- [ ] Get employees for brand with no employees (empty array)
- [ ] Get employees for non-existent brand (should fail with 404)

### 4. PUT /api/brands/:id

- [ ] Update brand name successfully
- [ ] Update multiple fields at once
- [ ] Update with empty body (should fail with 400)
- [ ] Update with invalid phone format (should fail with 400)
- [ ] Update with invalid time format for CheckIn (should fail with 400)
- [ ] Update with invalid Active value (should fail with 400)
- [ ] Update non-existent brand (should fail with 404)
- [ ] Update as non-admin user (should fail with 403)
- [ ] Update with fields not in allowedUpdates (should be ignored)

### 5. PATCH /api/brands/:id/manager

- [ ] Assign manager to brand successfully
- [ ] Assign manager without employeeId (should fail with 400)
- [ ] Assign non-existent employee (should fail with 404)
- [ ] Assign non-manager employee (should fail with 400)
- [ ] Assign inactive employee (should fail with 400)
- [ ] Reassign manager from one branch to another (with backup manager at old branch)
- [ ] Try to reassign only manager of a branch (should fail with 400)
- [ ] Assign manager to non-existent brand (should fail with 404)
- [ ] Assign manager as non-admin user (should fail with 403)

---

## Error Responses

### Common HTTP Status Codes

| Status Code | Description | Example |
|-------------|-------------|---------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
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
2. **Integrate with frontend** - use these endpoints in your UI
3. **Add more features:**
   - Soft delete brands
   - Brand employee statistics
   - Brand performance metrics
4. **Phase 2**: Implement Broadcast System (core feature)

---

**Last Updated:** March 16, 2026  
**Version:** 1.0  
**Author:** ProManage Team
