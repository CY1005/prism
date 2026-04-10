"""Mock analyzer service. Keyword matching against node names.

Will be replaced with Claude SDK integration in a later module.
"""

import logging
import time
import uuid

logger = logging.getLogger(__name__)

from sqlalchemy.orm import Session

from api.models.tables import Node


def analyze_requirement(
    db: Session,
    project_id: uuid.UUID,
    requirement_text: str,
    include_modules: list[uuid.UUID] | None = None,
) -> dict:
    start = time.time()

    query = db.query(Node).filter(
        Node.project_id == str(project_id),
        Node.type == "file",
    )
    if include_modules:
        query = query.filter(Node.id.in_([str(m) for m in include_modules]))

    try:
        nodes = query.all()
    except Exception as e:
        logger.warning("Analyzer DB query failed: %s", e)
        nodes = []
    req_lower = requirement_text.lower()

    affected = []
    for node in nodes:
        name_lower = (node.name or "").lower()
        # Simple keyword overlap scoring
        words = [w for w in name_lower.split() if len(w) > 1]
        matched = any(w in req_lower for w in words) or name_lower in req_lower
        if matched:
            affected.append({
                "node_id": str(node.id),
                "node_name": node.name,
                "node_path": node.path or "",
                "impact_level": "high",
                "reason": f"需求文本中包含与'{node.name}'相关的关键词",
            })

    elapsed_ms = int((time.time() - start) * 1000)

    return {
        "affected_modules": affected,
        "completeness_issues": ["mock模式: 未进行完整性分析"] if affected else ["未找到匹配模块，建议补充需求描述"],
        "suggestions": ["建议使用AI模式获取更精确的分析结果"],
        "metadata": {
            "model": "mock",
            "tokens_used": 0,
            "analysis_time_ms": elapsed_ms,
        },
    }
