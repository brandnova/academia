# Mobile Client Map

A file-by-file mental model of `mobile/`, for anyone (or any chat) picking up mobile work.
It answers "where does it live". For "what can it do" read the Mobile Client section of
[feature-list.md](feature-list.md), for the API read [api-contract.md](api-contract.md), for visual rules
read [design-guide.md](design-guide.md), for history and decisions read
[BUILD_LOG_MOBILE.md](BUILD_LOG_MOBILE.md), for regression checks [TESTING.md](TESTING.md), for launch work
[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md). The UX reference is `design/Mobile mockup.html`.

---

## 1. Stack and tooling

- React Native 0.88.1, React 19.3.0, Expo SDK ~58, TypeScript ~6.0.3. Navigation: React Navigation 7
  (native stack, bottom tabs) plus a custom slide-over drawer. Icons: FontAwesome6 through `@expo/vector-icons`.
  Font: Plus Jakarta Sans 400 to 800 (`@expo-google-fonts/plus-jakarta-sans`).
- Native modules: `expo-secure-store`, `expo-network`, `expo-splash-screen`, `expo-linking`,
  `expo-constants`, `expo-font`, `expo-updates`, `expo-system-ui`,
  `@react-native-google-signin/google-signin` (native Google sign in).
  Web preview only: `react-native-web`, `expo-auth-session`, `expo-web-browser`.
- No state library. Plain React context providers plus two data hooks (`useQuery`, `usePagedList`).
- Builds: `eas.json` has `development`, `preview` (APK) and `production` profiles. The `env` block of a
  profile holds the public `EXPO_PUBLIC_*` values, EAS never reads `.env`.

| Script | What it does |
|---|---|
| `npm start`, `android`, `ios`, `web` | Expo dev server (`npx expo start -c` clears the cache) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run export:web` | Production web export check |
| `npx expo-doctor` | Dependency and config health |
| `npx expo export --platform android` | Proves the JS bundles (pre-flight before a build) |
| `npx expo prebuild --platform android --no-install --clean` | Validates `app.json` and config plugins, then `rm -rf android` |
| `brand/make-brand-assets.sh` | Generates every icon, splash and brand PNG (repo root) |

## 2. Environment variables

| Name | Consumer | Purpose |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `src/api/config.ts` | API base including `/api/v1`. Derived from the Metro host when blank (Expo Go). Required in builds |
| `EXPO_PUBLIC_WEB_BASE_URL` | `src/config/app.ts` | Share links and the staff web handoff |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | `src/auth/GoogleSignInButton.tsx` | Web OAuth client, used for web sign in and to configure the native library |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | `GoogleSignInButton.tsx` | iOS client (iOS untested) |
| `EXPO_PUBLIC_PLATFORM_ACCOUNT_ID` | `src/config/app.ts` | Comma separated user ids that get the official "A" badge (per database) |
| `EXPO_PUBLIC_SUPPORT_EMAIL` | `src/config/app.ts` | Shown with the suspended-account message |
| `EXPO_PUBLIC_DEV_MODE` | `src/config/app.ts` | Developer access sheet, honoured only when `__DEV__` |
| `EXPO_PUBLIC_DEV_ACCESS_TOKEN`, `_REFRESH_TOKEN` | `AuthProvider.tsx` | Optional seeded dev login, `__DEV__` only |

`EXPO_PUBLIC_*` values are baked in at build time, so changing one needs a rebuild. The Android OAuth client
has no variable: Google matches it by package name and signing SHA-1.

## 3. Architecture and data flow

- **Direct API.** The app calls Django at `/api/v1` with no proxy. Native requests have no CORS.
  `src/api/client.ts` attaches the bearer token to every request (also public reads, so `user_vote` and
  `is_following` are personalised), enforces timeouts, and turns failures into `ApiError`
  (`status`, `fields`, `network`).
- **Session.** Tokens live in `expo-secure-store` (localStorage on web). A 401 triggers one shared refresh.
  The session is cleared only on a definitive 400 or 401 from `/auth/refresh/`. Network failure, 429 and 5xx
  keep the session and start from the cached user.
- **Guests and the auth gate.** Guests browse freely. `requireAuth(action)` opens one sign-in sheet that
  keeps the screen and resumes the action after login. The Login screen is a one-time welcome.
- **Roles.** `useCapabilities()` is the only place roles are derived. Hiding a control is UX, the backend
  enforces everything. The mobile client has no moderation or admin screens: staff get lock, report and
  escalate in context and "Open on web" handoffs that never carry a token.
- **Lists.** `usePagedList` (paged, deduped, stale-guarded, pull to refresh, View more with its own error).
  `useQuery` for single resources.
- **Google.** Native: Google account picker, access token to `POST /auth/google/`. Web: browser token flow.

## 4. Provider tree

```text
SafeAreaProvider
 ThemeProvider            (waits for the stored preference before first paint)
  ErrorBoundary
   NetworkProvider        (expo-network, drives OfflineBanner)
    AuthProvider          (tokens, user, refresh handler, sign in and out)
     AuthGateProvider     (sign-in sheet, Developer access sheet in DEV_MODE)
      UnreadProvider      (unread count for the Alerts badge)
       StaffWebProvider   (confirmation sheet for web handoffs)
        AppShell          (BootSplash while auth loads)
         DrawerProvider > RootNavigator + Drawer
```

## 5. Navigation, routes and deep links

Files in `src/navigation/`: `types.ts` (param lists, `navigationRef`, `navigateRoot`, `startAsk`),
`RootNavigator.tsx` (stack, theme, linking), `TabNavigator.tsx`, `TabBar.tsx` (Home, Schools, raised Ask,
Alerts with unread count, Profile), `Drawer.tsx` and `DrawerProvider.tsx` (swipe left, Back or backdrop
closes), `linking.ts`.

| Route | Params | Notes |
|---|---|---|
| `Main` | tabs `Home`, `Schools`, `Ask`, `Alerts`, `Profile` | `Ask` params: `nonce`, `hubId`, `schoolId`, `schoolName`, `editQuestionId` |
| `Login` | none | Shown to a first-time guest and after logout |
| `School` | `schoolId?`, `slug?`, `name?` | UUID or slug |
| `Question` | `questionId`, `answerId?` | `answerId` scrolls to and flashes that answer |
| `Search`, `Tags`, `MyReports`, `Pages` | none | |
| `TagQuestions` | `tag` | |
| `PageView` | `slug`, `title?` | |

Deep links (`linking.ts`): prefixes `academiaatlas://`, the Expo dev URL and `WEB_BASE_URL`. Paths mirror the
web: `questions/:id/:slug?`, `schools/:id/:slug?`, `tags/:tag`, `pages/:slug`, `search`, `tags`,
`my-reports`, `notifications`, `schools`, `profile`. A `#answer-{id}` suffix opens the question at that answer.
https links in the app need Android intent filters with autoVerify and `assetlinks.json` (launch work).

## 6. Screens (`src/screens/`)

| Screen | Endpoints | Notes |
|---|---|---|
| `HomeScreen` | `GET /questions/`, `/schools/?has_hub=true`, `/tags/?popular=true`, `/hubs/by-school/{id}/` per card | Search pill, `SchoolCard` strip, tags, recent questions |
| `SearchScreen` | `GET /search/questions/` (dev builds fall back to `/questions/?search=`) | 500 ms debounce, `TagFilter`, "Searching..." state |
| `SchoolsScreen` | `GET /schools/` (search, has_hub, institution_type, ownership, state) | Filter sheet, `Chip`s |
| `SchoolScreen` | `GET /schools/{id}/` or `/by-slug/`, `/hubs/by-school/{id}/`, `GET /questions/`, `POST /hubs/activation-requests/` | `SchoolHero`, status and department chips, sort sheet, `RequestHubSheet` |
| `TagsScreen`, `TagQuestionsScreen` | `GET /tags/`, `/tags/{name}/questions/` | Popular or A to Z, status chips |
| `QuestionScreen` | `GET`, `DELETE /questions/{id}/`, follow, lock, answer edit, delete, vote, mark-best | Composes `AnswerCard`, `AnswerComposer`, `BestAnswerPin`, `CommentsSheet`, `ReportForm` |
| `AskScreen` | `/schools/?has_hub=true`, `/hubs/by-school/{id}/`, `/hubs/{id}/`, `GET /questions/{id}/` (edit), `POST`, `PATCH /questions/` | School step, form step, `TagInput`, edit loads fresh |
| `NotificationsScreen` | `GET /notifications/`, `mark-read`, `mark-all-read` | 12 types with icons, `link_target` deep links, admin types open the web |
| `ProfileScreen` | `GET`, `PATCH /users/me/` | `ProfileTabs`, `EditNameSheet`, staff web buttons |
| `MyReportsScreen` | `GET /reports/mine/` | Private, never shows reviewer or escalation data |
| `PagesScreen`, `PageScreen` | `GET /pages/`, `/pages/{slug}/` | Staff and Draft badges, headings enabled on pages |
| `LoginScreen` | `POST /auth/google/` | Google, guest, Developer access in dev builds |

## 7. `src/api/`

| File | Exports | Purpose |
|---|---|---|
| `config.ts` | `API_BASE_URL`, `API_BASE_SOURCE` | `EXPO_PUBLIC_API_URL`, else the Metro host on port 8000, else `10.0.2.2` on Android or localhost |
| `client.ts` | `apiRequest`, `ApiError`, `FRIENDLY_MESSAGES`, `errorMessage`, `fieldError`, `isAbortError`, `setAccessToken`, `getAccessToken`, `setRefreshHandler`, `setUnauthorizedHandler` | Fetch wrapper, single-flight refresh, friendly copy for network, 429 and gateway errors |
| `types.ts` | entity types, filters, enums | Mirrors api-contract.md |
| `endpoints.ts` | `api` | Typed SDK. User client only: auth, me, schools, hubs (read and activation request), questions, answers, comments, tags, search, notifications, reports (create, mine, escalate), pages |

## 8. `src/auth/`

| File | Exports | Purpose |
|---|---|---|
| `AuthProvider.tsx` | `AuthProvider`, `useAuth` | `status`, `user`, `isAuthenticated`, `welcomeSeen`, `sessionExpiredAt`, `signInWithGoogleToken`, `signInWithAccessToken` (dev), `signOut`, `refreshUser`, `updateProfile`, `markWelcomeSeen` |
| `GoogleSignInButton.tsx` | `GoogleSignInButton`, `googleConfigured` | Native account picker, web browser flow, "unavailable" states for missing config and Expo Go |
| `UnreadProvider.tsx` | `UnreadProvider`, `useUnread` | `unreadCount`, `refresh`, `setUnreadCount`. Refreshes on mount, user change and app foreground |

## 9. `src/features/`

| File | Props or exports | Notes |
|---|---|---|
| `auth/AuthGateProvider.tsx` | `requireAuth(action?, message?)`, `promptSignIn(message?)` | One sign-in sheet, resumes the pending action |
| `auth/DevAccessSheet.tsx` | `visible`, `onClose`, `onSuccess?` | Paste test tokens, dev builds only |
| `network/NetworkProvider.tsx` | `useNetwork()` gives `isOffline` | Used by `Screen` |
| `staff/useCapabilities.ts` | `role`, `roleLabel`, `isAdmin`, `isStaff`, `canModerateHub(hubId)` | Single source for roles |
| `staff/StaffWebProvider.tsx` | `openOnWeb(path, label?)` | Confirmation sheet, system browser, no tokens |
| `staff/StaffLockControl.tsx` | `hubId`, `locked`, `busy`, `onPress` | Lock and Unlock pill for hub staff |
| `staff/StaffDrawerSection.tsx`, `StaffProfileButtons.tsx` | | Web handoff rows |
| `staff/notifications.ts` | `useAdminNotificationWeb(type, onOpen)` | Admin-only types open the web |
| `reports/ReportForm.tsx` | `contentType`, `contentId`, `escalate`, `onClose` | Report, or report then escalate as one action |
| `comments/CommentsSheet.tsx` | `answer`, `hubId`, `onClose`, `onCountChange` | Thread plus menu, edit, delete, report, official note, all in one sheet |
| `answers/AnswerCard.tsx` | `answer`, `canMarkBest`, `flashing`, `voteBusy`, `onLayout`, `onVote`, `onMenu`, `onComments`, `onMarkBest`, `onOfficial` | One answer |
| `answers/AnswerComposer.tsx` | `questionId`, `locked`, `onPosted` | Sticky bar, owns draft and post state |
| `answers/BestAnswerPin.tsx` | `answer`, `onJump`, `onOfficial` | Read-only best answer preview |
| `questions/TagInput.tsx` | `tags`, `onChange`, `error?`, `onFocusChange?` | Chips, popular tags, debounced search, free text |
| `schools/SchoolCard.tsx` | `school`, `refreshKey?`, `onPress`; `SCHOOL_CARD_WIDTH`, `SCHOOL_CARD_HEIGHT` | Fetches its own hub count |
| `schools/SchoolHero.tsx` | `school`, `hub` | Header, stats, Ask action |
| `schools/RequestHubSheet.tsx` | `school`, `visible`, `onClose` | Hub activation request |
| `tags/TagFilter.tsx` | `value`, `onChange` | Search tag filter |
| `profile/useProfileActivity.ts` | `(userId, enabled)` | Three paged lists and a combined `refresh` |
| `profile/ProfileTabs.tsx`, `EditNameSheet.tsx` | `activity`; `visible`, `onClose` | |

## 10. `src/components/`

| File | Exports and props | Notes |
|---|---|---|
| `Screen.tsx` | `Screen` (`children`, `style`, `edges`), `Divider`, `Spacer` | Safe area plus `OfflineBanner` |
| `TopBar.tsx` | `TopBar` (`title`, `wordmark`, `onBack`, `right`, `showBorder`), `HeaderIconButton`, `HeaderTextButton`, `SectionHeader` | Root screens get the menu, detail screens a back arrow |
| `Text.tsx` | `Text` (`variant`, `weight`, `size`, `color`, `center`) | Font scaling capped at 1.4 |
| `Button.tsx` | `Button` (`title`, `variant`, `size`, `icon`, `iconRight`, `loading`, `disabled`, `fullWidth`), `IconButton` | Variants primary, secondary, ghost, danger, dangerSoft, accentSoft |
| `Form.tsx` | `Field`, `Input`, `TextArea`, `SelectRow`, `ToggleRow`, `FormError` | Field errors sit under their field |
| `Icon.tsx` | `Icon` (`name`, `size`, `color`, `family`), `IconName` | Semantic names to FontAwesome6 |
| `Chips.tsx` | `Chip`, `FilterChips` (`options`, `value`, `onChange`, `variant`, `wrap`, `allowClear`), `SegmentedTabs`, `TagPill`, `TopicChip`, `Badge` | One chip style everywhere |
| `Tabs.tsx` | `Tabs` (`tabs`, `value`, `onChange`) | Underlined, scrolls |
| `SearchField.tsx` | `SearchField`, `SearchPill` | Pill inputs |
| `Sheet.tsx` | `Sheet` (`visible`, `onClose`, `title`, `label`, `scroll`, `footer`, `showClose`, `headerRight`), `ActionSheet`, `ConfirmSheet`, `SheetAction` | Bottom sheet, max 82 percent height; swipe down on the handle and title area dismisses |
| `States.tsx` | `Loading`, `EmptyState`, `ErrorState`, `SkeletonQuestionList`, `SkeletonBlock`, `ListFooter`, `ViewMoreButton`, `OfflineBanner` | `ErrorState` has a network variant |
| `QuestionRow.tsx` | `QuestionRow`, `StatusIcon`, `StatusLabel` | Plain-text snippets via `stripMarkdown` |
| `SchoolRow.tsx`, `TagRow.tsx` | | List rows |
| `Markdown.tsx` | `Markdown` (`markdown`, `compact`, `allowHeadings`), `parseMarkdown` | Safe renderer, headings only when allowed (pages) |
| `MarkdownEditor.tsx` | `MarkdownEditor` (`value`, `onChangeText`, `minHeight`, `maxHeight`, `toolbar`) | Editing logic is in `lib/markdownEdit.ts` |
| `KeyboardAvoid.tsx` | `KeyboardAvoid` | The wrapper for screens with bottom inputs |
| `PlatformBadge.tsx` | `PlatformBadge`, `OfficialAccountNote` | Next to every author name |
| `BrandMark.tsx` | `BrandMark` (`width`) | Square brand PNGs, white A in dark mode |
| `Avatar.tsx` | `Avatar` (`name`, `uri`, `size`, `bordered`) | Initial fallback |
| `ErrorBoundary.tsx` | `ErrorBoundary` | `componentDidCatch` is the crash reporting hook |

## 11. `src/theme/`

`ThemeProvider`, `useTheme()` (`mode`, `preference`, `colors`, `setPreference`, `toggleMode`), `palettes`, `fonts`,
`radii`, `touchTarget`, `fabShadow`, `sheetShadow`, `webInputReset`. Palette tokens exactly as in design-guide.md:
`bg`, `surface`, `subtle`, `line`, `strong`, `ink`, `muted`, `accent`, `accentSolid`, `accentSoft`, `onAccent`,
`success`, `successSoft`, `danger`, `dangerSoft`, `warningBg`, `warningInk`, `overlay`, `skeleton`, `isDark`.

## 12. `src/lib/` and `src/config/`

| File | Exports | Purpose |
|---|---|---|
| `storage.ts` | `storage`, `STORAGE_KEYS` | Secure store (localStorage on web). Keys `academia.access_token`, `academia.refresh_token`, `academia.user`. Keys keep the `academia.` prefix |
| `time.ts` | `timeAgo`, `pluralize`, `compactNumber` | |
| `useQuery.ts`, `usePagedList.ts` | | Fetch hooks |
| `useDebouncedValue.ts`, `useRefreshOnFocus.ts` | | |
| `useKeyboard.ts` | `useKeyboard(active)` gives `{ height, visible }` | The only keyboard subscriber |
| `useReduceMotion.ts` | | Reduced motion preference |
| `markdownEdit.ts` | `toggleInline`, `toggleBlock`, `wrapLink`, `continueList`, `INLINE` | Pure editing helpers |
| `stripMarkdown.ts` | `stripMarkdown` | One-line plain text |
| `config/app.ts` | `WEB_BASE_URL`, `SUPPORT_EMAIL`, `DEV_MODE`, `PLATFORM_ACCOUNT_IDS`, `isPlatformAccount`, `webUrl`, `IS_WEB` | |
| `config/brand.ts` | `BRAND` | Name, short name, tagline, the two mark assets |

## 13. Conventions

1. Lists: `usePagedList`, `FlatList` with `RefreshControl`, `ViewMoreButton` in the footer, skeleton while loading,
   `EmptyState` when empty, `ErrorState` with retry.
2. Forms: `Field` plus `fieldError(err, name)`. Never show raw error objects.
3. Sheets over modal screens. Never stack Modals: switch the content of one sheet by mode.
4. Colours only through `useTheme()` tokens, never hex (white on accent excepted).
5. Roles only through `useCapabilities()`.
6. Restricted actions through `requireAuth`, never a redirect to Login.
7. Screens with inputs wrap in `KeyboardAvoid`, keyboard state only from `useKeyboard`.
8. Reuse: a block used twice, or one that pushes a screen past a few hundred lines, becomes a component.
9. User content only through `Markdown` and `MarkdownEditor`, new formatting goes in `lib/markdownEdit.ts`.
10. Author names always carry `PlatformBadge`.
11. Suggestion lists render inline under the field, not as popovers.
12. Reports through `ReportForm` only.
13. No em dash characters in code, comments or docs.

## 14. Behaviours that are easy to get wrong

- SOLVED means "has a best answer". Only `is_locked` blocks new answers. Only the question author marks best.
- Reports are private: `/my-reports` only, no reviewer or escalation data, never on the profile.
- Notification and report links come from `link_target`, `null` means no link.
- A failed refresh must not log the user out unless it was a definitive 400 or 401.
- Vote switching updates the UI after each confirmed server step.
- Heading syntax renders as plain text everywhere except static pages.
- Preview and production builds contain no developer sheet and no seeded tokens (`__DEV__`).

## 15. Endpoint index (endpoint to callers)

| Endpoint | Callers |
|---|---|
| `POST /auth/google/` | `LoginScreen`, `AuthGateProvider`, `AuthProvider` |
| `POST /auth/refresh/`, `/auth/logout/` | `AuthProvider` |
| `GET`, `PATCH /users/me/` | `AuthProvider`, `EditNameSheet` |
| `GET /users/me/answers/`, `/users/me/comments/` | `useProfileActivity` |
| `GET /questions/` | `HomeScreen`, `SchoolScreen`, `useProfileActivity`, `SearchScreen` (dev fallback) |
| `GET /questions/{id}/` | `QuestionScreen`, `AskScreen` |
| `POST /questions/`, `PATCH /questions/{id}/` | `AskScreen` |
| `DELETE /questions/{id}/` | `QuestionScreen` |
| follow, lock | `QuestionScreen`, `StaffLockControl` |
| `POST /answers/` | `AnswerComposer` |
| answer edit, delete, vote, mark-best | `QuestionScreen` |
| comments (list, create, update, delete) | `CommentsSheet` |
| `POST /reports/`, `POST /reports/{id}/escalate/` | `ReportForm` |
| `GET /reports/mine/` | `MyReportsScreen` |
| `GET /schools/` | `HomeScreen`, `SchoolsScreen`, `AskScreen` |
| `GET /schools/{id}/`, `/schools/by-slug/{slug}/` | `SchoolScreen` |
| `GET /hubs/{id}/` | `AskScreen` |
| `GET /hubs/by-school/{id}/` | `SchoolCard`, `SchoolScreen`, `AskScreen` |
| `POST /hubs/activation-requests/` | `RequestHubSheet` |
| `GET /tags/` | `HomeScreen`, `TagsScreen`, `TagInput`, `TagFilter` |
| `GET /tags/{name}/questions/` | `TagQuestionsScreen` |
| `GET /search/questions/` | `SearchScreen` |
| notifications (list, mark-read, mark-all-read) | `NotificationsScreen`, `UnreadProvider` |
| `GET /pages/`, `/pages/{slug}/` | `PagesScreen`, `PageScreen` |

## 16. How to add things

- **New screen:** add the file in `src/screens/`, a route and its params in `navigation/types.ts`, register it in
  `RootNavigator.tsx`, add a path in `linking.ts`, and add its row to section 6.
- **New API call:** add it to `endpoints.ts` (user client only), type it in `types.ts`, use `useQuery` or `usePagedList`.
- **New notification type:** add its icon to `NotificationsScreen`, and to the web client.
- **New env variable:** read it in `config/app.ts`, add it to `.env.example`, `eas.json` and section 2.

## 17. Known gaps

See "Known gaps" in the Mobile section of [feature-list.md](feature-list.md): offline cache,
https app links (launch), VoiceOver and all iOS checks (untested), native Google sign in verification on the final build.

## 18. Keeping this file current

After any new file, route or shared component, regenerate the lists and update the matching section:

```bash
cd mobile && find src -type f \( -name "*.ts" -o -name "*.tsx" \) | sort
grep -rnE "^export (default )?(async )?(function|const|class) " src --include=*.ts --include=*.tsx
```