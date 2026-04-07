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
            "ALTER TABLE issues ADD COLUMN department VARCHAR DEFAULT 'General Support'"
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

    if not alter_statements:
        return

    with engine.begin() as connection:
        for statement in alter_statements:
            connection.execute(text(statement))
