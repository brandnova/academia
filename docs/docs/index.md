# Academia Atlas

A school-focused academic knowledge platform that helps students find answers, solve
academic problems, and preserve institutional knowledge in a searchable, organized way.
It is launching first with Nigerian tertiary institutions, where the problem originated,
and is built to extend to other countries.

> Student is confused. Student asks a question. Student gets an answer.
> Future students find that answer without asking again.

---

## Which document answers what

| If you want to know... | Read |
|---|---|
| What Academia Atlas is, why, and the principles behind it | [Project Plan](project-plan.md) |
| What each surface can do today, and what is missing | [Feature List](feature-list.md) |
| What the API accepts and returns, errors, rate limits | [API Contract](api-contract.md) |
| What the data looks like | [Database Schema](database-schema.md) |
| Where the code lives, per surface | [Backend Map](backend-map.md), [Web Map](frontend-map.md), [Mobile Map](mobile-map.md) |
| How it should look and feel (web and mobile) | [Design Guide](design-guide.md) |
| Why it was built that way, decisions, open deviations | [Build Log Backend](BUILD_LOG_BACKEND.md), [Build Log Web](BUILD_LOG_FRONTEND.md), [Build Log Mobile](BUILD_LOG_MOBILE.md) |
| What changed and when | [Change Log](changelog.md) |
| How to verify it works | [Testing](TESTING.md) |
| How to ship it | [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) |
| How to contribute and run the project | [Contributors Quickstart](QUICKSTART.md), [Maintainer Playbook](MAINTAINER_PLAYBOOK.md) |

## When something changes, update

| Change | Update |
|---|---|
| A capability is added, finished or found broken | Feature List (and its status mark) |
| A file, route, screen, helper or component is added, moved or removed | The surface's map |
| An endpoint, payload, error or rate limit changes | API Contract, then the Changelog |
| A model or field changes | Database Schema, then the Changelog |
| A decision was made or a doc deviation found | The surface's Build Log |
| Anything shipped | Changelog |
| A visual or interaction rule changes | Design Guide |
| A launch step is added or found missing | Deployment Checklist |

Each document has one job. Do not copy content between them, link instead.

---

## The problem

Every semester, students ask the same questions: how to calculate a GPA, what clearance
needs, how registration works, what to expect during SIWES, what happens after a missed
deadline, how to change department. The answers exist, but they are scattered across
WhatsApp groups, Telegram channels and private conversations, and they disappear when
older students graduate.

## The solution

A structured platform where academic questions are asked, answered, searched and
preserved, organized by school and department, instead of buried in temporary chats.

## Core principles

* One hub per school.
* Schools are platform-managed records.
* Knowledge is more important than engagement metrics.
* Search comes before social features.
* Information should become easier to find over time, not harder.

## Surfaces

| Surface | Stack | Notes |
|---|---|---|
| Backend | Django REST Framework, PostgreSQL, SimpleJWT with Google sign in | Pure versioned JSON API at `/api/v1/` |
| Web | Next.js (App Router), Tailwind v4, deployed on Vercel | Full product including moderation and admin tools |
| Mobile | Expo (React Native, TypeScript) | User client. Staff open the web tools in the browser |

## Development philosophy

API first. Behavior, data structures and API responses are documented and agreed before
implementation, and each surface is built against the same contract. Documentation is a
development artifact, not an afterthought.

## Current status

**Phase:** post-MVP, pre-launch.

* **Backend:** complete (15 MVP phases plus the post-MVP maintenance backlog), live on Vercel with Supabase Postgres and Upstash Redis. A PythonAnywhere deployment remains as the preview and testing backend.
* **Web:** MVP and the eight-batch audit pass are complete and live.
* **Mobile:** MVP built, post-MVP audit complete. See the Mobile section of the Feature List and the Mobile Build Log.

## Next steps

1. Do a repo cleanup.
2. Work through the [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) for backend, web and mobile.
3. Onboard initial moderators and school representatives.
4. Open the platform to real users.

## Repository structure

```text
Academia Atlas/
├── docs/                    Documentation (MkDocs, published to GitHub Pages)
├── backend/                 Django REST Framework API
├── web/                     Next.js web application
├── mobile/                  Expo (React Native) mobile client
├── CHANGELOG.md             Canonical history, included in the docs site
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── GOVERNANCE.md
├── SECURITY.md
├── LICENSE
└── README.md
```

---

*Academia Atlas aims to become the most useful destination for students seeking answers to academic questions, starting in Nigeria.*