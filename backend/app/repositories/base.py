"""仓储层抽象。

API 路由只依赖这个接口，不关心内容到底存在 JSON、SQLite 还是 CMS 里。
后续迁移数据源时新增一个实现类即可，路由与前端完全不用动。
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.models.schemas import (
    AdminPostDetail,
    AdminPostSummary,
    AdminTalkDetail,
    AdminTalkSummary,
    PostDetail,
    PostSummary,
    PostWrite,
    Profile,
    SiteConfig,
    SiteStats,
    TagStat,
    TalkDetail,
    TalkSummary,
    TalkWrite,
)


class SlugConflictError(Exception):
    """slug 与已有内容冲突。路由层把它翻译成 409。"""

    def __init__(self, slug: str) -> None:
        super().__init__(f"slug 已存在: {slug}")
        self.slug = slug


class ContentRepository(ABC):
    """公开内容的读取接口。"""

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

    # ---- 杂谈 ----
    @abstractmethod
    def list_talks(
        self,
        *,
        tag: str | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[TalkSummary]: ...

    @abstractmethod
    def get_talk(self, slug: str) -> TalkDetail | None: ...

    # ---- 聚合数据 ----
    @abstractmethod
    def list_tags(self) -> list[TagStat]: ...

    @abstractmethod
    def get_stats(self) -> SiteStats: ...


class AdminContentRepository(ContentRepository):
    """管理后台需要的内容接口：能看到草稿，也能写入。"""

    # ---- 文章 ----
    @abstractmethod
    def list_admin_posts(
        self,
        *,
        status: str | None = None,
        query: str | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[AdminPostSummary]: ...

    @abstractmethod
    def get_admin_post(self, post_id: str) -> AdminPostDetail | None: ...

    @abstractmethod
    def create_post(self, payload: PostWrite) -> AdminPostDetail: ...

    @abstractmethod
    def update_post(self, post_id: str, payload: PostWrite) -> AdminPostDetail | None: ...

    @abstractmethod
    def delete_post(self, post_id: str) -> bool: ...

    # ---- 杂谈 ----
    @abstractmethod
    def list_admin_talks(
        self,
        *,
        status: str | None = None,
        query: str | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[AdminTalkSummary]: ...

    @abstractmethod
    def get_admin_talk(self, talk_id: str) -> AdminTalkDetail | None: ...

    @abstractmethod
    def create_talk(self, payload: TalkWrite) -> AdminTalkDetail: ...

    @abstractmethod
    def update_talk(self, talk_id: str, payload: TalkWrite) -> AdminTalkDetail | None: ...

    @abstractmethod
    def delete_talk(self, talk_id: str) -> bool: ...