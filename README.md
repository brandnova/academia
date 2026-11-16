# Academia

![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-live-brightgreen)
![Backend](https://img.shields.io/badge/backend-Django%20REST%20Framework-092E20)
![Frontend](https://img.shields.io/badge/frontend-Next.js-black)
![Docs](https://img.shields.io/badge/docs-gh--pages-blue)
![Contributions](https://img.shields.io/badge/contributions-welcome-orange)

Academia is a school-focused academic knowledge platform that helps students find answers, solve academic problems, and preserve institutional knowledge in a searchable, organized way. Think Stack Overflow or Quora, but organized by tertiary school and department, and focused on providing reliable answers and info on academic processes with things like GPA calculation, clearance, registration, SIWES, and so on.

Academia is launching first with Nigerian tertiary institutions, where the problem it solves originated. The platform is built to extend to institutions in other countries as the model proves out, see project-plan.md's Product Vision for more.

The platform is not a social feed. There is no engagement-driven scrolling or vanity metrics. The measure of success is simple: did this person find, or leave, an answer that helps someone else later.

**Academia is a standalone product built and maintained under the [Brand Nova](#brand--ownership) umbrella.**

---

## Live

- **App:** https://academia-prvw.vercel.app
- **API:** production on Vercel (Supabase Postgres, Upstash Redis), documented in full below. A PythonAnywhere deployment remains as the preview and testing backend
- **Docs:** https://brandnova.github.io/academia/

## Repository Structure

```
Academia/
├── docs/           - Project documentation (MkDocs, published to GitHub Pages)
├── backend/        - Django REST Framework API
├── academia-frontend/       - Next.js application
├── academia-mobile/         - React Native (Expo) mobile client
├── CHANGELOG.md    - Durable project history, grouped by phase and date
├── CONTRIBUTING.md - How to contribute, setup, branching, PR process
├── CODE_OF_CONDUCT.md
├── GOVERNANCE.md   - Ownership, decision-making, and recognition policy
├── LICENSE
├── SECURITY.md     - Notice on how to report security issues
└── README.md       - This file
```

## Documentation

The [documentation map](docs/docs/index.md) is the docs home and entry point
for project plans, implementation maps, API and data references, testing and
deployment guidance. The repository-root `CHANGELOG.md` is canonical and is
included in the published docs site.

**Docs set:** see the [documentation map](docs/docs/index.md) for the maintained
docs set and what belongs in each document.

## Tech Stack

**Backend:** Django 6.0.6, Python 3.12, PostgreSQL (Supabase), Django REST Framework, JWT auth (SimpleJWT) via Google OAuth (verified directly against Google's userinfo endpoint), Redis caching with an automatic local-memory fallback, django-cors-headers, whitenoise for static files. Deployed on PythonAnywhere.

**Frontend:** Next.js (App Router), JavaScript, deployed on Vercel, consuming the backend purely as a versioned JSON API (`/api/v1/`). Tailwind v4 (CSS-first config), no third-party component library, lucide-react for icons.

**Mobile:** React Native 0.88 via Expo SDK 58, TypeScript, React Navigation 7, expo-auth-session. A standalone Android/iOS user client that mirrors the v2 mobile design concept and consumes the same `/api/v1/` contract. Staff web tools hand off to the site; the mobile app does not include admin dashboards. Setup, screenshots and current gaps are in **[academia-mobile/README.md](academia-mobile/README.md)**.

Production on Vercel, with PythonAnywhere kept as the preview and testing deployment.

## Project Status

**Backend:** complete. All 15 planned MVP phases plus three post-MVP passes (production readiness, URL/ID ergonomics, API completeness) are built, tested, and live.

**Frontend:** MVP complete (Phases 0 through 15) and live on Vercel. A polish phase (listed in `feature-list.md` and `BUILD_LOG_FRONTEND.md`) is open for contribution, see below.

**Mobile:** v2 user client implemented: guest browsing, Google sign-in, markdown Q&A, voting, best answers, comments, notifications, profiles, my reports, pages, staff lock and escalate controls, and web handoff. Moderation and admin dashboards remain web-only. Remaining gaps are listed in `academia-mobile/README.md`.

Full phase-by-phase history is in `CHANGELOG.md`. Current architectural state
and conventions are in the backend, frontend and mobile build logs.

## Contributing

Academia is now open to outside contributors. If you'd like to fix a small bug, pick up a "good first issue," or suggest an improvement, start with **[CONTRIBUTING.md](CONTRIBUTING.md)**. It covers local setup for the backend, frontend and mobile client, our branching model, commit conventions, and how a pull request gets reviewed and merged.

Please also read **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** before participating.

## Brand & Ownership

Academia is conceived, founded, and maintained by its original developer as a standalone product under the Brand Nova umbrella. The Brand Nova name, the Academia name, and associated branding are not covered by the code license below and remain the property of the founder. See **[GOVERNANCE.md](GOVERNANCE.md)** for the full explanation of how ownership, decision-making, and contributor recognition work on this project.

All contributors are credited for their work, both on GitHub's own contributor graph and in **[CONTRIBUTORS.md](CONTRIBUTORS.md)**, see GOVERNANCE.md for specifics.

## Getting Started (Backend)

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your local values
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo_data   # optional, populates realistic demo content
# add --clear to reset, --admin-email <email> to promote a real account to admin
# creates 3 fixed test users (admin/staff/regular) with predictable emails,
# run: eval "$(python manage.py print_test_tokens)" to get instant JWTs for
# all three without going through Google OAuth (local dev only, requires DEBUG=True)
python manage.py runserver
```

See the [backend map](docs/docs/backend-map.md) for backend architecture and
file responsibilities, and the [API contract](docs/docs/api-contract.md) for
the Google OAuth implementation guide and available endpoints.

## Getting Started (Frontend)

```bash
cd academia-frontend
npm install
cp .env.example .env.local   # fill in your local values, including the backend API base URL
npm run dev
```

The frontend expects the backend running locally (or points at a deployed
backend URL via env var). See the [design guide](docs/docs/design-guide.md) for
shared design principles and [frontend map](docs/docs/frontend-map.md) for the
frontend implementation.

## Getting Started (Mobile)

Requirements: Node 22.13+, 24.3+ or 26+ and npm. Node 25 is outside React
Native 0.88's supported engine range.

```bash
cd academia-mobile
cp .env.example .env
npm install
npm start
```

Press `a`, `i` or `w`, or scan the QR code with Expo Go. For LAN testing,
start the backend with `make run-lan` from `backend/` and use
`npx expo start -c --lan` from `academia-mobile/`. See
[academia-mobile/README.md](academia-mobile/README.md) for API host and Google
sign-in configuration, and [regression testing](docs/docs/TESTING.md).

For the browser preview use `npx expo start --web`. Mobile checks are
`npm run typecheck`, `npm run export:web` and `npx expo-doctor`.

## Documentation Tooling

If your contribution includes changes to the project documentation under `docs/`, install the documentation tooling dependencies before working on those changes:

```bash
pip install -r requirements-docs.txt
```

This installs the MkDocs toolchain used to build and preview the documentation locally, including the Material theme and documentation plugins.

Once installed, you can run the local documentation server from the project root:

```bash
mkdocs serve
```

MkDocs will start a local development server and watch the `docs/` directory for changes, allowing you to preview documentation updates before submitting your contribution.

The documentation dependencies are kept separate from the application's main `requirements.txt` because they are only needed when working on or building the project documentation.


## License

The Academia codebase is released under the [MIT License](LICENSE). The Academia and Brand Nova names and branding are excluded from this license, see [GOVERNANCE.md](GOVERNANCE.md).

---

*Academia aims to become the most useful destination for students seeking answers to academic questions.*
