"""Project list and creation."""

import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session

from api.models.tables import Project, Node, DimensionRecord, ProjectDimensionConfig


def list_projects(db: Session) -> dict:
    try:
        projects = db.query(Project).order_by(Project.created_at.desc()).all()
    except Exception:
        return {"projects": [], "total": 0}

    result = []
    for p in projects:
        try:
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
                "total_nodes": total_nodes,
                "total_files": total_files,
                "avg_completion": avg_completion,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            })
        except Exception:
            result.append({
                "id": str(p.id),
                "name": p.name,
                "description": p.description,
                "template_type": p.template_type,
                "total_nodes": 0,
                "total_files": 0,
                "avg_completion": 0.0,
                "created_at": None,
            })

    return {"projects": result, "total": len(result)}


def create_project(db: Session, name: str, description: str | None, template_type: str) -> dict:
    project = Project(
        id=uuid.uuid4(),
        name=name,
        description=description,
        template_type=template_type,
    )
    try:
        db.add(project)
        db.commit()
        db.refresh(project)
        return {"id": str(project.id), "name": project.name}
    except Exception as e:
        db.rollback()
        raise RuntimeError(f"Failed to create project: {e}") from e
