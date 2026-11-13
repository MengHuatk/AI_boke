"""图片上传：格式校验、尺寸读取与落盘。

只接受常见位图格式。SVG 被排除：它本质是可执行文档，直接按静态资源
提供会带来 XSS 风险。文件按年/月分目录，文件名随机生成，避免覆盖。
"""

from __future__ import annotations

from datetime import datetime
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException
from PIL import Image, UnidentifiedImageError

from app.core.config import get_settings
from app.models.schemas import UploadResult

FORMAT_EXTENSIONS = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "WEBP": ".webp",
    "GIF": ".gif",
}


def save_image(data: bytes) -> UploadResult:
    """校验并保存一张图片，返回可公开访问的 URL 与原始尺寸。"""
    settings = get_settings()

    if len(data) > settings.upload_max_bytes:
        limit_mb = settings.upload_max_bytes / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"图片超过 {limit_mb:g} MB 限制",
        )

    try:
        # verify() 只检查文件结构；之后需要重新打开才能读取尺寸
        with Image.open(BytesIO(data)) as image:
            image.verify()
        with Image.open(BytesIO(data)) as image:
            image_format = image.format
            width, height = image.size
    except (
        UnidentifiedImageError,
        Image.DecompressionBombError,
        OSError,
    ) as exc:
        raise HTTPException(status_code=400, detail="无法识别的图片文件") from exc

    extension = FORMAT_EXTENSIONS.get(image_format or "")
    if extension is None:
        raise HTTPException(
            status_code=415,
            detail="仅支持 JPEG、PNG、WebP、GIF 图片",
        )

    now = datetime.now()
    relative_dir = Path(f"{now:%Y/%m}")
    target_dir = settings.upload_dir / relative_dir
    target_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid4().hex}{extension}"
    (target_dir / filename).write_bytes(data)

    path = f"{settings.upload_url_prefix}/{relative_dir.as_posix()}/{filename}"
    base = settings.public_base_url.rstrip("/")
    url = f"{base}{path}" if base else path
    return UploadResult(url=url, width=width, height=height)
