"""杂谈公开只读接口。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.schemas import TalkDetail, TalkSummary
from app.repositories import ContentRepository, get_repository

router = APIRouter(prefix="/talks", tags=["talks"])


@router.get("", response_model=list[TalkSummary], summary="杂谈列表")
def list_talks(
    tag: str | None = Query(default=None, description="按标签过滤"),
    limit: int | None = Query(default=None, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    repo: ContentRepository = Depends(get_repository),
) -> list[TalkSummary]:
    return repo.list_talks(tag=tag, limit=limit, offset=offset)


@router.get("/{slug}", response_model=TalkDetail, summary="杂谈详情")
def read_talk(
    slug: str,
    repo: ContentRepository = Depends(get_repository),
) -> TalkDetail:
    talk = repo.get_talk(slug)
    if talk is None:
        raise HTTPException(status_code=404, detail=f"杂谈不存在: {slug}")
    return talk
