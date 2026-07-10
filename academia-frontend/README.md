## Manual QA Checklist, Phase 5

- [x] Visit a hub with seeded questions: skeleton rows, then real rows with correct status icons (open/answered/solved visually distinct)
- [x] Search within the hub: 500ms debounce behaves as before, spinner shows during the delay
- [x] Filter by each status option in turn: list updates correctly, "All" clears it
- [x] Filter by department (if seeded): list narrows correctly, combine with status filter, both apply together
- [x] Change ordering to each option: list order visibly changes (newest/oldest by date, most/least by view count)
- [x] Click "Clear all" with filters active: both status and department reset, list returns to unfiltered
- [x] Click "Ask a question" from a hub page while logged out: shows "You need to log in..."
- [x] Log in, click "Ask a question": form loads scoped to that hub, department dropdown reflects that hub's departments (or is hidden entirely if none)
> Add existing tags to this page so that users can search and select instead of only freely typing (flagged for frontend and backend. No endpoint exists for this yet)
- [x] Submit with an empty title: browser validation blocks it
- [x] Submit a real question: redirects to the new question's detail page, shows correct title, body, tags, status (Open), 0 views, 0 answers
- [x] Manually visit `/questions/new` with no `?hub=` param: shows the "Pick a school first..." message with a working link to `/schools`
- [x] As the question's author, visit its detail page: Edit and Delete links appear
- [x] As a different logged-in user, visit the same question: no Edit/Delete shown
- [x] Click Edit, change the title and tags, save: redirects back to detail page showing updated values
- [x] Click Delete, confirm the inline prompt: question is removed, redirected to the hub page, question no longer appears in the list
- [x] Visit a nonexistent question UUID: shows "Question not found," not a crash
- [x] Stop the backend, visit any question: shows the error boundary with working retry
- [x] Dark mode check across the hub question list, ask form, detail page, and edit form
- [x] `npm run build` completes cleanly

Let me know how this goes, and we'll move to Phase 6: Tags.



We're continuing backend work on Academia. The Django REST Framework backend is
feature-complete through all 15 planned MVP phases, plus three post-MVP passes
built on top of that baseline. This chat is for backend fixes and future features
only, a separate chat in this Project is handling the Next.js frontend build.

Before doing anything else, read through these project files in full:
- project-plan.md (vision, principles, roles, lifecycle rules)
- feature-list.md (what's built, what's future, check here before assuming
  something isn't planned)
- database-schema.md (models, relationships, constraints, including School and
  Question slug fields)
- api-contract.md (the full current contract: every endpoint, request/response
  shapes, error formats including the Invalid ID Format case, the Google auth
  frontend implementation guide, rate limits, pagination, and the Frontend
  Permission Model section covering moderator_for/representative_for)
- project-overview.md (frontend-facing guide, still useful here for understanding
  what the frontend expects from the API)
- BUILD_LOG_BACKEND.md (current state, phase history, every key decision and
  convention established across the build, read this closely, it's the fastest
  way to avoid re-deciding something already settled)
- CHANGELOG.md / docs/changelog.md (durable phase-by-phase history if you need
  to trace when or why something was built a certain way)
- README.md (quick orientation)

Current state, summarized:
- All 15 MVP phases built and confirmed: auth, schools, departments, hubs,
  questions, tags, answers, voting, comments, best-answer lifecycle,
  notifications, search, reports/moderation, role assignments, admin tools.
- Production-readiness pass: CORS, Redis caching with automatic local-memory
  fallback, DRF rate limiting actually enforced, structured logging, upgraded
  health check, whitenoise, custom 404/500 JSON handlers.
- URL and ID ergonomics pass: School and Question both have a slug field
  (School's is real/unique/immutable-once-set and has its own by-slug lookup
  endpoint, Question's is cosmetic and non-unique). Every ID-bearing URL now
  validates format cleanly, a malformed UUID returns 400 {"error": "Invalid ID
  format"} instead of a raw 404 debug page.
- API completeness and permission visibility pass: GET /users/me/ now returns
  moderator_for and representative_for arrays so the frontend can determine
  role-based UI without guessing. Added GET /hubs/{hub_id}/representatives/.
  Documented the health check endpoint and a full Frontend Permission Model
  section in api-contract.md.
- No outstanding Known Deviations, the last docs sync cleared the queue and
  everything since has been folded in immediately.
- seed_demo_data management command exists (apps.core), safe to re-run only on
  an empty School table, populates realistic schools/hubs/questions/answers/
  tags/votes/comments including deliberate empty-state and pending-request
  scenarios.

Local dev environment: PostgreSQL, Redis, and MailHog all run locally, connected
via direct URLs in .env. Two existing test users: a Django createsuperuser admin
and a Google-OAuth-authenticated regular user (get a fresh Google access token
via the OAuth Playground each session, tokens expire).

Known candidate for the next feature, not yet decided on timing:

A lightweight question-follow system. Users opt into following a question
(independent of authorship) and get notified when it receives a new answer or
when a best answer is marked. Concept already discussed and refined:
- QuestionFollow model (user, question, created_at, unique per pair)
- POST/DELETE /questions/{question_id}/follow/, mirroring the existing vote
  endpoint's create/remove shape
- is_following boolean added to Question detail for the requesting user
- Reuse the existing NEW_ANSWER notification type with varied message text
  rather than adding a new enum value
- Followers get in-app notifications only, not email, the question author's
  existing email notification behavior is unchanged
- Do NOT expose a public follower count anywhere, keep is_following private
  and self-referential only, a visible count would cut against "Knowledge Over
  Social Activity" in project-plan.md
- Worth linking in feature-list.md's backlog to the existing Celery/background-
  task item, since notifying many followers synchronously is exactly the kind
  of thing that motivates that future work

Decide with me whether to build this now or note it and move to something else,
don't assume it's next just because it's mentioned here. And recommend other things from the feature list that could go with it as the next updates for the app.

Also check feature-list.md's Future sections for other real backlog items
(extended School schema and data sourcing, email/password auth, monetization
features, Platform Improvements) if nothing specific is prioritized when this
chat starts.

Ground rules, same discipline as before:
- Phased, incremental, one testable slice at a time, confirm before moving on
- Code directly in chat as text, never as files/artifacts unless explicitly
  requested
- Every feature gets cURL test commands (Fedora bash) and a manual testing
  checklist
- Flag any deviation from the four core docs explicitly before implementing it,
  don't silently decide
- No em dashes anywhere, in docs or in chat prose
- After confirmed tests, provide updated BUILD_LOG_BACKEND.md content, only
  provide CHANGELOG/docs-sync updates when asked

Start by confirming you've read the docs and summarizing back the current
backend state in your own words, then ask what to work on first if it isn't
already obvious from this brief.