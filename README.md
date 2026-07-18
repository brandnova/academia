# Academia

![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-live-brightgreen)
![Backend](https://img.shields.io/badge/backend-Django%20REST%20Framework-092E20)
![Frontend](https://img.shields.io/badge/frontend-Next.js-black)
![Docs](https://img.shields.io/badge/docs-gh--pages-blue)
![Contributions](https://img.shields.io/badge/contributions-welcome-orange)

Academia is a school-focused academic knowledge platform that helps students find answers, solve academic problems, and preserve institutional knowledge in a searchable, organized way. Think Stack Overflow, but organized by Nigerian tertiary school and department instead of programming tags, and focused on things like GPA calculation, clearance, registration, and SIWES, not code.

The platform is not a social feed. There is no engagement-driven scrolling or vanity metrics. The measure of success is simple: did this person find, or leave, an answer that helps someone else later.

**Academia is a standalone product built and maintained under the [Brand Nova](#brand--ownership) umbrella.**

---

## Live

- **App:** https://academia-prvw.vercel.app/
- **API:** hosted on PythonAnywhere, documented in full below
- **Docs:** https://brandnova.github.io/academia/

## Repository Structure

```
Academia/
├── docs/           - Project documentation (MkDocs, published to GitHub Pages)
├── backend/        - Django REST Framework API
├── academia-frontend/       - Next.js application
├── CHANGELOG.md    - Durable project history, grouped by phase and date
├── CONTRIBUTING.md - How to contribute, setup, branching, PR process
├── CODE_OF_CONDUCT.md
├── GOVERNANCE.md   - Ownership, decision-making, and recognition policy
├── LICENSE
├── SECURITY.md     - Notice on how to report security issues
└── README.md       - This file
```

## Documentation

The project is documented in four core documents plus supporting logs, all under `docs/` and mirrored as the frontend-facing guide:

- **project-plan.md** - vision, principles, roles, lifecycle rules
- **feature-list.md** - what's built, what's planned for later
- **database-schema.md** - models, relationships, constraints
- **api-contract.md** - the full API contract: every endpoint, request/response shapes, error formats, auth flow, rate limits
- **project-overview.md** - frontend-facing guide: sitemap, design philosophy, visual direction, component list, required page states
- **BUILD_LOG_BACKEND.md** / **BUILD_LOG_FRONTEND.md** - short-term working memory of current build state
- **CHANGELOG.md** / **docs/changelog.md** - durable history, one entry per phase plus docs-sync entries
- **SECURITY.md** - Guidelines on reporting issues related to security

If you're contributing, these documents are the source of truth. Any deviation from them should be flagged in an issue or PR discussion before it's implemented.

## Tech Stack

**Backend:** Django 6.0.6, Python 3.12, PostgreSQL (Supabase), Django REST Framework, JWT auth (SimpleJWT) via Google OAuth (verified directly against Google's userinfo endpoint), Redis caching with an automatic local-memory fallback, django-cors-headers, whitenoise for static files. Deployed on PythonAnywhere.

**Frontend:** Next.js (App Router), JavaScript, deployed on Vercel, consuming the backend purely as a versioned JSON API (`/api/v1/`). Tailwind v4 (CSS-first config), no third-party component library, lucide-react for icons.

## Project Status

**Backend:** complete. All 15 planned MVP phases plus three post-MVP passes (production readiness, URL/ID ergonomics, API completeness) are built, tested, and live.

**Frontend:** MVP complete (Phases 0 through 15) and live on Vercel. A polish phase (listed in `feature-list.md` and `BUILD_LOG_FRONTEND.md`) is open for contribution, see below.

Full phase-by-phase history is in `CHANGELOG.md`. Current architectural state and conventions are in `BUILD_LOG_BACKEND.md` and `BUILD_LOG_FRONTEND.md`.

## Contributing

Academia is now open to outside contributors. If you'd like to fix a small bug, pick up a "good first issue," or suggest an improvement, start with **[CONTRIBUTING.md](CONTRIBUTING.md)**. It covers local setup for both the backend and frontend, our branching model, commit conventions, and how a pull request gets reviewed and merged.

Please also read **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** before participating.

## Brand & Ownership

Academia is conceived, founded, and maintained by its original developer as a standalone product under the Brand Nova umbrella. The Brand Nova name, the Academia name, and associated branding are not covered by the code license below and remain the property of the founder. See **[GOVERNANCE.md](GOVERNANCE.md)** for the full explanation of how ownership, decision-making, and contributor recognition work on this project.

All contributors are credited for their work, both on GitHub's own contributor graph and in project materials, see GOVERNANCE.md for specifics.

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
python manage.py runserver
```

See `api-contract.md` for the full Google OAuth frontend implementation guide and every available endpoint.

## Getting Started (Frontend)

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in your local values, including the backend API base URL
npm run dev
```

The frontend expects the backend running locally (or points at a deployed backend URL via env var). See `project-overview.md` for the sitemap, design system, and page states every screen needs to handle.

## License

The Academia codebase is released under the [MIT License](LICENSE). The Academia and Brand Nova names and branding are excluded from this license, see [GOVERNANCE.md](GOVERNANCE.md).

---

*Academia aims to become the most useful destination for students seeking answers to academic questions.*
