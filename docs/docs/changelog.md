# Changelog

This page tracks the development history of Academia's backend and its
documentation. Entries are grouped by development phase and date, not
semantic version — the project isn't published as a versioned package yet.
Once a public API is released, that surface will carry its own `/v1/`,
`/v2/` versioning, tracked separately from this page.

## Docs Sync — July 3, 2026

Three small corrections to the API Contract, all reflecting behavior that
was already live from Phase 4:

- Documented the 404 response for fetching a single hub.
- Documented the error responses for requesting a hub activation — you
  can't request a hub for a school that already has one, and you can't
  pile up duplicate pending requests for the same school.
- Fixed a labeling inconsistency on question creation's invalid-hub error
  (it's a 400, not a 404 — the documented body was already correct, just
  mislabeled).

## Phase 5 — Questions — July 3, 2026

Added the Question model, scoped to a school hub with an optional
department. Full list/create/detail/update/delete, plus a moderator-facing
"unanswered questions" queue (admin-only until the Moderator role exists).
Hub and department question counts are now real numbers instead of
placeholders. Tags can be submitted when creating or editing a question but
aren't stored yet — that lands with the tagging system in the next phase.

## Phase 4 — Hubs & Activation Requests — July 2, 2026

Added the Hub model and the activation request workflow: students can
request a hub for a school that doesn't have one yet, and admins can
approve or reject those requests. Approving creates the hub and marks the
school as having one — the `has_hub` field on schools, previously always
`false`, now reflects reality. Duplicate requests for the same school are
blocked, as is requesting a hub for a school that already has one.

## Phase 3 — Departments — July 2, 2026

Added departments as a sub-resource of schools — a school can list its
departments publicly, and admins can add or update them. Deactivating a
department (rather than deleting it) keeps historical data intact, the same
soft-delete pattern used for schools.

## Docs Sync — July 2, 2026

The four core documents ([Project Plan](project-plan.md),
[Feature List](feature-list.md), [Database Schema](database-schema.md),
[API Contract](api-contract.md)) were updated to reflect decisions made
while building Phases 0–2:

- Schools now carry a `verification_status` field, paving the way for a
  future school verification/claiming feature.
- Reports and notifications now use Django's ContentType framework
  internally, so future content types (like school reviews) can be
  reported or notified about without a schema change — the public API
  shape is unaffected.
- The API Contract now includes a full step-by-step guide for implementing
  the Google login flow from a frontend, plus a documented versioning
  policy (`/api/v1/`, future `/api/v2/`).
- Added a documented, ethics-first design for the planned school review
  system, and for how paid plans may (and may not) affect visibility —
  see "Integrity Over Monetization" in the Project Plan.
- Documented a backlog for a future public API, and for curating a
  Nigerian school directory with a user-submission workflow.

## Phase 2 — Schools — July 1, 2026

Added the School model with public list/search/detail endpoints and
admin-only create/update. "Deleting" a school is implemented as a
soft-delete (`is_active=False`) rather than a hard-delete endpoint, to
avoid orphaning related data as more features are built on top of it.

## Phase 1 — Authentication — July 1, 2026

Added Google login and JWT-based session handling. Implemented via a
direct call to Google's own userinfo endpoint rather than a heavier
social-auth library — simpler for a pure API backend, and documented in
full for frontend implementers in the API Contract.

## Phase 0 — Project Scaffolding — July 1, 2026

Initial Django project setup: split settings, PostgreSQL, and a
health-check endpoint to confirm everything is wired correctly before
real features begin.
