"""照片集公开只读接口。"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models.schemas import PhotoAlbum
from app.repositories import ContentRepository, get_repository

router = APIRouter(prefix="/albums", tags=["albums"])


@router.get("", response_model=list[PhotoAlbum], summary="照片集列表")
def list_albums(
    repo: ContentRepository = Depends(get_repository),
) -> list[PhotoAlbum]:
    """一次返回全部已发布照片集及照片，前端照片墙直接使用。"""
    return repo.list_albums()
