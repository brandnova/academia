# Frontend Map

A file-by-file mental model of `academia-frontend/`, for anyone (or any chat) picking up
frontend work. It answers "where does it live". For "what can it do" read the Frontend
Capabilities section of [feature-list.md](feature-list.md), for the API read
[api-contract.md](api-contract.md), for visual rules read [design-guide.md](design-guide.md),
and for history and decisions read [BUILD_LOG_FRONTEND.md](BUILD_LOG_FRONTEND.md).

---

## 1. Stack and tooling

- Next.js 16 App Router (Turbopack), React 19, JavaScript (no TypeScript), Tailwind v4
  (CSS-first, no tailwind.config.js), lucide-react 1.23 icons, marked plus sanitize-html
  for Markdown, Plus Jakarta Sans through next/font (self-hosted). No third-party component
  library.
- Deployed on Vercel. The browser never talks to Django directly.

| Script | What it does |
|---|---|
| `npm run dev`, `build`, `start` | Standard Next.js scripts |
| `npm run lint` | ESLint (two rules are off on purpose, see eslint.config.mjs) |
| `npm run check:structure` | `scripts/check-structure.mjs`: no route files outside app/, no component files inside app/, every lucide icon name must exist |
| `npm run check` | lint plus structure check. Run `npm run check && npm run build` before every PR |
| `scripts/codemod-primitives.mjs` | One-off migration to ErrorMessage and the form controls. Dry run by default, `--write` applies. Safe to re-run |

## 2. Environment variables

| Name | Where | Consumers | Purpose |
|---|---|---|---|
| `BACKEND_API_URL` | server only | app/api/backend routes | Backend `/api/v1` base, no trailing slash |
| `NEXT_PUBLIC_SITE_URL` | build and server | lib/api.js, metadata, sitemap, robots, OG | Public origin, also used for server calls to the app's own proxy |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | browser | GoogleLoginButton | Google Identity Services client id |
| `NEXT_PUBLIC_PLATFORM_ACCOUNT_ID` | browser | lib/platformAccount.js | Comma-separated user ids that get the platform badge (optional) |

`NEXT_PUBLIC_*` values are baked in at build time, so changing one needs a redeploy.

## 3. Architecture and data flow

```text
Browser -> Next route handler /api/backend/[...path] -> Django /api/v1/...
```

- **Tokens** live only in httpOnly cookies, never in browser-readable code. The route
  handler attaches `Authorization`, retries once after a refresh and rotates the cookies.
- **Refresh**: `lib/refreshSession.js` keeps one in-flight refresh per refresh token and
  remembers the result for 10 seconds, so concurrent 401s share one refresh. Cookies are
  cleared only on a definitive 400 or 401 from the refresh endpoint, never on 429, 5xx or a
  network failure. Backend unreachable returns 503 `{ "error": ... }`.
- **Client components** call `clientFetch` (lib/clientApi.js). It throws an Error carrying
  `status`, `fields` (the raw DRF body) and friendly copy for network failure, 429 and
  gateway errors.
- **Server components** call `apiFetch` (lib/api.js), which forwards the request cookies to
  the app's own proxy through `NEXT_PUBLIC_SITE_URL`.
- **Events**: a 401 anywhere dispatches `auth:expired` and AuthProvider logs the UI out.
  `lib/locationEvents.js` patches `history.pushState` and `replaceState` to emit
  `app:locationchange`, because a Next `<Link>` that only changes the hash fires neither
  `hashchange` nor `popstate`.
- **Known limits**: a race between two serverless instances can cause a stray logout, and a
  token refresh during a server render cannot reach the browser until its next request.

## 4. Routes (`app/`)

| Route | File | Rendering | Data and notes |
|---|---|---|---|
| `/` | `page.js` | Server | `/schools/?has_hub=true&page_size=5`, `/tags/?popular=true`. HeroSearchBar, RecentQuestionsList, side cards, WebSite JSON-LD. `opengraph-image.js` beside it is the site-wide fallback |
| `/schools` | `schools/page.js` | Client | `/schools/` with search, has_hub, institution_type, ownership, state, page |
| `/schools/[id]/[[...slug]]` | `schools/[id]/[[...slug]]/page.js` | Server | `/schools/{id}/`, `/hubs/by-school/{id}/`. generateMetadata, canonical, BreadcrumbList. `error.js`, `not-found.js`, `opengraph-image.js` sit in `schools/[id]/` |
| `/schools/[id]/departments` | `schools/[id]/departments/page.js` | Client | `/schools/{id}/`, `/schools/{id}/departments/`. Representatives and admins |
| `/hubs/[id]` | `hubs/[id]/page.js` | Server redirect | `/hubs/{id}/`, permanent redirect to the school page. Has `error.js`, `not-found.js` |
| `/hubs/by-school/[schoolId]` | `hubs/by-school/[schoolId]/page.js` | Server redirect | Permanent redirect to the school page |
| `/questions/new` | `questions/new/page.js` | Client | `/hubs/{id}/`, `/hubs/by-school/{id}/`, POST `/questions/`. Wrapped in Suspense for `?hub=` |
| `/questions/[id]/edit` | `questions/[id]/edit/page.js` | Client | `/questions/{id}/` GET and PATCH, `/hubs/{hub}/` for departments |
| `/questions/[id]/[[...slug]]` | `questions/[id]/[[...slug]]/page.js` | Server | `/questions/{id}/`. generateMetadata, BreadcrumbList. `error.js`, `not-found.js`, `opengraph-image.js` sit in `questions/[id]/` |
| `/tags` | `tags/page.js` | Server wrapper | TagsBrowseClient |
| `/tags/[name]` | `tags/[name]/page.js` | Server wrapper | generateMetadata, TagQuestionsClient. `opengraph-image.js` uses `/tags/?search=` |
| `/search` | `search/page.js` | Server wrapper | generateMetadata (noindex when `?q=`), SearchResultsClient |
| `/notifications` | `notifications/page.js` | Client | `/notifications/`, `mark-read`, `mark-all-read`. Private |
| `/profile` | `profile/page.js` | Client | `/users/me/` GET and PATCH, tabs. Private |
| `/my-reports` | `my-reports/page.js` | Server wrapper | noindex metadata, MyReportsClient. Private |
| `/moderation` | `moderation/page.js` | Client | StaffGuides, one HubTeamManager per hub the user helps manage. Staff only |
| `/admin` | `admin/page.js` | Client | ReportsDashboard, SchoolsManager, ActivationRequestsQueue, UsersManager, TagsManager, PagesManager, AdminHubPicker. Admin only |
| `/pages/[slug]` | `pages/[slug]/page.js` | Server | `/pages/{slug}/`. Markdown. `error.js`, `not-found.js` |
| `/api/backend/[...path]` | `api/backend/[...path]/route.js` | Route handler | The proxy described above |
| `/api/backend/auth/google` | `api/backend/auth/google/route.js` | Route handler | POST. Exchanges the Google token and sets the cookies |
| `/api/backend/auth/logout` | `api/backend/auth/logout/route.js` | Route handler | POST. Blacklists the refresh token (best effort), clears cookies |
| `robots.js`, `sitemap.js` | `app/` | Server | robots disallows `/my-reports`, `/admin`, `/moderation`, private areas. sitemap walks schools, tags and questions with one `fetchAll` helper and keeps partial results |
| `layout.js` | `app/layout.js` | Server | Root layout, fonts, global providers, AppShell |

Rule: special files like `opengraph-image.js` must sit at the leaf segment, never after an
optional catch-all.

## 5. `lib/`

| File | Exports | Purpose |
|---|---|---|
| `api.js` | `apiFetch(path, options)` | Server-side fetch, forwards cookies through the app's own proxy |
| `clientApi.js` | `clientFetch(path, options)`, `FRIENDLY_MESSAGES` | Client fetch with typed errors and friendly copy |
| `auth-context.js` | `AuthProvider`, `useAuth()` | `{ user, loading, refreshUser, logout }`. Listens for `auth:expired` |
| `cookies.js` | `setAuthCookies(response, access, refresh)`, `clearAuthCookies(response)` | httpOnly cookie handling for route handlers |
| `jwt.js` | `decodeJwtExp(token)` | Reads `exp` without Buffer (edge safe) |
| `refreshSession.js` | `refreshSession(refreshToken)` | Shared in-flight refresh with a 10 second grace window |
| `urls.js` | `questionUrl(q)`, `schoolUrl(s)` | UUID plus cosmetic slug URLs, with a client fallback slug |
| `slugify.js` | `slugify(text)` | Fallback slug when a response omits one |
| `linkTarget.js` | `linkTargetUrl(linkTarget)` | `link_target` to a question URL plus `#answer-{id}` |
| `notificationUrl.js` | `notificationTargetUrl(n)` | Prefers `link_target`, falls back to older per-type handling |
| `flash.js` | `flashElement(el, duration)`, `scrollAndFlash(el)` | Accent ring flash, honors reduced motion |
| `locationEvents.js` | (side effect) | Emits `app:locationchange` |
| `formErrors.js` | `fieldErrorsFrom(err, fieldMap)` | DRF 400 body to per-field messages plus a general message |
| `markdown.js` | `renderMarkdown(text, { allowHeadings })`, `stripMarkdown(text)` | marked plus sanitize-html, and plain text for previews |
| `og.js` | `loadOgFonts`, `truncateText`, `OgCard` | Open Graph image layout (inline styles only) |
| `platformAccount.js` | `isPlatformAccount(authorId)` | Platform badge check |
| `reportLabels.js`, `schoolLabels.js` | label maps and option lists | Enum to label |
| `timeAgo.js` | `timeAgo(dateStr)` | Relative time, null for a missing or invalid date |
| `useDebouncedValue.js` | `useDebouncedValue(value, delay = 500)` | Debounce hook |

## 6. `components/`

Props are listed as they exist in code. "Calls" lists the API endpoints a component uses.

### ui/ (shared primitives)

| File | Props | Notes |
|---|---|---|
| `Dropdown.js` | `trigger`, `children`, `panelClassName` | Popover shell, Escape closes. Render-prop trigger and children |
| `ActionsMenu.js` | `items`, `align="right"`, `triggerLabel` | Kebab menu. Items are `{ label, icon, onClick, danger?, accent? }` |
| `ErrorMessage.js` | `children`, `size` (2xs, xs, sm), `tone` (error, warning), `className`, `id` | `role="alert"`, renders nothing when empty |
| `EmptyState.js` | `icon`, `title`, `description`, `action`, `variant` (box, inline) | Used by every list |
| `FormControls.js` | `Input`, `Select`, `Textarea` (`size` xs to lg, `fullWidth`, `invalid`, `className`), `FormField` (`label`, `hint`, `error`, `className`, `children`) | FormField children is a function receiving `{ id, aria-describedby, invalid }` |
| `IconLabel.js` | `icon`, `size` (xs, sm, md), `as`, `className`, `children` | One icon plus label, owns icon and text size together |
| `Tabs.js` | `tabs`, `value`, `onChange`, `idBase`, `ariaLabel`, `className` | Accessible tablist, arrow keys, scrolls instead of wrapping |
| `SearchBar.js` | `value`, `onChange`, `placeholder`, `loading` | Pill search input with inline spinner |
| `Skeleton.js` | `className` | Shimmer placeholder |
| `FilterSidebar.js` | `FilterSidebar` (`children`, `onClear`, `hasActiveFilters`, `activeCount`), `FilterSection` (`title`, `children`) | Collapses on narrow screens, badge shows the active count |
| `MarkdownEditor.js` | `value`, `onChange`, `placeholder`, `rows`, `richMode`, `id`, `invalid`, `aria-describedby`, `aria-label` | Toolbar, shortcuts (B, I, K), list continuation, toggle off, preview. `richMode` adds headings and a word and character count |
| `MarkdownRenderer.js` | `content`, `className`, `allowHeadings` | Safe render of sanitized Markdown |
| `PlatformAuthorBadge.js` | `authorId` | The "A" mark, tap to explain, only for platform account ids |

### layout/

| File | Props | Notes |
|---|---|---|
| `AppShell.js` | `children` | TopBar, Sidebar, main, Footer, AskFab, NavigationProgressBar |
| `TopBar.js` | `onMenuClick` | Wordmark link, ThemeToggle, NotificationBell, ProfileMenu |
| `Sidebar.js` | `isOpen`, `onClose` | Overlay drawer at every width, Escape and backdrop close, inert when closed |
| `AskFab.js` | none | Floating Ask button below `sm`, signed in only, hidden on forms and staff tools |
| `ProfileMenu.js` | none | Dropdown with profile and My reports links, log out |
| `ThemeToggle.js` | none | Icon button, CSS-swapped icon so it never flashes wrong |
| `PagesDropdown.js` | `onNavigate` | Published static pages. Calls `/pages/` |
| `NavigationProgressBar.js`, `Footer.js` | none | Route progress bar, footer |

### Feature components

| Folder | Component (props) | Calls |
|---|---|---|
| auth | `GoogleLoginButton` | POST `/auth/google/` |
| home | `HeroSearchBar`, `RecentQuestionsList` | `/questions/?ordering=-created_at&page=` |
| schools | `SchoolListRow` (`school`), `SchoolMetaBadge` (`icon`, `label`), `RequestHubCTA` (`schoolId`, `schoolName`), `ManageDepartmentsLink` (`schoolId`) | none |
| hubs | `HubQuestionList` (`hubId`, `departments`), `RequestHubModal` (`schoolId`, `schoolName`, `onClose`, `onSuccess`) | `/questions/` with hub, status, department, ordering, search, page. POST `/hubs/activation-requests/` |
| departments | `DepartmentForm` (`schoolId`, `onCreated`), `DepartmentRow` (`department`, `onUpdated`) | POST `/schools/{id}/departments/`, PATCH `/departments/{id}/` |
| questions | `QuestionListRow` (`question`, `showSchool`), `StatusIcon` (`status`, `showLabel`), `QuestionActions` (`question`), `FollowButton` (`questionId`, `initialFollowing`), `LockToggle` (`question`), `SchoolPicker` (`onSelect`, `onlyWithHub`, `notice`, `busyId`), `TagInput` (`value`, `onChange`, `maxTags`) | DELETE `/questions/{id}/`, POST and DELETE `/questions/{id}/follow/`, POST and DELETE `/questions/{id}/lock/`, `/schools/`, `/tags/` |
| answers | `AnswersSection` (`question`), `AnswerCard` (`answer`, `questionId`, `hubId`, `canMarkBest`, `onMarkBest`, `onUpdated`, `onDeleted`, `highlightBest`), `AnswerForm` (`questionId`, `locked`, `onCreated`), `AnswerHashFlash`, `BestAnswerHighlight` (`answer`) | POST `/answers/`, PATCH and DELETE `/answers/{id}/`, POST and DELETE `/answers/{id}/vote/`, POST `/answers/{id}/mark-best/`, `/questions/{id}/` (refresh) |
| comments | `CommentThread` (`answerId`, `hubId`, `commentCount`, `onCountChange`), `CommentRow` (`comment`, `hubId`, `onUpdate`, `onDelete`) | `/answers/{id}/comments/`, POST `/comments/`, PATCH and DELETE `/comments/{id}/` |
| notifications | `NotificationBell`, `NotificationItem` (`notification`, `onRead`, `onNavigate`, `compact`) | `/notifications/` (page_size 1 for the badge, page_size 6 for the list), `mark-read`, `mark-all-read` |
| reports | `ReportButton` and `EscalateButton` (`contentType`, `contentId`, `open`, `onClose`), `canEscalate(user, hubId)`, `MyReportsClient` | POST `/reports/`, POST `/reports/{id}/escalate/`, `/reports/mine/` |
| search | `SearchResultsClient`, `SearchTagFilter` (`value`, `onChange`) | `/search/questions/`, `/tags/` |
| tags | `TagsBrowseClient`, `TagQuestionsClient` (`tagName`) | `/tags/`, `/tags/{name}/questions/` |
| profile | `ActivityFeed` (`userId`), `QuestionsTab` (`userId`), `AnswersTab`, `CommentsTab` | `/questions/?author=`, `/users/me/answers/`, `/users/me/comments/` |
| moderation | `HubTeamManager` (`hub`, `canManageModerators`, `canManageRepresentatives`, `canManageDepartments`, `isModerator`), `TeamMemberList` (`hubId`, `role`, `canManage`, `isAdmin`), `UserSearchPicker` (`onSelect`, `excludeIds`, `disabled`), `HubDepartmentsTab` (`schoolId`), `HubUnansweredTab` (`hubId`, `isModerator`), `UnansweredQueue` (`hubId`, `showSchool`), `ReportsDashboard`, `StaffGuides`, `AdminHubPicker` | `/hubs/{id}/{moderators or representatives}/` list, POST, DELETE, `/users/search/`, `/questions/unanswered/`, `/reports/` list, `resolve`, `reject`, `/pages/`, `/hubs/by-school/{id}/` |
| admin | `SchoolsManager`, `SchoolAdminRow` (`school`, `onUpdated`), `SchoolFormModal` (`school`, `onClose`, `onSaved`), `ActivationRequestsQueue`, `UsersManager`, `TagsManager`, `TagMergeControl` (`tag`, `onMerged`, `onCancel`), `PagesManager`, `PageFormModal` (`page`, `onClose`, `onSaved`), `HubStatusControl` (`hub`, `onChanged`) | `/schools/` GET, POST, PATCH, `/hubs/activation-requests/` list, `approve`, `reject`, `/admin/users/` GET and PATCH, `/tags/` list, `merge`, DELETE, `/pages/` GET, POST, PATCH, DELETE, PATCH `/hubs/{id}/` |

## 7. Endpoint index (endpoint to callers)

| Endpoint | Callers |
|---|---|
| `/auth/google/`, `/auth/logout/` | GoogleLoginButton, auth-context, the two auth route handlers |
| `/users/me/` | AuthProvider, profile page (PATCH name) |
| `/users/me/answers/`, `/users/me/comments/` | ActivityFeed, AnswersTab, CommentsTab |
| `/users/search/` | UserSearchPicker |
| `/questions/` | RecentQuestionsList, HubQuestionList, ActivityFeed, QuestionsTab, ask page (POST) |
| `/questions/{id}/` | question page (server), edit page, AnswerCard (refresh), QuestionActions (DELETE), OG image |
| `/questions/{id}/follow/`, `/lock/` | FollowButton, LockToggle |
| `/questions/unanswered/` | UnansweredQueue |
| `/answers/...`, `/comments/...` | AnswerForm, AnswerCard, AnswersSection, CommentThread |
| `/schools/` and `/schools/{id}/` | schools page, SchoolPicker, SchoolsManager, SchoolAdminRow, SchoolFormModal, school page, departments page, home page |
| `/schools/{id}/departments/`, `/departments/{id}/` | DepartmentForm, DepartmentRow, HubDepartmentsTab, departments page |
| `/hubs/{id}/`, `/hubs/by-school/{id}/` | ask and edit pages, school page, hub redirects, AdminHubPicker, HubStatusControl (PATCH) |
| `/hubs/activation-requests/...` | RequestHubModal, ActivationRequestsQueue |
| `/hubs/{id}/moderators/`, `/representatives/` | TeamMemberList |
| `/tags/...`, `/tags/{name}/questions/` | TagInput, SearchTagFilter, TagsBrowseClient, TagQuestionsClient, TagsManager, TagMergeControl, home page, OG image |
| `/search/questions/` | SearchResultsClient |
| `/notifications/...` | NotificationBell, notifications page |
| `/reports/...` | ReportButton, EscalateButton, MyReportsClient, ReportsDashboard |
| `/admin/users/...` | UsersManager |
| `/pages/...` | PagesDropdown, StaffGuides, PagesManager, PageFormModal, pages/[slug] |

## 8. Permissions on the client

- Roles come from `useAuth().user`: `is_admin`, `moderator_for[]`, `representative_for[]`
  (hub_id plus school). Hiding a control is UX only, the backend enforces everything.
- `canEscalate(user, hubId)` in `EscalateButton.js` is the one check for escalation. Lock,
  moderation tabs and department management derive from the same fields.
- `refreshUser()` must run after an admin changes a hub's status, because `/users/me/` lists
  only active hubs.

## 9. Conventions

- **Lists**: status `loading | ready | error`, first page in an effect with a cancel or
  request-id guard, "View more" appends (dedupe by id when order can shift), load-more errors
  shown under the button, empty state through EmptyState, count line "N things".
- **Forms**: FormField plus Input, Select or Textarea (label tied to control, inline error).
  Backend field errors through `fieldErrorsFrom`. No raw red paragraphs, use ErrorMessage.
- **Modals** (Report, Escalate, SchoolForm, PageForm, RequestHub) are controlled, `z-modal`,
  with no shared Modal primitive yet.
- **Tokens**: `--color-border` dividers, `--color-border-strong` controls, `text-muted` for
  all secondary text (never `text-gray-400` or `500`), `--color-accent` #3454D1. Stacking
  utilities: `z-dropdown` 20, `z-sticky` 30, `z-overlay` 40, `z-drawer` 50, `z-modal` 60,
  `z-toast` 70, `z-progress` 100. Never raw z numbers. See [design-guide.md](design-guide.md).
- **Client API**: always `clientFetch`, never `fetch` to the backend from the browser.

## 10. Behaviours that are easy to get wrong

- SOLVED means "has a best answer". Only `is_locked` blocks new answers.
- Question and school URLs are UUID plus a cosmetic slug, the slug is never used for lookup.
- Notification and report links come from `link_target`, `null` means no link.
- Reports are private: `/my-reports` only, never on the profile, never reviewer or
  escalation data.
- `router.refresh()` updates server props but never resets a client component's own state,
  reset loading state explicitly after a success.

## 11. How to add things

- **New page**: file under `app/`, metadata through `export const metadata` or
  `generateMetadata`. If it needs client state, make a thin server wrapper plus a client
  component.
- **New list**: copy HubQuestionList's loading pattern, use EmptyState and ErrorMessage.
- **New API call**: through `clientFetch` (client) or `apiFetch` (server).
- **New icon**: import from lucide-react, `npm run check:structure` verifies the name.
- **New notification type**: add its icon to the NotificationItem icon map, and to the mobile
  client.

## 12. Known gaps

See "Known gaps" in the Frontend Capabilities section of [feature-list.md](feature-list.md):
hub-offline notice for moderators (needs backend), shared Modal primitive, label wiring in
SchoolFormModal and PageFormModal, windowed "View more" lists, and optional stronger control
borders.

## 13. Keeping this file current

Regenerate the tree and exports after any file move, new route or new shared primitive:

```bash
find app components lib scripts -type f \( -name "*.js" -o -name "*.mjs" \) | sort
grep -rnE "^export (default )?(async )?function " app components lib --include=*.js
```