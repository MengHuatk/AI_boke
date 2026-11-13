"""后台音乐接口：含草稿的列表、详情、新建、更新与删除。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import require_admin
from app.models.schemas import (
    AdminMusicTrackDetail,
    AdminMusicTrackSummary,
    MusicTrackWrite,
    PostStatus,
)
from app.repositories import AdminContentRepository, get_repository

router = APIRouter(
    prefix="/admin/music",
    tags=["admin-music"],
    dependencies=[Depends(require_admin)],
)


@router.get("", response_model=list[AdminMusicTrackSummary], summary="后台音乐列表")
def list_music_tracks(
    status_filter: PostStatus | None = Query(
        default=None,
        alias="status",
        description="按发布状态过滤",
    ),
    q: str | None = Query(default=None, description="按歌名或歌手搜索"),
    limit: int | None = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    repo: AdminContentRepository = Depends(get_repository),
) -> list[AdminMusicTrackSummary]:
    return repo.list_admin_music_tracks(
        status=status_filter,
        query=q,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{track_id}",
    response_model=AdminMusicTrackDetail,
    summary="后台音乐详情",
)
def read_music_track(
    track_id: str,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminMusicTrackDetail:
    track = repo.get_admin_music_track(track_id)
    if track is None:
        raise HTTPException(status_code=404, detail=f"曲目不存在: {track_id}")
    return track


@router.post(
    "",
    response_model=AdminMusicTrackDetail,
    status_code=status.HTTP_201_CREATED,
    summary="新建曲目",
)
def create_music_track(
    payload: MusicTrackWrite,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminMusicTrackDetail:
    return repo.create_music_track(payload)


@router.put(
    "/{track_id}",
    response_model=AdminMusicTrackDetail,
    summary="更新曲目",
)
def update_music_track(
    track_id: str,
    payload: MusicTrackWrite,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminMusicTrackDetail:
    track = repo.update_music_track(track_id, payload)
    if track is None:
        raise HTTPException(status_code=404, detail=f"曲目不存在: {track_id}")
    return track


@router.delete("/{track_id}", summary="删除曲目")
def delete_music_track(
    track_id: str,
    repo: AdminContentRepository = Depends(get_repository),
) -> dict[str, bool]:
    if not repo.delete_music_track(track_id):
        raise HTTPException(status_code=404, detail=f"曲目不存在: {track_id}")
    return {"ok": True}
