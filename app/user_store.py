import json
from pathlib import Path

from .security import hash_password

USERS_PATH = Path(__file__).resolve().parent / "users.json"

SEED_USERS = [
    {
        "name": "Aarav Student",
        "email": "student@issueops.local",
        "role": "student",
        "department": None,
        "password": "student123",
    },
    {
        "name": "Meera Electrical",
        "email": "staff@issueops.local",
        "role": "staff",
        "department": "EEE",
        "password": "staff123",
    },
    {
        "name": "Dr Kavya HOD",
        "email": "hod@issueops.local",
        "role": "hod",
        "department": "EEE",
        "password": "hod123",
    },
    {
        "name": "Admin Priya",
        "email": "admin@issueops.local",
        "role": "admin",
        "department": None,
        "password": "admin123",
    },
]


def _bootstrap_users():
    if USERS_PATH.exists():
        return

    users = []
    for user in SEED_USERS:
        users.append(
            {
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
                "department": user["department"],
                "profile_image": None,
                "password_hash": hash_password(user["password"]),
            }
        )
    USERS_PATH.write_text(json.dumps(users, indent=2), encoding="utf-8")


def _load_users() -> list[dict]:
    _bootstrap_users()
    return json.loads(USERS_PATH.read_text(encoding="utf-8"))


def _save_users(users: list[dict]):
    USERS_PATH.write_text(json.dumps(users, indent=2), encoding="utf-8")


def list_users() -> list[dict]:
    return _load_users()


def get_user_by_email(email: str) -> dict | None:
    resolved_email = email.strip().lower()
    return next(
        (user for user in _load_users() if user["email"].strip().lower() == resolved_email),
        None,
    )


def create_user(user: dict) -> dict:
    users = _load_users()
    users.append(user)
    _save_users(users)
    return user


def update_user(email: str, updates: dict) -> dict | None:
    resolved_email = email.strip().lower()
    users = _load_users()

    for index, user in enumerate(users):
        if user["email"].strip().lower() != resolved_email:
            continue

        updated_user = {**user, **updates}
        users[index] = updated_user
        _save_users(users)
        return updated_user

    return None
