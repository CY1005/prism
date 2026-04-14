"""Project CRUD + member management + soft delete router."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.db import get_db
from api.models.tables import User
from api.routers.auth import require_user, require_admin
from api.services.project_crud import _normalize_hierarchy_labels
from api.schemas.project import ProjectStats, ProjectTreeOverview
from api.schemas.project_list import (
    ProjectListResponse,
    ProjectCreateRequest,
    ProjectCreateResponse,
    ProjectUpdateRequest,
    MemberAddRequest,
    MemberUpdateRequest,
    MemberResponse,
    DeletedProjectSummary,
)
from api.schemas.comparison import ComparisonResponse
from api.schemas.relations import RelationGraphResponse
from api.services.project_stats import get_project_stats, get_project_tree_overview
from api.services.project_crud import (
    list_projects,
    create_project,
    get_project,
    update_project,
    soft_delete_project,
    restore_project,
    hard_delete_project,
    list_deleted_projects,
    add_member,
    update_member_role,
    remove_member,
    list_members,
    check_permission,
)
from api.services.comparison import get_comparison_data
from api.services.relations import get_relation_graph

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Project CRUD ─────────────────────────────────────

@router.get("/", response_model=ProjectListResponse)
def get_projects(user: User = Depends(require_user), db: Session = Depends(get_db)):
    """List projects the user has access to (AC5, AC6)."""
    if user.role == "platform_admin":
        return list_projects(db)
    return list_projects(db, user_id=str(user.id))


@router.post("/", response_model=ProjectCreateResponse, status_code=201)
def create_new_project(
    req: ProjectCreateRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Create a new project from template (AC1-AC4)."""
    if user.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewer 角色无权创建项目")
    try:
        return create_project(db, req.name, req.description, req.template_type, str(user.id))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/deleted", response_model=list[DeletedProjectSummary])
def get_deleted_projects(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List soft-deleted projects (admin only, AC17)."""
    return list_deleted_projects(db)


@router.get("/{project_id}")
def get_project_detail(
    project_id: uuid.UUID,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Get project details."""
    if not check_permission(db, str(user.id), str(project_id)):
        raise HTTPException(status_code=403, detail="无权访问该项目")

    project = get_project(db, str(project_id))
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    return {
        "id": str(project.id),
        "name": project.name,
        "description": project.description,
        "template_type": project.template_type,
        "hierarchy_labels": _normalize_hierarchy_labels(project.hierarchy_labels),
        "version_mode": project.version_mode,
        "created_by": str(project.created_by),
        "created_at": project.created_at.isoformat() if project.created_at else None,
    }


@router.patch("/{project_id}")
def update_project_detail(
    project_id: uuid.UUID,
    req: ProjectUpdateRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Update project name/description/hierarchy_labels."""
    if not check_permission(db, str(user.id), str(project_id), "admin"):
        raise HTTPException(status_code=403, detail="需要项目管理员权限")

    result = update_project(
        db, str(project_id),
        name=req.name,
        description=req.description,
        hierarchy_labels=req.hierarchy_labels,
    )
    if not result:
        raise HTTPException(status_code=404, detail="项目不存在")
    return result


@router.delete("/{project_id}")
def delete_project(
    project_id: uuid.UUID,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Soft delete a project (AC15-AC16)."""
    if not check_permission(db, str(user.id), str(project_id), "admin"):
        raise HTTPException(status_code=403, detail="需要项目管理员权限")

    if not soft_delete_project(db, str(project_id)):
        raise HTTPException(status_code=404, detail="项目不存在")
    return {"status": "deleted", "project_id": str(project_id)}


@router.post("/{project_id}/restore")
def restore_deleted_project(
    project_id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Restore a soft-deleted project (AC17)."""
    if not restore_project(db, str(project_id)):
        raise HTTPException(status_code=404, detail="项目不存在或未被删除")
    return {"status": "restored", "project_id": str(project_id)}


@router.delete("/{project_id}/permanent")
def permanent_delete_project(
    project_id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Permanently delete a project (AC18)."""
    if not hard_delete_project(db, str(project_id)):
        raise HTTPException(status_code=404, detail="项目不存在")
    return {"status": "permanently_deleted", "project_id": str(project_id)}


# ─── Member Management (AC10-AC11) ────────────────────

@router.get("/{project_id}/members", response_model=list[MemberResponse])
def get_members(
    project_id: uuid.UUID,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """List project members."""
    if not check_permission(db, str(user.id), str(project_id)):
        raise HTTPException(status_code=403, detail="无权访问该项目")
    return list_members(db, str(project_id))


@router.post("/{project_id}/members", response_model=MemberResponse, status_code=201)
def invite_member(
    project_id: uuid.UUID,
    req: MemberAddRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Invite a member by email (AC10)."""
    if not check_permission(db, str(user.id), str(project_id), "admin"):
        raise HTTPException(status_code=403, detail="需要项目管理员权限")

    try:
        return add_member(db, str(project_id), req.email, req.role)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{project_id}/members/{member_user_id}")
def change_member_role(
    project_id: uuid.UUID,
    member_user_id: str,
    req: MemberUpdateRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Update a member's role."""
    if not check_permission(db, str(user.id), str(project_id), "admin"):
        raise HTTPException(status_code=403, detail="需要项目管理员权限")

    try:
        if not update_member_role(db, str(project_id), member_user_id, req.role):
            raise HTTPException(status_code=404, detail="成员不存在")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"status": "updated"}


@router.delete("/{project_id}/members/{member_user_id}")
def kick_member(
    project_id: uuid.UUID,
    member_user_id: str,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Remove a member from project."""
    if not check_permission(db, str(user.id), str(project_id), "admin"):
        raise HTTPException(status_code=403, detail="需要项目管理员权限")

    if not remove_member(db, str(project_id), member_user_id):
        raise HTTPException(status_code=404, detail="成员不存在")
    return {"status": "removed"}


# ─── Existing endpoints (stats, comparison, relations, tree) ──

@router.get("/{project_id}/stats", response_model=ProjectStats)
def project_stats(
    project_id: uuid.UUID,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Get project statistics."""
    if not check_permission(db, str(user.id), str(project_id)):
        raise HTTPException(status_code=403, detail="无权访问该项目")

    result = get_project_stats(db, str(project_id))
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")
    return result


@router.get("/{project_id}/comparison", response_model=ComparisonResponse)
def project_comparison(
    project_id: uuid.UUID,
    dimension_key: str = "competitor_ref",
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Get comparison data for a project."""
    if not check_permission(db, str(user.id), str(project_id)):
        raise HTTPException(status_code=403, detail="无权访问该项目")
    return get_comparison_data(db, str(project_id), dimension_key)


@router.get("/{project_id}/relations", response_model=RelationGraphResponse)
def project_relations(
    project_id: uuid.UUID,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Get module relation graph."""
    if not check_permission(db, str(user.id), str(project_id)):
        raise HTTPException(status_code=403, detail="无权访问该项目")
    return get_relation_graph(db, str(project_id))


@router.get("/{project_id}/tree-overview", response_model=ProjectTreeOverview)
def project_tree_overview(
    project_id: uuid.UUID,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Get project tree with completion percentages."""
    if not check_permission(db, str(user.id), str(project_id)):
        raise HTTPException(status_code=403, detail="无权访问该项目")

    result = get_project_tree_overview(db, str(project_id))
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")
    return result
