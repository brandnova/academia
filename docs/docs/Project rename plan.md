# Project rename: external follow-up

The in-repository Academia Atlas rename pass is complete. Remaining actions
require access to hosting, identity-provider, repository, or release settings:

- Rename `brandnova/academia` to `brandnova/academia-atlas`; update its
  description, topics, social preview, and avatar.
- Set the Vercel web project's Root Directory to `web`. Confirm the backend
  project's Root Directory remains `backend`.
- Update the Google Cloud OAuth consent-screen name and logo. Change authorized
  origins only if the product domain changes.
- After renaming the repository, verify GitHub Pages and publish MkDocs at
  `https://brandnova.github.io/academia-atlas/`.
- Update local `origin` and fork `upstream` remotes after the GitHub rename.
- Check PythonAnywhere WSGI, source paths, and scheduled jobs for old checkout
  paths; update only if any are present.
- After merge, promote `develop` to `main` and verify web, API, docs, and mobile
  build configurations. Tag the release if desired.

The task checklist is maintained in `gitignore/Next.md`.
