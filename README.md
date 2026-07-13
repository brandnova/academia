# Academia

Academia is a school-focused academic knowledge platform that helps students find answers, solve academic problems, and preserve institutional knowledge in a searchable, organized way. Think Stack Overflow, but organized by Nigerian tertiary school and department instead of programming tags, and focused on things like GPA calculation, clearance, registration, and SIWES, not code.

The platform is not a social feed. There's no engagement-driven scrolling or vanity metrics. The measure of success is simple: did this person find, or leave, an answer that helps someone else later.

## Repository Structure

```
Academia/
├── docs/                 - Project documentation (MkDocs, published to GitHub Pages)
├── backend/               - Django REST Framework API
├── academia-frontend/      - Next.js application
├── CHANGELOG.md            - Durable project history, grouped by phase and date
└── README.md               - This file
```

## Documentation

- **project-plan.md** - vision, principles, roles, lifecycle rules
- **feature-list.md** - what's built, what's planned for later
- **database-schema.md** - models, relationships, constraints
- **api-contract.md** - the full API contract: every endpoint, request/response shapes, error formats, auth flow, rate limits
- **project-overview.md** - frontend-facing guide: sitemap, design philosophy, visual direction, component list, required page states
- **BUILD_LOG_BACKEND.md** / **BUILD_LOG_FRONTEND.md** - current architectural state and conventions for each side
- **CHANGELOG.md** / **docs/changelog.md** - durable history, one entry per phase plus docs-sync entries

Start with `project-plan.md` and `project-overview.md` for the "why," `api-contract.md` and `database-schema.md` for the "how the two sides talk to each other."

## Tech Stack

**Backend:** Django 6.0.6, Python 3.12, PostgreSQL, Django REST Framework, JWT auth (SimpleJWT) via Google OAuth (verified directly against Google's userinfo endpoint, not a heavier social-auth library), Redis caching with an automatic local-memory fallback, django-cors-headers, whitenoise for static files.

**Frontend:** Next.js (App Router), JavaScript (no TypeScript), Tailwind v4 (CSS-first config, no `tailwind.config.js`), `lucide-react` for icons, no other UI or component library.

**Architecture note:** the browser never talks to Django directly. The frontend's own Next.js Route Handlers proxy every backend call server-side, holding the JWT pair as httpOnly cookies and owning the token refresh lifecycle, the backend's `Authorization: Bearer` contract is exactly as documented in `api-contract.md`, it's just the frontend's proxy layer attaching it rather than client-side JS.

## Getting Started

### Backend

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

### Frontend

```bash
cd academia-frontend
npm install
cp .env.example .env.local   # fill in your local values
npm run dev
```

Both need to be running locally for the app to work end to end, the frontend has nothing to render without the API.

## Environment Variables

**Backend** (`backend/.env`): see `backend/.env.example` for the full list, database credentials, `SECRET_KEY`, Google OAuth settings, Redis URL (optional, falls back to local memory cache if unset).

**Frontend** (`academia-frontend/.env.local`):

| Variable | Notes |
|---|---|
| `BACKEND_API_URL` | Server-only, never exposed to the browser, e.g. `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | Used to build absolute URLs for internal server-side fetches |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | From Google Cloud Console, needs `http://localhost:3000` under Authorized JavaScript origins for local dev |

## Auth Flow

Google Identity Services client-side → access token handed to `POST /api/v1/auth/google/` → backend verifies it against Google's own userinfo endpoint and returns a JWT pair → the frontend's Route Handler proxy stores that pair as httpOnly cookies and attaches `Authorization: Bearer` to every subsequent backend call itself. Full step-by-step frontend implementation details are in `api-contract.md`'s "How Google Auth Works" section, that's the authoritative source for anyone integrating against this API directly, this README is just the map.

## Deployment

- **Backend:** PythonAnywhere
- **Frontend:** Vercel
- **Database:** Supabase (Postgres)

The frontend currently runs on Vercel's own `*.vercel.app` domain; a custom domain is a later, non-blocking swap.
