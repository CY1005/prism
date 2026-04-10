"""Module relation graph data."""

import logging
from sqlalchemy import func

logger = logging.getLogger(__name__)
from sqlalchemy.orm import Session

from api.models.tables import Node, NodeRelation, DimensionRecord, ProjectDimensionConfig


def get_relation_graph(db: Session, project_id: str) -> dict:
    try:
        nodes = db.query(Node).filter(
            Node.project_id == project_id
        ).all()
    except Exception as e:
        logger.warning("Failed to query nodes: %s", e)
        nodes = []

    dim_count = 1
    try:
        dim_count = db.query(func.count(ProjectDimensionConfig.id)).filter(
            ProjectDimensionConfig.project_id == project_id,
            ProjectDimensionConfig.enabled == True,
        ).scalar() or 1
    except Exception as e:
        logger.warning("Relations query failed: %s", e)

    dim_counts = {}
    try:
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
    except Exception as e:
        logger.warning("Relations query failed: %s", e)

    graph_nodes = []
    for n in nodes:
        filled = dim_counts.get(str(n.id), 0)
        total = dim_count if n.type == "file" else 0
        completion = round((filled / total) * 100, 1) if total > 0 else 0.0
        graph_nodes.append({
            "id": str(n.id),
            "name": n.name,
            "type": n.type,
            "depth": n.depth,
            "completion_percent": completion,
        })

    edges = []
    try:
        relations = db.query(NodeRelation).filter(
            NodeRelation.source_node_id.in_([n.id for n in nodes])
        ).all()
        for r in relations:
            edges.append({
                "id": r.id,
                "source": str(r.source_node_id),
                "target": str(r.target_node_id),
                "relation_type": r.relation_type,
                "description": r.description,
            })
    except Exception as e:
        logger.warning("Relations query failed: %s", e)

    return {
        "project_id": project_id,
        "nodes": graph_nodes,
        "edges": edges,
    }
