from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.db import get_db
from api.schemas.project import ProjectStats, ProjectTreeOverview
from api.schemas.project_list import ProjectListResponse, ProjectCreateRequest, ProjectCreateResponse
from api.schemas.comparison import ComparisonResponse
from api.services.project_stats import get_project_stats, get_project_tree_overview
from api.services.project_crud import list_projects, create_project
from api.services.comparison import get_comparison_data

router = APIRouter()


@router.get("/", response_model=ProjectListResponse)
def get_projects(db: Session = Depends(get_db)):
    """List all projects with summary stats."""
    return list_projects(db)


@router.post("/", response_model=ProjectCreateResponse, status_code=201)
def create_new_project(req: ProjectCreateRequest, db: Session = Depends(get_db)):
    """Create a new project."""
    return create_project(db, req.name, req.description, req.template_type)


@router.get("/{project_id}/stats", response_model=ProjectStats)
def project_stats(project_id: str, db: Session = Depends(get_db)):
    """Get project statistics: node counts, completion, etc."""
    result = get_project_stats(db, project_id)
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")
    return result


@router.get("/{project_id}/comparison", response_model=ComparisonResponse)
def project_comparison(
    project_id: str,
    dimension_key: str = "competitor_ref",
    db: Session = Depends(get_db),
):
    """Get comparison data for a project from dimension records."""
    return get_comparison_data(db, project_id, dimension_key)


@router.get("/{project_id}/tree-overview", response_model=ProjectTreeOverview)
def project_tree_overview(project_id: str, db: Session = Depends(get_db)):
    """Get project tree with completion percentages per node."""
    result = get_project_tree_overview(db, project_id)
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")
    return result
