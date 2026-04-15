"""F21 Analysis Templates — Pydantic request/response schemas."""

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


# ─── Template content structure ─────────────────────

class TemplateContent(BaseModel):
    trigger_conditions: list[str] = Field(default_factory=list)
    analysis_steps: list[str] = Field(default_factory=list)
    pitfalls: list[str] = Field(default_factory=list)
    verification: list[str] = Field(default_factory=list)
    prompt_template: str = ""


# ─── Request schemas ────────────────────────────────

class CreateTemplateRequest(BaseModel):
    project_id: UUID
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    category: str = "general"
    content: TemplateContent


class PatchTemplateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    content: TemplateContent | None = None
    change_summary: str | None = None


class MatchTemplatesRequest(BaseModel):
    project_id: UUID
    query: str = Field(..., min_length=1)
    limit: int = Field(default=3, ge=1, le=10)


# ─── Response schemas ───────────────────────────────

class TemplateResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    description: str | None
    category: str
    content: dict
    version: int
    usage_count: int
    last_used_at: datetime | None
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class TemplateListResponse(BaseModel):
    templates: list[TemplateResponse]
    total: int


class TemplateVersionResponse(BaseModel):
    id: UUID
    version_number: int
    content: dict
    change_summary: str | None
    created_by: UUID
    created_at: datetime


class TemplateMatchResult(BaseModel):
    template_id: UUID
    name: str
    description: str | None
    category: str
    similarity: float
    usage_count: int
