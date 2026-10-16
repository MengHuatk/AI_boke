"""基于 JSON 文件的内容仓储实现（初版数据源）。

设计要点：
- 文件在首次读取后缓存到内存，避免每次请求都做磁盘 IO；
- 标签、统计数字均由文章数据**推导**得出，而不是单独维护一份，杜绝数据不一致；
- 将来换成数据库时，照抄这个类的方法签名重新实现即可。
"""

from __future__ import annotations

import json
from functools import cached_property
from pathlib import Path
from typing import Any

from app.models.schemas import (
    PostDetail,
    PostSummary,
    Profile,
    SiteConfig,
    SiteStats,
    TagStat,
)
from app.repositories.base import ContentRepository


class JsonContentRepository(ContentRepository):
    """从 ``settings.data_dir`` 下的 JSON 文件读取内容。"""

    def __init__(self, data_dir: Path) -> None:
        self._data_dir = Path(data_dir)

    # ------------------------------------------------------------------
    # 内部工具
    # ------------------------------------------------------------------
    def _load(self, filename: str) -> Any:
        """读取并解析 JSON 文件，文件缺失时给出可读的错误。"""
        path = self._data_dir / filename
        if not path.exists():
            raise FileNotFoundError(
                f"内容文件不存在: {path}。"
                f"请确认 BLOG_DATA_DIR 配置正确，或检查 app/data/ 是否完整。"
            )
        with path.open(encoding="utf-8") as fp:
            return json.load(fp)

    @cached_property
    def _site_raw(self) -> dict[str, Any]:
        return self._load("site.json")

    @cached_property
    def _profile_raw(self) -> dict[str, Any]:
        return self._load("profile.json")

    @cached_property
    def _posts_raw(self) -> list[dict[str, Any]]:
        # 始终按发布时间倒序，保证列表展示顺序稳定
        posts = self._load("posts.json")
        return sorted(posts, key=lambda p: p.get("published_at", ""), reverse=True)

    # ------------------------------------------------------------------
    # 站点与个人资料
    # ------------------------------------------------------------------
    def get_site(self) -> SiteConfig:
        return SiteConfig.model_validate(self._site_raw)

    def get_profile(self) -> Profile:
        return Profile.model_validate(self._profile_raw)

    # ------------------------------------------------------------------
    # 文章
    # ------------------------------------------------------------------
    def list_posts(
        self,
        *,
        tag: str | None = None,
        featured: bool | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[PostSummary]:
        rows = self._posts_raw

        if tag:
            needle = tag.casefold()
            rows = [r for r in rows if needle in {t.casefold() for t in r.get("tags", [])}]
        if featured is not None:
            rows = [r for r in rows if bool(r.get("featured")) is featured]

        rows = rows[offset:]
        if limit is not None:
            rows = rows[:limit]

        return [PostSummary.model_validate(r) for r in rows]

    def get_post(self, slug: str) -> PostDetail | None:
        for row in self._posts_raw:
            if row.get("slug") == slug:
                return PostDetail.model_validate(row)
        return None

    # ------------------------------------------------------------------
    # 聚合数据（从文章推导，保持单一数据源）
    # ------------------------------------------------------------------
    def list_tags(self) -> list[TagStat]:
        counter: dict[str, int] = {}
        for row in self._posts_raw:
            for tag in row.get("tags", []):
                counter[tag] = counter.get(tag, 0) + 1
        # 先按文章数倒序，再按名称正序，保证同数量时顺序稳定
        return [
            TagStat(name=name, count=count)
            for name, count in sorted(counter.items(), key=lambda kv: (-kv[1], kv[0]))
        ]

    def get_stats(self) -> SiteStats:
        posts = self._posts_raw
        words = sum(len(str(row.get("body", "")).replace("\n", "").strip()) for row in posts)

        # 建站年份取最早一篇文章的年份，避免和站点配置重复维护
        years = [
            int(str(row["published_at"])[:4])
            for row in posts
            if row.get("published_at")
        ]

        return SiteStats(
            posts=len(posts),
            tags=len(self.list_tags()),
            words=words,
            since=min(years) if years else 0,
        )