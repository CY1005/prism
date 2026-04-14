"""Export router: F19 Markdown/zip export."""

import base64
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.db import get_db
from api.services.exporter import export_nodes, export_project_as_zip

logger = logging.getLogger(__name__)
router = APIRouter()


class ExportNodesRequest(BaseModel):
    project_id: UUID
    node_ids: list[UUID]


class ExportNodesResponse(BaseModel):
    filename: str
    content: str


class ExportProjectRequest(BaseModel):
    project_id: UUID
    product_line_id: UUID | None = None


@router.post("/nodes", response_model=ExportNodesResponse)
def export_nodes_endpoint(
    req: ExportNodesRequest,
    db: Session = Depends(get_db),
):
    """Export selected nodes as a single Markdown file."""
    if not req.node_ids:
        raise HTTPException(status_code=400, detail="node_ids 不能为空")

    try:
        md_content = export_nodes(db, req.project_id, req.node_ids)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        logger.exception("Export nodes failed for project %s", req.project_id)
        raise HTTPException(status_code=500, detail="导出失败，请重试")

    return ExportNodesResponse(
        filename="export.md",
        content=md_content,
    )


@router.post("/project")
def export_project_endpoint(
    req: ExportProjectRequest,
    db: Session = Depends(get_db),
):
    """Export entire project (or product line subtree) as a zip file."""
    try:
        zip_bytes = export_project_as_zip(db, req.project_id, req.product_line_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        logger.exception("Export project failed for project %s", req.project_id)
        raise HTTPException(status_code=500, detail="导出失败，请重试")

    import io

    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=project_export.zip"},
    )
