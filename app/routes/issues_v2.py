from datetime import datetime, timedelta, timezone

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
    "Electrical": "EEE",
    "Plumbing": "Civil",
    "IT": "CSE",
    "Sanitation": "Civil",
    "General": "Others",
}
IMMEDIATE_ACTION_THRESHOLD = 5
ESCALATION_WINDOW_DAYS = 4
ACTIVE_STATUSES = {"Reported", "Acknowledged", "In Progress", "Escalated to HOD"}
FINAL_STATUSES = {"Resolved", "Rejected"}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def isoformat(value: datetime | None) -> str:
    if not value:
        return ""
    return value.replace(microsecond=0).isoformat()


def parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def build_notification(issue: models.Issue, message: str) -> None:
    issue.notification_message = message


def sync_escalation(issue: models.Issue) -> None:
    due_at = parse_datetime(issue.escalation_due_at)
    if issue.status in FINAL_STATUSES:
        return

    if issue.escalated_to_hod or issue.status == "Escalated to HOD":
        issue.assigned_to_role = "hod"
        issue.status = "Escalated to HOD"
        return

    if due_at and due_at <= utc_now():
        issue.escalated_to_hod = True
        issue.assigned_to_role = "hod"
        issue.status = "Escalated to HOD"
        issue.validation_state = "Escalated"
        build_notification(
            issue,
            "Your concern was escalated to the HOD because it was not resolved within 4 days.",
        )


def can_access_issue(user: dict, issue: models.Issue) -> bool:
    if user["role"] == "admin":
        return True
    if user["role"] == "student":
        return issue.reported_by_email == user["email"]
    if user["role"] == "staff":
        return (
            issue.department == user.get("department")
            and issue.assigned_to_role == "staff"
        )
    if user["role"] == "hod":
        return issue.department == user.get("department")
    return False


def ensure_issue_access(user: dict, issue: models.Issue) -> None:
    if not can_access_issue(user, issue):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this concern",
        )


def apply_issue_action(
    issue: models.Issue,
    payload: schemas.IssueStatusUpdate,
    actor: dict,
) -> None:
    now = utc_now()
    issue.last_updated_at = isoformat(now)

    if payload.validation_state:
        issue.validation_state = payload.validation_state

    if payload.rejected_reason is not None:
        issue.rejected_reason = payload.rejected_reason.strip()

    if payload.resolution_summary is not None:
        issue.resolution_summary = payload.resolution_summary.strip()

    next_status = payload.status.strip()
    role = actor["role"]

    if role == "staff":
        if next_status == "Rejected":
            issue.status = "Rejected"
            issue.validation_state = "Rejected"
            issue.assigned_to_role = "staff"
            issue.resolved_at = ""
            build_notification(
                issue,
                f"Your concern was rejected by the department staff. Reason: {issue.rejected_reason or 'Not provided'}",
            )
            return

        if next_status == "Escalated to HOD":
            issue.status = "Escalated to HOD"
            issue.validation_state = "Escalated"
            issue.assigned_to_role = "hod"
            issue.escalated_to_hod = True
            build_notification(
                issue,
                "Your concern has been escalated to the HOD for further review.",
            )
            return

        if next_status not in {"Acknowledged", "In Progress", "Resolved"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Staff can acknowledge, progress, resolve, reject, or escalate concerns",
            )

        issue.status = next_status
        issue.validation_state = "Validated"
        if next_status == "Resolved":
            issue.resolved_at = isoformat(now)
            build_notification(
                issue,
                "Your concern was resolved by the department staff and a mail notification is ready to send.",
            )
        else:
            build_notification(
                issue,
                f"Your concern status was updated to {next_status} by department staff.",
            )
        return

    if role == "hod":
        if next_status not in {"In Progress", "Resolved"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="HOD can continue work or mark the escalated concern as resolved",
            )

        issue.status = next_status
        issue.validation_state = "Validated"
        issue.assigned_to_role = "hod"
        issue.escalated_to_hod = True
        if next_status == "Resolved":
            issue.resolved_at = isoformat(now)
            build_notification(
                issue,
                "Your escalated concern was resolved by the HOD and a mail notification is ready to send.",
            )
        else:
            build_notification(
                issue,
                "Your escalated concern is being handled by the HOD.",
            )
        return

    if role == "admin":
        issue.status = next_status
        if next_status == "Escalated to HOD":
            issue.assigned_to_role = "hod"
            issue.escalated_to_hod = True
            issue.validation_state = "Escalated"
        elif next_status == "Rejected":
            issue.validation_state = "Rejected"
        elif next_status == "Resolved":
            issue.resolved_at = isoformat(now)
            issue.validation_state = "Validated"
        build_notification(issue, f"Concern updated to {next_status} by admin.")
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only staff, HOD, or admin can update concerns",
    )


@router.post("/issues", response_model=schemas.IssueResponse, tags=["issues"])
def create_issue(
    issue: schemas.IssueCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    resolved_category = issue.category or classify_issue(issue.description)
    resolved_department = DEPARTMENT_BY_CATEGORY.get(resolved_category, "Others")
    resolved_location = issue.location or "Not specified"
    now = utc_now()
    due_at = now + timedelta(days=ESCALATION_WINDOW_DAYS)

    existing_issues = db.query(models.Issue).all()

    for existing in existing_issues:
        sync_escalation(existing)
        if (
            existing.category == resolved_category
            and existing.location == resolved_location
            and existing.status not in FINAL_STATUSES
            and is_similar(issue.description, existing.description)
        ):
            existing.report_count += 1
            existing.priority = get_priority(existing.report_count)
            existing.immediate_action = (
                existing.report_count >= IMMEDIATE_ACTION_THRESHOLD
            )
            existing.last_updated_at = isoformat(now)
            build_notification(
                existing,
                "A duplicate concern was linked to your report and the latest status is available for tracking.",
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
        assigned_to_role="staff",
        status="Reported",
        validation_state="Pending Review",
        report_count=1,
        priority=get_priority(1),
        immediate_action=False,
        created_at=isoformat(now),
        last_updated_at=isoformat(now),
        escalation_due_at=isoformat(due_at),
        notification_message="Concern lodged successfully. A mail notification is ready to send.",
    )

    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)
    return new_issue


@router.get("/issues", response_model=list[schemas.IssueResponse], tags=["issues"])
def get_issues(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    issues = (
        db.query(models.Issue)
        .order_by(models.Issue.report_count.desc(), models.Issue.id.desc())
        .all()
    )
    changed = False
    visible_issues = []
    for issue in issues:
        before_status = issue.status
        before_role = issue.assigned_to_role
        sync_escalation(issue)
        if issue.status != before_status or issue.assigned_to_role != before_role:
            changed = True
        if can_access_issue(user, issue):
            visible_issues.append(issue)
    if changed:
        db.commit()
    return visible_issues


@router.get("/issues/{issue_id}", response_model=schemas.IssueResponse, tags=["issues"])
def get_issue(
    issue_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)
):
    issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    sync_escalation(issue)
    ensure_issue_access(user, issue)
    db.commit()
    db.refresh(issue)
    return issue


@router.put("/issues/{issue_id}", response_model=schemas.IssueResponse, tags=["issues"])
def update_status(
    issue_id: int,
    payload: schemas.IssueStatusUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles("staff", "hod", "admin")),
):
    issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    sync_escalation(issue)
    ensure_issue_access(user, issue)
    apply_issue_action(issue, payload, user)

    db.commit()
    db.refresh(issue)
    return issue
