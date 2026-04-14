"""Export service: generate Markdown and zip from nodes/projects."""

import io
import logging
import zipfile
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.orm import Session

from api.models.tables import Node, DimensionRecord, DimensionType

logger = logging.getLogger(__name__)


def export_node_to_markdown(
    node: Node,
    dimension_records: list[DimensionRecord],
    dimension_types: dict[int, DimensionType],
) -> str:
    """Generate Markdown for a single node with all dimensions.

    Format:
        # {node.name}

        ## {dimension_type.name}

        {dimension content formatted as text}

        ---
    """
    lines = [f"# {node.name}", ""]

    for rec in dimension_records:
        dim_type = dimension_types.get(rec.dimension_type_id)
        if not dim_type:
            continue

        lines.append(f"## {dim_type.name}")
        lines.append("")

        # content is a JSONB dict — flatten it to readable text
        content = rec.content or {}
        if isinstance(content, dict):
            for key, value in content.items():
                if isinstance(value, str):
                    lines.append(value)
                elif isinstance(value, list):
                    for item in value:
                        lines.append(f"- {item}")
                else:
                    lines.append(str(value))
        elif isinstance(content, str):
            lines.append(content)
        else:
            lines.append(str(content))

        lines.append("")
        lines.append("---")
        lines.append("")

    return "\n".join(lines)


def export_nodes(db: Session, project_id: UUID, node_ids: list[UUID]) -> str:
    """Export multiple nodes as a single Markdown file."""
    nodes = (
        db.query(Node)
        .filter(Node.project_id == project_id, Node.id.in_(node_ids))
        .order_by(Node.sort_order)
        .all()
    )

    if not nodes:
        raise ValueError("未找到指定节点")

    # Load all dimension records for these nodes
    records = (
        db.query(DimensionRecord)
        .filter(DimensionRecord.node_id.in_(node_ids))
        .order_by(DimensionRecord.dimension_type_id)
        .all()
    )

    # Load dimension types
    type_ids = {r.dimension_type_id for r in records}
    dim_types = {}
    if type_ids:
        types = db.query(DimensionType).filter(DimensionType.id.in_(type_ids)).all()
        dim_types = {t.id: t for t in types}

    # Group records by node
    records_by_node: dict[UUID, list[DimensionRecord]] = {}
    for r in records:
        records_by_node.setdefault(r.node_id, []).append(r)

    # Generate Markdown
    parts = []
    for node in nodes:
        node_records = records_by_node.get(node.id, [])
        md = export_node_to_markdown(node, node_records, dim_types)
        parts.append(md)

    return "\n\n".join(parts)


def _build_node_tree(nodes: list[Node]) -> dict:
    """Build a tree structure from flat node list. Returns {node: Node, children: [...]}."""
    by_id = {n.id: {"node": n, "children": []} for n in nodes}
    roots = []
    for n in nodes:
        if n.parent_id and n.parent_id in by_id:
            by_id[n.parent_id]["children"].append(by_id[n.id])
        else:
            roots.append(by_id[n.id])
    return roots


def export_project_as_zip(
    db: Session,
    project_id: UUID,
    product_line_id: UUID | None = None,
) -> bytes:
    """Build a zip file where directory structure mirrors the module tree hierarchy.

    Each leaf node becomes a .md file. Returns zip bytes.
    """
    query = db.query(Node).filter(Node.project_id == project_id)
    if product_line_id:
        # Filter to subtree under this product line node
        parent = db.query(Node).filter(Node.id == product_line_id).first()
        if not parent:
            raise ValueError("指定的产品线节点不存在")
        # Use path prefix to get subtree
        query = query.filter(Node.path.like(f"%{product_line_id}%"))

    all_nodes = query.order_by(Node.depth, Node.sort_order).all()
    if not all_nodes:
        raise ValueError("项目中没有节点")

    # Load all dimension records
    node_ids = [n.id for n in all_nodes]
    records = (
        db.query(DimensionRecord)
        .filter(DimensionRecord.node_id.in_(node_ids))
        .order_by(DimensionRecord.dimension_type_id)
        .all()
    )

    type_ids = {r.dimension_type_id for r in records}
    dim_types = {}
    if type_ids:
        types = db.query(DimensionType).filter(DimensionType.id.in_(type_ids)).all()
        dim_types = {t.id: t for t in types}

    records_by_node: dict[UUID, list[DimensionRecord]] = {}
    for r in records:
        records_by_node.setdefault(r.node_id, []).append(r)

    # Build path mapping: node_id -> directory path
    by_id = {n.id: n for n in all_nodes}

    def get_path_parts(node: Node) -> list[str]:
        """Walk up the tree to build path components."""
        parts = []
        current = node
        while current:
            parts.append(current.name)
            if current.parent_id and current.parent_id in by_id:
                current = by_id[current.parent_id]
            else:
                break
        parts.reverse()
        return parts

    # Build zip
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for node in all_nodes:
            node_records = records_by_node.get(node.id, [])
            # Only create .md files for leaf nodes (type=file) or nodes with dimension data
            is_leaf = node.type == "file"
            has_data = len(node_records) > 0

            if is_leaf or has_data:
                md = export_node_to_markdown(node, node_records, dim_types)
                path_parts = get_path_parts(node)
                # Last part is the file name
                if len(path_parts) > 1:
                    file_path = "/".join(path_parts[:-1]) + "/" + path_parts[-1] + ".md"
                else:
                    file_path = path_parts[0] + ".md"
                zf.writestr(file_path, md)

    return buf.getvalue()


def parse_markdown_content(md_content: str) -> list[dict]:
    """Parse Markdown in export format back to structured data.

    Expected format:
        # Feature Name

        ## Dimension Name

        content...

        ---

    Returns list of parsed features, each with name and dimensions.
    """
    features = []
    current_feature = None
    current_dimension = None
    content_lines = []

    for line in md_content.split("\n"):
        stripped = line.strip()

        if stripped.startswith("# ") and not stripped.startswith("## "):
            # Save previous dimension
            if current_dimension and current_feature:
                current_feature["dimensions"].append({
                    "name": current_dimension,
                    "content": "\n".join(content_lines).strip(),
                })
                content_lines = []
                current_dimension = None

            # New feature
            if current_feature:
                features.append(current_feature)

            current_feature = {
                "name": stripped[2:].strip(),
                "dimensions": [],
            }

        elif stripped.startswith("## ") and current_feature:
            # Save previous dimension
            if current_dimension:
                current_feature["dimensions"].append({
                    "name": current_dimension,
                    "content": "\n".join(content_lines).strip(),
                })
                content_lines = []

            current_dimension = stripped[3:].strip()

        elif stripped == "---":
            # Section separator — save current dimension
            if current_dimension and current_feature:
                current_feature["dimensions"].append({
                    "name": current_dimension,
                    "content": "\n".join(content_lines).strip(),
                })
                content_lines = []
                current_dimension = None

        else:
            if current_dimension:
                content_lines.append(line)

    # Save last dimension and feature
    if current_dimension and current_feature:
        current_feature["dimensions"].append({
            "name": current_dimension,
            "content": "\n".join(content_lines).strip(),
        })

    if current_feature:
        features.append(current_feature)

    # Fallback: if no h1 headings found, treat entire file as a single feature item
    if not features and md_content.strip():
        features.append({
            "name": "导入内容",
            "dimensions": [{"name": "description", "content": md_content.strip()}],
        })

    return features
