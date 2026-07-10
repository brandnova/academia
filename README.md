# Academia

Academia is a school-focused academic knowledge platform that helps students find answers, solve academic problems, and preserve institutional knowledge in a searchable, organized way. Think Stack Overflow, but organized by Nigerian tertiary school and department instead of programming tags, and focused on things like GPA calculation, clearance, registration, and SIWES, not code.

The platform is not a social feed. There's no engagement-driven scrolling or vanity metrics. The measure of success is simple: did this person find, or leave, an answer that helps them or someone else later.

## Repository Structure

```
Academia/
├── docs/           - Project documentation (MkDocs, published to GitHub Pages)
├── backend/        - Django REST Framework API
├── frontend/       - Next.js application
├── CHANGELOG.md    - Durable project history, grouped by phase and date
└── README.md       - This file
```

## Documentation

The project is documented in four core documents plus supporting logs, all under `docs/` and mirrored as the frontend-facing guide:

- **project-plan.md** - vision, principles, roles, lifecycle rules
- **feature-list.md** - what's built, what's planned for later
- **database-schema.md** - models, relationships, constraints
- **api-contract.md** - the full API contract: every endpoint, request/response shapes, error formats, auth flow, rate limits
- **project-overview.md** - frontend-facing guide: sitemap, design philosophy, visual direction, component list, required page states
- **BUILD_LOG_BACKEND.md** / **BUILD_LOG_FRONTEND.md** - short-term working memory of current build state for both backend and frontend
- **CHANGELOG.md** / **docs/changelog.md** - durable history, one entry per phase plus docs-sync entries

## Tech Stack

**Backend:** Django 6.0.6, Python 3.12, PostgreSQL, Django REST Framework, JWT auth (SimpleJWT) via Google OAuth (verified directly against Google's userinfo endpoint), Redis caching with an automatic local-memory fallback, django-cors-headers, whitenoise for static files.

**Frontend:** Next.js, consuming the backend purely as a versioned JSON API (`/api/v1/`). Full custom Tailwind, no third-party component library.

## Development Status

**Backend: complete.** All 15 planned MVP phases (authentication, schools, departments, hubs, questions, tags, answers, voting, comments, best-answer lifecycle, notifications, search, reports/moderation, role assignments, admin tools) are built, tested, and confirmed working, plus a production-readiness pass (CORS, Redis caching, rate limiting, structured logging, health checks) and a URL/ID ergonomics pass (slugs for schools and questions, clean validation errors for malformed IDs).

**Frontend: In process** using Next.js.

Full phase-by-phase history is in `CHANGELOG.md`. Current architectural state and conventions are in `BUILD_LOG.md`.

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
