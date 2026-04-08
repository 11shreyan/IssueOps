import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, ensure_issue_schema
from .routes import auth_v1, dashboard_v1
from .routes import issues_v2 as issues

Base.metadata.create_all(bind=engine)
ensure_issue_schema()

app = FastAPI(title="IssueOps")

app.include_router(auth_v1.router)
app.include_router(dashboard_v1.router)
app.include_router(issues.router)

allowed_origins_raw = os.getenv("ISSUEOPS_ALLOWED_ORIGINS", "*")
allowed_origins = [
    origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()
]
allow_all_origins = allowed_origins == ["*"] or not allowed_origins


@app.get("/health", tags=["health"])
def health():
    return {"ok": True}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all_origins else allowed_origins,
    allow_credentials=not allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
