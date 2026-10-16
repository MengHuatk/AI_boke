"""仓储层抽象。

API 路由只依赖这个接口，不关心内容到底存在 JSON、SQLite 还是 CMS 里。
后续迁移数据源时新增一个实现类即可，路由与前端完全不用动。
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.models.schemas import (
    PostDetail,
    PostSummary,
    Profile,
    SiteConfig,
    SiteStats,
    TagStat,
)


class ContentRepository(ABC):
    """内容读取接口。"""

    # ---- 站点与个人资料 ----
    @abstractmethod
    def get_site(self) -> SiteConfig: ...

    @abstractmethod
    def get_profile(self) -> Profile: ...

    # ---- 文章 ----
    @abstractmethod
    def list_posts(
        self,
        *,
        tag: str | None = None,
        featured: bool | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[PostSummary]: ...

    @abstractmethod
    def get_post(self, slug: str) -> PostDetail | None: ...

    # ---- 聚合数据 ----
    @abstractmethod
    def list_tags(self) -> list[TagStat]: ...

    @abstractmethod
    def get_stats(self) -> SiteStats: ...