"""标签与统计接口。"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models.schemas import SiteStats, TagStat
from app.repositories import ContentRepository, get_repository

router = APIRouter(tags=["tags"])


@router.get("/tags", response_model=list[TagStat], summary="标签列表")
def list_tags(repo: ContentRepository = Depends(get_repository)) -> list[TagStat]:
    return repo.list_tags()


@router.get("/stats", response_model=SiteStats, summary="站点统计")
def read_stats(repo: ContentRepository = Depends(get_repository)) -> SiteStats:
    return repo.get_stats()