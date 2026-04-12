from pydantic import BaseModel, Field
from uuid import UUID


# ─── Legacy schemas (backward compat) ────────────────

class CompetitorRef(BaseModel):
    node_id: str
    node_name: str
    node_path: str
    content: dict  # raw dimension content


class ComparisonResponse(BaseModel):
    project_id: str
    dimension_key: str
    items: list[CompetitorRef]
    total: int


# ─── F12 new schemas ─────────────────────────────────

class ComparisonCell(BaseModel):
    value: str = ""
    score: float | None = None  # optional 0-10 rating


class ComparisonRow(BaseModel):
    dimension: str  # row label, e.g. "用户体验", "性能"
    cells: dict[str, ComparisonCell]  # key = column_id (node_id or competitor_id)


class ComparisonColumn(BaseModel):
    id: str  # node_id or competitor_id
    name: str
    type: str  # "self" | "competitor"


class ComparisonGenerateRequest(BaseModel):
    project_id: UUID
    node_ids: list[UUID] = Field(..., min_length=1)
    competitor_ids: list[UUID] = Field(default_factory=list)
    custom_dimensions: list[str] = Field(default_factory=list)


class ComparisonData(BaseModel):
    columns: list[ComparisonColumn]
    rows: list[ComparisonRow]


class ComparisonGenerateResponse(BaseModel):
    comparison_id: UUID
    data: ComparisonData


class ComparisonUpdateRequest(BaseModel):
    data: ComparisonData


class ComparisonUpdateResponse(BaseModel):
    comparison_id: UUID
    message: str


class ComparisonBackfillRequest(BaseModel):
    row_index: int
    node_id: UUID
    competitor_id: UUID


class ComparisonBackfillResponse(BaseModel):
    competitor_reference_id: UUID
    message: str


class ComparisonExportResponse(BaseModel):
    markdown: str
    comparison_id: UUID
