"""Unified search across nodes, dimension_records, and knowledge_items."""

import json

from sqlalchemy import or_, cast, Text
from sqlalchemy.orm import Session

from api.models.tables import (
    Node,
    Project,
    DimensionRecord,
    DimensionType,
    KnowledgeItem,
)


def unified_search(
    db: Session,
    query: str,
    project_id: str | None = None,
    limit: int = 20,
) -> dict:
    results = []
    q = f"%{query}%"

    # 1. Search nodes by name
    try:
        node_query = db.query(Node, Project).join(
            Project, Node.project_id == Project.id
        ).filter(Node.name.ilike(q))
        if project_id:
            node_query = node_query.filter(Node.project_id == project_id)

        for node, project in node_query.limit(limit).all():
            results.append({
                "id": str(node.id),
                "type": "node",
                "title": node.name,
                "content_snippet": f"路径: {node.path}" if node.path else f"类型: {node.type}",
                "project_id": str(node.project_id),
                "project_name": project.name,
                "node_path": node.path,
                "dimension_type": None,
            })
    except Exception:
        pass

    # 2. Search dimension_records by content (JSONB text cast)
    try:
        dim_query = (
            db.query(DimensionRecord, Node, Project, DimensionType)
            .join(Node, DimensionRecord.node_id == Node.id)
            .join(Project, Node.project_id == Project.id)
            .join(DimensionType, DimensionRecord.dimension_type_id == DimensionType.id)
            .filter(cast(DimensionRecord.content, Text).ilike(q))
        )
        if project_id:
            dim_query = dim_query.filter(Node.project_id == project_id)

        for record, node, project, dim_type in dim_query.limit(limit).all():
            # Extract snippet from content
            content_str = json.dumps(record.content, ensure_ascii=False) if isinstance(record.content, dict) else str(record.content)
            snippet = _extract_snippet(content_str, query, max_len=150)

            results.append({
                "id": str(record.id),
                "type": "dimension",
                "title": node.name,
                "content_snippet": snippet,
                "project_id": str(node.project_id),
                "project_name": project.name,
                "node_path": node.path,
                "dimension_type": dim_type.name,
            })
    except Exception:
        pass

    # 3. Search knowledge_items
    try:
        ki_query = db.query(KnowledgeItem).filter(
            or_(
                KnowledgeItem.title.ilike(q),
                KnowledgeItem.content.ilike(q),
            )
        )
        if project_id:
            ki_query = ki_query.filter(KnowledgeItem.project_id == project_id)

        for ki in ki_query.limit(limit).all():
            # Try to get project name
            project_name = None
            if ki.project_id:
                proj = db.query(Project).filter(Project.id == ki.project_id).first()
                if proj:
                    project_name = proj.name

            results.append({
                "id": str(ki.id),
                "type": "knowledge",
                "title": ki.title,
                "content_snippet": ki.content[:150] if ki.content else "",
                "project_id": str(ki.project_id) if ki.project_id else None,
                "project_name": project_name,
                "node_path": None,
                "dimension_type": None,
            })
    except Exception:
        pass

    # Deduplicate and limit
    seen = set()
    unique_results = []
    for r in results:
        if r["id"] not in seen:
            seen.add(r["id"])
            unique_results.append(r)
    unique_results = unique_results[:limit]

    return {
        "query": query,
        "total": len(unique_results),
        "results": unique_results,
    }


def _extract_snippet(text: str, query: str, max_len: int = 150) -> str:
    """Extract a snippet around the first occurrence of query in text."""
    lower_text = text.lower()
    lower_query = query.lower()
    idx = lower_text.find(lower_query)
    if idx == -1:
        return text[:max_len] + ("..." if len(text) > max_len else "")

    start = max(0, idx - 40)
    end = min(len(text), idx + len(query) + 60)
    snippet = text[start:end]
    if start > 0:
        snippet = "..." + snippet
    if end < len(text):
        snippet = snippet + "..."
    return snippet
