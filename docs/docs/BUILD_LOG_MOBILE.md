# BUILD LOG, MOBILE

## Current Phase
Mobile MVP built by an AI agent from [Mobile_mockup.html](design/Mobile-mockup.html), working against the live API. The post-MVP
audit (M0 to M13, B1 branding, G1 native Google sign in) is complete. Remaining before launch: verify
the final preview build on devices (see DEPLOYMENT_CHECKLIST.md). iOS items are implemented and untested.

## Completed
- Agent build: every screen, verified in Expo web at 390x844 against
  the live API (2026-11-10)

## Mobile Audit Pass (Post-MVP)

Test device: Android 9. iOS items are implemented but left unchecked in
feature-list.md as untested.

M0, context and parity matrix. No code. Found doc errors in mobile-map.md (endpoint
names and mockup path), confirmed against src/api/endpoints.ts that the client itself
was already correct.

M1, bugs and missing actions.
- Lock and unlock: root cause was lockedNow = locked || question.is_locked. Once the
  loaded question was locked, the stale is_locked kept the button on Unlock even after
  a successful unlock. locked is now the only source of truth, synced from the question
  in the existing effect. Added an in-flight guard (lockBusy) and dev-only logging of
  the request method and response.
- Comments: new CommentsSheet (src/features/comments) with a per-comment action menu.
  Own comments get Edit and Delete, other people's get Report, hub staff also get
  Escalate. api.comments.update already existed, only the UI was missing. Menu, edit,
  delete and report all render inside the one sheet by mode, no stacked Modals.
  Hardware Back steps back to the thread first and closes the sheet only from the thread.
- Comment thread has its own post error (a failed post no longer replaces the thread),
  View more pagination (page_size 20, deduped by id), and a stale-response guard.
  Answer comment_count is kept in sync through an onCountChange callback.
- Report and escalate extracted into a shared ReportForm (src/features/reports) used
  by the question and answer menus and by comments. Escalate stays one button:
  POST /reports/ then POST /reports/{id}/escalate/, "already reported" shows the
  admin-will-review copy.

M2a, keyboard foundation, part 1.
- New src/lib/useKeyboard.ts, the single source of keyboard state. Sheet adopted it.
  No behavior change. QuestionScreen and MarkdownEditor adopt it in M2b.

M2b, keyboard foundation, part 2.
- Device finding (Android 9): the composer and the Ask form were hidden by the keyboard
  because QuestionScreen and AskScreen passed no behavior to KeyboardAvoidingView on
  Android, while sheets (behavior "height") worked. New components/KeyboardAvoid.tsx is
  the one wrapper for screens with inputs: 'height' on Android, 'padding' with a safe
  area plus top bar offset on iOS (iOS untested).
- QuestionScreen and AskScreen use useKeyboard (listeners removed). The Ask tags
  input scrolls to the end on focus because it is the last field.
- QuestionScreen split: new features/answers/AnswerCard, AnswerComposer (owns its
  draft, post and keyboard padding) and BestAnswerPin. The screen is about half the size.
- Known follow-up: the composer editor has no maxHeight, long text can squeeze the
  screen while the keyboard is up. Handled in M3 with the editor rewrite.

Platform badge parity.
- New components/PlatformBadge.tsx (PlatformBadge and OfficialAccountNote). The badge now
  shows on the question author, best answer pin, answer bylines and comments, matching
  the web. Inside the comments sheet the tap opens an inline note (no stacked Modal).
  Other surfaces that show an author (QuestionRow, notifications, profile) are checked
  in their own passes.

M4, question share text (folded into M2b, QuestionScreen was already open).
- Share message is title, then "Status, N answers, N views", then
  WEB_BASE_URL/questions/{id}/{slug} (slug omitted if missing).

M3, markdown editor v2, renderer parity and tag search.
- MarkdownEditor rewritten. Toolbar buttons are 44pt in a horizontally scrollable bar
  with Preview pinned at the right, and the toolbar can dock under the input
  (toolbar="bottom", used by the answer composer) so it stays next to the keyboard.
  The input has maxHeight with internal scroll. Editing logic is pure functions in
  src/lib/markdownEdit.ts: toggle inline formatting off (also when the cursor sits inside
  the markers), toggle block prefixes per line, link wrapping that selects the part the
  user types next, and list continuation. Continuation runs in onChangeText by diffing for
  an inserted newline, because onKeyPress Enter is unreliable on Android soft keyboards.
  The cursor is placed by a forced selection prop that is released after the native
  selection event (or 400 ms). Italic uses _ like the web. Preview uses the display
  Markdown component.
- Markdown renderer parity with the web (marked plus sanitize-html): nested lists,
  ordered list start numbers, consecutive quote lines merged into one block, bare URL
  autolinks, mailto links, backslash escapes, intraword underscores stay plain, images
  are dropped, unsafe link schemes render as plain text, ~~~ fences. The inline parser
  is a small tokenizer instead of one split regex. parseMarkdown now returns nested
  list blocks.
- New features/questions/TagInput (used by Ask): chips with remove, popular tags when
  focused and empty, 300 ms debounced search, free text via Done or a comma, 50 character
  limit. The list renders inline under the field so it works inside the form ScrollView.
  Ask scrolls the field to the top of the viewport when it gets focus.
- ModalSheet.tsx (Dialog, ActionMenu) deleted, nothing imported it.

M3 follow-up. TextInputSelectionChangeEvent is not exported by RN 0.88.1, MarkdownEditor
uses the public TextInputSelectionChangeEvent type instead (NativeSyntheticEvent import
removed). Mailto links stay plain text on mobile, the web autolinks them, accepted difference.

M5, shell and cross-cutting.
- App.tsx: useFonts error no longer leaves a blank screen, the pre-font screen uses the
  palette for the system scheme (no white flash in dark mode), the app is wrapped in the new
  components/ErrorBoundary (friendly fallback, Try again, componentDidCatch is the crash
  reporting hook).
- TabBar matches the mockup (no ring around Ask, 56pt slots, raised 20pt, unread count in the
  accessibility label). Drawer closes with a swipe left (PanResponder drives the same
  Animated value), uses useWindowDimensions, announces as a modal.
- QuestionRow snippets go through lib/stripMarkdown (port of the web function).
- Markdown allowHeadings now defaults to false like the web, PageScreen passes true. Closes
  the M3 backlog item, no Q&A call site needs a change.
- OfflineBanner copy no longer claims saved content, nothing is cached yet (offline cache is
  an M12 decision).
- Findings moved to backlog: linking config (M12), legacy palette aliases, SkeletonBlock
  width typing, theme preference flash, reduced motion, pruning admin methods from
  endpoints.ts (M12), SecureStore size limit for the cached user (M6), pluralize in
  QuestionScreen (M9).

M6, auth and session.
- Startup: a failed GET /users/me/ keeps the session and starts from the cached user unless
  it was a definitive 401 (network, timeout, 429 and 5xx used to clear the tokens).
- The unauthorized handler only raises the session-expired sheet when a session existed.
- Seeded dev tokens and the developer token sheet are __DEV__ only, so preview and
  production builds never contain a login bypass.
- Google sign in: native uses the authorization code flow with PKCE (the provider exchanges
  the code, needs expo-crypto), web keeps the token flow. Android and iOS OAuth clients do
  not support the implicit flow. Unverified on a device until the first EAS build.
- StaffDrawerSection indent fixed.

B1, branding and identifiers.
- Identifiers set: com.brandnova.academiaatlas (Android and iOS), scheme academiaatlas,
  slug academia-atlas-mobile, launcher name A-Atlas (store titles say Academia Atlas).
- brand/src holds the four design exports, scripts/make-brand-assets.sh generates the
  icon, adaptive foreground and monochrome, splash light and dark, favicon, store, consent
  and web icons with ImageMagick. config/brand.ts and components/BrandMark are the only
  places the logo is referenced in code. TopBar and BootSplash use them, Login too.
- expo-splash-screen plugin with light and dark backgrounds. eas.json added (development,
  preview, production).
- Removed unused TopBar helpers DetailTopBar, CircleButton, BackLink.
- Storage keys keep the academia. prefix. User-facing strings were renamed by sed.

B1 follow-up. BrandMark falls back to an aspect ratio of 1 when Image.resolveAssetSource
returns no size (strict typing).

M7, home, search, schools and tags.
- New shared Chip and FilterChips (components/Chips.tsx, variants solid, outline, plain,
  horizontal scroll or wrap, allowClear), used by Schools, Search and Tag questions. The School
  screen adopts them in M8. Chips.tsx moved onto the token names (no legacy aliases).
- New features/schools/SchoolCard (Home strip): icon tile, short name, full name, location,
  live question count. Hub counts keep one GET /hubs/by-school/{id}/ per card (at most 5,
  the backend caches hub detail for 60 s) and now refresh with pull to refresh and on tab
  focus. Backend issue 1 asks for hub_question_count on the schools list instead.
- New features/tags/TagFilter (Search): selected tag chip with x, popular chips, "More tags"
  sheet with debounced search and View more. Replaces six fixed chips.
- Schools gained the state filter (free text, 500 ms debounce, exact match like the web).
  Tags gained a Popular or A to Z order. Counts no longer flash 0 while loading, Search
  shows "Searching..." during the debounce, results close the keyboard on drag.
- The Search 5xx fallback to GET /questions/ is now __DEV__ only, so a production outage is not
  hidden behind unranked results.
- Backend issues raised, not changed here: hub_question_count on GET /schools/, answer_count
  and department on GET /search/questions/ rows.

M7 follow-up. Home school cards redesigned (SchoolCard: tile, large question count top right,
short name, two-line name, location and chevron footer). The tile is where a per-school logo
goes after launch.

First preview build findings (Android 9).
- EAS never reads .env (git-ignored), so the build had no EXPO_PUBLIC_API_URL (a release build
  falls back to 10.0.2.2:8000, unreachable) and no Google client ids. Public values now live in
  eas.json env blocks per profile.
- The native splash rendered the 1024 px image oversize. The native splash is now colour only
  (light and dark), the JS boot screen shows the logo. Image splash can return with a small
  test asset.
- The dev build failed to install (storage). Expo Go covers JS work, the preview build covers
  native Google sign in.

M8 and M9, questions, ask, answers.
- Ask: editing always loads the question fresh (the old useQuery plus hydrate guard re-showed
  pre-edit text and skipped reloading the same id). Loading and error states added.
- Question: the school in the meta row opens the school page (web breadcrumb parity). Vote
  switching updates the UI after each confirmed server step, so a failure on the second call
  leaves a correct state. Local count helper replaced by pluralize.
- School: ordering control (Newest, Oldest, Most viewed, Least viewed), FilterChips, hero and
  request sheet extracted to features/schools/SchoolHero and RequestHubSheet.

M10, notifications and my reports.
- Notifications refetch when the tab regains focus, rows announce Unread, filters use
  FilterChips. All 12 types have an icon, link_target and admin web handoffs verified. My
  reports uses FilterChips, privacy rules verified (no reviewer or escalation data).

Dev access.
- features/auth/DevAccessSheet is shared by Login and the sign-in sheet (development builds
  only). Login shows only for a first-time guest or after logout, so the sheet is now also
  reachable from any sign-in prompt.

M11, profile, my reports and pages.
- Profile: the three lists (questions, answers, comments) live in features/profile/useProfileActivity
  and each tab pages with View more. Activity merges the newest 20. ProfileTabs, EditNameSheet and a
  reusable components/Tabs (underlined, scrolling) replace the 470 line screen.
- Pages list: pull to refresh and Staff and Draft badges (the API returns them to staff and admins).
- BrandMark sizes with explicit width and height (an aspectRatio only layout rendered the logo at its pixel
  size in release builds).

Google sign in findings (preview build).
- "Access blocked, custom scheme" on Android 15: the build used the web client id because the Android client
  id was missing. Native sign in needs an Android client (package plus SHA-1 of the signing key, custom URI
  scheme enabled). app.json scheme is now an array including the package name so the redirect has an intent
  filter. Android 9 crashed natively, trace pending. A native Google account picker is the fallback.
- Play re-signs the app, so the production profile needs a second Android client for the Play signing SHA-1.

M12, cross-cutting.
- Deep links: navigation/linking.ts with the academiaatlas:// scheme, the web URL as a prefix and paths
  that mirror the web routes (schools/:id/:slug?, questions/:id/:slug?, tags/:tag, pages/:slug and more).
  A #answer-{id} suffix opens the question scrolled to that answer. https links still need Android intent
  filters (autoVerify) and assetlinks.json on the final domain, tracked in DEPLOYMENT_CHECKLIST.
- endpoints.ts pruned to the user client (no admin, moderation, school or tag management, unanswered queue).
- Legacy palette aliases removed from the theme and every component. Form inputs and the editor container use
  the strong border token per design-guide. The theme provider holds the first paint until the stored
  preference is read.
- Reduced motion (lib/useReduceMotion) stops the skeleton pulse. Text scaling is capped at 1.4. Error
  states and form errors have the alert role. ErrorState has a "Can't connect" variant for network errors.
- Decision: no offline content cache before launch. It needs a storage dependency and an invalidation
  plan, tracked as a future item with the web's low-data mode. The banner copy stays honest.
- BrandMark uses a constant ratio of 1 and the brand PNGs are generated square, because
  Image.resolveAssetSource is not reliable on Expo web.

G1, native Google sign in.
- Android 9 crash trace: expo-web-browser picked an installed app's non-exported WebView activity
  (OPay merchant) as the browser for the Google redirect, which Android rejects with a SecurityException.
  A browser redirect login depends on whatever browsers the phone exposes, so native sign in moved to the
  native Google account picker (@react-native-google-signin/google-signin).
- GoogleSignInButton: native uses GoogleSignin (hasPlayServices, signOut to force the chooser, signIn,
  getTokens), the backend contract is unchanged (access token to POST /auth/google/). Web keeps the
  expo-auth-session token flow with the web client id. Expo Go has no native module, the button explains
  that and Developer access remains the way in. The Android client is matched by package and SHA-1, no
  id in code, EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID is retired. The scheme array is no longer needed.
- TopBar wordmark never wraps (one line, shrinks to 80 percent, font scale capped at 1.1).

M13, docs sync and final checklists.
- mobile-map.md rewritten at the frontend-map depth (props, endpoints per screen, endpoint index).
- feature-list.md Mobile section rewritten (no em dashes, same area headings as the web), TESTING.md
  Mobile section consolidated into the final regression checklist, CHANGELOG entry added.
- Brand sources and the asset generator move to the repo root (brand/), they serve web and mobile.

## Key Decisions (append)
- Comment actions, report and escalate live inside one sheet and switch by mode,
  because stacked Modals are unreliable on older Android
- canModerateHub (admin, moderator or representative of the hub) is the single
  check for lock and escalate, matching the contract
- Keyboard handling goes through one hook, the strategy per platform is decided
  from device results in M2b
- One KeyboardAvoid wrapper per screen with inputs, one useKeyboard hook for keyboard
  state. No Keyboard.addListener anywhere else
- Reused UI lives in components or features folders, screens compose them. Extract on
  sight when a block is used twice or makes a screen long
- Badge tap in a sheet shows its note inline, never a second Modal
- Editing helpers are pure functions in lib/markdownEdit.ts, the editor component only
  wires them to the TextInput
- List continuation is detected from the text change, never from key events
- Suggestion lists render inline in the form, not as an absolute popover, so they work
  inside ScrollViews on older Android
- Markdown allowHeadings defaults to true until the Q&A call sites pass false (matches the
  web, where only static pages render headings). Tracked in feature-list.md
- Branding: the logo concept is traced to three master SVGs (brand/src) and every PNG
  (icon, adaptive foreground and monochrome, splash light and dark, favicon, store and web
  sizes) is generated by scripts/make-brand-assets.sh, never cropped from the JPEG
- Identifiers (Android package, iOS bundle id, URL scheme, EAS slug) are decided before the first
  EAS build because the Android package is permanent after the first Play upload. Pending
  decision, recommended com.brandnova.academiaatlas, scheme academiaatlas, slug
  academia-atlas-mobile. The UI accent stays #3454D1, logo navy and gold are brand colors
  for icons, splash and store graphics only
- The folder rename academia-mobile to mobile waits until after M13, with the web rename
- Storage keys keep the academia. prefix (renaming would sign users out)
- Dev tooling (dev token sheet, seeded tokens) is compiled out of release builds by __DEV__
- The UI accent #3454D1 is also the logo blue, gold is used only in the logo
- The launcher label is the short name A-Atlas, store titles use Academia Atlas
- Home hub counts: keep the per-card request (bounded at 5, cached on the backend) until the
  backend adds hub_question_count to the schools list
- One Chip component for every filter or tag chip, screens never hand-roll chip styles
- Search fallback to the plain question filter exists in development builds only
- Public build configuration lives in eas.json env per profile, never in .env
- Native splash is colour only until an image splash is verified on a device
- Vote UI state always mirrors the last confirmed server step
- The Login screen stays a one-time welcome, the sign-in sheet and drawer are the entry points until email
  and password auth exists
- The default backend server stays the default. LAN access is opt-in (make run-lan), adb reverse or a
  deployed backend are the alternatives
- The mobile client carries no admin or moderation API methods, staff tools are web only
- No offline content cache before launch (banner only)
- Brand mark PNGs are square so layout never depends on an image ratio
- Native Google sign in uses the native account picker, not a browser redirect (reliability across
  phones). The preview build is the only build needed for it, no development build is required for the MVP
- Builds are budgeted, pre-flight (typecheck, expo-doctor, export, prebuild) runs before every EAS build

## Known Deviations From Docs (Mobile)
- mobile-map.md listed the cached user key as academia.cached_user, the code uses academia.user (doc fixed).
- endpoints.ts contains admin and moderation methods the user client never calls (prune in M12).

## Verification History

### 2026-11-10

Run against the live Postgres-backed API at 390x844:

- Invalid access plus valid refresh made exactly one refresh call and retried
  the original request. Invalid refresh cleared the session and showed the
  expired-session sheet over the current screen.
- Guest: Login, Browse as a guest, guest drawer, sign-in sheet and guest ask
  sheet all worked.
- Dev token: the Login sheet accepted a seeded user token and reached Home.
- Home: loaded 18 schools, hub question counts, popular tags and recent
  questions. View more requested page 2 and appended without duplicates.
- Search: a 500 ms debounce, tag filter and result count worked. After the
  backend rank fix, a specific query returned 7 relevant rows.
- Schools: search, has-hub filter and filter count worked. The request included
  `has_hub=true`.
- School: ABU rendered details, hub counts, status and department filters. BUK
  showed the no-hub card and the activation request sheet. Starting Ask from a
  school prefilled the form.
- Ask: empty submit showed the title field error. Filling title, body and tags
  returned 201, opened the new question, and the question was deleted with 204.
- Question: solved question showed the best answer pin; View in list scrolled to
  the answer. Follow, kebab actions, report sheet and escalate sheet rendered.
- Answers: a vote was added and removed, a comment was posted, and an answer was
  posted. The comment and answer were deleted after the check.
- Mark best: a temporary question and answer were created; marking best changed
  the status to SOLVED and showed the pin. The question was then deleted with 404
  on the follow-up GET.
- Lock: staff lock and unlock made POST and DELETE requests and both returned
  200. The question was restored.
- Notifications: filters, unread tint, read marking, deep link to the linked
  question and admin web action rendered. The clicked notification was restored
  to unread after the test.
- Profile: activity, questions, answers and comments tabs loaded the expected
  endpoints. Edit name disabled Save when blank and PATCHed the name. The name
  was restored.
- My reports, pages, page view, staff web handoff, offline banner and dark mode
  were all screenshotted and checked.
- No console or page errors were observed in the final checks.