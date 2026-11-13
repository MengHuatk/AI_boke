"""音乐公开只读接口。"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models.schemas import MusicTrack
from app.repositories import ContentRepository, get_repository

router = APIRouter(prefix="/music", tags=["music"])


@router.get("", response_model=list[MusicTrack], summary="音乐曲目列表")
def list_music_tracks(
    repo: ContentRepository = Depends(get_repository),
) -> list[MusicTrack]:
    return repo.list_music_tracks()
