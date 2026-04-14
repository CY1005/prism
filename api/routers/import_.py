"""Import router: F11 zip upload + F17 AI智能导入 + F19 Markdown re-import."""

import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Any

from api.db import get_db
from api.models.tables import User
from api.routers.auth import require_user
from api.services.import_handler import extract_and_parse_zip
from api.services.ai_import import analyze_zip_files, confirm_ai_import, undo_ai_import
from api.services.exporter import parse_markdown_content

logger = logging.getLogger(__name__)
router = APIRouter()

# Max upload size: 50MB
MAX_UPLOAD_SIZE = 50 * 1024 * 1024


# ─── F11: zip upload ─────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_zip(file: UploadFile = File(...)):
    """Accept a zip file upload, extract and parse supported files.

    Returns a file tree with parsed content for preview.
    """
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="仅支持 .zip 文件")

    contents = await file.read()

    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="文件大小不能超过 50MB")

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="文件为空")

    try:
        result = extract_and_parse_zip(contents)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Failed to process zip upload")
        raise HTTPException(status_code=500, detail="文件处理失败，请重试")

    return result


# ─── F17: AI analyze ──────────────────────────────────────────────────────────

class AIAnalyzeRequest(BaseModel):
    project_id: str = Field(..., description="目标项目UUID")
    user_id: str = Field(..., description="发起分析的用户UUID")
    files: list[dict[str, Any]] = Field(
        ...,
        description="已解析的文件列表，格式与 /upload 返回的 files 字段一致",
    )


@router.post("/ai-analyze")
async def ai_analyze(
    req: AIAnalyzeRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """AI分析上传的文件，返回映射表.

    前端先调用 /upload 获取文件列表，再把 files 传入此接口。
    返回:
    - session_id: 本次分析会话ID（确认导入时需要传回）
    - mapping_rows: 每个功能项的推荐模块/维度/置信度/冲突信息
    - relations: 跨模块关联关系提示
    - available_modules: 项目已有模块列表
    - available_dimensions: 项目已启用的维度类型
    - stats: 统计摘要
    """
    if not req.files:
        raise HTTPException(status_code=400, detail="文件列表不能为空")

    try:
        result = await analyze_zip_files(
            db=db,
            project_id=req.project_id,
            files=req.files,
            user_id=req.user_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        logger.exception("AI analyze failed for project %s", req.project_id)
        raise HTTPException(status_code=500, detail="AI分析失败，请重试")

    return result


# ─── F17: adjust mapping ──────────────────────────────────────────────────────

class MappingAdjustItem(BaseModel):
    id: str = Field(..., description="mapping row ID")
    recommended_module_id: str | None = None
    recommended_module_name: str | None = None
    recommended_dimension_id: int | None = None
    recommended_dimension_key: str | None = None
    recommended_dimension_name: str | None = None
    selected: bool | None = None
    action: str | None = None  # "import" | "skip" | "merge"


class AIMappingUpdateRequest(BaseModel):
    session_id: str = Field(..., description="AI分析会话ID")
    project_id: str
    adjustments: list[MappingAdjustItem] = Field(
        ..., description="要批量调整的 mapping row，只发送需要修改的字段"
    )


@router.put("/ai-mapping")
def update_ai_mapping(req: AIMappingUpdateRequest):
    """用户调整映射表（批量操作）.

    此接口无需持久化——映射表状态由前端维护，
    这里只做参数校验并回显调整后的结果，
    确认时前端把完整 mapping_rows 传给 /ai-confirm。
    """
    if not req.adjustments:
        raise HTTPException(status_code=400, detail="adjustments 不能为空")

    valid_actions = {"import", "skip", "merge"}
    for adj in req.adjustments:
        if adj.action and adj.action not in valid_actions:
            raise HTTPException(
                status_code=400,
                detail=f"无效的 action: {adj.action}，允许值: import/skip/merge",
            )

    return {
        "session_id": req.session_id,
        "adjusted_count": len(req.adjustments),
        "message": "映射调整已接收",
    }


# ─── F17: confirm import ──────────────────────────────────────────────────────

class AIConfirmRequest(BaseModel):
    session_id: str = Field(..., description="AI分析会话ID")
    project_id: str
    user_id: str
    mapping_rows: list[dict[str, Any]] = Field(
        ..., description="完整的映射表（含用户调整后的状态）"
    )


@router.post("/ai-confirm")
def ai_confirm(
    req: AIConfirmRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """确认导入：批量创建功能项+维度记录+关联关系.

    - action='import': 创建新功能项
    - action='merge': 合并到已有同名功能项
    - action='skip' 或 selected=false: 跳过
    - 完成后写入F15流转摘要
    """
    if not req.mapping_rows:
        raise HTTPException(status_code=400, detail="mapping_rows 不能为空")

    try:
        result = confirm_ai_import(
            db=db,
            project_id=req.project_id,
            session_id=req.session_id,
            mapping_rows=req.mapping_rows,
            user_id=req.user_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("AI confirm import failed for project %s", req.project_id)
        raise HTTPException(status_code=500, detail="导入失败，请重试")

    return result


# ─── F17: undo import ─────────────────────────────────────────────────────────

class UndoRequest(BaseModel):
    session_id: str = Field(..., description="要撤销的AI导入会话ID")
    project_id: str
    user_id: str
    created_node_ids: list[str] = Field(
        ..., description="本次导入创建的节点ID列表（来自 /ai-confirm 的响应）"
    )


@router.post("/undo")
def undo_import(
    req: UndoRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """一键撤销本次AI导入（批量删除本次创建的记录）.

    级联删除会自动清理 dimension_records 和 node_relations。
    """
    if not req.created_node_ids:
        raise HTTPException(status_code=400, detail="created_node_ids 不能为空")

    try:
        result = undo_ai_import(
            db=db,
            project_id=req.project_id,
            session_id=req.session_id,
            created_node_ids=req.created_node_ids,
            user_id=req.user_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Undo import failed for project %s", req.project_id)
        raise HTTPException(status_code=500, detail="撤销失败，请重试")

    return result


# ─── F19: Markdown re-import ─────────────────────────────────────────────────

@router.post("/markdown")
async def import_markdown(file: UploadFile = File(...)):
    """Accept a single .md file upload, parse it using the export format.

    Format: h1 = feature name, h2 = dimension name, body = content.
    Returns parsed structure compatible with the /upload endpoint format.
    """
    if not file.filename or not file.filename.lower().endswith(".md"):
        raise HTTPException(status_code=400, detail="仅支持 .md 文件")

    contents = await file.read()

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="文件为空")

    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="文件大小不能超过 50MB")

    try:
        md_text = contents.decode("utf-8")
    except UnicodeDecodeError:
        try:
            md_text = contents.decode("gbk")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="无法解码文件，请使用 UTF-8 编码")

    try:
        features = parse_markdown_content(md_text)
    except Exception:
        logger.exception("Failed to parse markdown import")
        raise HTTPException(status_code=400, detail="Markdown 解析失败")

    if not features:
        raise HTTPException(status_code=400, detail="未解析到任何功能项")

    # Convert to the same format as /upload for frontend compatibility
    files = []
    for feature in features:
        files.append({
            "path": f"{feature['name']}.md",
            "name": f"{feature['name']}.md",
            "format": "markdown",
            "content": md_text,
            "size": len(contents),
            "parsed_feature": feature,
        })

    return {
        "files": files,
        "features": features,
        "tree": {
            "name": file.filename,
            "type": "file",
            "format": "markdown",
        },
    }
