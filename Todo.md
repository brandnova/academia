# 1. Full PR process (develop → branch → merge)

One habit worth building now: always branch from a freshly-pulled develop, never from whatever your local develop happened to be before you pulled, that's the most common source of "why is my PR showing unrelated changes" confusion later.
Here's the complete run-through, in order, so you can just execute it once everything above checks out:

## Checkout to develop, pull from origin and create a branch for your feature or fix
```bash
git checkout develop
git status
git pull origin develop
git checkout -b feature/new-feature-branch

# Implement your code... And then:
git add -A
git commit -m "feat: New feature added and commited"
git push -u origin feature/new-feature-branch
```

# 2. Cut a release: (develop → main)

Ensure there are no existing local changes that are not yet commited and pushed to the develop branch.

## Checkout to main, pull updates from origin, merge with develop, and push to main.
```bash
git checkout main
git pull origin main
git merge develop   # or open a PR develop -> main if you want it reviewable, same idea
git push origin main
```
This will merge the main branch with the develop branch after a number of consecutive PRs have been completed and merged to develop. It will roll them up at once and push them to main for production deployment.

## Update docs
This will ensure that the docs updates come from the main branch and not the develop branch

```bash
git checkout main
git status
mkdocs build
mkdocs gh-deploy
```

This will ensure that al docs updates are synced from the main branch and not the develop branch.


TODO=============
