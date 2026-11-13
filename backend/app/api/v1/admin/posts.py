"""后台文章接口：含草稿的列表、详情、新建、更新与删除。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import require_admin
from app.models.schemas import (
    AdminPostDetail,
    AdminPostSummary,
    PostStatus,
    PostWrite,
)
from app.repositories import AdminContentRepository, SlugConflictError, get_repository

router = APIRouter(
    prefix="/admin/posts",
    tags=["admin-posts"],
    dependencies=[Depends(require_admin)],
)


@router.get("", response_model=list[AdminPostSummary], summary="后台文章列表")
def list_posts(
    status: PostStatus | None = Query(default=None, description="按发布状态过滤"),
    q: str | None = Query(default=None, description="按标题、摘要、slug 搜索"),
    limit: int | None = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    repo: AdminContentRepository = Depends(get_repository),
) -> list[AdminPostSummary]:
    return repo.list_admin_posts(status=status, query=q, limit=limit, offset=offset)


@router.get("/{post_id}", response_model=AdminPostDetail, summary="后台文章详情")
def read_post(
    post_id: str,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminPostDetail:
    post = repo.get_admin_post(post_id)
    if post is None:
        raise HTTPException(status_code=404, detail=f"文章不存在: {post_id}")
    return post


@router.post(
    "",
    response_model=AdminPostDetail,
    status_code=status.HTTP_201_CREATED,
    summary="新建文章",
)
def create_post(
    payload: PostWrite,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminPostDetail:
    try:
        return repo.create_post(payload)
    except SlugConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.put("/{post_id}", response_model=AdminPostDetail, summary="更新文章")
def update_post(
    post_id: str,
    payload: PostWrite,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminPostDetail:
    try:
        post = repo.update_post(post_id, payload)
    except SlugConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    if post is None:
        raise HTTPException(status_code=404, detail=f"文章不存在: {post_id}")
    return post


@router.delete("/{post_id}", summary="删除文章")
def delete_post(
    post_id: str,
    repo: AdminContentRepository = Depends(get_repository),
) -> dict[str, bool]:
    if not repo.delete_post(post_id):
        raise HTTPException(status_code=404, detail=f"文章不存在: {post_id}")
    return {"ok": True}
