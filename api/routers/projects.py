from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.db import get_db
from api.schemas.project import ProjectStats, ProjectTreeOverview
from api.services.project_stats import get_project_stats, get_project_tree_overview

router = APIRouter()


@router.get("/{project_id}/stats", response_model=ProjectStats)
def project_stats(project_id: str, db: Session = Depends(get_db)):
    """Get project statistics: node counts, completion, etc."""
    result = get_project_stats(db, project_id)
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")
    return result


@router.get("/{project_id}/tree-overview", response_model=ProjectTreeOverview)
def project_tree_overview(project_id: str, db: Session = Depends(get_db)):
    """Get project tree with completion percentages per node."""
    result = get_project_tree_overview(db, project_id)
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")
    return result
