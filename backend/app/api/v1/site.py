"""站点与个人资料接口。"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models.schemas import HomePayload, Profile, SiteConfig
from app.repositories import ContentRepository, get_repository

router = APIRouter(tags=["site"])


@router.get("/site", response_model=SiteConfig, summary="站点配置")
def read_site(repo: ContentRepository = Depends(get_repository)) -> SiteConfig:
    """返回站点标题、导航项与社交链接，前端据此渲染导航栏与页脚。"""
    return repo.get_site()


@router.get("/profile", response_model=Profile, summary="博主资料")
def read_profile(repo: ContentRepository = Depends(get_repository)) -> Profile:
    return repo.get_profile()


@router.get("/home", response_model=HomePayload, summary="首页聚合数据")
def read_home(
    featured_limit: int = 3,
    repo: ContentRepository = Depends(get_repository),
) -> HomePayload:
    """首页一次性拿齐首屏数据，避免多个请求串行等待。

    ``featured_limit`` 控制精选文章条数，属于展示层参数，因此放在查询串里。
    """
    return HomePayload(
        site=repo.get_site(),
        profile=repo.get_profile(),
        featured_posts=repo.list_posts(featured=True, limit=featured_limit),
        tags=repo.list_tags(),
        stats=repo.get_stats(),
    )