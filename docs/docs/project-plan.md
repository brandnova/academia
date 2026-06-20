# PROJECT PLAN

## Working Title: Academia

A nationwide academic knowledge platform where students can ask questions, receive answers, share guidance, solve academic problems, and access school-specific information through dedicated school hubs.

The platform combines concepts from Google Community Help, Stack Overflow, Quora, Reddit Communities, and Facebook Groups while focusing specifically on educational institutions.

---

## PROJECT VISION

Students constantly face questions that are not answered by official school websites:

- Admission concerns
- Registration procedures
- Clearance requirements
- Course registration
- GPA calculations
- Department-specific processes
- Hostel information
- SIWES guidance
- Project guidance
- Examination concerns

These answers often exist somewhere:

- WhatsApp groups
- Telegram groups
- Old students
- SUG executives
- Departmental representatives

The platform's purpose is to centralize this knowledge into searchable school hubs.

Instead of repeatedly asking the same questions every semester, students should be able to search existing discussions and find verified answers.

> **Student is confused → Student asks question → Student gets answer → Future students find answer.**

Everything else is support infrastructure.

---

## CORE PRINCIPLES

### Principle 1: One Hub Per School

A school should only have one official hub.

**Example:**

University of Lagos → One Hub

**Not:**

- UNILAG Hub A
- UNILAG Hub B
- UNILAG Freshers Hub

Fragmentation destroys community quality.

---

### Principle 2: Schools Are Platform Managed

Schools are system records.

Users cannot create schools.

Users can only request activation of hubs for schools that already exist.

This prevents:

- Duplicates
- Misspellings
- Fake institutions
- Spam hubs

---

### Principle 3: Hub Ownership Belongs To The Platform

Users do not own school hubs.

Users can help activate them.

Users can become moderators or school representatives.

Hubs remain platform assets.

This prevents:

- Hostage situations
- Hub hijacking
- Ownership disputes

---

### Principle 4: Knowledge Must Be Searchable

Every answer should become part of a permanent knowledge base.

The platform should prioritize:

- Search
- Discoverability
- Categorization
- Archiving

over social-media-style endless feeds.

---

### Principle 5: Hub Moderation

Each school hub should eventually have local moderators.

These moderators help:

- Answer unanswered questions
- Report bad content
- Escalate issues to admins
- Maintain hub quality

---

## USER TYPES

### User

Anyone can browse the platform.

Authentication is required for the following actions:

- Ask questions
- Post answers
- Vote
- Comment
- Follow questions
- Receive notifications

---

### Hub Moderator

Moderator responsibilities:

- Receive notifications when new questions appear
- Help answer unanswered questions
- Report bad content
- Escalate issues to admins

**No moderation powers initially.**

- No content deletion
- No report handling
- No user management

Moderators focus on helping students.

---

### School Representative

Responsibilities:

- Manage school metadata
- Manage departments
- Assign moderators
- Suggest updates to school information

Nothing more.

---

### Platform Administrator

Can:

- Manage schools
- Approve hubs
- Manage moderators
- Manage school representatives
- Manage reports
- Manage users

---

## HUB STRUCTURE

**School Hub**

Example:

University of Lagos

Contains:

- Questions
- Answers
- Tags
- Departments
- Moderators
- School Representative

---

## DEPARTMENT STRUCTURE

Hubs should support optional departments.

Example:

University of Lagos

- Computer Science
- Accounting
- Law
- Medicine
- Economics

Questions can belong to:

- School only
- School + Department

This dramatically improves content organization.

---

## QUESTION LIFECYCLE

Questions have three statuses:

### Open

No answers yet.

### Answered

Has at least one answer.

### Solved

Question owner selected a best answer.

This gives users an immediate indication of whether a question still needs attention.

It also allows moderators to filter:

**Show unanswered questions**

which becomes one of the most useful views in the entire platform.

A moderator waking up and seeing:

**12 unanswered questions**

is infinitely more actionable than scrolling through a giant feed trying to figure out where help is needed.

---

## QUESTION SYSTEM

Question fields:

- Title
- Body
- School
- Department
- Tags
- Author
- Creation Date
- Views
- Status (Open / Answered / Solved)

---

## ANSWER SYSTEM

Features:

- Rich text
- Voting
- Editing
- Reporting
- Best Answer

Only one answer can be marked as best answer.

---

## COMMENT SYSTEM

Comments exist under answers.

Purpose:

- Clarification
- Follow-up questions
- Additional details

Comments should remain lightweight.

---

## TAGGING SYSTEM

Examples:

- admission
- registration
- gpa
- hostel
- clearance
- exams
- project
- siwes

Tags improve:

- Search
- Discovery
- Filtering

---

## NOTIFICATION SYSTEM

Events:

- New answer
- New comment
- Answer selected
- Vote received
- Moderator assignment
- Hub activation

Future:

- Email notifications
- Push notifications

---

## MODERATION SYSTEM

Content reports:

- Spam
- Abuse
- Misinformation
- Duplicate question

Moderators review reports.

---

## SCHOOL ACTIVATION WORKFLOW

User searches for school

↓

School Hub exists

↓

User accesses hub

OR

↓

School Hub does not exist

↓

User submits activation request

↓

Admin approves

↓

School Hub created

↓

User notified

---

## SEARCH SYSTEM

Search should support:

- Questions
- Tags
- Schools
- Departments

Future:

- Full-text search
- Elasticsearch/OpenSearch integration

---

## AUTHENTICATION

**Phase 1:**

Google Login Only

Benefits:

- Fast onboarding
- Reduced spam
- Less password management

**Future:**

- Email and Password
- Apple Login
- Microsoft Login

---

## FRONTEND ARCHITECTURE

**React**

Suggested Structure:

```
src/
  - api/
  - components/
  - pages/
  - hooks/
  - layouts/
  - services/
  - types/
  - contexts/
  - utils/
```

Use TypeScript.

Generate interfaces directly from API contracts.

---

## BACKEND ARCHITECTURE

**Django**

Apps:

- accounts
- schools
- hubs
- questions
- answers
- comments
- notifications
- moderation
- search

Use:

- Django REST Framework
- Simple JWT
- Django Allauth
- PostgreSQL

---

## API-FIRST DEVELOPMENT

Backend and frontend must communicate through contracts.

Never build APIs first and frontend later.

Never build frontend first and backend later.

Build contracts first.

Everything else follows.

---

## REQUIRED DOCUMENTATION FILES

**docs/**

### feature-list.md

Defines every feature and requirement.

### user-flows.md

Contains:

- Registration flow
- Hub activation flow
- Ask question flow
- Answer flow
- Moderation flow

### database-schema.md

Contains:

- Models
- Relationships
- Constraints
- Indexes

### api-contract.md

Contains:

- Endpoints
- Requests
- Responses
- Error formats

This becomes the single source of truth.

### roles-and-permissions.md

Contains:

- User permissions
- Moderator permissions
- School Representative permissions
- Admin permissions

### notification-spec.md

Contains:

- Notification types
- Trigger events
- Payload structure

### search-spec.md

Contains:

- Search rules
- Filters
- Ranking logic

### frontend-data-contracts.md

Contains:

TypeScript interfaces matching backend serializers.

### moderation-spec.md

Contains:

- Reporting workflow
- Content review process
- Escalation rules

---

## DOCUMENTATION PRINCIPLE

**Each documentation file should contain only the information necessary for its purpose.**

- Avoid duplicating information across multiple files.
- The API contract should not contain database design details.
- The database schema should not contain endpoint definitions.
- The feature list should not contain serializer specifications.

Each document should serve as the authoritative source for its specific area.

---

## DEVELOPMENT WORKFLOW

### Step 1

Complete all documentation.

No coding.

### Step 2

Approve contracts.

No coding.

### Step 3

Frontend builds against mocked API responses.

Backend builds actual APIs.

### Step 4

Frontend switches from mock service to real API.

Minimal integration work required.

### Step 5

Testing and bug fixing.

---

## FUTURE CONSIDERATIONS

Potential future features:

- Course-specific communities
- Marketplace for academic materials
- School announcements
- Verified school representatives
- AI-assisted search
- Scholarship board
- Internship opportunities
- Event listings
- Student elections
- Mobile application
- Nationwide academic knowledge graph

---

## FUTURE CONSIDERATION: REPUTATION SYSTEM

If needed later, a reputation system could be introduced where users gain points for:

- Posting answers
- Receiving upvotes
- Having answers accepted

Benefits would include:

- Recognition
- Trust signals
- Moderator eligibility

---

The long-term objective is to become the primary student knowledge platform for tertiary institutions rather than merely a question-and-answer website.
