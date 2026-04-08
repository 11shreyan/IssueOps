import os

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

def normalize_database_url(raw_url: str) -> str:
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql+psycopg://", 1)
    if raw_url.startswith("postgresql://") and "+psycopg" not in raw_url:
        return raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return raw_url


DATABASE_URL = normalize_database_url(
    os.getenv("ISSUEOPS_DATABASE_URL", "sqlite:///./issueops.db")
)
IS_SQLITE = DATABASE_URL.startswith("sqlite")

engine_kwargs = {}
if IS_SQLITE:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
if DATABASE_URL == "sqlite://":
    engine_kwargs["poolclass"] = StaticPool

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()


def ensure_issue_schema():
    if not IS_SQLITE:
        return

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
