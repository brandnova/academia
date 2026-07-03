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
| is_admin | Boolean | Default: False | Platform administrator flag (checked by API views) |
| is_staff | Boolean | Default: False | Django admin-site login flag (separate from is_admin) |
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
| verification_status | Enum | Default: UNVERIFIED | UNVERIFIED/PENDING/VERIFIED |
| is_active | Boolean | Default: True | School active status (also used as soft-delete) |
| created_at | DateTime | Auto now | Creation timestamp |
| updated_at | DateTime | Auto now | Last update timestamp |

`has_hub` is not a stored field, it's computed from the related `Hub` record.

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
| content_type | ForeignKey(ContentType) | Nullable | Related object's model type (Django ContentType) |
| object_id | UUID | Nullable | Related object's ID |
| created_at | DateTime | Auto now | Notification timestamp |

`content_object` is exposed via `GenericForeignKey('content_type', 'object_id')`. The public API still serializes this as `related_object_type` (string) / `related_object_id` (uuid), see api-contract.md.

### Report
Represents a user report on content.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| reporter | ForeignKey(User) | Required, CASCADE | User who reported |
| type | Enum | Required | SPAM/ABUSE/MISINFORMATION/DUPLICATE |
| content_type | ForeignKey(ContentType) | Required | Reported object's model type (Django ContentType) |
| object_id | UUID | Required | ID of reported object |
| description | Text | Nullable | Additional context |
| status | Enum | Default: PENDING | PENDING/RESOLVED/REJECTED |
| resolved_by | ForeignKey(User) | Nullable, SET_NULL | Admin who resolved |
| resolved_at | DateTime | Nullable | Resolution timestamp |
| created_at | DateTime | Auto now | Creation timestamp |
| updated_at | DateTime | Auto now | Last update timestamp |

`content_object` is exposed via `GenericForeignKey('content_type', 'object_id')`. Using Django's ContentType framework (instead of a plain string field) means any future model, including SchoolReview, can be reported without a schema change. The public API still serializes this as `content_type: "question"` / `content_id: uuid`.

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

### APIClient (Future, Public API Phase)
Represents a registered external consumer of the public API.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| name | String | Required | Consumer/application name |
| owner | ForeignKey(User) | Nullable, SET_NULL | Admin who issued the key |
| key_prefix | String | Unique, Required | Public identifier shown in dashboards |
| hashed_secret | String | Required | Hashed API secret (never stored plain) |
| scopes | String | Required | Comma-separated permission scopes |
| rate_limit_tier | Enum | Default: STANDARD | STANDARD/ELEVATED/INTERNAL |
| is_active | Boolean | Default: True | Client active status |
| revoked_at | DateTime | Nullable | Revocation timestamp |
| created_at | DateTime | Auto now | Creation timestamp |

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

`Report` and `Notification` also relate generically (via Django ContentType) to any
reportable/notifiable model, currently Question, Answer, Comment; SchoolReview will
join this set once built, with no schema change required.

---

## Constraints & Indexes

### Performance Indexes
- `Question`: (hub_id, created_at DESC) - For recent questions
- `Question`: (hub_id, status) - For filtering by status
- `Question`: (department_id) - For department filtering
- `Answer`: (question_id, is_best) - For best answer lookup
- `AnswerVote`: (answer_id) - For vote aggregation
- `Notification`: (user_id, is_read, created_at DESC) - For user notifications
- `Notification`: (content_type_id, object_id) - For generic relation lookups
- `Report`: (status, created_at DESC) - For reports dashboard
- `Report`: (content_type_id, object_id) - For generic relation lookups

### Unique Constraints
- `School`: name, short_name
- `Department`: (school_id, name)
- `Hub`: school_id
- `AnswerVote`: (answer_id, user_id)
- `QuestionTag`: (question_id, tag_id)
- `ModeratorAssignment`: (user_id, hub_id)
- `SchoolRepresentativeAssignment`: (user_id, hub_id)
- `APIClient`: key_prefix

### Cascade Behavior
- Deleting a `School` → Delete associated `Hub`, `Department`, `HubActivationRequest`
- Deleting a `Hub` → Delete associated `Question`, `ModeratorAssignment`, `SchoolRepresentativeAssignment`
- Deleting a `User` → Delete associated `Question`, `Answer`, `Comment`, `Notification`, `Report`
- Deleting a `Question` → Delete associated `Answer`, `QuestionTag`
- Deleting an `Answer` → Delete associated `Comment`, `AnswerVote`

In practice, `School` is not hard-deleted through the API, see api-contract.md's
soft-delete note. Hard delete remains available at the database/admin level only.

---

## Future Models (Not in MVP, reserved for planning)

### SchoolReview
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| school | ForeignKey(School) | Required, CASCADE | Reviewed school |
| author | ForeignKey(User) | Required, CASCADE | Reviewer |
| title | String | Required | Review headline |
| body | Text | Required | Review content |
| overall_rating | Integer | Required, 1–5 | Overall star rating |
| status | Enum | Default: PUBLISHED | PUBLISHED/FLAGGED/REMOVED |
| created_at | DateTime | Auto now | Creation timestamp |
| updated_at | DateTime | Auto now | Last update timestamp |

### ReviewCategoryScore
Per-category breakdown (Academics, Facilities, Social Life, Career Support, Value for Money).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| review | ForeignKey(SchoolReview) | Required, CASCADE | Parent review |
| category | String | Required | Category name |
| score | Integer | Required, 1–5 | Category rating |

### ReviewResponse
The school's single official public reply to a review.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| review | OneToOneField(SchoolReview) | Required, CASCADE | Review being responded to |
| author | ForeignKey(User) | Required, CASCADE | Must be an active school representative |
| body | Text | Required | Response content |
| created_at | DateTime | Auto now | Creation timestamp |

### ReviewVote
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| review | ForeignKey(SchoolReview) | Required, CASCADE | Voted review |
| user | ForeignKey(User) | Required, CASCADE | Voter |
| vote_type | Enum | Required | HELPFUL/NOT_HELPFUL |

Unique constraint: (review, user).

### Plan
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| name | String | Required | Plan name |
| price | Decimal | Required | Price per billing interval |
| billing_interval | Enum | Required | MONTHLY/YEARLY |
| features | JSON | Required | Feature flags unlocked by this plan |

### Subscription
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| school | ForeignKey(School) | Required, CASCADE | Subscribing school |
| plan | ForeignKey(Plan) | Required | Active plan |
| status | Enum | Required | ACTIVE/CANCELED/PAST_DUE |
| external_provider_id | String | Nullable | Stripe/Paystack subscription ID |
| current_period_end | DateTime | Required | Renewal date |

### Invoice
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| subscription | ForeignKey(Subscription) | Required, CASCADE | Related subscription |
| amount | Decimal | Required | Amount charged |
| status | Enum | Required | PAID/FAILED/PENDING |
| issued_at | DateTime | Auto now | Issue date |
| paid_at | DateTime | Nullable | Payment date |

**Design constraint (see project-plan.md → Integrity Over Monetization):** paid plans
may only affect visibility/promotion/verification. They must never gate deletion,
hiding, or suppression of a `SchoolReview`. Reviews are moderated exclusively through
the existing `Report` pipeline, regardless of the school's subscription status.

### SchoolSubmission (Future, School Data Curation)
Represents a user-submitted school not yet in the platform's directory.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| submitted_by | ForeignKey(User) | Required, CASCADE | User who submitted it |
| name | String | Required | Proposed school name |
| location | String | Nullable | Proposed location |
| website | String | Nullable | Proposed website |
| notes | Text | Nullable | Any supporting context from the submitter |
| status | Enum | Default: PENDING | PENDING/APPROVED/REJECTED |
| reviewed_by | ForeignKey(User) | Nullable, SET_NULL | Admin who reviewed |
| reviewed_at | DateTime | Nullable | Review timestamp |
| resulting_school | ForeignKey(School) | Nullable, SET_NULL | Set once approved and created |
| created_at | DateTime | Auto now | Creation timestamp |
