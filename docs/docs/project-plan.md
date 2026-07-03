# PROJECT PLAN

# Academia

## Overview

Academia is a school-focused academic knowledge platform designed to help students find answers to questions, solve academic problems, and preserve institutional knowledge in a searchable and organized way.

Students constantly encounter situations where important information exists, but is difficult to find. Questions about admissions, registration procedures, clearance requirements, departmental policies, GPA calculations, examinations, SIWES, projects, and countless other academic processes are often answered repeatedly across WhatsApp groups, Telegram channels, student forums, and private conversations.

The same questions are asked every semester by different students because previous answers are scattered across platforms that are difficult to search and impossible to preserve.

Academia exists to solve this problem.

Its purpose is not to become a social network, a school management system, or an official university platform. Its purpose is to become a searchable academic knowledge base where questions can be asked once, answered well, and discovered by future students when they need them.

The core idea behind the platform can be summarized as:

> Student is confused. Student asks a question. Student receives an answer. Future students discover the answer without needing to ask the same question again.

Everything else in the system exists to support that process.

---

## Product Vision

The long-term vision is to create a centralized academic knowledge network covering tertiary institutions across Nigeria and potentially beyond.

Every supported institution should have a dedicated hub where knowledge relevant to that institution can be collected, organized, searched, and maintained.

Rather than forcing students to depend on temporary conversations or fragmented communities, Academia should become the first place students visit when they need guidance regarding their school.

The platform should gradually evolve into a living archive of institutional knowledge built through contributions from students, alumni, moderators, and school representatives.

---

## Core Principles

Academia is guided by several principles that influence every product and technical decision.

### One Hub Per School

Each institution should have a single hub.

The platform should avoid fragmentation and duplicate communities. A student searching for information about a school should never need to choose between multiple competing hubs for the same institution.

Every question, answer, department, moderator assignment, and school-specific discussion should belong to one authoritative hub.

### Schools Are Platform Data

Schools are managed by the platform rather than by users.

Users cannot create schools directly.

Instead, the platform maintains a curated list of institutions and users may request activation of a hub when one does not already exist, or submit a school for review if it's missing from the directory entirely (see "Developer Tooling & Data Sourcing" below).

This approach prevents duplicates, spelling inconsistencies, fake institutions, and unnecessary moderation challenges.

The school dataset should eventually become one of the platform's most valuable assets.

### Knowledge Over Social Activity

Academia prioritizes useful information over engagement metrics.

The goal is not to maximize scrolling, feeds, reactions, or endless interaction.

The goal is to help users find accurate answers as quickly as possible.

Every feature should be evaluated by asking:

> Does this help students discover, share, organize, or preserve knowledge?

If the answer is no, the feature should be reconsidered.

### Search First

The most important feature on the platform is search.

A student should be able to find existing answers before needing to create a new question.

Questions, answers, schools, departments, and tags should all be structured in ways that make information discoverable.

A well-organized answer that helps thousands of students over several years is more valuable than hundreds of duplicate discussions.

### Platform Ownership

School hubs belong to the platform rather than individual users.

Users may help activate hubs.

Users may become moderators.

Users may become school representatives.

However, ownership remains with the platform to prevent disputes, abandonment, or community fragmentation.

### Integrity Over Monetization

Monetization must never compromise the accuracy or completeness of information on the platform. Paid features may increase a school's visibility, add verification badges, or enable official responses to reviews, they may never hide, suppress, or delete legitimate content. If a proposed revenue feature requires concealing true information from students, it does not ship in that form.

---

## Technology Stack

### Frontend
- Framework intentionally left open (Django templates + Alpine, React + Tailwind, or Next.js, decided per-section as real pages get built)
- Full custom Tailwind + hand-written CSS for anything a component library can't cleanly express
- No third-party component library

### Backend
- Django REST Framework, pure API (no server-rendered product pages)
- PostgreSQL database
- JWT authentication (SimpleJWT)
- Google OAuth verified via direct calls to Google's userinfo endpoint (not django-allauth, see "Known Deviations" note in BUILD_LOG.md / CHANGELOG.md for the reasoning)

### Development
- API-first development
- Contract-driven development
- Frontend and backend developed independently against documented contracts

---

## Authentication

### Phase 1: Google Login Only
- Fast onboarding
- Reduced spam
- Simplified password management
- Implemented via direct verification against Google's userinfo endpoint (see api-contract.md's "How Google Auth Works" for the full frontend implementation guide)

### Future Considerations
- Email/Password
- Apple Login
- Microsoft Login

---

## Hub Structure

The platform is organized around School Hubs.

A School Hub represents a specific institution and serves as the primary container for all questions and answers associated with that institution.

Each hub functions as a structured knowledge shelf rather than a joinable community.

Users do not join hubs. Users access hubs.

Within a hub, questions may optionally be associated with departments to improve organization and searchability.

### Department Organization

Hubs support optional departmental categorization.

Example:
```
University of Lagos
├── Computer Science
├── Accounting
├── Law
├── Medicine
└── Economics
```

Questions can belong to:
- School only
- School + Department

This allows questions relating to Computer Science to be discoverable independently from questions relating to Medicine or Accounting while still belonging to the same school.

---

## User Flows

### Ask a Question
User authenticates → Selects school hub (or searches for it) → Optionally selects department → Adds title, body, tags → Question published with Open status

### Answer a Question
User authenticates → Views question → Adds answer → Question status becomes Answered

### Solve a Question
Question owner (only) → Selects best answer → Question status becomes Solved

### Activate a Hub
User searches for school → Hub doesn't exist → Submits activation request → Admin reviews → Hub created → User notified

### Moderator View
Moderator authenticates → Views unanswered questions dashboard → Answers questions → Reports problematic content to admin if needed

### Report Content
User views question/answer/comment → Submits report (spam/abuse/misinformation/duplicate) → Moderator reviewed → Escalated to admin if needed

---

## Question Lifecycle

Every question moves through a simple lifecycle.

| Status | Description |
|--------|-------------|
| Open | No answers yet |
| Answered | Has at least one answer |
| Solved | Question owner selected a best answer |

This structure helps users quickly identify unanswered questions while allowing moderators to focus their attention where it is most needed.

The unanswered queue should become one of the most important operational views in the system.

---

## School Hub Activation

A user should be able to search for any institution in the platform database.

If a hub already exists, the user is directed to that hub immediately.

If a hub does not exist, the user may submit an activation request.

After review by a platform administrator, the hub can be created and made available to all users.

This process ensures that hubs are created intentionally while still allowing expansion driven by user demand.

---

## Search Philosophy

Search is the most important feature on the platform.

### Searchable Content
- Questions
- Schools
- Departments
- Tags
- Answers (future enhancement)

### Ranking Priorities
1. Solved questions with best answers
2. Highly voted answers
3. Recent content
4. Relevance to search terms

### Future Enhancements
- Full-text search
- Elasticsearch/OpenSearch integration

---

## Moderation Philosophy

Moderation is lightweight and focused on helping students.

### Moderator Responsibilities
- View unanswered questions
- Answer questions
- Report problematic content
- Escalate to admin

### Moderator Limitations
- No content deletion
- No user management
- No ban capabilities
- No report handling independently

### Content Reporting
Users can report:
- Spam
- Abuse
- Misinformation
- Duplicate questions

Reports are reviewed by administrators. Moderators can escalate content they encounter.

---

## Roles and Responsibilities

### User
Most users of Academia are simply users.

Users can:
- Search content
- Ask questions
- Answer questions
- Comment on discussions
- Vote on useful answers
- Receive notifications regarding content they care about
- Report content

All users can browse freely but will require authentication to perform any action.

### Moderator
Moderators exist primarily to help students receive answers.

Their responsibility is not platform governance.

Instead, moderators:
- Receive notifications about new and unanswered questions within their assigned hub
- Help ensure questions do not remain unanswered for long periods
- Escalate problematic content to administrators when necessary

### School Representative
Each hub may have one or more school representatives.

School representatives:
- Maintain information related to their institution
- Assign moderators to assist with community activity
- Act as coordinators rather than administrators

### Platform Administrator
Platform administrators maintain the overall system.

Administrators:
- Manage schools
- Approve hub activations
- Assign representatives
- Review reports
- Oversee the health of the platform as a whole

---

## API Versioning & Public API Strategy

The API is namespaced under `/api/v1/` from day one, even though no external consumer exists yet. This avoids a breaking migration later.

Planned rollout:
- **Phase A (MVP):** Internal only, first-party frontend, JWT user auth.
- **Phase B:** Read-only public endpoints (schools, hub metadata, published questions/answers, tags) behind an `APIClient` key with per-client rate limits.
- **Phase C:** Broader public API, potentially including a self-serve developer portal.

---

## Future: Reviews & Reputation System

Schools may eventually have a review system where students rate and describe their experience across categories (academics, facilities, social life, career support, value for money).

Design constraints:
- Reviews are moderated through the same `Report` pipeline as questions/answers/comments, no separate, more lenient or stricter standard.
- Verified schools may post one official `ReviewResponse` per review to add context or rebut inaccuracies, but cannot remove or hide the review itself.
- No subscription tier may suppress, hide, or deprioritize a legitimate negative review. Paid tiers affect *promotion and verification only* (see Monetization below).

---

## Future: Monetization

Schools may subscribe to paid plans (`Plan`/`Subscription`/`Invoice`). What paid plans are allowed to unlock:
- Verified badge on the school profile
- Promoted placement in search/browse results
- Official responses to reviews
- Analytics dashboard for school representatives

What paid plans are explicitly **not** allowed to affect: visibility of reviews, question/answer content, or moderation outcomes.

---

## Developer Tooling & Data Sourcing (Planned, not yet designed)

Two backlog items noted here for visibility, to be designed when we get to them:

- **Content seed command**: a Django management command to populate the database with placeholder content for testing, updated as new models are added, so any developer can spin up a realistic local dataset quickly.
- **Nigerian school directory sourcing**: curating an initial database of Nigerian universities, polytechnics, and colleges (no single authoritative public source currently exists, so this will require manual collection and periodic verification). Tied to this: a user-facing "submit a school that's missing" flow (see `SchoolSubmission` in database-schema.md's Future Models), with an admin verification workflow before a submission becomes a real `School` record. This directory is also intended to eventually back the public API's schools endpoint (see "Public/Developer API" in feature-list.md).

---

## Development Approach

Academia will follow an API-first development process.

Before implementation begins, the project's behavior, data structures, and API responses should be documented and agreed upon.

The backend and frontend should be developed independently against the same documented contracts.

This approach allows both contributors to work simultaneously without waiting for implementation details from the other side.

Documentation is treated as a development artifact rather than an afterthought.

---

## Documentation Structure

The project maintains the following documents, each with a distinct purpose and update cadence:

### project-plan.md (This document)
Defines the vision, philosophy, structure, and guiding decisions of the platform.
Updated during periodic doc-sync passes (see below), not every phase.

### feature-list.md
Defines the complete list of features and requirements to be implemented.
Updated during doc-sync passes.

### database-schema.md
Defines models, relationships, constraints, and data structures.
Updated during doc-sync passes.

### api-contract.md
Defines endpoints, request payloads, response payloads, and API behavior.
Updated during doc-sync passes.

### BUILD_LOG.md
Short-term working memory. Updated after **every** completed phase, current
phase, completed phases, key decisions, conventions established, and known
deviations from the four core docs above. Its "Known Deviations" section is
the queue of items waiting to be merged into the core docs at the next sync.

### CHANGELOG.md (repo root) / docs/changelog.md (published docs site)
The durable history. Gets a small entry after every phase, plus a "Docs Sync"
entry whenever the four core docs are updated, describing what moved from
"deviation" to "documented plan." Entries are grouped by development phase
and date rather than semantic version, this project isn't a versioned
external release yet. Once the public API ships, its endpoints carry their
own `/v1/`, `/v2/` versioning independent of this log.

**Each document should remain focused on its purpose and avoid duplicating information that belongs elsewhere.**

---

## Future Direction

The initial release focuses on creating a reliable academic question-and-answer platform organized around schools.

Future versions may expand into additional educational services such as scholarship discovery, internship opportunities, academic resources, AI-assisted search, mobile applications, and other tools that align with the platform's mission.

Regardless of future expansion, the primary goal remains unchanged:

> To become the most useful destination for students seeking answers to academic questions.
