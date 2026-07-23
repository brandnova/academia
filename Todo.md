# 1. Syncing your local project with develop

```bash
# make sure you're on develop and it's clean
git checkout develop
git status              # should say "nothing to commit, working tree clean"

# pull in what other contributors have merged
git pull origin develop

# create your feature branch off the now-updated develop
git checkout -b feature/markdown-editor-and-local-setup
```

One habit worth building now: always branch from a freshly-pulled develop, never from whatever your local develop happened to be before you pulled, that's the most common source of "why is my PR showing unrelated changes" confusion later.


