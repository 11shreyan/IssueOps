# IssueOps

IssueOps is a university concern-management platform for students, department staff, HODs, and admins. Students can lodge and track concerns, staff can validate and act on them, unresolved concerns can escalate to the HOD after 4 days, and the system records notification-ready updates throughout the workflow.

## Tech Stack

- `FastAPI` backend
- `SQLAlchemy` ORM
- `SQLite` for local development
- `Postgres` for hosted deployment
- `Vite` frontend with JavaScript, HTML, and CSS
- `GitHub Pages` for frontend hosting
- `Render` for backend and Postgres hosting

## Current Workflow

- `Student` signs up or logs in, lodges a concern, and tracks status
- `Department Staff` reviews concerns, validates them, rejects invalid ones, resolves them, or escalates them
- `HOD` handles escalated concerns
- `Admin` monitors the whole system
- Notification messages are generated as mail-style updates for student-facing visibility

## Roles

### 1. Student

- Register and log in
- Lodge concerns
- View concern status and escalation state
- Track notification-ready updates

### 2. Department Staff

- Access department-specific queue
- Validate concerns
- Reject invalid concerns
- Resolve concerns
- Escalate unresolved concerns to HOD

### 3. HOD

- Review escalated concerns
- Continue action on unresolved department concerns
- Mark escalated concerns as resolved

### 4. Admin

- View system-wide concern flow
- Monitor departments, escalations, and notifications

## Local Run

Backend:

```bash
cd "/Users/Path_to_Directory/IssueOps"
.venv/bin/python -m uvicorn app.main:app --reload
```

Frontend:

```bash
cd "/Users/Path_to_Directory/IssueOps/frontend"
npm run dev
```
