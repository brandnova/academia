# Academia Atlas Mobile

Expo (React Native, TypeScript) user client for Academia Atlas on iOS and Android. It calls the
Django API at `/api/v1/` directly, with tokens in secure storage. Staff moderation and admin tools stay
on the web and open in the system browser.

Where things live: [mobile-map.md](../docs/docs/mobile-map.md). What it can do and what is missing:
[feature-list.md](../docs/docs/feature-list.md). Design rules: [design-guide.md](../docs/docs/design-guide.md).
Regression checks: [TESTING.md](../docs/docs/TESTING.md). Launch work: [DEPLOYMENT_CHECKLIST.md](../docs/docs/DEPLOYMENT_CHECKLIST.md).

## Run it

Node 22.13+, 24.3+ or 26+ (Node 25 is outside React Native 0.88's engine range).

    cp .env.example .env
    npm install
    npx expo start -c            # Expo Go on a phone, or press w for the browser preview

The API host is derived from the Metro host on port 8000. For a phone on Wi-Fi start the backend with
`make run-lan` from `backend/`. Or run the default server and use `adb reverse tcp:8000 tcp:8000` with
`EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1`. Or point `EXPO_PUBLIC_API_URL` at a deployed https backend.

Checks: `npm run typecheck`, `npx expo-doctor`, `npm run export:web`.

## Environment

`.env` configures local Expo runs only. EAS builds read the `env` block of the profile in `eas.json`,
because `.env` is git-ignored. All values are public, no client secret exists anywhere.

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | API base including `/api/v1`. Required in builds |
| `EXPO_PUBLIC_WEB_BASE_URL` | Web app used for share links and staff handoff |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Web OAuth client (Expo web and Expo Go) |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Android OAuth client: package plus the SHA-1 of the signing key |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | iOS OAuth client |
| `EXPO_PUBLIC_PLATFORM_ACCOUNT_ID` | User ids of the official account (per database) |
| `EXPO_PUBLIC_SUPPORT_EMAIL` | Shown to suspended users |
| `EXPO_PUBLIC_DEV_MODE` | Development builds only: Developer access sheet |

Google setup: create Web, Android (package `com.brandnova.academiaatlas`, SHA-1 from
`eas credentials -p android`, custom URI scheme enabled) and later iOS clients in Google Cloud, add test
users while the consent screen is in Testing, and add a second Android client for the Play signing key.

## Builds

    eas build --profile preview --platform android        # internal APK
    eas build --profile development --platform android   # dev client
    eas build --profile production --platform android     # store build

Icons and splash assets are generated from `brand/src` by `scripts/make-brand-assets.sh`.