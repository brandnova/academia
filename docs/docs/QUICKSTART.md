# Quick Workflow

This is the short version of CONTRIBUTING.md, the exact steps for going from
"I want to help" to "my change is live." Keep this open in a tab the first
few times, it'll be second nature after that.

## Found a bug on your own, before you even get to step 1?

Search the repo's Issues tab first to check it isn't already reported. If
it's new, open one using the Bug Report template, be specific (exact page,
what you expected, what happened), then drop a one-line mention in General
with the link. A maintainer will triage it before it's ready to claim.

Security issue instead of a regular bug? Don't post it anywhere public, see
SECURITY.md.

## 1. Claim a task

Tasks are posted in the WhatsApp Task Board group, one per message, each
linking to a GitHub issue. Reply "claiming" on the task's message before you
start. This avoids two people working on the same thing.

## 2. Confirm the claim on GitHub

Replying in WhatsApp isn't the official claim, GitHub is. Open the linked
issue and comment "I'd like to work on this." Wait until a maintainer adds
you as the Assignee (you'll get a GitHub notification), that's your actual
green light to start. If nobody's assigned it within a day or so, a friendly
nudge on the issue is fine.

## 3. Fork and get the code

You work from your own fork, not the main repo directly, that's the normal
model here (see CONTRIBUTING.md's "Fork, clone, and branch" for the full
explanation of why).

1. Click "Fork" on the GitHub repo page.
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/academia.git
   cd academia
   git remote add upstream https://github.com/brandnova/academia.git
   ```
3. Sync and branch:
   ```bash
   git checkout develop
   git fetch upstream
   git merge upstream/develop
   git checkout -b fix/short-description
   ```

Use `fix/...` for bug fixes, `feat/...` for small features. Match the name to
what the issue is about, for example `fix/profile-mobile-layout`.

## 4. Set up locally

See README.md's "Getting Started" section for backend and frontend setup, it
has the exact commands. Ask in General if anything doesn't work, environment
setup problems are extremely common and not a reflection on you.

## 5. Make your change

Keep it scoped to exactly what the issue describes. Notice something else
that's broken while you're in there? Great, that's a new issue, not something
to fix in the same PR.

## 6. Commit and push to your fork

```bash
git add .
git commit -m "fix: short description of what changed"
git push -u origin fix/short-description
```

`fix:` for bug fixes, `feat:` for features, `docs:` for documentation changes.

## 7. Open the pull request

On GitHub, open a PR **from your fork's branch into `brandnova/academia`'s
`develop` branch** (not `main`), you'll see a "compare across forks" option
when you start a new PR from your fork. Fill out the template, most
importantly:
- `Closes #<issue number>` so it links back automatically
- A screenshot if it's a visual change
- How you tested it

Then post the PR link back in the Task Board group, reply on your original
claim message so it's easy to find.

## 8. Review

Nova (or another maintainer) reviews it. Expect comments and requested
changes, completely normal, not a sign you did something wrong. Push more
commits to the same branch to address feedback, they'll show up on the same
PR automatically. If it sits a while and `develop` moves on, sync your branch
with `git fetch upstream` and `git merge upstream/develop` before asking for
another look.

## 9. Merge

Once approved, it gets squash-merged into `develop`. You'll see it move to
Done on the project board, and a batch of `develop` changes gets released to
production periodically. You're now a credited Academia contributor, visible
on the GitHub contributor graph and in the project's recognition materials.

## If you get stuck

Ask in General before spending more than 20 to 30 minutes stuck on something
environmental (setup, tooling, git). Questions there help the next person
too, so there's no such thing as a bad question.
