# Deployment Guide

This project is prepared for:

- `GitHub Pages` for the Vite frontend
- `Render` for the FastAPI backend
- `Render Postgres` for production data

## 1. Deploy The Backend To Render

### Option A: Using `render.yaml`

1. Push this repository to GitHub.
2. In Render, create a new Blueprint and select this repo.
3. Render will read [`render.yaml`](render.yaml).
4. After the database and web service are created, open the web service settings.
5. Set:

```text
ISSUEOPS_ALLOWED_ORIGINS=https://<your-github-username>.github.io
```

If your repo is not your root pages site, use:

```text
ISSUEOPS_ALLOWED_ORIGINS=https://<your-github-username>.github.io
```

The backend health endpoint will be:

```text
https://<your-render-service>.onrender.com/health
```

### Option B: Manual Render Setup

Create:

- A `Postgres` database on Render
- A `Web Service` on Render from this repo

Use:

```text
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set environment variables:

```text
ISSUEOPS_DATABASE_URL=<Render Postgres connection string>
ISSUEOPS_ALLOWED_ORIGINS=https://<your-github-username>.github.io
```

## 2. Configure GitHub Pages

This repo includes [`deploy-pages.yml`](.github/workflows/deploy-pages.yml), which builds and deploys the frontend automatically from the `main` branch.

In your GitHub repository:

1. Go to `Settings -> Pages`
2. Set source to `GitHub Actions`
3. Go to `Settings -> Secrets and variables -> Actions -> Variables`
4. Add this repository variable:

```text
VITE_API_BASE_URL=https://<your-render-service>.onrender.com
```

## 3. Resulting URLs

- Frontend:

```text
https://<your-github-username>.github.io/<repo-name>/
```

- Backend docs:

```text
https://<your-render-service>.onrender.com/docs
```

## 4. Local Production-Like Test

Backend:

```bash
cd "/Users/klshreyan.reddy/Desktop/Only Coding/IssueOps/IssueOps"
ISSUEOPS_DATABASE_URL=sqlite:///./issueops.db ISSUEOPS_ALLOWED_ORIGINS=http://127.0.0.1:5174 .venv/bin/python -m uvicorn app.main:app --reload --port 8001
```

Frontend:

```bash
cd "/Users/klshreyan.reddy/Desktop/Only Coding/IssueOps/IssueOps/frontend"
VITE_API_BASE_URL=http://127.0.0.1:8001 VITE_BASE_PATH=/IssueOps/ npm run build
```
