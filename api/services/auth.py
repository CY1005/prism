"""Authentication service: JWT tokens + bcrypt password verification."""

import hashlib
import logging
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from sqlalchemy.orm import Session

from api.models.tables import User, RefreshToken

logger = logging.getLogger(__name__)

JWT_SECRET = os.environ.get("JWT_SECRET", "prism-dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7
MAX_FAILED_ATTEMPTS = 5
LOCK_DURATION_MINUTES = 15


def verify_password(plain: str, hashed: str) -> bool:
    """Compare plain password against bcrypt hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def hash_password(plain: str) -> str:
    """Hash password with bcrypt."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")


def create_access_token(user_id: str, email: str, role: str) -> str:
    """Create a short-lived JWT access token (15 min)."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(db: Session, user_id: str) -> str:
    """Create a refresh token, store its hash in DB, return raw token."""
    raw_token = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    record = RefreshToken(
        id=uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(record)
    db.commit()
    return raw_token


def decode_access_token(token: str) -> dict | None:
    """Decode and validate an access token. Returns payload or None."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def authenticate_user(db: Session, email: str, password: str) -> tuple[User | None, str | None]:
    """Authenticate user by email+password.

    Returns (user, error_message).
    - Success: (user, None)
    - Failure: (None, error_string)
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # AC2: don't reveal whether email exists
        return None, "邮箱或密码错误"

    # AC5/AC12: check disabled status
    if user.status == "disabled":
        return None, "账号已被禁用，请联系管理员"

    # Check account lock
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        return None, "账号已被锁定，请稍后重试"

    # Verify password (AC10: bcrypt)
    if not verify_password(password, user.password_hash):
        user.failed_login_count = (user.failed_login_count or 0) + 1
        if user.failed_login_count >= MAX_FAILED_ATTEMPTS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCK_DURATION_MINUTES)
        db.commit()
        return None, "邮箱或密码错误"

    # Reset failed count on success
    if user.failed_login_count > 0:
        user.failed_login_count = 0
        user.locked_until = None
        db.commit()

    return user, None


def refresh_access_token(db: Session, raw_refresh_token: str) -> tuple[str | None, User | None, str | None]:
    """Validate refresh token and issue new access token.

    Returns (new_access_token, user, error_message).
    """
    token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

    if not record:
        return None, None, "无效的刷新令牌"

    if record.expires_at < datetime.now(timezone.utc):
        db.delete(record)
        db.commit()
        return None, None, "刷新令牌已过期"

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        db.delete(record)
        db.commit()
        return None, None, "用户不存在"

    # AC8: check disabled status on refresh
    if user.status == "disabled":
        db.delete(record)
        db.commit()
        return None, None, "账号已被禁用，请联系管理员"

    new_access = create_access_token(str(user.id), user.email, user.role)
    return new_access, user, None


def revoke_refresh_token(db: Session, raw_refresh_token: str) -> bool:
    """Delete a refresh token from DB (AC9: logout)."""
    token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if record:
        db.delete(record)
        db.commit()
        return True
    return False


def revoke_all_user_tokens(db: Session, user_id: str) -> int:
    """Revoke all refresh tokens for a user."""
    count = db.query(RefreshToken).filter(
        RefreshToken.user_id == uuid.UUID(user_id)
    ).delete()
    db.commit()
    return count


def get_current_user(db: Session, token: str) -> User | None:
    """Validate access token and return the user."""
    payload = decode_access_token(token)
    if not payload:
        return None

    user = db.query(User).filter(User.id == uuid.UUID(payload["sub"])).first()
    if not user or user.status == "disabled":
        return None

    # Check if token was issued before invalidation
    if user.token_invalidated_at:
        issued_at = datetime.fromtimestamp(payload["iat"], tz=timezone.utc)
        if issued_at < user.token_invalidated_at.replace(tzinfo=timezone.utc):
            return None

    return user
