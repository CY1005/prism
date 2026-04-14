from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from api.db import get_db
from api.schemas.settings import ProjectSettingsResponse, ProjectSettingsUpdate
from api.models.tables import Project, ProjectMember, ProjectDimensionConfig, DimensionType

router = APIRouter()


class DimensionConfigUpdate(BaseModel):
    enabled: Optional[bool] = None
    sort_order: Optional[int] = None


@router.get("/{project_id}/settings", response_model=ProjectSettingsResponse)
def get_settings(project_id: str, db: Session = Depends(get_db)):
    """Get project settings including members and dimension configs."""
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
    except Exception:
        project = None

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get members
    members = []
    try:
        member_rows = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id
        ).all()
        members = [
            {"user_id": str(m.user_id), "role": m.role}
            for m in member_rows
        ]
    except Exception:
        pass

    # Get dimension configs
    dim_configs = []
    try:
        configs = (
            db.query(ProjectDimensionConfig, DimensionType)
            .join(DimensionType, ProjectDimensionConfig.dimension_type_id == DimensionType.id)
            .filter(ProjectDimensionConfig.project_id == project_id)
            .order_by(ProjectDimensionConfig.sort_order)
            .all()
        )
        dim_configs = [
            {
                "id": c.id,
                "dimension_key": dt.key,
                "dimension_name": dt.name,
                "enabled": c.enabled,
                "sort_order": c.sort_order,
            }
            for c, dt in configs
        ]
    except Exception:
        pass

    return ProjectSettingsResponse(
        project_id=str(project.id),
        name=project.name,
        description=project.description,
        template_type=project.template_type,
        hierarchy_labels=project.hierarchy_labels,
        members=members,
        dimension_configs=dim_configs,
    )


@router.patch("/{project_id}/settings")
def update_settings(
    project_id: str,
    update: ProjectSettingsUpdate,
    db: Session = Depends(get_db),
):
    """Update project name/description."""
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if update.name is not None:
        project.name = update.name
    if update.description is not None:
        project.description = update.description
    if update.hierarchy_labels is not None:
        project.hierarchy_labels = update.hierarchy_labels

    try:
        db.commit()
    except Exception:
        db.rollback()

    return {"status": "updated", "project_id": project_id}


@router.patch("/{project_id}/dimension-configs/{config_id}")
def update_dimension_config(
    project_id: str,
    config_id: int,
    update: DimensionConfigUpdate,
    db: Session = Depends(get_db),
):
    """Update dimension config enabled/sort_order."""
    config = db.query(ProjectDimensionConfig).filter(
        ProjectDimensionConfig.id == config_id,
        ProjectDimensionConfig.project_id == project_id,
    ).first()
    if not config:
        raise HTTPException(status_code=404, detail="Dimension config not found")

    if update.enabled is not None:
        config.enabled = update.enabled
    if update.sort_order is not None:
        config.sort_order = update.sort_order

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=503, detail=f"Database error: {e}")

    return {"status": "updated", "config_id": config_id}
