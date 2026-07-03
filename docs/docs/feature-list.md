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
- [ ] Search questions (title + body)
- [ ] Search by school
- [ ] Search by department
- [ ] Search by tags
- [ ] Search results ranking (solved > highly voted > recent > relevance)

## Notifications
- [ ] Email notifications for major actions
  - [ ] New answer notification
  - [ ] School hub activation
  - [ ] School submission request approved
- [ ] In-app notifications for major actions
  - [ ] New answer notification
  - [ ] New comment notification
  - [ ] Best answer selected notification
  - [ ] Vote received notification
  - [ ] Moderator assigned notification
  - [ ] Hub activated notification

## Moderation
- [ ] Report content (spam/abuse/misinformation/duplicate)
- [ ] View unanswered questions (moderator only)
- [ ] Escalate content to admin
- [ ] Reports dashboard (admin only)
- [ ] Resolve reports (admin only)

## Administration
- [x] Manage schools (create/edit/soft-delete via is_active)
- [x] Approve hub activation requests
- [ ] Assign moderators
- [ ] Assign school representatives
- [ ] View reports
- [ ] Manage users (view/suspend)

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
- [ ] Full-text search
- [ ] Search answers
- [ ] Elasticsearch/OpenSearch integration

## Notifications (Future)
- [ ] In-app notification list
- [ ] Push notifications
- [ ] Notification read/unread status

## Moderation (Future)
- [ ] Content deletion (moderators)
- [ ] User management (moderators)
- [ ] Flag capabilities (moderators)

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
