## Current Phase
Frontend MVP (Phases 0–15) complete and confirmed. Docs synced, see
changelog.md's Frontend Docs Sync entry. Known Deviations below is now down
to the one genuinely unresolved item pending your confirmation, plus a couple
of low-priority, frontend-only implementation notes kept for visibility.

## Completed Phases (Frontend)
- Frontend Phase 0: Next.js App Router scaffolded, Tailwind v4 CSS-first
  config (no tailwind.config.js, @custom-variant for class-based dark mode),
  theme toggle with localStorage persistence, base layout, health-check
  smoke test against the backend.
- Frontend Phase 1: Google Identity Services login flow wired end to end.
  JWT pair never reaches browser-readable code, Next.js Route Handlers proxy
  every backend call and store tokens as httpOnly cookies. Catch-all proxy
  at app/api/backend/[...path]/route.js handles the full token lifecycle:
  attach access token, on 401 attempt exactly one refresh, on refresh
  success rotate both cookies and retry the original request, on refresh
  failure clear both cookies and return 401 so the client immediately
  reflects logged-out state via a custom "auth:expired" browser event.
  AuthProvider/useAuth context wraps the app.
- Frontend Phase 2: School directory (/schools) and school profile
  (/schools/[id]) pages. useDebouncedValue (500ms), Skeleton, pill
  SearchBar with inline spinner, load-more-append pagination pattern
  established here and reused throughout. notFound()/not-found.js and
  error.js patterns established here and reused throughout.
- Frontend Phase 3: Department management page (/schools/[id]/departments),
  scoped to School Representatives and admins using GET /users/me/'s
  representative_for/is_admin fields per api-contract.md's Frontend
  Permission Model.
- Frontend Phase 4: Hub activation request flow (RequestHubModal), handles
  both documented 400 cases (already has a hub, already pending) inline.
  Hub home page (/hubs/[id]), /hubs/by-school/[schoolId] redirect route.
- Frontend Phase 5: Question list wired into the hub page (search, status
  filter, department filter, ordering), ask-question form, question detail
  with author-only edit/delete. Generic FilterSidebar/FilterSection shell.
  clientFetch parses DRF's field-keyed 400 errors. Ask-question flow
  reworked to be hub-optional at entry (SchoolPicker), TagInput built
  (search-as-you-type, popular tags on empty query, free-text fallback
  creates a new tag).
- Frontend Phase 6: Tag browse page (/tags) and questions-by-tag page
  (/tags/[name]), paginated, no not-found.js since zero matches is a valid
  200 empty state. QuestionListRow gained showSchool for cross-school
  results.
- Frontend Phase 7: Question detail renders real answers from the answers
  array nested in GET /questions/{id}/. AnswerCard supports author-only
  inline edit/delete. router.refresh() after answer create/delete keeps the
  question's status icon in sync with backend-driven transitions.
- Frontend Phase 8: Voting wired on AnswerCard, later simplified to read
  user_vote directly once the backend added it (see Cross-Cutting Fixes).
- Frontend Phase 9: Comments (CommentThread, CommentRow), lazy-loaded per
  answer on first expand. Author-only inline edit/delete. Comment visual
  hierarchy iterated with feedback: comment body is the visual focus
  (text-xs), author name and controls sit at text-[11px] below it.
- Frontend Phase 10: Mark-best-answer on AnswerCard, question-owner-only,
  hidden on whichever answer is currently best. Optimistic is_best flip
  across the answers array plus router.refresh() for the SOLVED transition.
- Frontend Phase 11: Notification bell (top bar) and full /notifications
  page. unread_count badge, mark-read on click-through, mark-all-read.
- Frontend Phase 12: Global search page (/search), q optional (null-query
  results still rank correctly per the documented priority order), tag
  filter via a single-select picker. School/hub/department ID filtering
  deliberately not exposed in this pass, no existing picker UI fit that
  combination well without guessing at a redesign.
- Frontend Phase 13/14 (combined): ReportButton usable from questions,
  answers, and comments, hidden for the content's own author. Later split
  into two pages: /moderation (Moderators/Representatives, scoped to their
  own hubs) and /admin (Reports, cross-hub team assignment, global
  unanswered queue), see Cross-Cutting Fixes.
- Frontend Phase 15: /admin fully built out: SchoolsManager (search,
  create/edit via a shared modal, deactivate/reactivate), ActivationRequests
  Queue (status-tabbed, approve/reject with optional reason), UsersManager
  (search, active/suspended filter, suspend/reactivate, self-suspension
  disabled client-side matching the backend's own safeguard). HubTeamManager
  gained a Departments tab (reusing Phase 3's DepartmentForm/DepartmentRow),
  available to reps on /moderation and to admins via AdminHubPicker on
  /admin, closing the gap where reps could manage departments per the docs
  but had no direct path to it from their own management surface.

## UI Polish Pass (Post-MVP, Frontend)

Not a numbered phase. A full visual pass following user feedback, deliberately
scoped as "touch up the existing interface" rather than a redesign, after a
full alternative mockup (different layout, card-heavy, pill-shaped
everything) was reviewed and explicitly rejected in favor of the current
structure with more personality.

- Typography: switched to Plus Jakarta Sans app-wide via next/font/google
  (self-hosted, no runtime request), one family, hierarchy via weight only.
- Color: introduced a warm "milk" light background and matching warm dark
  background, ink-blue (#3454D1) as the single accent. One iteration
  overshot this by also re-tinting Tailwind's entire default gray scale,
  which bled a muddy brown tone into every neutral surface app-wide
  (sidebar text, popovers, skeletons, borders). Reverted, Tailwind's
  default gray scale is intentionally left untouched, only --color-bg,
  --color-text, --color-border, --color-accent, and the red scale (for
  destructive states) are overridden.
- Status colors: SOLVED given its own distinct success color instead of
  reusing the accent; ANSWERED corrected from a leftover unrelated
  stock blue to the actual accent, so it's visually consistent with every
  other accent-colored affordance in the app.
- Skeleton loaders: flat pulse replaced with a real shimmer sweep
  (.skeleton-shimmer), Skeleton.js is the only component touched, every
  loading state across the app inherited it automatically.
- Homepage hero: rebuilt as a full-bleed background panel (image URL is a
  one-line swap once real artwork exists, currently an accent-tinted
  placeholder plus a legibility scrim), replacing the earlier two-slot
  illustration placeholder concept. Required a non-obvious full-bleed CSS
  fix: the straightforward calc(50% - 50vw) margin trick only produces a
  correct result when the parent has no max-width of its own; AppShell's
  centered, capped <main> broke that assumption and introduced a real
  horizontal scrollbar on wide viewports. Replaced with a margin-left:50%
  + transform:translateX(-50%) approach, which is correct regardless of
  parent constraints.
- Motion: CSS-only throughout, no new dependency. Global button press
  feedback and consistent focus-visible rings added via plain element
  selectors in globals.css, no per-component classes needed. Opt-in
  .stagger-list class added to every question/answer/comment list
  container for a staggered fade-up on load; new rows appended via "View
  more" animate in on their own since React only mounts the new elements.
- Shape language: swept every rounded-full usage except the two genuine
  pill-shaped search bars and two legitimate circular elements (profile
  avatar, notification unread-count badge) down to a standard rounded
  radius, matching the rest of the app's buttons.
- Question following and locking wired into the frontend for the first
  time (FollowButton, LockToggle), previously backend-complete but
  unbuilt. LockToggle shipped with a real bug: the success path never
  reset local loading state back to idle, only the catch block did, so
  after a successful lock/unlock the button appeared permanently frozen
  in a loading state until a full page reload remounted the component.
  router.refresh() only updates props from the server, it never resets a
  Client Component's own local state, that reset has to happen explicitly
  alongside the refresh call. Fixed.
- School and Hub pages merged into one, /schools/[id] now shows the full
  hero (location, website, verification, question/moderator counts),
  Ask a question action, and the complete filterable question list.
  /hubs/[id] and /hubs/by-school/[schoolId] both reduced to thin redirects
  into the merged page, kept as real routes since existing bookmarks and
  email links point at them.

## Cross-Cutting Fixes (Post-MVP, Frontend)
- Cookie-Forwarding Fix: apiFetch (every Server Component page) was calling
  the internal /api/backend proxy without forwarding the incoming request's
  cookies, since a server-side fetch() never inherits the browser's cookie
  jar automatically, making every SSR data request silently anonymous.
  Fixed by reading cookies() and forwarding a Cookie header explicitly.
  Residual limitation: a token refresh mid-SSR-render can't propagate the
  new cookie back to the browser, since Server Components can't call
  cookies().set(). Self-heals on the next client-side interaction via
  clientFetch.
- Vote State Visibility Fix: backend added user_vote ("UP"/"DOWN"/null) to
  the Answer serializer everywhere an answer object appears. AnswerCard
  simplified to read it directly instead of session-only tracking.
- SOLVED Status Semantics Fix: backend decoupled "has a designated best
  answer" from "closed to further input." AnswerForm's SOLVED-block
  removed, answers can be submitted to a question at any status.
- Question URL slugs: question detail route restructured to an optional
  catch-all, app/questions/[id]/[[...slug]]/page.js, so URLs render as
  /questions/{id}/{slug} (matching outbound email links) while the slug
  segment itself is never read for lookup. lib/urls.js's questionUrl()
  builds this consistently, and falls back to a client-generated slug
  (lib/slugify.js) when an API response doesn't include one (e.g. search
  results), since the slug is cosmetic either way.
- Nav rebuild: original single-row Header caused horizontal viewport
  overflow on narrow screens (a flex child's default min-width: auto
  prevented shrinking). Replaced with AppShell (TopBar + collapsible
  Sidebar overlay + Footer). Sidebar is a toggle-only overlay at every
  screen width, not a persistent desktop column, per explicit direction.
  Sidebar/TopBar read the same --color-bg/--color-border CSS variables as
  the page body (not Tailwind's gray-900) so chrome and page background are
  always identical by construction. Popover surfaces (ProfileMenu,
  notification dropdown) deliberately keep bg-white/dark:bg-gray-800,
  meant to read as elevated above the page, not blended into it. Theme
  toggle lives at the bottom of the sidebar.
- NaN relative-time fix: timeAgo() now guards against a missing/invalid
  date and returns null rather than NaN; QuestionListRow falls back to
  created_at when updated_at is absent (e.g. search results) and only
  renders the timestamp when one is actually available. Same missing-field
  pattern also affected answer_count on search results, QuestionListRow now
  only renders that segment when the field is present as a number.
- Search Users picker: GET /users/search/ (admin or active School
  Representative) now drives a real search-and-pick UI (UserSearchPicker)
  for assigning moderators/representatives, replacing an earlier raw-UUID
  input workaround.
- Profile page rebuilt: editable name (PATCH /users/me/), stat cards from
  GET /users/me/'s stats, a merged "recent activity" feed (client-side
  merge of the first page of GET /questions/?author=, GET
  /users/me/answers/, and GET /users/me/comments/, sorted by date), full
  paginated tabs per content type. Deliberately excludes reports entirely,
  per api-contract.md's explicit design that reporter activity is never
  surfaced on any profile. ProfileMenu gained a "Your profile" link above
  "Log out."
- Backend fix (applied, not a frontend change): POST /reports/{id}/resolve/
  with DELETE_CONTENT was 500ing, GenericForeignKey's cached content_object
  went stale (pk set to None) after .delete(), and Django's save-time check
  refused to save the parent Report with a stale cached relation. Fixed
  with report.refresh_from_db() after deleting the content, before setting
  the resolution fields.
- Backend fix (applied, not a frontend change): GET /users/me/comments/ was
  500ing (KeyError on a nonexistent "user_id" kwarg that doesn't exist on
  that URL) and had AllowAny permissions contradicting its own documented
  "requires authentication, scoped to the requesting user" behavior. Fixed
  to use IsAuthenticated and filter by request.user.id directly.
- Backend fix (applied, not a frontend change): deactivated schools and
  departments disappeared from every view, including the admin/rep view
  meant to manage and reactivate them, since SchoolListCreateView,
  SchoolDetailView, and DepartmentListCreateView all unconditionally
  filtered to is_active=True regardless of requester, despite
  api-contract.md already documenting admin/rep visibility into inactive
  records correctly. Fixed by branching the queryset on admin/rep status;
  school admin detail/patch now always includes inactive records so
  reactivation is possible through the API at all (previously required a
  Django admin round-trip). List-view public caching bypassed entirely for
  admin requests to avoid cache cross-contamination between privileged and
  public responses.
- Moderation/Admin split: /moderation (Moderators and Representatives,
  scoped to their own hubs) and /admin (Reports, cross-hub team assignment,
  schools, activation requests, users) fully separated by audience.
  HubTeamManager's hub cards gained a Departments tab (reusing Phase 3's
  components) and an always-visible Unanswered Questions tab: reps who
  aren't also moderators for a hub see a message explaining they can
  self-assign as moderator via the Moderators tab to unlock it, rather than
  the tab disappearing and hiding that workflow entirely.
- Best answer highlight: the question detail page now pins a compact,
  read-only preview of the current best answer directly under the question
  body, with a "View in list" control that smooth-scrolls to and briefly
  highlights the corresponding full AnswerCard further down. Deliberately
  not a second interactive instance (no independent vote buttons or
  comment thread in the preview), to avoid two UI copies of the same
  answer drifting out of sync with each other; voting and commenting stay
  owned by the one real AnswerCard in the list. Updates automatically when
  a different answer is marked best, since it's derived from the same
  answers state AnswersSection already tracks.

## Known Deviations From Docs (Frontend)
- api-contract.md's Search Users section documents "Admin or School
  Representative" access; a message during development described the
  intended permission as including Moderators instead. Still unconfirmed.
- Notifications and Reports targeting "answer" or "comment" content have no
  standalone detail page to deep-link to; both render the content as
  non-clickable plain text instead of a broken link.
- Concurrent-request refresh race not yet mitigated: if multiple requests
  expire at the same moment, more than one may attempt to use the same
  refresh token before rotation completes, one could be rejected. Unlikely
  at MVP traffic levels.
- The HTML-entity arrow sweep (&larr; etc. to lucide icons) is incomplete,
  only the question detail page's back link was converted incidentally
  during the follow/lock work. At minimum the departments page and tags
  page back-links still use literal arrow characters.

## Planned, Not Yet Scheduled (UI/UX Polish Phase)
- Homepage rebuild: unfiltered paginated question list with hub/tag
  metadata, load-more pagination, and tags/schools side cards.
- Friendly, user-facing error copy to replace raw backend/network error
  text throughout the app.
- School profile and hub pages merged into one page (single hero + question
  list), since the relationship is strictly one-to-one and currently splits
  minimal info across two pages for no strong reason.
- School Representatives currently have no visibility into reports for their
  own school's content, Reports is admin-only per api-contract.md. Worth
  considering: rep-scoped report access limited to their own hub's content,
  would need both a backend permission/query change and a frontend surface.
- Question following: backend complete and documented (Follow/Unfollow
  Question, is_following field), not yet wired into the frontend. Needs a
  follow/unfollow control on the question detail page.
- Question lock: backend complete and documented (Lock/Unlock Question,
  is_locked field), not yet wired into the frontend. Needs a lock/unlock
  control visible to admins, reps, and moderators, and an is_locked-aware
  state on the answer form (a locked question should read similarly to how
  SOLVED once did, before that was decoupled, this time as a genuine,
  deliberate block).
- Replace remaining HTML entity arrows (&larr; etc.) across the app with
  proper icon components (lucide-react), for visual consistency with every
  other directional/status affordance already built as an icon.
- School Representative visibility into reports for their own school's
  content, Reports is admin-only per api-contract.md today.
- Standalone answer/comment permalink page for notification/report deep-links.
- Full favicon/OG-image/web-manifest asset pass, deferred until the
  project's final name and logomark are decided, base technical SEO
  (metadata, sitemap.js, robots.js) shipped ahead of that.
