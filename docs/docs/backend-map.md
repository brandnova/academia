# Backend Map

A file-oriented guide to `backend/`: where the API's behavior lives and how its
apps work together. Use it with the other maintained references:

| Document | Question it answers |
|---|---|
| [API Contract](api-contract.md) | What endpoints accept and return, error shapes, permissions and rate limits |
| [Database Schema](database-schema.md) | Models, fields, constraints, indexes and relationships |
| [Backend Build Log](BUILD_LOG_BACKEND.md) | Why implementation choices were made, conventions and deviations |
| [Feature List](feature-list.md) | Which capabilities exist, are incomplete or remain planned |

This map describes the current code organization. It is not a second API
contract, schema reference or feature checklist.

## 1. Stack and local commands

- Django 6.0.6 on Python 3.12, Django REST Framework, SimpleJWT with refresh
  rotation and blacklist, PostgreSQL through psycopg 3, django-environ,
  django-redis, django-cors-headers, WhiteNoise and Gunicorn.
- The product backend is a JSON API mounted under `/api/v1/`. Django admin is
  available separately under `/admin/`.
- Run commands from `backend/`:

| Command | Purpose |
|---|---|
| `python manage.py runserver` | Local development server, defaults to development settings |
| `make run-lan` | Development server on `0.0.0.0:8000`, for device testing on the LAN |
| `make test` | Run Django's discovered test suite |
| `make migrate` | Apply migrations |
| `python manage.py seed_demo_data` | Seed development data; see the data-command notes below before using `--clear` |
| `python manage.py print_test_tokens` | Print short-lived local test JWTs, DEBUG only |
| `python manage.py import_school_directory --dry-run` | Preview the regulator-directory import |

`manage.py`, `config/wsgi.py` and `config/asgi.py` default to
`config.settings.development`. Production must explicitly select
`config.settings.production` with `DJANGO_SETTINGS_MODULE`.

## 2. Project and settings files

| Path | Responsibility |
|---|---|
| `manage.py` | Django management-command entry point |
| `config/urls.py` | Registers the loose-ID converter, mounts each API app at `/api/v1/`, and defines JSON API 404/500 handlers |
| `config/settings/base.py` | Installed apps, middleware, templates, database, cache, CORS, authentication, default permissions, throttles, JWT lifetimes and logging |
| `config/settings/development.py` | Debug mode, loopback hosts plus `DJANGO_DEV_ALLOWED_HOSTS`, local SMTP at port 1025 |
| `config/settings/production.py` | Production host/security settings, refuses SQLite unless explicitly allowed, JSON-only DRF renderer, SMTP and static/media storage configuration |
| `config/wsgi.py` | WSGI server entry point |
| `config/asgi.py` | ASGI server entry point |
| `requirements.txt` | Runtime dependencies |
| `Makefile` | Common run, migrate, shell, seed and test targets |
| `.env.example` | Environment variable names and local/deployment configuration notes |
| `templates/emails/` | Shared email base plus HTML and plain-text notification templates |

### Environment variables

`backend/.env.example` is authoritative for environment-variable names.

| Variable | Purpose and behavior |
|---|---|
| `DJANGO_SECRET_KEY` | Required Django secret |
| `DJANGO_SETTINGS_MODULE` | Settings module; entry points default to development |
| `DATABASE_URL` | Database connection; local development falls back to `db.sqlite3` when unset |
| `DATABASE_CONN_MAX_AGE` | Persistent database connection lifetime; use `0` with the serverless transaction pooler |
| `DJANGO_ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS` | Production host and origin lists |
| `DJANGO_DEV_ALLOWED_HOSTS` | Additional development hosts, such as a LAN address for Expo Go |
| `DJANGO_ALLOW_SQLITE` | Explicit opt-in for SQLite under production settings, used by the preview deployment |
| `REDIS_URL` | Optional Redis cache; unset uses per-process local memory |
| `CACHE_TTL_SHORT`, `CACHE_TTL_MEDIUM`, `CACHE_TTL_SEARCH` | Cache durations, defaulting to 60, 300 and 30 seconds |
| `CORS_ALLOWED_ORIGINS` | Comma-separated origins; native requests do not use CORS, Expo web preview does |
| `FRONTEND_URL` | Base URL used for email links |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `DEFAULT_FROM_EMAIL` | Production mail transport and sender |
| `SECURE_SSL_REDIRECT`, `SECURE_HSTS_SECONDS` | Production HTTPS redirect and HSTS duration |
| `DJANGO_LOG_LEVEL` | Root logger threshold, defaults to `INFO` |
| `DEFAULT_FILE_STORAGE_BACKEND` | Optional storage backend override; configure durable cloud storage before introducing uploads |

The Django setting names `SECRET_KEY` and `ALLOWED_HOSTS` are populated from
`DJANGO_SECRET_KEY` and `DJANGO_ALLOWED_HOSTS`. Email environment-variable
names match Django's `EMAIL_*` settings; `DEFAULT_FILE_STORAGE_BACKEND`
selects the `STORAGES["default"]["BACKEND"]` value.

## 3. Request and response flow

```text
Client
  -> security, WhiteNoise and CORS middleware
  -> DRF authentication
  -> throttle
  -> explicit view permission
  -> view and serializer validation
  -> database write
  -> view-layer notifications, email and audit records
  -> response
```

- Google access tokens are checked against Google's `userinfo` endpoint.
  Successful login returns Academia JWTs; there is no client secret or
  django-allauth flow. SimpleJWT rotates refresh tokens and blacklists used
  tokens.
- `DEFAULT_PERMISSION_CLASSES` is intentionally `AllowAny` because public reads
  are common. Every view must declare its own permission classes. Client role
  fields are for display only; the backend checks every protected write.
- `apps.core.exceptions.custom_exception_handler` normalizes general DRF errors
  and throttling responses. Field-specific 400 responses remain field-keyed.
- Route IDs use the registered `looseid` converter so malformed IDs reach the
  view's UUID validation and return the documented 400 instead of a route 404.
  A valid but missing ID returns 404.
- Notification and email side effects are initiated by views/services after
  successful writes, not by model signals. Audit writes are made in the same
  transaction as the action. Aggregate counters use targeted updates.
- The frontend calls through its Next.js proxy and httpOnly cookies; mobile
  calls the API directly with bearer tokens in secure storage. Both use this
  same contract.

## 4. App and file map

Every app has an `apps.py` registration module and a `migrations/` package.
The entries below list the files that implement behavior, not routine
`__init__.py` or migration files. All inspected app `tests.py` files are
placeholders rather than substantive per-app test suites.

### `apps.accounts`

Owns the custom user identity, Google login and user-facing account endpoints.
The user distinguishes platform `is_admin` from Django `is_staff`.

| File | Responsibility |
|---|---|
| `models.py` | UUID-keyed `User` model, email identity and role/account flags |
| `managers.py` | `UserManager`: normalize email, set unusable passwords when omitted, and apply staff/admin defaults |
| `serializers.py` | `UserSerializer` includes hub-role summaries and computed activity counts; admin, update and user-picker representations use separate serializers |
| `views.py` | Google userinfo verification and JWT response; throttled refresh; refresh-token blacklist logout; current-user read/name update; admin user search/list/status change; active-user search for staff pickers |
| `urls.py` | `auth/google/`, `auth/refresh/`, `auth/logout/`, `users/me/`, `users/search/`, `admin/users/` and user detail |
| `pagination.py` | `UserPagination`, 20 by default, maximum 100 |
| `admin.py` | Custom Django `UserAdmin` |
| `tests.py` | Placeholder; no substantive account-app tests found |

Suspending/reactivating a user is an admin action. A real suspension transition
is logged and sends the user a notification; repeated state-setting does not
create a second transition record.

### `apps.core`

Shared API infrastructure and utilities used across apps. `AdminActionLog` is
read-only in Django admin and does not have a public API endpoint.

| File | Responsibility |
|---|---|
| `models.py` | `AdminActionLog`, an append-only record with actor, action, UUID target, label snapshot and metadata |
| `audit.py` | `log_admin_action()`, called in the same transaction as the action |
| `admin.py` | Read-only audit-log admin |
| `permissions.py` | `user_is_platform_admin()` and `IsPlatformAdmin` |
| `utils.py` | UUID parsing and validation helpers |
| `converters.py` | `LooseIDConverter`, defers ID-format validation to the view |
| `slugs.py` | Unique persisted slug generation with collision retry, plus cosmetic display-slug handling |
| `cache.py` | Cache-key creation, safe get/set/delete, prefix invalidation and cached-response helper; cache failures log and fail open |
| `exceptions.py` | `custom_exception_handler()` for normalized DRF and throttle errors |
| `throttling.py` | `MethodScopedThrottle`, applies a throttle scope only to selected HTTP methods |
| `content_links.py` | `get_link_target()` maps questions, answers and comments to question/answer link identifiers |
| `views.py`, `urls.py` | `health_check()` probes database and cache; only database failure makes health degraded |
| `management/commands/seed_demo_data.py` | Seeds related development content across apps; supports reset and admin-email options |
| `management/commands/print_test_tokens.py` | Generates one-hour tokens for fixed local test users only when `DEBUG=True` |
| `management/commands/import_school_directory.py` | Imports school and provenance CSVs, supports dry run, matches by short name/name, fills blank fields, creates unmatched schools inactive, and writes source records idempotently |
| `tests.py` | Placeholder; no substantive core tests found |

The directory import command currently does not expose source records through
an API or mark old source records non-current. School curation fields and
provenance are detailed in the [schema](database-schema.md) and its open work
is tracked in the [feature list](feature-list.md).

### `apps.schools`

Owns platform-managed schools, departments and regulator-source provenance.

| File | Responsibility |
|---|---|
| `models.py` | `School`, `Department` and `SchoolSourceRecord`; stable school slug, computed active-hub state, school/department relationships and source provenance |
| `serializers.py` | School list/detail/write serializers; department list/create/update serializers; source-record serializer, currently not exposed by a view |
| `views.py` | Public school and department reads; search and school filters; admin school create/update and inactive-school visibility; representative department create/update; slug lookup |
| `urls.py` | School list, ID and slug details; nested department list/create; department detail |
| `cache.py` | `invalidate_school_cache()` clears list, detail and slug keys; called when hub activity changes computed `School.has_hub` |
| `pagination.py` | 20 by default, maximum 100 |
| `admin.py` | School and department admin, school-source records inline |
| `tests.py` | Placeholder; no substantive school-app tests found |

School reads are public for active records. Platform admins can inspect
inactive records. Department reads show active departments publicly and allow
representatives/admins to manage the school’s departments.

### `apps.hubs`

Owns school hubs, activation requests and staff assignments.

| File | Responsibility |
|---|---|
| `models.py` | One-to-one `Hub` per school, `HubActivationRequest`, `ModeratorAssignment` and `SchoolRepresentativeAssignment` |
| `serializers.py` | Hub/school/department summaries, activation request input/output and role-assignment representations; validates inactive or already-served schools and duplicate pending requests |
| `permissions.py` | Hub/school-scoped moderator and representative checks, any-hub representative check, and shared `user_is_staff()` role check |
| `views.py` | Public hub detail/by-school/by-slug reads; admin activity toggle and audit; user activation request and admin review; moderator and representative list/assign/deactivate; role and hub notifications |
| `urls.py` | `hubs/`, activation request review, by-school and by-slug lookups, hub detail, nested moderators and representatives |
| `pagination.py` | Activation requests, 20 by default, maximum 100 |
| `admin.py` | Admin registrations for hub, requests and both assignment models |
| `tests.py` | Placeholder; no substantive hub-app tests found |

Hub activation invalidates both hub and school caches. Assignment records use
active flags rather than hard deletion, preserving a team across hub
deactivation.

### `apps.questions`

Owns questions, follows and question-level staff actions.

| File | Responsibility |
|---|---|
| `models.py` | UUID question and follow models; status, hub, optional department, lock/view fields, answer count, best-answer ID and tag access |
| `serializers.py` | List/detail and create/update serializers; detail nests answers and follow state; `_sync_tags()` normalizes and synchronizes tag links |
| `views.py` | Public list/detail, authenticated create, author-only edit/delete, staff unanswered queue, follow/unfollow and staff lock/unlock; authenticated view counts are deduplicated per-user over a rolling 24-hour cache window |
| `services.py` | `notify_followers_of_new_answer()` and best-answer follower notifications, excluding the question author and answer author where appropriate |
| `urls.py` | Question list/detail, unanswered, follow and lock routes |
| `pagination.py` | 20 by default, `page_size` supported, maximum 50 |
| `admin.py` | `QuestionAdmin` |
| `tests.py` | Placeholder; no substantive question-app tests found |

Creation notifies active moderators and representatives assigned to the hub.
Question create/update synchronizes tags through `apps.tags`. Detail
serialization uses the answer serializers. Answer creation and best-answer
selection call the follower notification service.

### `apps.answers`

Owns answers, votes and best-answer transitions.

| File | Responsibility |
|---|---|
| `models.py` | `Answer` and unique-per-user/per-answer `AnswerVote`; best-answer and vote-score fields, computed comment count |
| `serializers.py` | Answer author/question summaries, nested answer response and create/update validation; rejects missing or locked questions and advances an open question to answered |
| `views.py` | Create, author-only edit/delete, vote/unvote, question-owner best-answer marking and the current user’s answer list |
| `urls.py` | Answer list/create/detail, vote, mark-best and `users/me/answers/` |
| `pagination.py` | 20 by default, maximum 50 |
| `admin.py` | Answer and vote model registration |
| `tests.py` | Placeholder; no substantive answer-app tests found |

Votes reject self-voting and update the score. Marking best sets the question
to solved. Deleting its last answer reopens it; deleting the best answer while
other answers remain returns it to answered. Creation and best-answer actions
notify the relevant author and followers; vote events create in-app
notifications. The answer serializer is also used in question details.

### `apps.comments`

Owns answer comments and each user’s own-comment history.

| File | Responsibility |
|---|---|
| `models.py` | `Comment` linked to an answer and author, ordered by creation time |
| `serializers.py` | Comment, author and answer summaries; create/update and own-comment representations with parent-question information |
| `views.py` | Public answer-comment list, authenticated create, author-only edit/delete and authenticated own-comment list |
| `urls.py` | Comment create/detail, answer comments and `users/me/comments/` |
| `pagination.py` | 20 by default, maximum 100 |
| `admin.py` | `CommentAdmin` |
| `tests.py` | Placeholder; no substantive comment-app tests found |

Creating a comment notifies the answer author unless that author wrote the
comment. Deleting an answer cascades to its comments.

### `apps.tags`

Owns normalized tag names, question-tag joins and admin tag maintenance.

| File | Responsibility |
|---|---|
| `models.py` | Unique-name `Tag` and unique `QuestionTag` relation |
| `serializers.py` | Tag representation; uses an existing question-count annotation where available, otherwise counts related questions |
| `views.py` | Public list/search/popularity and tag-question list; admin-only delete and merge/rename |
| `utils.py` | Tag length limit and `validate_tags()` |
| `urls.py` | Tag list, merge, delete/detail and questions-by-tag routes |
| `pagination.py` | 50 by default, maximum 100 |
| `admin.py` | Tag and question-tag admin |
| `tests.py` | Placeholder; no substantive tag-app tests found |

Delete is blocked when a tag is attached unless forced. Merge deduplicates
question/tag links, records an admin action and invalidates the tag-list cache.
Question serializers own synchronization of tags on question writes.

### `apps.search`

Provides the ranked question-search endpoint. It has no application models or
schema migration.

| File | Responsibility |
|---|---|
| `views.py` | Public, throttled and cached question search; supports hub/school/department/tag filters and PostgreSQL full-text search |
| `serializers.py` | `SearchQuestionSerializer`, question search summary and rounded rank |
| `urls.py` | `search/questions/` |
| `pagination.py` | 20 by default, maximum 50 |
| `admin.py` | No model registrations |
| `tests.py` | Placeholder; no substantive search-app tests found |

With a nonempty `q`, ranking orders solved status, top answer vote score,
creation time and then text rank. Without `q`, it orders by solved status, top
vote score and creation time. The rank floor removes PostgreSQL's tiny
non-match scores. Results query `apps.questions.Question`, filter
`QuestionTag`, and reuse question summary serializers.

### `apps.notifications`

Owns in-app notification records, delivery helpers and read state.

| File | Responsibility |
|---|---|
| `models.py` | Typed `Notification` with a generic content-object reference |
| `serializers.py` | Notification representation, related object identifiers and shared `link_target` |
| `views.py` | Authenticated user-scoped list, optional read-state filter, unread count, mark-one-read and mark-all-read |
| `services.py` | `create_notification()`, `send_notification_email()` and `notify()`; email delivery failures are logged rather than raised |
| `urls.py` | Notification list, mark-all-read and mark-read routes |
| `pagination.py` | 20 by default, maximum 100 |
| `admin.py` | Notification admin |
| `tests.py` | Placeholder; no substantive notification-app tests found |

Views prefetch common question/answer/comment targets. Notification side
effects originate in the question, answer, comment, hub, account and report
flows. The allowed types, channel policy and recipients are summarized in
`BUILD_LOG_BACKEND.md`; exact response fields are in `api-contract.md`.

### `apps.reports`

Owns user reports and their admin review and staff escalation workflow.

| File | Responsibility |
|---|---|
| `models.py` | `Report` type/status, generic content target, reviewer/escalation fields and one-report-per-user/content uniqueness |
| `serializers.py` | Create response, admin report and private own-report forms; includes content-existence/link data while hiding review and escalation details from the reporter |
| `views.py` | Restricts targets to questions, answers and comments; authenticated report creation; admin list/resolve/reject; hub staff escalation; resolves target hub and deletion cascades; handles orphan reports and notifications |
| `urls.py` | Report create/list, own reports, resolve, reject and escalate |
| `pagination.py` | 20 by default, maximum 100 |
| `admin.py` | Report admin |
| `tests.py` | Placeholder; no substantive report-app tests found |

Deleting reported content can cascade through answers/comments and
auto-resolve related pending reports. Review/escalation actions log the
appropriate admin action and notify relevant parties.

### `apps.pages`

Owns admin-managed policy, product and staff guide pages.

| File | Responsibility |
|---|---|
| `models.py` | `StaticPage`: generated unique slug, public/staff visibility, publish state, optional creator and timestamps |
| `serializers.py` | Author, list/detail and create/update representations; trims and validates titles |
| `views.py` | Public/admin list and detail; tiered public, staff and admin visibility; admin writes; per-tier caches and invalidation |
| `urls.py` | `pages/` and `pages/<identifier>/` |
| `admin.py` | `StaticPageAdmin` |
| `tests.py` | Placeholder; no substantive page-app tests found |

Admins see drafts and all pages. Staff means an active moderator or
representative and includes all published pages; other visitors see only
published public pages. Reads return the same 404 for nonexistent and
invisible pages. Detail GET uses the slug while PATCH/DELETE use the UUID on
the same route shape.

## 5. Route map

`config/urls.py` mounts the route groups below at `/api/v1/`. This table is a
navigation aid; request and response schemas, complete permission behavior
and errors are defined in the [API Contract](api-contract.md).

Auth labels: **public** means no login required, **user** means any
authenticated account, **staff** means moderator/representative for the
relevant hub or admin, **rep** means representative for the relevant school
or admin, and **admin** means platform admin.

| App | Route group | Access and purpose |
|---|---|---|
| `core` | `GET /health/` | Public liveness/dependency check; only database failure marks service degraded |
| `accounts` | `POST /auth/google/`, `/auth/refresh/` | Public login/refresh, auth throttle |
| `accounts` | `POST /auth/logout/` | User; blacklist current refresh token |
| `accounts` | `GET`, `PATCH /users/me/` | User profile, role summaries, stats and name update |
| `accounts` | `GET /users/search/` | Admin or representative of any hub; bounded picker results |
| `accounts` | `GET /admin/users/`, `GET` and `PATCH /admin/users/{id}/` | Admin user search/detail and suspend/reactivate |
| `schools` | `GET /schools/`, `GET /schools/{id}/` | Public active directory/detail; admins can inspect inactive records on the ID route |
| `schools` | `GET /schools/by-slug/{slug}/` | Public active-school lookup; admins bypass the cache and can inspect inactive schools |
| `schools` | `POST /schools/`, `PATCH /schools/{id}/` | Admin create/update; deactivate through `is_active` |
| `schools` | `GET`, `POST /schools/{id}/departments/`, `PATCH /departments/{id}/` | Public reads; school representative/admin writes |
| `hubs` | `GET /hubs/{id}/`, `/hubs/by-school/{id}/`, `/hubs/by-slug/{slug}/` | Public active hub reads; admins can access inactive hubs |
| `hubs` | `PATCH /hubs/{id}/` | Admin activity toggle, audited on real transitions |
| `hubs` | `GET`, `POST /hubs/activation-requests/`, `POST .../{id}/approve/`, `POST .../{id}/reject/` | Authenticated request; admin list and review |
| `hubs` | `GET`, `POST /hubs/{id}/moderators/`, `DELETE .../{user_id}/` | Public active list; representative/admin assignment and removal |
| `hubs` | `GET`, `POST /hubs/{id}/representatives/`, `DELETE .../{user_id}/` | Public active list; admin assignment and removal |
| `questions` | `GET`, `POST /questions/`; `GET`, `PATCH`, `DELETE /questions/{id}/` | Public reads; authenticated create; author edit/delete |
| `questions` | `GET /questions/unanswered/` | Staff queue scoped to the user's hub roles |
| `questions` | `POST`, `DELETE /questions/{id}/follow/`; `POST`, `DELETE /questions/{id}/lock/` | User follow; staff lock/unlock |
| `answers` | `POST /answers/`, `PATCH`, `DELETE /answers/{id}/` | Authenticated create; author edit/delete |
| `answers` | `POST`, `DELETE /answers/{id}/vote/`; `POST /answers/{id}/mark-best/` | User vote; question author marks best |
| `answers` | `GET /users/me/answers/` | User's own answer history |
| `comments` | `GET /answers/{id}/comments/`, `POST /comments/`, `PATCH`, `DELETE /comments/{id}/` | Public list; authenticated create; author edit/delete |
| `comments` | `GET /users/me/comments/` | User's own comment history |
| `tags` | `GET /tags/`, `GET /tags/{name}/questions/` | Public paginated tag list and question list |
| `tags` | `DELETE /tags/{id}/`, `POST /tags/{id}/merge/` | Admin delete, merge or rename |
| `search` | `GET /search/questions/` | Public ranked search |
| `notifications` | `GET /notifications/`, `POST /notifications/mark-all-read/`, `POST /notifications/{id}/mark-read/` | User-scoped list and read state |
| `reports` | `POST /reports/`, `GET /reports/mine/` | User report creation and private report history |
| `reports` | `GET /reports/`, `POST /reports/{id}/resolve/`, `/reject/` | Admin review |
| `reports` | `POST /reports/{id}/escalate/` | Staff escalation for a hub report |
| `pages` | `GET /pages/`, `GET /pages/{slug}/` | Public/staff/admin visibility tiers |
| `pages` | `POST /pages/`, `PATCH`, `DELETE /pages/{id}/` | Admin page management |

## 6. Shared behavior

### Permissions and IDs

| Concern | Implementation |
|---|---|
| Platform administrator | `apps.core.permissions.user_is_platform_admin()` and `IsPlatformAdmin` |
| Hub roles | `apps.hubs.permissions` helpers for moderator, representative and combined staff checks |
| Method-specific throttling | `apps.core.throttling.MethodScopedThrottle` |
| Loose route IDs | `apps.core.converters.LooseIDConverter`; views validate UUID syntax with core helpers |
| Slugs | `apps.core.slugs` generates persisted unique slugs and handles display-only URL slugs |
| Generic content links | `apps.core.content_links.get_link_target()` provides question and answer identifiers for report/notification links |

### Cache

Redis is used when `REDIS_URL` is set; otherwise Django's local-memory cache is
used. Redis failures fail open: throttles do not block due to an unavailable
cache and cache-backed views recompute. Cache keys and invalidation helpers
are centralized in `apps.core.cache`; school invalidation is shared with
`apps.schools.cache`.

| Cached data | Invalidation or expiry |
|---|---|
| School lists and detail/by-slug data | School writes; department and hub state changes also invalidate relevant school data |
| Hub detail/by-school/by-slug | Hub activity/update and team assignment changes |
| Tag lists | Tag delete, merge and rename |
| Ranked question search | Short TTL; no content-write invalidation |
| Static pages | Separate public/staff visibility tiers; writes invalidate, invisible 404s are not cached |
| Authenticated question view dedup | Per user, rolling 24-hour window; not a response cache |

Live Q&A content and personalized responses are not cached as response
objects. Refer to `apps/*/cache.py` and `apps.core.cache` when changing cache
keys.

### Throttles

Rates are configured in `config/settings/base.py`, keyed by throttle scope.
Authenticated requests are user-throttled and anonymous requests are
IP-throttled. Scoped write limits replace the global limit for that action;
they do not stack.

| Scope | Rate |
|---|---|
| Default anonymous/user | 100 per minute |
| Authentication | 10 per minute |
| Question create | 30 per hour |
| Answer create, comment create | 50 per hour each |
| Content edit | 60 per hour |
| Mark best | 30 per hour |
| Voting | 100 per hour |
| Search | 60 per minute |
| Reports | 10 per hour |

A view that refers to an unconfigured throttle scope raises a server
configuration error; define the matching rate in `base.py`.

### Notifications and email

`apps.notifications.services` is the shared delivery entry point. The
recipient/channel matrix and full notification type list live in
`BUILD_LOG_BACKEND.md` and `api-contract.md`, rather than being duplicated
here.

| Triggering area | Examples of behavior |
|---|---|
| Accounts | Suspension notice; role assignment notice is sent by hubs |
| Hubs | New activation request to active admins; approval/rejection to requester; moderator and representative assignment |
| Questions | New question to active hub moderators and representatives; answer/best-answer follower notifications are coordinated with answers |
| Answers | New answer and best-answer notices to relevant authors; vote notice to answer author |
| Comments | New comment notice to answer author, unless self-authored |
| Reports | New report to admins; staff escalation; review outcome to reporter |

Email templates are under `templates/emails/`. Development SMTP uses
MailHog-compatible settings at localhost port 1025; production transport is
environment configured. Email delivery errors are logged and do not undo a
successful API write.

## 7. Data commands and source data

| Command or path | Purpose and cautions |
|---|---|
| `apps/core/management/commands/seed_demo_data.py` | Seed schools, hubs, accounts, questions, answers, tags and pages. `--clear` cascades from schools and also clears tags/static pages; never use against a database holding the real directory. `--admin-email` promotes the specified account |
| `apps/core/management/commands/print_test_tokens.py` | Prints one-hour tokens for fixed admin, staff and regular test users; requires `DEBUG=True` |
| `apps/core/management/commands/import_school_directory.py` | Idempotent NUC/NBTE/NCCE import. Matches by short name then name, fills blank values and creates unmatched schools inactive for review. `--dry-run` previews; source records are written, but prior rows are not marked non-current |
| `apps/schools/data/` | School import inputs and duplicate-review data; inspect the command and source files before running an import |
| `templates/emails/` | Shared email base and per-notification HTML/plain-text templates |

## 8. Testing and verification

`make test` runs Django's test discovery from `backend/`. At the time this map
was verified, app `tests.py` modules are placeholders and do not provide
substantive per-app regression coverage. Use [Testing](TESTING.md) for the
cross-surface manual regression checklist. For endpoint-level inputs,
responses, permissions and errors, use [API Contract](api-contract.md).

Useful repository checks:

```bash
cd backend
python manage.py check
python manage.py showmigrations
make test
```

For local mobile device access, set `DJANGO_DEV_ALLOWED_HOSTS` to the device-
reachable development host, include the Expo web preview in
`CORS_ALLOWED_ORIGINS` when testing web, then run `make run-lan`.

## 9. Where to make a change

| Change | Primary code path | Documentation to update |
|---|---|---|
| Endpoint or response behavior | App `serializers.py`, `views.py`, `urls.py`, and relevant helper/service | API Contract, Feature List if capability status changes, then Changelog |
| Model, field or relationship | App `models.py` and migration | Database Schema, then Changelog |
| Permission or role behavior | View permission declaration and/or `apps.hubs.permissions` / `apps.core.permissions` | API Contract and Backend Build Log |
| Notification or email | Triggering view/service, `apps.notifications.services`, templates as needed | API Contract and Backend Build Log |
| Cache behavior | `apps.core.cache` and relevant app view/cache helper | This map and Backend Build Log if convention changes |
| Throttle behavior | View throttle classes/scope and `config/settings/base.py` | API Contract and this map |
| School import | `apps/core/management/commands/import_school_directory.py` and source inputs | Feature List, Database Schema if data shape changes, Backend Build Log |

## 10. Deferred work

The current backend backlog and deliberate deviations are maintained in
[BUILD_LOG_BACKEND.md](BUILD_LOG_BACKEND.md) and
[feature-list.md](feature-list.md). Check those references before treating an
absent endpoint or behavior as an accidental omission. In particular, audit
log read access, representative-scoped report visibility, answer edit history
and durable upload storage are not documented here as implemented features.
