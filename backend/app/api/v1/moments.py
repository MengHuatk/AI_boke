"""生活动态公开只读接口。"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models.schemas import Moment
from app.repositories import ContentRepository, get_repository

router = APIRouter(prefix="/moments", tags=["moments"])


@router.get("", response_model=list[Moment], summary="生活动态列表")
def list_moments(
    repo: ContentRepository = Depends(get_repository),
) -> list[Moment]:
    return repo.list_moments()
