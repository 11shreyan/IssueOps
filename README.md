# IssueOps

IssueOps is a campus and hostel issue reporting system that helps students report problems, automatically categorizes them, routes them to the correct department, tracks status updates, and highlights issues that require immediate action when many users report the same problem.

This repository currently contains:
- A `FastAPI` backend for issue creation, duplicate detection, categorization, and status updates
- A `Vite` frontend scaffold for the web application UI
- A product-ready PRD and MVC architecture plan for growing the project into a full system

## Problem Statement

In campuses and hostels, students often face broken lights, sanitation issues, plumbing leaks, internet outages, and other recurring maintenance problems. These complaints are usually handled manually, which creates confusion, delays, duplicate reports, and poor visibility into resolution progress.

IssueOps solves this by giving students a single platform to report issues and letting the system:
- categorize the issue,
- assign it to the correct department,
- track its status,
- detect repeated reports,
- and escalate widespread problems for immediate action.

## Vision

Build a centralized complaint management platform for campuses and hostels that improves accountability, speeds up response time, and gives students transparent visibility into issue resolution.

## Objectives

- Provide a simple interface for students to report issues
- Automatically route complaints to the right department
- Allow students to track complaint status in real time
- Detect duplicate or similar complaints
- Escalate issues that affect many users
- Give administrators and departments a dashboard for monitoring and action

## Users

### 1. Students
- Report issues
- Track issue status
- View repeated/open issues in their area
- Receive updates

### 2. Department Staff
- View assigned issues
- Acknowledge complaints
- Update progress and resolution status
- Add remarks

### 3. Admin
- Manage departments and issue categories
- Monitor all complaints
- Reassign issues
- View analytics and escalation trends

## Core Features

### 1. Issue Reporting
- Students submit a title, description, category, and optional location/media
- Reports should be quick to file and mobile friendly

### 2. Smart Categorization
- The system classifies issues into categories such as:
  - Electrical
  - Plumbing
  - Sanitation
  - IT/Network
  - General

### 3. Department Routing
- Each category maps to a responsible department
- Example:
  - Electrical -> Electrical Department
  - Sanitation -> Sanitation Department
  - Plumbing -> Plumbing Department
  - IT -> IT Support

### 4. Duplicate Detection
- If many students report the same issue, the system should detect similarity using:
  - issue description
  - category
  - location
  - report frequency

### 5. Priority and Immediate Action
- Priority should increase as more reports are linked to the same issue
- When reports cross a configurable threshold, the issue is flagged as `Requires Immediate Action`

### 6. Status Tracking
- Suggested status lifecycle:
  - Reported
  - Acknowledged
  - In Progress
  - Resolved
  - Closed
  - Reopened

### 7. Notifications
- Students receive updates when the issue is acknowledged, updated, or resolved
- Departments receive alerts when new issues are assigned
- Admins receive escalation alerts

### 8. Dashboards
- Student dashboard
- Department dashboard
- Admin dashboard

## Product Requirements Document (PRD)

### Overview

IssueOps is a web-based issue reporting and management application for campuses and hostels. Students can report maintenance or service problems, the system categorizes the complaint, routes it to the appropriate department, and tracks progress through resolution. If many students report the same issue, the platform marks it as urgent to speed up response.

### Goals

- Reduce complaint response time
- Improve visibility into issue handling
- Prevent repeated duplicate manual complaints
- Help departments prioritize high-impact issues
- Build trust through transparent status tracking

### Functional Requirements

1. Users must be able to submit complaints through a web interface.
2. The system must automatically categorize issues based on description or selected category.
3. The system must route issues to the relevant department.
4. Students must be able to track the current status of their complaint.
5. Department staff must be able to acknowledge and update issues.
6. Similar complaints must be grouped or counted together.
7. The platform must increase priority based on report count.
8. Issues with many duplicate reports must be flagged for immediate action.
9. Admins must be able to manage departments, categories, and escalations.
10. The application must keep a record of issue updates and history.

### Non-Functional Requirements

- Responsive design for mobile and desktop
- Role-based access control
- Scalable backend for high complaint volume
- Maintainable codebase using MVC
- Secure API and database access
- Simple, fast user experience

### Success Metrics

- Average acknowledgement time
- Average resolution time
- Percentage of issues resolved within SLA
- Number of duplicate reports grouped
- Number of escalations triggered automatically
- Student satisfaction with complaint handling

## MVC Architecture

This project should follow the `MVC (Model-View-Controller)` pattern for maintainability and clean separation of concerns.

### Model

Responsible for data structures, database interaction, and business entities.

Suggested entities:
- `User`
- `Department`
- `Category`
- `Issue`
- `IssueReport`
- `StatusHistory`
- `Notification`
- `EscalationRule`

Current backend model:
- `Issue`

### View

Responsible for the user interface shown to students, staff, and admins.

Suggested views:
- Login/Register
- Report Issue Form
- Student Dashboard
- Department Dashboard
- Admin Dashboard
- Issue Details Page

Current frontend status:
- Vite-based frontend scaffold is present and ready to be replaced with the actual IssueOps UI

### Controller

Responsible for request handling, validation, workflow orchestration, and routing logic.

Suggested controllers:
- `AuthController`
- `IssueController`
- `DepartmentController`
- `AdminController`
- `DashboardController`
- `NotificationController`

Current backend controller layer:
- `app/routes/issues.py`

### MVC Mapping In This Repo

- `app/models.py` -> Model
- `app/schemas.py` -> Data validation / DTO layer
- `app/routes/issues.py` -> Controller
- `frontend/` -> View layer
- `app/utils/` -> Business rules and helper services

## Current Implementation

The current backend already supports a basic workflow:

- Create an issue
- Check whether a similar issue already exists
- Increase `report_count` when a duplicate is found
- Recalculate priority from report count
- Auto-classify issues into categories like Electrical, Plumbing, IT, and Sanitation
- Update issue status
- List all issues

### Current Priority Logic

- `1 report` -> `Low`
- `2 to 4 reports` -> `Medium`
- `5+ reports` -> `High`

This can later be extended with a `Critical` level and a visible `Requires Immediate Action` flag.

## Suggested Project Structure

```text
IssueOps/
├── app/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── routes/
│   │   └── issues.py
│   └── utils/
│       ├── classifier.py
│       ├── priority.py
│       └── similarity.py
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── issueops.db
├── requirements.txt
└── README.md
```

## API Overview

### `POST /issues`
Create a new issue. If a similar issue already exists, the system increments its report count instead of creating a new record.

### `GET /issues`
Return all issues.

### `PUT /issues/{issue_id}`
Update an issue status.

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- SQLite

### Frontend
- Vite
- JavaScript
- HTML/CSS

## Local Setup

### Backend

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs by default at:

```text
http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs by default at:

```text
http://127.0.0.1:5173
```

## Future Enhancements

- Authentication and role-based access
- Department-specific dashboards
- Admin analytics panel
- Image upload support
- Location-based duplicate clustering
- Push/email/SMS notifications
- SLA and overdue complaint escalation
- Comment threads between students and departments
- Reopen issue workflow
- Heatmap of complaint hotspots

## GitHub Repo Description

IssueOps is an MVC-based campus and hostel issue reporting system that categorizes complaints, routes them to the right department, tracks status, and escalates repeated problems that need immediate action.

## License

Add your preferred license here.
