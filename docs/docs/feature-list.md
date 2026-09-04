# FEATURE LIST

## Authentication
- [x] Google Login
- [x] Logout
- [x] User profile (view only initially)
- [x] Avatar from Google

## School Hubs
- [x] View school hub
- [x] Search for school
- [x] Request hub activation
- [x] View departments
- [x] Filter questions by department
- [x] Manage departments (create/edit/deactivate/reactivate), School
      Representatives and admins

## Questions
- [x] Create question (title, body, school, optional department, tags)
- [x] Edit own question
- [x] Delete own question
- [x] View question
- [x] View question list (paginated)
- [x] Filter questions by status (Open/Answered/Solved)
- [x] Filter questions by school (via the hub filter, since a hub maps to exactly one school)
- [x] Filter questions by department
- [x] Filter questions by tags
- [x] Follow a question for update notifications, independent of authorship
      (frontend not yet wired, backend endpoints exist and are documented)

## Answers
- [x] Create answer
- [x] Edit own answer
- [x] Delete own answer
- [x] Mark best answer (question owner only)
- [x] Vote on answers (upvote/downvote)
- [x] View answers

## Comments
- [x] Create comment on answer
- [x] Edit own comment
- [x] Delete own comment
- [x] View comments

## Tags
- [x] Create tags (from question creation)
- [x] View questions by tag
- [x] Suggest tags (autocomplete, served by the tags search endpoint)
- [x] Popular tags view

## Search
- [x] Search questions (title + body)
- [x] Search by school
- [x] Search by department
- [x] Search by tags
- [x] Search results ranking (solved > highly voted > recent > relevance)

## Notifications
- [x] Email notifications for major actions
  - [x] New answer notification
  - [x] School hub activation
- [x] In-app notifications for major actions
  - [x] New answer notification
  - [x] New comment notification
  - [x] Best answer selected notification
  - [x] Vote received notification
  - [x] Moderator assigned notification (assignment endpoint exists since Phase 14,
        no notification trigger wired to it yet)
  - [x] Hub activated notification
  - [x] New question notification for hub moderators (NEW_QUESTION, in-app only,
      closes a gap from project-plan.md's Moderator Responsibilities section,
      which described this but it was never implemented)
- [x] New activation request notification for admins (NEW_ACTIVATION_REQUEST,
      in-app only) and new report notification for admins (NEW_REPORT,
      in-app only)

## Moderation
- [x] Report content (spam/abuse/misinformation/duplicate)
- [x] View unanswered questions (moderator only, scoped to assigned hubs)
- [x] Reports dashboard (admin only)
- [x] Resolve reports (admin only)
- [x] Question lock/close capability, distinct from SOLVED, moderator/admin
      only, for the rare case a question genuinely needs to stop accepting
      input (spam magnet, fully resolved administrative question). SOLVED
      itself no longer implies closed, see project-plan.md's Question
      Lifecycle note. Backend complete and documented; frontend UI for this
      is planned for the upcoming polish pass.

## Administration
- [x] Manage schools (create/edit/soft-delete via is_active)
- [x] Approve hub activation requests
- [x] Assign moderators
- [x] Assign school representatives
- [x] View reports
- [x] Manage users (view/suspend; promoting or demoting admin status is not part
      of this endpoint)
- [x] Manage tags (rename, merge, delete), admin only
- [x] Static page management (create/edit/delete, PUBLIC or STAFF visibility,
      draft/published), admin only

## User Experience
- [x] Self-view profile stats (question/answer/best-answer/comment counts) on
      GET /users/me/, plus paginated GET /users/me/answers/ and
      GET /users/me/comments/ for the actual object lists. Self-only, not a
      public profile, closes out the "Lightweight contributor recognition"
      item previously listed under Platform Improvements
- [x] User search by name/email for admins and school representatives
- [x] Responsive design (mobile + desktop compatible)
- [x] Loading states
- [x] Error handling
- [x] Empty states
- [x] Form validation

---

# Future Features (Not MVP)

## Authentication (Future)
- [ ] Email/username and password registration
- [ ] Email verification on signup (verification code)
- [ ] Email/password login (alongside Google, not replacing it)
- [ ] Password reset (forgot password flow via email)
- [ ] Password change (while logged in)
- [ ] Self-service account management, modification, deletion/deactivation
- [ ] Other convenient social login methods (Only if absolutely convenient)

## Search (Future)
- [ ] Search answers directly, not just questions
- [ ] Precomputed search index (stored tsvector column, GIN index)
- [ ] Elasticsearch/OpenSearch integration

## Notifications (Future)
- [ ] Push notifications (for mobile client)
- [ ] School submission approved notification trigger (depends on
      SchoolSubmission existing, see School Data Curation below)
- [ ] Notification preferences (per-type opt-out for in-app noise, distinct
      from the existing email-vs-in-app channel policy, which stays
      platform-decided, not user-configurable, for MVP)

## Moderation (Future)
- [ ] Content deletion (moderators)
- [ ] User management (moderators)
- [ ] Flag capabilities (moderators)
- [x] Dedicated escalate-to-admin action, distinct from the general report
      pipeline (already has a written issue and a backend/frontend split,
      see the two escalation issue templates)

## School Reviews (Future)
- [ ] Submit school review (Still deciding the details)
- [ ] Edit/delete own review
- [ ] View reviews per school
- [ ] School official response to a review (verified reps only)
- [ ] Vote review helpful/not helpful
- [ ] Report review (reuses existing report pipeline)

## School Verification & Claiming (Future)
- [ ] Claim school profile (representative request + admin approval)
- [ ] Verified badge on school profile

## School Data Curation (Future)
- [ ] Curated database of Nigerian universities, polytechnics, and colleges,
      sourced primarily from NUC, NBTE, and NCCE official lists,
      cross-referenced against JAMB's institution list and secondary sources
- [ ] Extend the School model with richer fields: institution type
      (university/polytechnic/college of education), ownership
      (federal/state/private), state, an official regulatory or JAMB code,
      source_url, last_verified_at
- [ ] Periodic re-verification workflow so curated data doesn't silently go
      stale
- [ ] User-submitted "school not listed" request flow (SchoolSubmission)
- [ ] Bulk data import tooling to support the school directory curation effort above
- [ ] Admin verification workflow for submitted schools

## Monetization (Future. Needs further review)
Every item here must hold to Integrity Over Monetization (project-plan.md):
paid tiers affect visibility, promotion, and verification only, never the
truthfulness or presence of content students post.
- [ ] Verified badge and official review response (already scoped under
      School Verification & Claiming and School Reviews above)
- [ ] Directory placement: a school can pay to appear higher specifically
      in the school directory browse view, clearly labeled "Featured",
      never affecting search relevance or question ranking
- [ ] Analytics dashboard for school representatives: what students are
      asking about their school, trending unanswered topics, volume over
      time, business intelligence that's already a byproduct of the
      platform, genuinely useful to a school, doesn't touch what students
      see
- [ ] Scoped official announcements: a paying school can pin a clearly
      labeled banner inside their own hub only (e.g. "Registration closes
      March 30"), doesn't affect any other school or any organic question
- [ ] Careers/classifieds section: paid, clearly labeled listings from
      employers or recruiters targeting specific schools or departments,
      a natural extension given SIWES and internships are already common
      organic topics, doesn't compete with organic Q&A content
- [ ] Tiered public API access: free low-volume tier plus a paid
      higher-volume tier for third-party developers wanting bulk access to
      the curated Nigerian school directory, monetizes the data-curation
      work directly (see Public/Developer API below)
- [ ] Voluntary support ("tip jar" style), optional, transparent about what
      it funds, never gates any feature

## Public/Developer API (Future)
- [ ] API client registration (admin issued keys)
- [ ] API key authentication + per-client rate limiting
- [ ] Read-only public endpoints (schools, questions, tags)
- [ ] Developer documentation portal

## Additional Features (Future)`
- [ ] AI-assisted search
- [ ] Institution-specific document repository (approved forms, timetables,
      clearance checklists), a natural extension of the Static Pages
      infrastructure already built, one step beyond a handful of
      admin-authored pages toward a real per-school document library
      *(new suggestion, worth a real look, since the underlying
      infrastructure for this already exists and is tested)*
- [ ] Low-data / offline-friendly mode: a lightweight rendering path for
      slow or expensive mobile connections, consistent with the
      mobile-first, data-conscious audience this platform is designed for
      from the start
- [ ] Celery-backed background tasks for email and notification delivery, so a slow
      SMTP call never blocks an API response


---

# Platform Improvements (Post-MVP)

## Backend

- [ ] Private "my submitted reports" view for a user's own account, deliberately
      not part of the public/self profile page, reports are never shown on any
      profile to avoid making a reporter's activity identifiable to others
- [ ] Admin action audit log (who resolved which report, who suspended which user)
- [ ] Answer edit history, so a heavily-edited answer's original context isn't lost
      framed as quality signal, not a leaderboard or engagement mechanic, consistent
      with Knowledge Over Social Activity
- [ ] Refresh-token request deduplication: if multiple requests expire in the
      same instant, more than one may attempt to use the same refresh token
      before rotation completes, one could be rejected. Frontend-only
      concern (Next.js proxy layer), low risk at MVP traffic levels.
- [ ] Standalone answer/comment permalink page, so notifications and reports
      targeting an answer or comment (VOTE, NEW_COMMENT, non-question
      reports) can deep-link somewhere real instead of rendering as
      non-clickable text.
- [ ] UserSerializer's stats field, currently only attached ad hoc in MeView,
      should become a proper SerializerMethodField on the serializer itself,
      so it's included everywhere UserSerializer is used (this also closes a
      real doc/code mismatch, api-contract.md documents stats as present on
      the Google Login response, but it currently isn't)
- [ ] Google-authenticated users should have set_unusable_password() called
      explicitly at creation, currently left at Django's blank default,
      harmless today but worth hardening before email/password auth ships
- [ ] GoogleLoginView should explicitly reject login for suspended
      (is_active=False) accounts with a clear error, rather than issuing a
      token pair that only fails on the next authenticated request
- [x] PATCH /users/me/ should validate full_name isn't blank/whitespace-only
      and return a proper field error, instead of silently no-op'ing
- [x] GET /users/search/ should share the existing "search" throttle scope
      (60/min) rather than falling back to the general 100/min limit, it's a
      type-ahead endpoint and will be called more rapidly than that implies
- [ ] Google login should verify email_verified from Google's userinfo
      response before creating/logging in a user, currently trusted
      implicitly
- [ ] Cache invalidation gap: PATCH /schools/{id}/, POST department creation,
      and PATCH department updates all invalidate school-detail and/or
      school-list but never school-by-slug, so slug-based lookups can serve
      stale data (including a deactivated school still appearing active) for
      up to CACHE_TTL_MEDIUM after a write. apps.hubs already does this
      correctly for hub-by-slug, apps.schools needs the same fix
- [ ] SchoolBySlugView has no admin bypass at all (unlike the by-id route),
      so a deactivated school is a dead-end 404 via slug even for admins.
      Worth reconsidering now that reactivation is a real admin workflow and
      project-overview.md recommends slug as the primary school URL
- [ ] Shared "is this request from a platform admin" check duplicated across
      SchoolListCreateView, SchoolDetailView, and inlined again in
      DepartmentListCreateView.get(), should be a single helper in
      apps.core.permissions
- [ ] GET /schools/ has no is_active filter for admins, who currently see
      active and inactive schools in one combined list with no way to
      narrow to just one, AdminUserListView already has this exact pattern
      for users, worth matching here
- [ ] Several write endpoints have no dedicated throttle scope and fall back
      to the general 100/min limit: School/Department creation, Answer
      edit/delete (AnswerDetailView), Mark Best Answer, Comment edit/delete
      (CommentDetailView), and Static Page creation (StaticPageListCreateView.post).
      Worth a deliberate pass deciding which of these actually need tighter
      scoping versus being fine on the general limit, rather than the
      current case-by-case inconsistency
- [ ] Hub deactivation endpoint (admin only), mirroring School's soft-delete
      pattern. Currently no API path exists to take an active hub offline,
      is_active on Hub can only ever be set to True through the API today
- [ ] If Hub deactivation is added, HubDetailView/HubBySchoolView/
      HubBySlugView need the same admin-bypass-for-inactive pattern
      SchoolDetailView already has, otherwise a deactivated hub becomes
      unreachable even to the admin who deactivated it
- [ ] Cache invalidation gap (combined with the school-by-slug finding from
      the Schools audit): approving a hub activation request changes
      School.has_hub but never invalidates school-by-slug:{slug}, so a
      school's slug-based lookup can show stale has_hub for up to
      CACHE_TTL_MEDIUM after activation. Worth a shared invalidation helper
      used by both apps.schools and apps.hubs so this can't drift again
- [ ] Unanswered questions queue (GET /questions/unanswered/) only checks
      ModeratorAssignment, not SchoolRepresentativeAssignment, meaning a rep
      managing a hub with no moderator assigned yet cannot see their own
      hub's queue at all. Directly inconsistent with the reasoning already
      applied to NEW_QUESTION's fan-out (widened to include reps for exactly
      this zero-moderator-hub scenario), same fix belongs here
- [ ] QuestionLockView.check_lock_permission() duplicates hub-role-check
      logic inline for a third time (Schools and Hubs audits flagged the
      same pattern already), worth one shared "is moderator or rep for this
      hub" helper in apps.hubs.permissions instead
- [x] Django admin's Question list view doesn't surface is_locked, hard to
      tell which questions are locked without opening each one
- [ ] Search results omit slug (and department, view_count, is_locked) from
      each question, matching the documented contract exactly today, but
      meaning the frontend can't build a /questions/{id}/{slug} URL
      directly from a search result without a follow-up request. Worth
      deciding whether slug specifically should be added to
      SearchQuestionSerializer
- [ ] Static Pages endpoints (list and detail) have no caching, unlike
      Schools/Hubs/Tags which all use the same short-TTL public-read
      pattern. Deliberately deferred at build time as non-blocking, worth
      picking up now that it's a formally tracked item
- [ ] Tag list (GET /tags/) is fully unpaginated by design, reasonable at
      current volume but a real scaling risk given tags are free-text and
      community-generated with no curation. Recommend adding standard
      pagination now while cheap. This IS a breaking response-shape change
      ({"results": [...]} becomes {count, next, previous, results}), needs
      to be scoped as a coordinated backend+frontend issue, not a silent
      backend-only change
- [ ] Tag name (max_length=50) is never validated for length before hitting
      the database on either write path (TagMergeView's rename branch, and
      _sync_tags() in apps/questions/serializers.py, the implicit
      tag-creation path any authenticated user hits via question tagging).
      A name over 50 characters currently raises an unhandled DB-level
      error instead of a clean 400. Reachable by any regular user, not just
      admins, worth prioritizing
- [ ] Extend the existing "Admin action audit log" item to also cover tag
      merge/delete actions, not just report resolution and user suspension
- [x] Django admin's Tag list doesn't surface question_count (would need an
      admin method since it's computed, not a model field)
- [ ] Resolving a report with DELETE_CONTENT can orphan other pending
      reports pointing at content that gets cascade-deleted along with it
      (e.g. a Question's report deletes it, cascading to an Answer that had
      its own separate pending report). Already handled defensively (won't
      crash), but nothing surfaces or auto-resolves these dangling reports
- [ ] Consider notifying the original reporter when their report is
      resolved or rejected, matching the "close the loop" pattern already
      used elsewhere in the notification system, not currently required by
      any doc but a natural fit
- [ ] GET /reports/ only supports a status filter, adding a content_type
      filter (question/answer/comment) would let admins scope their review
      more precisely
- [ ] generate_unique_slug() has a TOCTOU race: the uniqueness check and the
      eventual save() aren't atomic, so two genuinely simultaneous creates
      with colliding names could both pass the check and the second save()
      would raise an uncaught IntegrityError (raw 500) instead of a clean
      error. Narrow edge case, but worth a retry-on-collision fix before
      real concurrent traffic exists
- [ ] .env.example documents discrete DATABASE_NAME/USER/PASSWORD/HOST/PORT
      vars as a fallback when DATABASE_URL is unset, but base.py's actual
      DATABASES config only ever reads DATABASE_URL via env.db(), those five
      vars are dead and unused. If DATABASE_URL is left unset while only the
      discrete vars are configured, the app silently falls back to local
      SQLite with no warning, a real risk on first deploy. Needs a decision:
      restore genuine discrete-var fallback logic, or remove the misleading
      vars from .env.example and document DATABASE_URL as the only path
- [ ] STORAGES["default"] in production.py is hardcoded to FileSystemStorage.
      No media uploads exist yet, but this needs to change to Cloudinary (or
      similar) before any file-upload feature ships, local disk storage is
      unreliable/ephemeral on most PaaS hosts
- [ ] DRF's browsable HTML API renderer isn't restricted to JSON-only in
      production, minor hardening, mostly informational exposure rather
      than a real vulnerability
- [ ] DEFAULT_PERMISSION_CLASSES is globally AllowAny, a deliberate and
      reasonable choice for this platform, but worth keeping in mind as a
      standing discipline point: any future view that omits
      permission_classes is open-by-default, not closed-by-default

## Frontend

- [ ] lucide-react is pinned to ^1.23.0 in package.json, every prior known
      release of this library uses a 0.x scheme. Not currently breaking
      anything (icons render, builds pass), but worth confirming via
      npm ls lucide-react whether this is a genuine 1.0 release or a typo,
      and spot-checking that no icon names changed if it's the former
- [x] TopBar's "Academia" wordmark is plain text, not a link, inconsistent
      with Sidebar's identical-looking wordmark which does navigate home.
      TopBar is the persistently visible one, worth making it a Link too
- [ ] No centralized z-index scale, ad hoc values (TopBar z-30, sidebar
      backdrop z-40, sidebar/ProfileMenu dropdown both z-50,
      NavigationProgressBar z-[100]) risk collisions as more overlays are
      added. Worth a small shared constants pass before that happens
- [x] Minor accessibility gaps in the shell layer: the mobile sidebar
      backdrop is a bare div with onClick, no keyboard equivalent or
      button semantics; ThemeToggle's button doesn't expose aria-pressed
      for its current state. Cheap, low-risk, worth doing together
- [ ] Establish a lint or PR-review convention preventing route-shaped
      files from landing inside components/ (or component files landing
      inside app/), found two real instances of this during the shell
      audit (see Project_audit_notes.md), worth preventing recurrence now
      that contributors are regularly opening PRs
- [ ] Both auth-related Route Handlers (app/api/backend/auth/google/route.js's
      backend fetch, and the token refresh call inside the catch-all
      [...path]/route.js) have no try/catch around the backend network call
      itself, only around bad response handling. If the backend is
      genuinely unreachable rather than just erroring, these throw an
      unhandled exception that surfaces as a raw Next.js 500 instead of the
      app's normal error handling. Same gap in two places, worth fixing
      together
- [ ] lib/jwt.js's decodeJwtExp uses Buffer, Node-runtime-only. Not an
      active bug (these routes default to the Node runtime), but would
      need atob/TextDecoder instead if any auth route is ever moved to the
      Edge runtime
- [ ] Concurrent-request refresh race, formally consolidated here from
      BUILD_LOG_FRONTEND.md's Known Deviations: if multiple requests expire
      at the same moment, more than one may attempt to use the same
      refresh token before rotation completes, one could be rejected.
      Unlikely at MVP traffic levels
- [ ] RecentQuestionsList's and app/search/page.js's handleLoadMore lack the
      cancelled-flag unmount guard their own initial-fetch useEffect already
      uses. Low real-world risk (manual click, not an automatic effect),
      but worth the same consistency treatment
- [ ] Question detail's "back to school" link routes through /hubs/{id},
      which now just redirects to /schools/{id} since the school/hub merge.
      Works correctly but adds an unnecessary redirect hop,
      question.hub.school.id is already available on the response and
      could link directly to /schools/{that id}
- [ ] Meta-row pattern (small icon + label, e.g. author/department/views on
      question detail, "by {author}" on answers and comments) has been
      copy-pasted across multiple files with drifting icon sizes relative
      to their adjacent text (16px icons next to 11-14px text in a few
      places, now hand-corrected where found during the audit). Worth
      extracting into one shared component (e.g. a small IconLabel) so
      icon-to-text proportion stays consistent by construction instead of
      needing to be independently gotten right in every new usage
- [ ] border-gray-200 dark:border-gray-700 (Tailwind's literal gray scale)
      still appears in place of border-[var(--color-border)] (the project's
      actual warm-neutral border token) in at least HubQuestionList and
      app/tags/[name]/page.js's list containers, found independently in two
      different passes of this audit, likely present elsewhere too. Worth
      one project-wide search-and-fix rather than continuing to patch
      individual instances as they're found
- [ ] NotificationBell's dropdown only ever fetches once per session
      (toggle() skips refetching once status leaves "idle"), so both the
      notification list and its own unread count go stale after the first
      open, a new notification arriving mid-session won't show up, in the
      list or the badge, until a full page reload. Worth a deliberate
      decision on the right fix (refetch on every open, a periodic poll,
      or something event-driven) rather than picking one blind
- [ ] ReportButton's modal uses raw border-gray-300 dark:border-gray-600
      instead of border-[var(--color-border)], the only modal shell in the
      app still on the un-tokenized value, RequestHubModal already uses
      the token correctly. Small, fix opportunistically
- [ ] Filter sidebar (FilterSidebar, shared across HubQuestionList, search,
      and tag question lists) stacks above the results list on mobile by
      default grid behavior, meaning a mobile visitor has to scroll past
      the entire filter panel before seeing any question. Worth a
      collapsible/toggle treatment on narrow screens, one shared component
      fix covers all three usages
- [ ] Empty states across the app are plain gray text ("No questions yet.",
      "No comments yet.", etc.) with no visual weight. A small shared
      EmptyState component (icon + message + optional call-to-action)
      would read as more intentional and could be dropped in everywhere
      at once rather than each spot staying ad hoc
- [ ] Form inputs, selects, and textareas each independently re-implement
      the same Tailwind classes (padding, border, radius, background)
      across roughly 15+ components, with real drift already found during
      this audit (inconsistent padding, inconsistent border-color tokens).
      Worth extracting shared Input/Select/Textarea primitives so this
      class of drift becomes structurally impossible instead of needing
      to be caught by hand each time
- [ ] Error and warning messages are ad hoc <p className="text-red-600...">
      tags repeated across roughly 40 files rather than a shared component.
      Same drift risk as the input fields above, and would make the
      already-planned "friendlier user-facing error copy" item trivial to
      roll out everywhere at once instead of file-by-file
- [ ] No persistent "Ask a question" affordance on mobile outside the nav
      drawer, currently requires opening the sidebar first. Worth
      considering a small floating action button on narrow screens to
      reduce that friction
- [ ] Muted secondary text (gray-400/500, used extensively for timestamps,
      meta info, and empty states) hasn't had a real contrast check against
      the milk-white background. Worth a proper WCAG AA pass with an
      actual contrast checker rather than adjusting the palette by eye
      again, given how much back-and-forth the color system already took
      to get right earlier in this project
- [ ] Further markdown editor optimizations to consider, none urgent, worth
      scoping individually before picking any up:
  - Undo/redo that understands formatting actions as single steps (e.g.
      one Ctrl+Z fully removes a toolbar-applied bold wrap) rather than
      relying purely on the browser textarea's native undo stack, which
      can split one logical action across several undo steps
  - Paste handling: auto-converting a pasted raw URL into `[text](url)`
      when text is selected at paste time, matching the interaction model
      of most modern editors
  - Tab/Shift+Tab to indent and outdent list items (nested lists),
      currently list items are always flat, no indentation support in
      either the editor shortcuts or the renderer's allowed output
  - A visible character/word count for static pages specifically, useful
      there in a way it isn't for short Q&A content (added to the rich mode attribute)
  - Auto-closing bracket/marker pairs while typing (typing `**` inserts
      the closing `**` automatically with the cursor between them),
      a genuinely bigger behavioral change worth a deliberate look at
      edge cases (nested formatting, existing text after the cursor)
      rather than a quick addition
