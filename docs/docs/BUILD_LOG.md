# BUILD LOG

## Current Phase
Phase 5 — Questions (complete, confirmed)

## Completed Phases
- Phase 0: Django 6.0.6 project scaffolded, settings split (base/development/production),
  PostgreSQL connected via django-environ, health-check endpoint live at /api/v1/health/.
- Phase 1: Custom User model (apps.accounts) on UUID PK, email-based auth. Google OAuth
  verified via Google's userinfo endpoint (not allauth). JWT issued via SimpleJWT with
  refresh rotation + blacklist. Endpoints: /api/v1/auth/google/, /api/v1/auth/refresh/,
  /api/v1/auth/logout/, /api/v1/users/me/ (GET/PATCH).
- Phase 2: School model (apps.schools) with verification_status field. List/search/detail
  endpoints public; create/update admin-only via IsPlatformAdmin permission. Global
  error-response normalizer added (apps.core.exceptions).
- Phase 3: Department model in apps.schools. List (public) + create/update (admin-only)
  scoped under School. Soft-delete via is_active.
- Phase 4: Hub + HubActivationRequest models (apps.hubs). GET hub by id and by school
  (public). Activation request create (auth) / list (admin, status filter) / approve
  (admin, creates Hub) / reject (admin). School.has_hub and its query filter wired to
  real data.
- Phase 5: Question model (apps.questions), scoped to Hub with optional Department.
  List (public, filterable by hub/department/status/search, orderable) / create (auth) /
  detail (public, increments view_count) / update+delete (author-only) / unanswered
  queue (admin-only for now). Hub.question_count and Department.question_count wired to
  real data. tags field accepted on create/update but not persisted — Tag/QuestionTag
  models land in Phase 6; response always shows tags: [] until then. answer_count and
  best_answer_id still stubbed pending Phase 7.

## Key Decisions Made
- API namespaced under /api/v1/ from the start
- Report/Notification use Django ContentType (GenericForeignKey), not string fields
- Reviews/Billing apps reserved but not built in MVP
- Django 6.0.6 on Python 3.12, psycopg3 as DB driver
- Settings split into config/settings/{base,development,production}.py, env vars via django-environ
- App code lives under apps/ (apps.core, apps.accounts, apps.schools, apps.hubs, apps.questions so far)
- Backend is a pure API — no server-rendered product pages; frontend framework left fully open
- Google auth verified by calling Google's userinfo endpoint with the client-supplied
  access_token, instead of django-allauth's full social-auth flow
- Shared permission (IsPlatformAdmin) and exception handler live in apps.core for reuse
  across all future apps
- School/Department "delete" is soft-delete via is_active through PATCH
- Sub-resources with no independent lifecycle live in their owning app (Department in
  apps.schools); Hub and Question each get their own app since they own further
  sub-resources down the line
- Activation requests reject duplicate PENDING requests per school and requests against
  schools with an already-active hub — now documented in api-contract.md as of this sync
- Question view_count increments via a targeted .update() call rather than a full model
  .save(), so viewing a question doesn't also bump its updated_at timestamp
- Fields for not-yet-built relations (tags, answer_count, best_answer_id, question_count,
  moderator_count) are implemented as model properties returning safe stub values
  (empty list / 0 / null) so API response shape never changes when the real feature lands

## Conventions Established
- manage.py/wsgi.py/asgi.py default to development settings; production is explicit via env
- All new apps go under apps/<app_name>/ with dotted INSTALLED_APPS path apps.<app_name>
- .env holds secrets, .env.example is the committed template
- Custom User model: apps.accounts.User, UUID PK, USERNAME_FIELD=email, no username field
- All list endpoints use PageNumberPagination with a per-app pagination class
  (page_size default 20, configurable max) matching api-contract.md's {count, next,
  previous, results} shape
- All error responses normalized to api-contract.md's {"error": "..."} shape via
  apps.core.exceptions.custom_exception_handler; 400s stay field-keyed
- is_admin (not is_staff) is the platform-permission flag checked by API views
- Sub-resources tightly owned by a parent model with no independent lifecycle live in
  the parent's app; sub-resources with their own future sub-resources get their own app
- Ownership checks (author-only edit/delete) raise PermissionDenied for a 403 with the
  documented error message, checked explicitly against request.user.id before any write

## Known Deviations From Docs
(none — everything flagged across Phases 3–5 has been merged into the four core docs
and both changelogs as of this sync. This section resets after every docs sync.)

## Next Immediate Step
Phase 6 — Tags (Tag + QuestionTag models; wire the tags field on Question create/update/
list/detail to real data, replacing the Phase 5 stub; tag list/search/popular endpoints;
tag-based question filtering)
