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

## How a task becomes an issue

There are two ways a piece of work ends up as a claimable task, and the process is a little different depending on which one you're in.

**You found something yourself.** If you spot a bug or a small improvement while using the live app, this is genuinely welcome, you don't need to wait for someone else to notice it first.

1. Check the repo's Issues tab and search for it first, to make sure it isn't already reported.
2. If it's new, open an issue using the Bug Report or Feature Request template, whichever fits.
3. Be specific. Include the exact page or endpoint, what you expected, what actually happened, and steps to reproduce it. "Profile page looks weird" takes far longer to act on than "the name-edit form overlaps the admin badge below 400px width on /profile."
4. Post a one-line mention in the General WhatsApp group linking the issue, so it doesn't sit unseen. Something like "opened an issue for X, link: ..." is enough.
5. A maintainer will triage it: confirm it's valid, apply labels, and either leave it ready to claim or mark it `needs-decision` if it needs a call made first (see `docs/contributor-backlog.md`'s difficulty notes for what that distinction means).

You don't need permission to open an issue. You do need to wait for it to be triaged before starting work on it, a maintainer might have context that changes the scope, or it might turn out to be intended behavior rather than a bug.

**A maintainer found it or planned it.** These get created directly as issues (often pulled from `docs/contributor-backlog.md`) and posted in the Task Board group for claiming. No extra step needed from you here, just claim it, see below.

## Claiming an issue, the full process

Replying "claiming" in the WhatsApp Task Board group is step one, not the whole thing. The actual claim happens on GitHub, since that's the record that matters and the one a maintainer can act on:

1. Reply "claiming" on the task's message in the Task Board group. This reserves your spot informally and tells other contributors it's spoken for.
2. Open the linked GitHub issue and leave a comment: "I'd like to work on this."
3. Wait to be assigned. A maintainer will add you as the Assignee on the issue (visible in the right sidebar), and you'll get a GitHub notification when that happens. This is the official claim, it's what shows on your GitHub profile and what a maintainer uses as the actual source of truth for who's doing what.
4. Once you're assigned, you're clear to branch and start, see Local Setup and the branching model below.

Why bother with the GitHub step when you already claimed it in chat: assignment on GitHub is visible, permanent, and portfolio-worthy in a way a chat message isn't, and it keeps one clear source of truth instead of two systems that can quietly drift apart.

If you've claimed something and haven't been assigned within a day or so, a gentle nudge (a comment on the issue, or a note in General) is completely fine, it's not jumping the queue, it's just making sure nothing slipped through.

## Reporting a security issue instead of a bug?

If what you've found could let someone access data or accounts they shouldn't, don't open a public issue for it. See `SECURITY.md` for how to report it privately instead.

## Fork, clone, and branch

Academia uses the standard open source fork-and-PR model. You don't get direct push access to `brandnova/academia` itself, you work from your own copy (a "fork") and propose changes back via pull request. This is the normal, safe default for a project taking contributions from people the maintainer doesn't already know well, and it means you can start the moment you're assigned an issue, no waiting on anyone to grant you repository access first.

1. Click "Fork" on the GitHub repo page (top right). This creates `your-username/academia` under your own account.
2. Clone your fork, not the original:
   ```bash
   git clone https://github.com/YOUR-USERNAME/academia.git
   cd academia
   ```
3. Add the original repo as a second remote, called `upstream`, so you can pull in the latest changes:
   ```bash
   git remote add upstream https://github.com/brandnova/academia.git
   ```
4. Before starting any new task, sync your fork's `develop` with `upstream` first, so you're branching from the latest code, not a stale copy:
   ```bash
   git checkout develop
   git fetch upstream
   git merge upstream/develop
   git push origin develop
   ```
5. Create your branch:
   ```bash
   git checkout -b fix/short-description-of-the-fix
   ```

See "Local setup" below for getting the app running, then "Making your pull request" for how the branch you just created gets back to `brandnova/academia`.

If you become a regular, trusted contributor over time, you may eventually be offered direct push access to feature branches on the main repository, skipping the fork step. That's the maintainer's call as trust is established, not something to request upfront.

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

- `main` is the production branch on `brandnova/academia`. It is protected: nobody, including the maintainer, pushes to it directly. It only changes via a merge from `develop`.
- `develop` is the integration branch on `brandnova/academia`. This is what your pull requests target, always, never `main`.
- On your own fork, name your branch after the issue you're working on, for example `fix/vote-count-off-by-one` or `feat/lock-question-ui`. See "Fork, clone, and branch" above for the exact commands.

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

1. Push your branch to your fork: `git push -u origin fix/short-description-of-the-fix`.
2. On GitHub, open a pull request **from your fork's branch into `brandnova/academia`'s `develop` branch**, not `main`. When you click "New pull request" from your fork, GitHub shows a "compare across forks" option, that's the one you want.
3. Fill out the PR template, it will prompt you for what changed, why, and how you tested it.
4. Link the issue your PR closes (`Closes #12`), this is also what auto-assigns the merge credit to that issue.
5. If it's a frontend/UI change, include a before/after screenshot or short screen recording.
6. Keep it small. A PR that does one thing is far easier to review than one that does five. If you find yourself fixing something unrelated along the way, open a separate issue for it instead of bundling it in.
7. Every PR into `develop` gets an automatic Vercel preview deployment for the frontend, use it to sanity-check your own change before requesting review.
8. If your PR sits open for a while and `develop` moves on without you, sync it before requesting another review: `git fetch upstream`, then `git merge upstream/develop` on your branch, resolve anything that conflicts, and push again.

## Review and merge

The project maintainer reviews every PR. Expect comments and requested changes, that's normal and not a judgment on your ability, it's how every PR on every serious project gets merged. Once approved, PRs are squash-merged into `develop` so the history stays one commit per change.

`develop` is merged into `main` (triggering the live production deploy) periodically by the maintainer, once a batch of changes has been confirmed working together, not automatically on every merge.

## Code style

- **Backend:** follow the conventions already established in `BUILD_LOG_BACKEND.md`'s "Conventions Established" section (for example: `is_admin` not `is_staff` for platform permissions, targeted `.update()` calls instead of `.save()` for aggregate fields, deferred imports for cross-app serializer references). If you're not sure whether something is a convention or a one-off choice, ask.
- **Frontend:** follow the patterns already established in `BUILD_LOG_FRONTEND.md` (for example: `clientFetch`/`apiFetch` for API calls, the existing loading/empty/error/populated state pattern, no third-party component library).
- No em dash character in any documentation content (docs, BUILD_LOG, changelog, PR descriptions if you're writing docs-adjacent content). Use commas, colons, or periods instead. This applies to the project's written documentation, not a requirement for code comments or casual chat.

## Licensing your contribution

By opening a pull request, you agree that your contribution is licensed under the project's MIT License (see `LICENSE`), same as the rest of the codebase. This is a standard, lightweight expectation on virtually every open source project, not something specific to Academia, and it's what makes it possible for your merged code to be freely used and built on alongside everyone else's.

## Recognition

Every merged contribution credits you, both through GitHub's own contributor graph and in the project's public materials. See `GOVERNANCE.md` for the full recognition policy.

## Questions

Ask in the project chat before spending time guessing. A five-minute question is always cheaper than an hour of rework.
