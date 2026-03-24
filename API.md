# IT Requirement Management System - API Documentation

**Base URL:** `http://localhost:3001/api`

---

## Table of Contents

- [Users](#users)
- [Projects](#projects)
- [Requirements](#requirements)
- [Requirements Followups](#requirements-followups)
- [Stats](#stats)

---

## Users

### List All Users

```
GET /users
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Alice Chen",
    "email": "alice@example.com",
    "role": "admin",
    "avatar": "https://i.pravatar.cc/150?u=alice",
    "created_at": "2026-03-24 05:43:54"
  }
]
```

---

### Get User by ID

```
GET /users/:id
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | User ID |

**Response:**
```json
{
  "id": 1,
  "name": "Alice Chen",
  "email": "alice@example.com",
  "role": "admin",
  "avatar": "https://i.pravatar.cc/150?u=alice",
  "created_at": "2026-03-24 05:43:54"
}
```

**Error (404):**
```json
{
  "error": "User not found"
}
```

---

### Create User

```
POST /users
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "member",
  "avatar": "https://example.com/avatar.jpg"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Full name |
| email | string | Yes | Email address (must be unique) |
| role | string | No | One of: `admin`, `manager`, `member` (default: `member`) |
| avatar | string | No | Avatar image URL |

**Response (201):**
```json
{
  "id": 5,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "member",
  "avatar": "https://example.com/avatar.jpg",
  "created_at": "2026-03-24 12:00:00"
}
```

**Error (400):**
```json
{
  "error": "Name and email are required"
}
```
```json
{
  "error": "Email already exists"
}
```

---

### Update User

```
PUT /users/:id
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | User ID |

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "role": "manager",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Full name |
| email | string | Yes | Email address (must be unique) |
| role | string | No | One of: `admin`, `manager`, `member` |
| avatar | string | No | Avatar image URL |

**Response:**
```json
{
  "id": 5,
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "role": "manager",
  "avatar": "https://example.com/new-avatar.jpg",
  "created_at": "2026-03-24 12:00:00"
}
```

**Error (400):**
```json
{
  "error": "Email already exists"
}
```

---

### Delete User

```
DELETE /users/:id
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | User ID |

**Response:**
```json
{
  "success": true
}
```

**Error (400):**
```json
{
  "error": "Cannot delete user with assigned requirements"
}
```

---

## Projects

### List All Projects

```
GET /projects
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Portal v3.0",
    "description": "Company internal portal redesign with new features",
    "color": "#2563eb",
    "requirement_count": 2,
    "completed_count": 0,
    "created_at": "2026-03-24 05:43:54",
    "updated_at": "2026-03-24 05:43:54"
  }
]
```

---

### Get Project by ID

```
GET /projects/:id
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Project ID |

**Response:**
```json
{
  "id": 1,
  "name": "Portal v3.0",
  "description": "Company internal portal redesign with new features",
  "color": "#2563eb",
  "created_at": "2026-03-24 05:43:54",
  "updated_at": "2026-03-24 05:43:54",
  "requirements": [
    {
      "id": 1,
      "title": "User authentication flow redesign",
      "status": "in_progress",
      "priority": "high"
    }
  ]
}
```

**Error (404):**
```json
{
  "error": "Project not found"
}
```

---

### Create Project

```
POST /projects
```

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "color": "#2563eb"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Project name |
| description | string | No | Project description |
| color | string | No | Hex color code (default: `#2563eb`) |

**Response (201):**
```json
{
  "id": 7,
  "name": "New Project",
  "description": "Project description",
  "color": "#2563eb"
}
```

---

### Update Project

```
PUT /projects/:id
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Project ID |

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "color": "#10b981"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Updated Project Name",
  "description": "Updated description",
  "color": "#10b981"
}
```

---

### Delete Project

```
DELETE /projects/:id
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Project ID |

**Response:**
```json
{
  "success": true
}
```

---

## Requirements

### List All Requirements

```
GET /requirements
```

**Query Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | string | No | Filter by status |
| priority | string | No | Filter by priority |
| project_id | integer | No | Filter by project |
| search | string | No | Search in title and description |

**Status Values:** `draft`, `in_review`, `approved`, `in_progress`, `completed`

**Priority Values:** `low`, `medium`, `high`, `critical`

**Example:**
```
GET /requirements?status=in_progress&priority=high&project_id=1&search=auth
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "User authentication flow redesign",
    "description": "Implement OAuth2 and MFA support",
    "status": "in_progress",
    "priority": "high",
    "project_id": 1,
    "assignee_id": 1,
    "due_date": "2026-04-15",
    "tags": ["auth", "security"],
    "attachments": [],
    "related_requirements": [],
    "project_name": "Portal v3.0",
    "project_color": "#2563eb",
    "assignee_name": "Alice Chen",
    "assignee_avatar": "https://i.pravatar.cc/150?u=alice",
    "created_at": "2026-03-24 05:43:54",
    "updated_at": "2026-03-24 05:43:54"
  }
]
```

---

### Get Requirement by ID

```
GET /requirements/:id
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Requirement ID |

**Response:**
```json
{
  "id": 1,
  "title": "User authentication flow redesign",
  "description": "Implement OAuth2 and MFA support",
  "status": "in_progress",
  "priority": "high",
  "project_id": 1,
  "assignee_id": 1,
  "due_date": "2026-04-15",
  "tags": ["auth", "security"],
  "attachments": [],
  "related_requirements": [],
  "project_name": "Portal v3.0",
  "project_color": "#2563eb",
  "assignee_name": "Alice Chen",
  "assignee_avatar": "https://i.pravatar.cc/150?u=alice",
  "created_at": "2026-03-24 05:43:54",
  "updated_at": "2026-03-24 05:43:54"
}
```

**Error (404):**
```json
{
  "error": "Requirement not found"
}
```

---

### Create Requirement

```
POST /requirements
```

**Request Body:**
```json
{
  "title": "New Requirement",
  "description": "Requirement description",
  "status": "draft",
  "priority": "medium",
  "project_id": 1,
  "assignee_id": 1,
  "due_date": "2026-05-01",
  "tags": ["feature"],
  "attachments": [],
  "related_requirements": []
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Requirement title |
| description | string | No | Requirement description |
| status | string | No | Status (default: `draft`) |
| priority | string | No | Priority (default: `medium`) |
| project_id | integer | No | Project ID |
| assignee_id | integer | No | Assignee user ID |
| due_date | string | No | Due date (YYYY-MM-DD format) |
| tags | array | No | Array of tag strings |
| attachments | array | No | Array of attachment URLs |
| related_requirements | array | No | Array of related requirement IDs |

**Response (201):**
```json
{
  "id": 9,
  "title": "New Requirement",
  "description": "Requirement description",
  "status": "draft",
  "priority": "medium",
  "project_id": 1,
  "assignee_id": 1,
  "due_date": "2026-05-01",
  "tags": "[\"feature\"]",
  "attachments": "[]",
  "related_requirements": "[]",
  "created_at": "2026-03-24 12:00:00",
  "updated_at": "2026-03-24 12:00:00"
}
```

---

### Update Requirement

```
PUT /requirements/:id
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Requirement ID |

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "high",
  "project_id": 2,
  "assignee_id": 3,
  "due_date": "2026-06-01",
  "tags": ["feature", "urgent"],
  "attachments": ["https://example.com/file.pdf"],
  "related_requirements": [1, 2]
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Updated Title",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "high",
  "project_id": 2,
  "assignee_id": 3,
  "due_date": "2026-06-01",
  "tags": "[\"feature\", \"urgent\"]",
  "attachments": "[\"https://example.com/file.pdf\"]",
  "related_requirements": "[1, 2]",
  "created_at": "2026-03-24 05:43:54",
  "updated_at": "2026-03-24 12:00:00"
}
```

---

### Delete Requirement

```
DELETE /requirements/:id
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Requirement ID |

**Response:**
```json
{
  "success": true
}
```

---

## Requirements Followups

### List Follow-ups for Requirement

```
GET /requirements/:id/followups
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Requirement ID |

**Response:**
```json
[
  {
    "id": 1,
    "requirement_id": 1,
    "follower_id": 1,
    "follower_name": "Alice Chen",
    "follower_avatar": "https://i.pravatar.cc/150?u=alice",
    "follow_date": "2026-03-24",
    "location": "Conference Room A",
    "content": "Discussed project timeline and resource allocation",
    "conclusion": "Agreed on Q2 delivery schedule",
    "next_follow_date": "2026-03-31",
    "created_at": "2026-03-24 12:00:00",
    "updated_at": "2026-03-24 12:00:00"
  }
]
```

---

### Create Follow-up

```
POST /requirements/:id/followups
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Requirement ID |

**Request Body:**
```json
{
  "follower_id": 1,
  "follow_date": "2026-03-24",
  "location": "Conference Room A",
  "content": "Discussed project timeline and resource allocation",
  "conclusion": "Agreed on Q2 delivery schedule",
  "next_follow_date": "2026-03-31"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| follower_id | integer | Yes | User ID of the follower |
| follow_date | string | Yes | Follow-up date (YYYY-MM-DD format) |
| location | string | No | Location of the follow-up |
| content | string | Yes | Communication content |
| conclusion | string | No | Communication conclusion |
| next_follow_date | string | No | Next follow-up date (YYYY-MM-DD format) |

**Response (201):**
```json
{
  "id": 1,
  "requirement_id": 1,
  "follower_id": 1,
  "follower_name": "Alice Chen",
  "follower_avatar": "https://i.pravatar.cc/150?u=alice",
  "follow_date": "2026-03-24",
  "location": "Conference Room A",
  "content": "Discussed project timeline and resource allocation",
  "conclusion": "Agreed on Q2 delivery schedule",
  "next_follow_date": "2026-03-31",
  "created_at": "2026-03-24 12:00:00",
  "updated_at": "2026-03-24 12:00:00"
}
```

---

### Update Follow-up

```
PUT /followups/:id
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Follow-up ID |

**Request Body:**
```json
{
  "follower_id": 2,
  "follow_date": "2026-03-25",
  "location": "Online Meeting",
  "content": "Updated discussion points",
  "conclusion": "Revised timeline",
  "next_follow_date": "2026-04-01"
}
```

**Response:**
```json
{
  "id": 1,
  "requirement_id": 1,
  "follower_id": 2,
  "follower_name": "Bob Wilson",
  "follower_avatar": "https://i.pravatar.cc/150?u=bob",
  "follow_date": "2026-03-25",
  "location": "Online Meeting",
  "content": "Updated discussion points",
  "conclusion": "Revised timeline",
  "next_follow_date": "2026-04-01",
  "created_at": "2026-03-24 12:00:00",
  "updated_at": "2026-03-25 10:00:00"
}
```

---

### Delete Follow-up

```
DELETE /followups/:id
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Follow-up ID |

**Response:**
```json
{
  "success": true
}
```

---

## Stats

### Get Dashboard Statistics

```
GET /stats
```

**Response:**
```json
{
  "total": 8,
  "inProgress": 3,
  "completed": 1,
  "overdue": 0,
  "recentRequirements": [
    {
      "id": 1,
      "title": "User authentication flow redesign",
      "description": "Implement OAuth2 and MFA support",
      "status": "in_progress",
      "priority": "high",
      "project_id": 1,
      "assignee_id": 1,
      "due_date": "2026-04-15",
      "tags": "[\"auth\", \"security\"]",
      "project_name": "Portal v3.0",
      "assignee_name": "Alice Chen",
      "created_at": "2026-03-24 05:43:54"
    }
  ],
  "projectProgress": [
    {
      "id": 1,
      "name": "Portal v3.0",
      "color": "#2563eb",
      "total": 2,
      "completed": 0
    }
  ]
}
```

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| total | integer | Total number of requirements |
| inProgress | integer | Requirements with status `in_progress` |
| completed | integer | Requirements with status `completed` |
| overdue | integer | Requirements past due date (excluding completed) |
| recentRequirements | array | Last 5 requirements ordered by creation date |
| projectProgress | array | Top 5 projects with requirement counts |

---

## Status & Priority Reference

### Status Values

| Value | Description |
|-------|-------------|
| `draft` | Initial draft state |
| `in_review` | Under review |
| `approved` | Approved and ready for work |
| `in_progress` | Currently being worked on |
| `completed` | Work finished |

### Priority Values

| Value | Description |
|-------|-------------|
| `low` | Low priority |
| `medium` | Medium priority |
| `high` | High priority |
| `critical` | Critical/urgent priority |

---

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created successfully |
| 400 | Bad request / Validation error |
| 404 | Resource not found |
| 500 | Internal server error |
