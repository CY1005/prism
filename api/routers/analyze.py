"""F13 AI需求分析 — progressive 3-layer analysis + test point generation.

Keeps legacy /analyze and /test-points endpoints for backward compatibility.
New endpoints under /analyze/* use AI providers with SSE streaming.
"""

import json
import logging
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from api.db import get_db
from api.models.tables import (
    AnalysisTask,
    Competitor,
    CompetitorReference,
    DimensionRecord,
    DimensionType,
    Issue,
    Node,
    NodeRelation,
    Project,
)
from api.schemas.analyze import (
    AnalyzeRequest,
    AnalyzeResponse,
    GenerateTestPointsRequest,
    GenerateTestPointsResponse,
    AITestPoint,
    RequirementAnalysisRequest,
    SaveAnalysisRequest,
    SaveAnalysisResponse,
    SaveTestPointsRequest,
    SaveTestPointsResponse,
    AffectedNodesResponse,
)
from api.schemas.test_points import TestPointsRequest, TestPointsResponse
from api.services.ai_provider import get_provider
from api.services.analyzer import analyze_requirement
from api.services.test_point_generator import generate_test_points

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Legacy endpoints (backward compat) ──────────────


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest, db: Session = Depends(get_db)):
    """Analyze a requirement's impact scope across project modules."""
    result = analyze_requirement(
        db=db,
        project_id=req.project_id,
        requirement_text=req.requirement_text,
        include_modules=req.context.include_modules if req.context else None,
    )
    return result


@router.post("/test-points", response_model=TestPointsResponse)
def test_points(req: TestPointsRequest):
    """Generate test points based on requirement and affected modules."""
    result = generate_test_points(
        requirement_text=req.requirement_text,
        affected_modules=req.affected_modules,
        test_depth=req.test_depth,
    )
    return result


# ─── F13 new endpoints ───────────────────────────────


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


def _get_dimension_records(db: Session, node_ids: list[str]) -> list[dict]:
    """Fetch dimension records for given node IDs, return as context dicts."""
    records = (
        db.query(DimensionRecord, DimensionType)
        .join(DimensionType, DimensionRecord.dimension_type_id == DimensionType.id)
        .filter(DimensionRecord.node_id.in_(node_ids))
        .all()
    )
    return [
        {
            "node_id": str(rec.node_id),
            "dimension": dt.name,
            "content": rec.content,
        }
        for rec, dt in records
    ]


def _get_issues(db: Session, node_ids: list[str]) -> list[dict]:
    """Fetch issues linked to given node IDs."""
    issues = db.query(Issue).filter(Issue.node_id.in_(node_ids)).all()
    return [
        {
            "node_id": str(i.node_id),
            "category": i.category,
            "description": i.description,
        }
        for i in issues
    ]


def _get_related_node_ids(db: Session, node_id: str) -> list[str]:
    """Get directly connected node IDs via node_relations."""
    relations = db.query(NodeRelation).filter(
        or_(
            NodeRelation.source_node_id == node_id,
            NodeRelation.target_node_id == node_id,
        )
    ).all()
    ids = set()
    for r in relations:
        ids.add(str(r.source_node_id))
        ids.add(str(r.target_node_id))
    ids.discard(node_id)
    return list(ids)


def _build_context(db: Session, req: RequirementAnalysisRequest) -> tuple[str, str]:
    """Build prompt + context for the given analysis level (ADR-013 progressive).

    Returns (prompt, context_str).
    """
    node = _get_node(db, req.node_id)
    node_id_str = str(req.node_id)

    # L1: current node dimension records + issues
    l1_node_ids = [node_id_str]
    dim_records = _get_dimension_records(db, l1_node_ids)
    issues = _get_issues(db, l1_node_ids)

    context_parts = [
        f"当前功能节点: {node.name} (路径: {node.path})",
        f"维度记录数: {len(dim_records)}",
    ]
    if dim_records:
        context_parts.append("### 维度记录")
        for dr in dim_records[:20]:  # cap to avoid overlong context
            content_str = json.dumps(dr["content"], ensure_ascii=False) if isinstance(dr["content"], dict) else str(dr["content"])
            context_parts.append(f"- [{dr['dimension']}] {content_str[:300]}")

    if issues:
        context_parts.append("### 已知问题")
        for iss in issues[:10]:
            context_parts.append(f"- [{iss['category']}] {iss['description'][:200]}")

    # L2: add related nodes
    if req.analysis_level in ("L2", "L3"):
        related_ids = _get_related_node_ids(db, node_id_str)
        if related_ids:
            related_nodes = db.query(Node).filter(Node.id.in_(related_ids)).all()
            context_parts.append(f"\n### 关联节点 ({len(related_nodes)}个)")
            for rn in related_nodes[:15]:
                context_parts.append(f"- {rn.name} (路径: {rn.path})")

            related_dims = _get_dimension_records(db, related_ids)
            if related_dims:
                context_parts.append("### 关联节点维度记录")
                for dr in related_dims[:20]:
                    content_str = json.dumps(dr["content"], ensure_ascii=False) if isinstance(dr["content"], dict) else str(dr["content"])
                    context_parts.append(f"- [{dr['dimension']}] {content_str[:200]}")

            related_issues = _get_issues(db, related_ids)
            if related_issues:
                context_parts.append("### 关联节点问题")
                for iss in related_issues[:10]:
                    context_parts.append(f"- [{iss['category']}] {iss['description'][:200]}")

    # L3: global keyword search
    if req.analysis_level == "L3":
        from api.services.search import unified_search

        # Extract keywords from requirement
        keywords = req.requirement_text[:100]
        search_result = unified_search(
            db=db,
            query=keywords,
            user_id="system",  # system-level search, no permission filter
            project_id=str(req.project_id),
            limit=10,
        )
        if search_result["results"]:
            context_parts.append(f"\n### 全局关联搜索结果 ({search_result['total']}条)")
            for sr in search_result["results"]:
                context_parts.append(
                    f"- [{sr['type']}] {sr['title']}: {sr.get('content_snippet', '')[:150]}"
                )

    if req.file_content:
        context_parts.append("\n### 附件内容")
        context_parts.append(req.file_content[:5000])

    context_str = "\n".join(context_parts)

    prompt = (
        f"你是一个专业的产品需求分析师。请对以下需求进行{req.analysis_level}级别的分析。\n\n"
        f"## 需求文本\n{req.requirement_text}\n\n"
        f"## 分析要求\n"
        f"1. 分析该需求对当前功能及关联功能的影响范围\n"
        f"2. 检查需求的完整性（是否缺少边界条件、异常处理、性能要求等）\n"
        f"3. 给出改进建议\n"
        f"4. 标注潜在风险点\n\n"
        f"请用Markdown格式输出分析结果。"
    )

    return prompt, context_str


@router.post("/analyze/requirement")
async def analyze_requirement_stream(
    req: RequirementAnalysisRequest,
    db: Session = Depends(get_db),
):
    """SSE streaming requirement analysis with progressive L1/L2/L3 depth."""
    project = _get_project(db, req.project_id)
    provider = get_provider(project.ai_provider or "mock", project.ai_api_key_enc)

    prompt, context_str = _build_context(db, req)

    async def event_stream():
        full_text = []
        start = time.time()
        try:
            async for chunk in provider.analyze(prompt, context_str):
                full_text.append(chunk)
                data = json.dumps(
                    {"text": chunk, "level": req.analysis_level, "source": "ai"},
                    ensure_ascii=False,
                )
                yield f"event: chunk\ndata: {data}\n\n"

            elapsed_ms = int((time.time() - start) * 1000)
            complete_data = json.dumps(
                {
                    "full_result": "".join(full_text),
                    "metadata": {
                        "model": project.ai_provider or "mock",
                        "level": req.analysis_level,
                        "analysis_time_ms": elapsed_ms,
                    },
                },
                ensure_ascii=False,
            )
            yield f"event: complete\ndata: {complete_data}\n\n"
        except Exception as e:
            logger.error("Analysis streaming error: %s", e)
            error_data = json.dumps({"error": str(e)}, ensure_ascii=False)
            yield f"event: error\ndata: {error_data}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/analyze/save", response_model=SaveAnalysisResponse)
def save_analysis(req: SaveAnalysisRequest, db: Session = Depends(get_db)):
    """Save analysis result as a dimension record on the node.

    F13 AC4: affected_node_ids are stored in content.metadata so that
    relation-graph can highlight affected nodes via GET /analyze/affected-nodes.
    """
    _get_project(db, req.project_id)
    _get_node(db, req.node_id)

    # Find or create "requirement_analysis" dimension type
    dim_type = db.query(DimensionType).filter(
        DimensionType.key == "requirement_analysis"
    ).first()
    if not dim_type:
        dim_type = DimensionType(
            key="requirement_analysis",
            name="需求分析",
            icon="Brain",
            description="AI需求分析结果",
        )
        db.add(dim_type)
        db.flush()

    meta = req.metadata or {}
    if req.affected_node_ids is not None:
        meta["affected_node_ids"] = req.affected_node_ids

    record_id = uuid.uuid4()
    record = DimensionRecord(
        id=record_id,
        node_id=str(req.node_id),
        dimension_type_id=dim_type.id,
        content={
            "analysis_result": req.analysis_result,
            "metadata": meta,
        },
    )
    db.add(record)
    db.commit()

    return SaveAnalysisResponse(
        dimension_record_id=record_id,
        message="分析结果已保存",
    )


@router.get("/analyze/affected-nodes", response_model=AffectedNodesResponse)
def get_affected_nodes(
    node_id: str,
    project_id: str,
    db: Session = Depends(get_db),
):
    """F13 AC4: Return affected_node_ids from the most recent analysis of this node.

    relation-graph page calls this to highlight nodes impacted by the latest
    requirement analysis. Returns empty list if no analysis has been saved.
    """
    dim_type = db.query(DimensionType).filter(
        DimensionType.key == "requirement_analysis"
    ).first()
    if not dim_type:
        return AffectedNodesResponse(node_id=node_id, affected_node_ids=[])

    record = (
        db.query(DimensionRecord)
        .filter(
            DimensionRecord.node_id == node_id,
            DimensionRecord.dimension_type_id == dim_type.id,
        )
        .order_by(DimensionRecord.created_at.desc())
        .first()
    )
    if not record:
        return AffectedNodesResponse(node_id=node_id, affected_node_ids=[])

    content = record.content or {}
    meta = content.get("metadata", {}) if isinstance(content, dict) else {}
    affected = meta.get("affected_node_ids", []) if isinstance(meta, dict) else []

    return AffectedNodesResponse(
        node_id=node_id,
        affected_node_ids=affected,
        analysis_record_id=record.id,
    )


@router.post("/analyze/generate-test-points", response_model=GenerateTestPointsResponse)
async def generate_ai_test_points(
    req: GenerateTestPointsRequest,
    db: Session = Depends(get_db),
):
    """Use AI to generate test points from an analysis result."""
    project = _get_project(db, req.project_id)
    provider = get_provider(project.ai_provider or "mock", project.ai_api_key_enc)

    depth_desc = {"smoke": "冒烟测试（3-5个关键点）", "standard": "标准测试（8-12个测试点）", "comprehensive": "全面测试（15-20个测试点）"}

    prompt = (
        f"你是一个专业的测试工程师。请根据以下需求分析结果生成测试点。\n\n"
        f"## 需求分析结果\n{req.analysis_result}\n\n"
        f"## 测试深度: {depth_desc.get(req.test_depth, req.test_depth)}\n\n"
        f"## 输出格式要求\n"
        f"请输出JSON数组，每个测试点包含以下字段：\n"
        f'- title: 测试点标题\n'
        f'- description: 详细描述\n'
        f'- priority: P0/P1/P2\n'
        f'- category: functional/boundary/exception/performance\n'
        f'- steps: 测试步骤数组\n'
        f'- expected_result: 预期结果\n\n'
        f"只输出JSON数组，不要输出其他内容。"
    )

    raw = await provider.generate(prompt)

    # Parse AI response
    test_points = _parse_test_points(raw, req.test_depth)

    return GenerateTestPointsResponse(
        test_points=test_points,
        total=len(test_points),
    )


def _parse_test_points(raw: str, depth: str) -> list[AITestPoint]:
    """Try to parse AI JSON response; fall back to mock points."""
    # Try to extract JSON array from response
    try:
        # Find JSON array in response
        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start >= 0 and end > start:
            data = json.loads(raw[start:end])
            return [
                AITestPoint(
                    title=tp.get("title", "未命名测试点"),
                    description=tp.get("description", ""),
                    priority=tp.get("priority", "P1"),
                    category=tp.get("category", "functional"),
                    steps=tp.get("steps"),
                    expected_result=tp.get("expected_result"),
                )
                for tp in data
            ]
    except (json.JSONDecodeError, TypeError, AttributeError):
        pass

    # Fallback: generate simple mock points
    count = {"smoke": 3, "standard": 8, "comprehensive": 15}.get(depth, 8)
    return [
        AITestPoint(
            title=f"测试点 {i+1}",
            description=f"基于分析结果生成的测试点 {i+1}",
            priority=["P0", "P1", "P2"][i % 3],
            category=["functional", "boundary", "exception", "performance"][i % 4],
        )
        for i in range(count)
    ]


@router.post("/analyze/save-test-points", response_model=SaveTestPointsResponse)
def save_test_points(req: SaveTestPointsRequest, db: Session = Depends(get_db)):
    """Batch save test points as dimension records."""
    _get_node(db, req.node_id)

    # Find or create "test_analysis" dimension type
    dim_type = db.query(DimensionType).filter(
        DimensionType.key == "test_analysis"
    ).first()
    if not dim_type:
        dim_type = DimensionType(
            key="test_analysis",
            name="测试分析",
            icon="TestTube",
            description="AI生成的测试点",
        )
        db.add(dim_type)
        db.flush()

    record_ids = []
    for tp in req.test_points:
        record_id = uuid.uuid4()
        record = DimensionRecord(
            id=record_id,
            node_id=str(req.node_id),
            dimension_type_id=dim_type.id,
            content=tp.model_dump(),
        )
        db.add(record)
        record_ids.append(record_id)

    db.commit()

    return SaveTestPointsResponse(
        saved_count=len(record_ids),
        dimension_record_ids=record_ids,
        message=f"已保存 {len(record_ids)} 个测试点",
    )
