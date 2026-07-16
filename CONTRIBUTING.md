# Contributing to Academia

Thanks for wanting to work on Academia. This document is written for people who may not have contributed to an open source project before, so it spells things out rather than assuming prior experience. If something here is unclear, ask in the project chat rather than guessing, that's what it's there for.

## What kind of contributions we're looking for right now

Academia's MVP is complete and live. At this stage, we are deliberately working in **small, self-contained pieces**: one bug fix, one small feature, one polish item at a time. We are not taking on large architectural changes or new major features from outside contributors yet, that keeps things manageable while the team is still learning how to work together.

Good places to start:
- Issues labeled `good-first-issue`
- Items pulled from `feature-list.md`'s open checkboxes or `BUILD_LOG_FRONTEND.md` / `BUILD_LOG_BACKEND.md`'s "Known Deviations" and "Planned, Not Yet Scheduled" sections
- Anything labeled `bug`

If you want to work on something that isn't already an issue, open one first and describe what you'd like to do before writing code. This avoids two people working on the same thing, and lets us confirm the approach fits the project's documented design before time is spent on it.

## Before you start

1. Read `project-plan.md`, `feature-list.md`, `database-schema.md`, and `api-contract.md` (backend) or `project-overview.md` (frontend), whichever is relevant to what you're working on. These are the source of truth for how the project is supposed to work. If your task requires deviating from them, say so in the issue before implementing it.
2. Read `CODE_OF_CONDUCT.md`.
3. Comment on the issue you want to work on and wait for it to be assigned to you, so two people don't duplicate effort.

## Local setup

### Backend (Django REST Framework)

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo_data
python manage.py runserver
```

### Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Point your local frontend's env var at either your local backend or the deployed one, whichever your task needs.

## Branching model

- `main` is the production branch. It is protected: nobody, including the maintainer, pushes to it directly. It only changes via a merge from `develop`.
- `develop` is the integration branch. This is what you branch from and what your pull requests target.
- Name your branch after the issue you're working on, for example `fix/vote-count-off-by-one` or `feat/lock-question-ui`.

```bash
git checkout develop
git pull origin develop
git checkout -b fix/short-description-of-the-fix
```

## Commit messages

We use a lightweight version of [Conventional Commits](https://www.conventionalcommits.org/), it makes the history easy to scan and doubles as good practice if you haven't used it before.

```
fix: correct off-by-one error in vote count display
feat: wire up question lock control to admin/rep/moderator view
docs: fix broken link in api-contract.md
chore: bump lucide-react version
```

Keep the first line under about 70 characters. Add more detail in the commit body if the change needs explaining.

## Making your pull request

1. Push your branch and open a PR (Pull Request) **against `develop`**, not `main`.
2. Fill out the PR template, it will prompt you for what changed, why, and how you tested it.
3. Link the issue your PR closes (`Closes #12`).
4. If it's a frontend/UI change, include a before/after screenshot or short screen recording.
5. Keep it small. A PR that does one thing is far easier to review than one that does five. If you find yourself fixing something unrelated along the way, open a separate issue for it instead of bundling it in.
6. Every PR into `develop` gets an automatic Vercel preview deployment for the frontend, use it to sanity-check your own change before requesting review.

## Review and merge

The project maintainer reviews every PR. Expect comments and requested changes, that's normal and not a judgment on your ability, it's how every PR on every serious project gets merged. Once approved, PRs are squash-merged into `develop` so the history stays one commit per change.

`develop` is merged into `main` (triggering the live production deploy) periodically by the maintainer, once a batch of changes has been confirmed working together, not automatically on every merge.

## Code style

- **Backend:** follow the conventions already established in `BUILD_LOG_BACKEND.md`'s "Conventions Established" section (for example: `is_admin` not `is_staff` for platform permissions, targeted `.update()` calls instead of `.save()` for aggregate fields, deferred imports for cross-app serializer references). If you're not sure whether something is a convention or a one-off choice, ask.
- **Frontend:** follow the patterns already established in `BUILD_LOG_FRONTEND.md` (for example: `clientFetch`/`apiFetch` for API calls, the existing loading/empty/error/populated state pattern, no third-party component library).
- No em dash character in any documentation content (docs, BUILD_LOG, changelog, PR descriptions if you're writing docs-adjacent content). Use commas, colons, or periods instead. This applies to the project's written documentation, not a requirement for code comments or casual chat.

## Recognition

Every merged contribution credits you, both through GitHub's own contributor graph and in the project's public materials. See `GOVERNANCE.md` for the full recognition policy.

## Questions

Ask in the project chat before spending time guessing. A five-minute question is always cheaper than an hour of rework.
