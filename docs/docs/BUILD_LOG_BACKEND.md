# BUILD LOG

## Current Phase
Not a numbered phase. Two related GitHub issues: MODERATOR_ASSIGNED existed as
a Notification type and the assignment endpoints existed since Phase 14, but
nothing ever triggered it. Broader review requested alongside it turned up a
second real gap: project-plan.md's Moderator Responsibilities section
describes moderators receiving notifications about new questions in their
hub, this was documented from the start and never built.

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

## API Completeness & Permission Visibility Pass (Post-MVP)
Not a numbered phase. Addresses two real gaps found in review: the health check
endpoint was never documented, and there was no way for the frontend to know
whether the current user is a Moderator or School Representative for a given
hub, nor a way to see who currently holds a hub's representative assignments.

## Vote State Visibility Fix (Post-MVP)
Not a numbered phase. Addresses a real gap: the answer object embedded in
question detail exposed vote_score (the aggregate) but never the requesting
user's own vote, so the frontend had no way to restore correct vote-button
state after a page reload, only what happened during the current session.

## SOLVED Status Semantics Fix (Post-MVP)
Not a numbered phase. Found during frontend testing: creating an answer was
blocked once a question's status was SOLVED, conflating two separate meanings,
"has a designated best answer" and "closed to further input." Decoupled these.

## User Search and Self Profile Pass (Post-MVP)
Not a numbered phase. No migrations, both features are built entirely from
existing tables and views.

## Static Pages Feature (Post-MVP)
Not a numbered phase. New apps.pages app: admin-managed standalone content
pages (Privacy Policy, Terms of Service, staff onboarding guides) without
needing a code deploy to publish them.

## seed_demo_data Upgrade (Post-MVP, Tooling)
Not a numbered phase, dev tooling only, no contract impact. The command had
fallen out of sync with the actual models, it predated is_locked,
QuestionFollow, and StaticPage entirely, none of them were being seeded.

## Notification Fan-Out Widening + Admin Activation-Request Alert (Post-MVP)
Not a numbered phase. Two follow-ups after your feedback on the previous
notification pass.

## New Report Admin Notification (Post-MVP)
Not a numbered phase. Closes the second of the two admin-notification gaps
flagged during the moderator-assignment notification review: admins had no
way to know a new Report existed except by polling GET /reports/?status=PENDING.

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
- GET /users/me/ (and the Google Login response's nested user object) now
  include moderator_for and representative_for, arrays of active hub
  assignments with nested school id/name/slug
- GET /hubs/{hub_id}/representatives/ (new, public), mirrors the existing
  List Moderators endpoint, closes the "no way to see current reps" gap
- slug added to every nested school representation across the API (Hub
  detail, Question's hub.school, activation request's school), so the
  frontend never needs an extra lookup just to link back to a school page
- api-contract.md gained a new Frontend Permission Model section explaining
  roles, how a user acquires one, and a concrete table of what to show when
- Health Check documented in api-contract.md for the first time
- user_vote ("UP"/"DOWN"/null) added to the Answer serializer used everywhere
  an answer object appears: nested in question detail, and in the Create/Update
  Answer responses. Null for anonymous requests and always null on an answer's
  own author, since self-voting is blocked
- Every place that builds a QuestionDetailSerializer or AnswerResponseSerializer
  now explicitly passes request context, previously several call sites
  (question detail GET/PATCH, question create response, answer create/update
  responses) constructed these serializers without context, which would have
  silently made user_vote resolve to null even for a user who had voted
- AnswerCreateSerializer no longer blocks answer creation on SOLVED questions,
  the validate() method that raised "Cannot add answer to a solved question"
  was removed entirely
- No change needed to the OPEN to ANSWERED transition (already status-gated
  to OPEN only, so a SOLVED question correctly stays SOLVED when a new plain
  answer arrives), the delete-answer revert logic, or the mark-best transfer
  logic, all three were already written in a way consistent with SOLVED
  meaning has-a-best-answer rather than locked
- user_is_representative_for_any_hub() added to apps.hubs.permissions,
  intentionally unscoped since the search endpoint isn't hub-specific
- GET /users/search/, admin or any active school representative, returns up
  to 10 matching users by name/email, not paginated, closes the gap where
  representatives had no way to find a user_id for the moderator-assignment
  endpoints without admin access
- GET /users/me/ now includes a stats object (question_count, answer_count,
  best_answer_count, comment_count), counts only, actual objects are fetched
  via the endpoints below, deliberately kept out of this payload since it's
  called frequently (login, entering a hub management context) and shouldn't
  carry a user's full activity history on every call
- GET /users/me/answers/ and GET /users/me/comments/, both self-scoped and
  authenticated, paginated, ordered by recency. New AnswerPagination class
  in apps.answers, first paginated list endpoint that app has needed
- author query param added to GET /questions/, filters by author user ID,
  validated the same way as path-based IDs, 400 on malformed input, covers
  "my questions" without a dedicated endpoint since questions are already
  public
- DELETE /tags/{tag_id}/ (admin only), blocked by default if the tag has
  questions attached, ?force=true overrides. Deleting cascades to QuestionTag
  rows via the existing FK constraint, question content itself is untouched
- POST /tags/{tag_id}/merge/ (admin only), reassigns every QuestionTag from
  the source tag onto a target, then deletes the source. Target given as
  target_tag_id (merge into an existing tag) or target_name (merges by name
  if that name already exists, otherwise performs a pure rename)
- Both endpoints invalidate the tag-list cache prefix on success
- Assigning a moderator or a representative now sends the target user a
  MODERATOR_ASSIGNED notification, in-app only, unless they assigned
  themselves (self-assignment is an existing allowed flow, doesn't need a
  notification telling someone what they just did)
- New NEW_QUESTION notification type. Creating a question notifies every
  active moderator of that hub, in-app only, excluding the question's own
  author even if they happen to also moderate that hub
- StaticPage model: title, auto-generated-once slug (School's pattern, not
  Question's), markdown body (rendered client-side, no server-side markdown
  processing), visibility (PUBLIC/STAFF), is_published draft flag,
  created_by (SET_NULL, deleting a user never takes a page down with it)
- user_is_staff() added to apps.hubs.permissions, checks is_admin or any
  active moderator/representative assignment globally, not scoped to a
  specific hub like the existing helpers, since page visibility isn't
  hub-specific
- GET /pages/ (list, not paginated) and POST /pages/ (admin only) on one
  view. GET /pages/{value}/ and PATCH/DELETE /pages/{value}/ share a single
  URL pattern, method-dispatched: GET treats the value as a slug and is
  public, PATCH/DELETE treat it as a UUID id and are admin-only
- 404, not 403, for a page that exists but isn't visible to the requester,
  same code path as "doesn't exist at all" (_visible_queryset().filter().
  first() returning None either way), so a STAFF-only or draft page's
  existence is never confirmable to a request that can't see it
- Delete is a genuine hard delete, confirmed via testing that a
  recreated page with the same title reuses the original slug cleanly
  rather than getting suffixed, proving the original row is truly gone
- --clear flag, wipes seeded content (schools cascade nearly everything;
  Tag and StaticPage cleared separately since neither cascades from School)
  before reseeding fresh
- Static pages seeded: 3 published PUBLIC, 1 published STAFF, 1 unpublished
  draft, covering every visibility/published combination
- First hub gets a representative and moderator assigned automatically, so
  the admin dashboard isn't empty by default
- QuestionFollow and is_locked now seeded with reasonable variety
- Reports now seeded across all three statuses (PENDING/RESOLVED/REJECTED),
  not just one
- NEW_QUESTION now also notifies active School Representatives of the hub,
  not just Moderators, deduplicated via set union so a user holding both
  roles for the same hub gets one notification, not two. Message wording
  changed from moderator-specific phrasing to a role-neutral "New question
  posted in {school}"
- New NEW_ACTIVATION_REQUEST notification type. Submitting a
  HubActivationRequest now notifies every active admin, in-app only,
  excluding the requester if they happen to be an admin
- New NEW_REPORT notification type. Submitting a report now notifies every
  active admin, in-app only, excluding the reporter if they happen to be an
  admin (admins can and do report content themselves, this isn't a
  theoretical edge case)
- Notification message includes the report's type (spam/abuse/etc.,
  lowercased) for quick triage from the notification list, resolving the
  open question from this feature's original issue template in favor of
  including it

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
- Role visibility is UX-only. The backend enforces every permission
  independently regardless of what moderator_for/representative_for show,
  hiding a control is a convenience, never a substitute for the 403 a user
  would get attempting the action directly
- No push notification exists yet for role assignment (is_moderator/is_rep
  changes), the frontend is expected to refetch GET /users/me/ after login
  and when entering a school/hub management context, not rely on it updating
  mid-session automatically
- admin's moderator_for/representative_for are not backfilled with every hub,
  is_admin alone is the correct signal for blanket access, keeping the
  response bounded regardless of how many hubs exist
- user_vote is computed per-request via a SerializerMethodField querying
  AnswerVote directly, not stored or cached, consistent with how has_hub and
  question_count are already handled elsewhere as derived, not persisted, data
- No new model, no migration, this was purely a serialization and context-
  passing gap
- SOLVED is "has a designated best answer," not "closed." A question accepts
  new answers and can have its best answer reassigned at any status
- A genuine close/lock capability, if ever needed, will be a distinct,
  deliberate moderator/admin action, not an automatic side effect of picking
  a best answer, logged in feature-list.md's Moderation backlog, not built
- Reports are never exposed anywhere related to profile/activity data,
  including to the reporting user themselves in this pass, a private "my
  reports" view remains a distinct, deliberately unbuilt future item
- best_answer_count remains the platform's one deliberate quality signal,
  now surfaced only to the user themselves rather than publicly, since there
  is no public profile view at all right now
- User search is intentionally unscoped to a specific hub, hub-specific
  enforcement already happens at the point of assignment
  (POST /hubs/{hub_id}/moderators/ etc), the search endpoint only gates on
  "is this person an admin or a representative of at least one hub"
- No public user profile endpoint exists in the API at all as of this pass,
  every user-activity endpoint requires authentication and is scoped to the
  requester
- No separate rename endpoint. Merge-into-a-name-that-doesn't-exist-yet
  covers rename exactly, one endpoint, two ways to call it, matches the
  GitHub issue's own "worth deciding" question with the simpler answer
- Merge deduplicates rather than erroring: if a question already carries
  both the source and target tag, the source's QuestionTag row for that
  question is dropped instead of attempted-and-rejected by the
  (question, tag) unique constraint. questions_reassigned only counts
  genuine reassignments, not these drops
- Reused validate_uuid (and its documented "Invalid ID format" 400 shape)
  for target_tag_id in the merge request body, not just path parameters,
  since it's the same malformed-ID problem in a body field instead of a URL
  segment
- Tag management is admin-only, not exposed on /moderation, tags are not
  scoped to a single hub/school the way departments are, a tag can span
  every school on the platform at once, so this belongs on /admin per the
  GitHub issue's own reasoning
- Representative assignment reuses MODERATOR_ASSIGNED rather than getting
  its own type, message text distinguishes the two roles. Matches the
  precedent set by the question-follow system (reusing NEW_ANSWER for
  followers instead of adding a type), keeps the frontend's notification
  icon map from needing another special case for a distinction that's
  really just "assigned to a hub role"
- NEW_QUESTION notifies moderators only, not representatives, grounded
  directly in project-plan.md's existing (never-implemented) description of
  moderator responsibilities. Representatives are described there as
  coordinators, not as the audience for new-content alerts
- Notified via a per-moderator notify() loop, same fan-out shape as the
  follow system's per-follower notifications, no email involved so this is
  pure DB writes, fine at MVP scale, same Celery-backlog note applies if
  moderator counts per hub ever grow large
- created_by uses SET_NULL, not CASCADE, per your explicit call: an admin's
  account being deactivated or removed shouldn't take institutional content
  like a Terms of Service page down with it
- Caching deliberately deferred, matching the issue's own "nice-to-have, not
  blocking," to keep this pass reviewable; same short-TTL pattern already
  used for Schools/Tags is the natural follow-up once confirmed working
- GET-by-slug and PATCH/DELETE-by-id share one URL pattern rather than being
  split into separate routes, since the documented contract specifies the
  same path shape for both, just different HTTP methods and different
  identifier semantics per method
- --clear never touches the User table, real superuser and Google-OAuth
  test accounts, plus any manual is_admin promotion, are preserved across
  resets. Recreating those is real friction (re-auth, re-run
  createsuperuser) this flag shouldn't force
- Removed the old hard block on re-running without --clear (previously:
  warn and exit if any School exists). Since schools/departments/tags are
  already get_or_create-idempotent, running again now just adds more
  questions/answers/comments on top, matching the actual intended use:
  incrementally growing a varied local dataset, not a strict one-shot tool
- Reps included in NEW_QUESTION specifically because a freshly activated
  hub can have zero moderators until a rep assigns some, without reps
  included, a question could be posted into total silence, nobody notified
  at all. This is a real gap being closed, not just a nice-to-have
- Admin notifications (activation requests, and reports once implemented)
  are in-app only, reasoning distinct from the general "email pulls
  infrequent users back" policy: admins are expected to already be
  monitoring their dashboard as part of the role, so this doesn't need to
  pull anyone back to the platform the way a student-facing notification
  does
- Same in-app-only channel policy as NEW_ACTIVATION_REQUEST: admins are
  expected to already be monitoring their dashboard as part of the role,
  this doesn't need to pull anyone back to the platform
- Notification fan-out happens after the Report row is successfully
  created and the duplicate-report check has passed, so a blocked/invalid
  report submission never generates a stray notification

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

## URL & ID Ergonomics Pass (Post-MVP)

Confirmed working. The one test failure encountered during verification (a chain
of KeyErrors while running the cURL suite) traced to a test-script issue, not a
code defect: the verification commands tried to create "University of Lagos" /
"UNILAG", which seed_demo_data had already inserted, causing a 400 duplicate error
that cascaded into empty shell variables for the rest of that run. Corrected
verification (fetching the already-seeded school via search instead of recreating
it) confirmed slug generation, by-slug lookups for both School and Hub, cosmetic
Question slugs, and the 400 Invalid ID format response all work as designed.

### Known Deviations From Docs
- api-contract.md's ID Format Validation section is framed around path
  parameters; this pass reuses the same validator and error shape for the
  target_tag_id body field on Merge Tag, worth a small wording tweak at the
  next sync to acknowledge body fields can hit this too, not just URLs

### Next Immediate Step
NEW_REPORT admin notification (same shape of fix, blocked on getting current
apps/reports/views.py and apps/reports/models.py, since this project has
shown real drift from earlier chat sessions and I'm not writing against
stale memory). This doubles as the first app in the planned full
system audit.
