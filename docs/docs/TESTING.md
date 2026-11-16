# Academia Atlas Regression Testing

Use this checklist for regression checks across the backend, web and
mobile client. Release-only and provider-account setup is tracked separately
in [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md).

## Backend

Run the backend test suite from the backend directory:

```bash
cd backend
make test
```

Confirm `/api/v1/health/` responds and exercise the documented authentication,
permission, question-and-answer, search, report and notification flows against
the API contract. Verify both allowed and denied role actions; the backend is
the authority for permissions.

## Web

Run the web checks from the web directory:

```bash
cd web
npm run check
npm run build
```

Manually check guest browsing, Google sign-in and session refresh; question and
answer creation, editing and voting; comments, notifications and reports; and
moderator, representative and admin actions. Verify loading, empty, error and
populated states, plus light and dark themes and narrow-screen layouts.

## Mobile

### Run it

```bash
cd backend && make run-lan          # 0.0.0.0:8000 for a phone on Wi-Fi, or run the default server and use adb reverse
cd mobile && cp .env.example .env && npm install && npx expo start -c
```

Alternatives to the LAN server: `adb reverse tcp:8000 tcp:8000` with `EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1`,
or a deployed https backend. The backend `.env` must allow your LAN IP in `DJANGO_DEV_ALLOWED_HOSTS` and the Expo
web origin in `CORS_ALLOWED_ORIGINS` (`http://localhost:8081`). Health check: `curl http://127.0.0.1:8000/api/v1/health/`.

### Test users without Google

```bash
cd backend && python manage.py seed_demo_data && python manage.py print_test_tokens
```
One hour tokens for `test-admin@example.com` (admin), `test-staff@example.com` (moderator and representative for UNILAG) and
`test-user@example.com`. In development builds set `EXPO_PUBLIC_DEV_MODE=1` and use Developer access on Login or in the
sign-in sheet, paste both tokens. It does not exist in preview or production builds.

### Login and session
1. First launch: headline, Google button, Browse as guest. Guest browsing needs no account, Alerts and Profile show sign-in states.
2. Google (installed build): the native account chooser opens, cancelling shows nothing, a wrong or missing setup shows a clear message, Log out then sign in shows the chooser again. Expo Go explains that it needs the installed build.
3. Suspended account (403) shows the backend message and the support contact. Invalid token (401) shows "We couldn't verify your Google account. Please try again."
4. Backend down at startup with a stored session: stays signed in on the cached user, recovers when the server returns. Guests never see an expired-session sheet. An invalid refresh token clears the session and shows the expired sheet.

### Home, Search, Schools, Tags
1. Home: search pill, school card strip (tile, live question count, names, location), popular tags, recent questions. Pull to refresh updates all of it, View more appends without duplicates.
2. Search: "Searching..." then results after about 500 ms, count line, tag filter (chip with x, More tags sheet with search), scrolling closes the keyboard.
3. Schools: name search, filter sheet (Has hub, type, ownership, state) with a badge count, Clear all, empty result offers Clear filters.
4. School page: hero, Ask prefilled, status and department chips, Sort sheet, View more. No hub shows the request card and the request sheet.
5. Tags: Popular or A to Z, search, View more. Tag questions: status chips.

### Question, answers, comments
1. Header: status, title, asked by with badge, school link, department, views, tags, Markdown body (headings are plain text).
2. Follow toggles, guests get the sign-in sheet. Staff see Lock and Unlock only for their hub, and it works repeatedly, also after reopening the question.
3. Best answer pin, View in list scrolls and flashes the answer. A deep link with an answer id does the same.
4. Answers: byline above the body, vote up, down, remove, switching works and a failure never leaves a wrong count, Mark as best for the question author only.
5. Kebab sheets: own content Edit and Delete, others Report, staff also Escalate. Question also has Share link (title, status, counts, URL).
6. Locked question hides the composer. Guests see "Sign in to answer this question". The composer and its toolbar stay above the keyboard.
7. Comments sheet: list, add, View more over 20, count on the answer updates, own Edit and Delete, others Report, staff Escalate, everything stays inside the one sheet and Back steps back first.

### Ask and edit
1. School step lists only schools with active hubs. Form step shows "Posting to ...", field errors appear under their field.
2. Tags: popular list on focus, live search after about 300 ms, free text, chips removable, 50 character limit message.
3. Editor: toggles formatting off, continues lists, wraps links, preview matches display, long text scrolls inside the editor.
4. The form and Post question stay above the keyboard. Edit loads fresh every time, also after saving once, with loading and error states.

### Notifications, Profile, Reports, Pages
1. Notifications: All and Unread, unread rows are tinted with a dot, tapping marks read, rows with a link open the question at the answer, rows without one only mark read, Mark all read, admin-only types show Open on web. The list refetches on tab focus.
2. Profile: card with stats, Edit name (trimmed, blank blocked, backend error under the field), four tabs each paged with View more, staff see the web buttons, My reports, Policies, theme, Log out.
3. My reports: explains privacy, filters, status labels, Content removed has no View link, never shows reviewer or escalation data.
4. Pages: staff and draft labels for the roles that get them, pull to refresh, headings render on pages.
5. Report and escalate: a reason is required, escalate is one button, "already reported" shows the friendly message. Staff web handoff shows a confirmation sheet with the URL and opens the system browser with no token.

### Global checks
- Loading, empty, error with Retry, "Can't connect" for network failures, offline banner, pull to refresh.
- Dark mode by system and manual, no flash, text uses ink and muted tokens, a theme change keeps working across screens.
- 429, 502, 503, 504 and no-network copy matches the contract. 400 errors attach to fields.
- Drawer closes on backdrop, Back and swipe. Tab bar matches the mockup. Wordmark stays on one line.
- Deep links from a closed and a running app: `academiaatlas://questions/{id}`, with `#answer-{id}`, `schools/{id}/{slug}`, `tags/{tag}`.
- Reduced motion stops the skeleton pulse. The largest system font keeps tab bar, chips, rows and sheets usable. TalkBack reads every control and announces form errors.
- Error boundary fallback appears on a render crash and Try again recovers.
- No moderation or admin screens in navigation. Touch targets at least 44pt. No em dash characters in source or copy.
- Preview and production builds have no developer sheet and no seeded tokens.

### Automated checks
```bash
cd mobile
npm run typecheck
npx expo-doctor
npm run export:web
npx expo export --platform android --output-dir /tmp/atlas-export
```
