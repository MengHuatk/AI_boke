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

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.db.models import (
    FriendLink,
    Moment as MomentRow,
    MusicTrack as MusicTrackRow,
    PhotoAlbum,
    PhotoItem,
    Post,
    Project,
    Talk,
)
from app.models.schemas import (
    AdminFriendLinkDetail,
    AdminFriendLinkSummary,
    AdminMomentDetail,
    AdminMomentSummary,
    AdminMusicTrackDetail,
    AdminMusicTrackSummary,
    AdminPhotoAlbumDetail,
    AdminPhotoAlbumSummary,
    AdminPostDetail,
    AdminPostSummary,
    AdminProjectDetail,
    AdminProjectSummary,
    AdminTalkDetail,
    AdminTalkSummary,
    ContentStatus,
    FriendLink as FriendLinkSchema,
    FriendLinkWrite,
    Moment as MomentSchema,
    MomentImage,
    MomentLocation,
    MomentWrite,
    MusicLyricLine,
    MusicTrack as MusicTrackSchema,
    MusicTrackWrite,
    PhotoAlbum as PhotoAlbumSchema,
    PhotoAlbumWrite,
    PhotoItem as PhotoItemSchema,
    PostDetail,
    PostSummary,
    PostWrite,
    Profile,
    Project as ProjectSchema,
    ProjectWrite,
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
    payload: PostWrite | TalkWrite | MomentWrite,
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
    # 公开照片集 / 项目 / 友链
    # ------------------------------------------------------------------
    def list_albums(self) -> list[PhotoAlbumSchema]:
        statement = (
            select(PhotoAlbum)
            .where(PhotoAlbum.status == "published")
            .options(selectinload(PhotoAlbum.photos))
            .order_by(PhotoAlbum.sort_order, PhotoAlbum.created_at.desc())
        )
        return [self._album_public(row) for row in self._session.scalars(statement)]

    def list_projects(self) -> list[ProjectSchema]:
        statement = (
            select(Project)
            .where(Project.status == "published")
            .order_by(Project.sort_order, Project.created_at.desc())
        )
        return [self._project_public(row) for row in self._session.scalars(statement)]

    def list_friend_links(self) -> list[FriendLinkSchema]:
        statement = (
            select(FriendLink)
            .where(FriendLink.status == "published")
            .order_by(FriendLink.sort_order, FriendLink.created_at.desc())
        )
        return [self._friend_link_public(row) for row in self._session.scalars(statement)]

    def list_music_tracks(self) -> list[MusicTrackSchema]:
        statement = (
            select(MusicTrackRow)
            .where(MusicTrackRow.status == "published")
            .order_by(MusicTrackRow.sort_order, MusicTrackRow.created_at.desc())
        )
        return [self._music_track_public(row) for row in self._session.scalars(statement)]

    def list_moments(self) -> list[MomentSchema]:
        statement = (
            select(MomentRow)
            .where(MomentRow.status == "published")
            .order_by(MomentRow.published_at.desc())
        )
        return [self._moment_public(row) for row in self._session.scalars(statement)]

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
    # 后台照片集
    # ------------------------------------------------------------------
    def list_admin_albums(
        self,
        *,
        status: str | None = None,
        query: str | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[AdminPhotoAlbumSummary]:
        statement = select(PhotoAlbum).options(selectinload(PhotoAlbum.photos))

        if status:
            statement = statement.where(PhotoAlbum.status == status)
        if query:
            needle = f"%{query.strip()}%"
            statement = statement.where(
                or_(
                    PhotoAlbum.title.ilike(needle),
                    PhotoAlbum.description.ilike(needle),
                    PhotoAlbum.slug.ilike(needle),
                )
            )

        statement = (
            statement.order_by(PhotoAlbum.sort_order, PhotoAlbum.updated_at.desc())
            .offset(offset)
        )
        if limit is not None:
            statement = statement.limit(limit)

        return [
            self._admin_album_summary(row)
            for row in self._session.scalars(statement)
        ]

    def get_admin_album(self, album_id: str) -> AdminPhotoAlbumDetail | None:
        statement = (
            select(PhotoAlbum)
            .where(PhotoAlbum.id == album_id)
            .options(selectinload(PhotoAlbum.photos))
        )
        row = self._session.scalar(statement)
        return self._admin_album_detail(row) if row is not None else None

    def create_album(self, payload: PhotoAlbumWrite) -> AdminPhotoAlbumDetail:
        row = PhotoAlbum(
            id=uuid4().hex,
            sort_order=self._next_sort_order(PhotoAlbum),
        )
        self._apply_album_fields(row, payload)
        self._session.add(row)
        self._commit(payload.slug)
        self._session.refresh(row)
        return self._admin_album_detail(row)

    def update_album(
        self,
        album_id: str,
        payload: PhotoAlbumWrite,
    ) -> AdminPhotoAlbumDetail | None:
        row = self._session.get(PhotoAlbum, album_id)
        if row is None:
            return None

        self._apply_album_fields(row, payload)
        self._commit(payload.slug)
        self._session.refresh(row)
        return self._admin_album_detail(row)

    def delete_album(self, album_id: str) -> bool:
        row = self._session.get(PhotoAlbum, album_id)
        if row is None:
            return False

        self._session.delete(row)
        self._session.commit()
        return True

    # ------------------------------------------------------------------
    # 后台项目
    # ------------------------------------------------------------------
    def list_admin_projects(
        self,
        *,
        status: str | None = None,
        query: str | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[AdminProjectSummary]:
        statement = select(Project)

        if status:
            statement = statement.where(Project.status == status)
        if query:
            needle = f"%{query.strip()}%"
            statement = statement.where(
                or_(
                    Project.title.ilike(needle),
                    Project.readme_title.ilike(needle),
                    Project.repo_url.ilike(needle),
                )
            )

        statement = (
            statement.order_by(Project.sort_order, Project.updated_at.desc())
            .offset(offset)
        )
        if limit is not None:
            statement = statement.limit(limit)

        return [
            self._admin_project_summary(row)
            for row in self._session.scalars(statement)
        ]

    def get_admin_project(self, project_id: str) -> AdminProjectDetail | None:
        row = self._session.get(Project, project_id)
        return self._admin_project_detail(row) if row is not None else None

    def create_project(self, payload: ProjectWrite) -> AdminProjectDetail:
        row = Project(
            id=uuid4().hex,
            sort_order=self._next_sort_order(Project),
        )
        self._apply_project_fields(row, payload)
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return self._admin_project_detail(row)

    def update_project(
        self,
        project_id: str,
        payload: ProjectWrite,
    ) -> AdminProjectDetail | None:
        row = self._session.get(Project, project_id)
        if row is None:
            return None

        self._apply_project_fields(row, payload)
        self._session.commit()
        self._session.refresh(row)
        return self._admin_project_detail(row)

    def delete_project(self, project_id: str) -> bool:
        row = self._session.get(Project, project_id)
        if row is None:
            return False

        self._session.delete(row)
        self._session.commit()
        return True

    # ------------------------------------------------------------------
    # 后台友链
    # ------------------------------------------------------------------
    def list_admin_links(
        self,
        *,
        status: str | None = None,
        query: str | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[AdminFriendLinkSummary]:
        statement = select(FriendLink)

        if status:
            statement = statement.where(FriendLink.status == status)
        if query:
            needle = f"%{query.strip()}%"
            statement = statement.where(
                or_(
                    FriendLink.name.ilike(needle),
                    FriendLink.bio.ilike(needle),
                    FriendLink.href.ilike(needle),
                )
            )

        statement = (
            statement.order_by(FriendLink.sort_order, FriendLink.updated_at.desc())
            .offset(offset)
        )
        if limit is not None:
            statement = statement.limit(limit)

        return [
            self._admin_link_summary(row)
            for row in self._session.scalars(statement)
        ]

    def get_admin_link(self, link_id: str) -> AdminFriendLinkDetail | None:
        row = self._session.get(FriendLink, link_id)
        return self._admin_link_detail(row) if row is not None else None

    def create_link(self, payload: FriendLinkWrite) -> AdminFriendLinkDetail:
        row = FriendLink(
            id=uuid4().hex,
            sort_order=self._next_sort_order(FriendLink),
        )
        self._apply_link_fields(row, payload)
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return self._admin_link_detail(row)

    def update_link(
        self,
        link_id: str,
        payload: FriendLinkWrite,
    ) -> AdminFriendLinkDetail | None:
        row = self._session.get(FriendLink, link_id)
        if row is None:
            return None

        self._apply_link_fields(row, payload)
        self._session.commit()
        self._session.refresh(row)
        return self._admin_link_detail(row)

    def delete_link(self, link_id: str) -> bool:
        row = self._session.get(FriendLink, link_id)
        if row is None:
            return False

        self._session.delete(row)
        self._session.commit()
        return True

    # ------------------------------------------------------------------
    # 后台音乐
    # ------------------------------------------------------------------
    def list_admin_music_tracks(
        self,
        *,
        status: str | None = None,
        query: str | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[AdminMusicTrackSummary]:
        statement = select(MusicTrackRow)

        if status:
            statement = statement.where(MusicTrackRow.status == status)
        if query:
            needle = f"%{query.strip()}%"
            statement = statement.where(
                or_(
                    MusicTrackRow.title.ilike(needle),
                    MusicTrackRow.artist.ilike(needle),
                )
            )

        statement = (
            statement.order_by(
                MusicTrackRow.sort_order,
                MusicTrackRow.updated_at.desc(),
            ).offset(offset)
        )
        if limit is not None:
            statement = statement.limit(limit)

        return [
            self._admin_music_track_summary(row)
            for row in self._session.scalars(statement)
        ]

    def get_admin_music_track(
        self,
        track_id: str,
    ) -> AdminMusicTrackDetail | None:
        row = self._session.get(MusicTrackRow, track_id)
        return self._admin_music_track_detail(row) if row is not None else None

    def create_music_track(
        self,
        payload: MusicTrackWrite,
    ) -> AdminMusicTrackDetail:
        row = MusicTrackRow(
            id=uuid4().hex,
            sort_order=self._next_sort_order(MusicTrackRow),
        )
        self._apply_music_track_fields(row, payload)
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return self._admin_music_track_detail(row)

    def update_music_track(
        self,
        track_id: str,
        payload: MusicTrackWrite,
    ) -> AdminMusicTrackDetail | None:
        row = self._session.get(MusicTrackRow, track_id)
        if row is None:
            return None

        self._apply_music_track_fields(row, payload)
        self._session.commit()
        self._session.refresh(row)
        return self._admin_music_track_detail(row)

    def delete_music_track(self, track_id: str) -> bool:
        row = self._session.get(MusicTrackRow, track_id)
        if row is None:
            return False

        self._session.delete(row)
        self._session.commit()
        return True

    # ------------------------------------------------------------------
    # 后台生活动态
    # ------------------------------------------------------------------
    def list_admin_moments(
        self,
        *,
        status: str | None = None,
        query: str | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[AdminMomentSummary]:
        statement = select(MomentRow)

        if status:
            statement = statement.where(MomentRow.status == status)
        if query:
            statement = statement.where(
                MomentRow.content.ilike(f"%{query.strip()}%")
            )

        statement = (
            statement.order_by(
                MomentRow.published_at.desc(),
                MomentRow.updated_at.desc(),
            ).offset(offset)
        )
        if limit is not None:
            statement = statement.limit(limit)

        return [
            self._admin_moment_summary(row)
            for row in self._session.scalars(statement)
        ]

    def get_admin_moment(self, moment_id: str) -> AdminMomentDetail | None:
        row = self._session.get(MomentRow, moment_id)
        return self._admin_moment_detail(row) if row is not None else None

    def create_moment(self, payload: MomentWrite) -> AdminMomentDetail:
        row = MomentRow(id=uuid4().hex)
        self._apply_moment_fields(row, payload)
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return self._admin_moment_detail(row)

    def update_moment(
        self,
        moment_id: str,
        payload: MomentWrite,
    ) -> AdminMomentDetail | None:
        row = self._session.get(MomentRow, moment_id)
        if row is None:
            return None

        self._apply_moment_fields(row, payload)
        self._session.commit()
        self._session.refresh(row)
        return self._admin_moment_detail(row)

    def delete_moment(self, moment_id: str) -> bool:
        row = self._session.get(MomentRow, moment_id)
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

    def _next_sort_order(self, model: Any) -> int:
        """新建内容默认排在已有内容之后。"""
        current = self._session.scalar(select(func.max(model.sort_order)))
        return (current or 0) + 1

    def _apply_album_fields(self, row: PhotoAlbum, payload: PhotoAlbumWrite) -> None:
        row.slug = payload.slug
        row.title = payload.title
        row.description = payload.description
        row.created_at = payload.created_at
        row.status = payload.status
        row.photos = [
            PhotoItem(
                id=uuid4().hex,
                src=photo.src,
                alt=photo.alt,
                title=photo.title,
                width=photo.width,
                height=photo.height,
                sort_order=index,
            )
            for index, photo in enumerate(payload.photos)
        ]

    def _apply_project_fields(self, row: Project, payload: ProjectWrite) -> None:
        row.title = payload.title
        row.readme_title = payload.readme_title
        row.tech_stack = normalize_tags(payload.tech_stack)
        row.repo_url = payload.repo_url
        row.emoji = payload.emoji.strip()
        row.status = payload.status

    def _apply_link_fields(self, row: FriendLink, payload: FriendLinkWrite) -> None:
        row.name = payload.name
        row.avatar = payload.avatar
        row.bio = payload.bio
        row.href = payload.href
        row.status = payload.status

    def _apply_music_track_fields(
        self,
        row: MusicTrackRow,
        payload: MusicTrackWrite,
    ) -> None:
        row.title = payload.title
        row.artist = payload.artist
        row.duration = payload.duration
        row.cover = payload.cover
        row.audio_url = payload.audio_url
        row.lyrics = [line.model_dump() for line in payload.lyrics]
        row.status = payload.status

    def _apply_moment_fields(self, row: MomentRow, payload: MomentWrite) -> None:
        row.content = payload.content
        row.images = [image.model_dump() for image in payload.images]
        row.location = payload.location.model_dump()
        row.status = payload.status
        row.published_at = resolve_published_at(payload, row.published_at)

    @staticmethod
    def _photo_item(row: PhotoItem) -> PhotoItemSchema:
        return PhotoItemSchema(
            id=row.id,
            src=row.src,
            alt=row.alt,
            title=row.title,
            width=row.width,
            height=row.height,
        )

    @classmethod
    def _album_public(cls, row: PhotoAlbum) -> PhotoAlbumSchema:
        return PhotoAlbumSchema(
            id=row.id,
            slug=row.slug,
            title=row.title,
            description=row.description,
            created_at=row.created_at,
            photos=[cls._photo_item(photo) for photo in row.photos],
        )

    @classmethod
    def _admin_album_summary(cls, row: PhotoAlbum) -> AdminPhotoAlbumSummary:
        return AdminPhotoAlbumSummary(
            id=row.id,
            slug=row.slug,
            title=row.title,
            description=row.description,
            created_at=row.created_at,
            status=cast(ContentStatus, row.status),
            sort_order=row.sort_order,
            photo_count=len(row.photos),
            cover=row.photos[0].src if row.photos else None,
            updated_at=row.updated_at,
        )

    @classmethod
    def _admin_album_detail(cls, row: PhotoAlbum) -> AdminPhotoAlbumDetail:
        return AdminPhotoAlbumDetail(
            **cls._admin_album_summary(row).model_dump(),
            photos=[cls._photo_item(photo) for photo in row.photos],
        )

    @staticmethod
    def _project_public(row: Project) -> ProjectSchema:
        return ProjectSchema(
            id=row.id,
            title=row.title,
            readme_title=row.readme_title,
            tech_stack=list(row.tech_stack),
            repo_url=row.repo_url,
            emoji=row.emoji,
        )

    @classmethod
    def _admin_project_summary(cls, row: Project) -> AdminProjectSummary:
        return AdminProjectSummary(
            **cls._project_public(row).model_dump(),
            status=cast(ContentStatus, row.status),
            sort_order=row.sort_order,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @classmethod
    def _admin_project_detail(cls, row: Project) -> AdminProjectDetail:
        return AdminProjectDetail(**cls._admin_project_summary(row).model_dump())

    @staticmethod
    def _friend_link_public(row: FriendLink) -> FriendLinkSchema:
        return FriendLinkSchema(
            id=row.id,
            name=row.name,
            avatar=row.avatar,
            bio=row.bio,
            href=row.href,
        )

    @classmethod
    def _admin_link_summary(cls, row: FriendLink) -> AdminFriendLinkSummary:
        return AdminFriendLinkSummary(
            **cls._friend_link_public(row).model_dump(),
            status=cast(ContentStatus, row.status),
            sort_order=row.sort_order,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @classmethod
    def _admin_link_detail(cls, row: FriendLink) -> AdminFriendLinkDetail:
        return AdminFriendLinkDetail(**cls._admin_link_summary(row).model_dump())

    @staticmethod
    def _music_track_public(row: MusicTrackRow) -> MusicTrackSchema:
        return MusicTrackSchema(
            id=row.id,
            title=row.title,
            artist=row.artist,
            duration=row.duration,
            cover=row.cover,
            audio_url=row.audio_url,
            lyrics=[MusicLyricLine.model_validate(line) for line in row.lyrics],
        )

    @classmethod
    def _admin_music_track_summary(
        cls,
        row: MusicTrackRow,
    ) -> AdminMusicTrackSummary:
        return AdminMusicTrackSummary(
            id=row.id,
            title=row.title,
            artist=row.artist,
            duration=row.duration,
            cover=row.cover,
            audio_url=row.audio_url,
            lyric_count=len(row.lyrics),
            status=cast(ContentStatus, row.status),
            sort_order=row.sort_order,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @classmethod
    def _admin_music_track_detail(
        cls,
        row: MusicTrackRow,
    ) -> AdminMusicTrackDetail:
        return AdminMusicTrackDetail(
            **cls._admin_music_track_summary(row).model_dump(),
            lyrics=[MusicLyricLine.model_validate(line) for line in row.lyrics],
        )

    @staticmethod
    def _moment_images(row: MomentRow) -> list[MomentImage]:
        return [MomentImage.model_validate(image) for image in row.images]

    @staticmethod
    def _moment_location(row: MomentRow) -> MomentLocation:
        return MomentLocation.model_validate(row.location)

    @classmethod
    def _moment_public(cls, row: MomentRow) -> MomentSchema:
        return MomentSchema(
            id=row.id,
            content=row.content,
            images=cls._moment_images(row),
            location=cls._moment_location(row),
            published_at=cast(datetime, row.published_at),
        )

    @classmethod
    def _admin_moment_summary(cls, row: MomentRow) -> AdminMomentSummary:
        return AdminMomentSummary(
            id=row.id,
            content=row.content,
            images=cls._moment_images(row),
            location=cls._moment_location(row),
            status=cast(ContentStatus, row.status),
            published_at=row.published_at,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @classmethod
    def _admin_moment_detail(cls, row: MomentRow) -> AdminMomentDetail:
        return AdminMomentDetail(**cls._admin_moment_summary(row).model_dump())

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
