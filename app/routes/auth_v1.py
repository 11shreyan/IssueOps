from fastapi import APIRouter, Depends, HTTPException, status

from ..auth import get_current_user
from .. import schemas
from ..security import create_access_token, hash_password, verify_password
from ..user_store import create_user, get_user_by_email, update_user

router = APIRouter(prefix="/auth", tags=["auth"])


def _serialize_user(user: dict) -> schemas.UserResponse:
    return schemas.UserResponse(
        name=user["name"],
        email=user["email"],
        role=user["role"],
        department=user.get("department"),
        profile_image=user.get("profile_image"),
    )


@router.post("/register", response_model=schemas.AuthResponse)
def register(payload: schemas.UserRegister):
    email = payload.email.strip().lower()
    if get_user_by_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    resolved_department = payload.department
    if payload.role == "admin":
        resolved_department = None
    elif not resolved_department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department is required for students, staff, and HOD users",
        )

    user = {
        "name": payload.name.strip(),
        "email": email,
        "role": payload.role,
        "department": resolved_department,
        "profile_image": payload.profile_image,
        "password_hash": hash_password(payload.password),
    }
    create_user(user)
    return schemas.AuthResponse(
        access_token=create_access_token(user),
        user=_serialize_user(user),
    )


@router.post("/login", response_model=schemas.AuthResponse)
def login(payload: schemas.UserLogin):
    user = get_user_by_email(payload.email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return schemas.AuthResponse(
        access_token=create_access_token(user),
        user=_serialize_user(user),
    )


@router.get("/me", response_model=schemas.UserResponse)
def me(user: dict = Depends(get_current_user)):
    return _serialize_user(user)


@router.put("/me", response_model=schemas.AuthResponse)
def update_profile(
    payload: schemas.UserProfileUpdate, user: dict = Depends(get_current_user)
):
    resolved_department = payload.department if user["role"] != "admin" else None
    updated_user = update_user(
        user["email"],
        {
            "name": payload.name.strip(),
            "department": resolved_department,
            "profile_image": payload.profile_image,
        },
    )
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User no longer exists",
        )

    return schemas.AuthResponse(
        access_token=create_access_token(updated_user),
        user=_serialize_user(updated_user),
    )
