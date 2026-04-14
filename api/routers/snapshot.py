"""F16 AI snapshot — generate current snapshot from version history.

When a node has 3+ version records, AI summarizes the evolution into:
1. A one-line summary (free text)
2. Per-dimension structured current state
"""

import json
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.db import get_db
from api.models.tables import (
    DimensionRecord,
    DimensionType,
    Node,
    Project,
    VersionRecord,
)
from api.schemas.snapshot import (
    DimensionSaveItem,
    DimensionSnapshot,
    SnapshotGenerateRequest,
    SnapshotGenerateResponse,
    SnapshotSaveRequest,
    SnapshotSaveResponse,
)
from api.services.ai_provider import get_provider

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_project(db: Session, project_id: uuid.UUID) -> Project:
    project = db.query(Project).filter(
        Project.id == str(project_id),
        Project.deleted_at.is_(None),
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _get_node(db: Session, node_id: uuid.UUID) -> Node:
    node = db.query(Node).filter(Node.id == str(node_id)).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.post("/generate", response_model=SnapshotGenerateResponse)
async def generate_snapshot(
    req: SnapshotGenerateRequest,
    db: Session = Depends(get_db),
):
    """Generate AI snapshot from version history (requires >= 3 versions)."""
    project = _get_project(db, req.project_id)
    node = _get_node(db, req.node_id)

    # Fetch version records
    versions = (
        db.query(VersionRecord)
        .filter(VersionRecord.node_id == str(req.node_id))
        .order_by(VersionRecord.created_at.asc())
        .all()
    )

    if len(versions) < 3:
        raise HTTPException(
            status_code=400,
            detail=f"至少需要3条版本记录才能生成快照，当前只有{len(versions)}条",
        )

    # Fetch current dimension records
    dim_records = (
        db.query(DimensionRecord, DimensionType)
        .join(DimensionType, DimensionRecord.dimension_type_id == DimensionType.id)
        .filter(DimensionRecord.node_id == str(req.node_id))
        .all()
    )

    # Build context for AI
    version_context = []
    for v in versions:
        entry = f"- [{v.version_label}] ({v.change_type}) {v.summary}"
        if v.details:
            entry += f"\n  详情: {v.details[:200]}"
        version_context.append(entry)

    dim_context = []
    for rec, dt in dim_records:
        content_str = json.dumps(rec.content, ensure_ascii=False) if isinstance(rec.content, dict) else str(rec.content)
        dim_context.append(f"- [{dt.key}] {dt.name}: {content_str[:300]}")

    # Build dimension keys list for structured output
    dim_keys = [dt.key for _, dt in dim_records]
    dim_names = {dt.key: dt.name for _, dt in dim_records}

    context = (
        f"功能项: {node.name}\n"
        f"版本演进记录 ({len(versions)}条):\n"
        + "\n".join(version_context)
        + "\n\n当前维度内容:\n"
        + "\n".join(dim_context) if dim_context else ""
    )

    prompt = (
        f"你是一个产品知识管理专家。请基于以下功能项的版本演进历史，生成当前快照。\n\n"
        f"## 要求\n"
        f"1. 一句话概要：用一句话总结该功能项当前的整体状态\n"
        f"2. 按维度结构化输出：针对每个维度，基于版本演进记录总结其最新状态\n\n"
        f"## 输出格式\n"
        f"请输出JSON，格式如下：\n"
        f'{{"summary": "一句话概要", "dimensions": [{{"dimension_key": "维度key", "dimension_name": "维度名", "content": "该维度最新状态描述"}}]}}\n\n'
        f"维度列表: {json.dumps(dim_names, ensure_ascii=False)}\n\n"
        f"只输出JSON，不要输出其他内容。"
    )

    provider = get_provider(project.ai_provider or "mock", project.ai_api_key_enc)
    raw = await provider.generate(prompt, context)

    # Parse AI response
    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start >= 0 and end > start:
            data = json.loads(raw[start:end])
            summary = data.get("summary", "快照生成完成")
            dimensions = [
                DimensionSnapshot(
                    dimension_key=d.get("dimension_key", ""),
                    dimension_name=d.get("dimension_name", ""),
                    content=d.get("content", ""),
                )
                for d in data.get("dimensions", [])
            ]
        else:
            raise ValueError("No JSON found")
    except (json.JSONDecodeError, ValueError, TypeError):
        # Fallback: use raw text as summary, generate dimensions from existing records
        summary = raw[:200] if raw else "快照生成完成"
        dimensions = [
            DimensionSnapshot(
                dimension_key=dt.key,
                dimension_name=dt.name,
                content=f"基于{len(versions)}条版本记录生成的{dt.name}快照",
            )
            for _, dt in dim_records
        ]

    return SnapshotGenerateResponse(summary=summary, dimensions=dimensions)


@router.post("/save", response_model=SnapshotSaveResponse)
def save_snapshot(
    req: SnapshotSaveRequest,
    db: Session = Depends(get_db),
):
    """Save reviewed snapshot: summary → node description dimension, dimensions → update dimension records."""
    _get_project(db, req.project_id)
    node = _get_node(db, req.node_id)

    updated_summary = False
    updated_dimensions = 0

    # Save summary as a "snapshot_summary" dimension record
    if req.summary:
        dim_type = db.query(DimensionType).filter(
            DimensionType.key == "snapshot_summary"
        ).first()
        if not dim_type:
            dim_type = DimensionType(
                key="snapshot_summary",
                name="快照概要",
                icon="Camera",
                description="AI生成的功能项快照概要",
            )
            db.add(dim_type)
            db.flush()

        # Upsert: update existing or create new
        existing = db.query(DimensionRecord).filter(
            DimensionRecord.node_id == str(req.node_id),
            DimensionRecord.dimension_type_id == dim_type.id,
        ).first()

        if existing:
            existing.content = {"summary": req.summary}
            existing.version = existing.version + 1
        else:
            record = DimensionRecord(
                id=uuid.uuid4(),
                node_id=str(req.node_id),
                dimension_type_id=dim_type.id,
                content={"summary": req.summary},
            )
            db.add(record)
        updated_summary = True

    # Save per-dimension content
    if req.dimensions:
        for dim_item in req.dimensions:
            dim_type = db.query(DimensionType).filter(
                DimensionType.key == dim_item.dimension_type_key,
            ).first()
            if not dim_type:
                continue

            existing = db.query(DimensionRecord).filter(
                DimensionRecord.node_id == str(req.node_id),
                DimensionRecord.dimension_type_id == dim_type.id,
            ).first()

            if existing:
                existing.content = dim_item.content
                existing.version = existing.version + 1
            else:
                record = DimensionRecord(
                    id=uuid.uuid4(),
                    node_id=str(req.node_id),
                    dimension_type_id=dim_type.id,
                    content=dim_item.content,
                )
                db.add(record)
            updated_dimensions += 1

    db.commit()

    return SnapshotSaveResponse(
        updated_summary=updated_summary,
        updated_dimensions=updated_dimensions,
        message=f"快照已保存：概要{'已更新' if updated_summary else '未更新'}，{updated_dimensions}个维度已更新",
    )
