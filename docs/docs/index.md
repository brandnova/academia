# Academia

A school-focused academic knowledge platform designed to help students find answers, solve academic problems, and preserve institutional knowledge in a searchable and organized way.

---

## The Problem

Every semester, students ask the same questions:

* How do I calculate my GPA?
* What documents are required for clearance?
* How does course registration work?
* What should I expect during SIWES?
* What happens if I miss a deadline?
* What is the process for changing departments?

The answers usually exist somewhere, but they are scattered across WhatsApp groups, Telegram channels, student forums, and private conversations.

As older students graduate and conversations disappear, valuable knowledge is lost and the cycle repeats.

---

## The Solution

Academia provides a structured platform where academic questions can be asked, answered, searched, and preserved.

Instead of information being buried inside temporary conversations, it becomes part of a permanent and searchable knowledge base organized around schools and departments.

The goal is simple:

> Student is confused.
> Student asks a question.
> Student gets an answer.
> Future students find that answer without asking the same question again.

---

## Market Strategy

Academia is launching first with Nigerian tertiary institutions, where the problem it solves originated. Nigeria is the platform's starting market, not its permanent identity. The data model, URL structure, and core architecture are built to extend to institutions in other countries as the Nigerian market is proven out.

---

## Core Principles

Academia is built around a few simple ideas:

* One hub per school.
* Schools are platform-managed records.
* Knowledge is more important than engagement metrics.
* Search comes before social features.
* Information should become easier to find over time, not harder.

---

## Documentation

The project documentation is organized around four core documents, plus supporting logs.

### Project Plan
Defines the vision, goals, structure, and guiding decisions behind the platform.

### Feature List
Defines the complete list of features, what's built, and what's planned for later.

### Database Schema
Defines the application's data structures, models, and relationships.

### API Contract
Defines the communication contract between the frontend and backend systems.

### Project Overview
The frontend-facing guide: sitemap, design philosophy, visual direction, and component list.

---

## Development Philosophy

Academia follows an API-first development approach.

System behavior, data structures, and API responses are documented and agreed upon before implementation. Frontend and backend development then proceed independently using the same documented contracts.

This reduces integration issues, allows parallel development, and keeps both sides aligned throughout the project.

---

## Current Status

**Phase:** Post-MVP, pre-launch

The backend is complete: all 15 planned MVP phases, plus post-MVP passes for production readiness, URL/ID ergonomics, and API completeness. The frontend MVP (Phases 0 through 15) is also complete and live on Vercel. Both are functional and deployed.

The project is currently in a final audit-and-fix pass, working through a tracked backlog of smaller bugs and polish items before opening the platform to real users. See `feature-list.md`'s Platform Improvements section for the active list.

---

## Repository Structure

```text
Academia/
│
├── docs/                    - Project documentation (MkDocs, published to GitHub Pages)
├── backend/                 - Django REST Framework API
├── academia-frontend/       - Next.js application
│
├── CHANGELOG.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── GOVERNANCE.md
├── LICENSE
├── SECURITY.md
└── README.md
```

---

## Next Steps

1. Work through the post-MVP audit backlog (see `feature-list.md`).
2. Complete the Nigerian school directory import (data cleaning in progress).
3. Onboard initial moderators and school representatives.
4. Open the platform to real users.

---

*Academia aims to become the most useful destination for students seeking answers to academic questions, starting in Nigeria.*