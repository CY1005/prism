from pydantic import BaseModel, Field
from uuid import UUID


class TestPointsRequest(BaseModel):
    project_id: UUID
    requirement_text: str = Field(..., min_length=1)
    affected_modules: list[UUID]
    test_depth: str = "standard"  # "smoke" | "standard" | "comprehensive"


class TestPoint(BaseModel):
    id: str
    title: str
    description: str
    priority: str  # "P0" | "P1" | "P2"
    category: str  # "functional" | "boundary" | "exception" | "performance"
    related_module: UUID


class CoverageSummary(BaseModel):
    total: int
    by_priority: dict[str, int]
    by_category: dict[str, int]


class TestPointsResponse(BaseModel):
    test_points: list[TestPoint]
    coverage_summary: CoverageSummary
