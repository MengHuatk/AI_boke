"""后台图片上传接口。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile

from app.core.config import get_settings
from app.core.security import require_admin
from app.models.schemas import UploadResult
from app.services.images import save_image

router = APIRouter(
    prefix="/admin",
    tags=["admin-uploads"],
    dependencies=[Depends(require_admin)],
)


@router.post("/uploads", response_model=UploadResult, summary="上传图片")
async def upload_image(file: UploadFile = File(...)) -> UploadResult:
    settings = get_settings()
    # 多读 1 字节即可判断是否超限，避免把超大文件整个读进内存
    data = await file.read(settings.upload_max_bytes + 1)
    return save_image(data)
