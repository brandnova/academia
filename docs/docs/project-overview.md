# Academia, Project Overview & Frontend Guide

This document is a shared mental model for anyone touching this project, but it's
written mainly for whoever picks up frontend work. It tells you what the product is,
what pages need to exist, what "feel" we're going for, and what NOT to build yet.

---

## 1. What This Is, In Plain Terms

Academia is a place where students ask academic questions specific to their school
and get answers that stick around for the next student who has the same question.
Think "Stack Overflow," but organized by school and department instead of
programming tags, and focused on things like GPA calculation, clearance,
registration, and SIWES, not code.

The product is not a social feed. There's no infinite scroll of "engagement,"
no follower counts. The measure of success is: *did this person find or leave an
answer that helps someone else later.*

---

## 2. Who Uses It

| Role | Can do |
|---|---|
| **Guest** (not logged in) | Browse and search schools, hubs, questions, answers. Cannot post, vote, or comment. |
| **User** (logged in) | Everything a guest can, plus: ask questions, answer, comment, vote, request a hub, report content, receive notifications. |
| **Moderator** | A User, plus: sees an "unanswered questions" queue for their assigned hub, can escalate content to admins. |
| **School Representative** | A User, plus: manages departments for their school, assigns moderators. |
| **Admin** | Manages schools, approves hub activation requests, assigns representatives, resolves reports. |

Every page's design should make it obvious which of these a visitor currently is,
most of the UI is shared, but the *actions available* change per role. Determine
this from `GET /users/me/`'s `is_admin`, `moderator_for`, and `representative_for`
fields, see `api-contract.md`'s "Frontend Permission Model" section for the exact
rules of what to show when. Hiding a control based on these fields is a UX
convenience only, the backend enforces every permission independently regardless
of what the UI shows.

---

## 3. How the Build Is Sequenced

The backend is being built in phases, each one a working, testable slice. Rough
mapping so you know what's real to build against and when:

```
Phase 0: Scaffolding (no UI needed yet)
Phase 1: Auth (Google login) → Login page, session handling
Phase 2: Schools → School directory / search page, school profile page
Phase 3: Departments → Department list on school/hub page
Phase 4: Hubs + activation → Hub home page, "request a hub" flow
Phase 5: Questions → Ask question form, question list, question detail
Phase 6: Tags → Tag chips, tag browse page
Phase 7: Answers → Answer form, answer list on question page
Phase 8: Voting → Vote buttons on answers
Phase 9: Comments → Comment thread under answers
Phase 10: Best answer / status → "Solved" badge, mark-best button
Phase 11: Notifications → Notification bell + list
Phase 12: Search → Global search bar + results page
Phase 13: Reports/moderation → Report modal, moderator queue page
Phase 14: Role assignment → Rep/moderator management screens
Phase 15: Admin polish → Admin dashboard
```

You don't have to wait for every phase to finish before starting frontend work,
each phase ships a working API you can build a real page against and test with
real data, not mocks.

---

## 4. Page List (Sitemap)

### Public (no login required)
- **Home**: brief pitch + search bar + "browse schools"
- **School directory**: searchable/filterable list of schools
- **School profile**: school info; if hub is active, shows hub content; if not, shows "request a hub" CTA
- **Hub home**: question list for that school, filterable by department/status/tag
- **Question detail**: question, answers, comments, vote state
- **Tag browse**: list of tags, questions per tag
- **Search results**: global search across questions/schools

### Requires login
- **Ask a question**: form (title, body, school/hub, optional department, tags)
- **My profile**: basic info, avatar, own questions/answers
- **Notifications**: list, mark read
- **Request hub activation**: form, shown when a school has no active hub

### Moderator
- **Unanswered questions queue**: scoped to their hub(s)

### School Representative
- **Department management**: add/edit departments
- **Moderator management**: assign/remove moderators for the hub

### Admin
- **Schools management**: create/edit schools
- **Hub activation requests**: approve/reject queue
- **Reports dashboard**: pending/resolved reports
- **User management**: view/suspend (later phase)

That's the full MVP sitemap. Nothing here requires reviews, payments, or
public API screens, see section 10.

---

## 5. Design Philosophy (reference: Google Account Help Community)

We're taking direct inspiration from Google's Account Help Community layout,
simple, intuitive, functional, accessible. That reference changes the tone from
less "editorial reading experience," more "structured, searchable reference tool." 
Both are content-first, but this one leans more utilitarian and dense. Principles:

- **Function over decoration.** No hero illustrations, no marketing flourishes
  on interior pages. The list of questions/threads IS the interface, see
  Google's "Browse the Community" page as the model for our hub/question list.
- **List rows, not big cards.** Each question is a compact row: icon/status
  indicator, title, one-line snippet, metadata (reply count, department) on
  the right. This is denser and more scannable than the "card" pattern from
  the original draft, closer to a well-organized inbox than a blog feed.
- **Filtering lives in a persistent sidebar**, not buried in a dropdown or a
  separate page. Status, department, tags, all filterable from a panel that
  stays visible while browsing, exactly like Google's right-hand Filter panel.
- **Search is the dominant element at the top of every browsing page**, a
  pill-shaped search bar, prominently placed, not a small icon tucked in a
  header.
- **Minimal color, used only to carry meaning.** Status icons, unread
  indicators, locked/solved markers, color and icons communicate state, not
  decoration. Most of the interface stays neutral (grayscale-driven).
- **Accessible by default.** High contrast, clear focus states, status
  conveyed by icon + text label (never color alone), same accessibility bar
  Google's own interface holds itself to.

---

## 6. Visual Direction

- **Light and dark mode, both supported from the start.** Default can mirror
  system preference. Reference screenshots show Google's dark theme, deep
  near-black background, off-white text, a single blue accent for links and
  interactive elements. We'll build a matching light theme with the same
  structure (near-white background, dark text, same blue accent) so neither
  mode feels like an afterthought.
- **One accent color, used sparingly**, primarily for links, active filter
  states, and primary buttons. Everything else is grayscale/neutral, exactly
  like the reference: notice how little non-gray color appears in those
  screenshots outside of link text and icons.
- **Status/type icons instead of colored badges.** The reference uses small
  icons (bell/pin for featured, lock for closed) inline with the title rather
  than colored pill badges. We'll adopt the same pattern: a small icon before
  the question title indicates Open / Answered / Solved, with the label
  available on hover/tap for clarity.
- **Typography: clean sans-serif, clear hierarchy, no display/decorative
  fonts.** Title rows slightly bolder/larger, snippets and metadata muted and
  smaller, matching the reference's restrained type scale.
- **Rounded, pill-shaped search input** as the primary navigational anchor at
  the top of browsing pages.
- **Full custom Tailwind + hand-written CSS** for anything Tailwind's utility
  classes can't cleanly express (custom focus rings, subtle transitions on
  filter panels, the icon/status system), no third-party component library
  imposing its own visual identity on top of ours.

---

## 7. Recurring Components to Build Once, Reuse Everywhere

- **List row**: icon/status + title + one-line snippet + metadata (replies,
  department, updated date), the core repeating unit for question lists,
  exactly like Google's thread rows.
- **Filter sidebar panel**: collapsible sections (Status, Department, Tags),
  checkboxes, a visible "Clear all," persists while browsing.
- **Pill search bar**: sticky/prominent at the top of browsing pages.
- **Status icon system**: Open / Answered / Solved / Locked-equivalent
  states, icon + accessible label.
- **Section/date grouping header**: e.g. "Updated: This year" / "Updated:
  Earlier," reusable for grouping question lists by recency or relevance tier.
- **"View more" load control**: matches the reference's pattern more closely
  than numbered pagination for long browsing lists; numbered pagination still
  fine for admin/moderator tables where jumping to a specific page matters.
- **Theme toggle**: light/dark, placed in the footer/settings area like
  Google's language selector slot.
- Vote control, tag chip, comment thread item, hub header, notification
  bell, report modal, role-aware action bar, unchanged from the original
  list, just restyled to the new visual direction.

---

## 8. States Every Page Must Handle

For every list or detail page: **loading**, **empty**, **error**, **populated**.
This isn't optional polish, it's in the MVP feature list. A page that only
looks right when the API returns perfect data isn't done.

---

## 9. Frontend Tech Notes

The backend is being built as a **pure API**, Django REST Framework only, no
server-rendered product pages. The only exception is if we build a throwaway
internal page purely to smoke-test something during development; that's a
debugging convenience, not part of the product surface.

**Frontend framework: Next.js (App Router), JavaScript, deployed on Vercel.**
The backend's zero-opinion JSON API made this an easy choice once real pages
were underway. Tailwind v4 (CSS-first, no tailwind.config.js) for styling,
no third-party component library, lucide-react for icons.

Auth follows the documented Google token exchange, but the JWT pair never
reaches browser-readable code. The frontend's own Next.js Route Handlers
proxy every backend call server-side: they hold the tokens as httpOnly
cookies, attach `Authorization: Bearer <access>` themselves, and handle
token refresh (one retry attempt on a 401, rotate both cookies on success,
clear both and report a logged-out session on failure) before the browser
ever sees a response. A future non-Next.js consumer of this API would still
follow the plain documented flow in api-contract.md directly; this proxy
layer is a frontend implementation choice, not an API requirement.

**URL conventions to build against:** Schools and Hubs each have a stable, unique
`slug` (e.g. `unilag`) suitable as the primary route segment for their public pages,
`/schools/unilag/`, `/hubs/unilag/`, resolved via `GET /schools/by-slug/{slug}/` and
`GET /hubs/by-slug/{slug}/`. Questions have a cosmetic, non-unique `slug` meant to sit
alongside the UUID in the URL for readability and SEO, `/questions/{id}/{slug}`, but
the UUID is what's actually looked up, the slug can be anything or even omitted.

---

## 10. What NOT to Build Yet

These are documented in the core docs as **future phases**, don't design or
build screens for them in the MVP:

- School reviews / ratings
- School verification badges or "claim your school" flows
- Any subscription/payment UI
- Public API developer portal

One thing worth knowing now, even though you won't build it yet: when reviews
do arrive, there will **never** be a feature that hides or suppresses a
legitimate negative review because a school paid for something. Paid tiers will
only ever affect visibility/promotion of a school's *own* verified content, not
the visibility of what students say. Worth keeping in mind if any future design
work touches that area.

---

## 11. Decisions Made During Frontend Build

Resolved during the Phase 0–15 build, kept here for reference:

- **Light and dark mode**: both shipped from the start, manual toggle
  (persisted via localStorage), not just system-preference-following.
- **Brand palette**: single accent blue (`#2563eb`), close to the Google
  reference's link color, defined once as a CSS variable, easy to retune.
  No other brand assets existed going in, this was picked fresh.
- **Component library**: fully custom Tailwind, no shadcn/ui or headless UI,
  matching the "no third-party component library" principle from
  project-plan.md.
- **Chrome/page background parity**: sidebar and top bar deliberately read
  the same CSS variables as the page body, rather than Tailwind's default
  gray scale, so structural chrome is never a visually distinct "panel."
  Popover surfaces (profile menu, notification dropdown) are the deliberate
  exception, meant to read as elevated above the page.
  