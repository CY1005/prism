"""Import router: upload zip and extract file tree."""

import logging

from fastapi import APIRouter, HTTPException, UploadFile, File

from api.services.import_handler import extract_and_parse_zip

logger = logging.getLogger(__name__)
router = APIRouter()

# Max upload size: 50MB
MAX_UPLOAD_SIZE = 50 * 1024 * 1024


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
    except Exception as e:
        logger.exception("Failed to process zip upload")
        raise HTTPException(status_code=500, detail="文件处理失败，请重试")

    return result
