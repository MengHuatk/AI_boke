"""项目公开只读接口。"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models.schemas import Project
from app.repositories import ContentRepository, get_repository

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[Project], summary="项目列表")
def list_projects(
    repo: ContentRepository = Depends(get_repository),
) -> list[Project]:
    return repo.list_projects()
