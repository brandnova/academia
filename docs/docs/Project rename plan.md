# Project-wide Academia Atlas naming plan

## Naming decisions

- Product display name: **Academia Atlas**; use **A-Atlas** only where the
  shorter form is intentionally appropriate.
- Repository name: `academia-atlas`.
- Frontend directory: `academia-frontend/` → `web/`.
- Mobile directory: `academia-mobile/` → `mobile/`.
- Backend directory and product naming: leave `backend/` unchanged; it is
  already correctly named.
- Mobile EAS slug: `academia-atlas-mobile`.
- Before implementation, confirm any platform-specific app identifiers and
  URL/domain changes rather than deriving new values from the display name.

## Execution plan

### 1. Inventory and prepare

- Search the whole repository for current and legacy product names, directory
  paths, repository URLs, app identifiers, EAS project/slug values, asset
  references, and deployment or OAuth configuration.
- Record each occurrence by scope: repository root, frontend, mobile, or
  backend. Separate user-facing labels from machine identifiers and external
  service settings.
- Inspect the root logo JPEG and identify which existing web/mobile assets
  and references would need an approved Atlas-branded replacement.
- Confirm target app identifiers, domains, OAuth redirects, EAS project
  ownership, and deployment names before changing those values.

### 2. Rename and update the repository root

- Rename the GitHub repository to `academia-atlas` at the agreed point in the
  release sequence; update local remotes, badges, clone/setup instructions,
  links, workflows, and external integrations that reference the old URL.
- Change root-level project descriptions and references to the approved
  Academia Atlas/A-Atlas names.
- Keep shared scripts, CI workflows, Docker/build configuration, and
  documentation paths working after the directory moves.
- Retain the root logo JPEG as the source asset unless a replacement is
  explicitly approved; update consumers only when new web/mobile assets are
  ready.

### 3. Update the frontend

- Rename `academia-frontend/` to `web/`.
- Update frontend package metadata, page titles, visible branding, favicons
  and logo references to the approved display name and assets.
- Update imports, scripts, CI/build/deployment paths, environment examples,
  documentation links, and any root-level commands that use the old path.
- Review frontend app identifiers and URLs individually; change only those
  confirmed as part of the naming rollout.

### 4. Update mobile

- Rename `academia-mobile/` to `mobile/`.
- Update app display names, icons/splash assets, package metadata, EAS
  configuration and slug to `academia-atlas-mobile`.
- Review Android application ID, iOS bundle identifier, OAuth redirect
  schemes, deep links, push-notification configuration, and store metadata;
  preserve identifiers unless a coordinated migration is explicitly intended.
- Update scripts, CI/build/submission workflows, environment examples, and
  root references to the old mobile path.

### 5. Preserve backend naming and interfaces

- Do not rename `backend/` or change backend product identifiers solely for
  branding consistency.
- Update references to frontend/mobile paths or public product labels in
  backend configuration only when required for the coordinated rollout.
- Check API base URLs, OAuth callbacks, CORS/allowed-host settings, and
  deployment configuration against the confirmed web/mobile URLs.

### 6. Validate and release

- Search again for old names, paths, repository URLs, and stale asset
  references; review each remaining match rather than doing blind replacement.
- Run root-level checks and the frontend and mobile lint, test, and production
  build commands from their new paths.
- Verify EAS configuration, OAuth sign-in/redirects, deep links, API access,
  deployment workflows, and the rendered branding on web and mobile.
- Roll out external changes in a coordinated order: repository/remotes,
  directory and workflow updates, service identifiers/URLs, then release and
  store metadata. Confirm rollback steps for any external identifier changes.
