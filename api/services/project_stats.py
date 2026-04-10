"""Project statistics and tree overview."""

import logging
from sqlalchemy import func

logger = logging.getLogger(__name__)
from sqlalchemy.orm import Session

from api.models.tables import (
    Node,
    Project,
    DimensionRecord,
    ProjectDimensionConfig,
)


def get_project_stats(db: Session, project_id: str) -> dict | None:
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
    except Exception:
        return None
    if not project:
        return None

    total_folders = db.query(func.count(Node.id)).filter(
        Node.project_id == project_id, Node.type == "folder"
    ).scalar() or 0

    total_files = db.query(func.count(Node.id)).filter(
        Node.project_id == project_id, Node.type == "file"
    ).scalar() or 0

    total_dim_records = db.query(func.count(DimensionRecord.id)).join(
        Node, DimensionRecord.node_id == Node.id
    ).filter(Node.project_id == project_id).scalar() or 0

    # Count configured dimensions for this project
    dim_type_count = db.query(func.count(ProjectDimensionConfig.id)).filter(
        ProjectDimensionConfig.project_id == project_id,
        ProjectDimensionConfig.enabled == True,
    ).scalar() or 0

    # Calculate average completion (single query with group_by)
    avg_completion = 0.0
    if total_files > 0 and dim_type_count > 0:
        dim_per_node = (
            db.query(
                DimensionRecord.node_id,
                func.count(func.distinct(DimensionRecord.dimension_type_id)),
            )
            .join(Node, DimensionRecord.node_id == Node.id)
            .filter(Node.project_id == project_id, Node.type == "file")
            .group_by(DimensionRecord.node_id)
            .all()
        )
        total_percent = sum((cnt / dim_type_count) * 100 for _, cnt in dim_per_node)
        avg_completion = round(total_percent / total_files, 1)

    return {
        "project_id": str(project.id),
        "project_name": project.name,
        "total_folders": total_folders,
        "total_files": total_files,
        "total_dimension_records": total_dim_records,
        "avg_completion_percent": avg_completion,
        "dimension_type_count": dim_type_count,
    }


def get_project_tree_overview(db: Session, project_id: str) -> dict | None:
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
    except Exception:
        return None
    if not project:
        return None

    # Get dimension count for completion calculation
    dim_type_count = db.query(func.count(ProjectDimensionConfig.id)).filter(
        ProjectDimensionConfig.project_id == project_id,
        ProjectDimensionConfig.enabled == True,
    ).scalar() or 1  # avoid div by zero

    # Get all nodes
    nodes = db.query(Node).filter(
        Node.project_id == project_id
    ).order_by(Node.depth, Node.sort_order).all()

    # Get dimension counts per node
    dim_counts = {}
    for row in (
        db.query(
            DimensionRecord.node_id,
            func.count(func.distinct(DimensionRecord.dimension_type_id)),
        )
        .join(Node, DimensionRecord.node_id == Node.id)
        .filter(Node.project_id == project_id)
        .group_by(DimensionRecord.node_id)
        .all()
    ):
        dim_counts[str(row[0])] = row[1]

    # Build tree
    node_map = {}
    for n in nodes:
        filled = dim_counts.get(str(n.id), 0)
        total = dim_type_count if n.type == "file" else 0
        completion = round((filled / total) * 100, 1) if total > 0 else 0.0

        node_map[str(n.id)] = {
            "id": str(n.id),
            "name": n.name,
            "type": n.type,
            "depth": n.depth,
            "filled_dimensions": filled,
            "total_dimensions": total,
            "completion_percent": completion,
            "children": [],
            "_parent_id": str(n.parent_id) if n.parent_id else None,
        }

    # Assemble tree
    roots = []
    for nid, node_data in node_map.items():
        parent_id = node_data.pop("_parent_id")
        if parent_id and parent_id in node_map:
            node_map[parent_id]["children"].append(node_data)
        else:
            roots.append(node_data)

    return {
        "project_id": str(project.id),
        "project_name": project.name,
        "tree": roots,
    }
