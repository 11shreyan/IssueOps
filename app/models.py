from sqlalchemy import Boolean, Column, Integer, String
from .database import Base

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    category = Column(String)
    department = Column(String, default="General Support")
    location = Column(String, default="Not specified")
    reported_by_name = Column(String, default="Unknown Reporter")
    reported_by_email = Column(String, default="unknown@issueops.local")
    reported_by_role = Column(String, default="student")
    assigned_to_role = Column(String, default="staff")
    status = Column(String, default="Reported")
    validation_state = Column(String, default="Pending Review")
    resolution_summary = Column(String, default="")
    rejected_reason = Column(String, default="")
    last_updated_at = Column(String, default="")
    created_at = Column(String, default="")
    resolved_at = Column(String, default="")
    escalation_due_at = Column(String, default="")
    escalated_to_hod = Column(Boolean, default=False)
    notification_message = Column(String, default="")
    report_count = Column(Integer, default=1)
    priority = Column(String, default="Low")
    immediate_action = Column(Boolean, default=False)
