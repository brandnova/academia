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
- [ ] Responsive design (mobile + desktop compatible)
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states
- [ ] Form validation
- [ ] Rich text editor (questions + answers) Use [NovaEditor](https://brandnova.github.io/nova-editor/)

---

# Future Features (Not MVP)

## Authentication (Future)
- [ ] Email/Password signup
- [ ] Password reset
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
- [ ] Curated database of Nigerian universities, polytechnics, and colleges
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
