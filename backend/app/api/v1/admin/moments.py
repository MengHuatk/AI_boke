"""后台生活动态接口：含草稿的列表、详情、新建、更新与删除。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import require_admin
from app.models.schemas import (
    AdminMomentDetail,
    AdminMomentSummary,
    MomentWrite,
    PostStatus,
)
from app.repositories import AdminContentRepository, get_repository

router = APIRouter(
    prefix="/admin/moments",
    tags=["admin-moments"],
    dependencies=[Depends(require_admin)],
)


@router.get("", response_model=list[AdminMomentSummary], summary="后台生活动态列表")
def list_moments(
    status_filter: PostStatus | None = Query(
        default=None,
        alias="status",
        description="按发布状态过滤",
    ),
    q: str | None = Query(default=None, description="按正文搜索"),
    limit: int | None = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    repo: AdminContentRepository = Depends(get_repository),
) -> list[AdminMomentSummary]:
    return repo.list_admin_moments(
        status=status_filter,
        query=q,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{moment_id}",
    response_model=AdminMomentDetail,
    summary="后台生活动态详情",
)
def read_moment(
    moment_id: str,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminMomentDetail:
    moment = repo.get_admin_moment(moment_id)
    if moment is None:
        raise HTTPException(status_code=404, detail=f"生活动态不存在: {moment_id}")
    return moment


@router.post(
    "",
    response_model=AdminMomentDetail,
    status_code=status.HTTP_201_CREATED,
    summary="新建生活动态",
)
def create_moment(
    payload: MomentWrite,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminMomentDetail:
    return repo.create_moment(payload)


@router.put(
    "/{moment_id}",
    response_model=AdminMomentDetail,
    summary="更新生活动态",
)
def update_moment(
    moment_id: str,
    payload: MomentWrite,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminMomentDetail:
    moment = repo.update_moment(moment_id, payload)
    if moment is None:
        raise HTTPException(status_code=404, detail=f"生活动态不存在: {moment_id}")
    return moment


@router.delete("/{moment_id}", summary="删除生活动态")
def delete_moment(
    moment_id: str,
    repo: AdminContentRepository = Depends(get_repository),
) -> dict[str, bool]:
    if not repo.delete_moment(moment_id):
        raise HTTPException(status_code=404, detail=f"生活动态不存在: {moment_id}")
    return {"ok": True}
