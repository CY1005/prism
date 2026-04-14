"""Auth router: login, logout, refresh, me, admin user management."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from api.db import get_db
from api.models.tables import User
from api.schemas.auth import (
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    RefreshResponse,
    UserProfile,
    CreateUserRequest,
    CreateUserResponse,
    UserListItem,
    UserListResponse,
    UpdateUserRequest,
)
from api.services.auth import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    refresh_access_token,
    revoke_refresh_token,
    get_current_user,
    hash_password,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Dependency: extract current user from Authorization header ────

def require_user(
    authorization: str | None = Header(None),
    x_internal_token: str | None = Header(None),
    x_user_id: str | None = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """Dependency that requires a valid access token or internal service token."""
    import os, hmac
    # Internal service-to-service auth (Next.js server actions → FastAPI)
    internal_token = os.environ.get("INTERNAL_TOKEN", "")
    if x_internal_token and len(internal_token) >= 16 and x_user_id:
        if hmac.compare_digest(x_internal_token, internal_token):
            user = db.query(User).filter(User.id == x_user_id).first()
            if user and user.status == "active":
                return user

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未登录")
    token = authorization[7:]
    user = get_current_user(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="令牌无效或已过期")
    return user


def require_admin(user: User = Depends(require_user)) -> User:
    """Dependency that requires platform_admin role."""
    if user.role != "platform_admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user


# ─── Auth Endpoints ─────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Login with email + password. Returns access + refresh tokens (AC1, AC2, AC5, AC6, AC10)."""
    try:
        user, error = authenticate_user(db, req.email, req.password)
    except OperationalError as e:
        raise HTTPException(status_code=503, detail=f"数据库不可用: {e}")
    if error:
        status = 403 if "禁用" in error else 401
        raise HTTPException(status_code=status, detail=error)

    try:
        access_token = create_access_token(str(user.id), user.email, user.role)
        refresh_token = create_refresh_token(db, str(user.id))
    except OperationalError as e:
        raise HTTPException(status_code=503, detail=f"数据库不可用: {e}")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserProfile(
            id=str(user.id),
            email=user.email,
            name=user.name,
            role=user.role,
            status=user.status,
        ),
    )


@router.post("/refresh", response_model=RefreshResponse)
def refresh(req: RefreshRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token (AC7, AC8)."""
    try:
        new_access, user, error = refresh_access_token(db, req.refresh_token)
    except OperationalError as e:
        raise HTTPException(status_code=503, detail=f"数据库不可用: {e}")
    if error:
        status = 403 if "禁用" in error else 401
        raise HTTPException(status_code=status, detail=error)

    return RefreshResponse(access_token=new_access)


@router.post("/logout")
def logout(req: RefreshRequest, db: Session = Depends(get_db)):
    """Logout: revoke refresh token (AC9)."""
    revoke_refresh_token(db, req.refresh_token)
    return {"status": "ok"}


@router.get("/me", response_model=UserProfile)
def get_me(user: User = Depends(require_user)):
    """Get current user profile (AC4)."""
    return UserProfile(
        id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role,
        status=user.status,
    )


# ─── Admin: User Management (AC1, AC11) ─────────────────

@router.get("/users", response_model=UserListResponse)
def list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """List all users (admin only, AC11)."""
    rows = db.query(User).order_by(User.created_at.desc()).all()
    items = [
        UserListItem(
            id=str(u.id),
            email=u.email,
            name=u.name,
            role=u.role,
            status=u.status,
            created_at=u.created_at.isoformat() if u.created_at else None,
        )
        for u in rows
    ]
    return UserListResponse(users=items, total=len(items))


@router.post("/users", response_model=CreateUserResponse, status_code=201)
def create_user(
    req: CreateUserRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Create a new user (admin only, AC1)."""
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="该邮箱已被注册")

    user = User(
        id=uuid.uuid4(),
        email=req.email,
        name=req.name,
        password_hash=hash_password(req.password),
        role=req.role,
        status="active",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return CreateUserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role,
    )


@router.patch("/users/{user_id}")
def update_user(
    user_id: str,
    req: UpdateUserRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update user role or status (admin only, AC11)."""
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if req.role is not None:
        if req.role not in ("platform_admin", "user"):
            raise HTTPException(status_code=400, detail="无效的角色")
        user.role = req.role

    if req.status is not None:
        if req.status not in ("active", "disabled"):
            raise HTTPException(status_code=400, detail="无效的状态")
        user.status = req.status

    db.commit()
    return {"status": "updated", "user_id": user_id}
