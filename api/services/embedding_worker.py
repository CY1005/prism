"""F18 Embedding Worker — batch and incremental embedding generation.

Two modes:
1. backfill_all()  — full scan of all nodes/dimension_records/issues without embeddings
2. update_single() — triggered on content change for a specific target

Called from:
- FastAPI startup event (backfill, non-blocking background task)
- Routers that mutate nodes/dimension_records/issues (incremental update)
"""

import asyncio
import logging

logger = logging.getLogger(__name__)

_PGVECTOR_AVAILABLE: bool | None = None  # None = not yet checked


def is_pgvector_available() -> bool:
    """Return cached pgvector availability status."""
    return _PGVECTOR_AVAILABLE is True


def set_pgvector_available(value: bool) -> None:
    global _PGVECTOR_AVAILABLE
    _PGVECTOR_AVAILABLE = value


async def backfill_all(db_engine, batch_size: int = 50) -> dict:
    """Generate embeddings for all existing content that has none yet.

    Returns a summary dict: {"nodes": N, "dimensions": M, "issues": K, "errors": E}
    """
    from sqlalchemy import text
    from api.services.embedding import get_provider, extract_text_for_target, embed_and_store
    from api.models.tables import Node, DimensionRecord, Issue

    summary = {"nodes": 0, "dimensions": 0, "issues": 0, "errors": 0}

    if not is_pgvector_available():
        logger.info("pgvector not available — skipping backfill")
        return summary

    provider = get_provider()

    with db_engine.connect() as conn:
        # ── Nodes without embeddings ──────────────────────────────────────
        rows = conn.execute(text("""
            SELECT n.id, n.name
            FROM nodes n
            WHERE NOT EXISTS (
                SELECT 1 FROM embeddings e
                WHERE e.target_type = 'node' AND e.target_id = n.id
            )
            LIMIT :limit
        """), {"limit": batch_size * 10}).fetchall()

    # Process nodes
    for row in rows:
        target_id = str(row[0])
        text_content = row[1] or ""
        ok = await embed_and_store(db_engine, provider, "node", target_id, text_content)
        if ok:
            summary["nodes"] += 1
        else:
            summary["errors"] += 1
        await asyncio.sleep(0)  # yield to event loop between items

    with db_engine.connect() as conn:
        # ── DimensionRecords without embeddings ───────────────────────────
        rows = conn.execute(text("""
            SELECT dr.id, dr.content
            FROM dimension_records dr
            WHERE NOT EXISTS (
                SELECT 1 FROM embeddings e
                WHERE e.target_type = 'dimension_record' AND e.target_id = dr.id
            )
            LIMIT :limit
        """), {"limit": batch_size * 10}).fetchall()

    import json as _json
    for row in rows:
        target_id = str(row[0])
        content = row[1]
        if isinstance(content, dict):
            parts = []
            for k, v in content.items():
                if isinstance(v, str) and v.strip():
                    parts.append(f"{k}: {v}")
                elif isinstance(v, list):
                    parts.append(f"{k}: {' '.join(str(i) for i in v)}")
            text_content = "\n".join(parts)
        else:
            text_content = _json.dumps(content, ensure_ascii=False) if content else ""

        ok = await embed_and_store(db_engine, provider, "dimension_record", target_id, text_content)
        if ok:
            summary["dimensions"] += 1
        else:
            summary["errors"] += 1
        await asyncio.sleep(0)

    with db_engine.connect() as conn:
        # ── Issues without embeddings ─────────────────────────────────────
        # Use only columns guaranteed to exist across all schema versions
        rows = conn.execute(text("""
            SELECT i.id, i.description
            FROM issues i
            WHERE NOT EXISTS (
                SELECT 1 FROM embeddings e
                WHERE e.target_type = 'issue' AND e.target_id = i.id
            )
            LIMIT :limit
        """), {"limit": batch_size * 10}).fetchall()

    for row in rows:
        target_id = str(row[0])
        text_content = row[1] or ""

        ok = await embed_and_store(db_engine, provider, "issue", target_id, text_content.strip())
        if ok:
            summary["issues"] += 1
        else:
            summary["errors"] += 1
        await asyncio.sleep(0)

    logger.info(
        "Embedding backfill complete: nodes=%d, dimensions=%d, issues=%d, errors=%d",
        summary["nodes"], summary["dimensions"], summary["issues"], summary["errors"]
    )
    return summary


async def update_single(
    db_engine,
    target_type: str,
    target_id: str,
    text_content: str,
) -> bool:
    """Trigger incremental embedding update for one changed record.

    Returns True on success, False if pgvector unavailable or error.
    """
    if not is_pgvector_available():
        return False

    from api.services.embedding import get_provider, embed_and_store

    provider = get_provider()
    return await embed_and_store(db_engine, provider, target_type, target_id, text_content)


async def run_backfill_background(db_engine) -> None:
    """Non-blocking wrapper for startup backfill."""
    try:
        summary = await backfill_all(db_engine)
        logger.info("Background backfill finished: %s", summary)
    except Exception as e:
        logger.error("Background backfill failed: %s", e)
