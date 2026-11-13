"""音频上传：按文件头识别格式、限制大小并落盘。

不看客户端给的 Content-Type 和文件名，只依据字节签名决定扩展名，
避免把任意文件改名成 .mp3 后直接当静态资源提供。
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException

from app.core.config import get_settings
from app.models.schemas import AudioUploadResult


def detect_audio_extension(data: bytes) -> str | None:
    """返回识别出的扩展名；不是支持的音频容器时返回 None。"""
    if len(data) < 12:
        return None

    if data[4:8] == b"ftyp":
        return ".m4a"
    if data.startswith(b"ID3"):
        return ".mp3"
    if data.startswith(b"RIFF") and data[8:12] == b"WAVE":
        return ".wav"
    if data.startswith(b"OggS"):
        return ".ogg"
    if data.startswith(b"fLaC"):
        return ".flac"
    if data[:2] in {b"\xff\xf1", b"\xff\xf9"}:
        return ".aac"
    if data[0] == 0xFF and (data[1] & 0xE0) == 0xE0:
        return ".mp3"
    return None


def save_audio(data: bytes) -> AudioUploadResult:
    """校验并保存一个音频文件，返回可公开访问的相对路径。"""
    settings = get_settings()

    if len(data) > settings.audio_upload_max_bytes:
        limit_mb = settings.audio_upload_max_bytes / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"音频超过 {limit_mb:g} MB 限制",
        )

    extension = detect_audio_extension(data)
    if extension is None:
        raise HTTPException(
            status_code=415,
            detail="仅支持 MP3、M4A、AAC、WAV、OGG、FLAC 音频",
        )

    now = datetime.now()
    relative_dir = Path("audio") / f"{now:%Y/%m}"
    target_dir = settings.upload_dir / relative_dir
    target_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid4().hex}{extension}"
    (target_dir / filename).write_bytes(data)

    path = f"{settings.upload_url_prefix}/{relative_dir.as_posix()}/{filename}"
    return AudioUploadResult(url=path)
