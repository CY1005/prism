"""F12 对比矩阵 — AI-generated comparison matrix with edit, backfill, export."""

import hashlib
import json
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.db import get_db
from api.models.tables import (
    AnalysisTask,
    Competitor,
    CompetitorReference,
    DimensionRecord,
    DimensionType,
    Node,
    Project,
)
from api.schemas.comparison import (
    ComparisonBackfillRequest,
    ComparisonBackfillResponse,
    ComparisonCell,
    ComparisonColumn,
    ComparisonData,
    ComparisonExportResponse,
    ComparisonGenerateRequest,
    ComparisonGenerateResponse,
    ComparisonRow,
    ComparisonUpdateRequest,
    ComparisonUpdateResponse,
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


@router.post("/generate", response_model=ComparisonGenerateResponse)
async def generate_comparison(
    req: ComparisonGenerateRequest,
    db: Session = Depends(get_db),
):
    """Generate an AI comparison matrix for selected nodes vs competitors."""
    project = _get_project(db, req.project_id)

    # Fetch nodes
    node_id_strs = [str(nid) for nid in req.node_ids]
    nodes = db.query(Node).filter(Node.id.in_(node_id_strs)).all()
    if not nodes:
        raise HTTPException(status_code=404, detail="No nodes found")

    # Fetch competitors
    competitors = []
    if req.competitor_ids:
        comp_id_strs = [str(cid) for cid in req.competitor_ids]
        competitors = db.query(Competitor).filter(Competitor.id.in_(comp_id_strs)).all()

    # Fetch dimension records for context
    dim_records = (
        db.query(DimensionRecord, DimensionType)
        .join(DimensionType, DimensionRecord.dimension_type_id == DimensionType.id)
        .filter(DimensionRecord.node_id.in_(node_id_strs))
        .all()
    )

    # Fetch existing competitor references
    comp_refs = []
    if competitors:
        comp_refs = (
            db.query(CompetitorReference)
            .filter(
                CompetitorReference.node_id.in_(node_id_strs),
                CompetitorReference.competitor_id.in_([str(c.id) for c in competitors]),
            )
            .all()
        )

    # Build AI prompt
    context_parts = ["## 对比背景"]
    context_parts.append(f"项目: {project.name}")
    context_parts.append(f"自有功能 ({len(nodes)}个):")
    for n in nodes:
        context_parts.append(f"- {n.name} (路径: {n.path})")

    if competitors:
        context_parts.append(f"\n竞品 ({len(competitors)}个):")
        for c in competitors:
            context_parts.append(f"- {c.name}: {c.description or '无描述'}")

    if dim_records:
        context_parts.append("\n## 自有功能维度数据")
        for rec, dt in dim_records[:30]:
            content_str = json.dumps(rec.content, ensure_ascii=False) if isinstance(rec.content, dict) else str(rec.content)
            context_parts.append(f"- [{dt.name}] {content_str[:200]}")

    if comp_refs:
        context_parts.append("\n## 已有竞品参考数据")
        for cr in comp_refs[:20]:
            context_parts.append(
                f"- 功能覆盖: {cr.feature_coverage or 'N/A'}, "
                f"技术方案: {cr.technical_approach or 'N/A'}"
            )

    context_str = "\n".join(context_parts)

    dim_list = ", ".join(req.custom_dimensions) if req.custom_dimensions else "功能完整度, 用户体验, 性能, 可扩展性, 文档质量"

    prompt = (
        f"你是产品分析师。请生成一个对比矩阵表格。\n\n"
        f"## 列（参与对比的产品/功能）\n"
    )
    for n in nodes:
        prompt += f"- {n.name} (自有)\n"
    for c in competitors:
        prompt += f"- {c.name} (竞品)\n"

    prompt += (
        f"\n## 对比维度\n{dim_list}\n\n"
        f"## 输出格式\n"
        f"输出JSON对象，包含:\n"
        f'- rows: 数组，每行含 dimension(维度名), cells(对象，key为列名，value含 value 和 score 0-10)\n\n'
        f"只输出JSON，不要其他内容。"
    )

    provider = get_provider(project.ai_provider or "mock", project.ai_api_key_enc)
    raw = await provider.generate(prompt, context_str)

    # Parse AI response into structured data
    columns, rows = _parse_comparison(raw, nodes, competitors, req.custom_dimensions)

    # Save as AnalysisTask
    task_id = uuid.uuid4()
    input_hash = hashlib.sha256(
        f"{req.project_id}:{node_id_strs}:{req.competitor_ids}".encode()
    ).hexdigest()[:16]

    comparison_data = ComparisonData(columns=columns, rows=rows)

    task = AnalysisTask(
        id=task_id,
        project_id=str(req.project_id),
        user_id=str(project.created_by),  # use project owner as fallback
        task_type="comparison",
        input_hash=input_hash,
        status="completed",
        input_data={
            "node_ids": node_id_strs,
            "competitor_ids": [str(cid) for cid in req.competitor_ids],
            "custom_dimensions": req.custom_dimensions,
        },
        result_data=comparison_data.model_dump(),
    )
    db.add(task)
    db.commit()

    return ComparisonGenerateResponse(
        comparison_id=task_id,
        data=comparison_data,
    )


def _parse_comparison(
    raw: str,
    nodes: list[Node],
    competitors: list[Competitor],
    custom_dimensions: list[str],
) -> tuple[list[ComparisonColumn], list[ComparisonRow]]:
    """Parse AI JSON response into columns + rows; fall back to mock data."""
    # Build columns
    columns = []
    for n in nodes:
        columns.append(ComparisonColumn(id=str(n.id), name=n.name, type="self"))
    for c in competitors:
        columns.append(ComparisonColumn(id=str(c.id), name=c.name, type="competitor"))

    col_names = {col.name: col.id for col in columns}

    # Try parsing AI response
    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start >= 0 and end > start:
            data = json.loads(raw[start:end])
            ai_rows = data.get("rows", [])
            rows = []
            for ar in ai_rows:
                dimension = ar.get("dimension", "未命名")
                cells = {}
                raw_cells = ar.get("cells", {})
                for col_name, cell_data in raw_cells.items():
                    col_id = col_names.get(col_name, col_name)
                    if isinstance(cell_data, dict):
                        cells[col_id] = ComparisonCell(
                            value=str(cell_data.get("value", "")),
                            score=cell_data.get("score"),
                        )
                    else:
                        cells[col_id] = ComparisonCell(value=str(cell_data))
                rows.append(ComparisonRow(dimension=dimension, cells=cells))
            if rows:
                return columns, rows
    except (json.JSONDecodeError, TypeError, AttributeError):
        pass

    # Fallback mock data
    dimensions = custom_dimensions or ["功能完整度", "用户体验", "性能", "可扩展性", "文档质量"]
    rows = []
    for dim in dimensions:
        cells = {}
        for i, col in enumerate(columns):
            score = 8.0 - i * 0.5 if col.type == "self" else 7.0 - i * 0.3
            cells[col.id] = ComparisonCell(
                value=f"{dim}表现{'优秀' if score > 7 else '良好' if score > 5 else '一般'}",
                score=round(max(1.0, min(10.0, score)), 1),
            )
        rows.append(ComparisonRow(dimension=dim, cells=cells))
    return columns, rows


@router.put("/{comparison_id}", response_model=ComparisonUpdateResponse)
def update_comparison(
    comparison_id: uuid.UUID,
    req: ComparisonUpdateRequest,
    db: Session = Depends(get_db),
):
    """Edit comparison table (add/remove/update rows, columns, cells)."""
    task = db.query(AnalysisTask).filter(
        AnalysisTask.id == str(comparison_id),
        AnalysisTask.task_type == "comparison",
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Comparison not found")

    task.result_data = req.data.model_dump()
    db.commit()

    return ComparisonUpdateResponse(
        comparison_id=comparison_id,
        message="对比矩阵已更新",
    )


@router.post("/{comparison_id}/backfill", response_model=ComparisonBackfillResponse)
def backfill_comparison(
    comparison_id: uuid.UUID,
    req: ComparisonBackfillRequest,
    db: Session = Depends(get_db),
):
    """Backfill: write comparison row data back to CompetitorReference record."""
    task = db.query(AnalysisTask).filter(
        AnalysisTask.id == str(comparison_id),
        AnalysisTask.task_type == "comparison",
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Comparison not found")

    result_data = task.result_data or {}
    rows = result_data.get("rows", [])
    if req.row_index < 0 or req.row_index >= len(rows):
        raise HTTPException(status_code=400, detail="Invalid row_index")

    row = rows[req.row_index]
    node_id_str = str(req.node_id)
    competitor_id_str = str(req.competitor_id)

    # Extract cell data for the competitor column
    cells = row.get("cells", {})
    cell = cells.get(competitor_id_str, {})
    cell_value = cell.get("value", "") if isinstance(cell, dict) else str(cell)

    # Find or create CompetitorReference
    comp_ref = db.query(CompetitorReference).filter(
        CompetitorReference.node_id == node_id_str,
        CompetitorReference.competitor_id == competitor_id_str,
    ).first()

    if comp_ref:
        # Update existing
        pros_cons = comp_ref.pros_and_cons or {}
        pros_cons[row.get("dimension", "unknown")] = cell_value
        comp_ref.pros_and_cons = pros_cons
        comp_ref.feature_coverage = (comp_ref.feature_coverage or "") + f"\n{row.get('dimension', '')}: {cell_value}"
        ref_id = comp_ref.id
    else:
        ref_id = uuid.uuid4()
        comp_ref = CompetitorReference(
            id=ref_id,
            node_id=node_id_str,
            competitor_id=competitor_id_str,
            feature_coverage=f"{row.get('dimension', '')}: {cell_value}",
            pros_and_cons={row.get("dimension", "unknown"): cell_value},
        )
        db.add(comp_ref)

    db.commit()

    return ComparisonBackfillResponse(
        competitor_reference_id=ref_id,
        message="已回填竞品参考数据",
    )


@router.get("/{comparison_id}/export", response_model=ComparisonExportResponse)
def export_comparison(
    comparison_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Export comparison as Markdown table."""
    task = db.query(AnalysisTask).filter(
        AnalysisTask.id == str(comparison_id),
        AnalysisTask.task_type == "comparison",
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Comparison not found")

    result_data = task.result_data or {}
    columns = result_data.get("columns", [])
    rows = result_data.get("rows", [])

    if not columns:
        return ComparisonExportResponse(
            markdown="*无对比数据*",
            comparison_id=comparison_id,
        )

    # Build markdown table
    col_names = [c["name"] for c in columns]
    col_ids = [c["id"] for c in columns]

    header = "| 维度 | " + " | ".join(col_names) + " |"
    separator = "|---" + "|---" * len(col_names) + "|"

    md_rows = [header, separator]
    for row in rows:
        dimension = row.get("dimension", "")
        cells = row.get("cells", {})
        values = []
        for cid in col_ids:
            cell = cells.get(cid, {})
            val = cell.get("value", "-") if isinstance(cell, dict) else str(cell) if cell else "-"
            score = cell.get("score") if isinstance(cell, dict) else None
            if score is not None:
                values.append(f"{val} ({score})")
            else:
                values.append(val)
        md_rows.append(f"| {dimension} | " + " | ".join(values) + " |")

    return ComparisonExportResponse(
        markdown="\n".join(md_rows),
        comparison_id=comparison_id,
    )
