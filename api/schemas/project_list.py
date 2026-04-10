from pydantic import BaseModel, Field


class ProjectSummary(BaseModel):
    id: str
    name: str
    description: str | None = None
    template_type: str
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
