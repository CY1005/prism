from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class FeedSourceCreate(BaseModel):
    project_id: UUID
    source_type: str
    url: str
    name: str


class FeedSourceUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    is_active: Optional[bool] = None


class FeedSourceResponse(BaseModel):
    id: UUID
    project_id: UUID
    source_type: str
    url: str
    name: str
    is_active: bool
    created_at: datetime


class FeedItemResponse(BaseModel):
    id: UUID
    project_id: UUID
    source_id: Optional[UUID] = None
    title: str
    source: str
    published_date: datetime
    summary: str
    tags: list[str]
    suggested_node_id: Optional[UUID] = None
    suggested_node_name: Optional[str] = None
    confidence: float
    status: str
    created_at: datetime


class FeedItemConfirmRequest(BaseModel):
    node_id: UUID


class FeedItemReassignRequest(BaseModel):
    node_id: UUID
