"""SQLite 内容仓储。

- 文章与杂谈存数据库；
- ``site.json`` / ``profile.json`` 仍是只读文件，沿用原来的 JSON 读取方式；
- 标签、统计数字继续从已发布内容**推导**，不单独维护，避免数据不一致。

标签过滤与聚合放在 Python 侧：单作者博客的数据量下，这比依赖 SQLite
的 JSON1 扩展更直白，也便于和原来的实现逐行对照。
"""

from __future__ import annotations

import json
import math
from datetime import datetime
from pathlib import Path
from typing import Any, cast
from uuid import uuid4

from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import Post, Talk
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
from app.repositories.base import AdminContentRepository, SlugConflictError

READING_CHARS_PER_MINUTE = 400
EXCERPT_FALLBACK_LENGTH = 120


def estimate_reading_minutes(body: str) -> int:
    """按中文阅读速度估算，最少 1 分钟。"""
    compact = body.replace("\n", "").strip()
    return max(1, math.ceil(len(compact) / READING_CHARS_PER_MINUTE))


def count_words(body: str) -> int:
    """沿用原仓储的统计口径：去掉换行后的字符数。"""
    return len(body.replace("\n", "").strip())


def normalize_tags(tags: list[str]) -> list[str]:
    """去空白、去重，保持用户输入顺序。"""
    result: list[str] = []
    for tag in tags:
        clean = tag.strip()
        if clean and clean not in result:
            result.append(clean)
    return result


def normalize_excerpt(excerpt: str, body: str) -> str:
    """摘要留空时从正文截一段，避免列表页出现空卡片。"""
    if excerpt.strip():
        return excerpt.strip()
    compact = " ".join(body.split())
    return compact[:EXCERPT_FALLBACK_LENGTH]


def resolve_published_at(
    payload: PostWrite | TalkWrite,
    current: datetime | None,
) -> datetime | None:
    """显式日期优先；首次发布自动补当前时间；取消发布保留原日期。"""
    if payload.published_at is not None:
        return payload.published_at
    if payload.status == "published":
        return current or datetime.now()
    return current


class SqliteContentRepository(AdminContentRepository):
    """一个请求一个 Session，由 FastAPI 依赖注入。"""

    def __init__(self, session: Session, data_dir: Path) -> None:
        self._session = session
        self._data_dir = Path(data_dir)

    # ------------------------------------------------------------------
    # 站点与个人资料（仍来自 JSON 文件）
    # ------------------------------------------------------------------
    def _load(self, filename: str) -> Any:
        path = self._data_dir / filename
        if not path.exists():
            raise FileNotFoundError(
                f"内容文件不存在: {path}。"
                f"请确认 BLOG_DATA_DIR 配置正确，或检查 app/data/ 是否完整。"
            )
        with path.open(encoding="utf-8") as fp:
            return json.load(fp)

    def get_site(self) -> SiteConfig:
        return SiteConfig.model_validate(self._load("site.json"))

    def get_profile(self) -> Profile:
        return Profile.model_validate(self._load("profile.json"))

    # ------------------------------------------------------------------
    # 公开文章
    # ------------------------------------------------------------------
    def _published_posts(self) -> list[Post]:
        statement = (
            select(Post)
            .where(Post.status == "published")
            .order_by(Post.published_at.desc())
        )
        return list(self._session.scalars(statement))

    def list_posts(
        self,
        *,
        tag: str | None = None,
        featured: bool | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[PostSummary]:
        rows = self._published_posts()

        if tag:
            needle = tag.casefold()
            rows = [row for row in rows if needle in {item.casefold() for item in row.tags}]
        if featured is not None:
            rows = [row for row in rows if row.featured is featured]

        rows = rows[offset:]
        if limit is not None:
            rows = rows[:limit]

        return [self._post_summary(row) for row in rows]

    def get_post(self, slug: str) -> PostDetail | None:
        statement = select(Post).where(Post.slug == slug, Post.status == "published")
        row = self._session.scalar(statement)
        return self._post_detail(row) if row is not None else None

    # ------------------------------------------------------------------
    # 公开杂谈
    # ------------------------------------------------------------------
    def _published_talks(self) -> list[Talk]:
        statement = (
            select(Talk)
            .where(Talk.status == "published")
            .order_by(Talk.published_at.desc())
        )
        return list(self._session.scalars(statement))

    def list_talks(
        self,
        *,
        tag: str | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[TalkSummary]:
        rows = self._published_talks()

        if tag:
            needle = tag.casefold()
            rows = [row for row in rows if needle in {item.casefold() for item in row.tags}]

        rows = rows[offset:]
        if limit is not None:
            rows = rows[:limit]

        return [self._talk_summary(row) for row in rows]

    def get_talk(self, slug: str) -> TalkDetail | None:
        statement = select(Talk).where(Talk.slug == slug, Talk.status == "published")
        row = self._session.scalar(statement)
        return self._talk_detail(row) if row is not None else None

    # ------------------------------------------------------------------
    # 聚合数据（只统计已发布文章，口径与旧实现一致）
    # ------------------------------------------------------------------
    def list_tags(self) -> list[TagStat]:
        counter: dict[str, int] = {}
        for row in self._published_posts():
            for tag in row.tags:
                counter[tag] = counter.get(tag, 0) + 1

        return [
            TagStat(name=name, count=count)
            for name, count in sorted(counter.items(), key=lambda kv: (-kv[1], kv[0]))
        ]

    def get_stats(self) -> SiteStats:
        posts = self._published_posts()
        words = sum(count_words(row.body) for row in posts)
        years = [cast(datetime, row.published_at).year for row in posts]

        return SiteStats(
            posts=len(posts),
            tags=len(self.list_tags()),
            words=words,
            since=min(years) if years else 0,
        )

    # ------------------------------------------------------------------
    # 后台文章
    # ------------------------------------------------------------------
    def list_admin_posts(
        self,
        *,
        status: str | None = None,
        query: str | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[AdminPostSummary]:
        statement = select(Post)

        if status:
            statement = statement.where(Post.status == status)
        if query:
            needle = f"%{query.strip()}%"
            statement = statement.where(
                or_(
                    Post.title.ilike(needle),
                    Post.excerpt.ilike(needle),
                    Post.slug.ilike(needle),
                )
            )

        statement = statement.order_by(Post.updated_at.desc()).offset(offset)
        if limit is not None:
            statement = statement.limit(limit)

        return [self._admin_post_summary(row) for row in self._session.scalars(statement)]

    def get_admin_post(self, post_id: str) -> AdminPostDetail | None:
        row = self._session.get(Post, post_id)
        return self._admin_post_detail(row) if row is not None else None

    def create_post(self, payload: PostWrite) -> AdminPostDetail:
        row = Post(id=uuid4().hex)
        self._apply_post_fields(row, payload)
        self._session.add(row)
        self._commit(payload.slug)
        self._session.refresh(row)
        return self._admin_post_detail(row)

    def update_post(self, post_id: str, payload: PostWrite) -> AdminPostDetail | None:
        row = self._session.get(Post, post_id)
        if row is None:
            return None

        self._apply_post_fields(row, payload)
        self._commit(payload.slug)
        self._session.refresh(row)
        return self._admin_post_detail(row)

    def delete_post(self, post_id: str) -> bool:
        row = self._session.get(Post, post_id)
        if row is None:
            return False

        self._session.delete(row)
        self._session.commit()
        return True

    # ------------------------------------------------------------------
    # 后台杂谈
    # ------------------------------------------------------------------
    def list_admin_talks(
        self,
        *,
        status: str | None = None,
        query: str | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[AdminTalkSummary]:
        statement = select(Talk)

        if status:
            statement = statement.where(Talk.status == status)
        if query:
            needle = f"%{query.strip()}%"
            statement = statement.where(
                or_(
                    Talk.title.ilike(needle),
                    Talk.excerpt.ilike(needle),
                    Talk.slug.ilike(needle),
                    Talk.mood.ilike(needle),
                )
            )

        statement = statement.order_by(Talk.updated_at.desc()).offset(offset)
        if limit is not None:
            statement = statement.limit(limit)

        return [self._admin_talk_summary(row) for row in self._session.scalars(statement)]

    def get_admin_talk(self, talk_id: str) -> AdminTalkDetail | None:
        row = self._session.get(Talk, talk_id)
        return self._admin_talk_detail(row) if row is not None else None

    def create_talk(self, payload: TalkWrite) -> AdminTalkDetail:
        row = Talk(id=uuid4().hex)
        self._apply_talk_fields(row, payload)
        self._session.add(row)
        self._commit(payload.slug)
        self._session.refresh(row)
        return self._admin_talk_detail(row)

    def update_talk(self, talk_id: str, payload: TalkWrite) -> AdminTalkDetail | None:
        row = self._session.get(Talk, talk_id)
        if row is None:
            return None

        self._apply_talk_fields(row, payload)
        self._commit(payload.slug)
        self._session.refresh(row)
        return self._admin_talk_detail(row)

    def delete_talk(self, talk_id: str) -> bool:
        row = self._session.get(Talk, talk_id)
        if row is None:
            return False

        self._session.delete(row)
        self._session.commit()
        return True

    # ------------------------------------------------------------------
    # 内部工具
    # ------------------------------------------------------------------
    def _commit(self, slug: str) -> None:
        try:
            self._session.commit()
        except IntegrityError as exc:
            self._session.rollback()
            raise SlugConflictError(slug) from exc

    def _apply_post_fields(self, row: Post, payload: PostWrite) -> None:
        row.slug = payload.slug
        row.title = payload.title
        row.excerpt = normalize_excerpt(payload.excerpt, payload.body)
        row.cover = payload.cover or None
        row.body = payload.body
        row.tags = normalize_tags(payload.tags)
        row.status = payload.status
        row.featured = payload.featured
        row.reading_minutes = estimate_reading_minutes(payload.body)
        row.published_at = resolve_published_at(payload, row.published_at)

    def _apply_talk_fields(self, row: Talk, payload: TalkWrite) -> None:
        row.slug = payload.slug
        row.title = payload.title
        row.excerpt = normalize_excerpt(payload.excerpt, payload.body)
        row.cover = payload.cover or None
        row.body = payload.body
        row.tags = normalize_tags(payload.tags)
        row.mood = payload.mood
        row.status = payload.status
        row.reading_minutes = estimate_reading_minutes(payload.body)
        row.published_at = resolve_published_at(payload, row.published_at)

    @staticmethod
    def _post_summary(row: Post) -> PostSummary:
        return PostSummary(
            id=row.id,
            slug=row.slug,
            title=row.title,
            excerpt=row.excerpt,
            cover=row.cover,
            tags=list(row.tags),
            published_at=cast(datetime, row.published_at),
            reading_minutes=row.reading_minutes,
            featured=row.featured,
        )

    @classmethod
    def _post_detail(cls, row: Post) -> PostDetail:
        return PostDetail(**cls._post_summary(row).model_dump(), body=row.body)

    @staticmethod
    def _talk_summary(row: Talk) -> TalkSummary:
        return TalkSummary(
            id=row.id,
            slug=row.slug,
            title=row.title,
            excerpt=row.excerpt,
            cover=row.cover,
            tags=list(row.tags),
            mood=row.mood,
            published_at=cast(datetime, row.published_at),
        )

    @classmethod
    def _talk_detail(cls, row: Talk) -> TalkDetail:
        return TalkDetail(**cls._talk_summary(row).model_dump(), body=row.body)

    @staticmethod
    def _admin_post_summary(row: Post) -> AdminPostSummary:
        return AdminPostSummary(
            id=row.id,
            slug=row.slug,
            title=row.title,
            excerpt=row.excerpt,
            cover=row.cover,
            tags=list(row.tags),
            status=row.status,
            featured=row.featured,
            reading_minutes=row.reading_minutes,
            published_at=row.published_at,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @classmethod
    def _admin_post_detail(cls, row: Post) -> AdminPostDetail:
        return AdminPostDetail(**cls._admin_post_summary(row).model_dump(), body=row.body)

    @staticmethod
    def _admin_talk_summary(row: Talk) -> AdminTalkSummary:
        return AdminTalkSummary(
            id=row.id,
            slug=row.slug,
            title=row.title,
            excerpt=row.excerpt,
            cover=row.cover,
            tags=list(row.tags),
            mood=row.mood,
            status=row.status,
            reading_minutes=row.reading_minutes,
            published_at=row.published_at,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @classmethod
    def _admin_talk_detail(cls, row: Talk) -> AdminTalkDetail:
        return AdminTalkDetail(**cls._admin_talk_summary(row).model_dump(), body=row.body)
