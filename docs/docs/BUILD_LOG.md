# BUILD LOG

## Current Phase
Phase 10, Best Answer / Question Lifecycle (complete, confirmed)

## Completed Phases
- Phase 0: Django 6.0.6 project scaffolded, settings split (base/development/production),
  PostgreSQL connected via django-environ, health-check endpoint live at /api/v1/health/.
- Phase 1: Custom User model (apps.accounts) on UUID PK, email-based auth. Google OAuth
  verified via Google's userinfo endpoint (not allauth). JWT issued via SimpleJWT with
  refresh rotation and blacklist. Endpoints: /api/v1/auth/google/, /api/v1/auth/refresh/,
  /api/v1/auth/logout/, /api/v1/users/me/ (GET/PATCH).
- Phase 2: School model (apps.schools) with verification_status field. List/search/detail
  endpoints public; create/update admin-only via IsPlatformAdmin permission. Global
  error-response normalizer added (apps.core.exceptions).
- Phase 3: Department model in apps.schools. List (public) + create/update (admin-only)
  scoped under School. Soft-delete via is_active.
- Phase 4: Hub + HubActivationRequest models in apps.hubs. GET hub by id and by school
  (public). Activation request create/list/approve/reject. has_hub wired to real data.
- Phase 5: Question model in apps.questions, view count incrementing, author-only
  edit/delete, filtering by hub/department/status/search, ordering. Hub and Department
  question counts wired to real data.
- Phase 6: Tag and QuestionTag models in apps.tags, tags normalized to lowercase,
  deduplicated on save, fully wired into question create/update/list/detail.
- Phase 7: Answer model in apps.answers, create (auth, blocked on SOLVED questions),
  author-only edit/delete, auto-transition Question OPEN to ANSWERED on first answer.
  Question.answer_count, best_answer_id, and nested answers array wired to real data.
  Question status reverts to OPEN when its last remaining answer is deleted.
- Phase 8: AnswerVote model in apps.answers. Vote/remove-vote endpoints, vote_score
  maintained via targeted F() updates. Self-voting and duplicate voting blocked.
- Phase 9: Comment model in apps.comments, scoped to Answer, author-only edit/delete.
  Answer.comment_count wired to real data.
- Phase 10: Mark-best-answer endpoint in apps.answers, question-owner-only, transitions
  question to SOLVED, allows switching best answer between answers on the same question,
  blocks only re-marking the same answer already best. Extended the Phase 7 delete-revert
  logic: deleting the best answer while other answers remain now reverts status from
  SOLVED to ANSWERED (previously only the "zero answers left" case reverted to OPEN),
  keeping status and best_answer_id from ever contradicting each other. Added
  GET /answers/{answer_id}/comments/ (public, paginated), closing a real gap:
  api-contract.md never documented any way to list/view comments before this.

## Key Decisions Made
- API namespaced under /api/v1/ from the start
- Report/Notification use Django ContentType (GenericForeignKey), not string fields
- Reviews/Billing apps reserved but not built in MVP
- Django 6.0.6 on Python 3.12, psycopg3 as DB driver
- Settings split into config/settings/{base,development,production}.py, env vars via django-environ
- App code lives under apps/ (apps.core, apps.accounts, apps.schools, apps.hubs,
  apps.questions, apps.tags, apps.answers, apps.comments so far)
- Backend is a pure API, no server-rendered product pages; frontend framework left fully open
- Google auth verified by calling Google's userinfo endpoint with the client-supplied
  access_token, instead of django-allauth's full social-auth flow
- Shared permission (IsPlatformAdmin) and exception handler live in apps.core for reuse
  across all future apps
- School/Department "delete" is soft-delete via is_active through PATCH
- Sub-resources with no independent lifecycle live in their owning app; sub-resources
  owning further children (Hub, Question, Tag, Answer) each get their own app
- Question view_count increments via a targeted .update() call, not a full .save()
- Fields for not-yet-built relations are implemented as model properties returning safe
  stub values so API response shape never changes when the real feature lands
- Tag names normalized to lowercase everywhere
- Answering a SOLVED question returns 400 (field-keyed "question" error), not 403 as
  api-contract.md currently labels it, matches the actual 400-shaped body already
  documented there (same label/body mismatch pattern fixed for hub_id earlier)
- Question status reverts to OPEN when its answer count drops to zero, and to ANSWERED
  when its best answer specifically is deleted but other answers remain, so status and
  best_answer_id never contradict each other
- Question status is never settable directly via PATCH; it only changes as a side effect
  of answering, marking best, or deleting answers
- Marking a different answer as best is allowed and transfers the flag; only marking the
  same answer that is already best is blocked
- Comments are viewable via a dedicated GET /answers/{answer_id}/comments/ endpoint,
  not nested inside the question/answer payload, to avoid bloating every question fetch

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
- Ownership checks (author-only edit/delete) raise PermissionDenied for a 403, checked
  explicitly against request.user.id before any write
- Cross-app model relations use related_name reverse descriptors; cross-app serializer
  references use deferred (in-method) imports to avoid circular imports
- Aggregate/derived counts (vote_score, question_count, etc.) are recomputed via
  targeted .update() calls rather than full model .save(), to avoid unwanted
  side effects on unrelated fields like updated_at
- Documentation style: no em dash character in any doc content, use commas, colons,
  or periods instead

## Known Deviations From Docs
(none, this phase's changes are being folded into the docs sync provided alongside
this BUILD_LOG update)

## Next Immediate Step
Phase 11, Notifications (Notification model via ContentType; in-app list/mark-read/
mark-all-read; triggered on new answer, new comment, best answer selected, vote
received, moderator assigned, hub activated)
