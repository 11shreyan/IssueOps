from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user, require_roles
from ..database import SessionLocal
from ..utils.classifier import classify_issue
from ..utils.priority import get_priority
from ..utils.similarity import is_similar

router = APIRouter()

DEPARTMENT_BY_CATEGORY = {
    "Electrical": "Electrical Department",
    "Plumbing": "Plumbing Department",
    "IT": "IT Support",
    "Sanitation": "Sanitation Department",
    "General": "Campus Operations",
}
IMMEDIATE_ACTION_THRESHOLD = 5


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/issues", response_model=schemas.IssueResponse, tags=["issues"])
def create_issue(
    issue: schemas.IssueCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    resolved_category = issue.category or classify_issue(issue.description)
    resolved_department = DEPARTMENT_BY_CATEGORY.get(
        resolved_category, "Campus Operations"
    )
    resolved_location = issue.location or "Not specified"

    existing_issues = db.query(models.Issue).all()

    for existing in existing_issues:
        if (
            existing.category == resolved_category
            and existing.location == resolved_location
            and is_similar(issue.description, existing.description)
        ):
            existing.report_count += 1
            existing.priority = get_priority(existing.report_count)
            existing.immediate_action = (
                existing.report_count >= IMMEDIATE_ACTION_THRESHOLD
            )

            db.commit()
            db.refresh(existing)
            return existing

    new_issue = models.Issue(
        title=issue.title,
        description=issue.description,
        category=resolved_category,
        department=resolved_department,
        location=resolved_location,
        reported_by_name=user["name"],
        reported_by_email=user["email"],
        reported_by_role=user["role"],
        status="Reported",
        report_count=1,
        priority=get_priority(1),
        immediate_action=False,
    )

    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)
    return new_issue


@router.get("/issues", response_model=list[schemas.IssueResponse], tags=["issues"])
def get_issues(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return (
        db.query(models.Issue)
        .order_by(models.Issue.report_count.desc(), models.Issue.id.desc())
        .all()
    )


@router.get("/issues/{issue_id}", response_model=schemas.IssueResponse, tags=["issues"])
def get_issue(
    issue_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)
):
    issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    if user["role"] == "student" and issue.reported_by_email != user["email"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students can only view their own issues",
        )
    if user["role"] == "staff" and issue.department != user.get("department"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff can only view issues for their department",
        )
    return issue


@router.put("/issues/{issue_id}", tags=["issues"])
def update_status(
    issue_id: int,
    payload: schemas.IssueStatusUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles("staff", "admin")),
):
    issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    if user["role"] == "staff" and issue.department != user.get("department"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff can only update issues for their department",
        )

    issue.status = payload.status
    db.commit()
    db.refresh(issue)
    return {"message": "Updated", "issue": issue}
