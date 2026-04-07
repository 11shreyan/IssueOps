import base64
import hashlib
import hmac
import json
import os
import secrets
import time

TOKEN_SECRET = os.getenv("ISSUEOPS_TOKEN_SECRET", "issueops-dev-secret")
TOKEN_TTL_SECONDS = 60 * 60 * 12


def hash_password(password: str, salt: str | None = None) -> str:
    resolved_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), resolved_salt.encode("utf-8"), 100000
    ).hex()
    return f"{resolved_salt}${digest}"


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        salt, _ = hashed_password.split("$", 1)
    except ValueError:
        return False

    return hmac.compare_digest(hash_password(password, salt), hashed_password)


def create_access_token(user: dict) -> str:
    payload = {
        "email": user["email"],
        "role": user["role"],
        "department": user.get("department"),
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    encoded_payload = base64.urlsafe_b64encode(payload_bytes).decode("utf-8").rstrip("=")
    signature = hmac.new(
        TOKEN_SECRET.encode("utf-8"),
        encoded_payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{encoded_payload}.{signature}"


def decode_access_token(token: str) -> dict:
    encoded_payload, signature = token.split(".", 1)
    expected_signature = hmac.new(
        TOKEN_SECRET.encode("utf-8"),
        encoded_payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(signature, expected_signature):
        raise ValueError("Invalid token signature")

    padding = "=" * (-len(encoded_payload) % 4)
    payload = json.loads(
        base64.urlsafe_b64decode(f"{encoded_payload}{padding}".encode("utf-8"))
    )
    if payload["exp"] < int(time.time()):
        raise ValueError("Token expired")
    return payload
