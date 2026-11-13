"""后台杂谈接口：含草稿的列表、详情、新建、更新与删除。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import require_admin
from app.models.schemas import (
    AdminTalkDetail,
    AdminTalkSummary,
    PostStatus,
    TalkWrite,
)
from app.repositories import AdminContentRepository, SlugConflictError, get_repository

router = APIRouter(
    prefix="/admin/talks",
    tags=["admin-talks"],
    dependencies=[Depends(require_admin)],
)


@router.get("", response_model=list[AdminTalkSummary], summary="后台杂谈列表")
def list_talks(
    status: PostStatus | None = Query(default=None, description="按发布状态过滤"),
    q: str | None = Query(default=None, description="按标题、摘要、slug、心情搜索"),
    limit: int | None = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    repo: AdminContentRepository = Depends(get_repository),
) -> list[AdminTalkSummary]:
    return repo.list_admin_talks(status=status, query=q, limit=limit, offset=offset)


@router.get("/{talk_id}", response_model=AdminTalkDetail, summary="后台杂谈详情")
def read_talk(
    talk_id: str,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminTalkDetail:
    talk = repo.get_admin_talk(talk_id)
    if talk is None:
        raise HTTPException(status_code=404, detail=f"杂谈不存在: {talk_id}")
    return talk


@router.post(
    "",
    response_model=AdminTalkDetail,
    status_code=status.HTTP_201_CREATED,
    summary="新建杂谈",
)
def create_talk(
    payload: TalkWrite,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminTalkDetail:
    try:
        return repo.create_talk(payload)
    except SlugConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.put("/{talk_id}", response_model=AdminTalkDetail, summary="更新杂谈")
def update_talk(
    talk_id: str,
    payload: TalkWrite,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminTalkDetail:
    try:
        talk = repo.update_talk(talk_id, payload)
    except SlugConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    if talk is None:
        raise HTTPException(status_code=404, detail=f"杂谈不存在: {talk_id}")
    return talk


@router.delete("/{talk_id}", summary="删除杂谈")
def delete_talk(
    talk_id: str,
    repo: AdminContentRepository = Depends(get_repository),
) -> dict[str, bool]:
    if not repo.delete_talk(talk_id):
        raise HTTPException(status_code=404, detail=f"杂谈不存在: {talk_id}")
    return {"ok": True}
