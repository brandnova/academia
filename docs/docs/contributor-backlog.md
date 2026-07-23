# Contributor Backlog (Internal)

This file is not part of the documented product spec, `feature-list.md` remains
the source of truth for that. This is a working backlog, groomed and owned by
Mr Nova, used to stage small, atomic tasks before they're promoted into GitHub
issues and handed to a contributor. Items here are deliberately broken down
smaller than anything in `feature-list.md`, small enough to be done in one
sitting by someone new to the codebase.

**How to use this:** pick an item, copy its content into a new GitHub issue
using the bug or feature template, attach the suggested label, and either
assign it to a specific person or leave it unassigned in the pool for anyone
to claim. Check it off here once the issue is created, so this file always
reflects what's still unstaged.

Legend: `good-first-issue` = safe for a brand-new contributor with no prior
context. `intermediate` = needs some familiarity with the codebase or a
judgment call already made before it's issue-ready.

---

## Responsiveness and Layout

- [ ] **Profile page: fix mobile layout of the profile preview section**
  The name-edit form and admin badge break out of alignment on small screens.
  Scope: CSS/layout only, no logic changes.
  Label: `bug`, `frontend`, `good-first-issue`

- [ ] **Question detail page: rework element arrangement**
  Needs a decision first: which elements (title, meta, best-answer preview,
  answers list) should stack in what order on mobile before this is issue-ready.
  Mr Nova to sketch the intended layout, then hand off.
  Label: `bug`, `frontend`, `intermediate`

- [ ] **School detail page: fix mobile layout, especially the filter panel**
  The persistent filter sidebar (per `project-overview.md`'s design system)
  needs a defined mobile pattern, collapsible drawer, bottom sheet, etc.
  Mr Nova to confirm which pattern before this is issue-ready, otherwise a new
  contributor has to invent the design.
  Label: `bug`, `frontend`, `intermediate`

## UI

- [ ] **Add a visual separator in the sidebar before Moderation/Admin links**
  A subtle divider (thin border, spacing, or muted label) separating the
  role-specific links from the regular nav links.
  Label: `enhancement`, `frontend`, `good-first-issue`

- [x] **Add a lightweight rich text editor to question and answer forms**
  Needs a library decision first (candidates: Tiptap headless, or a minimal
  markdown textarea with live preview instead of a full WYSIWYG). Mr Nova to
  decide the approach given the "no third-party component library" leaning
  in `project-overview.md`, since a rich text editor is a reasonable, common
  exception to that rule, then this becomes issue-ready. Larger than most
  items here, may be worth splitting into "pick and wire up the editor" and
  "style it to match the design system" as two issues.
  Label: `enhancement`, `frontend`, `intermediate`

## UX

- [ ] **Add a top-of-page loading bar on navigation**
  A thin progress bar (e.g. nprogress-style) that fires on route change, given
  the app is client-navigated. Self-contained, doesn't touch existing logic.
  Label: `enhancement`, `frontend`, `good-first-issue`

- [ ] **Add a Cancel button on the edit question page**
  Returns to the question detail page without saving changes. Small, scoped,
  good first PR into a form component.
  Label: `enhancement`, `frontend`, `good-first-issue`

## SEO

- [ ] **Expand SEO metadata across pages**
  Needs a defined checklist first (which pages need `<title>`/meta description
  templates, what the templates say) before splitting into per-page issues.
  Mr Nova to draft the metadata plan, then this becomes several small,
  good-first-issue-sized PRs, one or two page types each.
  Label: `enhancement`, `frontend`, `intermediate` (becomes several
  `good-first-issue`s once the plan exists)

- [ ] **Add a social preview image (Open Graph / Twitter card)**
  Needs the actual image asset designed first (Mr Nova, or a contributor
  comfortable with design if one turns out to be interested). Wiring it into
  Next.js metadata once the asset exists is a good-first-issue.
  Label: `enhancement`, `frontend`, `intermediate` (design step), then
  `good-first-issue` (wiring step)

- [ ] **Set up Google Search Console**
  This is not contributor work, it requires domain/DNS-level ownership
  verification. Mr Nova-only task, not to be turned into an issue. Once verified,
  submitting the sitemap is a five-minute follow-up, also Mr Nova-only unless a
  contributor is explicitly given Search Console access later.
  Label: none, internal ops task

---

## Notes for grooming

- Anything marked `intermediate` needs a short decision from Mr Nova (a sketch,
  a library pick, an asset) before it's fair to hand to someone with no
  context. Do that decision-making here or in a scratch note, then promote.
- Once a batch of `good-first-issue`-ready items exists, create them all at
  once so the project board has a visible pool for new contributors to choose
  from on day one, rather than trickling one out at a time.
