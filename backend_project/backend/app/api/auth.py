from datetime import timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token
from app.utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    require_roles
)
from app.utils.logger import get_logger

logger = get_logger("api.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account with role assignment.
    """
    existing = db.query(User).filter((User.email == user_in.email) | (User.username == user_in.username)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email or username already exists"
        )
    
    # Validate role enum
    valid_roles = [r.value for r in UserRole]
    assigned_role = user_in.role.upper() if user_in.role else UserRole.VIEWER.value
    if assigned_role not in valid_roles:
        assigned_role = UserRole.VIEWER.value

    user = User(
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=assigned_role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"User registered: {user.username} ({user.role})")
    return user


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and issue signed JWT access token.
    """
    user = db.query(User).filter(
        (User.username == login_data.username_or_email) | (User.email == login_data.username_or_email)
    ).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": user.id, "username": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Retrieve authenticated user details.
    """
    return current_user


@router.post("/seed-users", summary="Seed Default System Users for Demo")
def seed_default_users(db: Session = Depends(get_db)):
    """
    Utility endpoint to populate default test users for all roles.
    """
    defaults = [
        {"email": "admin@decision.ai", "username": "admin", "full_name": "System Administrator", "password": "adminpassword123", "role": "ADMIN"},
        {"email": "analyst@decision.ai", "username": "analyst", "full_name": "Senior AI Analyst", "password": "analystpassword123", "role": "ANALYST"},
        {"email": "reviewer@decision.ai", "username": "reviewer", "full_name": "Safety Review Officer", "password": "reviewerpassword123", "role": "HUMAN_REVIEWER"},
        {"email": "viewer@decision.ai", "username": "viewer", "full_name": "Dashboard Viewer", "password": "viewerpassword123", "role": "VIEWER"}
    ]
    created = []
    for d in defaults:
        exists = db.query(User).filter(User.username == d["username"]).first()
        if not exists:
            u = User(
                email=d["email"],
                username=d["username"],
                full_name=d["full_name"],
                hashed_password=get_password_hash(d["password"]),
                role=d["role"],
                is_active=True
            )
            db.add(u)
            created.append(d["username"])
    db.commit()
    return {"message": "Default users seeded successfully", "created_users": created}
