from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class LoginResponse(BaseModel):
    user_id: str
    email: str
    name: str
    token: str  # JWT placeholder


class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    role: str
