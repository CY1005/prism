"""F18 Hybrid Search — BM25 keyword + pgvector semantic + RRF fusion.

Architecture:
- Path A: keyword_search() — wraps existing F9 ILIKE logic (BM25 approximation)
- Path B: vector_search()  — pgvector cosine similarity (gracefully disabled if unavailable)
- rrf_merge()             — Reciprocal Rank Fusion (k=60, industry standard)

The caller (search.py router) calls hybrid_search(), which automatically:
1. Runs keyword search (always)
2. Attempts vector search (skipped if pgvector unavailable)
3. Fuses with RRF
4. Annotates each result with match_type ("keyword" | "semantic" | "both")

Degradation: if pgvector is unavailable, returns pure keyword results with
match_type="keyword" for all — fully transparent to callers.
"""

import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

# RRF constant (standard 60 per the original paper)
RRF_K = 60


def rrf_score(rank: int) -> float:
    """Reciprocal Rank Fusion score for a result at 1-based rank."""
    return 1.0 / (RRF_K + rank)


def rrf_merge(
    keyword_results: list[dict],
    semantic_results: list[dict],
) -> list[dict]:
    """Merge two ranked lists using Reciprocal Rank Fusion.

    Args:
        keyword_results: ordered list of result dicts (each with 'id')
        semantic_results: ordered list of result dicts (each with 'id')

    Returns:
        Merged and re-ranked list with match_type and score annotations.
    """
    # Build lookup maps: id → result dict, id → best rank in each list
    keyword_map: dict[str, dict] = {}
    semantic_map: dict[str, dict] = {}
    keyword_rank: dict[str, int] = {}
    semantic_rank: dict[str, int] = {}

    for rank, r in enumerate(keyword_results, start=1):
        rid = r["id"]
        keyword_map[rid] = r
        keyword_rank[rid] = rank

    for rank, r in enumerate(semantic_results, start=1):
        rid = r["id"]
        semantic_map[rid] = r
        semantic_rank[rid] = rank

    all_ids = set(keyword_rank.keys()) | set(semantic_rank.keys())

    scored: list[tuple[float, str]] = []
    for rid in all_ids:
        score = 0.0
        if rid in keyword_rank:
            score += rrf_score(keyword_rank[rid])
        if rid in semantic_rank:
            score += rrf_score(semantic_rank[rid])
        scored.append((score, rid))

    # Sort descending by score, then by keyword rank as tiebreaker
    scored.sort(key=lambda x: (-x[0], keyword_rank.get(x[1], 9999)))

    results = []
    for score, rid in scored:
        in_keyword = rid in keyword_rank
        in_semantic = rid in semantic_rank

        if in_keyword and in_semantic:
            match_type = "both"
            base = keyword_map[rid]
        elif in_keyword:
            match_type = "keyword"
            base = keyword_map[rid]
        else:
            match_type = "semantic"
            base = semantic_map[rid]

        result = dict(base)
        result["match_type"] = match_type
        result["score"] = round(score, 6)
        results.append(result)

    return results


def _build_breadcrumb_raw(conn, node_path: str | None, node_name: str, project_name: str) -> list[str]:
    """Build breadcrumb from materialized path using raw SQL (for vector search results)."""
    breadcrumb = [project_name]
    if node_path:
        path_ids = [seg for seg in node_path.split("/") if seg]
        if path_ids:
            placeholders = ", ".join(["%s"] * len(path_ids))
            rows = conn.exec_driver_sql(
                f"SELECT id::text, name FROM nodes WHERE id::text IN ({placeholders})",
                tuple(path_ids),
            ).fetchall()
            id_to_name = {str(r[0]): r[1] for r in rows}
            for pid in path_ids:
                name = id_to_name.get(pid)
                if name:
                    breadcrumb.append(name)
    if node_name and (not node_path or node_name != breadcrumb[-1]):
        breadcrumb.append(node_name)
    return breadcrumb


async def vector_search(
    db_engine,
    query_embedding: list[float],
    accessible_project_ids: list[str] | None,
    project_id: str | None,
    dimension_type_filter: str | None,
    issue_category_filter: str | None,
    limit: int,
) -> list[dict]:
    """Search embeddings table using cosine similarity.

    Uses exec_driver_sql with native psycopg2 %s params to avoid SQLAlchemy
    text() parameter style conflicts with the ::vector cast syntax.

    Returns a list of result dicts compatible with unified_search format.
    Returns empty list if pgvector is unavailable or any error occurs.
    """
    vec_str = "[" + ",".join(f"{v:.8f}" for v in query_embedding) + "]"

    if accessible_project_ids is not None and not accessible_project_ids:
        return []  # user has no project access

    results = []

    try:
        with db_engine.connect() as conn:
            # ── Nodes ─────────────────────────────────────────────────────
            node_where_parts = ["e.target_type = 'node'", "p.deleted_at IS NULL"]
            node_params: list[Any] = []

            if project_id:
                node_where_parts.append("n.project_id = %s")
                node_params.append(project_id)
            if accessible_project_ids is not None:
                placeholders = ", ".join(["%s"] * len(accessible_project_ids))
                node_where_parts.append(f"n.project_id IN ({placeholders})")
                node_params.extend(accessible_project_ids)

            node_where = " AND ".join(node_where_parts)
            node_sql = f"""
                SELECT
                    n.id, n.name, n.path, n.type, n.project_id,
                    p.name AS project_name,
                    1 - (e.embedding <=> %s::vector) AS similarity
                FROM embeddings e
                JOIN nodes n ON e.target_id = n.id
                JOIN projects p ON n.project_id = p.id
                WHERE {node_where}
                ORDER BY e.embedding <=> %s::vector
                LIMIT %s
            """
            node_full_params = tuple([vec_str] + node_params + [vec_str, limit])

            for row in conn.exec_driver_sql(node_sql, node_full_params).fetchall():
                results.append({
                    "id": str(row[0]),
                    "type": "node",
                    "title": row[1],
                    "content_snippet": f"路径: {row[2]}" if row[2] else f"类型: {row[3]}",
                    "project_id": str(row[4]),
                    "project_name": row[5],
                    "node_path": row[2],
                    "node_id": str(row[0]),
                    "dimension_type": None,
                    "issue_category": None,
                    "breadcrumb": _build_breadcrumb_raw(conn, row[2], row[1], row[5]),
                    "_similarity": float(row[6]),
                })

            # ── Dimension Records ──────────────────────────────────────────
            dim_where_parts = ["e.target_type = 'dimension_record'", "p.deleted_at IS NULL"]
            dim_params: list[Any] = []

            if project_id:
                dim_where_parts.append("n.project_id = %s")
                dim_params.append(project_id)
            if accessible_project_ids is not None:
                placeholders = ", ".join(["%s"] * len(accessible_project_ids))
                dim_where_parts.append(f"n.project_id IN ({placeholders})")
                dim_params.extend(accessible_project_ids)
            if dimension_type_filter:
                dim_where_parts.append("dt.name = %s")
                dim_params.append(dimension_type_filter)

            dim_where = " AND ".join(dim_where_parts)
            dim_sql = f"""
                SELECT
                    dr.id, n.id AS node_id, n.name AS node_name, n.path,
                    n.project_id, p.name AS project_name,
                    dt.name AS dim_type_name, dr.content,
                    1 - (e.embedding <=> %s::vector) AS similarity
                FROM embeddings e
                JOIN dimension_records dr ON e.target_id = dr.id
                JOIN nodes n ON dr.node_id = n.id
                JOIN projects p ON n.project_id = p.id
                JOIN dimension_types dt ON dr.dimension_type_id = dt.id
                WHERE {dim_where}
                ORDER BY e.embedding <=> %s::vector
                LIMIT %s
            """
            dim_full_params = tuple([vec_str] + dim_params + [vec_str, limit])

            for row in conn.exec_driver_sql(dim_sql, dim_full_params).fetchall():
                content = row[7]
                if isinstance(content, dict):
                    content_str = json.dumps(content, ensure_ascii=False)
                else:
                    content_str = str(content) if content else ""
                results.append({
                    "id": str(row[0]),
                    "type": "dimension",
                    "title": row[2],
                    "content_snippet": content_str[:150],
                    "project_id": str(row[4]),
                    "project_name": row[5],
                    "node_path": row[3],
                    "node_id": str(row[1]),
                    "dimension_type": row[6],
                    "issue_category": None,
                    "breadcrumb": _build_breadcrumb_raw(conn, row[3], row[2], row[5]),
                    "_similarity": float(row[8]),
                })

            # ── Issues ────────────────────────────────────────────────────
            # Use description + type columns (compatible with actual DB schema)
            issue_where_parts = ["e.target_type = 'issue'", "p.deleted_at IS NULL"]
            issue_params: list[Any] = []

            if project_id:
                issue_where_parts.append("i.project_id = %s")
                issue_params.append(project_id)
            if accessible_project_ids is not None:
                placeholders = ", ".join(["%s"] * len(accessible_project_ids))
                issue_where_parts.append(f"i.project_id IN ({placeholders})")
                issue_params.extend(accessible_project_ids)
            if issue_category_filter:
                issue_where_parts.append("i.category = %s")
                issue_params.append(issue_category_filter)

            issue_where = " AND ".join(issue_where_parts)

            try:
                issue_sql = f"""
                    SELECT
                        i.id, i.description, i.category,
                        i.node_id, i.project_id, p.name AS project_name,
                        1 - (e.embedding <=> %s::vector) AS similarity
                    FROM embeddings e
                    JOIN issues i ON e.target_id = i.id
                    JOIN projects p ON i.project_id = p.id
                    WHERE {issue_where}
                    ORDER BY e.embedding <=> %s::vector
                    LIMIT %s
                """
                issue_full_params = tuple([vec_str] + issue_params + [vec_str, limit])

                for row in conn.exec_driver_sql(issue_sql, issue_full_params).fetchall():
                    desc = row[1] or ""
                    issue_type = row[2] or ""
                    results.append({
                        "id": str(row[0]),
                        "type": "issue",
                        "title": f"[{issue_type}] {desc[:50]}",
                        "content_snippet": desc[:150],
                        "project_id": str(row[4]),
                        "project_name": row[5],
                        "node_path": None,
                        "node_id": str(row[3]) if row[3] else None,
                        "dimension_type": None,
                        "issue_category": issue_type,
                        "breadcrumb": None,
                        "_similarity": float(row[6]),
                    })
            except Exception as e_issue:
                logger.warning("Issue vector search skipped: %s", e_issue)

    except Exception as e:
        logger.warning("Vector search failed (degrading to keyword only): %s", e)
        return []

    # Sort by similarity descending, take top limit
    results.sort(key=lambda r: r.get("_similarity", 0.0), reverse=True)
    return results[:limit]


def _backfill_issue_breadcrumbs(db, results: list[dict]) -> None:
    """BUG-063: Fill in breadcrumb for issue results that have breadcrumb=None.

    vector_search() returns issues with breadcrumb=None because raw SQL doesn't
    join ancestor nodes. This function uses the ORM Session to query and backfill.
    Only processes entries where type=='issue', breadcrumb is None, and node_id exists.
    """
    from api.services.search import _build_breadcrumb
    from api.models.tables import Node, Project

    # Collect node_ids that need breadcrumb lookup
    node_ids_needed = [
        r["node_id"]
        for r in results
        if r.get("type") == "issue" and r.get("breadcrumb") is None and r.get("node_id")
    ]
    if not node_ids_needed:
        return

    # Batch query nodes + their projects
    rows = (
        db.query(Node, Project)
        .join(Project, Node.project_id == Project.id)
        .filter(Node.id.in_(node_ids_needed))
        .all()
    )
    node_map = {str(node.id): (node, project.name) for node, project in rows}

    for r in results:
        if r.get("type") == "issue" and r.get("breadcrumb") is None and r.get("node_id"):
            entry = node_map.get(r["node_id"])
            if entry:
                node, project_name = entry
                r["breadcrumb"] = _build_breadcrumb(db, node, project_name)


async def hybrid_search(
    db,
    db_engine,
    query: str,
    user_id: str,
    project_id: str | None = None,
    dimension_type: str | None = None,
    issue_category: str | None = None,
    limit: int = 20,
) -> dict:
    """Main entry point for F18 hybrid search.

    Returns same shape as unified_search() but with match_type + score fields.
    Degrades to pure keyword if pgvector is unavailable.
    """
    from api.services.search import unified_search, _get_accessible_project_ids
    from api.services.embedding_worker import is_pgvector_available

    # Always run keyword search (F9, never degrades)
    keyword_response = unified_search(
        db=db,
        query=query,
        user_id=user_id,
        project_id=project_id,
        dimension_type=dimension_type,
        issue_category=issue_category,
        limit=limit,
    )
    keyword_results = keyword_response.get("results", [])

    # Annotate keyword results with match_type=keyword
    for r in keyword_results:
        r["match_type"] = "keyword"
        r["score"] = 0.0

    # Attempt semantic search if pgvector available
    if not is_pgvector_available():
        return {
            "query": query,
            "total": len(keyword_results),
            "results": keyword_results,
            "search_mode": "keyword",  # indicates degraded mode
        }

    try:
        from api.services.embedding import get_provider
        provider = get_provider()
        query_embedding = await provider.embed(query)
    except Exception as e:
        logger.warning("Failed to embed query '%s': %s — using keyword only", query, e)
        return {
            "query": query,
            "total": len(keyword_results),
            "results": keyword_results,
            "search_mode": "keyword",
        }

    accessible_ids = _get_accessible_project_ids(db, user_id)

    semantic_results = await vector_search(
        db_engine=db_engine,
        query_embedding=query_embedding,
        accessible_project_ids=accessible_ids,
        project_id=project_id,
        dimension_type_filter=dimension_type,
        issue_category_filter=issue_category,
        limit=limit,
    )

    if not semantic_results:
        # Vector search returned nothing (empty DB, error, etc.) — keep keyword
        return {
            "query": query,
            "total": len(keyword_results),
            "results": keyword_results,
            "search_mode": "keyword",
        }

    # RRF fusion
    merged = rrf_merge(keyword_results, semantic_results)[:limit]

    # BUG-063: backfill breadcrumb for semantic-only issue results (breadcrumb=None)
    _backfill_issue_breadcrumbs(db, merged)

    return {
        "query": query,
        "total": len(merged),
        "results": merged,
        "search_mode": "hybrid",
    }
