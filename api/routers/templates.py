"""F21 Analysis Templates — CRUD + match + revert endpoints."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_
from sqlalchemy.orm import Session

from api.db import get_db
from api.models.tables import AnalysisTemplate, TemplateVersion
from api.routers.auth import require_user
from api.schemas.templates import (
    CreateTemplateRequest,
    MatchTemplatesRequest,
    PatchTemplateRequest,
    TemplateListResponse,
    TemplateMatchResult,
    TemplateResponse,
    TemplateVersionResponse,
)
from api.services.template_manager import (
    create_template,
    match_templates,
    patch_template,
    revert_template,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Helpers ─────────────────────────────────────────

def _to_response(t: AnalysisTemplate) -> TemplateResponse:
    return TemplateResponse(
        id=t.id,
        project_id=t.project_id,
        name=t.name,
        description=t.description,
        category=t.category,
        content=t.content or {},
        version=t.version,
        usage_count=t.usage_count,
        last_used_at=t.last_used_at,
        created_by=t.created_by,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


# ─── Create ──────────────────────────────────────────

@router.post("/", response_model=TemplateResponse)
def api_create_template(
    req: CreateTemplateRequest,
    user=Depends(require_user),
    db: Session = Depends(get_db),
):
    """Create a new analysis template from analysis experience."""
    try:
        template = create_template(
            db=db,
            project_id=req.project_id,
            name=req.name,
            content=req.content.model_dump(),
            created_by=user.id,
            description=req.description,
            category=req.category,
        )
        return _to_response(template)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── List ────────────────────────────────────────────

@router.get("/", response_model=TemplateListResponse)
def api_list_templates(
    project_id: uuid.UUID = Query(...),
    category: str | None = Query(None),
    user=Depends(require_user),
    db: Session = Depends(get_db),
):
    """List templates for a project, optionally filtered by category."""
    query = db.query(AnalysisTemplate).filter(
        and_(
            AnalysisTemplate.project_id == project_id,
            AnalysisTemplate.deleted_at.is_(None),
        )
    )
    if category:
        query = query.filter(AnalysisTemplate.category == category)

    templates = query.order_by(AnalysisTemplate.usage_count.desc()).all()
    return TemplateListResponse(
        templates=[_to_response(t) for t in templates],
        total=len(templates),
    )


# ─── Get ─────────────────────────────────────────────

@router.get("/{template_id}", response_model=TemplateResponse)
def api_get_template(
    template_id: uuid.UUID,
    user=Depends(require_user),
    db: Session = Depends(get_db),
):
    """Get template detail."""
    template = db.query(AnalysisTemplate).filter(
        and_(
            AnalysisTemplate.id == template_id,
            AnalysisTemplate.deleted_at.is_(None),
        )
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")
    return _to_response(template)


# ─── Patch ───────────────────────────────────────────

@router.patch("/{template_id}", response_model=TemplateResponse)
def api_patch_template(
    template_id: uuid.UUID,
    req: PatchTemplateRequest,
    user=Depends(require_user),
    db: Session = Depends(get_db),
):
    """Update template (creates version snapshot)."""
    try:
        template = patch_template(
            db=db,
            template_id=template_id,
            user_id=user.id,
            name=req.name,
            description=req.description,
            category=req.category,
            content=req.content.model_dump() if req.content else None,
            change_summary=req.change_summary,
        )
        return _to_response(template)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Delete (soft) ───────────────────────────────────

@router.delete("/{template_id}")
def api_delete_template(
    template_id: uuid.UUID,
    user=Depends(require_user),
    db: Session = Depends(get_db),
):
    """Soft-delete a template."""
    from datetime import datetime

    template = db.query(AnalysisTemplate).filter(
        and_(
            AnalysisTemplate.id == template_id,
            AnalysisTemplate.deleted_at.is_(None),
        )
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")

    template.deleted_at = datetime.utcnow()
    db.commit()
    return {"success": True}


# ─── Version history ─────────────────────────────────

@router.get("/{template_id}/history", response_model=list[TemplateVersionResponse])
def api_template_history(
    template_id: uuid.UUID,
    user=Depends(require_user),
    db: Session = Depends(get_db),
):
    """Get version history for a template."""
    versions = db.query(TemplateVersion).filter(
        TemplateVersion.template_id == template_id
    ).order_by(TemplateVersion.version_number.desc()).all()

    return [
        TemplateVersionResponse(
            id=v.id,
            version_number=v.version_number,
            content=v.content or {},
            change_summary=v.change_summary,
            created_by=v.created_by,
            created_at=v.created_at,
        )
        for v in versions
    ]


# ─── Revert ──────────────────────────────────────────

@router.post("/{template_id}/revert", response_model=TemplateResponse)
def api_revert_template(
    template_id: uuid.UUID,
    target_version: int = Query(..., ge=1),
    user=Depends(require_user),
    db: Session = Depends(get_db),
):
    """Revert template to a specific version."""
    try:
        template = revert_template(
            db=db,
            template_id=template_id,
            target_version=target_version,
            user_id=user.id,
        )
        return _to_response(template)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Match (semantic) ────────────────────────────────

@router.get("/match/", response_model=list[TemplateMatchResult])
def api_match_templates(
    project_id: uuid.UUID = Query(...),
    query: str = Query(..., min_length=1),
    limit: int = Query(default=3, ge=1, le=10),
    user=Depends(require_user),
    db: Session = Depends(get_db),
):
    """Find templates relevant to a query using semantic matching."""
    results = match_templates(db, project_id, query, limit)
    return [TemplateMatchResult(**r) for r in results]
