# Getting Started

This file explains exactly what someone should do after copying or cloning the `IssueOps` repository for the first time.

## Project Structure

- Backend: `FastAPI`
- Frontend: `Vite`
- Current auth: backend token-based auth with seeded demo users

## Prerequisites

Install these before running the project:

- Python 3.11+ recommended
- Node.js 18+ recommended
- npm

## 1. Clone Or Copy The Repository

```powershell
git clone <your-repo-url>
cd IssueOps
```

If the repo was shared as a folder instead of Git, just open the project folder in your terminal.

## 2. Backend Setup

Run these commands once after cloning:

```powershell
cd C:\path\to\IssueOps
pip install -r requirements.txt
```

## 3. Frontend Setup

Run these commands once after cloning:

```powershell
cd C:\path\to\IssueOps\frontend
npm install
```

## 4. Start The Backend

Open a terminal and run:

```powershell
cd C:\path\to\IssueOps
python -m uvicorn app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Swagger docs:

```text
http://127.0.0.1:8000/docs
```

## 5. Start The Frontend

Open a second terminal and run:

```powershell
cd C:\path\to\IssueOps\frontend
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173
```

## 6. Demo Login Accounts

Use these seeded accounts:

- Student: `student@issueops.local` / `student123`
- Staff: `staff@issueops.local` / `staff123`
- Admin: `admin@issueops.local` / `admin123`

## First-Time Setup Summary

These commands are normally needed only once per machine:

```powershell
cd C:\path\to\IssueOps
pip install -r requirements.txt

cd C:\path\to\IssueOps\frontend
npm install
```

These commands are needed every time you want to run the app:

```powershell
cd C:\path\to\IssueOps
python -m uvicorn app.main:app --reload
```

```powershell
cd C:\path\to\IssueOps\frontend
npm run dev
```

## Notes About Current Storage

- Users are currently stored in `app/users.json`
- The backend currently uses the app's configured SQLAlchemy setup for issues
- Seed users are created automatically if `app/users.json` does not exist

## Troubleshooting

### If `uvicorn` is not recognized

Run:

```powershell
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### If frontend dev server fails because of Vite cache issues

Run:

```powershell
cd C:\path\to\IssueOps\frontend
Remove-Item -Recurse -Force .vite-cache
npm run dev
```

### If `npm` is not recognized

Install Node.js, then reopen the terminal.

### If Python packages are missing

Run:

```powershell
pip install -r requirements.txt
```

## Recommended Share Instructions

If you are sending this repo to someone else, tell them:

1. Install Python and Node.js first.
2. Run backend dependency install once.
3. Run frontend dependency install once.
4. Start backend in one terminal.
5. Start frontend in another terminal.
6. Use one of the seeded demo accounts to log in.
