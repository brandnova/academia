# Changelog

This page tracks the development history of Academia's backend and its
documentation. Entries are grouped by development phase and date, not
semantic version, the project isn't published as a versioned package yet.
Once a public API is released, that surface will carry its own /v1/,
/v2/ versioning, tracked separately from this page.

## Frontend Docs Sync, July 12, 2026

Synced the frontend build's accumulated deviations into the four core docs:

- project-plan.md and project-overview.md updated to reflect the frontend
  framework decision (Next.js App Router, JavaScript, Tailwind v4) and the
  httpOnly-cookie auth proxy architecture, replacing the "intentionally left
  open" placeholder language from the planning phase.
- project-overview.md's "Open Questions for Discussion" resolved: dark mode
  ships from day one, accent-blue palette picked fresh, no component library
  used.
- feature-list.md gained explicit entries for department management and
  question following (backend-complete, frontend following still pending),
  clarified that question lock/close is backend-complete but not yet wired
  into the frontend, and added two Platform Improvements items surfaced
  during the frontend build (refresh-token deduplication, an answer/comment
  permalink page for notification/report deep-linking).
- api-contract.md and database-schema.md needed no changes, every frontend
  deviation encountered during this build turned out to be an implementation
  bug that didn't match already-correct documented behavior, not a real
  documentation gap.
- One item intentionally left unresolved: api-contract.md's Search Users
  section documents Admin or School Representative access, a message during
  development described the intended permission as including Moderators
  instead, never confirmed which is correct.

## Frontend Build, Phases 0 through 15, July 2026

The full frontend MVP, built in Next.js against the completed backend API,
phased the same way the backend was: Phase 0 scaffolding through Phase 15
admin tooling, each phase confirmed working before moving to the next.

- Auth: Google Identity Services client-side, exchanged through the
  frontend's own Route Handler proxy, which holds the JWT pair as httpOnly
  cookies and owns the full refresh lifecycle server-side.
- Core browsing: school directory and profile, hub pages, question list and
  detail, tag browse, global search, all with debounced search, skeleton
  loading states, and load-more-append pagination as running conventions.
- Full question lifecycle: ask (school-first flow with a live school
  picker), answer, vote, comment, mark best answer, with the best answer
  pinned and highlighted separately from the main answer list.
- Moderation surface split by audience: /moderation for Moderators and
  School Representatives, scoped to their own hubs (including department
  management and a self-service path to the unanswered queue by adding
  themselves as moderator); /admin for platform admins (schools,
  activation requests, reports, users, cross-hub team assignment).
- Notifications and a rebuilt profile page (editable name, activity stats,
  merged recent-activity feed, paginated post history by type), reports
  never surfaced on any profile, including to the reporter, matching the
  documented privacy design.
- Two backend bugs found and fixed during frontend testing: a report's
  resolve-with-delete-content action failed on Django's save-time check for
  a stale GenericForeignKey cache; GET /users/me/comments/ 500'd on a
  nonexistent path kwarg and had the wrong permission class. Two more
  visibility bugs, deactivated schools and departments disappearing from
  every view including the admin/rep view meant to manage them, since both
  endpoints unconditionally filtered to is_active=True regardless of who
  was asking, despite api-contract.md already documenting the intended
  admin/rep-visible behavior correctly.

## Docs Sync, July 5, 2026

A larger sync this time, closing out the originally planned 15-phase MVP
build:

- Full-text search moved from a planned feature to a documented current
  implementation, using PostgreSQL's built-in search rather than a
  separate search service for now.
- Added a Rate Limiting section describing the general request limit and
  the tighter limits on specific actions like posting or voting.
- Documented the new user administration endpoints (view and suspend
  accounts).
- Clarified a few smaller details found while reviewing Phases 12 through
  15: how duplicate reports are handled, what the search relevance score
  actually represents, and a couple of small label inconsistencies.
- Updated the feature checklist to reflect everything actually built so
  far, and to be explicit about the handful of things intentionally left
  for later (like a moderator-assignment notification and a dedicated
  content escalation action).

## Phase 15, Admin Polish, July 5, 2026

Admins can now view and suspend user accounts (promoting someone to admin
is handled separately, not part of this). Admins can't suspend their own
account, to avoid accidental lockout. The rate limits described in the API
documentation from early on are now actually enforced: a general limit for
overall traffic, plus tighter limits on things like posting questions or
voting, so a burst of activity from one source can't overwhelm the
platform for everyone else.

## Phase 14, Role Assignment, July 4, 2026

School representatives can now assign and remove moderators for their hub,
and manage their school's departments, without needing full admin access.
Only admins can assign representatives themselves. The unanswered-questions
queue now actually respects who's assigned to moderate which hub, rather
than being admin-only.

## Phase 13, Reports and Moderation, July 4, 2026

Users can report a question, answer, or comment as spam, abuse,
misinformation, or a duplicate. Admins can review these reports, resolve
them (optionally removing the reported content), or reject them. You can't
report the same piece of content twice.

## Phase 12, Search, July 4, 2026

Added a dedicated search endpoint for questions, using PostgreSQL's
full-text search. Solved questions with well-voted answers rank highest,
followed by recency and text relevance. Results can be narrowed by school,
hub, department, or tag, alongside the search text itself.

## Phase 11, Notifications, July 4, 2026

Added notifications for the moments that matter most: someone answers your
question, your answer gets marked as the best one, or your hub request
gets approved. These arrive both in-app and by email, since students
aren't expected to stay logged into the platform between visits. Smaller
interactions, like a new comment or a vote, show up in-app only, to avoid
filling inboxes with low-stakes updates.

## Docs Sync, July 4, 2026

Cleaned up a few loose ends found while reviewing Phases 6 through 10:

- Removed a leftover error example from the Update Question section that
  didn't match any field the endpoint actually accepts, and clarified that
  question status changes automatically based on answering, marking a best
  answer, or deleting answers, rather than being set directly.
- Documented that deleting an answer can move a question's status
  backward: to Answered if the deleted answer was the best one and others
  remain, or to Open if it was the last one.
- Added the previously missing List Comments endpoint. Comments could be
  created before this, but there was no way to actually retrieve them.
- Brought the feature checklist up to date with what's actually built so
  far.

## Phase 10, Best Answer and Question Lifecycle, July 4, 2026

Question owners can now mark a best answer, which moves the question to
Solved. The best answer can be switched to a different one later if the
owner changes their mind. Deleting answers keeps a question's status
honest: losing the best answer drops it back to Answered, losing the last
answer drops it back to Open.

## Phase 9, Comments, July 3, 2026

Added comments on answers, create, edit, delete, all author-only, plus a
running comment count on each answer.

## Phase 8, Voting, July 3, 2026

Added upvoting and downvoting on answers. You can't vote on your own
answer, and you can't vote twice on the same one, remove your vote first
if you want to change it.

## Phase 7, Answers, July 3, 2026

Added answers to questions. A question automatically moves from Open to
Answered the moment it gets its first answer, and answering is blocked
once a question is marked Solved. Deleting a question's last remaining
answer now correctly moves it back to Open.

## Phase 6, Tags, July 3, 2026

Added tagging for questions. Tags are case-insensitive under the hood, so
"GPA" and "gpa" are treated as the same tag. You can browse tags, see the
most popular ones, and filter questions by tag.

## Docs Sync, July 3, 2026

Three small corrections to the API Contract, all reflecting behavior that
was already live from Phase 4:

- Documented the 404 response for fetching a single hub.
- Documented the error responses for requesting a hub activation, you
  can't request a hub for a school that already has one, and you can't
  pile up duplicate pending requests for the same school.
- Fixed a labeling inconsistency on question creation's invalid-hub error
  (it's a 400, not a 404, the documented body was already correct, just
  mislabeled).

## Phase 5, Questions, July 3, 2026

Added the Question model, scoped to a school hub with an optional
department. Full list/create/detail/update/delete, plus a moderator-facing
"unanswered questions" queue (admin-only until the Moderator role exists).
Hub and department question counts are now real numbers instead of
placeholders. Tags can be submitted when creating or editing a question but
aren't stored yet, that lands with the tagging system in the next phase.

## Phase 4, Hubs and Activation Requests, July 2, 2026

Added the Hub model and the activation request workflow: students can
request a hub for a school that doesn't have one yet, and admins can
approve or reject those requests. Approving creates the hub and marks the
school as having one, the has_hub field on schools, previously always
false, now reflects reality. Duplicate requests for the same school are
blocked, as is requesting a hub for a school that already has one.

## Phase 3, Departments, July 2, 2026

Added departments as a sub-resource of schools, a school can list its
departments publicly, and admins can add or update them. Deactivating a
department (rather than deleting it) keeps historical data intact, the same
soft-delete pattern used for schools.

## Docs Sync, July 2, 2026

The four core documents (Project Plan, Feature List, Database Schema,
API Contract) were updated to reflect decisions made while building
Phases 0 through 2:

- Schools now carry a verification_status field, paving the way for a
  future school verification/claiming feature.
- Reports and notifications now use Django's ContentType framework
  internally, so future content types (like school reviews) can be
  reported or notified about without a schema change, the public API
  shape is unaffected.
- The API Contract now includes a full step-by-step guide for implementing
  the Google login flow from a frontend, plus a documented versioning
  policy (/api/v1/, future /api/v2/).
- Added a documented, ethics-first design for the planned school review
  system, and for how paid plans may (and may not) affect visibility,
  see "Integrity Over Monetization" in the Project Plan.
- Documented a backlog for a future public API, and for curating a
  Nigerian school directory with a user-submission workflow.

## Phase 2, Schools, July 1, 2026

Added the School model with public list/search/detail endpoints and
admin-only create/update. "Deleting" a school is implemented as a
soft-delete (is_active=False) rather than a hard-delete endpoint, to
avoid orphaning related data as more features are built on top of it.

## Phase 1, Authentication, July 1, 2026

Added Google login and JWT-based session handling. Implemented via a
direct call to Google's own userinfo endpoint rather than a heavier
social-auth library, simpler for a pure API backend, and documented in
full for frontend implementers in the API Contract.

## Phase 0, Project Scaffolding, July 1, 2026

Initial Django project setup: split settings, PostgreSQL, and a
health-check endpoint to confirm everything is wired correctly before
real features begin.
