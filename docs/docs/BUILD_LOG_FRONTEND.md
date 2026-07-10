## Current Phase
Frontend Phase 8, Voting (in progress).

## Completed Phases (Frontend)
- Frontend Phase 0: Next.js App Router scaffolded, Tailwind v4 CSS-first config (no
  tailwind.config.js, @custom-variant for class-based dark mode), theme toggle with
  localStorage persistence, base layout, health-check smoke test against the backend.
- Frontend Phase 1: Google Identity Services login flow wired end to end. JWT pair
  never reaches browser-readable code, Next.js Route Handlers proxy every backend
  call and store tokens as httpOnly cookies. Catch-all proxy at
  app/api/backend/[...path]/route.js handles the full token lifecycle: attach access
  token, on 401 attempt exactly one refresh, on refresh success rotate both cookies
  and retry the original request, on refresh failure clear both cookies and return
  401 so the client immediately reflects logged-out state via a custom
  "auth:expired" browser event. AuthProvider/useAuth context wraps the app.
  Temporary /profile page proves the protected-route pattern before a real profile
  page is built later.
- Frontend Phase 2: School directory (/schools) and school profile
  (/schools/[id]) pages. Introduced the reusable interactive primitives every
  later list/search page will reuse: useDebouncedValue (500ms), Skeleton, pill
  SearchBar with an inline spinner during the debounce window, and a
  load-more-append pagination pattern where a failed "View more" click shows an
  inline error without discarding already-loaded rows. School profile page is a
  Server Component (no interactivity needed), uses Next's notFound()/not-found.js
  for a missing school and error.js as the route-segment error boundary for a
  down backend. RequestHubCTA is a deliberate disabled stub, the real activation
  flow is built in Phase 4.
- Frontend Phase 3: Department management page (/schools/[id]/departments),
  scoped to School Representatives and admins using GET /users/me/'s
  representative_for/is_admin fields per api-contract.md's Frontend Permission
  Model. "Manage departments" link on the school profile page matches
  representative_for[].school.id directly. Page still shows the form to any
  logged-in user, with an inline warning banner for non-permitted users, since
  the backend's 403 remains the actual enforcement, the frontend check is
  UX-only. Create/edit/deactivate/reactivate all wired against the existing
  department endpoints.
- Frontend Phase 4: Real hub activation request flow (RequestHubModal) replacing
  the Phase 2 disabled stub, handles both documented 400 cases (already has a
  hub, already pending) inline. Hub home page (/hubs/[id]) with header
  (question/moderator counts), a thin /hubs/by-school/[schoolId] redirect route
  since School doesn't carry its Hub's UUID directly, notFound()/error.js on
  both hub routes matching the school pattern.
- Frontend Phase 5: Question list wired into the hub page (search, status filter,
  department filter, ordering), ask-question form, question detail with
  author-only edit/delete. Extracted a generic FilterSidebar/FilterSection shell
  now that a second filter shape (radio + select, not just checkboxes) confirmed
  what's actually reusable. clientFetch now parses DRF's field-keyed 400 errors
  (e.g. {"title": [...]}), not just the {"error": "..."} shape, every existing
  form benefits automatically. useSearchParams() on the ask-question page
  required a Suspense boundary per Next.js App Router requirements.
  Follow-up same phase: reworked ask-question flow to be hub-optional at entry,
  a new SchoolPicker (search, has_hub=true only) lets a user start from
  "/questions/new" with no hub context and resolves to a hub via
  GET /hubs/by-school/{id}/ on selection, preserving in-progress title/body if
  they change schools. Built TagInput (search-as-you-type against GET /tags/,
  popular tags shown on empty query, free-text fallback creates a new tag
  client-side same as the backend's existing create-on-write behavior) shared
  between ask and edit question forms.
- Frontend Phase 6: Tag browse page (/tags, search + popular/alphabetical toggle,
  not paginated per the backend contract) and questions-by-tag page
  (/tags/[name], status filter, paginated, no not-found.js since a tag with zero
  matches is a valid 200 empty state per api-contract.md, not a 404).
  QuestionListRow gained an optional showSchool prop since tag results can span
  multiple schools/hubs, unlike every hub-scoped list built so far. Question
  detail page's tag chips are now links into this new browse page.
- Frontend Phase 7: Question detail page now renders real answers instead of a
  placeholder, using the answers array already nested in GET /questions/{id}/.
  AnswerForm blocks submission client-side on SOLVED questions and for logged-out
  users, matching backend rules. AnswerCard supports author-only inline edit and
  delete with confirm. router.refresh() called after answer create/delete (not
  edit) since those two actions can move the parent question's status per the
  documented lifecycle rules (OPEN->ANSWERED, ANSWERED/SOLVED->OPEN on last
  answer removed), this re-runs the Server Component so the status icon at the
  page top stays accurate without duplicating that transition logic client-side.
  is_best renders as a static badge, the actual mark-best action is Phase 10.

## Planned, Not Yet Scheduled
- Homepage rebuild: unfiltered paginated list of all questions (hub, tags, and
  other metadata shown per row), load-more pagination, tags and schools shown
  as side cards, as part of the broader UI polish pass once the full page set
  exists to draw real content from.

## Known Deviations From Docs (Frontend)
- Concurrent-request refresh race not yet mitigated: if multiple requests expire
  at the same moment, more than one may attempt to use the same refresh token
  before rotation completes, one could be rejected. Unlikely at MVP traffic
  levels, flagged for a request-deduplication fix if it becomes a real problem.