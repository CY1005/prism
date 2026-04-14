from pydantic import BaseModel, Field
from uuid import UUID
from typing import Literal


# ─── Legacy schemas (backward compat) ────────────────

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


# ─── F13 new schemas ─────────────────────────────────

class RequirementAnalysisRequest(BaseModel):
    project_id: UUID
    node_id: UUID
    requirement_text: str = Field(..., min_length=1)
    file_content: str | None = None  # markdown / word text
    analysis_level: Literal["L1", "L2", "L3"] = "L1"


class SaveAnalysisRequest(BaseModel):
    project_id: UUID
    node_id: UUID
    analysis_result: str
    metadata: dict | None = None
    affected_node_ids: list[str] | None = None  # F13 AC4: node IDs affected by the analysis


class AffectedNodesResponse(BaseModel):
    node_id: str
    affected_node_ids: list[str]
    analysis_record_id: UUID | None = None


class SaveAnalysisResponse(BaseModel):
    dimension_record_id: UUID
    message: str


class GenerateTestPointsRequest(BaseModel):
    project_id: UUID
    node_id: UUID
    analysis_result: str
    test_depth: Literal["smoke", "standard", "comprehensive"] = "standard"


class AITestPoint(BaseModel):
    title: str
    description: str
    priority: str  # P0 / P1 / P2
    category: str  # functional / boundary / exception / performance
    steps: list[str] | None = None
    expected_result: str | None = None


class GenerateTestPointsResponse(BaseModel):
    test_points: list[AITestPoint]
    total: int


class SaveTestPointsRequest(BaseModel):
    project_id: UUID
    node_id: UUID
    test_points: list[AITestPoint]


class SaveTestPointsResponse(BaseModel):
    saved_count: int
    dimension_record_ids: list[UUID]
    message: str
