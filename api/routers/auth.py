from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.db import get_db
from api.schemas.auth import LoginRequest, LoginResponse, UserProfile
from api.models.tables import User

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Mock login — returns user info with placeholder token."""
    try:
        user = db.query(User).filter(User.email == req.email).first()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # In production: verify password hash, generate JWT
    return LoginResponse(
        user_id=str(user.id),
        email=user.email,
        name=user.name,
        token="mock-jwt-token",
    )


@router.get("/me", response_model=UserProfile)
def get_me():
    """Mock current user profile."""
    return UserProfile(
        id="mock-user-id",
        email="cy@example.com",
        name="陈琦",
        role="user",
    )
