from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import SessionLocal
from ..utils.classifier import classify_issue
from ..utils.similarity import is_similar
from ..utils.priority import get_priority

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/issues", response_model=schemas.IssueResponse)
def create_issue(issue: schemas.IssueCreate, db: Session = Depends(get_db)):

    # Step 1: Check for duplicates
    existing_issues = db.query(models.Issue).all()

    for existing in existing_issues:
        if is_similar(issue.description, existing.description):

            # Duplicate found
            existing.report_count += 1
            existing.priority = get_priority(existing.report_count)

            db.commit()
            db.refresh(existing)

            return existing

    # Step 2: No duplicate → create new issue
    from ..utils.classifier import classify_issue

    category = classify_issue(issue.description)

    new_issue = models.Issue(
        title=issue.title,
        description=issue.description,
        category=category,
        report_count=1,
        priority="Low"
    )

    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)

    return new_issue

@router.get("/issues")
def get_issues(db: Session = Depends(get_db)):
    return db.query(models.Issue).all()

@router.put("/issues/{issue_id}")
def update_status(issue_id: int, status: str, db: Session = Depends(get_db)):
    issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if issue:
        issue.status = status
        db.commit()
        return {"message": "Updated"}
    return {"error": "Issue not found"}