from pydantic import BaseModel, Field
from uuid import UUID


class AnalyzeContext(BaseModel):
    include_modules: list[UUID] | None = None


class AnalyzeRequest(BaseModel):
    project_id: UUID
    requirement_text: str = Field(..., min_length=1)
    context: AnalyzeContext | None = None


class AffectedModule(BaseModel):
    node_id: UUID
    node_name: str
    node_path: str
    impact_level: str  # "high" | "medium" | "low"
    reason: str


class AnalysisMetadata(BaseModel):
    model: str
    tokens_used: int
    analysis_time_ms: int


class AnalyzeResponse(BaseModel):
    affected_modules: list[AffectedModule]
    completeness_issues: list[str]
    suggestions: list[str]
    metadata: AnalysisMetadata
