"""Unified search across nodes, dimension_records, and issues (F9)."""

import json
import logging

logger = logging.getLogger(__name__)

from sqlalchemy import or_, cast, Text
from sqlalchemy.orm import Session

from api.models.tables import (
    Node,
    Project,
    ProjectMember,
    User,
    DimensionRecord,
    DimensionType,
    Issue,
)


def _get_accessible_project_ids(db: Session, user_id: str) -> list[str] | None:
    """Return project IDs the user can access, or None if platform_admin (no filter)."""
    import uuid as _uuid
    try:
        _uuid.UUID(user_id)
    except (ValueError, AttributeError):
        return []  # invalid user_id → no access

    user = db.query(User).filter(User.id == user_id).first()
    if user and user.role == "platform_admin":
        return None  # no filter needed

    rows = db.query(ProjectMember.project_id).filter(
        ProjectMember.user_id == user_id
    ).all()
    return [str(r.project_id) for r in rows]


def _build_breadcrumb(db: Session, node: Node, project_name: str) -> list[str]:
    """Build human-readable breadcrumb from node's materialized path.

    node.path stores "rootId/parentId/thisId". We look up all ancestor
    node names and prepend the project name.
    """
    if not node.path:
        return [project_name, node.name]

    path_ids = [seg for seg in node.path.split("/") if seg]
    if not path_ids:
        return [project_name, node.name]

    # Query all nodes in the path to get their names
    ancestor_nodes = (
        db.query(Node.id, Node.name)
        .filter(Node.id.in_(path_ids))
        .all()
    )
    id_to_name = {str(n.id): n.name for n in ancestor_nodes}

    # Build ordered breadcrumb from path order
    breadcrumb = [project_name]
    for pid in path_ids:
        name = id_to_name.get(pid)
        if name:
            breadcrumb.append(name)

    # Append the node's own name if not already in the path
    if str(node.id) not in path_ids:
        breadcrumb.append(node.name)

    return breadcrumb


def unified_search(
    db: Session,
    query: str,
    user_id: str,
    project_id: str | None = None,
    dimension_type: str | None = None,
    issue_category: str | None = None,
    limit: int = 20,
) -> dict:
    results = []
    q = f"%{query}%"

    # Permission check: get accessible project IDs
    accessible_ids = _get_accessible_project_ids(db, user_id)
    if accessible_ids is not None and len(accessible_ids) == 0:
        # User has no project access at all
        return {"query": query, "total": 0, "results": []}

    def _apply_project_filter(base_query, project_col):
        """Apply project_id filter and permission filter to a query."""
        if project_id:
            base_query = base_query.filter(project_col == project_id)
        if accessible_ids is not None:
            base_query = base_query.filter(project_col.in_(accessible_ids))
        return base_query

    # 1. Search nodes by name
    try:
        node_query = db.query(Node, Project).join(
            Project, Node.project_id == Project.id
        ).filter(
            Node.name.ilike(q),
            Project.deleted_at.is_(None),
        )
        node_query = _apply_project_filter(node_query, Node.project_id)

        for node, project in node_query.limit(limit).all():
            breadcrumb = _build_breadcrumb(db, node, project.name)
            results.append({
                "id": str(node.id),
                "type": "node",
                "title": node.name,
                "content_snippet": f"路径: {node.path}" if node.path else f"类型: {node.type}",
                "project_id": str(node.project_id),
                "project_name": project.name,
                "node_path": node.path,
                "node_id": str(node.id),
                "dimension_type": None,
                "issue_category": None,
                "breadcrumb": breadcrumb,
            })
    except Exception as e:
        logger.warning("Node search failed: %s", e)
        try:
            db.rollback()
        except Exception:
            pass

    # 2. Search dimension_records by content (JSONB text cast)
    try:
        dim_query = (
            db.query(DimensionRecord, Node, Project, DimensionType)
            .join(Node, DimensionRecord.node_id == Node.id)
            .join(Project, Node.project_id == Project.id)
            .join(DimensionType, DimensionRecord.dimension_type_id == DimensionType.id)
            .filter(
                cast(DimensionRecord.content, Text).ilike(q),
                Project.deleted_at.is_(None),
            )
        )
        dim_query = _apply_project_filter(dim_query, Node.project_id)

        # Filter by dimension_type name if provided (frontend passes display name)
        if dimension_type:
            dim_query = dim_query.filter(DimensionType.name == dimension_type)

        for record, node, project, dim_type in dim_query.limit(limit).all():
            content_str = json.dumps(record.content, ensure_ascii=False) if isinstance(record.content, dict) else str(record.content)
            snippet = _extract_snippet(content_str, query, max_len=150)
            breadcrumb = _build_breadcrumb(db, node, project.name)

            results.append({
                "id": str(record.id),
                "type": "dimension",
                "title": node.name,
                "content_snippet": snippet,
                "project_id": str(node.project_id),
                "project_name": project.name,
                "node_path": node.path,
                "node_id": str(node.id),
                "dimension_type": dim_type.name,
                "issue_category": None,
                "breadcrumb": breadcrumb,
            })
    except Exception as e:
        logger.warning("Dimension search failed: %s", e)
        try:
            db.rollback()
        except Exception:
            pass

    # 3. Search issues by description + tags
    try:
        issue_query = (
            db.query(Issue, Project)
            .join(Project, Issue.project_id == Project.id)
            .filter(
                or_(
                    Issue.description.ilike(q),
                    cast(Issue.tags, Text).ilike(q),
                ),
                Project.deleted_at.is_(None),
            )
        )
        issue_query = _apply_project_filter(issue_query, Issue.project_id)

        if issue_category:
            issue_query = issue_query.filter(Issue.category == issue_category)

        for issue, project in issue_query.limit(limit).all():
            snippet = _extract_snippet(issue.description, query, max_len=150)

            # Build breadcrumb via associated node if present
            breadcrumb = [project.name]
            if issue.node_id:
                assoc_node = db.query(Node).filter(Node.id == issue.node_id).first()
                if assoc_node:
                    breadcrumb = _build_breadcrumb(db, assoc_node, project.name)

            results.append({
                "id": str(issue.id),
                "type": "issue",
                "title": f"[{issue.category}] {issue.description[:50]}",
                "content_snippet": snippet,
                "project_id": str(issue.project_id),
                "project_name": project.name,
                "node_path": None,
                "node_id": str(issue.node_id) if issue.node_id else None,
                "dimension_type": None,
                "issue_category": issue.category,
                "breadcrumb": breadcrumb,
            })
    except Exception as e:
        logger.warning("Issue search failed: %s", e)
        try:
            db.rollback()
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
