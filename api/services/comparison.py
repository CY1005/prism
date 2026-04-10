"""Comparison data from dimension records."""

import logging
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from api.models.tables import DimensionRecord, DimensionType, Node


def get_comparison_data(
    db: Session,
    project_id: str,
    dimension_key: str = "competitor_ref",
) -> dict:
    try:
        dim_type = db.query(DimensionType).filter(
            DimensionType.key == dimension_key
        ).first()

        if not dim_type:
            return {
                "project_id": project_id,
                "dimension_key": dimension_key,
                "items": [],
                "total": 0,
            }

        records = (
            db.query(DimensionRecord, Node)
            .join(Node, DimensionRecord.node_id == Node.id)
            .filter(
                Node.project_id == project_id,
                DimensionRecord.dimension_type_id == dim_type.id,
            )
            .all()
        )

        items = [
            {
                "node_id": str(node.id),
                "node_name": node.name,
                "node_path": node.path or "",
                "content": record.content if isinstance(record.content, dict) else {},
            }
            for record, node in records
        ]

        return {
            "project_id": project_id,
            "dimension_key": dimension_key,
            "items": items,
            "total": len(items),
        }
    except Exception as e:
        logger.warning("Comparison query failed: %s", e)
        return {
            "project_id": project_id,
            "dimension_key": dimension_key,
            "items": [],
            "total": 0,
        }
