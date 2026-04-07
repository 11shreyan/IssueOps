from fastapi import FastAPI
from .database import engine, Base, ensure_issue_schema
from .routes import auth_v1, dashboard_v1
from .routes import issues_v2 as issues
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)
ensure_issue_schema()

app = FastAPI(title="IssueOps")

app.include_router(auth_v1.router)
app.include_router(dashboard_v1.router)
app.include_router(issues.router)



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
