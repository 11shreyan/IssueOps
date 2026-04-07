from fastapi import APIRouter, Depends

from .. import models, schemas
from ..auth import get_current_user, require_roles
from .issues_v2 import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _build_stats(issues: list[models.Issue]) -> schemas.DashboardStats:
    return schemas.DashboardStats(
        total=len(issues),
        open=sum(1 for issue in issues if issue.status != "Resolved"),
        urgent=sum(1 for issue in issues if issue.immediate_action),
        resolved=sum(1 for issue in issues if issue.status == "Resolved"),
    )


@router.get("/student", response_model=schemas.DashboardResponse)
def student_dashboard(user: dict = Depends(require_roles("student")), db=Depends(get_db)):
    issues = (
        db.query(models.Issue)
        .filter(models.Issue.reported_by_email == user["email"])
        .order_by(models.Issue.id.desc())
        .all()
    )
    return schemas.DashboardResponse(
        role="student",
        department=None,
        stats=_build_stats(issues),
        issues=issues,
    )


@router.get("/staff", response_model=schemas.DashboardResponse)
def staff_dashboard(user: dict = Depends(require_roles("staff")), db=Depends(get_db)):
    issues = (
        db.query(models.Issue)
        .filter(models.Issue.department == user.get("department"))
        .order_by(models.Issue.report_count.desc(), models.Issue.id.desc())
        .all()
    )
    return schemas.DashboardResponse(
        role="staff",
        department=user.get("department"),
        stats=_build_stats(issues),
        issues=issues,
    )


@router.get("/admin", response_model=schemas.DashboardResponse)
def admin_dashboard(user: dict = Depends(require_roles("admin")), db=Depends(get_db)):
    issues = (
        db.query(models.Issue)
        .order_by(models.Issue.report_count.desc(), models.Issue.id.desc())
        .all()
    )
    return schemas.DashboardResponse(
        role="admin",
        department=None,
        stats=_build_stats(issues),
        issues=issues,
    )
