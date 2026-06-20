# User Flows

## Overview

This document defines the primary user journeys through the Academia platform. Each flow describes the steps a user takes to accomplish a specific goal.

**Note:** This document focuses on user actions and decisions. It does not include backend implementation details, database operations, or API responses.

---

## FLOW 1: User Authentication

### 1.1 Google Login

**User Goal:** Access authenticated features of the platform.

**Steps:**

1. User clicks "Sign in with Google" button
2. Google OAuth consent screen appears
3. User selects their Google account
4. User grants permissions
5. System authenticates user
6. User is redirected to the platform
7. User is now authenticated

**Entry Points:**
- Navigation bar "Sign in" button
- Protected feature prompts (e.g., "Sign in to ask a question")

**Exit Points:**
- User cancels Google login
- User is successfully authenticated

**Alternative Flow:** User is a new user

1. System creates a new user account from Google data
2. User is redirected to the platform

---

### 1.2 Sign Out

**User Goal:** End their authenticated session.

**Steps:**

1. User clicks profile menu
2. User clicks "Sign out"
3. System ends the session
4. User is redirected to the home page

---

## FLOW 2: School Hub Discovery

### 2.1 Search for School

**User Goal:** Find and access a specific school hub.

**Steps:**

1. User navigates to the home page
2. User types a school name in the search bar
3. System displays matching schools
4. User clicks on the desired school
5. System redirects to the school hub

**Entry Points:**
- Home page search bar
- "Browse Schools" link

**Exit Points:**
- User clicks a school hub link
- User returns to home page

---

### 2.2 Browse Schools

**User Goal:** Explore available school hubs.

**Steps:**

1. User navigates to "Schools" page
2. System displays list of all available schools
3. User filters by location or name (optional)
4. User clicks on a school
5. System redirects to the school hub

---

## FLOW 3: School Hub Activation

### 3.1 Request School Hub Activation

**User Goal:** Request the creation of a hub for a school that doesn't exist yet.

**Prerequisites:** User is authenticated.

**Steps:**

1. User searches for a school
2. System shows "No hub found" message
3. User clicks "Request Hub Activation"
4. System displays a request form
5. User confirms the request (optional: provides additional information)
6. System submits the request
7. System displays "Request submitted" confirmation
8. User receives notification when request is approved/denied

**Entry Points:**
- Search results when school is not found
- "Request a School" button on the Schools page

**Alternative Flow:** School hub already exists

1. User searches for school
2. System displays the school hub link
3. User accesses the hub directly

---

## FLOW 4: Asking a Question

### 4.1 Ask Question

**User Goal:** Post a question within a school hub.

**Prerequisites:** User is authenticated and on a school hub page.

**Steps:**

1. User clicks "Ask Question" button
2. System displays question form with school pre-selected
3. User enters a title
4. User enters the question body (rich text)
5. User selects a department (optional)
6. User adds tags (optional)
7. User clicks "Submit Question"
8. System validates the form
9. System creates the question with status "Open"
10. System redirects to the new question page

**Entry Points:**
- "Ask Question" button on school hub page
- "Ask Question" button in navigation

**Exit Points:**
- User cancels the form
- User successfully submits the question
- User navigates away

**Validation Rules:**
- Title is required
- Body is required
- School must be selected (auto-filled)
- User must be authenticated

---

## FLOW 5: Answering a Question

### 5.1 Post Answer

**User Goal:** Provide an answer to a question.

**Prerequisites:** User is authenticated and viewing a question.

**Steps:**

1. User navigates to a question
2. User scrolls to the answer section
3. User clicks "Add Answer" or enters text in the answer field
4. User composes answer (rich text)
5. User clicks "Submit Answer"
6. System validates the answer
7. System creates the answer
8. Question status updates from "Open" to "Answered" (if this is the first answer)
9. System adds answer to the question page
10. Question owner receives notification (if applicable)
11. All followers receive notification (if applicable)

**Entry Points:**
- "Add Answer" button on question page
- Answer text area on question page

**Validation Rules:**
- Answer body is required
- User must be authenticated
- User cannot answer their own question? (Optional: allow this)

---

## FLOW 6: Question Lifecycle

### 6.1 Select Best Answer

**User Goal:** Mark an answer as the best answer to the question.

**Prerequisites:** User is the question owner and viewing their question.

**Steps:**

1. User navigates to their question
2. User views the answers
3. User clicks "Mark as Best Answer" on the desired answer
4. System confirms the selection
5. System marks the answer as "Best Answer"
6. Question status updates to "Solved"
7. Answer author receives notification
8. Visual indicator appears on the selected answer

**Entry Points:**
- Question page when viewing own question
- "Mark as Best Answer" button on each answer

**Exit Points:**
- User cancels the selection
- User confirms the selection
- User navigates away

**Constraints:**
- Only one best answer per question
- Only question owner can mark best answer
- Answer must already be posted

---

### 6.2 View Question Status

**User Goal:** Understand the current state of a question.

**Steps:**

1. User views a question
2. System displays the status indicator
3. User sees one of:

   - "Open" (no answers yet)
   - "Answered" (has answers, no best answer selected)
   - "Solved" (best answer selected)

**Visual Indicators:**
- Color-coded badge
- Icon with status label
- Clear distinction between statuses

---

## FLOW 7: Voting

### 7.1 Vote on Answer

**User Goal:** Upvote or downvote an answer to indicate helpfulness.

**Prerequisites:** User is authenticated and viewing a question.

**Steps:**

1. User views an answer
2. User clicks upvote or downvote arrow
3. System validates the vote
4. System registers the vote
5. Vote count updates
6. Visual feedback confirms the vote

**Entry Points:**
- Upvote/downvote buttons on each answer

**Validation Rules:**
- User must be authenticated
- User cannot vote on their own answer
- Each user can vote once per answer
- Cannot vote on deleted answers

**Alternative Flow:** User changes vote

1. User clicks the opposite vote button
2. System changes the vote
3. Vote count updates accordingly

---

## FLOW 8: Commenting

### 8.1 Add Comment to Answer

**User Goal:** Add clarification or follow-up to an answer.

**Prerequisites:** User is authenticated and viewing a question.

**Steps:**

1. User views an answer
2. User clicks "Comment" or enters text in comment field
3. User types comment
4. User clicks "Submit Comment"
5. System validates the comment
6. System creates the comment
7. System adds comment to the answer
8. User receives notification (if applicable)

**Entry Points:**
- "Comment" button under each answer
- Comment text area under each answer

**Validation Rules:**
- Comment body is required
- User must be authenticated
- Comments are lightweight (no rich text)

---

## FLOW 9: Searching

### 9.1 Search Questions

**User Goal:** Find relevant questions and answers.

**Steps:**

1. User enters keywords in the global search bar
2. System displays search results
3. Results include matching questions
4. User can filter results by:
   - School
   - Department
   - Tags
   - Status
5. User clicks on a result
6. System navigates to the question

**Entry Points:**
- Global search bar (top navigation)
- School hub search bar

**Alternative Flow:** Search by tag

1. User clicks on a tag anywhere on the platform
2. System displays all questions with that tag
3. User can further filter results

---

### 9.2 Filter Questions by Department

**User Goal:** View questions relevant to a specific department.

**Steps:**

1. User is on a school hub page
2. User selects a department from the sidebar or dropdown
3. System filters questions to show only that department
4. User can clear filter to view all questions

---

### 9.3 Filter Questions by Status

**User Goal:** Find unanswered or solved questions.

**Steps:**

1. User is on a school hub or question list page
2. User selects a status filter:
   - Open (unanswered)
   - Answered
   - Solved
3. System displays filtered questions
4. User can clear filter to view all questions

**Special Case:** Moderator view

1. Moderator selects "Unanswered Questions" filter
2. System displays all "Open" questions
3. Moderator can prioritize answering these questions

---

## FLOW 10: Notifications

### 10.1 View Notifications

**User Goal:** See recent activity related to their content.

**Prerequisites:** User is authenticated.

**Steps:**

1. User clicks the notification bell icon
2. System displays notification dropdown/list
3. User sees recent notifications
4. Unread notifications are highlighted
5. User clicks a notification
6. System navigates to the relevant content
7. Notification is marked as read

**Entry Points:**
- Notification bell icon in navigation

**Notification Types:**
- "New answer on your question: [Question Title]"
- "New comment on your answer"
- "Your answer was selected as Best Answer"
- "Your answer received a vote"
- "You have been assigned as a moderator for [School]"
- "Your hub activation request for [School] was approved"

---

### 10.2 Mark All as Read

**User Goal:** Clear all unread notifications.

**Prerequisites:** User is authenticated and viewing notifications.

**Steps:**

1. User opens notification list
2. User clicks "Mark all as read"
3. System marks all notifications as read
4. Notification count resets to zero

---

## FLOW 11: User Profile

### 11.1 View Own Profile

**User Goal:** See personal activity summary.

**Prerequisites:** User is authenticated.

**Steps:**

1. User clicks profile avatar/name
2. User selects "My Profile"
3. System displays profile page showing:
   - Display name and profile picture
   - Join date
   - Questions asked (list)
   - Answers provided (list)
   - School affiliations

---

### 11.2 View Other User's Profile

**User Goal:** See another user's activity.

**Steps:**

1. User clicks on a username anywhere on the platform
2. System navigates to that user's profile
3. System displays:
   - Display name and profile picture
   - Join date
   - Questions asked (list)
   - Answers provided (list)

---

## FLOW 12: Content Reporting

### 12.1 Report Content

**User Goal:** Flag inappropriate content for review.

**Prerequisites:** User is authenticated.

**Steps:**

1. User views a question, answer, or comment
2. User clicks the "Report" button
3. System displays report modal
4. User selects a report reason:
   - Spam
   - Abuse
   - Misinformation
   - Duplicate Question
5. User provides additional context (optional)
6. User clicks "Submit Report"
7. System submits the report
8. System displays confirmation
9. Report enters moderator queue

**Entry Points:**
- "Report" button on questions, answers, and comments

**Constraints:**
- Users cannot report their own content
- Each user can report each piece of content once

---

## FLOW 13: Moderation

### 13.1 View Unanswered Questions (Moderator)

**User Goal:** Quickly identify and answer questions that need attention.

**Prerequisites:** User is a moderator for the school hub.

**Steps:**

1. Moderator accesses school hub
2. Moderator selects "Unanswered Questions" filter
3. System displays all "Open" questions
4. Moderator reviews questions
5. Moderator answers questions as needed

**Entry Points:**
- School hub page
- Moderator dashboard

---

### 13.2 View Reports (Moderator)

**User Goal:** Review and act on reported content.

**Prerequisites:** User is a moderator for the school hub.

**Steps:**

1. Moderator accesses the moderation queue
2. System displays reported content from their school
3. Moderator reviews each report
4. Moderator can:
   - Escalate to admin (if serious)
   - Mark report as resolved (if no action needed)
   - Add notes to the report

**Note:** Moderators cannot delete content. They can only report and escalate.

---

## FLOW 14: School Representative

### 14.1 Manage School Metadata

**User Goal:** Update school information.

**Prerequisites:** User is the School Representative.

**Steps:**

1. School Representative accesses school hub
2. User clicks "Manage School"
3. System displays school management dashboard
4. User updates school information:
   - School name (restricted)
   - Location
   - Departments
   - Contact information
5. User saves changes
6. System updates school metadata

---

### 14.2 Assign Moderators

**User Goal:** Add or remove moderators for the school hub.

**Prerequisites:** User is the School Representative.

**Steps:**

1. School Representative accesses school hub
2. User clicks "Manage Moderators"
3. System displays current moderators
4. User searches for a user to add as moderator
5. User selects the user
6. User clicks "Add as Moderator"
7. System assigns moderator role
8. User receives notification of assignment

**Entry Points:**
- School management dashboard

**Alternative Flow:** Remove moderator

1. User views current moderators
2. User clicks "Remove" on a moderator
3. System confirms removal
4. System removes moderator role

---

## FLOW 15: Admin Tasks

### 15.1 Approve School Activation

**User Goal:** Review and approve school hub activation requests.

**Prerequisites:** User is Platform Administrator.

**Steps:**

1. Admin accesses the admin dashboard
2. System displays pending activation requests
3. Admin reviews the school information
4. Admin either:
   - Approves: School hub is created
   - Denies: Request is rejected with reason
5. Requester receives notification of decision

---

### 15.2 Manage School Records

**User Goal:** Create and manage school records in the system.

**Prerequisites:** User is Platform Administrator.

**Steps:**

1. Admin accesses the admin dashboard
2. Admin navigates to "Schools"
3. Admin can:
   - Add a new school record
   - Edit existing school information
   - Deactivate/archive schools
4. System updates school records

---

### 15.3 Manage Users and Roles

**User Goal:** Assign roles to platform users.

**Prerequisites:** User is Platform Administrator.

**Steps:**

1. Admin accesses user management
2. Admin searches for a user
3. Admin selects the user
4. Admin assigns a role:
   - School Representative (with school selection)
   - Platform Admin
   - Remove role
5. System updates user permissions

---

## USER JOURNEY MAPS

### New Student Journey

1. **Discovery:** Student hears about Academia
2. **Landing:** Student visits the platform
3. **Search:** Student searches for their school
4. **Access:** Student finds their school hub
5. **Browse:** Student reads questions and answers
6. **Authenticate:** Student signs in with Google
7. **Contribute:** Student asks their first question
8. **Engage:** Student answers another student's question
9. **Return:** Student checks for answers to their question
10. **Complete:** Student marks the best answer
11. **Repeat:** Student continues using the platform

### Moderator Journey

1. **Assignment:** User is assigned as moderator for a school
2. **Dashboard:** Moderator accesses the hub
3. **Unanswered:** Moderator filters by unanswered questions
4. **Answer:** Moderator provides answers
5. **Report Check:** Moderator reviews content reports
6. **Escalate:** Moderator escalates serious issues to admin
7. **Maintain:** Moderator ensures content quality

### School Representative Journey

1. **Assignment:** User is assigned as School Representative
2. **Setup:** Representative updates school information
3. **Departments:** Representative adds department categories
4. **Moderators:** Representative assigns moderators
5. **Maintain:** Representative keeps school information current
6. **Grow:** Representative promotes the hub to students
