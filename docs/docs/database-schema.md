# Database Schema

## Overview

This document defines the database schema for the Academia platform. It includes all models, relationships, constraints, and indexes required to support the features defined in `feature-list.md`.

**Technology:** PostgreSQL

**Note:** This document contains only database design details. It does not include API endpoints, user flows, or frontend data contracts.

---

## MODEL RELATIONSHIP DIAGRAM

```
User
  ├── Question (one-to-many)
  ├── Answer (one-to-many)
  ├── Comment (one-to-many)
  ├── Vote (one-to-many)
  ├── Notification (one-to-many)
  ├── School (one-to-many as Representative)
  └── SchoolHub (one-to-many as Moderator)

School
  ├── SchoolHub (one-to-one)
  ├── Department (one-to-many)
  └── ActivationRequest (one-to-many)

SchoolHub
  ├── Question (one-to-many)
  ├── Moderator (many-to-many through User)
  └── Department (one-to-many)

Department
  └── Question (one-to-many)

Question
  ├── Answer (one-to-many)
  ├── Tag (many-to-many)
  └── Report (one-to-many)

Answer
  ├── Comment (one-to-many)
  ├── Vote (one-to-many)
  └── Report (one-to-many)

Comment
  └── Report (one-to-many)

Tag
  └── Question (many-to-many)

Report
  ├── User (reporter)
  ├── Question (optional)
  ├── Answer (optional)
  └── Comment (optional)

Notification
  └── User (recipient)

ActivationRequest
  ├── User (requester)
  └── School (target)
```

---

## MODEL DEFINITIONS

### 1. User

**Purpose:** Stores user account information.

**Table Name:** `users`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated UUID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email from Google |
| google_id | VARCHAR(255) | UNIQUE, NOT NULL | Google OAuth identifier |
| display_name | VARCHAR(100) | NOT NULL | User's display name |
| profile_picture | VARCHAR(500) | NULL | URL to profile picture |
| is_active | BOOLEAN | DEFAULT True | Account active status |
| is_superuser | BOOLEAN | DEFAULT False | Platform admin flag |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| last_login | TIMESTAMP | NULL | Last login timestamp |

**Indexes:**
- `idx_users_email` ON (email)
- `idx_users_google_id` ON (google_id)
- `idx_users_display_name` ON (display_name)

**Relationships:**
- One-to-many with Question (author)
- One-to-many with Answer (author)
- One-to-many with Comment (author)
- One-to-many with Vote (voter)
- One-to-many with Notification (recipient)
- One-to-many with ActivationRequest (requester)
- Many-to-many with SchoolHub (moderators)

---

### 2. School

**Purpose:** Stores school records. Schools are system-managed records.

**Table Name:** `schools`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated UUID |
| name | VARCHAR(200) | NOT NULL, UNIQUE | Official school name |
| short_name | VARCHAR(50) | UNIQUE | Shortened school name |
| location | VARCHAR(200) | NULL | City/State/Country |
| website | VARCHAR(255) | NULL | Official school website |
| is_active | BOOLEAN | DEFAULT True | School active status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_schools_name` ON (name)
- `idx_schools_short_name` ON (short_name)
- `idx_schools_location` ON (location)

**Constraints:**
- UNIQUE (name) - Only one record per school name

**Relationships:**
- One-to-one with SchoolHub (activated schools)
- One-to-many with Department
- One-to-many with ActivationRequest
- One-to-many with User (School Representative)

---

### 3. SchoolHub

**Purpose:** Represents an activated school community hub.

**Table Name:** `school_hubs`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated UUID |
| school_id | UUID | FOREIGN KEY, UNIQUE, NOT NULL | References School |
| representative_id | UUID | FOREIGN KEY, NOT NULL | References User |
| is_active | BOOLEAN | DEFAULT True | Hub active status |
| question_count | INTEGER | DEFAULT 0 | Total questions (denormalized) |
| answer_count | INTEGER | DEFAULT 0 | Total answers (denormalized) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Hub creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_hubs_school` ON (school_id)
- `idx_hubs_representative` ON (representative_id)
- `idx_hubs_active` ON (is_active)

**Constraints:**
- UNIQUE (school_id) - One hub per school

**Relationships:**
- One-to-one with School (foreign key)
- Many-to-one with User (representative)
- One-to-many with Question
- One-to-many with Department
- Many-to-many with User (moderators)

---

### 4. Department

**Purpose:** Represents academic departments within a school.

**Table Name:** `departments`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated UUID |
| school_hub_id | UUID | FOREIGN KEY, NOT NULL | References SchoolHub |
| name | VARCHAR(100) | NOT NULL | Department name |
| description | TEXT | NULL | Department description |
| is_active | BOOLEAN | DEFAULT True | Department active status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_departments_hub` ON (school_hub_id)
- `idx_departments_name` ON (name)
- `idx_departments_hub_name` ON (school_hub_id, name)

**Constraints:**
- UNIQUE (school_hub_id, name) - Unique department per hub

**Relationships:**
- Many-to-one with SchoolHub
- One-to-many with Question

---

### 5. Question

**Purpose:** Stores user questions.

**Table Name:** `questions`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated UUID |
| title | VARCHAR(300) | NOT NULL | Question title |
| body | TEXT | NOT NULL | Question body (rich text) |
| author_id | UUID | FOREIGN KEY, NOT NULL | References User |
| school_hub_id | UUID | FOREIGN KEY, NOT NULL | References SchoolHub |
| department_id | UUID | FOREIGN KEY, NULL | References Department |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'open' | open/answered/solved |
| view_count | INTEGER | DEFAULT 0 | Number of views |
| answer_count | INTEGER | DEFAULT 0 | Total answers (denormalized) |
| best_answer_id | UUID | FOREIGN KEY, NULL | References Answer |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| is_active | BOOLEAN | DEFAULT True | Question active status |

**Indexes:**
- `idx_questions_author` ON (author_id)
- `idx_questions_hub` ON (school_hub_id)
- `idx_questions_department` ON (department_id)
- `idx_questions_status` ON (status)
- `idx_questions_created` ON (created_at DESC)
- `idx_questions_hub_status` ON (school_hub_id, status)
- `idx_questions_hub_created` ON (school_hub_id, created_at DESC)

**Constraints:**
- status CHECK: status IN ('open', 'answered', 'solved')
- FOREIGN KEY (best_answer_id) REFERENCES answers(id) DEFERRABLE

**Relationships:**
- Many-to-one with User (author)
- Many-to-one with SchoolHub
- Many-to-one with Department
- One-to-many with Answer
- One-to-many with Report (optional)
- One-to-one with Answer (best_answer)
- Many-to-many with Tag

---

### 6. Answer

**Purpose:** Stores answers to questions.

**Table Name:** `answers`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated UUID |
| body | TEXT | NOT NULL | Answer body (rich text) |
| author_id | UUID | FOREIGN KEY, NOT NULL | References User |
| question_id | UUID | FOREIGN KEY, NOT NULL | References Question |
| is_best_answer | BOOLEAN | DEFAULT False | Best answer flag |
| vote_count | INTEGER | DEFAULT 0 | Total votes (denormalized) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| is_active | BOOLEAN | DEFAULT True | Answer active status |

**Indexes:**
- `idx_answers_author` ON (author_id)
- `idx_answers_question` ON (question_id)
- `idx_answers_created` ON (created_at DESC)
- `idx_answers_best` ON (question_id, is_best_answer) WHERE is_best_answer = TRUE
- `idx_answers_active` ON (question_id, is_active)

**Constraints:**
- Only one best answer per question (enforced at application level)

**Relationships:**
- Many-to-one with User (author)
- Many-to-one with Question
- One-to-many with Comment
- One-to-many with Vote
- One-to-many with Report (optional)

---

### 7. Comment

**Purpose:** Stores comments on answers.

**Table Name:** `comments`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated UUID |
| body | TEXT | NOT NULL | Comment text (plain text) |
| author_id | UUID | FOREIGN KEY, NOT NULL | References User |
| answer_id | UUID | FOREIGN KEY, NOT NULL | References Answer |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| is_active | BOOLEAN | DEFAULT True | Comment active status |

**Indexes:**
- `idx_comments_author` ON (author_id)
- `idx_comments_answer` ON (answer_id)
- `idx_comments_created` ON (created_at DESC)

**Relationships:**
- Many-to-one with User (author)
- Many-to-one with Answer
- One-to-many with Report (optional)

---

### 8. Tag

**Purpose:** Stores tags for categorizing questions.

**Table Name:** `tags`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated UUID |
| name | VARCHAR(50) | NOT NULL, UNIQUE | Tag name |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_tags_name` ON (name)

**Relationships:**
- Many-to-many with Question (through QuestionTag)

---

### 9. QuestionTag

**Purpose:** Junction table for Question-Tag many-to-many relationship.

**Table Name:** `question_tags`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated UUID |
| question_id | UUID | FOREIGN KEY, NOT NULL | References Question |
| tag_id | UUID | FOREIGN KEY, NOT NULL | References Tag |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_question_tags_question` ON (question_id)
- `idx_question_tags_tag` ON (tag_id)
- `idx_question_tags_question_tag` ON (question_id, tag_id) UNIQUE

**Constraints:**
- UNIQUE (question_id, tag_id) - Prevent duplicate tag assignments

---

### 10. Vote

**Purpose:** Stores votes on answers.

**Table Name:** `votes`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated UUID |
| user_id | UUID | FOREIGN KEY, NOT NULL | References User |
| answer_id | UUID | FOREIGN KEY, NOT NULL | References Answer |
| vote_type | VARCHAR(10) | NOT NULL | 'upvote' or 'downvote' |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_votes_user` ON (user_id)
- `idx_votes_answer` ON (answer_id)
- `idx_votes_user_answer` ON (user_id, answer_id) UNIQUE

**Constraints:**
- vote_type CHECK: vote_type IN ('upvote', 'downvote')
- UNIQUE (user_id, answer_id) - One vote per user per answer

**Relationships:**
- Many-to-one with User (voter)
- Many-to-one with Answer

---

### 11. ActivationRequest

**Purpose:** Stores school hub activation requests.

**Table Name:** `activation_requests`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated UUID |
| requester_id | UUID | FOREIGN KEY, NOT NULL | References User |
| school_id | UUID | FOREIGN KEY, NOT NULL | References School |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | pending/approved/denied |
| admin_notes | TEXT | NULL | Admin notes on decision |
| reviewed_by | UUID | FOREIGN KEY, NULL | References User (admin) |
| reviewed_at | TIMESTAMP | NULL | Review timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_activation_requester` ON (requester_id)
- `idx_activation_school` ON (school_id)
- `idx_activation_status` ON (status)
- `idx_activation_created` ON (created_at DESC)

**Constraints:**
- status CHECK: status IN ('pending', 'approved', 'denied')
- UNIQUE (school_id) WHERE status = 'approved' - Only one approval per school

**Relationships:**
- Many-to-one with User (requester)
- Many-to-one with School

---

### 12. Report

**Purpose:** Stores content reports from users.

**Table Name:** `reports`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated UUID |
| reporter_id | UUID | FOREIGN KEY, NOT NULL | References User |
| question_id | UUID | FOREIGN KEY, NULL | References Question |
| answer_id | UUID | FOREIGN KEY, NULL | References Answer |
| comment_id | UUID | FOREIGN KEY, NULL | References Comment |
| reason | VARCHAR(50) | NOT NULL | spam/abuse/misinformation/duplicate |
| description | TEXT | NULL | Additional context |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | pending/resolved/escalated |
| moderator_id | UUID | FOREIGN KEY, NULL | References User |
| moderator_notes | TEXT | NULL | Notes from moderator |
| resolved_at | TIMESTAMP | NULL | Resolution timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_reports_reporter` ON (reporter_id)
- `idx_reports_question` ON (question_id)
- `idx_reports_answer` ON (answer_id)
- `idx_reports_comment` ON (comment_id)
- `idx_reports_status` ON (status)
- `idx_reports_created` ON (created_at DESC)

**Constraints:**
- status CHECK: status IN ('pending', 'resolved', 'escalated')
- reason CHECK: reason IN ('spam', 'abuse', 'misinformation', 'duplicate')
- CHECK: Exactly one content reference is non-null
  (question_id IS NOT NULL OR answer_id IS NOT NULL OR comment_id IS NOT NULL)

**Relationships:**
- Many-to-one with User (reporter)
- Many-to-one with Question (optional)
- Many-to-one with Answer (optional)
- Many-to-one with Comment (optional)
- Many-to-one with User (moderator)

---

### 13. Notification

**Purpose:** Stores user notifications.

**Table Name:** `notifications`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated UUID |
| recipient_id | UUID | FOREIGN KEY, NOT NULL | References User |
| type | VARCHAR(50) | NOT NULL | notification type identifier |
| title | VARCHAR(200) | NOT NULL | Notification title |
| body | TEXT | NOT NULL | Notification body |
| link | VARCHAR(500) | NULL | URL to related content |
| is_read | BOOLEAN | DEFAULT False | Read status |
| metadata | JSONB | NULL | Additional contextual data |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_notifications_recipient` ON (recipient_id)
- `idx_notifications_read` ON (recipient_id, is_read)
- `idx_notifications_created` ON (created_at DESC)
- `idx_notifications_recipient_created` ON (recipient_id, created_at DESC)

**Relationships:**
- Many-to-one with User (recipient)

**Notification Types:**
- `new_answer` - New answer on user's question
- `new_comment` - New comment on user's answer
- `best_answer` - Answer selected as best
- `vote_received` - Vote received on answer
- `moderator_assigned` - User assigned as moderator
- `hub_activated` - School hub activation approved
- `activation_denied` - Hub activation request denied

---

### 14. ModeratorAssignment

**Purpose:** Tracks which users are moderators for which hubs.

**Table Name:** `moderator_assignments`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated UUID |
| user_id | UUID | FOREIGN KEY, NOT NULL | References User |
| school_hub_id | UUID | FOREIGN KEY, NOT NULL | References SchoolHub |
| assigned_by | UUID | FOREIGN KEY, NOT NULL | References User |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_moderators_user` ON (user_id)
- `idx_moderators_hub` ON (school_hub_id)
- `idx_moderators_user_hub` ON (user_id, school_hub_id) UNIQUE

**Constraints:**
- UNIQUE (user_id, school_hub_id) - One assignment per user per hub

**Relationships:**
- Many-to-one with User (moderator)
- Many-to-one with SchoolHub
- Many-to-one with User (assigner)

---

## DENORMALIZED COUNTERS

For performance, the following counters are denormalized:

### On SchoolHub
- `question_count` - Incremented when a question is created, decremented when deleted
- `answer_count` - Incremented when an answer is created, decremented when deleted

### On Question
- `answer_count` - Incremented when an answer is created, decremented when deleted
- `view_count` - Incremented on each view (with rate limiting)

### On Answer
- `vote_count` - Incremented on upvote, decremented on downvote

---

## SOFT DELETE STRATEGY

All content models use soft deletion:

- `is_active` = False indicates content is deleted
- Deleted content is hidden from users
- Deleted content remains for reporting/audit purposes
- Referential integrity is maintained

---

## TEXT SEARCH

**PostgreSQL Full-Text Search:**

| Model | Searchable Fields | GIN Index |
|-------|-------------------|-----------|
| Question | title, body | `idx_questions_search` ON (to_tsvector('english', title || ' ' || body)) |
| School | name, short_name, location | `idx_schools_search` ON (to_tsvector('english', name || ' ' || short_name || ' ' || location)) |

---

## MIGRATION ORDER

1. User
2. School
3. SchoolHub
4. Department
5. Tag
6. Question
7. Answer
8. QuestionTag
9. Comment
10. Vote
11. ActivationRequest
12. Report
13. Notification
14. ModeratorAssignment

---

## DATA RETENTION

| Data Type | Retention Policy |
|-----------|------------------|
| Active Questions | Indefinite |
| Active Answers | Indefinite |
| Deleted Content | 90 days (soft delete) |
| Reports | 1 year |
| Notifications | 6 months |
| Votes | Indefinite |
| Activation Requests | Indefinite |

---

## SCALING CONSIDERATIONS

| Aspect | Strategy |
|--------|----------|
| Read-heavy | Read replicas for queries |
| Search | GIN indexes initially, Elasticsearch later |
| Counters | Denormalization to avoid COUNT queries |
| Historical Data | Partition by created_at |
| Active Content | Index by is_active |

---

## CONSTRAINTS SUMMARY

| Constraint Type | Models Applied |
|-----------------|---------------|
| UNIQUE | User(email, google_id), School(name), SchoolHub(school_id), Department(school_hub_id, name), Tag(name), QuestionTag(question_id, tag_id), Vote(user_id, answer_id), ModeratorAssignment(user_id, school_hub_id) |
| FOREIGN KEY | All relationships |
| CHECK | Question(status), Vote(vote_type), ActivationRequest(status), Report(status, reason) |
| INDEX | As specified above |

---

## AUDIT FIELDS

All models include standard audit fields:

- `created_at` - Timestamp of creation
- `updated_at` - Timestamp of last update

No separate audit trail required for MVP.

---

## JSONB FIELDS

### Notification.metadata

```json
{
  "source_id": "uuid",
  "source_type": "question|answer|comment|hub",
  "actor_name": "string",
  "actor_id": "uuid",
  "school_name": "string"
}
```

### School Additional Data (future)

```json
{
  "accreditation": "string",
  "established": "integer",
  "logo_url": "string"
}
```
