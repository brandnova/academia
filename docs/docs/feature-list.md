# FEATURE LIST

## Authentication
- [x] Google Login
- [x] Logout
- [x] User profile (view only initially)
- [x] Avatar from Google

## School Hubs
- [x] View school hub
- [x] Search for school
- [x] Request hub activation
- [x] View departments
- [x] Filter questions by department
- [x] Manage departments (create/edit/deactivate/reactivate), School
      Representatives and admins

## Questions
- [x] Create question (title, body, school, optional department, tags)
- [x] Edit own question
- [x] Delete own question
- [x] View question
- [x] View question list (paginated)
- [x] Filter questions by status (Open/Answered/Solved)
- [x] Filter questions by school (via the hub filter, since a hub maps to exactly one school)
- [x] Filter questions by department
- [x] Filter questions by tags
- [x] Follow a question for update notifications, independent of authorship
      (frontend not yet wired, backend endpoints exist and are documented)

## Answers
- [x] Create answer
- [x] Edit own answer
- [x] Delete own answer
- [x] Mark best answer (question owner only)
- [x] Vote on answers (upvote/downvote)
- [x] View answers

## Comments
- [x] Create comment on answer
- [x] Edit own comment
- [x] Delete own comment
- [x] View comments

## Tags
- [x] Create tags (from question creation)
- [x] View questions by tag
- [x] Suggest tags (autocomplete, served by the tags search endpoint)
- [x] Popular tags view

## Search
- [x] Search questions (title + body)
- [x] Search by school
- [x] Search by department
- [x] Search by tags
- [x] Search results ranking (solved > highly voted > recent > relevance)

## Notifications
- [ ] Email notifications for major actions
  - [x] New answer notification
  - [x] School hub activation
  - [ ] School submission request approved (no SchoolSubmission model yet, future)
- [ ] In-app notifications for major actions
  - [x] New answer notification
  - [x] New comment notification
  - [x] Best answer selected notification
  - [x] Vote received notification
  - [ ] Moderator assigned notification (assignment endpoint exists since Phase 14,
        no notification trigger wired to it yet)
  - [x] Hub activated notification

## Moderation
- [x] Report content (spam/abuse/misinformation/duplicate)
- [x] View unanswered questions (moderator only, scoped to assigned hubs)
- [ ] Escalate content to admin (no dedicated escalate action exists; moderators
      currently use the same Report pipeline as any other user)
- [x] Reports dashboard (admin only)
- [x] Resolve reports (admin only)

## Administration
- [x] Manage schools (create/edit/soft-delete via is_active)
- [x] Approve hub activation requests
- [x] Assign moderators
- [x] Assign school representatives
- [x] View reports
- [x] Manage users (view/suspend; promoting or demoting admin status is not part
      of this endpoint)

## User Experience
- [x] Self-view profile stats (question/answer/best-answer/comment counts) on
      GET /users/me/, plus paginated GET /users/me/answers/ and
      GET /users/me/comments/ for the actual object lists. Self-only, not a
      public profile, closes out the "Lightweight contributor recognition"
      item previously listed under Platform Improvements
- [x] User search by name/email for admins and school representatives
- [x] Responsive design (mobile + desktop compatible)
- [x] Loading states
- [x] Error handling
- [x] Empty states
- [x] Form validation

---

# Future Features (Not MVP)

## Authentication (Future)
- [ ] Email/username and password registration
- [ ] Email verification on signup (verification link or code)
- [ ] Email/password login (alongside Google, not replacing it)
- [ ] Password reset (forgot password flow via email)
- [ ] Password change (while logged in)
- [ ] Self-service account deactivation
- [ ] Apple Login
- [ ] Microsoft Login

## Search (Future)
- [ ] Search answers directly, not just questions
- [ ] Precomputed search index (stored tsvector column, GIN index)
- [ ] Elasticsearch/OpenSearch integration

## Notifications (Future)
- [ ] Push notifications
- [ ] Moderator assigned notification trigger
- [ ] School submission approved notification trigger

## Moderation (Future)
- [ ] Content deletion (moderators)
- [ ] User management (moderators)
- [ ] Flag capabilities (moderators)
- [ ] Dedicated escalate-to-admin action, distinct from the general report pipeline
- [x] Question lock/close capability, distinct from SOLVED, moderator/admin
      only, for the rare case a question genuinely needs to stop accepting
      input (spam magnet, fully resolved administrative question). SOLVED
      itself no longer implies closed, see project-plan.md's Question
      Lifecycle note. Backend complete and documented; frontend UI for this
      is planned for the upcoming polish pass.

## School Reviews (Future)
- [ ] Submit school review (overall rating + category ratings + text)
- [ ] Edit/delete own review
- [ ] View reviews per school
- [ ] School official response to a review (verified reps only)
- [ ] Vote review helpful/not helpful
- [ ] Report review (reuses existing report pipeline)

## School Verification & Claiming (Future)
- [ ] Claim school profile (representative request + admin approval)
- [ ] Verified badge on school profile

## School Data Curation (Future)
- [ ] Curated database of Nigerian universities, polytechnics, and colleges,
      sourced primarily from NUC, NBTE, and NCCE official lists, cross-referenced
      against JAMB's institution list and secondary sources
- [ ] Extend the School model with richer fields: institution type
      (university/polytechnic/college of education), ownership (federal/state/private),
      state, an official regulatory or JAMB code, source_url, last_verified_at
- [ ] Periodic re-verification workflow so curated data doesn't silently go stale
- [ ] User-submitted "school not listed" request flow
- [ ] Admin verification workflow for submitted schools

## Monetization (Future)
- [ ] Subscription plans for schools
- [ ] Promoted placement for verified/subscribed schools
- [ ] Analytics dashboard for school representatives
- [ ] Payment integration (Stripe/Paystack)

## Public/Developer API (Future)
- [ ] API client registration (admin issued keys)
- [ ] API key authentication + per-client rate limiting
- [ ] Read-only public endpoints (schools, questions, tags)
- [ ] Developer documentation portal

## Additional Features (Future)
- [ ] Marketplace for academic materials
- [ ] AI-assisted search
- [ ] Nationwide academic knowledge graph

## Platform Improvements (Future)
- [ ] OpenAPI schema and interactive API docs (drf-spectacular or similar), useful
      internally and as groundwork for the planned public API
- [ ] Private "my submitted reports" view for a user's own account, deliberately
      not part of the public/self profile page, reports are never shown on any
      profile to avoid making a reporter's activity identifiable to others
- [ ] Admin action audit log (who resolved which report, who suspended which user)
- [ ] Answer edit history, so a heavily-edited answer's original context isn't lost
      framed as quality signal, not a leaderboard or engagement mechanic, consistent
      with Knowledge Over Social Activity
- [ ] Bulk data import tooling to support the school directory curation effort above
- [ ] Celery-backed background tasks for email and notification delivery, so a slow
      SMTP call never blocks an API response
- [ ] Refresh-token request deduplication: if multiple requests expire in the
      same instant, more than one may attempt to use the same refresh token
      before rotation completes, one could be rejected. Frontend-only
      concern (Next.js proxy layer), low risk at MVP traffic levels.
- [ ] Standalone answer/comment permalink page, so notifications and reports
      targeting an answer or comment (VOTE, NEW_COMMENT, non-question
      reports) can deep-link somewhere real instead of rendering as
      non-clickable text.
