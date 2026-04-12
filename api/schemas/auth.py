from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserProfile"


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    role: str
    status: str


class CreateUserRequest(BaseModel):
    email: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    password: str = Field(..., min_length=6)
    role: str = Field(default="user")


class CreateUserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str


class UserListItem(BaseModel):
    id: str
    email: str
    name: str
    role: str
    status: str
    created_at: str | None = None


class UserListResponse(BaseModel):
    users: list[UserListItem]
    total: int


class UpdateUserRequest(BaseModel):
    role: str | None = None
    status: str | None = None
