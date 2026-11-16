# FEATURE LIST

This file is the capability index for the whole project: what exists, per surface
(product checklist, backend, frontend, mobile), what is planned, and what is on the
backlog. It does not say where code lives (the map files do), why it was built that
way (the BUILD_LOG files do) or when it changed (the changelog does).

Status marks: [x] built and verified. [~] built with a known gap, the gap is named on
the same line. [ ] not built.

Each capability area has a "Where:" line naming route and component folders only,
and the same area headings are used in the Frontend and Mobile sections so the two
can be compared line by line. Pre-launch checklists live in DEPLOYMENT_CHECKLIST.md,
not here.

## Authentication
- [x] Google Login
- [x] Logout
- [x] User profile: stats, activity tabs, editable name
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
  - [x] Best answer selected
  - [x] Account suspended
  - [x] Hub activation rejected
- [x] In-app notifications for major actions
  - [x] New answer notification
  - [x] New comment notification
  - [x] Best answer selected notification
  - [x] Vote received notification
  - [x] Moderator assigned notification
  - [x] Hub activated notification
  - [x] New question notification for hub moderators (NEW_QUESTION, in-app only,
      closes a gap from project-plan.md's Moderator Responsibilities section,
      which described this but it was never implemented)
  - [x] New activation request notification for admins (NEW_ACTIVATION_REQUEST,
      in-app only) and new report notification for admins (NEW_REPORT,
      in-app only)
  - [x] Account suspended notification (USER_SUSPENDED, email and in-app,
        closes a real UX gap: a suspended user previously had no way to
        know why login stopped working)
  - [x] Hub activation rejected notification (HUB_ACTIVATION_REJECTED,
        email and in-app), closes the asymmetry where approval emailed
        the requester but rejection sent nothing at all
  - [x] Report reviewed notification for the original reporter
        (REPORT_REVIEWED, in-app only), closes the previously-tracked
        Platform Improvements backlog item

## Moderation
- [x] Report content (spam/abuse/misinformation/duplicate)
- [x] Dedicated escalate-to-admin action, distinct from the general report
      pipeline
- [x] View unanswered questions (moderator only, scoped to assigned hubs)
- [x] Reports dashboard (admin only)
- [x] Resolve reports (admin only)
- [x] Question lock/close capability, distinct from SOLVED, moderator/admin
      only, for the rare case a question genuinely needs to stop accepting
      input (spam magnet, fully resolved administrative question). SOLVED
      itself no longer implies closed, see project-plan.md's Question
      Lifecycle note. Backend and web UI complete. Mobile has a toggle bug,
      see Mobile audit backlog.

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
- [x] Deactivate and reactivate hubs (admin only).

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

# Web Capabilities (web)

Next.js 16 App Router, JavaScript, Tailwind v4, deployed on Vercel. Everything here is
built and live unless marked. File-level detail is in frontend-map.md.

## Shell and navigation
Where: components/layout, app/layout.js
- [x] Top bar: wordmark link home, theme toggle, notification bell, profile menu (Google sign in when logged out)
- [x] Sidebar drawer at every width (toggle only, not a persistent column), Escape and backdrop close it, inert when closed
- [x] Footer, navigation progress bar, menu of published static pages
- [x] Floating "Ask" button below the sm breakpoint for signed-in users, hidden on the ask and edit forms and on /admin and /moderation
- [x] Light and dark theme, manual toggle persisted in localStorage, icon swaps with CSS so it never flashes wrong
- [x] Responsive from 320px up, filter panels collapse on narrow screens

## Authentication and session
Where: components/auth, lib/auth-context.js, app/api/backend
- [x] Google sign in through Google Identity Services, token exchanged at POST /auth/google/
- [x] JWT pair lives only in httpOnly cookies, every backend call goes through Next route handlers that attach the Authorization header
- [x] One shared refresh per refresh token with a 10 second grace window, one retry after a 401, cookies cleared only on a definitive 400 or 401
- [x] Backend unreachable returns a clean 503 instead of a raw 500
- [x] Suspended account shows the backend message plus a support contact, 401 and 429 get friendly copy
- [x] Logout blacklists the refresh token (best effort) and clears cookies
- [x] The auth:expired event logs the UI out when a session dies anywhere
- [x] Role-aware UI from GET /users/me/ (is_admin, moderator_for, representative_for), hiding is UX only
- [~] Two serverless instances can still race a refresh and cause a stray logout

## Home
Where: app/page.js, components/home
- [x] Hero search bar into /search
- [x] Recent questions with View more (stale-response guards, load-more errors shown)
- [x] Side cards: schools with hubs, popular tags
- [x] WebSite plus SearchAction JSON-LD, dynamic Open Graph image

## Schools directory
Where: app/schools, components/schools
- [x] Debounced name search, filters for has active hub, institution type, ownership and state, count line, View more
- [x] Rows show hub status and location, empty and error states with retry

## School page and hub (one merged page)
Where: app/schools/[id], components/hubs, components/schools
- [x] Hero: name, short name, location, website, verified badge, institution type, ownership, state badges (country badge only outside Nigeria), question and moderator counts
- [x] Ask a question button prefilled with the hub
- [x] Question list: debounced search, status filter, department filter, ordering (newest, oldest, most or least viewed), collapsible filter panel with active count, View more
- [x] No hub (or hub offline): request-hub modal that handles "already has a hub" and "already pending"
- [x] Representatives and admins see a Manage departments link
- [x] UUID plus cosmetic slug URL, canonical, BreadcrumbList JSON-LD, dynamic Open Graph image
- [x] /hubs/[id] and /hubs/by-school/[id] permanently redirect to the school page

## Departments management
Where: app/schools/[id]/departments, components/departments
- [x] Create, rename, edit code, deactivate and reactivate departments (representatives and admins)
- [x] Duplicate-name error shown under the field, permission warning for non-managers, empty state

## Ask and edit a question
Where: app/questions/new, app/questions/[id]/edit, components/questions
- [x] School picker (schools with active hubs only), hub prefill from ?hub=, department select
- [x] Tag input with search-as-you-type, popular tags on an empty query, free text creates a new tag
- [x] Markdown editor (toolbar, keyboard shortcuts, list continuation, toggle formatting off, preview)
- [x] Per-field backend errors (title, body, department, tags) and a general error line
- [x] Edit and delete own question

## Question page
Where: app/questions/[id], components/questions, components/answers
- [x] Status icon, locked badge, author (platform badge), department, view count, tag links, Markdown body
- [x] Follow and unfollow, lock and unlock for hub staff and admins, actions menu (edit, delete, report, escalate)
- [x] Best answer pinned under the question with "View in list" that scrolls and flashes the answer (honors reduced motion)
- [x] #answer-{id} deep links scroll and flash, including links that only change the hash
- [x] Breadcrumb back to the school, BreadcrumbList JSON-LD, dynamic Open Graph image
- [x] SOLVED means "has a best answer"; only is_locked blocks new answers

## Answers
Where: components/answers
- [x] Answer form with inline error, locked and logged-out states
- [x] Byline above the body, platform badge, edit and delete own with confirmation
- [x] Vote up, vote down and remove vote (restored on reload via user_vote), never on your own answer
- [x] Mark best answer (question owner only), report and escalate from the actions menu

## Comments
Where: components/comments
- [x] Lazy loaded per answer, add, edit and delete own (inline, with confirmation), report and escalate from the actions menu
- [x] Comment count stays in sync after add and delete

## Tags
Where: app/tags, components/tags
- [x] Tag browse with search, popular or alphabetical order, View more
- [x] Questions by tag with status filter and View more, zero matches is an empty state not a 404

## Search
Where: app/search, components/search
- [x] Debounced query, single-tag filter, results ranked solved, votes, recency, relevance
- [x] noindex when a query is present, View more with stale-response guards

## Notifications
Where: components/notifications, app/notifications
- [x] Bell with unread badge, six items fetched with four visible and the rest scrolling, pinned "View all", mark read on click, mark all read
- [x] Refetches on every open and on focus or visibility (10 second floor), no polling
- [x] Full page with All and Unread filters, pagination, mark all read
- [x] All twelve notification types have an icon, link_target opens the question and scrolls to the answer, rows without a link stay plain

## Profile
Where: app/profile, components/profile
- [x] Identity card: avatar, inline name edit (trimmed, blank blocked, backend errors), role chips, stats strip
- [x] Link to moderation tools for staff
- [x] One tab strip: Activity (merged feed), Questions, Answers, Comments, each paginated and mounted on first visit

## Reports
Where: components/reports, app/my-reports
- [x] Report a question, answer or comment (spam, abuse, misinformation, duplicate), hidden for your own content
- [x] Escalate for hub staff and admins (creates a report then escalates, handles "already reported")
- [x] /my-reports: private list with All, Pending, Reviewed and No action taken tabs, "Content removed" state, never shows reviewer or escalation data, noindex

## Moderation (/moderation, moderators and representatives)
Where: app/moderation, components/moderation
- [x] Staff guides, one card per hub the user helps manage
- [x] Moderators tab: search and assign users (debounced picker, double-submit guard), remove, representatives can self-assign
- [x] Departments tab (representatives), Unanswered tab with search and View more

## Admin (/admin)
Where: app/admin, components/admin, components/moderation
- [x] Reports: status tabs, content-type and escalated filters, resolve, reject, resolve and delete with confirmation, "Content removed" handling, auto-resolved notice
- [x] Schools: search, Active, Inactive and All tabs, create and edit modal (including curation fields), activate and deactivate
- [x] Activation requests: status tabs, approve, reject with an optional reason (1000 character counter), reason shown on rejected rows
- [x] Users: search, active filter, suspend and reactivate, self-suspension disabled
- [x] Tags: search, pagination, rename, merge, delete with force
- [x] Static pages: filters, create, edit and delete with a rich Markdown editor (word and character count), visibility and draft
- [x] Hub teams: pick any school, assign and remove moderators and representatives, departments, unanswered queue, take a hub offline or restore it

## Static pages
Where: app/pages
- [x] Markdown pages by slug, invisible pages 404, pages menu in the shell

## SEO and sharing
Where: app/robots.js, app/sitemap.js, opengraph-image.js files, lib/og.js
- [x] Per-page metadata and canonical URLs, robots rules (private areas disallowed), sitemap that walks schools, tags and questions
- [x] Dynamic Open Graph images for home, schools, questions and tags
- [x] Structured data: WebSite with SearchAction, BreadcrumbList

## Content rendering
Where: components/ui, lib/markdown.js
- [x] Safe Markdown rendering (marked plus sanitize-html), plain-text snippets for previews
- [x] Platform account badge for ids in NEXT_PUBLIC_PLATFORM_ACCOUNT_ID

## Design system and accessibility
Where: app/globals.css, components/ui
- [x] Tokens: border, border-strong, muted (AA contrast), accent, success, named z-index scale
- [x] Shared primitives: ErrorMessage, EmptyState, FormControls (FormField), Tabs, IconLabel, Dropdown, ActionsMenu, Skeleton, FilterSidebar
- [x] Labels tied to fields on the main forms, errors announced to screen readers, visible keyboard focus, press feedback, skeleton shimmer, staggered list animation
- [x] Friendly copy for network failure, 429 and gateway timeouts

## Engineering
- [x] npm run check (lint plus structure check: no route files in components, no components in app, valid lucide icons)
- [x] error.js and not-found.js boundaries on the main routes

## Known gaps (also in the audit backlog)
- [ ] Hub-offline notice for moderators and representatives (needs a backend change first)
- [ ] Shared Modal primitive (dialog semantics, Escape, focus handling)
- [ ] Labels on SchoolFormModal and PageFormModal
- [ ] Windowed "View more" lists (see Long List Handling)
- [ ] Control borders at 3:1 (WCAG 1.4.11), a deliberate design trade-off, retune --color-border-strong if wanted

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
- [ ] Answer/source verification - Allow trusted contributors or moderators 
      to attach supporting sources or verification notes to answers, and 
      indicate when an answer has been verified against an authoritative source.

## Internationalization (Future)
- [ ] Make the Globe2/country badge on the school profile page permanently
      visible for every school, including Nigerian ones, once a genuine
      second-country presence exists. Currently conditional
      (`country !== "Nigeria"`) specifically to avoid a 100%-redundant badge
      on a single-country dataset, see the School Directory Fields Display
      entry in BUILD_LOG_FRONTEND.md for the original reasoning. Marked with
      a TODO(i18n) comment at the exact line in
      app/schools/[id]/[[...slug]]/page.js.

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
- [x] Curated database of Nigerian universities, polytechnics, and colleges,
      sourced primarily from NUC, NBTE, and NCCE official lists,
      cross-referenced against JAMB's institution list and secondary sources. 
      This is the first of what may become several country-specific data pipelines 
      as Academia Atlas expands.
- [x] Extend the School model with richer fields: institution type
      (university/polytechnic/college of education), ownership
      (federal/state/private), state, an official regulatory or JAMB code,
      source_url, last_verified_at, plus a forward-compatible country field
      for eventual multi-country expansion. SchoolSourceRecord model added
      alongside for per-regulator provenance tracking. Schema, serializers,
      views (three new List Schools filters), and admin all landed.
      Consuming a real cleaned NUC/NBTE/NCCE dataset via an import command
      is still pending, tracked separately below.
- [ ] Periodic re-verification workflow so curated data doesn't silently go
      stale
- [ ] User-submitted "school not listed" request flow (SchoolSubmission)
- [ ] Bulk data import tooling to support the school directory curation effort above
- [ ] Admin verification workflow for submitted schools
- [x] School directory/search page filter controls for institution_type,
      ownership, and state, GET /schools/ already supports all three as
      query params, no frontend UI built against them yet
- [x] Admin school form (SchoolFormModal) gained inputs for
      institution_type, ownership, state, and country, previously only
      settable via direct API calls
- [x] School directory/search page filter controls for institution_type,
      ownership, and state, GET /schools/ already supported all three as
      query params, now wired into app/schools/page.js

## SEO & Discoverability (Future)
- [x] Site-wide SEO and social share metadata overhaul: root layout
      defaults, per-page generateMetadata for schools/hubs/questions/tags/
      listings/search/homepage, canonical URL strategy (schools now match
      questions' UUID-primary/cosmetic-slug pattern via lib/urls.js's
      schoolUrl()), robots/indexing rules (search results noindex when
      queried), sitemap.js covering schools/tags/questions, dynamic Open
      Graph image generation (lib/og.js, reusable OgCard) for homepage/
      schools/questions/tags, WebSite+SearchAction and BreadcrumbList
      structured data, and a technical SEO pass. Landed in four phases,
      see BUILD_LOG_FRONTEND.md.
- [x] Platform account visual marker: a single known account id (env-
      configured, unset by default) gets a small badge next to its name
      wherever an author is shown, for Academia Atlas' own seed/editorial
      account. Not a role system, no is_admin exposure.

## Admin & Moderation UX (Post-MVP)
- [x] Collapsible mobile filter sidebar (was previously always-expanded,
      stacking above results awkwardly on narrow screens)
- [x] Search/filter controls added to Pages, Team (moderators/
      representatives), Activation Requests, and Unanswered Questions
      management surfaces
- [x] FilterSidebar's mobile badge now shows a real active-filter count
      instead of a generic dot, wired into HubQuestionList,
      TagQuestionsClient, and SearchResultsClient
- [x] Real server-side search added to GET /questions/unanswered/,
      UnansweredQueue now searches the full result set, not just the
      loaded page
- [x] Reports dashboard follow-ups: content_exists handling ("Content
      removed", delete action hidden), auto_resolved_count notice with an
      in-place refresh, content_type filter beside the status tabs, and
      "View content" deep links from link_target. Resolve & delete now needs
      a confirmation step.
- [x] /my-reports page (GET /reports/mine/): the reporter's own reports with
      status, review date and a link to the content. Private, never on the
      profile, noindex plus a robots disallow, linked from ProfileMenu.
- [x] Schools manager Active, Inactive and All tabs (GET /schools/?is_active=),
      inactive rows carry a visible badge, toggling a row out of the current
      tab removes it and fixes the count. Failed "View more" now shows an
      error.
- [x] Hub offline control for admins (PATCH /hubs/{id}/) in the Hub teams
      tab, with a confirmation for taking a hub offline. The picker now
      searches all schools so an offline hub can be found and restored.
- [x] Activation request rejection reason shown on the Rejected tab, reject
      input capped at 1000 characters with a remaining counter, and a 400
      shown inline while the request stays pending.
- [x] TeamMemberList add flow: double submits blocked with a ref guard, the
      picker disables its selection while the POST is in flight, and its
      search callback no longer re-fires on every parent render.
- [x] UserSearchPicker shows friendly copy for a 429.
- [x] Profile: "Your posts" now above "Recent activity", name edit trims,
      disables Save when blank and shows backend field errors inline, avatar
      is decorative with no-referrer.
- [ ] GET /hubs/activation-requests/ intentionally kept as loaded-page-
      only search in ActivationRequestsQueue, a deliberate choice, not a
      gap, "bug turned feature"

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

## Long List Handling (Future)
- [ ] Windowed "View more" lists (Facebook-style). The View more button
      stays, but only a fixed number of rows ever stay on the page. After the
      reader has loaded several pages, the oldest rows at the top are dropped
      from the page, however many times View more is clicked.

      Why: today every click appends a page and nothing is ever removed. After
      ten clicks a list holds 200 or more rows, which means a large DOM, a
      scrollbar thumb the size of a pixel, and sluggish scrolling on cheap
      phones, which this audience uses.

      Behaviour:
      - Keep a window of N pages (for example 3 pages of 20 rows). When
        appending another page would exceed it, the oldest page leaves the DOM
        and a spacer of the same total height takes its place, so the scroll
        position does not jump.
      - When the reader scrolls back up to the spacer, a "Show earlier
        questions" control brings the previous page back and drops a page from
        the bottom. It can be button-only at first.
      - Fetched pages stay in an in-memory map keyed by page number, so
        returning to an earlier page is instant and never refetches. A filter,
        search or sort change clears the window and the map.
      - Rows vary in height (the meta row wraps), so measure rows with
        ResizeObserver and sum the measured heights for the spacer, with an
        estimate for rows never measured.

      Plan, in this order:
      1. Measure first, with 500 realistic rows (React Profiler, Lighthouse).
      2. Try CSS only: content-visibility: auto with contain-intrinsic-size on
         each row skips rendering offscreen rows without removing them. Stop
         here if that is enough.
      3. Build a shared usePagedList hook that owns fetch, append, the
         stale-response guard and the load-more error, which is logic now
         hand-copied across about a dozen components. Then a WindowedList
         wrapper that does the eviction. Adopting the hook is a clean-up on
         its own.

      Where: RecentQuestionsList, HubQuestionList, TagQuestionsClient,
      SearchResultsClient, the notifications page, the profile tabs, and the
      admin lists (users, schools, tags, reports, unanswered queue).

      Details to get right:
      - Accessibility: announce the position ("Showing 41 to 100 of 340") in
        a polite live region, never evict a row that holds keyboard focus, and
        keep the View more button reachable.
      - Browser find (Ctrl+F) only sees rows currently on the page, so say so.
      - Do not replay the stagger animation for rows brought back at the top.
      - Browser Back should restore position: keep the loaded pages and
        scroll offset in sessionStorage, keyed by route and filters.
      - The total count in the list header stays the API's count.

      Not goals: classic full-list virtualization, any new dependency, or any
      change to the API's pagination.

      Done when: after 500 rows are loaded by repeated View more, the DOM
      never holds more than N rows, scroll position does not jump on
      eviction, going back to earlier rows works without refetching, the
      position is announced, and a filter change resets the window.

## Mobile App Promotion (Future, needs store listings)
- [ ] A slim, dismissible AppPromoBanner on mobile browsers only. Never a full
      page interstitial, which Google penalizes and which blocks content.
      Hidden on /admin, /moderation and the ask and edit forms, and hidden
      inside the app. Dismissal remembered for 30 days in localStorage
      (try/catch). Env gated: NEXT_PUBLIC_APP_STORE_URL,
      NEXT_PUBLIC_PLAY_STORE_URL, NEXT_PUBLIC_IOS_APP_ID. When unset it renders
      nothing, so it can ship before launch.
- [ ] iOS native Smart App Banner through metadata
      (other: { "apple-itunes-app": "app-id=..." }), plus a "Get the app" link
      in the footer and sidebar.
- [ ] Universal links and app links, so a shared question or school link opens
      the app when it is installed: serve /.well-known/apple-app-site-association
      and /.well-known/assetlinks.json, and add a linking config on the mobile
      side for /questions/:id/:slug? and /schools/:id/:slug?. Needs the Apple
      team id and the Android signing fingerprint from the store builds.

---

# Audit history and backlog

## Backend

- [x] Private "my reports" view: GET /reports/mine/, self-scoped, shows only
      the reporter's own reports with status and a link to the content,
      never reviewer identity or escalation state, so reporting stays
      private in both directions
- [x] Hub activation rejection reason is now persisted
      (HubActivationRequest.rejection_reason) and shown in the admin
      request list, previously emailed and discarded
- [x] Admin action audit log (who resolved which report, who suspended which user)
- [x] Admin action audit log also covers tag merge and delete actions
      (via AdminActionLog)
- [ ] Answer edit history, so a heavily-edited answer's original context isn't lost
      framed as quality signal, not a leaderboard or engagement mechanic, consistent
      with Knowledge Over Social Activity
- [x] Standalone answer/comment permalink page, so notifications and reports
      targeting an answer or comment (VOTE, NEW_COMMENT, non-question
      reports) can deep-link somewhere real instead of rendering as
      non-clickable text.
- [x] UserSerializer's stats field, currently only attached ad hoc in MeView,
      should become a proper SerializerMethodField on the serializer itself,
      so it's included everywhere UserSerializer is used (this also closes a
      real doc/code mismatch, api-contract.md documents stats as present on
      the Google Login response, but it currently isn't)
- [x] Google-authenticated users should have set_unusable_password() called
      explicitly at creation, currently left at Django's blank default,
      harmless today but worth hardening before email/password auth ships
- [x] GoogleLoginView should explicitly reject login for suspended
      (is_active=False) accounts with a clear error, rather than issuing a
      token pair that only fails on the next authenticated request
- [x] PATCH /users/me/ should validate full_name isn't blank/whitespace-only
      and return a proper field error, instead of silently no-op'ing
- [x] GET /users/search/ should share the existing "search" throttle scope
      (60/min) rather than falling back to the general 100/min limit, it's a
      type-ahead endpoint and will be called more rapidly than that implies
- [x] Google login should verify email_verified from Google's userinfo
      response before creating/logging in a user, currently trusted
      implicitly
- [x] Cache invalidation gap: PATCH /schools/{id}/, POST department creation,
      and PATCH department updates all invalidate school-detail and/or
      school-list but never school-by-slug, so slug-based lookups can serve
      stale data (including a deactivated school still appearing active) for
      up to CACHE_TTL_MEDIUM after a write. apps.hubs already does this
      correctly for hub-by-slug, apps.schools needs the same fix
- [x] SchoolBySlugView lets platform admins read inactive schools and bypasses
      cached slug results; non-admins see only active schools. School URLs use
      UUIDs as the lookup key with an optional cosmetic slug, as documented
      in design-guide.md
- [x] Shared "is this request from a platform admin" check duplicated across
      SchoolListCreateView, SchoolDetailView, and inlined again in
      DepartmentListCreateView.get(), should be a single helper in
      apps.core.permissions
- [x] GET /schools/ has no is_active filter for admins, who currently see
      active and inactive schools in one combined list with no way to
      narrow to just one, AdminUserListView already has this exact pattern
      for users, worth matching here
- [x] Several write endpoints have no dedicated throttle scope and fall back
      to the general 100/min limit: School/Department creation, Answer
      edit/delete (AnswerDetailView), Mark Best Answer, Comment edit/delete
      (CommentDetailView), and Static Page creation (StaticPageListCreateView.post).
      Worth a deliberate pass deciding which of these actually need tighter
      scoping versus being fine on the general limit, rather than the
      current case-by-case inconsistency
- [x] Hub deactivation endpoint (admin only), mirroring School's soft-delete
      pattern. Currently no API path exists to take an active hub offline,
      is_active on Hub can only ever be set to True through the API today
- [x] If Hub deactivation is added, HubDetailView/HubBySchoolView/
      HubBySlugView need the same admin-bypass-for-inactive pattern
      SchoolDetailView already has, otherwise a deactivated hub becomes
      unreachable even to the admin who deactivated it
- [x] Cache invalidation gap (combined with the school-by-slug finding from
      the Schools audit): approving a hub activation request changes
      School.has_hub but never invalidates school-by-slug:{slug}, so a
      school's slug-based lookup can show stale has_hub for up to
      CACHE_TTL_MEDIUM after activation. Fixed through the shared
      invalidate_school_cache() helper, used by both apps.schools and
      apps.hubs so this can't drift again
- [x] Unanswered questions queue (GET /questions/unanswered/) only checks
      ModeratorAssignment, not SchoolRepresentativeAssignment, meaning a rep
      managing a hub with no moderator assigned yet cannot see their own
      hub's queue at all. Directly inconsistent with the reasoning already
      applied to NEW_QUESTION's fan-out (widened to include reps for exactly
      this zero-moderator-hub scenario), same fix belongs here
- [x] QuestionLockView.check_lock_permission() duplicates hub-role-check
      logic inline for a third time (Schools and Hubs audits flagged the
      same pattern already), worth one shared "is moderator or rep for this
      hub" helper in apps.hubs.permissions instead
- [x] Django admin's Question list view doesn't surface is_locked, hard to
      tell which questions are locked without opening each one
- [x] Search results omit slug (and department, view_count, is_locked) from
      each question, matching the documented contract exactly today, but
      meaning the frontend can't build a /questions/{id}/{slug} URL
      directly from a search result without a follow-up request. Worth
      deciding whether slug specifically should be added to
      SearchQuestionSerializer
- [x] Static Pages endpoints (list and detail) have no caching, unlike
      Schools/Hubs/Tags which all use the same short-TTL public-read
      pattern. Deliberately deferred at build time as non-blocking, worth
      picking up now that it's a formally tracked item
- [x] Tag list (GET /tags/) is fully unpaginated by design, reasonable at
      current volume but a real scaling risk given tags are free-text and
      community-generated with no curation. Recommend adding standard
      pagination now while cheap. This IS a breaking response-shape change
      ({"results": [...]} becomes {count, next, previous, results}), needs
      to be scoped as a coordinated backend+frontend issue, not a silent
      backend-only change
- [x] Tag name (max_length=50) is never validated for length before hitting
      the database on either write path (TagMergeView's rename branch, and
      _sync_tags() in apps/questions/serializers.py, the implicit
      tag-creation path any authenticated user hits via question tagging).
      A name over 50 characters currently raises an unhandled DB-level
      error instead of a clean 400. Reachable by any regular user, not just
      admins, worth prioritizing
- [x] Django admin's Tag list doesn't surface question_count (would need an
      admin method since it's computed, not a model field)
- [x] Resolving a report with DELETE_CONTENT can orphan other pending
      reports pointing at content that gets cascade-deleted along with it
      (e.g. a Question's report deletes it, cascading to an Answer that had
      its own separate pending report). Already handled defensively (won't
      crash), but nothing surfaces or auto-resolves these dangling reports
- [x] Consider notifying the original reporter when their report is
      resolved or rejected, matching the "close the loop" pattern already
      used elsewhere in the notification system, not currently required by
      any doc but a natural fit
- [x] GET /reports/ only supports a status filter, adding a content_type
      filter (question/answer/comment) would let admins scope their review
      more precisely
- [x] generate_unique_slug() has a TOCTOU race: the uniqueness check and the
      eventual save() aren't atomic, so two genuinely simultaneous creates
      with colliding names could both pass the check and the second save()
      would raise an uncaught IntegrityError (raw 500) instead of a clean
      error. Narrow edge case, but worth a retry-on-collision fix before
      real concurrent traffic exists
- [x] .env.example documents discrete DATABASE_NAME/USER/PASSWORD/HOST/PORT
      vars as a fallback when DATABASE_URL is unset, but base.py's actual
      DATABASES config only ever reads DATABASE_URL via env.db(), those five
      vars are dead and unused. If DATABASE_URL is left unset while only the
      discrete vars are configured, the app silently falls back to local
      SQLite with no warning, a real risk on first deploy. Needs a decision:
      restore genuine discrete-var fallback logic, or remove the misleading
      vars from .env.example and document DATABASE_URL as the only path
- [ ] STORAGES["default"]: now overridable via DEFAULT_FILE_STORAGE_BACKEND
      but still FileSystemStorage. A cloud backend must be installed and
      verified against Django 6 before any upload feature ships (Supabase
      S3-compatible storage via django-storages is the first candidate)
- [x] DRF's browsable HTML API renderer isn't restricted to JSON-only in
      production, minor hardening, mostly informational exposure rather
      than a real vulnerability
- [x] DEFAULT_PERMISSION_CLASSES is globally AllowAny, a deliberate and
      reasonable choice for this platform, but worth keeping in mind as a
      standing discipline point: any future view that omits
      permission_classes is open-by-default, not closed-by-default

## Frontend

- [x] lucide-react is pinned to ^1.23.0 in package.json, every prior known
      release of this library uses a 0.x scheme. Not currently breaking
      anything (icons render, builds pass), but worth confirming via
      npm ls lucide-react whether this is a genuine 1.0 release or a typo,
      and spot-checking that no icon names changed if it's the former
- [x] TopBar's "Academia Atlas" wordmark is plain text, not a link, inconsistent
      with Sidebar's identical-looking wordmark which does navigate home.
      TopBar is the persistently visible one, worth making it a Link too
- [x] No centralized z-index scale, ad hoc values (TopBar z-30, sidebar
      backdrop z-40, sidebar/ProfileMenu dropdown both z-50,
      NavigationProgressBar z-[100]) risk collisions as more overlays are
      added. Worth a small shared constants pass before that happens
- [x] Minor accessibility gaps in the shell layer: the mobile sidebar
      backdrop is a bare div with onClick, no keyboard equivalent or
      button semantics; ThemeToggle's button doesn't expose aria-pressed
      for its current state. Cheap, low-risk, worth doing together
- [x] Establish a lint or PR-review convention preventing route-shaped
      files from landing inside components/ (or component files landing
      inside app/), found two real instances of this during the shell
      audit (see Project_audit_notes.md), worth preventing recurrence now
      that contributors are regularly opening PRs
- [x] Both auth-related Route Handlers (app/api/backend/auth/google/route.js's
      backend fetch, and the token refresh call inside the catch-all
      [...path]/route.js) have no try/catch around the backend network call
      itself, only around bad response handling. If the backend is
      genuinely unreachable rather than just erroring, these throw an
      unhandled exception that surfaces as a raw Next.js 500 instead of the
      app's normal error handling. Same gap in two places, worth fixing
      together
- [x] lib/jwt.js's decodeJwtExp uses Buffer, Node-runtime-only. Not an
      active bug (these routes default to the Node runtime), but would
      need atob/TextDecoder instead if any auth route is ever moved to the
      Edge runtime
- [~] Concurrent-request refresh race, formally consolidated here from
      BUILD_LOG_FRONTEND.md's Known Deviations: if multiple requests expire
      at the same moment, more than one may attempt to use the same
      refresh token before rotation completes, one could be rejected.
      Mitigated within a single instance by the shared refresh promise and
      grace window; cross-instance races remain. Unlikely at MVP traffic
      levels
- [x] RecentQuestionsList's and the search page's handleLoadMore now drop
      responses that arrive after unmount or after the filter changed. Load
      more failures are now shown (RecentQuestionsList stored them but never
      displayed them).
- [x] Tag list pagination: /tags browse uses load-more, TagsManager can
      reach, merge and delete tags past the first 50, tag autocomplete, the
      search tag filter and the merge control request page_size=10, and
      sitemap.js walks every page of tags.
- [x] Sitemap lists canonical slugged school URLs and walks every page of
      schools, tags and questions through one helper that keeps partial
      results on failure.
- [x] TagsManager no longer replaces its search bar with a skeleton while
      loading, which dropped focus on every debounced search.
- [x] Theme toggle moved from the sidebar footer to an icon button in the
      TopBar beside the notification bell.
- [x] Profile page: identity card (avatar, inline name edit, role chips,
      moderation link, stats strip) above one tab strip (Activity,
      Questions, Answers, Comments). Tabs stay mounted once opened.
- [x] Admin hub picker shows its "no hub yet" message under the school that
      was picked, and rows show an opening state.
- [x] Question detail's "back to school" link now routes directly via
      schoolUrl() instead of through the /hubs/{id} redirect hop.
      QuestionHubSchoolSerializer gained an id field, additive, needed
      for the link to be buildable at all.
- [x] Meta-row pattern (small icon + label, e.g. author/department/views on
      question detail, "by {author}" on answers and comments) has been
      copy-pasted across multiple files with drifting icon sizes relative
      to their adjacent text (16px icons next to 11-14px text in a few
      places, now hand-corrected where found during the audit). Worth
      extracting into one shared component (e.g. a small IconLabel) so
      icon-to-text proportion stays consistent by construction instead of
      needing to be independently gotten right in every new usage
- [x] border-gray-200 dark:border-gray-700 (Tailwind's literal gray scale)
      still appears in place of border-[var(--color-border)] (the project's
      actual warm-neutral border token) in at least HubQuestionList and
      app/tags/[name]/page.js's list containers, found independently in two
      different passes of this audit, likely present elsewhere too. Worth
      one project-wide search-and-fix rather than continuing to patch
      individual instances as they're found
- [x] NotificationBell's dropdown only ever fetches once per session
      (toggle() skips refetching once status leaves "idle"), so both the
      notification list and its own unread count go stale after the first
      open, a new notification arriving mid-session won't show up, in the
      list or the badge, until a full page reload. Worth a deliberate
      decision on the right fix (refetch on every open, a periodic poll,
      or something event-driven) rather than picking one blind
- [x] ReportButton's modal uses raw border-gray-300 dark:border-gray-600
      instead of border-[var(--color-border)], the only modal shell in the
      app still on the un-tokenized value, RequestHubModal already uses
      the token correctly. Small, fix opportunistically
- [x] Filter sidebar (FilterSidebar, shared across HubQuestionList, search,
      and tag question lists) stacks above the results list on mobile by
      default grid behavior, meaning a mobile visitor has to scroll past
      the entire filter panel before seeing any question. Worth a
      collapsible/toggle treatment on narrow screens, one shared component
      fix covers all three usages
- [ ] Hub offline notice for moderators and representatives: needs a backend
      change first (keep offline hubs in moderator_for and representative_for
      with a hub_active flag, plus HUB_DEACTIVATED and HUB_REACTIVATED
      notifications), then a banner on /moderation.
- [x] Empty states across the app are plain gray text ("No questions yet.",
      "No comments yet.", etc.) with no visual weight. A small shared
      EmptyState component (icon + message + optional call-to-action)
      would read as more intentional and could be dropped in everywhere
      at once rather than each spot staying ad hoc
- [x] Form inputs, selects and textareas ... restyled onto Input, Select and
      Textarea by the same codemod for every control carrying the standard
      styling. The ask and edit question forms, the answer form, the
      department form and the request-hub modal are fully converted with
      FormField (label tied to control, inline field errors through
      lib/formErrors.js).
- [ ] Labels on SchoolFormModal and PageFormModal (label wiring for these
      two remaining forms)
- [x] Error and warning messages are ad hoc red paragraphs ... moved to the
      shared ErrorMessage by scripts/codemod-primitives.mjs, with the three
      error.js boundary pages left as they were.
- [x] No persistent "Ask a question" affordance on mobile. AskFab, a
      floating Ask button below the sm breakpoint for signed-in users, hidden
      on the ask and edit forms and on /admin and /moderation.
- [x] Muted secondary text contrast: measured, text-gray-400 failed in light
      mode (about 2.5:1) and text-gray-500 in dark mode (about 3.7:1). A
      text-muted utility (light #67645C, dark #9EA1AB, at least 4.5:1 on
      every surface the app uses) replaced both across the app.
- [x] Static page editor word and character count (richMode only). The other
      markdown editor ideas (grouped undo, paste-to-link, nested lists,
      auto-closing markers) stay deferred.
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
- [x] Forms: labels are tied to their fields on the ask, edit, answer,
      department, request-hub, report and escalate forms and the school
      filters. (SchoolFormModal and PageFormModal still open, see above.)
- [ ] A shared Modal primitive. Every dialog (report, escalate, school form,
      page form, request hub) repeats the same backdrop and has no dialog
      semantics, Escape-to-close or focus handling.

## Mobile

- [x] M2: keyboard avoiding (useKeyboard, KeyboardAvoid, composer and Ask form, Android confirmed). iOS offset formula untested
- [x] M3: markdown editor v2 and renderer parity, tag picker (Android pending, iOS untested)
- [x] ModalSheet.tsx removed (unused)
- [ ] M4: question share text
- [ ] M9: castVote switching UP to DOWN removes then re-adds, a failure on
      the second call leaves local state wrong
- [ ] M7: Home N+1 hub counts, schools state filter
- [ ] M5 to M12: remaining area passes, accessibility (screen reader and
      dynamic type), offline cached content, performance

---

# Mobile Client (mobile)

Expo (React Native, TypeScript) user client for iOS and Android. It calls the Django API directly, with tokens
in secure storage and no web proxy. mobile-map.md says where the code lives. Area headings match the Frontend
Capabilities section so the two compare line by line. Legend as above. Each line ends with a parity tag after a
pipe: "parity", "differs: reason" or "gap: what is missing on mobile". Android 9 and Android 15 are the test
devices, items marked (iOS untested) are implemented but not checked on an iPhone.

## Shell and navigation
Where: src/navigation, src/components (TopBar, Screen, States), src/features/network
- [x] Five tabs (Home, Schools, raised Ask, Alerts with unread count, Profile) and a slide-over drawer | differs: bottom tabs and drawer instead of the web top bar and sidebar
- [x] Drawer: Browse tags, Search, My reports (signed in), Policies and guides, staff web links, dark mode, log out. Closes on backdrop, Back or swipe left (iOS untested) | differs
- [x] Guests tapping Ask or any restricted action get the sign-in sheet, the action resumes after login | differs: sheet instead of a login page
- [x] Light and dark theme, system by default with a manual override in the drawer and profile, no flash of the wrong theme | parity
- [x] Offline banner, loading skeletons, empty and error states with Retry, network failures get a "Can't connect" state, pull to refresh | parity
- [x] Error boundary with a friendly fallback (iOS untested) | gap closed: web uses error.js boundaries
- [x] Deep links through the academiaatlas:// scheme, paths mirror the web routes, #answer-{id} scrolls to the answer (iOS untested) | differs: scheme links, https links need launch setup
- [ ] Opening shared https web links in the app (Android intent filters with autoVerify, assetlinks.json, apple-app-site-association) | gap: DEPLOYMENT_CHECKLIST
- [x] Sheets close with a swipe down on the handle and title area, like the drawer swipe (iOS untested) | parity with the drawer
- [ ] Offline cached content (the banner only warns) | gap: future, with the web's low-data mode
- [x] Skeleton pulse honours reduced motion, flash ring is a static border | parity
- [x] Logo mark in the top bar, boot splash and login, white A in dark mode, wordmark stays on one line | parity
- [ ] App icon, adaptive and monochrome icons and splash verified on the final build (Android 13+ for themed icons, iOS untested) | gap

## Authentication and session
Where: src/auth, src/api/client.ts, src/features/auth
- [x] Native Google account picker on Android and iOS, token exchanged at POST /auth/google/, web keeps the browser flow | differs: native picker instead of Google Identity Services
- [ ] Native Google sign in verified on the final preview build (Android 9 and 15), iOS untested | gap
- [x] Guest browsing, sign out, auth gate sheet | differs
- [x] Tokens in secure storage, single-flight refresh on 401, session cleared only on a definitive 400 or 401, startup keeps the session on network, 429 and 5xx | parity (httpOnly cookies on web)
- [x] Suspended account (403) shows the backend message plus the support contact, 401 shows friendly copy | parity
- [x] Developer access sheet from Login and from any sign-in prompt in development builds only, absent in preview and production | differs: mobile only
- [x] Cached user write failures are swallowed, a very large staff account only loses the offline cold start | accepted

## Home
Where: src/screens/HomeScreen.tsx, src/features/schools/SchoolCard.tsx
- [x] Search pill, schools with hubs (SchoolCard strip, tile slot reserved for a per-school logo), popular tags, recent questions with View more | parity
- [~] Hub question counts use one request per school card (at most 5, cached on the backend) | gap: backend hub_question_count would remove it
- [x] Rows show plain-text snippets | parity

## Schools directory
Where: src/screens/SchoolsScreen.tsx
- [x] Name search, has hub, institution type, ownership and state filters in a filter sheet, count line, View more, Clear filters on an empty result | parity (sheet instead of a panel)

## School page and hub
Where: src/screens/SchoolScreen.tsx, src/features/schools
- [x] Hero: name, short name, location, website, verified shield, type, ownership, state, question and moderator counts | parity
- [x] Ask a question prefilled with the hub | parity
- [x] Status and department chips, sort (Newest, Oldest, Most viewed, Least viewed), paginated questions | differs: chips and a sort sheet instead of a sidebar
- [x] No hub or hub offline shows the request card and a request sheet | parity

## Departments management
- [ ] Not on mobile | differs: staff tools are web only

## Ask and edit a question
Where: src/screens/AskScreen.tsx, src/features/questions/TagInput.tsx
- [x] Two steps: school picker (schools with active hubs, search), then title, body, department, tags | parity
- [x] Tag picker: popular tags, debounced live search, free text, chips with remove | parity
- [x] Markdown editor with toolbar and preview | parity
- [x] Per-field backend errors under their field | parity
- [x] Edit (loads fresh each time with loading and error states) and delete own question | parity
- [x] Keyboard handling keeps the form and composer above the keyboard (iOS untested) | mobile only

## Question page
Where: src/screens/QuestionScreen.tsx, src/features/answers
- [x] Status, locked label, author with platform badge, school link, department, views, tags, Markdown body | parity
- [x] Follow, lock and unlock for hub staff, actions sheet (edit, delete, report, escalate, share) | differs: sheet instead of a dropdown
- [x] Best answer pin with View in list jump and ring flash | parity
- [x] Deep link scroll to an answer from a notification | parity
- [x] Share text: title, status, answers, views and the web URL (iOS untested) | differs: native share sheet
- [x] SOLVED means has a best answer, only is_locked blocks new answers | parity

## Answers
Where: src/features/answers
- [x] Answer composer (locked and guest states), edit and delete own, vote and remove vote (not on own), mark best (question author) | parity
- [x] Vote switching keeps the UI equal to the confirmed server state | parity
- [x] Byline above the body with platform badge | parity
- [x] Report and escalate (hub staff) | parity

## Comments
Where: src/features/comments
- [x] Comments sheet: list, add, View more, stale-response guard, count stays in sync (iOS untested) | parity
- [x] Own comments: Edit and Delete. Others: Report, hub staff also Escalate (iOS untested) | parity
- [x] Platform badge on comment authors | parity

## Tags
Where: src/screens/TagsScreen.tsx, TagQuestionsScreen.tsx
- [x] Tag browse with search, Popular or A to Z order and View more, questions by tag with status filter | parity

## Search
Where: src/screens/SearchScreen.tsx, src/features/tags/TagFilter.tsx
- [x] 500 ms debounce with a Searching state, ranked results, count line, View more | parity
- [x] Tag filter: selected tag chip, popular chips, searchable More tags sheet | parity
- [~] Rows lack answer count and department (the search endpoint omits them) | differs: contract limit

## Notifications
Where: src/screens/NotificationsScreen.tsx, src/auth/UnreadProvider.tsx
- [x] All and Unread filters, mark read on tap, mark all read, unread badge on the Alerts tab, refetch when the tab regains focus | parity
- [x] link_target deep links, rows without a link stay plain, all 12 types have an icon | parity
- [x] Admin-only types open the web app through the staff handoff | differs

## Profile
Where: src/screens/ProfileScreen.tsx, src/features/profile
- [x] Avatar, name, email, role badge, four stats | parity
- [x] Tabs (Activity, Questions, Answers, Comments), each paged with View more | parity
- [x] Edit name: trimmed, blank blocked, backend field error shown | parity
- [x] My reports, Policies and guides, dark mode, log out | parity

## Reports
Where: src/features/reports, src/screens/MyReportsScreen.tsx
- [x] Report a question, answer or comment, hidden for your own content, one shared ReportForm | parity
- [x] Escalate for hub staff (create then escalate, "already reported" copy) | parity
- [x] My reports: status filters, private, Content removed state, no reviewer or escalation data | parity

## Moderation and Admin
- [ ] Not on mobile | differs: lock, escalate and report in context, "Open on web" handoffs to the system browser, no tokens in the URL

## Static pages
Where: src/screens/PagesScreen.tsx, PageScreen.tsx
- [x] Pages list with Staff and Draft badges and pull to refresh, Markdown page view with headings | parity

## Sharing and links
- [x] Question share link, see Question page | differs: native share sheet
- [ ] No OG or SEO equivalents needed | differs

## Content rendering
Where: src/components/Markdown.tsx, MarkdownEditor.tsx, src/lib/markdownEdit.ts
- [x] Editor: 44pt scrollable toolbar, toggle formatting off, list continuation, link wrapping, maxHeight, docked toolbar in the composer, preview uses the display renderer (iOS untested) | parity
- [x] Renderer: nested and ordered lists, merged quotes, autolinks, escapes, images dropped, unsafe links plain, headings only on pages | parity
- [x] Platform account badge from EXPO_PUBLIC_PLATFORM_ACCOUNT_ID on question, best pin, answers, comments | parity
- [ ] Badge on QuestionRow, notifications, profile (no author shown there) | gap: not needed until authors appear
- [ ] Mailto links stay plain text | differs: accepted
- [ ] Editor extras the web also defers: grouped undo, paste-to-link, nested indent, auto-closing markers | gap (both)

## Design system and accessibility
Where: src/theme, src/components
- [x] Tokens match design-guide (bg, ink, line, strong, muted, surface, accent, success, danger), Plus Jakarta Sans, no legacy aliases | parity
- [~] Dynamic type capped at 1.4, errors announced as alerts, TalkBack and large font pass on Android | gap: VoiceOver untested
- [x] Touch targets at least 44pt, accessibility labels on icon buttons | parity

## Engineering
- [x] npm run typecheck, npx expo-doctor, npm run export:web, pre-flight before every EAS build
- [x] endpoints.ts carries only user-client methods
- [x] EAS Update (channels preview and production, runtimeVersion by appVersion), mobile typecheck runs on every pull request

## Known gaps
- 

## Differs from web (by design)
- User client only: no moderation or admin screens, staff open the web app in the system browser, no tokens in the URL
- Tokens in secure storage, direct API calls, single-flight refresh, no Next.js proxy
- Native Google account picker instead of Google Identity Services
- Bottom tabs plus drawer, bottom sheets instead of modals and dropdowns, filters as chips and a sheet
- Comment actions, report and escalate forms live inside one sheet, no stacked modals
- Platform badge explanation opens in a sheet (inline inside the comments sheet) instead of a popover
- Search rows show only the fields the search endpoint returns
- No windowed lists and no hub-offline banner (also open on the web)
- Offline content cache and push notifications are not built (future)

## Pre-launch (mobile)

Moved to DEPLOYMENT_CHECKLIST.md.