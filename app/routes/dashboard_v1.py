from fastapi import APIRouter, Depends

from .. import models, schemas
from ..auth import require_roles
from .issues_v2 import get_db, sync_escalation

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _build_stats(issues: list[models.Issue]) -> schemas.DashboardStats:
    return schemas.DashboardStats(
        total=len(issues),
        open=sum(1 for issue in issues if issue.status not in {"Resolved", "Rejected"}),
        urgent=sum(1 for issue in issues if issue.immediate_action),
        resolved=sum(1 for issue in issues if issue.status == "Resolved"),
    )


def _notification_items(issues: list[models.Issue]) -> list[schemas.NotificationItem]:
    return [
        schemas.NotificationItem(
            issue_id=issue.id,
            message=issue.notification_message,
            sent_at=issue.last_updated_at or issue.created_at,
        )
        for issue in issues
        if issue.notification_message
    ]


def _prepare_issues(issues: list[models.Issue]) -> list[models.Issue]:
    for issue in issues:
        sync_escalation(issue)
    return issues


@router.get("/student", response_model=schemas.DashboardBundleResponse)
def student_dashboard(user: dict = Depends(require_roles("student")), db=Depends(get_db)):
    issues = _prepare_issues(
        (
        db.query(models.Issue)
        .filter(models.Issue.reported_by_email == user["email"])
        .order_by(models.Issue.id.desc())
        .all()
        )
    )
    db.commit()
    return schemas.DashboardBundleResponse(
        role="student",
        department=user.get("department"),
        stats=_build_stats(issues),
        issues=issues,
        notifications=_notification_items(issues),
    )


@router.get("/staff", response_model=schemas.DashboardBundleResponse)
def staff_dashboard(user: dict = Depends(require_roles("staff")), db=Depends(get_db)):
    issues = _prepare_issues(
        (
        db.query(models.Issue)
        .filter(models.Issue.department == user.get("department"))
        .filter(models.Issue.assigned_to_role == "staff")
        .order_by(models.Issue.report_count.desc(), models.Issue.id.desc())
        .all()
        )
    )
    db.commit()
    return schemas.DashboardBundleResponse(
        role="staff",
        department=user.get("department"),
        stats=_build_stats(issues),
        issues=issues,
        notifications=_notification_items(issues),
    )


@router.get("/hod", response_model=schemas.DashboardBundleResponse)
def hod_dashboard(user: dict = Depends(require_roles("hod")), db=Depends(get_db)):
    issues = _prepare_issues(
        (
        db.query(models.Issue)
        .filter(models.Issue.department == user.get("department"))
        .filter(models.Issue.assigned_to_role == "hod")
        .order_by(models.Issue.report_count.desc(), models.Issue.id.desc())
        .all()
        )
    )
    db.commit()
    return schemas.DashboardBundleResponse(
        role="hod",
        department=user.get("department"),
        stats=_build_stats(issues),
        issues=issues,
        notifications=_notification_items(issues),
    )


@router.get("/admin", response_model=schemas.DashboardBundleResponse)
def admin_dashboard(user: dict = Depends(require_roles("admin")), db=Depends(get_db)):
    issues = _prepare_issues(
        (
        db.query(models.Issue)
        .order_by(models.Issue.report_count.desc(), models.Issue.id.desc())
        .all()
        )
    )
    db.commit()
    return schemas.DashboardBundleResponse(
        role="admin",
        department=None,
        stats=_build_stats(issues),
        issues=issues,
        notifications=_notification_items(issues),
    )
