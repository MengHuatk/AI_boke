"""后台项目接口：含草稿的列表、详情、新建、更新与删除。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import require_admin
from app.models.schemas import (
    AdminProjectDetail,
    AdminProjectSummary,
    PostStatus,
    ProjectWrite,
)
from app.repositories import AdminContentRepository, get_repository

router = APIRouter(
    prefix="/admin/projects",
    tags=["admin-projects"],
    dependencies=[Depends(require_admin)],
)


@router.get("", response_model=list[AdminProjectSummary], summary="后台项目列表")
def list_projects(
    status_filter: PostStatus | None = Query(
        default=None,
        alias="status",
        description="按发布状态过滤",
    ),
    q: str | None = Query(default=None, description="按标题、README、仓库地址搜索"),
    limit: int | None = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    repo: AdminContentRepository = Depends(get_repository),
) -> list[AdminProjectSummary]:
    return repo.list_admin_projects(
        status=status_filter,
        query=q,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{project_id}",
    response_model=AdminProjectDetail,
    summary="后台项目详情",
)
def read_project(
    project_id: str,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminProjectDetail:
    project = repo.get_admin_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail=f"项目不存在: {project_id}")
    return project


@router.post(
    "",
    response_model=AdminProjectDetail,
    status_code=status.HTTP_201_CREATED,
    summary="新建项目",
)
def create_project(
    payload: ProjectWrite,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminProjectDetail:
    return repo.create_project(payload)


@router.put(
    "/{project_id}",
    response_model=AdminProjectDetail,
    summary="更新项目",
)
def update_project(
    project_id: str,
    payload: ProjectWrite,
    repo: AdminContentRepository = Depends(get_repository),
) -> AdminProjectDetail:
    project = repo.update_project(project_id, payload)
    if project is None:
        raise HTTPException(status_code=404, detail=f"项目不存在: {project_id}")
    return project


@router.delete("/{project_id}", summary="删除项目")
def delete_project(
    project_id: str,
    repo: AdminContentRepository = Depends(get_repository),
) -> dict[str, bool]:
    if not repo.delete_project(project_id):
        raise HTTPException(status_code=404, detail=f"项目不存在: {project_id}")
    return {"ok": True}
