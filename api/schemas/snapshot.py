from pydantic import BaseModel
from uuid import UUID


class SnapshotGenerateRequest(BaseModel):
    node_id: UUID
    project_id: UUID


class DimensionSnapshot(BaseModel):
    dimension_key: str
    dimension_name: str
    content: str


class SnapshotGenerateResponse(BaseModel):
    summary: str
    dimensions: list[DimensionSnapshot]


class DimensionSaveItem(BaseModel):
    dimension_type_key: str
    content: dict


class SnapshotSaveRequest(BaseModel):
    node_id: UUID
    project_id: UUID
    summary: str | None = None
    dimensions: list[DimensionSaveItem] | None = None


class SnapshotSaveResponse(BaseModel):
    updated_summary: bool
    updated_dimensions: int
    message: str
