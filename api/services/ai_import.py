"""AI Import Service — F17 AI智能导入核心逻辑.

Capabilities:
- 逐文件读取内容，AI 分析并输出映射表（文件→推荐模块→推荐维度→置信度）
- 拆分能力: 单个大文件按表格行/标题层级拆分为多个功能项
- 归类能力: AI 根据文件内容推荐归属模块和维度
- 提取能力: 从文件中提取结构化信息填入对应维度
- 关联识别: 识别跨模块引用关系
- 去重检测: 发现已有同名功能项时提示合并或跳过
- 产品线差异标注: 识别"私有云特有""智算中心不支持"等描述，自动打标签
"""

import csv
import io
import json
import logging
import re
import uuid
from typing import Any

from sqlalchemy.orm import Session

from api.models.tables import (
    ActivityLog,
    DimensionRecord,
    DimensionType,
    Node,
    NodeRelation,
    Project,
    ProjectDimensionConfig,
)
from api.services.ai_provider import get_provider

logger = logging.getLogger(__name__)


# ─── Product line tag patterns ────────────────────────────────────────────────

PRODUCT_LINE_PATTERNS = [
    (r"私有云特有|仅私有云|私有云专属|only.*private.*cloud", "私有云特有"),
    (r"智算中心不支持|智算中心暂不支持|not.*supported.*in.*computing", "智算中心不支持"),
    (r"公有云特有|仅公有云|公有云专属", "公有云特有"),
    (r"混合云|hybrid.*cloud", "混合云"),
    (r"企业版|enterprise.*only|仅企业版", "企业版特有"),
]


def _detect_product_line_tags(text: str) -> list[str]:
    """Detect product line difference tags from text."""
    tags = []
    text_lower = text.lower()
    for pattern, tag in PRODUCT_LINE_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            tags.append(tag)
    return tags


# ─── File splitting ───────────────────────────────────────────────────────────

def _split_markdown_by_heading(content: str, file_path: str) -> list[dict]:
    """Split a markdown file by headings (## or ###) into sections."""
    sections = []
    current_title = None
    current_lines: list[str] = []

    for line in content.split("\n"):
        heading_match = re.match(r"^(#{1,3})\s+(.+)$", line)
        if heading_match:
            if current_title and current_lines:
                sections.append({
                    "title": current_title,
                    "content": "\n".join(current_lines).strip(),
                    "source_path": file_path,
                })
            current_title = heading_match.group(2).strip()
            current_lines = []
        else:
            current_lines.append(line)

    # Flush last section
    if current_title and current_lines:
        sections.append({
            "title": current_title,
            "content": "\n".join(current_lines).strip(),
            "source_path": file_path,
        })

    # If no headings found, treat entire file as one item
    if not sections:
        filename = file_path.rsplit("/", 1)[-1].replace(".md", "").replace(".txt", "")
        sections.append({
            "title": filename,
            "content": content.strip(),
            "source_path": file_path,
        })

    return sections


def _split_csv_by_rows(content: str, file_path: str) -> list[dict]:
    """Split CSV file: each data row becomes one item.

    Assumes first row is header; name column detected heuristically.
    """
    reader = csv.DictReader(io.StringIO(content))
    rows = list(reader)
    if not rows:
        return []

    fieldnames = reader.fieldnames or []

    # Heuristic: find "name" column
    name_col = None
    for col in fieldnames:
        if re.search(r"名称|name|title|功能|feature|模块", col, re.IGNORECASE):
            name_col = col
            break

    items = []
    for i, row in enumerate(rows):
        title = row.get(name_col, "") if name_col else ""
        if not title:
            # Fall back to first non-empty column value
            title = next((v for v in row.values() if v), f"第{i+1}行")

        content_parts = [f"{k}: {v}" for k, v in row.items() if v]
        items.append({
            "title": title.strip(),
            "content": "\n".join(content_parts),
            "source_path": file_path,
        })

    return items


def split_file_into_items(file: dict) -> list[dict]:
    """Split a parsed file into potential feature items.

    Returns list of dicts with keys: title, content, source_path
    """
    fmt = file.get("format", "text")
    content = file.get("content", "")
    path = file.get("path", file.get("name", ""))

    if fmt == "markdown":
        return _split_markdown_by_heading(content, path)
    elif fmt == "csv":
        return _split_csv_by_rows(content, path)
    else:
        # Plain text: treat as one item
        name = path.rsplit("/", 1)[-1].replace(".txt", "").replace(".text", "")
        return [{"title": name, "content": content.strip(), "source_path": path}]


# ─── Module / Dimension suggestions ──────────────────────────────────────────

def _build_mapping_prompt(
    items: list[dict],
    available_modules: list[dict],
    available_dimensions: list[dict],
) -> str:
    """Build the AI prompt for mapping items to modules+dimensions."""
    modules_str = "\n".join(
        f'  - id={m["id"]}, name={m["name"]}, path={m.get("path", "")}' for m in available_modules
    )
    dims_str = "\n".join(
        f'  - id={d["id"]}, key={d["key"]}, name={d["name"]}' for d in available_dimensions
    )
    items_str = "\n".join(
        f'  [{i}] title={item["title"]}, source={item["source_path"]}, content_preview={item["content"][:200]}'
        for i, item in enumerate(items)
    )

    return f"""你是一个产品知识管理专家。请分析以下功能项列表，为每个功能项推荐最合适的模块和维度。

## 可用模块（folder类型节点）
{modules_str}

## 可用维度类型
{dims_str}

## 待映射功能项
{items_str}

## 输出要求
输出JSON数组，每个元素对应一个功能项（按上方索引[i]顺序），格式如下：
{{
  "index": <数字，对应上方[i]>,
  "recommended_module_id": "<模块ID字符串，必须是可用模块中的id>",
  "recommended_module_name": "<模块名称>",
  "recommended_dimension_id": <维度ID数字>,
  "recommended_dimension_key": "<维度key>",
  "recommended_dimension_name": "<维度名称>",
  "confidence": <0-100的整数，表示推荐置信度>,
  "reason": "<简短推荐理由，不超过50字>",
  "extracted_content": "<从功能项内容中提取的结构化信息，填入维度的内容，不超过500字>"
}}

只输出JSON数组，不输出其他内容。"""


def _parse_mapping_response(raw: str, items: list[dict]) -> list[dict]:
    """Parse AI mapping response JSON. Fallback to heuristic on failure."""
    try:
        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start >= 0 and end > start:
            data = json.loads(raw[start:end])
            results = []
            for entry in data:
                idx = entry.get("index", 0)
                if 0 <= idx < len(items):
                    item = items[idx]
                    results.append({
                        "index": idx,
                        "title": item["title"],
                        "source_path": item["source_path"],
                        "content": item["content"],
                        "extracted_content": entry.get("extracted_content", item["content"][:500]),
                        "recommended_module_id": entry.get("recommended_module_id", ""),
                        "recommended_module_name": entry.get("recommended_module_name", ""),
                        "recommended_dimension_id": entry.get("recommended_dimension_id"),
                        "recommended_dimension_key": entry.get("recommended_dimension_key", ""),
                        "recommended_dimension_name": entry.get("recommended_dimension_name", ""),
                        "confidence": int(entry.get("confidence", 60)),
                        "reason": entry.get("reason", ""),
                        "product_line_tags": _detect_product_line_tags(item["content"]),
                    })
            return results
    except (json.JSONDecodeError, TypeError, ValueError) as e:
        logger.warning("Failed to parse AI mapping response: %s", e)

    # Fallback: assign all items to first available module with 60% confidence
    return [
        {
            "index": i,
            "title": item["title"],
            "source_path": item["source_path"],
            "content": item["content"],
            "extracted_content": item["content"][:500],
            "recommended_module_id": "",
            "recommended_module_name": "未分类",
            "recommended_dimension_id": None,
            "recommended_dimension_key": "",
            "recommended_dimension_name": "",
            "confidence": 50,
            "reason": "AI解析失败，请手动调整",
            "product_line_tags": _detect_product_line_tags(item["content"]),
        }
        for i, item in enumerate(items)
    ]


# ─── Duplicate detection ──────────────────────────────────────────────────────

def _detect_duplicates(
    db: Session,
    project_id: str,
    mapping_rows: list[dict],
) -> list[dict]:
    """Check each mapping row against existing nodes for name duplicates."""
    # Fetch all file-type nodes for the project
    existing_nodes = db.query(Node).filter(
        Node.project_id == project_id,
        Node.type == "file",
    ).all()
    existing_names = {n.name.lower(): str(n.id) for n in existing_nodes}

    for row in mapping_rows:
        title_lower = row["title"].lower()
        if title_lower in existing_names:
            row["conflict"] = True
            row["conflict_message"] = f"已存在同名功能项，可合并或跳过"
            row["existing_node_id"] = existing_names[title_lower]
        else:
            row["conflict"] = False
            row["conflict_message"] = None
            row["existing_node_id"] = None

    return mapping_rows


# ─── Cross-module relation detection ─────────────────────────────────────────

def _detect_cross_module_relations(mapping_rows: list[dict]) -> list[dict]:
    """Identify potential cross-module references from content.

    Returns list of relation hints: {from_index, to_index, reason}
    """
    relations = []
    titles = [row["title"].lower() for row in mapping_rows]

    for i, row in enumerate(mapping_rows):
        content_lower = row["content"].lower()
        for j, title in enumerate(titles):
            if i == j:
                continue
            # Skip very short titles to avoid false positives
            if len(title) < 4:
                continue
            if title in content_lower:
                relations.append({
                    "from_index": i,
                    "to_index": j,
                    "from_title": row["title"],
                    "to_title": mapping_rows[j]["title"],
                    "reason": f"「{row['title']}」内容中引用了「{mapping_rows[j]['title']}」",
                })

    return relations


# ─── Main analysis entry point ────────────────────────────────────────────────

async def analyze_zip_files(
    db: Session,
    project_id: str,
    files: list[dict],
    user_id: str,
) -> dict:
    """Analyze uploaded files, produce AI-suggested mapping table.

    Args:
        db: SQLAlchemy session
        project_id: Target project UUID string
        files: List of parsed file dicts from import_handler.extract_and_parse_zip
        user_id: Requesting user UUID string

    Returns:
        {
            "session_id": str,        # unique ID for this analysis session
            "mapping_rows": [...],    # list of MappingRow-like dicts
            "relations": [...],       # cross-module relation hints
            "available_modules": [...],
            "available_dimensions": [...],
            "stats": {...}
        }
    """
    session_id = str(uuid.uuid4())

    # ── Fetch project ──────────────────────────────────────────────────────────
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.deleted_at.is_(None),
    ).first()
    if not project:
        raise ValueError(f"Project {project_id} not found")

    provider = get_provider(project.ai_provider or "mock", project.ai_api_key_enc)

    # ── Fetch available modules (folder nodes) ──────────────────────────────
    module_nodes = db.query(Node).filter(
        Node.project_id == project_id,
        Node.type == "folder",
    ).order_by(Node.depth, Node.sort_order).all()

    available_modules = [
        {"id": str(n.id), "name": n.name, "path": n.path, "depth": n.depth}
        for n in module_nodes
    ]

    # ── Fetch enabled dimension types ──────────────────────────────────────
    dim_configs = (
        db.query(ProjectDimensionConfig, DimensionType)
        .join(DimensionType, ProjectDimensionConfig.dimension_type_id == DimensionType.id)
        .filter(
            ProjectDimensionConfig.project_id == project_id,
            ProjectDimensionConfig.enabled == True,
        )
        .order_by(ProjectDimensionConfig.sort_order)
        .all()
    )
    available_dimensions = [
        {"id": dt.id, "key": dt.key, "name": dt.name}
        for _, dt in dim_configs
    ]

    # If no dimensions configured, fall back to all dimension types
    if not available_dimensions:
        all_dims = db.query(DimensionType).all()
        available_dimensions = [
            {"id": dt.id, "key": dt.key, "name": dt.name}
            for dt in all_dims
        ]

    # ── Split files into candidate items ──────────────────────────────────
    all_items: list[dict] = []
    for f in files:
        items = split_file_into_items(f)
        all_items.extend(items)

    logger.info(
        "AI import analysis: project=%s, files=%d, items=%d",
        project_id, len(files), len(all_items),
    )

    # ── Log progress: analysis started ────────────────────────────────────
    _write_activity_log(
        db, project_id, user_id,
        action_type="ai_import",
        target_type="project",
        target_id=project_id,
        summary=f"AI智能导入分析开始：{len(files)}个文件拆分为{len(all_items)}个功能项候选",
        metadata={
            "session_id": session_id,
            "file_count": len(files),
            "item_count": len(all_items),
            "phase": "analyzing",
        },
    )

    # ── Call AI for mapping ────────────────────────────────────────────────
    mapping_rows: list[dict] = []
    if all_items and (available_modules or available_dimensions):
        # Batch to avoid oversized prompts: max 30 items per call
        batch_size = 30
        for batch_start in range(0, len(all_items), batch_size):
            batch = all_items[batch_start : batch_start + batch_size]
            prompt = _build_mapping_prompt(batch, available_modules, available_dimensions)
            try:
                raw = await provider.generate(prompt)
                batch_rows = _parse_mapping_response(raw, batch)
                # Re-index to global indices
                for row in batch_rows:
                    row["index"] = batch_start + row["index"]
                mapping_rows.extend(batch_rows)
            except Exception as e:
                logger.error("AI mapping batch %d failed: %s", batch_start, e)
                # Fallback for this batch
                for i, item in enumerate(batch):
                    mapping_rows.append({
                        "index": batch_start + i,
                        "title": item["title"],
                        "source_path": item["source_path"],
                        "content": item["content"],
                        "extracted_content": item["content"][:500],
                        "recommended_module_id": available_modules[0]["id"] if available_modules else "",
                        "recommended_module_name": available_modules[0]["name"] if available_modules else "未分类",
                        "recommended_dimension_id": available_dimensions[0]["id"] if available_dimensions else None,
                        "recommended_dimension_key": available_dimensions[0]["key"] if available_dimensions else "",
                        "recommended_dimension_name": available_dimensions[0]["name"] if available_dimensions else "",
                        "confidence": 50,
                        "reason": f"AI分析失败: {str(e)[:50]}",
                        "product_line_tags": _detect_product_line_tags(item["content"]),
                    })
    else:
        # No modules or dimensions yet — just produce raw split items
        for i, item in enumerate(all_items):
            mapping_rows.append({
                "index": i,
                "title": item["title"],
                "source_path": item["source_path"],
                "content": item["content"],
                "extracted_content": item["content"][:500],
                "recommended_module_id": "",
                "recommended_module_name": "",
                "recommended_dimension_id": None,
                "recommended_dimension_key": "",
                "recommended_dimension_name": "",
                "confidence": 0,
                "reason": "项目尚未配置模块或维度",
                "product_line_tags": _detect_product_line_tags(item["content"]),
            })

    # ── Add stable row IDs ─────────────────────────────────────────────────
    for row in mapping_rows:
        row["id"] = str(uuid.uuid4())
        row["selected"] = True
        row["action"] = "import"  # import | skip | merge

    # ── Duplicate detection ────────────────────────────────────────────────
    mapping_rows = _detect_duplicates(db, project_id, mapping_rows)

    # ── Cross-module relation detection ───────────────────────────────────
    relations = _detect_cross_module_relations(mapping_rows)

    # ── Stats ──────────────────────────────────────────────────────────────
    high_conf = sum(1 for r in mapping_rows if r["confidence"] >= 85)
    med_conf = sum(1 for r in mapping_rows if 60 <= r["confidence"] < 85)
    low_conf = sum(1 for r in mapping_rows if r["confidence"] < 60)
    conflict_count = sum(1 for r in mapping_rows if r["conflict"])

    stats = {
        "total_files": len(files),
        "total_items": len(mapping_rows),
        "high_confidence": high_conf,
        "medium_confidence": med_conf,
        "low_confidence": low_conf,
        "conflicts": conflict_count,
        "relation_hints": len(relations),
    }

    # ── Log completion ─────────────────────────────────────────────────────
    _write_activity_log(
        db, project_id, user_id,
        action_type="ai_import",
        target_type="project",
        target_id=project_id,
        summary=f"AI智能导入分析完成：{len(mapping_rows)}条映射结果，{conflict_count}条冲突，{len(relations)}条关联关系",
        metadata={
            "session_id": session_id,
            "phase": "analyzed",
            **stats,
        },
    )

    return {
        "session_id": session_id,
        "mapping_rows": mapping_rows,
        "relations": relations,
        "available_modules": available_modules,
        "available_dimensions": available_dimensions,
        "stats": stats,
    }


# ─── Confirm Import ───────────────────────────────────────────────────────────

def confirm_ai_import(
    db: Session,
    project_id: str,
    session_id: str,
    mapping_rows: list[dict],
    user_id: str,
) -> dict:
    """Execute confirmed AI import: create nodes, dimension records, and relations.

    Only processes rows where action != 'skip'.
    For action == 'merge': updates existing node's dimension records.
    For action == 'import': creates new nodes.

    Returns:
        {
            "session_id": str,
            "imported": int,
            "merged": int,
            "skipped": int,
            "errors": list[str],
            "created_node_ids": list[str],
        }
    """
    imported = 0
    merged = 0
    skipped = 0
    errors: list[str] = []
    created_node_ids: list[str] = []
    relation_pairs: list[tuple[str, str]] = []  # (source_node_id, target_node_id)

    # Build a title→node_id index of newly created nodes for relation linking
    title_to_node_id: dict[str, str] = {}

    # Log start
    _write_activity_log(
        db, project_id, user_id,
        action_type="ai_import",
        target_type="project",
        target_id=project_id,
        summary=f"AI智能导入开始执行：{len(mapping_rows)}条映射",
        metadata={
            "session_id": session_id,
            "phase": "importing",
            "total_rows": len(mapping_rows),
        },
    )

    for row in mapping_rows:
        action = row.get("action", "import")
        if not row.get("selected", True):
            action = "skip"

        if action == "skip":
            skipped += 1
            continue

        title = row.get("title", "").strip()
        if not title:
            errors.append("跳过空标题的功能项")
            continue

        module_id = row.get("recommended_module_id", "")
        dim_id = row.get("recommended_dimension_id")
        extracted_content = row.get("extracted_content") or row.get("content", "")
        product_line_tags: list[str] = row.get("product_line_tags", [])

        if action == "merge":
            # Update existing node's dimension record
            existing_node_id = row.get("existing_node_id")
            if not existing_node_id:
                errors.append(f"「{title}」: 合并失败，找不到已有节点")
                continue
            try:
                _upsert_dimension_record(
                    db,
                    node_id=existing_node_id,
                    dim_id=dim_id,
                    content_text=extracted_content,
                    product_line_tags=product_line_tags,
                    user_id=user_id,
                )
                title_to_node_id[title.lower()] = existing_node_id
                merged += 1
            except Exception as e:
                errors.append(f"「{title}」合并失败: {e}")
        else:
            # Create new node
            try:
                new_node_id = _create_feature_node(
                    db,
                    project_id=project_id,
                    parent_id=module_id or None,
                    name=title,
                    user_id=user_id,
                )
                created_node_ids.append(new_node_id)
                title_to_node_id[title.lower()] = new_node_id

                if dim_id and extracted_content:
                    _upsert_dimension_record(
                        db,
                        node_id=new_node_id,
                        dim_id=dim_id,
                        content_text=extracted_content,
                        product_line_tags=product_line_tags,
                        user_id=user_id,
                    )

                imported += 1
            except Exception as e:
                errors.append(f"「{title}」导入失败: {e}")

    # ── Create cross-module relations ──────────────────────────────────────
    relations_created = 0
    # Re-detect relations across final node mapping
    for row in mapping_rows:
        if row.get("action") == "skip" or not row.get("selected", True):
            continue
        title = row.get("title", "").strip().lower()
        source_id = title_to_node_id.get(title)
        if not source_id:
            continue
        content_lower = row.get("content", "").lower()
        for other_title, target_id in title_to_node_id.items():
            if other_title == title or target_id == source_id:
                continue
            if len(other_title) < 4:
                continue
            if other_title in content_lower:
                relation_pairs.append((source_id, target_id))

    for source_id, target_id in relation_pairs[:50]:  # cap at 50 relations
        try:
            existing = db.query(NodeRelation).filter(
                NodeRelation.source_node_id == source_id,
                NodeRelation.target_node_id == target_id,
            ).first()
            if not existing:
                rel = NodeRelation(
                    source_node_id=source_id,
                    target_node_id=target_id,
                    relation_type="related_to",
                    description="AI导入时自动识别的关联关系",
                )
                db.add(rel)
                relations_created += 1
        except Exception as e:
            logger.warning("Failed to create relation %s→%s: %s", source_id, target_id, e)

    db.commit()

    # ── Write F15 流转摘要 ──────────────────────────────────────────────────
    _write_activity_log(
        db, project_id, user_id,
        action_type="ai_import",
        target_type="project",
        target_id=project_id,
        summary=(
            f"AI智能导入完成：成功导入{imported}个，合并{merged}个，跳过{skipped}个"
            + (f"，{len(errors)}个失败" if errors else "")
        ),
        metadata={
            "session_id": session_id,
            "phase": "completed",
            "imported": imported,
            "merged": merged,
            "skipped": skipped,
            "errors": errors[:20],  # cap stored errors
            "relations_created": relations_created,
            "created_node_ids": created_node_ids[:100],  # cap for storage
        },
    )

    return {
        "session_id": session_id,
        "imported": imported,
        "merged": merged,
        "skipped": skipped,
        "errors": errors,
        "created_node_ids": created_node_ids,
        "relations_created": relations_created,
    }


# ─── Undo Import ──────────────────────────────────────────────────────────────

def undo_ai_import(
    db: Session,
    project_id: str,
    session_id: str,
    created_node_ids: list[str],
    user_id: str,
) -> dict:
    """Undo a previous AI import session by bulk-deleting created nodes.

    Cascade delete will clean up dimension_records and node_relations.
    """
    deleted = 0
    errors: list[str] = []

    for node_id in created_node_ids:
        try:
            node = db.query(Node).filter(
                Node.id == node_id,
                Node.project_id == project_id,
            ).first()
            if node:
                db.delete(node)
                deleted += 1
        except Exception as e:
            errors.append(f"删除节点 {node_id} 失败: {e}")

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise ValueError(f"撤销导入事务失败: {e}") from e

    _write_activity_log(
        db, project_id, user_id,
        action_type="ai_import_undo",
        target_type="project",
        target_id=project_id,
        summary=f"AI导入撤销：删除{deleted}个功能项",
        metadata={
            "session_id": session_id,
            "deleted": deleted,
            "errors": errors[:10],
        },
    )

    return {"deleted": deleted, "errors": errors}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _create_feature_node(
    db: Session,
    project_id: str,
    parent_id: str | None,
    name: str,
    user_id: str,
) -> str:
    """Create a file-type node under the given parent. Returns new node ID."""
    new_id = uuid.uuid4()

    depth = 0
    path = ""

    if parent_id:
        parent = db.query(Node).filter(Node.id == parent_id).first()
        if parent:
            depth = parent.depth + 1
            path = f"{parent.path}/{str(parent.id)}" if parent.path else str(parent.id)

    # Determine sort order
    sibling_count = db.query(Node).filter(
        Node.project_id == project_id,
        Node.parent_id == parent_id,
    ).count()

    node = Node(
        id=new_id,
        project_id=project_id,
        parent_id=parent_id,
        name=name,
        type="file",
        depth=depth,
        sort_order=sibling_count,
        path=path,
    )
    db.add(node)
    db.flush()
    return str(new_id)


def _upsert_dimension_record(
    db: Session,
    node_id: str,
    dim_id: int | None,
    content_text: str,
    product_line_tags: list[str],
    user_id: str,
) -> None:
    """Create or update a dimension record on a node."""
    if not dim_id:
        return

    existing = db.query(DimensionRecord).filter(
        DimensionRecord.node_id == node_id,
        DimensionRecord.dimension_type_id == dim_id,
    ).first()

    content_payload: dict[str, Any] = {"text": content_text}
    if product_line_tags:
        content_payload["product_line_tags"] = product_line_tags

    if existing:
        existing.content = content_payload
        existing.version = (existing.version or 1) + 1
    else:
        record = DimensionRecord(
            id=uuid.uuid4(),
            node_id=node_id,
            dimension_type_id=dim_id,
            content=content_payload,
            version=1,
        )
        db.add(record)


def _write_activity_log(
    db: Session,
    project_id: str,
    user_id: str,
    action_type: str,
    target_type: str,
    target_id: str,
    summary: str,
    metadata: dict | None = None,
) -> None:
    """Write an activity log entry (fire-and-forget; errors are swallowed)."""
    try:
        log = ActivityLog(
            id=uuid.uuid4(),
            project_id=project_id,
            user_id=user_id,
            action_type=action_type,
            target_type=target_type,
            target_id=target_id,
            summary=summary,
            metadata_=metadata,
        )
        db.add(log)
        db.flush()
    except Exception as e:
        logger.warning("Failed to write activity log: %s", e)
