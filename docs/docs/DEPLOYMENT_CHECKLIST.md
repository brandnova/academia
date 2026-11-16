# Deployment Checklist

One checklist for the whole launch. Work through Backend, then Web, then Mobile, then the
shared operations and runbook at the end. Day-to-day regression checks are in
[TESTING.md](TESTING.md). Provider-account steps need access to those accounts.

`[ ]` not done, `[x]` done. Commands assume Fedora bash.

---

## 0. Before anything else

- [ ] Domain and DNS decided (web, API, optional status page).
- [ ] Support inbox exists and is monitored (it is shown to suspended users and in store listings).
- [ ] Password manager holds every secret below, never git or chat.
- [ ] Accounts exist: Vercel, Supabase, Upstash, email provider, Google Cloud, Expo (EAS),
      Apple Developer, Google Play Console.
- [ ] Rollback owner and launch day decided (avoid launching on a Friday evening).

---

## 1. Backend

### 1.1 Environment and secrets
- [ ] `SECRET_KEY` is new, long and unique per environment.
- [ ] `DEBUG` is off. `print_test_tokens` refuses to run, confirm it does.
- [ ] `DATABASE_URL` is set and scoped to every environment that builds or runs (the production
      settings guard also fires during Vercel builds). `DJANGO_ALLOW_SQLITE` is NOT set in production.
- [ ] `DATABASE_CONN_MAX_AGE=0` behind the Supabase transaction pooler.
- [ ] `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS` and `CORS_ALLOWED_ORIGINS` list exact origins, no
      wildcards. The Expo web preview origin is absent from production.
- [ ] `FRONTEND_URL` is the live site, so email buttons link correctly.
- [ ] `REDIS_URL` points at Upstash. Cache TTL variables reviewed.
- [ ] Email delivery variables are set for the real provider (not MailHog).

### 1.2 Database
- [ ] Production Postgres created, backups enabled, point-in-time recovery understood.
- [ ] `python manage.py migrate` applied. `makemigrations --check` shows nothing pending.
- [ ] Django admin superuser created with a strong password. Admin URL protected (consider
      restricting or renaming the path).
- [ ] A platform admin account exists (and the platform account used for seed content, see 1.6).

### 1.3 Security and platform
- [ ] HTTPS only. HSTS, secure cookies and `SECURE_PROXY_SSL_HEADER` are active in production settings.
- [ ] Browsable API renderer is disabled (responses are JSON only).
- [ ] `makemigrations`, `check --deploy` run clean:
      `python manage.py check --deploy`
- [ ] Static files served (whitenoise) and Django admin loads with styling.
- [ ] No secrets in the repo: `git log -p | grep -iE "secret|password|token"` reviewed.

### 1.4 Cache and throttling
- [ ] Throttle counters use the shared Redis, not per-process memory.
- [ ] Redis outage fails open (kill the connection once on a preview and confirm the API still answers).
- [ ] Rate limits behave on the live API (see 1.7).

### 1.5 Email
- [ ] Send each emailed notification once with real accounts: new answer, best answer, hub
      activated, hub rejected (with reason), account suspended. Check the inbox, spam folder and links.
- [ ] Sender domain has SPF and DKIM so mail does not land in spam.

### 1.6 Data and accounts
- [ ] School directory imported with `import_school_directory`. New schools import inactive:
      review and activate them deliberately. `known_possible_duplicates.csv` triaged.
- [ ] **Never** run `seed_demo_data --clear` against production (it wipes schools).
- [ ] Static pages created through the admin: Privacy Policy, Terms, Community Guidelines (public)
      and the Moderator Handbook (staff), all published.
- [ ] Platform (official) account created, promoted to admin, its id noted for the frontend and
      mobile `PLATFORM_ACCOUNT_ID` variables, before seed questions are posted.
- [ ] First hubs activated, first representatives and moderators assigned.

### 1.7 API smoke tests
```bash
API=https://YOUR-BACKEND/api/v1
curl -s $API/health/ | python -m json.tool                       # status ok, database ok, cache ok
curl -s "$API/schools/?page_size=2" | python -m json.tool | head -20
curl -s -o /dev/null -w "%{http_code}\n" $API/users/me/          # 401
curl -s -o /dev/null -w "%{http_code}\n" $API/nope/              # 404 as JSON, not an HTML page
curl -s "$API/search/questions/?q=zzqx+wwvk" | python -m json.tool | head -5   # count 0 (rank floor)
curl -s -I -H "Origin: https://evil.example" $API/schools/ | grep -i access-control   # prints nothing
for i in $(seq 1 12); do curl -s -o /dev/null -w "%{http_code} " -X POST $API/auth/google/ \
  -H "Content-Type: application/json" -d '{"access_token":"x"}'; done; echo   # 401s, then 429
```
- [ ] All of the above behave as commented.
- [ ] Token refresh and refresh-token revocation work against the live API (log out, reuse the old refresh token).
- [ ] A suspended account is rejected at login with the 403 message.

### 1.8 Permissions spot checks (live API, three test accounts)
- [ ] A regular user gets 403 on: schools POST, tag merge, report resolve, admin users, hub PATCH.
- [ ] A moderator can lock a question in their hub and gets 403 in another hub.
- [ ] A representative can assign a moderator for their hub only.
- [ ] A guest can read but gets 401 on every write.

### 1.9 Observability and backups
- [ ] Error alerting (Sentry or equivalent) for the backend, with a test event received.
- [ ] Uptime check on `/api/v1/health/` with an alert route.
- [ ] Database backup restore tested once, not just configured.
- [ ] Log location known (Vercel logs), structured logs readable.

---

## 2. Web (Vercel)

### 2.1 Environment (redeploy after changes, `NEXT_PUBLIC_*` is baked in at build)
- [ ] `BACKEND_API_URL`: the backend `/api/v1` base, no trailing slash, server only.
- [ ] `NEXT_PUBLIC_SITE_URL`: the real public origin. It is also used for the server's calls to
      its own proxy, so a wrong value breaks server-rendered pages.
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- [ ] `NEXT_PUBLIC_PLATFORM_ACCOUNT_ID` (optional, comma-separated).
- [ ] Variables are scoped to Production, and Preview uses the preview backend.
- [ ] Production branch is `main`. Preview deployments do not use production secrets.

### 2.2 Google sign in
- [ ] The production origin is in the OAuth client's Authorized JavaScript origins.
- [ ] The consent screen is published, not in testing mode, or only test users can sign in.
- [ ] Sign in works with a brand-new Google account, an existing account and a suspended account.

### 2.3 Session and proxy
- [ ] Cookies show HttpOnly and Secure on the live domain (DevTools, Application tab), SameSite Lax.
- [ ] No token is visible to JavaScript (`document.cookie` shows no auth cookie).
- [ ] After a long idle or backend cold start, a page loads or shows the friendly "taking too long"
      copy, never a raw 500.
- [ ] Logging out blacklists the refresh token.

### 2.3b Build and quality gates
- [ ] `npm run check && npm run build` pass with no warnings you do not understand.
- [ ] Lighthouse mobile on the home page, a school page and a question page. Note the scores,
      fix anything under 80 for performance or under 90 for accessibility.
- [ ] Light and dark mode and a 360px width through: sign in, ask, answer, vote, comment,
      notifications, profile, report, search.
- [ ] Keyboard-only pass: tab through a question page, every control reachable with a visible focus ring.
- [ ] Browser matrix: latest Chrome, Safari (iOS), Firefox, Samsung Internet if you can.
- [ ] 404 and error pages render for a missing school, question and page.

### 2.4 Search and sharing
- [ ] Add the property in Google Search Console (DNS domain verification is the least fiddly),
      submit `/sitemap.xml`, inspect the home page, a school, a question and a tag.
- [ ] `/robots.txt` shows the disallow list, and `/my-reports`, `/admin` and `/moderation` are blocked.
- [ ] Rich Results Test passes on a question (BreadcrumbList) and the home page (WebSite).
- [ ] Facebook Sharing Debugger and the X card validator show correct cards for a school and a question.
- [ ] Preview deployments are not indexable (check the response headers).
- [ ] Canonical URLs use the real domain.

### 2.5 Content and legal
- [ ] Privacy Policy, Terms, Community Guidelines and the Moderator Handbook are published.
- [ ] Footer links to them work. The app-promotion banner, if built, stays hidden until store URLs exist.

---

## 3. Mobile (Expo)

### 3.1 Brand and app identity
- [ ] OAuth clients created in Google Cloud: Web (also used for the web preview), Android for the EAS keystore (package com.brandnova.academiaatlas, SHA-1 from `eas credentials`, custom URI scheme enabled) and iOS (bundle id). Native sign in uses code flow with PKCE, so the Android and iOS clients need no secret.
- [ ] After the first Play upload, create a second Android client for the Play app signing SHA-1 and put its id in the production profile.
- [ ] Image splash re-introduced only after a small test asset renders correctly on a real device (native splash is colour only for now).
- [ ] iOS bundle identifier and Android package name set in `app.json` (currently `com.brandnova.academiaatlas`).
- [ ] Ownership of the `academiaatlas` URL scheme and any universal link domain confirmed.
- [ ] Store screenshots at the required sizes for iPhone and Android.
- [ ] Store descriptions, keywords and privacy answers written.
- [x] Identifiers decided and set in app.json: com.brandnova.academiaatlas (Android and iOS), scheme academiaatlas, slug academia-atlas-mobile, launcher name A-Atlas. Google OAuth redirect URIs must be created from these.
- [ ] Icon kit generated by `brand/make-brand-assets.sh` from `brand/src` and checked on a real build (icon, adaptive, monochrome, splash light and dark), plus Play 512, Google consent logo 120 and the Play feature graphic 1024x500 made by hand.
- [ ] expo-splash-screen plugin configured with light and dark backgrounds and checked on Android 12+ and iOS (Android 9 shows the legacy splash).
- [ ] Monochrome icon checked on Android 13+ themed icons, launcher label checked for truncation.
- [ ] The production profile in eas.json holds the real production API, web URL and the production database's platform account id (no placeholders).

### 3.2 Expo and EAS
- [ ] Expo account and organization created, `npx eas init` run, placeholder ownership replaced.
- [ ] EAS build profiles for development, preview and production.
- [ ] Development build with the real identifiers, then a preview build for testers.
- [ ] iOS certificates and Android keystores managed through EAS, stored in the password manager.
- [x] EAS Update configured. Publish JS and asset fixes with `eas update --channel preview|production --message "..."`. A new native module, native app.json change or SDK upgrade needs a version bump and a new build.
- [ ] Crash reporting (Sentry or equivalent) added before the first tester build. If added, wire it into ErrorBoundary.componentDidCatch.
- [ ] Pre-flight before every EAS build: typecheck, expo-doctor, `npx expo export --platform android`, `npx expo prebuild --platform android --no-install --clean` then `rm -rf android`.
- [ ] Build budget tracked (free tier, local builds with `eas build --local` do not use cloud builds).

### 3.3 Google sign in
- [ ] OAuth clients in one Google Cloud project: Web (its id goes in EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID), Android (package com.brandnova.academiaatlas plus the SHA-1 of the EAS keystore from `eas credentials -p android`, no id goes in the app), iOS later.
- [ ] After the first Play upload add a second Android client with the Play app signing SHA-1 (Play re-signs the app).
- [ ] Consent screen branding (name, support email, 120px logo). While in Testing, add test users, switch to In production to open it up.
- [ ] Native sign in verified on a real Android 9 and Android 15 phone and an iPhone: new account, existing account, suspended account (403 copy and support email visible), cancelled chooser.
- [ ] No client secret exists anywhere in the mobile project.

### 3.4 API and configuration
- [ ] EXPO_PUBLIC_API_URL (https, including /api/v1), EXPO_PUBLIC_WEB_BASE_URL and the Google client ids are set in the eas.json env block of every profile you build (EAS never reads the local .env). A build without EXPO_PUBLIC_API_URL silently targets 10.0.2.2, and the web base URL defaults to the preview site.
- [ ] The backend health URL opens in the phone's browser before you build.
- [ ] No test tokens, `.env` files or keystores are committed.
- [ ] Tokens are only in SecureStore on device, never AsyncStorage.
- [ ] Token refresh verified against production with an expired access token, and a network
      failure during refresh does not sign the user out.
- [ ] Backend revokes the refresh token on logout.
- [ ] The search rank-floor fix is deployed (the mobile Search screen depends on it).
- [ ] `EXPO_PUBLIC_API_URL` (https), EXPO_PUBLIC_WEB_BASE_URL and the Google client ids are set for each EAS profile. A build without `EXPO_PUBLIC_API_URL` silently targets localhost or 10.0.2.2, and the web base URL defaults to the preview site.
- [ ] Preview builds use an https backend (Android 9 and newer block cleartext HTTP in release builds).
- [ ] Dev token sheet cannot appear in preview or production builds (compiled out by __DEV__), confirm once on a preview APK.

### 3.5 Permissions, privacy and store compliance
- [ ] `app.json` and the built manifest request no permissions beyond network access (no
      location, camera, photos, contacts or microphone), matching the Privacy Policy.
- [ ] No analytics or advertising SDK in the app. Any crash reporting is disclosed.
- [ ] Privacy Policy page covers the mobile app (secure storage, Google sign in) and its URL is
      entered in both stores.
- [ ] Apple privacy nutrition labels and the Google Data safety form completed and consistent
      with the policy.
- [ ] **Account deletion**: both stores require apps that create accounts to provide a way to
      request deletion (Apple: a path inside the app, Google: an in-app path plus a web link).
      Decide the path (a "Request account deletion" action that emails or calls a backend
      endpoint) and implement it before submission. Verify the current store wording before submitting.
- [ ] Age rating questionnaire answered (user-generated content, no ads, no purchases).
- [ ] User-generated content safeguards satisfy store review: report, block or escalate path,
      and a way to contact the developer. Reporting exists, confirm the review notes say where.

### 3.6 Product and policy decisions
- [ ] Push notifications are out of scope for the first release (in-app only). Confirm.
- [ ] Official badges: the config supports a comma-separated list of ids.
- [ ] Staff tools intentionally open the web app in the system browser and never share the session.
- [ ] Admin and moderation dashboards remain web-only.
- [x] NavigationContainer linking config exists (academiaatlas:// scheme, paths mirror the web routes).
- [ ] Universal and app links for the https URL: Android intent filters with autoVerify in app.json plus /.well-known/assetlinks.json (needs the Play signing SHA-256), iOS associatedDomains plus apple-app-site-association, all on the final domain.
- [ ] First launch with no network behaves sensibly.

### 3.7 Accessibility and quality
- [ ] iOS Dynamic Type and Android font scaling tested.
- [ ] VoiceOver and TalkBack on the main flows.
- [ ] Every icon-only button has an accessibility label.
- [ ] Focus order in the sign-in sheet, filter sheet, report sheet and comments sheet.
- [ ] Light, dark and system theme changes.
- [ ] Offline banner, retry and pull to refresh.
- [ ] Long names and titles, empty states, and 400 field errors.
- [ ] A small Android phone and a large iPhone.
- [ ] Keyboard never hides the answer composer, ask form or any sheet input (device test).
- [ ] No em dash characters ship in copy.

### 3.8 Store submission
- [ ] App Store Connect and Google Play app records created.
- [ ] Demo account and review notes provided if the store asks.
- [ ] Production build uploaded and passed internal testing.
- [ ] Phased release, then monitor crash-free sessions and API errors.
- [ ] Previous build kept available for rollback. Release tagged in git, build number in `CHANGELOG.md`.

### 3.9 Release-day smoke test
```bash
cd mobile
npm run typecheck
npx expo-doctor
npm run export:web
```
On a physical device with the production build:
- [ ] Install, sign in with Google, browse as a guest, sign out.
- [ ] Ask a question and delete it. Answer, vote, comment, mark best answer.
- [ ] Open a notification with a link and one without.
- [ ] Report content and escalate as a staff account. Lock and unlock a question as staff.
- [ ] Open moderation and admin links in the system browser.
- [ ] My reports, pages and profile tabs. Dark mode and offline copy.
- [ ] Share a question and open the shared link.

### 3.10 Owner sign-off
- [ ] Backend production URL and CORS confirmed.
- [ ] Google OAuth production clients confirmed.
- [ ] Test accounts removed or rotated, dev mode disabled.
- [ ] Store listings, screenshots and legal pages approved.
- [ ] Release build uploaded and smoke tested.

---

## 4. Cross-surface regression

- [ ] Run the full regression checklist in [TESTING.md](TESTING.md) against production: backend,
      web and mobile, with all three roles (guest, regular user, staff, admin).
- [ ] One end-to-end story: sign in on mobile, ask a question, answer it from web as another user,
      receive the notification on mobile and the email, mark best from mobile, see SOLVED on web.

## 5. Shared operations

- [ ] Error alerting for backend, web and mobile, and everyone knows where the logs are.
- [ ] Database backups configured and a restore tested.
- [ ] Email delivery limits understood, bounce and spam complaints visible.
- [ ] Production secrets rotated once before launch and stored in the password manager.
- [ ] Uptime monitoring on `/api/v1/health/` with a phone alert.
- [ ] Rollback procedures tested before launch: Vercel "Promote previous deployment" (both
      projects) on a preview, previous mobile build kept in the stores.
- [ ] Support inbox has an owner and a response routine. Abuse reporting has an owner (admins
      review reports regularly).

## 6. Launch runbook

1. Freeze changes. Tag the release in git.
2. Deploy the backend. Run section 1.7 smoke tests and 1.8 permission checks.
3. Deploy the frontend. Verify sign in, core pages and the production API connection.
4. Submit or release the mobile build. Verify sign in and core flows on a device.
5. Run section 4, the cross-surface regression and the end-to-end story.
6. Announce to the first moderators and representatives, then to students.
7. If a smoke check fails, stop the rollout and roll back only the affected surface with its
   tested procedure.

## 7. First 72 hours

- [ ] Watch error alerts, 5xx rate, 429 rate (too many may mean limits are too tight) and email bounces.
- [ ] Check the unanswered queue daily and answer or escalate.
- [ ] Review the first reports and suspensions for tone and consistency.
- [ ] Collect feedback in one place and triage into the Feature List backlogs.
- [ ] Decide hotfix versus next release for anything found. Hotfix path: branch from `main`, pull
      request, merge, verify on production.

## 8. Rollback matrix

| Surface | Rollback | Notes |
|---|---|---|
| Backend | Redeploy the previous Vercel deployment | Check migrations: a backwards-incompatible migration needs a manual plan before launch |
| Web | Vercel "Promote previous deployment" | Instant, no data change |
| Mobile | Halt the phased release, keep the previous build available, EAS Update rollback if used | A bad native build cannot be recalled from user devices, which is why the phased release matters |