"""F21 Template Manager — create, patch, match, inject analysis templates.

Implements Hermes-inspired self-learning loop for AI analysis:
  - create_template():  distill analysis experience into reusable template
  - patch_template():   update template + snapshot version history
  - match_templates():  pgvector semantic matching for relevant templates
  - inject_template():  format template as User Message for AI prompt
"""

import json
import logging
import uuid
from datetime import datetime

from sqlalchemy import and_
from sqlalchemy.orm import Session

from api.models.tables import AnalysisTemplate, TemplateVersion

logger = logging.getLogger(__name__)

MAX_CONTENT_SIZE = 50_000  # characters


# ─── Create ──────────────────────────────────────────

def create_template(
    db: Session,
    project_id: uuid.UUID,
    name: str,
    content: dict,
    created_by: uuid.UUID,
    description: str | None = None,
    category: str = "general",
) -> AnalysisTemplate:
    """Create a new analysis template and generate its embedding."""
    content_str = json.dumps(content, ensure_ascii=False)
    if len(content_str) > MAX_CONTENT_SIZE:
        raise ValueError(f"模板内容超出大小限制（{MAX_CONTENT_SIZE} 字符）")

    template = AnalysisTemplate(
        id=uuid.uuid4(),
        project_id=project_id,
        name=name,
        description=description,
        category=category,
        content=content,
        version=1,
        usage_count=0,
        created_by=created_by,
    )
    db.add(template)

    # Save initial version snapshot
    v1 = TemplateVersion(
        id=uuid.uuid4(),
        template_id=template.id,
        version_number=1,
        content=content,
        change_summary="初始创建",
        created_by=created_by,
    )
    db.add(v1)
    db.commit()
    db.refresh(template)

    # Generate embedding (async, fire-and-forget)
    _schedule_embedding(db, template)

    return template


# ─── Patch ───────────────────────────────────────────

def patch_template(
    db: Session,
    template_id: uuid.UUID,
    user_id: uuid.UUID,
    name: str | None = None,
    description: str | None = None,
    category: str | None = None,
    content: dict | None = None,
    change_summary: str | None = None,
) -> AnalysisTemplate:
    """Update template fields and create a version snapshot."""
    template = db.query(AnalysisTemplate).filter(
        and_(
            AnalysisTemplate.id == template_id,
            AnalysisTemplate.deleted_at.is_(None),
        )
    ).first()
    if not template:
        raise ValueError("模板不存在")

    if name is not None:
        template.name = name
    if description is not None:
        template.description = description
    if category is not None:
        template.category = category
    if content is not None:
        content_str = json.dumps(content, ensure_ascii=False)
        if len(content_str) > MAX_CONTENT_SIZE:
            raise ValueError(f"模板内容超出大小限制（{MAX_CONTENT_SIZE} 字符）")
        template.content = content

    template.version += 1
    template.updated_at = datetime.utcnow()

    # Version snapshot
    version = TemplateVersion(
        id=uuid.uuid4(),
        template_id=template.id,
        version_number=template.version,
        content=template.content,
        change_summary=change_summary or f"更新至 v{template.version}",
        created_by=user_id,
    )
    db.add(version)
    db.commit()
    db.refresh(template)

    # Re-generate embedding
    _schedule_embedding(db, template)

    return template


# ─── Match ───────────────────────────────────────────

def match_templates(
    db: Session,
    project_id: uuid.UUID,
    query: str,
    limit: int = 3,
) -> list[dict]:
    """Find templates relevant to a query using pgvector similarity.

    Falls back to keyword matching if pgvector is unavailable.
    """
    from api.services.embedding_worker import _PGVECTOR_AVAILABLE

    results = []

    if _PGVECTOR_AVAILABLE:
        results = _vector_match(db, project_id, query, limit)

    # Fallback / supplement: keyword matching
    if len(results) < limit:
        keyword_results = _keyword_match(db, project_id, query, limit - len(results))
        seen_ids = {r["template_id"] for r in results}
        for kr in keyword_results:
            if kr["template_id"] not in seen_ids:
                results.append(kr)

    return results[:limit]


def _vector_match(
    db: Session,
    project_id: uuid.UUID,
    query: str,
    limit: int,
) -> list[dict]:
    """Semantic matching via pgvector cosine similarity."""
    import asyncio
    from api.services.embedding import get_provider

    try:
        provider = get_provider()
        loop = asyncio.new_event_loop()
        query_vec = loop.run_until_complete(provider.embed(query))
        loop.close()
    except Exception as e:
        logger.warning(f"Embedding generation failed: {e}")
        return []

    vec_str = "[" + ",".join(str(v) for v in query_vec) + "]"

    sql = """
        SELECT e.target_id, 1 - (e.embedding <=> %s::vector) AS similarity
        FROM embeddings e
        JOIN analysis_templates t ON t.id = e.target_id
        WHERE e.target_type = 'template'
          AND t.project_id = %s
          AND t.deleted_at IS NULL
          AND 1 - (e.embedding <=> %s::vector) > 0.3
        ORDER BY similarity DESC
        LIMIT %s
    """

    try:
        conn = db.connection()
        cursor = conn.connection.cursor()
        cursor.execute(sql, (vec_str, str(project_id), vec_str, limit))
        rows = cursor.fetchall()
    except Exception as e:
        logger.warning(f"Vector search failed: {e}")
        return []

    results = []
    for target_id, similarity in rows:
        template = db.query(AnalysisTemplate).filter(
            AnalysisTemplate.id == target_id
        ).first()
        if template:
            results.append({
                "template_id": str(template.id),
                "name": template.name,
                "description": template.description,
                "category": template.category,
                "similarity": round(float(similarity), 4),
                "usage_count": template.usage_count,
            })

    return results


def _keyword_match(
    db: Session,
    project_id: uuid.UUID,
    query: str,
    limit: int,
) -> list[dict]:
    """Simple keyword matching as fallback."""
    templates = db.query(AnalysisTemplate).filter(
        and_(
            AnalysisTemplate.project_id == project_id,
            AnalysisTemplate.deleted_at.is_(None),
            AnalysisTemplate.name.ilike(f"%{query}%")
            | AnalysisTemplate.description.ilike(f"%{query}%"),
        )
    ).order_by(AnalysisTemplate.usage_count.desc()).limit(limit).all()

    return [
        {
            "template_id": str(t.id),
            "name": t.name,
            "description": t.description,
            "category": t.category,
            "similarity": 0.5,  # keyword match, no real similarity score
            "usage_count": t.usage_count,
        }
        for t in templates
    ]


# ─── Inject ──────────────────────────────────────────

def inject_template(template: AnalysisTemplate) -> str:
    """Format template content as User Message for AI prompt injection.

    Key design decision (from Hermes Agent):
      - Inject as User Message, NOT System Prompt
      - Preserves Prompt Cache (saves 90%+ API cost)
      - [SYSTEM: ...] prefix simulates system-level authority
    """
    content = template.content or {}
    parts = [
        f'[SYSTEM: 以下是历史分析经验模板「{template.name}」，请参考其中的步骤和陷阱来完成当前分析。]',
        "",
    ]

    if content.get("trigger_conditions"):
        parts.append("## 适用条件")
        for tc in content["trigger_conditions"]:
            parts.append(f"- {tc}")
        parts.append("")

    if content.get("analysis_steps"):
        parts.append("## 分析步骤")
        for i, step in enumerate(content["analysis_steps"], 1):
            parts.append(f"{i}. {step}")
        parts.append("")

    if content.get("pitfalls"):
        parts.append("## 常见陷阱")
        for p in content["pitfalls"]:
            parts.append(f"- ⚠️ {p}")
        parts.append("")

    if content.get("verification"):
        parts.append("## 验证方法")
        for v in content["verification"]:
            parts.append(f"- {v}")
        parts.append("")

    return "\n".join(parts)


# ─── Record usage ────────────────────────────────────

def record_usage(db: Session, template_id: uuid.UUID):
    """Increment usage count and update last_used_at."""
    template = db.query(AnalysisTemplate).filter(
        AnalysisTemplate.id == template_id
    ).first()
    if template:
        template.usage_count += 1
        template.last_used_at = datetime.utcnow()
        db.commit()


# ─── Revert ──────────────────────────────────────────

def revert_template(
    db: Session,
    template_id: uuid.UUID,
    target_version: int,
    user_id: uuid.UUID,
) -> AnalysisTemplate:
    """Revert template to a specific version."""
    version = db.query(TemplateVersion).filter(
        and_(
            TemplateVersion.template_id == template_id,
            TemplateVersion.version_number == target_version,
        )
    ).first()
    if not version:
        raise ValueError(f"版本 v{target_version} 不存在")

    return patch_template(
        db=db,
        template_id=template_id,
        user_id=user_id,
        content=version.content,
        change_summary=f"回滚至 v{target_version}",
    )


# ─── Embedding helper ────────────────────────────────

def _schedule_embedding(db: Session, template: AnalysisTemplate):
    """Generate and upsert embedding for a template."""
    try:
        import asyncio
        from api.services.embedding import get_provider

        text = _extract_template_text(template)
        if not text.strip():
            return

        provider = get_provider()
        loop = asyncio.new_event_loop()
        vector = loop.run_until_complete(provider.embed(text))
        loop.close()

        vec_str = "[" + ",".join(str(v) for v in vector) + "]"
        sql = """
            INSERT INTO embeddings (id, target_type, target_id, embedding, model, updated_at)
            VALUES (gen_random_uuid(), 'template', %s, %s::vector, %s, NOW())
            ON CONFLICT (target_type, target_id)
            DO UPDATE SET embedding = EXCLUDED.embedding,
                          model = EXCLUDED.model,
                          updated_at = NOW()
        """
        conn = db.connection()
        conn.connection.cursor().execute(sql, (
            str(template.id), vec_str, provider.model_name,
        ))
        conn.connection.commit()
    except Exception as e:
        logger.warning(f"Template embedding failed (non-blocking): {e}")


def _extract_template_text(template: AnalysisTemplate) -> str:
    """Extract searchable text from template for embedding."""
    parts = [template.name or ""]
    if template.description:
        parts.append(template.description)
    content = template.content or {}
    if isinstance(content, dict):
        for key in ("trigger_conditions", "analysis_steps", "pitfalls", "verification"):
            items = content.get(key, [])
            if isinstance(items, list):
                parts.extend(str(i) for i in items)
        if content.get("prompt_template"):
            parts.append(content["prompt_template"])
    return "\n".join(parts)
