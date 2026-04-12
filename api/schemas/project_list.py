from pydantic import BaseModel, Field


class ProjectSummary(BaseModel):
    id: str
    name: str
    description: str | None = None
    template_type: str
    hierarchy_labels: list[str] = []
    total_nodes: int
    total_files: int
    avg_completion: float
    created_at: str | None = None


class ProjectListResponse(BaseModel):
    projects: list[ProjectSummary]
    total: int


class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    template_type: str = "custom"


class ProjectCreateResponse(BaseModel):
    id: str
    name: str
    template_type: str
    hierarchy_labels: list[str] = []


class ProjectUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    hierarchy_labels: list[str] | None = None


class MemberAddRequest(BaseModel):
    email: str = Field(..., min_length=1)
    role: str = Field(default="viewer")


class MemberUpdateRequest(BaseModel):
    role: str


class MemberResponse(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    created_at: str | None = None


class DeletedProjectSummary(BaseModel):
    id: str
    name: str
    description: str | None = None
    template_type: str
    deleted_at: str | None = None
    created_at: str | None = None
