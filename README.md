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
cd "/Users/klshreyan.reddy/Desktop/Only Coding/IssueOps/IssueOps"
.venv/bin/python -m uvicorn app.main:app --reload
```

Frontend:

```bash
cd "/Users/klshreyan.reddy/Desktop/Only Coding/IssueOps/IssueOps/frontend"
npm run dev
```

## Demo Accounts

- Student: `student@issueops.local` / `student123`
- Staff: `staff@issueops.local` / `staff123`
- HOD: `hod@issueops.local` / `hod123`
- Admin: `admin@issueops.local` / `admin123`

## Deployment

This repo is prepared for:

- `GitHub Pages` frontend deployment using [`deploy-pages.yml`](.github/workflows/deploy-pages.yml)
- `Render` backend deployment using [`render.yaml`](render.yaml)
- `Render Postgres` as the production database

Detailed steps are in [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Important Notes

- Local development uses `SQLite`
- Hosted deployment should use `Postgres`
- The frontend reads `VITE_API_BASE_URL`
- The backend reads `ISSUEOPS_DATABASE_URL` and `ISSUEOPS_ALLOWED_ORIGINS`
