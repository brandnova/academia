# API CONTRACT

## Authentication

### Google Login
**Endpoint:** `POST /api/auth/google/`

**Request:**
```json
{
  "access_token": "google_oauth_token"
}
```

**Response (200 OK):**
```json
{
  "access": "jwt_access_token",
  "refresh": "jwt_refresh_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar": "https://lh3.googleusercontent.com/..."
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid Google token"
}
```

---

### Refresh Token
**Endpoint:** `POST /api/auth/refresh/`

**Request:**
```json
{
  "refresh": "jwt_refresh_token"
}
```

**Response (200 OK):**
```json
{
  "access": "new_jwt_access_token"
}
```

---

### Logout
**Endpoint:** `POST /api/auth/logout/`

**Request:** None (requires authentication)

**Response (204 No Content):** Empty

---

## Users

### Get Current User
**Endpoint:** `GET /api/users/me/`

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "avatar": "https://lh3.googleusercontent.com/...",
  "is_admin": false,
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

### Update Current User
**Endpoint:** `PATCH /api/users/me/`

**Request:**
```json
{
  "full_name": "Johnathan Doe"
}
```

**Response (200 OK):** Same as GET `/api/users/me/`

---

## Schools

### List Schools
**Endpoint:** `GET /api/schools/`

**Query Parameters:**
- `search` - Search by name or short_name
- `has_hub` - Filter schools with/without hub (true/false)
- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "count": 100,
  "next": "https://api.academia.com/api/schools/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "name": "University of Lagos",
      "short_name": "UNILAG",
      "location": "Lagos, Nigeria",
      "website": "https://unilag.edu.ng",
      "has_hub": true,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### Get School
**Endpoint:** `GET /api/schools/{school_id}/`

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "University of Lagos",
  "short_name": "UNILAG",
  "location": "Lagos, Nigeria",
  "website": "https://unilag.edu.ng",
  "has_hub": true,
  "departments": [
    {
      "id": "uuid",
      "name": "Computer Science",
      "code": "CSC"
    }
  ],
  "created_at": "2026-01-01T00:00:00Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "School not found"
}
```

---

### Create School (Admin Only)
**Endpoint:** `POST /api/schools/`

**Request:**
```json
{
  "name": "University of Ibadan",
  "short_name": "UI",
  "location": "Ibadan, Nigeria",
  "website": "https://ui.edu.ng"
}
```

**Response (201 Created):** Same as GET `/api/schools/{school_id}/`

---

### Update School (Admin Only)
**Endpoint:** `PATCH /api/schools/{school_id}/`

**Request:** Same as POST, all fields optional

**Response (200 OK):** Same as GET `/api/schools/{school_id}/`

---

## Hubs

### Get Hub
**Endpoint:** `GET /api/hubs/{hub_id}/`

**Response (200 OK):**
```json
{
  "id": "uuid",
  "school": {
    "id": "uuid",
    "name": "University of Lagos",
    "short_name": "UNILAG",
    "location": "Lagos, Nigeria"
  },
  "is_active": true,
  "activated_at": "2026-01-01T00:00:00Z",
  "departments": [
    {
      "id": "uuid",
      "name": "Computer Science",
      "code": "CSC",
      "question_count": 42
    }
  ],
  "question_count": 150,
  "moderator_count": 3
}
```

---

### Get Hub by School
**Endpoint:** `GET /api/hubs/by-school/{school_id}/`

**Response (200 OK):** Same as GET `/api/hubs/{hub_id}/`

**Response (404 Not Found):**
```json
{
  "error": "Hub not found for this school"
}
```

---

### Request Hub Activation
**Endpoint:** `POST /api/hubs/activation-requests/`

**Request:**
```json
{
  "school_id": "uuid",
  "notes": "Our university needs a hub for students"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "school": {
    "id": "uuid",
    "name": "University of Lagos",
    "short_name": "UNILAG"
  },
  "user": {
    "id": "uuid",
    "full_name": "John Doe"
  },
  "status": "PENDING",
  "notes": "Our university needs a hub for students",
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

### List Activation Requests (Admin Only)
**Endpoint:** `GET /api/hubs/activation-requests/`

**Query Parameters:**
- `status` - PENDING/APPROVED/REJECTED
- `page` - Page number

**Response (200 OK):**
```json
{
  "count": 5,
  "results": [
    {
      "id": "uuid",
      "school": {
        "id": "uuid",
        "name": "University of Lagos",
        "short_name": "UNILAG"
      },
      "user": {
        "id": "uuid",
        "full_name": "John Doe"
      },
      "status": "PENDING",
      "notes": "Our university needs a hub for students",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### Approve Activation Request (Admin Only)
**Endpoint:** `POST /api/hubs/activation-requests/{request_id}/approve/`

**Response (200 OK):**
```json
{
  "message": "Hub activated successfully",
  "hub": {
    "id": "uuid",
    "school": {
      "id": "uuid",
      "name": "University of Lagos",
      "short_name": "UNILAG"
    },
    "activated_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### Reject Activation Request (Admin Only)
**Endpoint:** `POST /api/hubs/activation-requests/{request_id}/reject/`

**Request:**
```json
{
  "reason": "School not verified"
}
```

**Response (200 OK):**
```json
{
  "message": "Activation request rejected",
  "status": "REJECTED"
}
```

---

## Departments

### List Departments
**Endpoint:** `GET /api/schools/{school_id}/departments/`

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "uuid",
      "name": "Computer Science",
      "code": "CSC",
      "question_count": 42,
      "is_active": true
    }
  ]
}
```

---

### Create Department (School Representative Only)
**Endpoint:** `POST /api/schools/{school_id}/departments/`

**Request:**
```json
{
  "name": "Data Science",
  "code": "DSC"
}
```

**Response (201 Created):** Same as department object above

---

### Update Department (School Representative Only)
**Endpoint:** `PATCH /api/departments/{department_id}/`

**Request:**
```json
{
  "name": "Computer Science and Engineering",
  "is_active": false
}
```

**Response (200 OK):** Same as department object

---

## Questions

### List Questions
**Endpoint:** `GET /api/questions/`

**Query Parameters:**
- `hub` - Filter by hub ID
- `department` - Filter by department ID
- `status` - OPEN/ANSWERED/SOLVED
- `tag` - Filter by tag name
- `search` - Search in title and body
- `ordering` - created_at/-created_at/views/-views
- `page` - Page number
- `page_size` - Items per page (default: 20, max: 50)

**Response (200 OK):**
```json
{
  "count": 150,
  "next": "https://api.academia.com/api/questions/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "title": "How do I calculate my CGPA?",
      "body": "I'm confused about the grading system...",
      "status": "SOLVED",
      "view_count": 120,
      "author": {
        "id": "uuid",
        "full_name": "John Doe",
        "avatar": "https://..."
      },
      "hub": {
        "id": "uuid",
        "school": {
          "name": "University of Lagos",
          "short_name": "UNILAG"
        }
      },
      "department": {
        "id": "uuid",
        "name": "Computer Science"
      },
      "tags": ["gpa", "grading", "calculation"],
      "answer_count": 3,
      "best_answer_id": "uuid",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### Create Question
**Endpoint:** `POST /api/questions/`

**Request:**
```json
{
  "title": "How do I calculate my CGPA?",
  "body": "I'm confused about the grading system at UNILAG...",
  "hub_id": "uuid",
  "department_id": "uuid",  // optional
  "tags": ["gpa", "grading", "calculation"]
}
```

**Response (201 Created):** Same as GET `/api/questions/{question_id}/`

**Error Responses:**
```json
// 400 Bad Request - Missing required fields
{
  "title": ["This field is required."],
  "body": ["This field is required."],
  "hub_id": ["This field is required."]
}

// 400 Bad Request - Hub doesn't have this department
{
  "department_id": ["Department does not belong to this hub's school."]
}

// 404 Not Found - Hub doesn't exist
{
  "hub_id": ["Hub with ID 'uuid' does not exist."]
}
```

---

### Get Question
**Endpoint:** `GET /api/questions/{question_id}/`

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "How do I calculate my CGPA?",
  "body": "I'm confused about the grading system...",
  "status": "SOLVED",
  "view_count": 120,
  "author": {
    "id": "uuid",
    "full_name": "John Doe",
    "avatar": "https://..."
  },
  "hub": {
    "id": "uuid",
    "school": {
      "id": "uuid",
      "name": "University of Lagos",
      "short_name": "UNILAG"
    }
  },
  "department": {
    "id": "uuid",
    "name": "Computer Science"
  },
  "tags": ["gpa", "grading", "calculation"],
  "answers": [
    {
      "id": "uuid",
      "body": "To calculate your CGPA...",
      "is_best": true,
      "vote_score": 15,
      "author": {
        "id": "uuid",
        "full_name": "Jane Smith",
        "avatar": "https://..."
      },
      "comment_count": 2,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ],
  "answer_count": 3,
  "best_answer_id": "uuid",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Question not found"
}
```

---

### Update Question
**Endpoint:** `PATCH /api/questions/{question_id}/`

**Request:**
```json
{
  "title": "Updated title",
  "body": "Updated body",
  "department_id": "uuid",
  "tags": ["gpa", "updated"]
}
```

**Response (200 OK):** Same as GET `/api/questions/{question_id}/`

**Error Responses:**
```json
// 403 Forbidden - Not the question author
{
  "error": "You do not have permission to edit this question"
}

// 400 Bad Request - Invalid status transition (Open → Solved directly)
{
  "status": ["Cannot transition from OPEN to SOLVED without a best answer."]
}
```

---

### Delete Question
**Endpoint:** `DELETE /api/questions/{question_id}/`

**Response (204 No Content):** Empty

**Error Response (403 Forbidden):**
```json
{
  "error": "You do not have permission to delete this question"
}
```

---

### Get Unanswered Questions (Moderator Only)
**Endpoint:** `GET /api/questions/unanswered/`

**Query Parameters:**
- `hub` - Filter by hub ID
- `page` - Page number

**Response (200 OK):** Same as list questions, but only OPEN status

---

## Answers

### Create Answer
**Endpoint:** `POST /api/answers/`

**Request:**
```json
{
  "question_id": "uuid",
  "body": "To calculate your CGPA, you need to..."
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "body": "To calculate your CGPA, you need to...",
  "question": {
    "id": "uuid",
    "title": "How do I calculate my CGPA?"
  },
  "author": {
    "id": "uuid",
    "full_name": "Jane Smith",
    "avatar": "https://..."
  },
  "is_best": false,
  "vote_score": 0,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "question_id": ["This field is required."],
  "body": ["This field is required."]
}

// 403 Forbidden - Question is already SOLVED
{
  "question": ["Cannot add answer to a solved question."]
}
```

---

### Update Answer
**Endpoint:** `PATCH /api/answers/{answer_id}/`

**Request:**
```json
{
  "body": "Updated answer content"
}
```

**Response (200 OK):** Same as GET answer object

**Error Response (403 Forbidden):**
```json
{
  "error": "You do not have permission to edit this answer"
}
```

---

### Delete Answer
**Endpoint:** `DELETE /api/answers/{answer_id}/`

**Response (204 No Content):** Empty

**Error Response (403 Forbidden):**
```json
{
  "error": "You do not have permission to delete this answer"
}
```

---

### Mark Best Answer
**Endpoint:** `POST /api/answers/{answer_id}/mark-best/`

**Response (200 OK):**
```json
{
  "message": "Answer marked as best",
  "answer": {
    "id": "uuid",
    "is_best": true
  },
  "question": {
    "id": "uuid",
    "status": "SOLVED"
  }
}
```

**Error Responses:**
```json
// 403 Forbidden - Not the question owner
{
  "error": "Only the question owner can mark a best answer"
}

// 400 Bad Request - Answer already marked as best
{
  "error": "This answer is already marked as best"
}
```

---

## Answer Votes

### Vote on Answer
**Endpoint:** `POST /api/answers/{answer_id}/vote/`

**Request:**
```json
{
  "vote_type": "UP"  // or "DOWN"
}
```

**Response (200 OK):**
```json
{
  "message": "Vote recorded",
  "vote_type": "UP",
  "vote_score": 15
}
```

**Error Responses:**
```json
// 400 Bad Request - Already voted
{
  "error": "You have already voted on this answer"
}

// 400 Bad Request - Can't vote on own answer
{
  "error": "You cannot vote on your own answer"
}
```

---

### Remove Vote
**Endpoint:** `DELETE /api/answers/{answer_id}/vote/`

**Response (204 No Content):** Empty

**Error Response (404 Not Found):**
```json
{
  "error": "You have not voted on this answer"
}
```

---

## Comments

### Create Comment
**Endpoint:** `POST /api/comments/`

**Request:**
```json
{
  "answer_id": "uuid",
  "body": "Could you elaborate on the grading scale?"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "body": "Could you elaborate on the grading scale?",
  "author": {
    "id": "uuid",
    "full_name": "John Doe",
    "avatar": "https://..."
  },
  "answer": {
    "id": "uuid"
  },
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

---

### Update Comment
**Endpoint:** `PATCH /api/comments/{comment_id}/`

**Request:**
```json
{
  "body": "Updated comment"
}
```

**Response (200 OK):** Same as comment object

---

### Delete Comment
**Endpoint:** `DELETE /api/comments/{comment_id}/`

**Response (204 No Content):** Empty

---

## Tags

### List Tags
**Endpoint:** `GET /api/tags/`

**Query Parameters:**
- `search` - Search by tag name
- `popular` - Sort by question count (true/false)

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "uuid",
      "name": "gpa",
      "question_count": 25
    },
    {
      "id": "uuid",
      "name": "admission",
      "question_count": 18
    }
  ]
}
```

---

### Get Questions by Tag
**Endpoint:** `GET /api/tags/{tag_name}/questions/`

**Query Parameters:**
- Same as list questions

**Response (200 OK):** Same as list questions

---

## Search

### Search Questions
**Endpoint:** `GET /api/search/questions/`

**Query Parameters:**
- `q` - Search query
- `hub` - Filter by hub ID
- `department` - Filter by department ID
- `tag` - Filter by tag name
- `page` - Page number

**Response (200 OK):**
```json
{
  "count": 45,
  "results": [
    {
      "id": "uuid",
      "title": "How do I calculate my CGPA?",
      "body": "...",
      "status": "SOLVED",
      "score": 0.95,
      "author": {
        "id": "uuid",
        "full_name": "John Doe"
      },
      "hub": {
        "school": {
          "name": "University of Lagos"
        }
      },
      "tags": ["gpa", "grading"],
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

**Note:** Results are ranked by:
1. Solved questions (status=SOLVED) with best answers
2. Highly voted answers
3. Recent content
4. Relevance to search terms

---

## Notifications

### List Notifications
**Endpoint:** `GET /api/notifications/`

**Query Parameters:**
- `is_read` - true/false
- `page` - Page number

**Response (200 OK):**
```json
{
  "count": 25,
  "unread_count": 5,
  "results": [
    {
      "id": "uuid",
      "type": "NEW_ANSWER",
      "message": "Jane Smith answered your question: 'How do I calculate my CGPA?'",
      "is_read": false,
      "related_object_id": "uuid",
      "related_object_type": "question",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### Mark Notification as Read
**Endpoint:** `POST /api/notifications/{notification_id}/mark-read/`

**Response (200 OK):**
```json
{
  "message": "Notification marked as read",
  "is_read": true
}
```

---

### Mark All Notifications as Read
**Endpoint:** `POST /api/notifications/mark-all-read/`

**Response (200 OK):**
```json
{
  "message": "All notifications marked as read",
  "count": 5
}
```

---

## Reports

### Create Report
**Endpoint:** `POST /api/reports/`

**Request:**
```json
{
  "content_type": "question",  // "question", "answer", "comment"
  "content_id": "uuid",
  "type": "SPAM",  // "SPAM", "ABUSE", "MISINFORMATION", "DUPLICATE"
  "description": "This appears to be promotional content"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "content_type": "question",
  "content_id": "uuid",
  "type": "SPAM",
  "description": "This appears to be promotional content",
  "status": "PENDING",
  "created_at": "2026-01-01T00:00:00Z"
}
```

**Error Responses:**
```json
// 400 Bad Request - Already reported by this user
{
  "error": "You have already reported this content"
}
```

---

### List Reports (Admin Only)
**Endpoint:** `GET /api/reports/`

**Query Parameters:**
- `status` - PENDING/RESOLVED/REJECTED
- `page` - Page number

**Response (200 OK):**
```json
{
  "count": 10,
  "results": [
    {
      "id": "uuid",
      "content_type": "question",
      "content_id": "uuid",
      "type": "SPAM",
      "description": "This appears to be promotional content",
      "status": "PENDING",
      "reporter": {
        "id": "uuid",
        "full_name": "John Doe"
      },
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### Resolve Report (Admin Only)
**Endpoint:** `POST /api/reports/{report_id}/resolve/`

**Request:**
```json
{
  "action": "DELETE_CONTENT"  // "DELETE_CONTENT", "WARN_USER", "BAN_USER", "DISMISS"
}
```

**Response (200 OK):**
```json
{
  "message": "Report resolved",
  "status": "RESOLVED",
  "action_taken": "DELETE_CONTENT",
  "resolved_at": "2026-01-01T00:00:00Z"
}
```

---

### Reject Report (Admin Only)
**Endpoint:** `POST /api/reports/{report_id}/reject/`

**Response (200 OK):**
```json
{
  "message": "Report rejected",
  "status": "REJECTED",
  "resolved_at": "2026-01-01T00:00:00Z"
}
```

---

## Moderation

### Assign Moderator (School Representative Only)
**Endpoint:** `POST /api/hubs/{hub_id}/moderators/`

**Request:**
```json
{
  "user_id": "uuid"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "user": {
    "id": "uuid",
    "full_name": "Jane Smith",
    "avatar": "https://..."
  },
  "hub": {
    "id": "uuid"
  },
  "is_active": true,
  "created_at": "2026-01-01T00:00:00Z"
}
```

**Error Responses:**
```json
// 400 Bad Request - Already a moderator
{
  "error": "User is already a moderator for this hub"
}

// 404 Not Found - User doesn't exist
{
  "user_id": ["User with ID 'uuid' does not exist."]
}
```

---

### Remove Moderator (School Representative Only)
**Endpoint:** `DELETE /api/hubs/{hub_id}/moderators/{user_id}/`

**Response (204 No Content):** Empty

---

### List Moderators
**Endpoint:** `GET /api/hubs/{hub_id}/moderators/`

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "full_name": "Jane Smith",
        "avatar": "https://..."
      },
      "assigned_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

## School Representatives

### Assign School Representative (Admin Only)
**Endpoint:** `POST /api/hubs/{hub_id}/representatives/`

**Request:**
```json
{
  "user_id": "uuid"
}
```

**Response (201 Created):** Same as moderator assignment

---

### Remove School Representative (Admin Only)
**Endpoint:** `DELETE /api/hubs/{hub_id}/representatives/{user_id}/`

**Response (204 No Content):** Empty

---

## Error Formats

### 400 Bad Request
```json
{
  "field_name": ["Error message"]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication credentials were not provided"
}
```

### 403 Forbidden
```json
{
  "error": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 405 Method Not Allowed
```json
{
  "error": "Method not allowed for this endpoint"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "An unexpected error occurred"
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Authentication (login/refresh) | 10 requests per minute |
| Question creation | 30 requests per hour |
| Answer creation | 50 requests per hour |
| Comment creation | 50 requests per hour |
| Voting | 100 requests per hour |
| Search | 60 requests per minute |
| Reports | 10 requests per hour |
| General API | 100 requests per minute |

---

## Pagination

All list endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

Response includes:
- `count`: Total number of items
- `next`: URL to next page (or null)
- `previous`: URL to previous page (or null)
- `results`: Array of items
