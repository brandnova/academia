# BUILD LOG

## Current Phase
Phase 15, Admin Polish (complete, confirmed). This closes the originally planned MVP
phase roadmap. CORS setup and production-readiness prep are next, tracked as
unnumbered follow-up work rather than a new phase, since they are infrastructure
concerns rather than a feature slice.

## Completed Phases
- Phase 0: Django 6.0.6 project scaffolded, settings split (base/development/production),
  PostgreSQL connected via django-environ, health-check endpoint live at /api/v1/health/.
- Phase 1: Custom User model, Google OAuth via direct userinfo endpoint (not django-allauth),
  SimpleJWT with refresh rotation and blacklisting.
- Phase 2: School model with soft-delete and verification_status, admin-only create/update,
  global error-response normalizer in apps.core.exceptions.
- Phase 3: Department as sub-resource of School in apps.schools.
- Phase 4: Hub and HubActivationRequest in apps.hubs, full activation workflow, has_hub
  wired to real data.
- Phase 5: Question model in apps.questions, view count via targeted update, author-only
  edit/delete, tags accepted but stubbed.
- Phase 6: Tag and QuestionTag in apps.tags, lowercase normalization, deduplication,
  fully wired into questions.
- Phase 7: Answer model, auto-transition Question OPEN to ANSWERED, status revert to
  OPEN when last answer deleted.
- Phase 8: AnswerVote with F() expression updates, self-vote and duplicate-vote blocking.
- Phase 9: Comment model in apps.comments, comment_count wired.
- Phase 10: Mark-best-answer endpoint, delete-revert logic, GET /answers/{id}/comments/.
- Phase 11: Notification model with mindful email/in-app channel policy, MailHog wired.
- Phase 12: Postgres full-text search endpoint, solved then vote then recency then
  relevance ordering.
- Phase 13: Report model using Django ContentType, generic across Question/Answer/Comment,
  admin-only resolve/reject workflow.
- Phase 14: ModeratorAssignment and SchoolRepresentativeAssignment models, representative
  and moderator scoped permissions, unanswered queue scoped to real assignments.
- Phase 15: Admin user management (list/detail/suspend, view-and-suspend scope only, no
  promote/demote here), self-suspension blocked. Rate limiting from api-contract.md's
  documented table now actually enforced via DRF throttling: global 100/min default for
  both anonymous and authenticated requests, plus tighter scoped throttles on specific
  write actions (auth, question creation, answer creation, comment creation, voting,
  search, report creation). 429 responses normalized to the documented
  {"error": "Rate limit exceeded..."} shape.


## Production Readiness Pass (Post-MVP)
Not a numbered phase, infrastructure work following the completed 15-phase MVP.
Pending your verification before considered final.

### Added
- django-cors-headers configured, CORS_ALLOWED_ORIGINS env-driven, defaults to
  localhost:3000 for local Next.js dev, no credentials (bearer tokens, not cookies)
- Redis caching via django-redis, REDIS_URL env-driven, falls back automatically to
  LocMemCache when unset. IGNORE_EXCEPTIONS=True means Redis outages fail open
  (throttling stops blocking, cached views just recompute) rather than crashing
- DRF throttle cache now backed by the same Redis/LocMem cache automatically
- View-level caching added to Schools (list, detail), Hubs (detail, by-school), Tags
  (list), and Search, all public non-personalized read endpoints. Deliberately NOT
  added to Questions, Answers, Comments, or Notifications, live content and
  view-count-incrementing endpoints should not be cached
- Cache invalidation is precise for detail views (School, Hub) via direct key
  deletion on write; list/search caches rely on short TTLs only (best-effort
  delete_pattern invalidation via django-redis when available, silent no-op on
  LocMem fallback)
- DATABASE_URL support added alongside the existing discrete DATABASE_* vars, for
  compatibility with hosted Postgres providers that issue a single connection string
- Production settings hardened: SECURE_PROXY_SSL_HEADER (required behind PaaS
  reverse proxies like PythonAnywhere), SECURE_SSL_REDIRECT, HSTS, secure cookies,
  CSRF_TRUSTED_ORIGINS, all env-configurable
- whitenoise added for static file serving, portable across PythonAnywhere and any
  future VPS
- Structured console logging added (LOGGING dict in base.py)
- Health check endpoint upgraded to verify real database and cache connectivity,
  not just process liveness
- Custom handler404/handler500 at the project urls level, so unmatched API routes
  and uncaught production errors return the documented {"error": "..."} JSON shape
  instead of Django's default HTML error pages. Non-api paths (like /admin/) still
  get Django's normal error pages.
- seed_demo_data management command (apps.core), a custom script rather than a
  Faker dependency, populates schools, hubs, departments, questions across all
  three statuses, answers, votes, comments, tags, and a sample report, including
  deliberate empty-state and pending-request scenarios for frontend testing.

## Key Decisions Made
- API namespaced under /api/v1/ from the start
- Report/Notification use Django ContentType (GenericForeignKey), not string fields
- Reviews/Billing apps reserved but not built in MVP
- Django 6.0.6 on Python 3.12, psycopg3 as DB driver
- Settings split into config/settings/{base,development,production}.py, env vars via django-environ
- App code lives under apps/ (apps.core, apps.accounts, apps.schools, apps.hubs,
  apps.questions, apps.tags, apps.answers, apps.comments, apps.notifications,
  apps.search, apps.reports so far)
- Backend is a pure API, no server-rendered product pages; frontend framework left fully open
- Google auth verified by calling Google's userinfo endpoint with the client-supplied
  access_token, instead of django-allauth's full social-auth flow
- Shared permission (IsPlatformAdmin) and exception handler live in apps.core for reuse
  across all future apps
- School/Department "delete" is soft-delete via is_active through PATCH
- Sub-resources with no independent lifecycle live in their owning app; sub-resources
  owning further children each get their own app
- Fields for not-yet-built relations are implemented as model properties returning safe
  stub values so API response shape never changes when the real feature lands
- Tag names normalized to lowercase everywhere
- Question status reverts to OPEN when its answer count drops to zero, and to ANSWERED
  when its best answer specifically is deleted but other answers remain
- Notification channel policy: email reserved for actions worth pulling a user back to
  the platform, everything else stays in-app only
- Search ranking priority is solved status, then vote score, then recency, then relevance
- A user cannot report the same content twice regardless of the earlier report's status
- Platform admins implicitly satisfy any representative or moderator permission check
- Moderator and representative assignment removal is soft-delete via is_active
- Admin user management is view-and-suspend only in this phase, no is_admin
  promotion/demotion endpoint, to avoid building a privilege-escalation surface in the
  same pass as basic suspension
- An admin cannot suspend their own account, a safeguard to prevent accidental lockout,
  not documented anywhere before this phase
- Rate limit throttle cache uses Django's default LocMemCache, fine for local dev and
  single-process testing, will need a shared cache (Redis) once running multiple
  workers in production, since per-process counters would otherwise disagree
- Scoped write-action throttles (question_create, answer_create, etc.) replace the
  general 100/min limit for that specific action rather than stacking with it; GET
  requests on the same endpoints are unaffected by the write-scoped throttle
- Caching philosophy: cache structural/directory data (schools, hubs, tags), never
  cache live Q&A content or anything with a side effect on read (view_count)
  or personalized output (notifications)
- Redis failures fail open, not closed. Prioritizing uptime over strict rate-limit
  enforcement or cache freshness during a Redis outage
- gunicorn added to requirements for VPS portability, even though PythonAnywhere
  uses its own WSGI dispatch rather than gunicorn directly

## Conventions Established
- manage.py/wsgi.py/asgi.py default to development settings; production is explicit via env
- All new apps go under apps/<app_name>/ with dotted INSTALLED_APPS path apps.<app_name>
- .env holds secrets, .env.example is the committed template
- Custom User model: apps.accounts.User, UUID PK, USERNAME_FIELD=email, no username field
- All list endpoints use PageNumberPagination with a per-app pagination class
  (page_size default 20, configurable max) matching api-contract.md's {count, next,
  previous, results} shape
- All error responses normalized to api-contract.md's {"error": "..."} shape via
  apps.core.exceptions.custom_exception_handler; 400s stay field-keyed, 429s also
  normalized to the documented rate-limit error shape
- is_admin (not is_staff) is the platform-permission flag checked by API views
- Sub-resources tightly owned by a parent model with no independent lifecycle live in
  the parent's app; sub-resources with their own future sub-resources get their own app
- Ownership checks (author-only edit/delete) raise PermissionDenied for a 403, checked
  explicitly against request.user.id before any write
- Cross-app model relations use related_name reverse descriptors; cross-app serializer
  references use deferred (in-method) imports to avoid circular imports
- Aggregate/derived counts are recomputed via targeted .update() calls, not full .save()
- Documentation style: no em dash character in any doc content, use commas, colons, or periods
- Email templates live in templates/emails/, extend a shared base_email.html
- Cross-cutting side effects (notifications) are triggered from the view layer immediately
  after the write succeeds, not from model signals
- Query annotations for cross-cutting ranking live in the view, not the model
- Role-permission checks live in apps.hubs.permissions as small standalone functions,
  reused via deferred imports across apps
- Throttle scoping is applied per-view via throttle_classes/throttle_scope, with a
  custom MethodScopedThrottle (apps.core.throttling) for endpoints where only specific
  HTTP methods should count against a scoped rate

## Known Deviations From Docs
- The 404 fix means unmatched routes now honor api-contract.md's documented
  404 shape more completely than before, this is a genuine gap-closing fix,
  not a new deviation, worth a one-line mention at the next docs sync.


## Next Immediate Step
Frontend build, starting in a new chat, Next.js decided as the framework. School
list acquisition (real data sourcing from NUC/NBTE/NCCE) and the extended School
schema remain queued as future work, not blocking frontend development, since the
seed command already provides realistic demo data to build against.
