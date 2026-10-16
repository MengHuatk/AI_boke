"""文章接口。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.schemas import PostDetail, PostSummary
from app.repositories import ContentRepository, get_repository

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("", response_model=list[PostSummary], summary="文章列表")
def list_posts(
    tag: str | None = Query(default=None, description="按标签过滤"),
    featured: bool | None = Query(default=None, description="只看精选"),
    limit: int | None = Query(default=None, ge=1, le=100, description="返回条数上限"),
    offset: int = Query(default=0, ge=0, description="偏移量，用于分页"),
    repo: ContentRepository = Depends(get_repository),
) -> list[PostSummary]:
    return repo.list_posts(tag=tag, featured=featured, limit=limit, offset=offset)


@router.get("/{slug}", response_model=PostDetail, summary="文章详情")
def read_post(
    slug: str,
    repo: ContentRepository = Depends(get_repository),
) -> PostDetail:
    post = repo.get_post(slug)
    if post is None:
        raise HTTPException(status_code=404, detail=f"文章不存在: {slug}")
    return post