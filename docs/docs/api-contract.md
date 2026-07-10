# API CONTRACT

## Versioning

All endpoints below are namespaced under `/api/v1/`. For example, `GET /api/schools/`
in this document means `GET /api/v1/schools/`. Breaking changes will ship under a new
version prefix (`/api/v2/`); `/api/v1/` will be maintained for a documented
deprecation window once a v2 exists.

## Authentication Modes

- **User auth** - JWT bearer token, obtained via the Google login flow below. Used by
  the frontend and any user-driven action.
- **API client auth** (Future) - `X-API-Key` header, used by registered third-party
  consumers hitting public read-only endpoints. Not available in MVP.

---

## Health Check

### Health Check
**Endpoint:** `GET /api/v1/health/`

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "academia-backend",
  "checks": {
    "database": "ok",
    "cache": "ok"
  },
  "timestamp": "2026-01-01T00:00:00Z"
}
```

No authentication required. `status` is `"degraded"` if the database is
unreachable, a cache outage alone does not count as degraded, caching is
designed to fail open (see project-plan.md). Useful for uptime monitoring and
load balancer health checks, not intended for frontend application logic.

---

## Authentication

### How Google Auth Works (Frontend Implementation Guide)

This backend does **not** use Django's full server-side social-auth flow. Instead,
the frontend obtains a Google **access token** directly using Google Identity
Services, then hands that token to our backend, which verifies it by calling
Google's own `userinfo` endpoint. This means: no client secret on the backend, no
redirect-based OAuth dance, and a small, predictable request/response contract.

**One-time setup (Google Cloud Console):**
1. Create a project (or use an existing one) at console.cloud.google.com.
2. Configure the OAuth consent screen (External, testing or published as needed).
3. Create an OAuth 2.0 Client ID of type **Web application**.
4. Add your frontend's origin(s) under **Authorized JavaScript origins**
   (e.g. `http://localhost:3000`, and your production domain later).
5. You only need the **Client ID** on the frontend, no client secret is used
   anywhere in this flow.

**Frontend flow, step by step:**
1. Load Google's Identity Services script:
   `<script src="https://accounts.google.com/gsi/client" async defer></script>`
2. Initialize a token client with your Client ID and the scopes
   `email profile`:
```js
   const client = google.accounts.oauth2.initTokenClient({
     client_id: "YOUR_CLIENT_ID.apps.googleusercontent.com",
     scope: "email profile",
     callback: (tokenResponse) => {
       // tokenResponse.access_token is what you send to our backend
     },
   });
```
3. On your "Sign in with Google" button click, call `client.requestAccessToken()`.
   This opens Google's consent popup and returns an `access_token` in the callback.
4. POST that token to our backend:
   `POST /api/v1/auth/google/` with body `{ "access_token": "<token_from_step_3>" }`.
5. Our backend verifies the token against Google, creates the user if this is their
   first login, and returns our own JWT pair (`access`/`refresh`) plus the user
   object, see the endpoint spec below.
6. Store the JWT pair (httpOnly cookie is preferred once you're past local dev,
   in-memory/localStorage is fine for early development) and attach
   `Authorization: Bearer <access>` to every subsequent authenticated request.
7. When a request comes back `401` because the access token expired, call
   `POST /api/v1/auth/refresh/` with the stored refresh token to get a new access
   token, see below. Note refresh tokens rotate on use, so store the new one
   returned each time.
8. On logout, POST the current refresh token to `/api/v1/auth/logout/` (this
   blacklists it server-side) and clear locally stored tokens.

This is the entire flow, there's no separate "callback URL" or server-rendered
redirect page to build, it's a client-side popup plus one API call.

Login and token refresh are both rate limited to 10 requests per minute per client
(see Rate Limits below), to slow down credential-stuffing style abuse.

### Google Login
**Endpoint:** `POST /api/v1/auth/google/`

**Request:**
```json
{
  "access_token": "google_oauth_access_token"
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

Behavior notes: first login for an email creates the `User` record automatically
(no separate signup step); subsequent logins reuse the same user and refresh
`full_name`/`avatar` from Google if they've changed.

---

### Refresh Token
**Endpoint:** `POST /api/v1/auth/refresh/`

**Request:**
```json
{
  "refresh": "jwt_refresh_token"
}
```

**Response (200 OK):**
```json
{
  "access": "new_jwt_access_token",
  "refresh": "new_jwt_refresh_token"
}
```

Refresh tokens rotate on every use and the previous one is blacklisted, always
store whichever refresh token was most recently issued.

---

### Logout
**Endpoint:** `POST /api/v1/auth/logout/`

**Request:**
```json
{
  "refresh": "jwt_refresh_token"
}
```

**Response (204 No Content):** Empty

Blacklists the given refresh token server-side, it can no longer be used to
obtain new access tokens.

---

## Users

### Get Current User
**Endpoint:** `GET /api/v1/users/me/`

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "avatar": "https://lh3.googleusercontent.com/...",
  "is_admin": false,
  "moderator_for": [
    {
      "hub_id": "uuid",
      "school": { "id": "uuid", "name": "University of Lagos", "slug": "unilag" }
    }
  ],
  "representative_for": [
    {
      "hub_id": "uuid",
      "school": { "id": "uuid", "name": "University of Lagos", "slug": "unilag" }
    }
  ],
  "created_at": "2026-01-01T00:00:00Z"
}
```

`moderator_for` and `representative_for` list every hub (with its school) where
this user currently holds an active assignment. Both are empty arrays for a
user with no such assignments. This same shape is also returned in the `user`
field of the Google Login response. See "Frontend Permission Model" below for
how to use these fields.

---

### Update Current User
**Endpoint:** `PATCH /api/v1/users/me/`

**Request:**
```json
{
  "full_name": "Johnathan Doe"
}
```

**Response (200 OK):** Same as GET `/api/v1/users/me/`

---

## Frontend Permission Model

The API enforces every permission independently, server-side, on every write.
The fields described here exist purely so the frontend can show or hide the
right links, buttons, and forms without guessing, they are a UX convenience,
not a substitute for backend enforcement, hiding a button never replaces the
403 a user would get if they attempted the action directly.

### Roles

- **User**: any authenticated account. Can ask/answer/comment/vote/report/
  request a hub.
- **Moderator**: a User with an active entry in that hub's `moderator_for`.
  Can additionally see that hub's unanswered-questions queue.
- **School Representative**: a User with an active entry in that hub's
  `representative_for`. Can additionally manage departments for that hub's
  school, and assign/remove moderators for that hub.
- **Admin**: `is_admin: true`. Implicitly satisfies every Moderator and
  Representative check for every hub, in addition to admin-only actions
  (approve/reject hub activations, manage schools, assign representatives,
  resolve reports, manage users). An admin's `moderator_for`/
  `representative_for` arrays are not artificially populated with every hub,
  `is_admin` alone is the signal to check for blanket access.

### How a user gets a role

There is no self-service way to become a Moderator or Representative. An
admin assigns both explicitly:
- `POST /hubs/{hub_id}/representatives/` (admin only) makes a user a
  Representative for that hub.
- `POST /hubs/{hub_id}/moderators/` (admin, or an existing Representative for
  that hub) makes a user a Moderator for that hub.

The newly assigned user does not see this reflected until their next
`GET /users/me/` call picks up the new `moderator_for`/`representative_for`
entry, there is currently no push notification for this (`MODERATOR_ASSIGNED`
exists as a notification type but has no trigger wired to it yet, tracked in
feature-list.md). Refetch the current user after login and when navigating
into a school or hub the person might administer, rather than relying on it
updating automatically mid-session.

### Deriving what to show

Given the current user's `moderator_for`/`representative_for`/`is_admin`, and
a specific school or hub the person is viewing:

| Show this... | ...when |
|---|---|
| "Ask a question" | any authenticated user |
| "Request hub activation" | any authenticated user, on a school with `has_hub: false` |
| "Manage departments" (create/edit) for a school | `is_admin` is `true`, OR that school's `id` appears in `representative_for[].school.id` |
| "Assign / remove moderators" for a hub | `is_admin` is `true`, OR that hub's `id` appears in `representative_for[].hub_id` |
| "Assign / remove representatives" for a hub | `is_admin` is `true` only |
| "Unanswered questions" queue link, scoped to a hub | `is_admin` is `true`, OR that hub's `id` appears in `moderator_for[].hub_id` |
| Admin dashboard (schools, activation requests, reports, users) | `is_admin` is `true` only |

Matching against `representative_for[].school.id` directly (rather than
resolving a hub id first) is the fastest way to check department-management
access for a school page, since the school's own `id` is already on hand
wherever a school is being displayed.

---

## Schools

### List Schools
**Endpoint:** `GET /api/v1/schools/`

**Query Parameters:**
- `search` - Search by name or short_name
- `has_hub` - Filter schools with/without hub (true/false)
- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "count": 100,
  "next": "https://api.academia.com/api/v1/schools/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "name": "University of Lagos",
      "short_name": "UNILAG",
      "slug": "unilag",
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
**Endpoint:** `GET /api/v1/schools/{school_id}/`

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "University of Lagos",
  "short_name": "UNILAG",
  "slug": "unilag",
  "location": "Lagos, Nigeria",
  "website": "https://unilag.edu.ng",
  "has_hub": true,
  "verification_status": "VERIFIED",
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

### Get School by Slug
**Endpoint:** `GET /api/v1/schools/by-slug/{slug}/`

**Response (200 OK):** Same as GET `/api/v1/schools/{school_id}/`

**Response (404 Not Found):**
```json
{
  "error": "School not found"
}
```

This is an additive lookup path alongside the existing UUID-based one, both remain
valid indefinitely. `slug` is generated once at creation from `short_name` and never
regenerated, so a bookmarked or shared URL never breaks even if `short_name` changes
later.

---

### Create School (Admin Only)
**Endpoint:** `POST /api/v1/schools/`

**Request:**
```json
{
  "name": "University of Ibadan",
  "short_name": "UI",
  "location": "Ibadan, Nigeria",
  "website": "https://ui.edu.ng"
}
```

**Response (201 Created):** Same as GET `/api/v1/schools/{school_id}/`

---

### Update School (Admin Only)
**Endpoint:** `PATCH /api/v1/schools/{school_id}/`

**Request:** Same as POST, all fields optional

**Response (200 OK):** Same as GET `/api/v1/schools/{school_id}/`

---

### Delete School (Admin Only)
There is no dedicated `DELETE` endpoint. "Deleting" a school is a soft-delete,
send `PATCH /api/v1/schools/{school_id}/` with `{"is_active": false}`. This keeps
foreign-key relationships (hubs, questions, etc.) intact rather than orphaning
them, and is easily reversible. A deactivated school is excluded from list/detail
responses for non-admins.

---

## Hubs

### Get Hub
**Endpoint:** `GET /api/v1/hubs/{hub_id}/`

**Response (200 OK):**
```json
{
  "id": "uuid",
  "school": {
    "id": "uuid",
    "name": "University of Lagos",
    "short_name": "UNILAG",
    "slug": "unilag",
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

**Response (404 Not Found):**
```json
{
  "error": "Hub not found"
}
```

---

### Get Hub by School
**Endpoint:** `GET /api/v1/hubs/by-school/{school_id}/`

**Response (200 OK):** Same as GET `/api/v1/hubs/{hub_id}/`

**Response (404 Not Found):**
```json
{
  "error": "Hub not found for this school"
}
```

---

### Request Hub Activation
**Endpoint:** `POST /api/v1/hubs/activation-requests/`

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
    "short_name": "UNILAG",
    "slug": "unilag",
    "location": "Lagos, Nigeria"
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

**Error Responses:**
```json
// 400 Bad Request - School already has an active hub
{
  "school_id": ["This school already has an active hub."]
}

// 400 Bad Request - A pending request already exists for this school
{
  "school_id": ["There is already a pending activation request for this school."]
}

// 400 Bad Request - School doesn't exist
{
  "school_id": ["School not found."]
}
```

A new request is blocked if the target school already has an active hub, or if a
`PENDING` request for that school already exists, this prevents duplicate/spam
requests from piling up before an admin reviews the first one.

---

### List Activation Requests (Admin Only)
**Endpoint:** `GET /api/v1/hubs/activation-requests/`

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
**Endpoint:** `POST /api/v1/hubs/activation-requests/{request_id}/approve/`

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

Approving sends the requesting user a `HUB_ACTIVATED` notification (in-app and
email).

---

### Reject Activation Request (Admin Only)
**Endpoint:** `POST /api/v1/hubs/activation-requests/{request_id}/reject/`

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
**Endpoint:** `GET /api/v1/schools/{school_id}/departments/`

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

This endpoint is not paginated, it returns every active department for the
school in one response.

---

### Create Department (School Representative or Admin)
**Endpoint:** `POST /api/v1/schools/{school_id}/departments/`

**Request:**
```json
{
  "name": "Data Science",
  "code": "DSC"
}
```

**Response (201 Created):** Same as department object above

**Error Response (403 Forbidden):**
```json
{
  "error": "You do not have permission to perform this action"
}
```

Requires an active `SchoolRepresentativeAssignment` for this school's hub, or
platform admin status.

---

### Update Department (School Representative or Admin)
**Endpoint:** `PATCH /api/v1/departments/{department_id}/`

**Request:**
```json
{
  "name": "Computer Science and Engineering",
  "is_active": false
}
```

**Response (200 OK):** Same as department object

Same permission requirement as Create Department above.

---

## Questions

### List Questions
**Endpoint:** `GET /api/v1/questions/`

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
  "next": "https://api.academia.com/api/v1/questions/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "title": "How do I calculate my CGPA?",
      "slug": "how-do-i-calculate-my-cgpa",
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
          "short_name": "UNILAG",
          "slug": "unilag"
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
**Endpoint:** `POST /api/v1/questions/`

Rate limited to 30 requests per hour per user (see Rate Limits below).

**Request:**
```json
{
  "title": "How do I calculate my CGPA?",
  "slug": "how-do-i-calculate-my-cgpa",
  "body": "I'm confused about the grading system at UNILAG...",
  "hub_id": "uuid",
  "department_id": "uuid",
  "tags": ["gpa", "grading", "calculation"]
}
```

**Response (201 Created):** Same as GET `/api/v1/questions/{question_id}/`

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

// 400 Bad Request - Hub doesn't exist
{
  "hub_id": ["Hub with ID 'uuid' does not exist."]
}
```

---

### Get Question
**Endpoint:** `GET /api/v1/questions/{question_id}/`

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "How do I calculate my CGPA?",
  "slug": "how-do-i-calculate-my-cgpa",
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
**Endpoint:** `PATCH /api/v1/questions/{question_id}/`

**Request:**
```json
{
  "title": "Updated title",
  "slug": "updated-slug",
  "body": "Updated body",
  "department_id": "uuid",
  "tags": ["gpa", "updated"]
}
```

**Response (200 OK):** Same as GET `/api/v1/questions/{question_id}/`

**Error Response (403 Forbidden):**
```json
{
  "error": "You do not have permission to edit this question"
}
```

Note: 
- `status` is not an editable field on this endpoint. It only changes as a side
effect of other actions: creating the first answer moves a question from OPEN to
ANSWERED, marking a best answer moves it to SOLVED, and deleting answers can move it
back to ANSWERED or OPEN depending on what remains (see Delete Answer below).
- `slug` on Question is purely cosmetic, meant for building readable URLs like
`/questions/{id}/{slug}`, it is not unique and is not used for lookups. Editing a
question's title regenerates its slug.

---

### Delete Question
**Endpoint:** `DELETE /api/v1/questions/{question_id}/`

**Response (204 No Content):** Empty

**Error Response (403 Forbidden):**
```json
{
  "error": "You do not have permission to delete this question"
}
```

---

### Get Unanswered Questions (Moderator or Admin)
**Endpoint:** `GET /api/v1/questions/unanswered/`

**Query Parameters:**
- `hub` - Filter by hub ID
- `page` - Page number

**Response (200 OK):** Same as list questions, but only OPEN status

**Error Response (403 Forbidden):**
```json
{
  "error": "You do not have permission to view unanswered questions"
}
```

A platform admin sees unanswered questions across every hub. A user with an active
`ModeratorAssignment` sees only questions belonging to hub(s) they are assigned to
moderate. A user with neither is blocked with a 403.

---

## Answers

### Create Answer
**Endpoint:** `POST /api/v1/answers/`

Rate limited to 50 requests per hour per user (see Rate Limits below).

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

// 400 Bad Request - Question is already SOLVED
{
  "question": ["Cannot add answer to a solved question."]
}
```

Answering someone else's question sends them a `NEW_ANSWER` notification (in-app
and email).

---

### Update Answer
**Endpoint:** `PATCH /api/v1/answers/{answer_id}/`

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
**Endpoint:** `DELETE /api/v1/answers/{answer_id}/`

**Response (204 No Content):** Empty

**Error Response (403 Forbidden):**
```json
{
  "error": "You do not have permission to delete this answer"
}
```

If the deleted answer was the question's best answer and other answers remain, the
question's status reverts from SOLVED to ANSWERED. If it was the last remaining
answer on the question, status reverts to OPEN.

---

### Mark Best Answer
**Endpoint:** `POST /api/v1/answers/{answer_id}/mark-best/`

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

Marking a different answer as best on an already-solved question transfers the
best-answer flag to the new answer and leaves the question SOLVED. Only marking the
same answer that is already best is blocked. If the newly marked answer belongs to
someone other than the question owner, they receive a `BEST_ANSWER` notification
(in-app and email).

---

## Answer Votes

### Vote on Answer
**Endpoint:** `POST /api/v1/answers/{answer_id}/vote/`

Rate limited to 100 requests per hour per user, shared with Remove Vote below (see
Rate Limits below).

**Request:**
```json
{
  "vote_type": "UP"
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

Voting sends the answer's author a `VOTE` notification, in-app only, no email.
There is no dedicated "change my vote" endpoint, remove your existing vote first,
then vote again with the new type.

---

### Remove Vote
**Endpoint:** `DELETE /api/v1/answers/{answer_id}/vote/`

**Response (204 No Content):** Empty

**Error Response (404 Not Found):**
```json
{
  "error": "You have not voted on this answer"
}
```

---

## Comments

### List Comments
**Endpoint:** `GET /api/v1/answers/{answer_id}/comments/`

**Response (200 OK):**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "body": "Does this vary by school?",
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
  ]
}
```

**Response (404 Not Found):**
```json
{
  "error": "Answer not found"
}
```

### Create Comment
**Endpoint:** `POST /api/v1/comments/`

Rate limited to 50 requests per hour per user (see Rate Limits below).

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

Commenting on someone else's answer sends them a `NEW_COMMENT` notification,
in-app only, no email.

---

### Update Comment
**Endpoint:** `PATCH /api/v1/comments/{comment_id}/`

**Request:**
```json
{
  "body": "Updated comment"
}
```

**Response (200 OK):** Same as comment object

---

### Delete Comment
**Endpoint:** `DELETE /api/v1/comments/{comment_id}/`

**Response (204 No Content):** Empty

---

## Tags

### List Tags
**Endpoint:** `GET /api/v1/tags/`

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

This endpoint is not paginated, it returns every matching tag in one response.
Tag names are normalized to lowercase everywhere, on creation, search, and every
filter, so "GPA" and "gpa" are always treated as the same tag.

---

### Get Questions by Tag
**Endpoint:** `GET /api/v1/tags/{tag_name}/questions/`

**Query Parameters:**
- Same as list questions

**Response (200 OK):** Same as list questions. A tag name with no matching
questions returns `200 OK` with an empty result set, not a 404, consistent with
how every other query-param filter on this API behaves.

---

## Search

### Search Questions
**Endpoint:** `GET /api/v1/search/questions/`

Rate limited to 60 requests per minute (see Rate Limits below).

**Query Parameters:**
- `q` - Search query
- `hub` - Filter by hub ID
- `school` - Filter by school ID
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
      "score": 0.4213,
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

`score` is a raw PostgreSQL `ts_rank` value, higher means more textually relevant,
but it has no fixed upper bound (it is not a normalized 0 to 1 percentage). It is
`null` whenever `q` is omitted, since relevance has no meaning without a query to
rank against, in that case results still return, ordered by the first three
ranking priorities above.

---

## Notifications

### List Notifications
**Endpoint:** `GET /api/v1/notifications/`

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

`related_object_type`/`related_object_id` are serialized from the underlying
ContentType-based generic relation (see database-schema.md), the JSON shape
doesn't change even as new notifiable models are added.

**Notification types currently triggered:** `NEW_ANSWER` (email and in-app),
`BEST_ANSWER` (email and in-app), `HUB_ACTIVATED` (email and in-app),
`NEW_COMMENT` (in-app only), `VOTE` (in-app only). `MODERATOR_ASSIGNED` exists as
a type but has no trigger wired to it yet.

---

### Mark Notification as Read
**Endpoint:** `POST /api/v1/notifications/{notification_id}/mark-read/`

**Response (200 OK):**
```json
{
  "message": "Notification marked as read",
  "is_read": true
}
```

**Error Responses:**
```json
// 403 Forbidden - Not your notification
{
  "error": "You do not have permission to modify this notification"
}

// 404 Not Found
{
  "error": "Notification not found"
}
```

---

### Mark All Notifications as Read
**Endpoint:** `POST /api/v1/notifications/mark-all-read/`

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
**Endpoint:** `POST /api/v1/reports/`

Rate limited to 10 requests per hour per user (see Rate Limits below).

**Request:**
```json
{
  "content_type": "question",
  "content_id": "uuid",
  "type": "SPAM",
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

`content_type`/`content_id` are serialized from the underlying ContentType-based
generic relation (see database-schema.md), the JSON shape stays stable even as
new reportable models (e.g. SchoolReview) are added later. Supported values for
`content_type` are `question`, `answer`, and `comment`.

**Error Responses:**
```json
// 400 Bad Request - Already reported by this user
{
  "error": "You have already reported this content"
}

// 400 Bad Request - Invalid content_type
{
  "content_type": ["content_type must be one of: question, answer, comment."]
}

// 400 Bad Request - No matching content
{
  "content_id": ["No matching content found for this content_type and content_id."]
}
```

A user cannot report the same piece of content more than once, this restriction
applies regardless of whether an earlier report on that content was resolved or
rejected.

---

### List Reports (Admin Only)
**Endpoint:** `GET /api/v1/reports/`

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
**Endpoint:** `POST /api/v1/reports/{report_id}/resolve/`

**Request:**
```json
{
  "action": "DELETE_CONTENT"
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

**Error Response (400 Bad Request):**
```json
{
  "error": "This report has already been reviewed"
}
```

`action: "DELETE_CONTENT"` is the only value with special behavior, it deletes the
underlying reported object. Any other value, or omitting `action` entirely, resolves
the report without taking any action on the content itself, useful when a report is
valid to acknowledge but doesn't warrant removal.

---

### Reject Report (Admin Only)
**Endpoint:** `POST /api/v1/reports/{report_id}/reject/`

**Response (200 OK):**
```json
{
  "message": "Report rejected",
  "status": "REJECTED",
  "resolved_at": "2026-01-01T00:00:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "This report has already been reviewed"
}
```

---

## Moderation

### Assign Moderator (School Representative or Admin)
**Endpoint:** `POST /api/v1/hubs/{hub_id}/moderators/`

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

// 403 Forbidden - Not a representative for this hub, and not an admin
{
  "error": "You do not have permission to perform this action"
}

// 404 Not Found - User doesn't exist
{
  "user_id": ["User with ID 'uuid' does not exist."]
}
```

Requires an active `SchoolRepresentativeAssignment` for this hub, or platform
admin status.

---

### Remove Moderator (School Representative or Admin)
**Endpoint:** `DELETE /api/v1/hubs/{hub_id}/moderators/{user_id}/`

**Response (204 No Content):** Empty

**Error Response (404 Not Found):**
```json
{
  "error": "Moderator assignment not found"
}
```

Removal is a soft-delete (`is_active: false`), not a hard row delete.

---

### List Moderators
**Endpoint:** `GET /api/v1/hubs/{hub_id}/moderators/`

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
      "hub": {
        "id": "uuid"
      },
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

This endpoint is public, no authentication required. It is not paginated, it
returns every active moderator for the hub in one response.

---

## School Representatives

### Assign School Representative (Admin Only)
**Endpoint:** `POST /api/v1/hubs/{hub_id}/representatives/`

**Request:**
```json
{
  "user_id": "uuid"
}
```

**Response (201 Created):** Same shape as moderator assignment above

**Error Responses:**
```json
// 400 Bad Request - Already a representative
{
  "error": "User is already a representative for this hub"
}

// 404 Not Found - User doesn't exist
{
  "user_id": ["User with ID 'uuid' does not exist."]
}
```

---

### List Representatives
**Endpoint:** `GET /api/v1/hubs/{hub_id}/representatives/`

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
      "hub": {
        "id": "uuid"
      },
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

This endpoint is public, no authentication required, matching List Moderators.
It is not paginated, it returns every active representative for the hub in
one response.

---

### Remove School Representative (Admin Only)
**Endpoint:** `DELETE /api/v1/hubs/{hub_id}/representatives/{user_id}/`

**Response (204 No Content):** Empty

**Error Response (404 Not Found):**
```json
{
  "error": "Representative assignment not found"
}
```

Removal is a soft-delete (`is_active: false`), not a hard row delete.

---

## User Administration

### List Users (Admin Only)
**Endpoint:** `GET /api/v1/admin/users/`

**Query Parameters:**
- `search` - Search by email or full_name
- `is_active` - Filter by account active status (true/false)
- `page` - Page number

**Response (200 OK):**
```json
{
  "count": 500,
  "next": "https://api.academia.com/api/v1/admin/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "avatar": "https://...",
      "is_admin": false,
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### Get User (Admin Only)
**Endpoint:** `GET /api/v1/admin/users/{user_id}/`

**Response (200 OK):** Same shape as a single result above

**Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

---

### Suspend or Reactivate User (Admin Only)
**Endpoint:** `PATCH /api/v1/admin/users/{user_id}/`

**Request:**
```json
{
  "is_active": false
}
```

**Response (200 OK):** Same shape as Get User above

**Error Response (400 Bad Request):**
```json
{
  "error": "You cannot suspend your own account"
}
```

This endpoint only accepts `is_active`. Promoting or demoting `is_admin` status is
not available through this endpoint in the MVP. An admin cannot suspend their own
account, to prevent accidental lockout.

---

## API Clients (Future, Public API Phase)

### Register API Client (Admin Only)
**Endpoint:** `POST /api/v1/admin/api-clients/`

**Request:**
```json
{
  "name": "ThirdPartyApp",
  "scopes": ["schools:read", "questions:read"],
  "rate_limit_tier": "STANDARD"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "ThirdPartyApp",
  "key_prefix": "ac_live_ab12",
  "secret": "shown_only_once_here",
  "scopes": ["schools:read", "questions:read"],
  "rate_limit_tier": "STANDARD",
  "created_at": "2026-01-01T00:00:00Z"
}
```
The `secret` is shown once at creation only, only a hash is stored.

### Revoke API Client (Admin Only)
**Endpoint:** `POST /api/v1/admin/api-clients/{client_id}/revoke/`

**Response (200 OK):**
```json
{ "message": "API client revoked", "revoked_at": "2026-01-01T00:00:00Z" }
```

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

## ID Format Validation

Every path parameter that identifies a resource (school, hub, question, answer,
comment, notification, report, department, activation request, user) is validated
as a well-formed UUID before any lookup happens. A malformed ID (wrong length,
invalid characters, etc.) returns a 400, distinct from a well-formed ID that simply
doesn't match anything, which still returns the resource's documented 404.

**Response (400 Bad Request):**
```json
{
  "error": "Invalid ID format"
}
```

---

## Rate Limits

Rate limits are enforced, not just documented. Limits are tracked per authenticated
user where the request carries a valid access token, and per IP address for
anonymous requests.

| Endpoint | Limit |
|----------|-------|
| Authentication (login/refresh) | 10 requests per minute |
| Question creation | 30 requests per hour |
| Answer creation | 50 requests per hour |
| Comment creation | 50 requests per hour |
| Voting (vote and remove-vote combined) | 100 requests per hour |
| Search | 60 requests per minute |
| Reports | 10 requests per hour |
| General API (everything else) | 100 requests per minute |

The scoped limits above (authentication, question/answer/comment creation, voting,
search, reports) apply in place of the general limit for that specific action, not
in addition to it. Reading data (GET requests) is never subject to the tighter
write-action limits, only the general 100 per minute baseline applies to reads.

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
