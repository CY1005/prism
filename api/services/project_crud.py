"""Project CRUD + member management service layer."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from api.models.tables import (
    Project,
    ProjectMember,
    ProjectTemplate,
    DimensionType,
    ProjectDimensionConfig,
    Node,
    DimensionRecord,
    User,
)


def _normalize_hierarchy_labels(labels) -> list[str]:
    """Normalize hierarchy_labels from dict or list to list[str]."""
    if isinstance(labels, dict):
        return list(labels.values())
    if isinstance(labels, list):
        return labels
    return ["层级1", "层级2", "层级3"]


def list_projects(db: Session, user_id: str | None = None) -> dict:
    """List non-deleted projects. If user_id provided, only projects user is a member of."""
    query = db.query(Project).filter(Project.deleted_at.is_(None))

    if user_id:
        member_project_ids = (
            db.query(ProjectMember.project_id)
            .filter(ProjectMember.user_id == uuid.UUID(user_id))
            .subquery()
        )
        query = query.filter(Project.id.in_(member_project_ids))

    projects = query.order_by(Project.created_at.desc()).all()

    result = []
    for p in projects:
        total_nodes = db.query(func.count(Node.id)).filter(
            Node.project_id == p.id
        ).scalar() or 0

        total_files = db.query(func.count(Node.id)).filter(
            Node.project_id == p.id, Node.type == "file"
        ).scalar() or 0

        dim_count = db.query(func.count(ProjectDimensionConfig.id)).filter(
            ProjectDimensionConfig.project_id == p.id,
            ProjectDimensionConfig.enabled == True,
        ).scalar() or 1

        avg_completion = 0.0
        if total_files > 0:
            dim_per_node = (
                db.query(
                    DimensionRecord.node_id,
                    func.count(func.distinct(DimensionRecord.dimension_type_id)),
                )
                .join(Node, DimensionRecord.node_id == Node.id)
                .filter(Node.project_id == p.id, Node.type == "file")
                .group_by(DimensionRecord.node_id)
                .all()
            )
            total_pct = sum((cnt / dim_count) * 100 for _, cnt in dim_per_node)
            avg_completion = round(total_pct / total_files, 1)

        result.append({
            "id": str(p.id),
            "name": p.name,
            "description": p.description,
            "template_type": p.template_type,
            "hierarchy_labels": _normalize_hierarchy_labels(p.hierarchy_labels),
            "total_nodes": total_nodes,
            "total_files": total_files,
            "avg_completion": avg_completion,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })

    return {"projects": result, "total": len(result)}


def create_project(
    db: Session,
    name: str,
    description: str | None,
    template_type: str,
    created_by: str,
) -> dict:
    """Create project from template, auto-configure dimensions and add creator as admin (AC1-AC4)."""
    # Look up template
    template = db.query(ProjectTemplate).filter(
        ProjectTemplate.key == template_type
    ).first()

    hierarchy_labels = ["层级1", "层级2", "层级3"]
    dimension_keys: list[str] = []

    if template:
        hierarchy_labels = template.hierarchy_labels
        dimension_keys = template.dimension_keys

    project = Project(
        id=uuid.uuid4(),
        name=name,
        description=description,
        template_type=template_type,
        hierarchy_labels=hierarchy_labels,
        version_mode="release",
        created_by=uuid.UUID(created_by),
    )
    db.add(project)
    db.flush()

    # Auto-add creator as project admin (AC3: auto project_members)
    member = ProjectMember(
        id=uuid.uuid4(),
        project_id=project.id,
        user_id=uuid.UUID(created_by),
        role="admin",
    )
    db.add(member)

    # Auto-configure dimensions from template (AC3: auto project_dimension_config)
    if dimension_keys:
        dim_types = db.query(DimensionType).filter(
            DimensionType.key.in_(dimension_keys)
        ).all()
        dim_map = {d.key: d.id for d in dim_types}

        for i, key in enumerate(dimension_keys):
            if key in dim_map:
                config = ProjectDimensionConfig(
                    project_id=project.id,
                    dimension_type_id=dim_map[key],
                    enabled=True,
                    sort_order=i,
                )
                db.add(config)

    db.commit()
    db.refresh(project)

    return {
        "id": str(project.id),
        "name": project.name,
        "template_type": project.template_type,
        "hierarchy_labels": _normalize_hierarchy_labels(project.hierarchy_labels),
    }


def get_project(db: Session, project_id: str) -> Project | None:
    """Get a non-deleted project by ID."""
    return db.query(Project).filter(
        Project.id == uuid.UUID(project_id),
        Project.deleted_at.is_(None),
    ).first()


def update_project(db: Session, project_id: str, **kwargs) -> dict | None:
    """Update project fields (name, description, hierarchy_labels)."""
    project = get_project(db, project_id)
    if not project:
        return None

    for key, value in kwargs.items():
        if value is not None and hasattr(project, key):
            setattr(project, key, value)

    project.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"id": str(project.id), "name": project.name}


def soft_delete_project(db: Session, project_id: str) -> bool:
    """Soft delete a project (AC15-AC16)."""
    project = get_project(db, project_id)
    if not project:
        return False
    project.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return True


def restore_project(db: Session, project_id: str) -> bool:
    """Restore a soft-deleted project (AC17)."""
    project = db.query(Project).filter(
        Project.id == uuid.UUID(project_id),
        Project.deleted_at.isnot(None),
    ).first()
    if not project:
        return False
    project.deleted_at = None
    db.commit()
    return True


def hard_delete_project(db: Session, project_id: str) -> bool:
    """Permanently delete a project and cascade (AC18)."""
    project = db.query(Project).filter(
        Project.id == uuid.UUID(project_id),
    ).first()
    if not project:
        return False
    db.delete(project)
    db.commit()
    return True


def list_deleted_projects(db: Session) -> list[dict]:
    """List soft-deleted projects for admin recovery (AC17)."""
    projects = db.query(Project).filter(
        Project.deleted_at.isnot(None),
    ).order_by(Project.deleted_at.desc()).all()

    return [
        {
            "id": str(p.id),
            "name": p.name,
            "description": p.description,
            "template_type": p.template_type,
            "deleted_at": p.deleted_at.isoformat() if p.deleted_at else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in projects
    ]


# ─── Member Management (AC10-AC11) ─────────────────────

def add_member(db: Session, project_id: str, email: str, role: str) -> dict:
    """Invite a member by email (AC10)."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise ValueError("用户不存在")

    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == uuid.UUID(project_id),
        ProjectMember.user_id == user.id,
    ).first()
    if existing:
        raise ValueError("该用户已是项目成员")

    if role not in ("admin", "editor", "viewer"):
        raise ValueError("无效的角色")

    member = ProjectMember(
        id=uuid.uuid4(),
        project_id=uuid.UUID(project_id),
        user_id=user.id,
        role=role,
    )
    db.add(member)
    db.commit()

    return {
        "user_id": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": role,
    }


def update_member_role(db: Session, project_id: str, user_id: str, role: str) -> bool:
    """Update a member's role."""
    if role not in ("admin", "editor", "viewer"):
        raise ValueError("无效的角色")

    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == uuid.UUID(project_id),
        ProjectMember.user_id == uuid.UUID(user_id),
    ).first()
    if not member:
        return False

    member.role = role
    db.commit()
    return True


def remove_member(db: Session, project_id: str, user_id: str) -> bool:
    """Remove a member from project."""
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == uuid.UUID(project_id),
        ProjectMember.user_id == uuid.UUID(user_id),
    ).first()
    if not member:
        return False

    db.delete(member)
    db.commit()
    return True


def list_members(db: Session, project_id: str) -> list[dict]:
    """List project members with user details."""
    members = (
        db.query(ProjectMember, User)
        .join(User, ProjectMember.user_id == User.id)
        .filter(ProjectMember.project_id == uuid.UUID(project_id))
        .all()
    )

    return [
        {
            "user_id": str(u.id),
            "email": u.email,
            "name": u.name,
            "role": m.role,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m, u in members
    ]


def check_permission(db: Session, user_id: str, project_id: str, required_role: str = "viewer") -> bool:
    """Check if user has at least the required role in the project.

    Role hierarchy: admin > editor > viewer
    Platform admins always have access.
    """
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if user and user.role == "platform_admin":
        return True

    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == uuid.UUID(project_id),
        ProjectMember.user_id == uuid.UUID(user_id),
    ).first()
    if not member:
        return False

    role_hierarchy = {"viewer": 0, "editor": 1, "admin": 2}
    return role_hierarchy.get(member.role, 0) >= role_hierarchy.get(required_role, 0)
