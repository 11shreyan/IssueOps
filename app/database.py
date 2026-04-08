import os

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

DATABASE_URL = os.getenv("ISSUEOPS_DATABASE_URL", "sqlite://")

engine_kwargs = {"connect_args": {"check_same_thread": False}}
if DATABASE_URL == "sqlite://":
    engine_kwargs["poolclass"] = StaticPool

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()


def ensure_issue_schema():
    inspector = inspect(engine)
    if "issues" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("issues")}
    alter_statements = []

    if "department" not in columns:
        alter_statements.append(
            "ALTER TABLE issues ADD COLUMN department VARCHAR DEFAULT 'Others'"
        )
    if "location" not in columns:
        alter_statements.append(
            "ALTER TABLE issues ADD COLUMN location VARCHAR DEFAULT 'Not specified'"
        )
    if "immediate_action" not in columns:
        alter_statements.append(
            "ALTER TABLE issues ADD COLUMN immediate_action BOOLEAN DEFAULT 0"
        )
    if "reported_by_name" not in columns:
        alter_statements.append(
            "ALTER TABLE issues ADD COLUMN reported_by_name VARCHAR DEFAULT 'Unknown Reporter'"
        )
    if "reported_by_email" not in columns:
        alter_statements.append(
            "ALTER TABLE issues ADD COLUMN reported_by_email VARCHAR DEFAULT 'unknown@issueops.local'"
        )
    if "reported_by_role" not in columns:
        alter_statements.append(
            "ALTER TABLE issues ADD COLUMN reported_by_role VARCHAR DEFAULT 'student'"
        )
    if "assigned_to_role" not in columns:
        alter_statements.append(
            "ALTER TABLE issues ADD COLUMN assigned_to_role VARCHAR DEFAULT 'staff'"
        )
    if "validation_state" not in columns:
        alter_statements.append(
            "ALTER TABLE issues ADD COLUMN validation_state VARCHAR DEFAULT 'Pending Review'"
        )
    if "resolution_summary" not in columns:
        alter_statements.append(
            "ALTER TABLE issues ADD COLUMN resolution_summary VARCHAR DEFAULT ''"
        )
    if "rejected_reason" not in columns:
        alter_statements.append(
            "ALTER TABLE issues ADD COLUMN rejected_reason VARCHAR DEFAULT ''"
        )
    if "last_updated_at" not in columns:
        alter_statements.append(
            "ALTER TABLE issues ADD COLUMN last_updated_at VARCHAR DEFAULT ''"
        )
    if "created_at" not in columns:
        alter_statements.append(
            "ALTER TABLE issues ADD COLUMN created_at VARCHAR DEFAULT ''"
        )
    if "resolved_at" not in columns:
        alter_statements.append(
            "ALTER TABLE issues ADD COLUMN resolved_at VARCHAR DEFAULT ''"
        )
    if "escalation_due_at" not in columns:
        alter_statements.append(
            "ALTER TABLE issues ADD COLUMN escalation_due_at VARCHAR DEFAULT ''"
        )
    if "escalated_to_hod" not in columns:
        alter_statements.append(
            "ALTER TABLE issues ADD COLUMN escalated_to_hod BOOLEAN DEFAULT 0"
        )
    if "notification_message" not in columns:
        alter_statements.append(
            "ALTER TABLE issues ADD COLUMN notification_message VARCHAR DEFAULT ''"
        )

    if not alter_statements:
        return

    with engine.begin() as connection:
        for statement in alter_statements:
            connection.execute(text(statement))
