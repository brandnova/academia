# DATABASE SCHEMA

## Models

### User
Represents an authenticated user on the platform.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| email | String | Unique, Required | User email address |
| full_name | String | Required | User's full name |
| avatar | String | Nullable | URL to avatar image (from Google) |
| is_active | Boolean | Default: True | Account active status |
| is_admin | Boolean | Default: False | Platform administrator flag |
| created_at | DateTime | Auto now | Account creation timestamp |
| updated_at | DateTime | Auto now | Last update timestamp |

### School
Represents an educational institution.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| name | String | Unique, Required | Full institution name |
| short_name | String | Unique, Required | Abbreviated name |
| location | String | Nullable | City/State location |
| website | String | Nullable | Official website URL |
| is_active | Boolean | Default: True | School active status |
| created_at | DateTime | Auto now | Creation timestamp |
| updated_at | DateTime | Auto now | Last update timestamp |

### Department
Represents an academic department within a school.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| school | ForeignKey(School) | Required, CASCADE | Parent school |
| name | String | Required | Department name |
| code | String | Nullable | Department code |
| is_active | Boolean | Default: True | Department active status |
| created_at | DateTime | Auto now | Creation timestamp |
| updated_at | DateTime | Auto now | Last update timestamp |

### Hub
Represents the community space for a school. One-to-one with School.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| school | OneToOneField(School) | Required, CASCADE | Associated school |
| is_active | Boolean | Default: True | Hub active status |
| activated_at | DateTime | Nullable | Activation timestamp |
| created_at | DateTime | Auto now | Creation timestamp |
| updated_at | DateTime | Auto now | Last update timestamp |

### HubActivationRequest
Represents a user request to activate a hub.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| school | ForeignKey(School) | Required, CASCADE | School being requested |
| user | ForeignKey(User) | Required, CASCADE | User who requested |
| status | Enum | Default: PENDING | PENDING/APPROVED/REJECTED |
| notes | Text | Nullable | Additional notes from user |
| reviewed_by | ForeignKey(User) | Nullable | Admin who reviewed |
| reviewed_at | DateTime | Nullable | Review timestamp |
| created_at | DateTime | Auto now | Creation timestamp |
| updated_at | DateTime | Auto now | Last update timestamp |

### Question
Represents a question asked by a user.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| title | String | Required | Question title |
| body | Text | Required | Question content |
| author | ForeignKey(User) | Required, CASCADE | Question creator |
| hub | ForeignKey(Hub) | Required, CASCADE | School hub |
| department | ForeignKey(Department) | Nullable, SET_NULL | Optional department |
| status | Enum | Default: OPEN | OPEN/ANSWERED/SOLVED |
| view_count | Integer | Default: 0 | Number of views |
| created_at | DateTime | Auto now | Creation timestamp |
| updated_at | DateTime | Auto now | Last update timestamp |

### Answer
Represents an answer to a question.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| body | Text | Required | Answer content |
| author | ForeignKey(User) | Required, CASCADE | Answer creator |
| question | ForeignKey(Question) | Required, CASCADE | Parent question |
| is_best | Boolean | Default: False | Best answer flag |
| vote_score | Integer | Default: 0 | Total vote score |
| created_at | DateTime | Auto now | Creation timestamp |
| updated_at | DateTime | Auto now | Last update timestamp |

### AnswerVote
Represents a vote on an answer.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| answer | ForeignKey(Answer) | Required, CASCADE | Voted answer |
| user | ForeignKey(User) | Required, CASCADE | Voter |
| vote_type | Enum | Required | UP/DOWN |
| created_at | DateTime | Auto now | Vote timestamp |

Unique constraint: (answer, user) to prevent duplicate votes.

### Comment
Represents a comment on an answer.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| body | Text | Required | Comment content |
| author | ForeignKey(User) | Required, CASCADE | Comment creator |
| answer | ForeignKey(Answer) | Required, CASCADE | Parent answer |
| created_at | DateTime | Auto now | Creation timestamp |
| updated_at | DateTime | Auto now | Last update timestamp |

### Tag
Represents a tag that can be applied to questions.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| name | String | Unique, Required | Tag name |
| created_at | DateTime | Auto now | Creation timestamp |
| updated_at | DateTime | Auto now | Last update timestamp |

### QuestionTag
Many-to-many relationship between questions and tags.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| question | ForeignKey(Question) | Required, CASCADE | Associated question |
| tag | ForeignKey(Tag) | Required, CASCADE | Associated tag |
| created_at | DateTime | Auto now | Association timestamp |

Unique constraint: (question, tag) to prevent duplicates.

### Notification
Represents a notification for a user.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| user | ForeignKey(User) | Required, CASCADE | Recipient |
| type | Enum | Required | NEW_ANSWER/NEW_COMMENT/BEST_ANSWER/VOTE/MODERATOR_ASSIGNED/HUB_ACTIVATED |
| message | String | Required | Notification text |
| is_read | Boolean | Default: False | Read status |
| related_object_id | UUID | Nullable | ID of related object (question/answer/etc) |
| related_object_type | String | Nullable | Model name of related object |
| created_at | DateTime | Auto now | Notification timestamp |

### Report
Represents a user report on content.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| reporter | ForeignKey(User) | Required, CASCADE | User who reported |
| type | Enum | Required | SPAM/ABUSE/MISINFORMATION/DUPLICATE |
| content_type | String | Required | Model being reported (question/answer/comment) |
| content_id | UUID | Required | ID of reported content |
| description | Text | Nullable | Additional context |
| status | Enum | Default: PENDING | PENDING/RESOLVED/REJECTED |
| resolved_by | ForeignKey(User) | Nullable, SET_NULL | Admin who resolved |
| resolved_at | DateTime | Nullable | Resolution timestamp |
| created_at | DateTime | Auto now | Creation timestamp |
| updated_at | DateTime | Auto now | Last update timestamp |

### ModeratorAssignment
Represents a user assigned as moderator for a hub.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| user | ForeignKey(User) | Required, CASCADE | Assigned moderator |
| hub | ForeignKey(Hub) | Required, CASCADE | Moderated hub |
| is_active | Boolean | Default: True | Assignment active status |
| created_at | DateTime | Auto now | Assignment timestamp |
| updated_at | DateTime | Auto now | Last update timestamp |

Unique constraint: (user, hub) to prevent duplicate assignments.

### SchoolRepresentativeAssignment
Represents a user assigned as school representative for a hub.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| user | ForeignKey(User) | Required, CASCADE | Assigned representative |
| hub | ForeignKey(Hub) | Required, CASCADE | Represented hub |
| is_active | Boolean | Default: True | Assignment active status |
| created_at | DateTime | Auto now | Assignment timestamp |
| updated_at | DateTime | Auto now | Last update timestamp |

Unique constraint: (user, hub) to prevent duplicate assignments.

---

## Relationships Diagram

```
School (1) ─────── (1) Hub
   │                    │
   │                    │
   │                    │
   ├── (N) Department   │
   │                    │
   │                    ├── (N) Question
   │                    │       │
   │                    │       ├── (N) Answer
   │                    │       │       │
   │                    │       │       ├── (N) Comment
   │                    │       │       │
   │                    │       │       └── (N) AnswerVote
   │                    │       │
   │                    │       ├── (N) QuestionTag ── (N) Tag
   │                    │       │
   │                    │       └── (1) Author (User)
   │                    │
   │                    ├── (N) ModeratorAssignment
   │                    │
   │                    ├── (N) SchoolRepresentativeAssignment
   │                    │
   │                    └── (N) HubActivationRequest
   │
   └── (N) User ─────── (N) Notification
                        (N) Report
                        (N) HubActivationRequest
```

---

## Constraints & Indexes

### Performance Indexes
- `Question`: (hub_id, created_at DESC) - For recent questions
- `Question`: (hub_id, status) - For filtering by status
- `Question`: (department_id) - For department filtering
- `Answer`: (question_id, is_best) - For best answer lookup
- `AnswerVote`: (answer_id) - For vote aggregation
- `Notification`: (user_id, is_read, created_at DESC) - For user notifications
- `Report`: (status, created_at DESC) - For reports dashboard

### Unique Constraints
- `School`: name, short_name
- `Department`: (school_id, name)
- `Hub`: school_id
- `AnswerVote`: (answer_id, user_id)
- `QuestionTag`: (question_id, tag_id)
- `ModeratorAssignment`: (user_id, hub_id)
- `SchoolRepresentativeAssignment`: (user_id, hub_id)

### Cascade Behavior
- Deleting a `School` → Delete associated `Hub`, `Department`, `HubActivationRequest`
- Deleting a `Hub` → Delete associated `Question`, `ModeratorAssignment`, `SchoolRepresentativeAssignment`
- Deleting a `User` → Delete associated `Question`, `Answer`, `Comment`, `Notification`, `Report`
- Deleting a `Question` → Delete associated `Answer`, `QuestionTag`
- Deleting an `Answer` → Delete associated `Comment`, `AnswerVote`
