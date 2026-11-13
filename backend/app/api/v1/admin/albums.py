"""后台照片集接口：含草稿的列表、详情、新建、更新与删除。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import require_admin
from app.models.schemas import (
    AdminPhotoAlbumDetail,
    AdminPhotoAlbumSummary,
    PhotoAlbumWrite,
    PostStatus,
)
from app.repositories import AdminContentRepository, SlugConflictError, get_repository

router = APIRouter(
    prefix="/admin/albums",
    tags=["admin-albums"],
    dependencies=[Depends(require_admin)],
)


@router.get("", response_model=list[AdminPhotoAlbumSummary], summary="后台照片集列表")
def list_albums(
    status_filter: PostStatus | None = Query(
        default=None,
        alias="status",
        description="按发布状态过滤",
    ),
    q: str | None = Query(default=None, description="按标题、简介、slug 搜索"),
    limit: int | None = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    repo: AdminContentRepository = Depends(get_repository),
) -> list[AdminPhotoAlbumSummary]:
    return repo.list_admin_albums(
        status=status_filter,
        query=q,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{album_id}",
    response_model=AdminPhotoAlbumDetail,
    summary="后台照片集详情",
)
def read_album(
    album_id: str,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminPhotoAlbumDetail:
    album = repo.get_admin_album(album_id)
    if album is None:
        raise HTTPException(status_code=404, detail=f"照片集不存在: {album_id}")
    return album


@router.post(
    "",
    response_model=AdminPhotoAlbumDetail,
    status_code=status.HTTP_201_CREATED,
    summary="新建照片集",
)
def create_album(
    payload: PhotoAlbumWrite,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminPhotoAlbumDetail:
    try:
        return repo.create_album(payload)
    except SlugConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.put(
    "/{album_id}",
    response_model=AdminPhotoAlbumDetail,
    summary="更新照片集",
)
def update_album(
    album_id: str,
    payload: PhotoAlbumWrite,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminPhotoAlbumDetail:
    try:
        album = repo.update_album(album_id, payload)
    except SlugConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    if album is None:
        raise HTTPException(status_code=404, detail=f"照片集不存在: {album_id}")
    return album


@router.delete("/{album_id}", summary="删除照片集")
def delete_album(
    album_id: str,
    repo: AdminContentRepository = Depends(get_repository),
) -> dict[str, bool]:
    if not repo.delete_album(album_id):
        raise HTTPException(status_code=404, detail=f"照片集不存在: {album_id}")
    return {"ok": True}
