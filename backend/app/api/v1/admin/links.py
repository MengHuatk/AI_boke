"""后台友链接口：含草稿的列表、详情、新建、更新与删除。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import require_admin
from app.models.schemas import (
    AdminFriendLinkDetail,
    AdminFriendLinkSummary,
    FriendLinkWrite,
    PostStatus,
)
from app.repositories import AdminContentRepository, get_repository

router = APIRouter(
    prefix="/admin/links",
    tags=["admin-links"],
    dependencies=[Depends(require_admin)],
)


@router.get("", response_model=list[AdminFriendLinkSummary], summary="后台友链列表")
def list_links(
    status_filter: PostStatus | None = Query(
        default=None,
        alias="status",
        description="按发布状态过滤",
    ),
    q: str | None = Query(default=None, description="按名称、简介、地址搜索"),
    limit: int | None = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    repo: AdminContentRepository = Depends(get_repository),
) -> list[AdminFriendLinkSummary]:
    return repo.list_admin_links(
        status=status_filter,
        query=q,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{link_id}",
    response_model=AdminFriendLinkDetail,
    summary="后台友链详情",
)
def read_link(
    link_id: str,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminFriendLinkDetail:
    link = repo.get_admin_link(link_id)
    if link is None:
        raise HTTPException(status_code=404, detail=f"友链不存在: {link_id}")
    return link


@router.post(
    "",
    response_model=AdminFriendLinkDetail,
    status_code=status.HTTP_201_CREATED,
    summary="新建友链",
)
def create_link(
    payload: FriendLinkWrite,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminFriendLinkDetail:
    return repo.create_link(payload)


@router.put(
    "/{link_id}",
    response_model=AdminFriendLinkDetail,
    summary="更新友链",
)
def update_link(
    link_id: str,
    payload: FriendLinkWrite,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminFriendLinkDetail:
    link = repo.update_link(link_id, payload)
    if link is None:
        raise HTTPException(status_code=404, detail=f"友链不存在: {link_id}")
    return link


@router.delete("/{link_id}", summary="删除友链")
def delete_link(
    link_id: str,
    repo: AdminContentRepository = Depends(get_repository),
) -> dict[str, bool]:
    if not repo.delete_link(link_id):
        raise HTTPException(status_code=404, detail=f"友链不存在: {link_id}")
    return {"ok": True}
