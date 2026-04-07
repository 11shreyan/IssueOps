# IssueOps System Design

## Goal

Design a clean, scalable frontend and backend for IssueOps using an MVC-aligned structure, with support for:
- issue reporting by students,
- automatic categorization,
- department routing,
- duplicate detection,
- status tracking,
- and escalation when too many users report the same issue.

## 1. High-Level Architecture

```text
Student / Staff / Admin
        |
        v
   Frontend (Vite UI)
        |
        v
 FastAPI Controllers / Routes
        |
        v
 Service Layer / Business Logic
        |
        v
 SQLAlchemy Models + Database
```

## 2. MVC Design

### Model

Owns application data and persistence.

Suggested backend model files:
- `app/models/user.py`
- `app/models/department.py`
- `app/models/category.py`
- `app/models/issue.py`
- `app/models/issue_report.py`
- `app/models/status_history.py`
- `app/models/notification.py`

### View

Owns the UI and user interactions.

Suggested frontend pages:
- Landing page
- Login page
- Student dashboard
- Report issue page
- Issue detail page
- Staff dashboard
- Admin dashboard

### Controller

Owns request handling and coordination between the UI and backend logic.

Suggested controller files:
- `app/routes/auth.py`
- `app/routes/issues.py`
- `app/routes/departments.py`
- `app/routes/dashboard.py`
- `app/routes/admin.py`
- `app/routes/notifications.py`

## 3. Frontend Design

## Frontend Goals

- Make reporting an issue fast and simple
- Keep status tracking clear
- Show urgent issues prominently
- Support mobile-first usage for hostel/campus students

## Frontend User Flows

### Student Flow

1. Open app
2. Log in
3. Report issue
4. See auto-detected category and department
5. Track issue status
6. Receive updates when issue is acknowledged or resolved

### Staff Flow

1. Log in
2. See assigned issues
3. Filter by priority/status
4. Acknowledge issue
5. Update progress
6. Mark as resolved

### Admin Flow

1. Log in
2. View analytics and escalation alerts
3. Manage departments and categories
4. Reassign issues if needed
5. Track department performance

## Frontend Page Structure

### 1. Landing Page

Purpose:
- Introduce IssueOps
- Explain how reporting works
- Show quick CTA for login/reporting

Sections:
- Hero section
- How it works
- Categories supported
- Escalation transparency
- Login / Get Started button

### 2. Login/Register Page

Fields:
- Email
- Password
- Role selector only if admin-created roles are not enforced

### 3. Student Dashboard

Widgets:
- My active issues
- Recently resolved issues
- High-priority issues near me
- Quick report button

### 4. Report Issue Page

Fields:
- Title
- Description
- Category
- Location or hostel block/room
- Optional image upload

UI behavior:
- Auto-suggest category from description
- Show likely department before submit
- Warn if a similar issue already exists

### 5. Issue Detail Page

Sections:
- Issue summary
- Category and department
- Current status
- Report count
- Priority badge
- Timeline/history
- Staff/admin remarks

### 6. Staff Dashboard

Sections:
- New issues
- Acknowledged issues
- In progress issues
- Escalated issues
- Resolved issues

Actions:
- Acknowledge
- Change status
- Add remark
- Resolve

### 7. Admin Dashboard

Sections:
- Total open issues
- Issues requiring immediate action
- Department workload
- Resolution time trends
- Category breakdown

Actions:
- Manage departments
- Manage categories
- Change escalation thresholds
- Reassign issue ownership

## Frontend Component Design

Suggested component structure:

```text
frontend/src/
├── api/
│   ├── client.js
│   └── issues.js
├── components/
│   ├── layout/
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   │   └── PageShell.js
│   ├── issue/
│   │   ├── IssueCard.js
│   │   ├── IssueForm.js
│   │   ├── IssueStatusBadge.js
│   │   ├── PriorityBadge.js
│   │   └── IssueTimeline.js
│   └── dashboard/
│       ├── StatCard.js
│       ├── DepartmentLoadChart.js
│       └── EscalationBanner.js
├── pages/
│   ├── HomePage.js
│   ├── LoginPage.js
│   ├── StudentDashboardPage.js
│   ├── ReportIssuePage.js
│   ├── IssueDetailPage.js
│   ├── StaffDashboardPage.js
│   └── AdminDashboardPage.js
├── styles/
│   ├── tokens.css
│   └── app.css
└── main.js
```

## Frontend Visual Direction

Use a clean campus operations look instead of the default Vite starter.

Recommended direction:
- Deep navy or slate base
- Warm alert colors for urgency
- Soft neutral cards
- Clear status badges
- Strong typography
- Mobile-first layout

Suggested status colors:
- Reported -> Gray
- Acknowledged -> Blue
- In Progress -> Amber
- Resolved -> Green
- Requires Immediate Action -> Red

## 4. Backend Design

## Backend Goals

- Keep business logic separate from routes
- Support future auth, notifications, and dashboards
- Make duplicate detection and escalation easy to evolve

## Recommended Backend Structure

```text
app/
├── main.py
├── database.py
├── core/
│   ├── config.py
│   └── security.py
├── models/
│   ├── __init__.py
│   ├── user.py
│   ├── department.py
│   ├── category.py
│   ├── issue.py
│   ├── issue_report.py
│   ├── status_history.py
│   └── notification.py
├── schemas/
│   ├── __init__.py
│   ├── auth.py
│   ├── issue.py
│   ├── dashboard.py
│   └── notification.py
├── routes/
│   ├── auth.py
│   ├── issues.py
│   ├── departments.py
│   ├── dashboard.py
│   ├── admin.py
│   └── notifications.py
├── services/
│   ├── issue_service.py
│   ├── routing_service.py
│   ├── similarity_service.py
│   ├── priority_service.py
│   └── notification_service.py
└── utils/
    └── classifier.py
```

## Backend Layers

### Routes

Receive HTTP requests and return responses.

Examples:
- `POST /issues`
- `GET /issues`
- `GET /issues/{id}`
- `PATCH /issues/{id}/status`

### Services

Own business logic.

Examples:
- classify issue
- find similar issue
- assign department
- compute priority
- flag immediate action
- create notification

### Models

Define database tables and relationships.

### Schemas

Validate request and response payloads.

## 5. Suggested Database Design

## User

- `id`
- `name`
- `email`
- `password_hash`
- `role`
- `hostel_block`
- `room_number`
- `department_id`
- `created_at`

## Department

- `id`
- `name`
- `description`
- `email`
- `is_active`

## Category

- `id`
- `name`
- `department_id`
- `severity_weight`

## Issue

- `id`
- `title`
- `description`
- `category_id`
- `department_id`
- `location`
- `status`
- `priority`
- `report_count`
- `immediate_action_flag`
- `created_by`
- `assigned_to`
- `created_at`
- `updated_at`

## IssueReport

Purpose:
- keeps the original submission record for each student report linked to a shared issue

Fields:
- `id`
- `issue_id`
- `reported_by`
- `description`
- `attachment_url`
- `created_at`

## StatusHistory

- `id`
- `issue_id`
- `old_status`
- `new_status`
- `changed_by`
- `remark`
- `created_at`

## Notification

- `id`
- `user_id`
- `type`
- `message`
- `is_read`
- `created_at`

## 6. Core Backend Workflows

## Workflow A: Create Issue

1. Student submits issue
2. Backend validates request
3. Service classifies category from description
4. Service checks for similar open issues
5. If similar issue exists:
   - increment `report_count`
   - create `IssueReport`
   - recalculate priority
   - flag `immediate_action_flag` if threshold exceeded
6. If not:
   - create new `Issue`
   - assign department
   - create first `IssueReport`
7. Send notifications
8. Return issue summary to frontend

## Workflow B: Update Status

1. Staff opens assigned issue
2. Staff changes status
3. Backend writes update to `Issue`
4. Backend stores transition in `StatusHistory`
5. Notifications are sent to students linked to the issue

## Workflow C: Immediate Action Flag

1. Every duplicate report increases `report_count`
2. Priority recalculates
3. When report count reaches threshold:
   - `priority = Critical`
   - `immediate_action_flag = true`
   - admin notification created

## 7. API Design

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

## Issues

- `POST /issues`
- `GET /issues`
- `GET /issues/{id}`
- `PATCH /issues/{id}/status`
- `POST /issues/{id}/remarks`
- `GET /issues/{id}/history`

## Dashboards

- `GET /dashboard/student`
- `GET /dashboard/staff`
- `GET /dashboard/admin`

## Admin

- `GET /departments`
- `POST /departments`
- `GET /categories`
- `POST /categories`
- `PATCH /issues/{id}/assign`
- `PATCH /settings/escalation`

## Example Issue Response

```json
{
  "id": 14,
  "title": "Water leakage in Block B",
  "description": "Pipe leaking near the washroom entrance",
  "category": "Plumbing",
  "department": "Plumbing Department",
  "location": "Block B - Ground Floor",
  "status": "Acknowledged",
  "priority": "High",
  "report_count": 6,
  "immediate_action_flag": true
}
```

## 8. Business Rules

## Category Rules

- Keywords like `light`, `power`, `switch`, `fan` -> Electrical
- Keywords like `water`, `pipe`, `leak`, `tap` -> Plumbing
- Keywords like `wifi`, `internet`, `network` -> IT
- Keywords like `garbage`, `dirty`, `clean` -> Sanitation

## Priority Rules

- `1 report` -> Low
- `2 to 4 reports` -> Medium
- `5 to 9 reports` -> High
- `10+ reports` -> Critical

## Immediate Action Rule

- If `report_count >= 10`, show `Requires Immediate Action`
- Admin should be able to configure this later

## Similarity Rules

Use:
- description similarity,
- same or related category,
- nearby location,
- open issue status

Current repo already uses a text similarity helper and can be extended into a stronger service.

## 9. Security and Access Control

Recommended auth model:
- JWT-based authentication
- Password hashing
- Role-based authorization

Access rules:
- Students can create and view their own reports
- Staff can update only assigned department issues
- Admin can manage all issues and settings

## 10. Implementation Roadmap

### Phase 1

- Replace Vite starter frontend with IssueOps landing page
- Build report issue form
- Connect form to `POST /issues`
- Build issue list page

### Phase 2

- Add login and roles
- Add student dashboard
- Add staff dashboard
- Add issue detail page with timeline

### Phase 3

- Add admin dashboard
- Add department/category management
- Add escalation settings
- Add notifications

### Phase 4

- Add file uploads
- Add analytics charts
- Add better duplicate detection
- Add email/SMS/push alerts

## 11. Recommended Next Build Steps In This Repo

1. Refactor backend into `models/`, `schemas/`, and `services/` folders.
2. Expand the `Issue` model to include `location`, `department`, and `immediate_action_flag`.
3. Add `GET /issues/{id}` and `PATCH /issues/{id}/status`.
4. Replace the frontend starter with:
   - landing page,
   - report issue form,
   - issue list dashboard.
5. Connect frontend to backend with a small API client module.
6. Add authentication once the base reporting flow works end to end.

## 12. Design Summary

Frontend should focus on:
- simple reporting,
- clear status visibility,
- strong urgency cues,
- and role-specific dashboards.

Backend should focus on:
- clean route/service/model separation,
- duplicate detection,
- routing and escalation logic,
- and room for future auth and analytics.
