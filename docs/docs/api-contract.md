# API Contract

## Overview

This document defines all API endpoints for the Academia platform. It serves as the single source of truth for frontend-backend communication.

**Technology:** Django REST Framework

**Base URL:** `/api/v1/`

**Authentication:** JWT (Bearer token) - required for all endpoints except public ones

**Note:** This document contains only API contract details. It does not include database schema, user flows, or implementation details.

---

## API DESIGN PRINCIPLES

1. **RESTful** - Resources as nouns, HTTP methods as actions
2. **Consistent** - Same patterns across all endpoints
3. **Versioned** - `/api/v1/` prefix
4. **Paginated** - List endpoints support pagination
5. **Filterable** - Query parameters for filtering
6. **Minimal** - Only expose what's needed

---

## STANDARD RESPONSE FORMATS

### Success Response (List)

```json
{
  "count": 100,
  "next": "https://api.example.com/api/v1/questions/?page=2",
  "previous": null,
  "results": []
}
```

### Success Response (Single)

```json
{
  "id": "uuid",
  "field1": "value",
  "field2": "value"
}
```

### Success Response (Create/Update)

```json
{
  "id": "uuid",
  "field1": "value",
  "field2": "value"
}
```

### Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Validation Error

```json
{
  "field_name": ["This field is required."]
}
```

---

## STATUS CODES

| Code | Description |
|------|-------------|
| 200 | OK - Successful request |
| 201 | Created - Resource created |
| 204 | No Content - Successful request with no response body |
| 400 | Bad Request - Invalid request body |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Authenticated but not authorized |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error |

---

## 1. AUTHENTICATION ENDPOINTS

### 1.1 Google Login

**Endpoint:** `POST /auth/google/`

**Description:** Authenticate user with Google OAuth token.

**Authentication:** Public

**Request Body:**

```json
{
  "access_token": "string"  // Google OAuth access token
}
```

**Response:** 200 OK

```json
{
  "access": "jwt_access_token",
  "refresh": "jwt_refresh_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "profile_picture": "https://example.com/image.jpg",
    "is_superuser": false
  }
}
```

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | INVALID_TOKEN | Invalid or expired Google token |
| 409 | EMAIL_EXISTS | Email already registered with different method |

---

### 1.2 Refresh Token

**Endpoint:** `POST /auth/refresh/`

**Description:** Refresh JWT access token.

**Authentication:** Public (requires refresh token)

**Request Body:**

```json
{
  "refresh": "jwt_refresh_token"
}
```

**Response:** 200 OK

```json
{
  "access": "new_jwt_access_token"
}
```

---

### 1.3 Logout

**Endpoint:** `POST /auth/logout/`

**Description:** Logout user (invalidate refresh token).

**Authentication:** Required

**Request Body:**

```json
{
  "refresh": "jwt_refresh_token"
}
```

**Response:** 204 No Content

---

### 1.4 Get Current User

**Endpoint:** `GET /auth/me/`

**Description:** Get authenticated user profile.

**Authentication:** Required

**Response:** 200 OK

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "John Doe",
  "profile_picture": "https://example.com/image.jpg",
  "is_superuser": false,
  "created_at": "2024-01-01T00:00:00Z",
  "moderator_hubs": [
    {
      "id": "uuid",
      "school_name": "University of Lagos",
      "school_id": "uuid"
    }
  ],
  "representative_hub": {
    "id": "uuid",
    "school_name": "University of Lagos",
    "school_id": "uuid"
  }
}
```

---

## 2. SCHOOL ENDPOINTS

### 2.1 List Schools

**Endpoint:** `GET /schools/`

**Description:** Get list of all schools in the system.

**Authentication:** Public

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by name or short_name |
| location | string | Filter by location |
| has_hub | boolean | Filter by whether hub exists |
| page | integer | Page number |
| page_size | integer | Items per page (default: 20, max: 100) |

**Response:** 200 OK

```json
{
  "count": 100,
  "next": "https://api.example.com/api/v1/schools/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "name": "University of Lagos",
      "short_name": "UNILAG",
      "location": "Lagos, Nigeria",
      "has_hub": true,
      "question_count": 150,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 2.2 Get School

**Endpoint:** `GET /schools/{school_id}/`

**Description:** Get detailed school information.

**Authentication:** Public

**Response:** 200 OK

```json
{
  "id": "uuid",
  "name": "University of Lagos",
  "short_name": "UNILAG",
  "location": "Lagos, Nigeria",
  "website": "https://unilag.edu.ng",
  "has_hub": true,
  "hub": {
    "id": "uuid",
    "question_count": 150,
    "answer_count": 320,
    "department_count": 12,
    "moderator_count": 3,
    "representative": {
      "id": "uuid",
      "display_name": "John Doe"
    },
    "created_at": "2024-01-01T00:00:00Z"
  },
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 404 | NOT_FOUND | School not found |

---

### 2.3 Create School (Admin Only)

**Endpoint:** `POST /schools/`

**Description:** Create a new school record.

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "name": "University of Lagos",
  "short_name": "UNILAG",
  "location": "Lagos, Nigeria",
  "website": "https://unilag.edu.ng"
}
```

**Response:** 201 Created (returns school object)

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | INVALID_DATA | Invalid request data |
| 409 | DUPLICATE_NAME | School with this name already exists |
| 403 | FORBIDDEN | User is not an admin |

---

### 2.4 Update School (Admin Only)

**Endpoint:** `PATCH /schools/{school_id}/`

**Description:** Update school information.

**Authentication:** Required (Admin only)

**Request Body:** (All fields optional)

```json
{
  "short_name": "UNILAG",
  "location": "Lagos, Nigeria",
  "website": "https://unilag.edu.ng"
}
```

**Response:** 200 OK (returns updated school object)

---

## 3. HUB ENDPOINTS

### 3.1 Get Hub

**Endpoint:** `GET /hubs/{hub_id}/`

**Description:** Get detailed hub information.

**Authentication:** Public

**Response:** 200 OK

```json
{
  "id": "uuid",
  "school": {
    "id": "uuid",
    "name": "University of Lagos",
    "short_name": "UNILAG",
    "location": "Lagos, Nigeria"
  },
  "question_count": 150,
  "answer_count": 320,
  "representative": {
    "id": "uuid",
    "display_name": "John Doe",
    "profile_picture": "https://example.com/image.jpg"
  },
  "moderators": [
    {
      "id": "uuid",
      "display_name": "Jane Smith",
      "profile_picture": "https://example.com/image.jpg"
    }
  ],
  "departments": [
    {
      "id": "uuid",
      "name": "Computer Science",
      "question_count": 45
    }
  ],
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 404 | NOT_FOUND | Hub not found |

---

### 3.2 Request Hub Activation

**Endpoint:** `POST /hubs/request/`

**Description:** Request activation for a school hub.

**Authentication:** Required

**Request Body:**

```json
{
  "school_id": "uuid"
}
```

**Response:** 201 Created

```json
{
  "id": "uuid",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | ALREADY_ACTIVE | Hub already exists for this school |
| 400 | ALREADY_REQUESTED | Activation request already pending |
| 404 | NOT_FOUND | School not found |

---

### 3.3 List Activation Requests (Admin Only)

**Endpoint:** `GET /hubs/requests/`

**Description:** Get list of pending activation requests.

**Authentication:** Required (Admin only)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | pending/approved/denied |
| school_name | string | Filter by school name |
| page | integer | Page number |
| page_size | integer | Items per page |

**Response:** 200 OK

```json
{
  "count": 10,
  "results": [
    {
      "id": "uuid",
      "school": {
        "id": "uuid",
        "name": "University of Lagos"
      },
      "requester": {
        "id": "uuid",
        "display_name": "John Doe",
        "email": "john@example.com"
      },
      "status": "pending",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 3.4 Process Activation Request (Admin Only)

**Endpoint:** `POST /hubs/requests/{request_id}/process/`

**Description:** Approve or deny a hub activation request.

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "action": "approve",  // or "deny"
  "notes": "Approved - valid school"  // Optional
}
```

**Response:** 200 OK

```json
{
  "id": "uuid",
  "status": "approved",
  "hub_id": "uuid",  // Only if approved
  "reviewed_at": "2024-01-01T00:00:00Z"
}
```

---

## 4. DEPARTMENT ENDPOINTS

### 4.1 List Departments

**Endpoint:** `GET /hubs/{hub_id}/departments/`

**Description:** Get list of departments in a hub.

**Authentication:** Public

**Response:** 200 OK

```json
{
  "count": 12,
  "results": [
    {
      "id": "uuid",
      "name": "Computer Science",
      "description": "Department of Computer Science",
      "question_count": 45,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 4.2 Create Department (School Representative Only)

**Endpoint:** `POST /hubs/{hub_id}/departments/`

**Description:** Create a new department in a hub.

**Authentication:** Required (School Representative only)

**Request Body:**

```json
{
  "name": "Computer Science",
  "description": "Department of Computer Science"
}
```

**Response:** 201 Created (returns department object)

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 409 | DUPLICATE_NAME | Department already exists |
| 403 | FORBIDDEN | User is not the school representative |

---

### 4.3 Update Department (School Representative Only)

**Endpoint:** `PATCH /departments/{department_id}/`

**Description:** Update department information.

**Authentication:** Required (School Representative only)

**Request Body:** (All fields optional)

```json
{
  "name": "Computer Science",
  "description": "Updated description",
  "is_active": false
}
```

**Response:** 200 OK (returns updated department object)

---

## 5. QUESTION ENDPOINTS

### 5.1 List Questions

**Endpoint:** `GET /questions/`

**Description:** Get list of questions with filters.

**Authentication:** Public

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| hub_id | uuid | Filter by hub |
| department_id | uuid | Filter by department |
| tag | string | Filter by tag name |
| status | string | open/answered/solved |
| author_id | uuid | Filter by author |
| search | string | Search in title and body |
| sort | string | -created_at (default), created_at, -view_count |
| page | integer | Page number |
| page_size | integer | Items per page (default: 20, max: 50) |

**Response:** 200 OK

```json
{
  "count": 150,
  "next": "https://api.example.com/api/v1/questions/?page=2&hub_id=uuid",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "title": "How to register for courses?",
      "body_preview": "I'm trying to register for courses...",
      "status": "answered",
      "view_count": 45,
      "answer_count": 3,
      "author": {
        "id": "uuid",
        "display_name": "John Doe",
        "profile_picture": "https://example.com/image.jpg"
      },
      "department": {
        "id": "uuid",
        "name": "Computer Science"
      },
      "tags": ["registration", "courses"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-02T00:00:00Z"
    }
  ]
}
```

---

### 5.2 Get Question

**Endpoint:** `GET /questions/{question_id}/`

**Description:** Get detailed question with answers.

**Authentication:** Public

**Response:** 200 OK

```json
{
  "id": "uuid",
  "title": "How to register for courses?",
  "body": "I'm trying to register for courses for the new semester...",
  "status": "answered",
  "view_count": 45,
  "answer_count": 3,
  "author": {
    "id": "uuid",
    "display_name": "John Doe",
    "profile_picture": "https://example.com/image.jpg"
  },
  "school": {
    "id": "uuid",
    "name": "University of Lagos",
    "short_name": "UNILAG"
  },
  "hub": {
    "id": "uuid"
  },
  "department": {
    "id": "uuid",
    "name": "Computer Science"
  },
  "tags": [
    {
      "id": "uuid",
      "name": "registration"
    }
  ],
  "best_answer": {
    "id": "uuid",
    "body": "To register for courses, follow these steps...",
    "author": {
      "id": "uuid",
      "display_name": "Jane Smith"
    },
    "created_at": "2024-01-01T00:00:00Z"
  },
  "answers": [
    {
      "id": "uuid",
      "body": "First, log into the portal...",
      "author": {
        "id": "uuid",
        "display_name": "Jane Smith"
      },
      "vote_count": 5,
      "is_best_answer": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "comments": [
        {
          "id": "uuid",
          "body": "What if I don't have access?",
          "author": {
            "id": "uuid",
            "display_name": "Bob Johnson"
          },
          "created_at": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-02T00:00:00Z"
}
```

**Note:** This endpoint increments view_count.

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 404 | NOT_FOUND | Question not found |

---

### 5.3 Create Question

**Endpoint:** `POST /questions/`

**Description:** Create a new question.

**Authentication:** Required

**Request Body:**

```json
{
  "title": "How to register for courses?",
  "body": "I'm trying to register for courses for the new semester...",
  "school_hub_id": "uuid",
  "department_id": "uuid",  // Optional
  "tags": ["registration", "courses"]  // Optional
}
```

**Response:** 201 Created (returns question object)

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | INVALID_DATA | Invalid request data |
| 404 | NOT_FOUND | Hub or department not found |
| 403 | FORBIDDEN | User is not authorized to post in this hub |

---

### 5.4 Update Question

**Endpoint:** `PATCH /questions/{question_id}/`

**Description:** Update question title, body, or tags.

**Authentication:** Required (Question author only)

**Request Body:** (All fields optional)

```json
{
  "title": "Updated title",
  "body": "Updated body...",
  "tags": ["registration", "courses", "new"]
}
```

**Response:** 200 OK (returns updated question object)

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 403 | FORBIDDEN | User is not the question author |
| 404 | NOT_FOUND | Question not found |

---

### 5.5 Delete Question

**Endpoint:** `DELETE /questions/{question_id}/`

**Description:** Soft delete question.

**Authentication:** Required (Question author or Admin only)

**Response:** 204 No Content

---

### 5.6 Mark Question as Solved

**Endpoint:** `POST /questions/{question_id}/solved/`

**Description:** Mark question as solved without selecting best answer.

**Authentication:** Required (Question author only)

**Request Body:**

```json
{
  "best_answer_id": "uuid"  // Required to mark solved
}
```

**Response:** 200 OK

```json
{
  "status": "solved",
  "best_answer_id": "uuid"
}
```

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 403 | FORBIDDEN | User is not the question author |
| 404 | NOT_FOUND | Question or answer not found |
| 400 | ANSWER_NOT_FOUND | Answer doesn't belong to this question |

---

## 6. ANSWER ENDPOINTS

### 6.1 Create Answer

**Endpoint:** `POST /questions/{question_id}/answers/`

**Description:** Create an answer to a question.

**Authentication:** Required

**Request Body:**

```json
{
  "body": "First, log into the portal..."
}
```

**Response:** 201 Created

```json
{
  "id": "uuid",
  "body": "First, log into the portal...",
  "author": {
    "id": "uuid",
    "display_name": "Jane Smith"
  },
  "vote_count": 0,
  "is_best_answer": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Note:** If this is the first answer, question status changes to "answered".

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 404 | NOT_FOUND | Question not found |
| 403 | FORBIDDEN | User is not authorized |

---

### 6.2 Update Answer

**Endpoint:** `PATCH /answers/{answer_id}/`

**Description:** Update answer body.

**Authentication:** Required (Answer author only)

**Request Body:**

```json
{
  "body": "Updated answer..."
}
```

**Response:** 200 OK (returns updated answer object)

---

### 6.3 Delete Answer

**Endpoint:** `DELETE /answers/{answer_id}/`

**Description:** Soft delete answer.

**Authentication:** Required (Answer author or Admin only)

**Response:** 204 No Content

---

### 6.4 Mark Best Answer

**Endpoint:** `POST /answers/{answer_id}/best/`

**Description:** Mark an answer as the best answer.

**Authentication:** Required (Question author only)

**Response:** 200 OK

```json
{
  "success": true,
  "question_status": "solved"
}
```

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 403 | FORBIDDEN | User is not the question author |
| 404 | NOT_FOUND | Answer not found |
| 400 | ALREADY_BEST | Answer is already marked as best |

---

## 7. VOTE ENDPOINTS

### 7.1 Vote on Answer

**Endpoint:** `POST /answers/{answer_id}/vote/`

**Description:** Vote on an answer.

**Authentication:** Required

**Request Body:**

```json
{
  "vote_type": "upvote"  // or "downvote"
}
```

**Response:** 200 OK

```json
{
  "vote_type": "upvote",
  "vote_count": 5,
  "user_vote": "upvote"
}
```

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 403 | FORBIDDEN | User is the answer author |
| 400 | ALREADY_VOTED | User already voted on this answer |

---

### 7.2 Remove Vote

**Endpoint:** `DELETE /answers/{answer_id}/vote/`

**Description:** Remove vote on an answer.

**Authentication:** Required

**Response:** 200 OK

```json
{
  "vote_count": 4,
  "user_vote": null
}
```

---

## 8. COMMENT ENDPOINTS

### 8.1 Create Comment

**Endpoint:** `POST /answers/{answer_id}/comments/`

**Description:** Create a comment on an answer.

**Authentication:** Required

**Request Body:**

```json
{
  "body": "What if I don't have access?"
}
```

**Response:** 201 Created

```json
{
  "id": "uuid",
  "body": "What if I don't have access?",
  "author": {
    "id": "uuid",
    "display_name": "Bob Johnson",
    "profile_picture": "https://example.com/image.jpg"
  },
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 8.2 Delete Comment

**Endpoint:** `DELETE /comments/{comment_id}/`

**Description:** Soft delete comment.

**Authentication:** Required (Comment author or Admin only)

**Response:** 204 No Content

---

## 9. TAG ENDPOINTS

### 9.1 List Tags

**Endpoint:** `GET /tags/`

**Description:** Get list of all tags.

**Authentication:** Public

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by tag name |
| limit | integer | Number of tags to return (default: 100) |

**Response:** 200 OK

```json
{
  "count": 50,
  "results": [
    {
      "id": "uuid",
      "name": "registration",
      "question_count": 25
    }
  ]
}
```

---

## 10. SEARCH ENDPOINT

### 10.1 Global Search

**Endpoint:** `GET /search/`

**Description:** Search across all content.

**Authentication:** Public

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (required) |
| type | string | questions/schools (default: questions) |
| hub_id | uuid | Filter by hub |
| department_id | uuid | Filter by department |
| tag | string | Filter by tag |
| status | string | open/answered/solved |
| page | integer | Page number |
| page_size | integer | Items per page |

**Response:** 200 OK

```json
{
  "count": 50,
  "results": [
    {
      "type": "question",
      "id": "uuid",
      "title": "How to register for courses?",
      "body_preview": "...registration process...",
      "score": 0.85,
      "author": {
        "id": "uuid",
        "display_name": "John Doe"
      },
      "school": {
        "id": "uuid",
        "name": "University of Lagos"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## 11. NOTIFICATION ENDPOINTS

### 11.1 List Notifications

**Endpoint:** `GET /notifications/`

**Description:** Get user notifications.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| is_read | boolean | Filter by read status |
| page | integer | Page number |
| page_size | integer | Items per page |

**Response:** 200 OK

```json
{
  "count": 15,
  "unread_count": 3,
  "results": [
    {
      "id": "uuid",
      "type": "new_answer",
      "title": "New answer on your question",
      "body": "Jane Smith answered: To register...",
      "link": "/questions/uuid",
      "is_read": false,
      "metadata": {
        "source_id": "uuid",
        "source_type": "question",
        "actor_name": "Jane Smith"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 11.2 Mark Notification Read

**Endpoint:** `POST /notifications/{notification_id}/read/`

**Description:** Mark notification as read.

**Authentication:** Required

**Response:** 200 OK

```json
{
  "is_read": true
}
```

---

### 11.3 Mark All Notifications Read

**Endpoint:** `POST /notifications/read-all/`

**Description:** Mark all notifications as read.

**Authentication:** Required

**Response:** 200 OK

```json
{
  "marked_count": 5
}
```

---

## 12. MODERATOR ENDPOINTS

### 12.1 List Hub Moderators

**Endpoint:** `GET /hubs/{hub_id}/moderators/`

**Description:** Get list of moderators for a hub.

**Authentication:** Public

**Response:** 200 OK

```json
{
  "results": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "display_name": "Jane Smith",
        "profile_picture": "https://example.com/image.jpg"
      },
      "assigned_by": {
        "id": "uuid",
        "display_name": "John Doe"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 12.2 Assign Moderator (School Representative Only)

**Endpoint:** `POST /hubs/{hub_id}/moderators/`

**Description:** Assign a user as moderator.

**Authentication:** Required (School Representative only)

**Request Body:**

```json
{
  "user_id": "uuid"
}
```

**Response:** 201 Created

```json
{
  "id": "uuid",
  "user": {
    "id": "uuid",
    "display_name": "Jane Smith"
  },
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 12.3 Remove Moderator (School Representative Only)

**Endpoint:** `DELETE /hubs/{hub_id}/moderators/{user_id}/`

**Description:** Remove a user from moderator role.

**Authentication:** Required (School Representative only)

**Response:** 204 No Content

---

## 13. REPORT ENDPOINTS

### 13.1 Create Report

**Endpoint:** `POST /reports/`

**Description:** Report content.

**Authentication:** Required

**Request Body:**

```json
{
  "target_type": "question",  // question/answer/comment
  "target_id": "uuid",
  "reason": "spam",  // spam/abuse/misinformation/duplicate
  "description": "Additional context..."  // Optional
}
```

**Response:** 201 Created

```json
{
  "id": "uuid",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | ALREADY_REPORTED | User already reported this content |
| 404 | NOT_FOUND | Target not found |

---

### 13.2 List Reports (Moderator/Admin)

**Endpoint:** `GET /reports/`

**Description:** Get list of reports.

**Authentication:** Required (Moderator or Admin)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| hub_id | uuid | Filter by hub (moderator only) |
| status | string | pending/resolved/escalated |
| page | integer | Page number |
| page_size | integer | Items per page |

**Response:** 200 OK

```json
{
  "count": 10,
  "results": [
    {
      "id": "uuid",
      "reporter": {
        "id": "uuid",
        "display_name": "Anonymous"
      },
      "target_type": "question",
      "target": {
        "id": "uuid",
        "title": "Question title"
      },
      "reason": "spam",
      "description": "This seems like spam...",
      "status": "pending",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 13.3 Update Report Status (Moderator/Admin)

**Endpoint:** `PATCH /reports/{report_id}/`

**Description:** Update report status.

**Authentication:** Required (Moderator or Admin)

**Request Body:**

```json
{
  "status": "resolved",  // resolved/escalated
  "moderator_notes": "Spam content removed"
}
```

**Response:** 200 OK

```json
{
  "id": "uuid",
  "status": "resolved",
  "moderator_notes": "Spam content removed",
  "resolved_at": "2024-01-01T00:00:00Z"
}
```

---

## 14. SCHOOL REPRESENTATIVE ENDPOINTS

### 14.1 Update School Information

**Endpoint:** `PATCH /hubs/{hub_id}/school-info/`

**Description:** Update school information.

**Authentication:** Required (School Representative only)

**Request Body:** (All fields optional)

```json
{
  "location": "Updated location",
  "website": "https://updated.edu.ng"
}
```

**Response:** 200 OK

```json
{
  "location": "Updated location",
  "website": "https://updated.edu.ng"
}
```

---

### 14.2 Update Hub Information

**Endpoint:** `PATCH /hubs/{hub_id}/`

**Description:** Update hub metadata.

**Authentication:** Required (School Representative only)

**Request Body:** (All fields optional)

```json
{
  "is_active": false  // Deactivate hub
}
```

**Response:** 200 OK (returns updated hub object)

---

## ADMIN ENDPOINTS

### User Management (Admin Only)

#### List Users

**Endpoint:** `GET /admin/users/`

**Description:** Get list of all users.

**Authentication:** Required (Admin only)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by email or display_name |
| is_active | boolean | Filter by active status |
| is_superuser | boolean | Filter by admin status |
| page | integer | Page number |
| page_size | integer | Items per page |

**Response:** 200 OK (returns user list)

---

#### Update User Role

**Endpoint:** `PATCH /admin/users/{user_id}/role/`

**Description:** Update user role.

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "role": "representative",  // admin/representative/moderator/none
  "school_hub_id": "uuid"  // Required for representative/moderator
}
```

**Response:** 200 OK

```json
{
  "user_id": "uuid",
  "role": "representative",
  "school_hub_id": "uuid"
}
```

---

#### Suspend User

**Endpoint:** `POST /admin/users/{user_id}/suspend/`

**Description:** Suspend a user account.

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "reason": "Violation of terms"
}
```

**Response:** 200 OK

```json
{
  "is_active": false,
  "suspended_at": "2024-01-01T00:00:00Z"
}
```

---

#### Reactivate User

**Endpoint:** `POST /admin/users/{user_id}/reactivate/`

**Description:** Reactivate a suspended user.

**Authentication:** Required (Admin only)

**Response:** 200 OK

```json
{
  "is_active": true
}
```

---

### Admin School Management

#### List All Schools

**Endpoint:** `GET /admin/schools/`

**Description:** Get list of all schools with admin details.

**Authentication:** Required (Admin only)

**Response:** 200 OK (returns school list with additional fields)

---

#### Archive School

**Endpoint:** `POST /admin/schools/{school_id}/archive/`

**Description:** Archive a school.

**Authentication:** Required (Admin only)

**Response:** 200 OK

```json
{
  "is_active": false,
  "archived_at": "2024-01-01T00:00:00Z"
}
```

---

## WEBSOCKET EVENTS (Future)

For real-time updates:

| Event | Description | Payload |
|-------|-------------|---------|
| `new_answer` | New answer posted | Answer object |
| `new_comment` | New comment posted | Comment object |
| `vote_update` | Vote count changed | Vote update data |
| `question_status_update` | Question status changed | New status |
| `notification` | New notification | Notification object |

---

## API IMPLEMENTATION NOTES

### Authentication Header

```
Authorization: Bearer <jwt_access_token>
```

### Pagination

All list endpoints support pagination with:
- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20, max: 100)

### Sorting

List endpoints support sorting with:
- `sort` - Field name with optional `-` prefix for descending order

### Filtering

List endpoints support filtering with query parameters as defined above.

### Rate Limiting

| User Type | Limit |
|-----------|-------|
| Unauthenticated | 100 requests/hour |
| Authenticated | 1000 requests/hour |
| Moderator | 2000 requests/hour |

---

## ERROR CODES SUMMARY

| Code | Description |
|------|-------------|
| INVALID_TOKEN | Invalid or expired authentication token |
| INVALID_DATA | Invalid request data |
| NOT_FOUND | Requested resource not found |
| FORBIDDEN | User not authorized for this action |
| ALREADY_VOTED | User already voted on this content |
| ALREADY_REPORTED | User already reported this content |
| ALREADY_BEST | Content is already marked as best |
| ALREADY_ACTIVE | Resource is already active |
| ALREADY_REQUESTED | Request already exists |
| DUPLICATE_NAME | Resource with this name already exists |
| EMAIL_EXISTS | Email already registered |
| ANSWER_NOT_FOUND | Answer doesn't belong to this question |
