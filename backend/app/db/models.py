"""内容 ORM 模型。

时间字段沿用前端现有的“无时区 ISO 字符串”语义，统一用 ``datetime.now()``
写入本地时间，避免前端日期格式化出现时区偏移。

标签用 SQLAlchemy 的 JSON 类型存成 SQLite TEXT。内容规模是单作者博客，
过滤与聚合都在 Python 侧完成，不依赖 SQLite 的 JSON1 扩展。

照片集拆成 ``photo_albums`` 与 ``photo_items`` 两张表：相册是展示单位，
照片需要单独排序与增删，因此不适合塞进 JSON 数组。其余三类内容结构扁平，
各自一张表即可。
"""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    JSON,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Post(Base):
    """文章。``status`` 区分草稿与已发布。"""

    __tablename__ = "posts"
    __table_args__ = (
        CheckConstraint("status IN ('draft', 'published')", name="ck_posts_status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(300))
    excerpt: Mapped[str] = mapped_column(Text, default="")
    cover: Mapped[str | None] = mapped_column(String(500), nullable=True)
    body: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    reading_minutes: Mapped[int] = mapped_column(Integer, default=1)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        onupdate=datetime.now,
    )


class Talk(Base):
    """杂谈。字段沿用前端的 Talk / TalkDetail 结构，额外增加 ``status``。"""

    __tablename__ = "talks"
    __table_args__ = (
        CheckConstraint("status IN ('draft', 'published')", name="ck_talks_status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(300))
    excerpt: Mapped[str] = mapped_column(Text, default="")
    cover: Mapped[str | None] = mapped_column(String(500), nullable=True)
    body: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    mood: Mapped[str] = mapped_column(String(100), default="")
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    reading_minutes: Mapped[int] = mapped_column(Integer, default=1)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        onupdate=datetime.now,
    )


class PhotoAlbum(Base):
    """照片集。``created_at`` 是相册展示用的日期，不是记录创建时间。"""

    __tablename__ = "photo_albums"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'published')",
            name="ck_photo_albums_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        onupdate=datetime.now,
    )

    photos: Mapped[list["PhotoItem"]] = relationship(
        back_populates="album",
        cascade="all, delete-orphan",
        order_by="PhotoItem.sort_order",
    )


class PhotoItem(Base):
    """照片集里的一张照片。``width / height`` 用于前端在加载前占住高度。"""

    __tablename__ = "photo_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    album_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("photo_albums.id", ondelete="CASCADE"),
        index=True,
    )
    src: Mapped[str] = mapped_column(String(500))
    alt: Mapped[str] = mapped_column(String(300), default="")
    title: Mapped[str] = mapped_column(String(300), default="")
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    album: Mapped[PhotoAlbum] = relationship(back_populates="photos")


class Project(Base):
    """项目矩阵卡片。"""

    __tablename__ = "projects"
    __table_args__ = (
        CheckConstraint("status IN ('draft', 'published')", name="ck_projects_status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    readme_title: Mapped[str] = mapped_column(String(300), default="")
    tech_stack: Mapped[list[str]] = mapped_column(JSON, default=list)
    repo_url: Mapped[str] = mapped_column(String(500))
    emoji: Mapped[str] = mapped_column(String(8), default="")
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        onupdate=datetime.now,
    )


class FriendLink(Base):
    """友链卡片。"""

    __tablename__ = "friend_links"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'published')",
            name="ck_friend_links_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(300))
    avatar: Mapped[str] = mapped_column(String(500))
    bio: Mapped[str] = mapped_column(Text, default="")
    href: Mapped[str] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        onupdate=datetime.now,
    )


class MusicTrack(Base):
    """音乐页曲目。歌词时间轴是只读展示数据，用 JSON 整段保存。"""

    __tablename__ = "music_tracks"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'published')",
            name="ck_music_tracks_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    artist: Mapped[str] = mapped_column(String(300))
    duration: Mapped[float] = mapped_column(Float)
    cover: Mapped[str] = mapped_column(String(500))
    audio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    lyrics: Mapped[list[dict]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        onupdate=datetime.now,
    )


class Moment(Base):
    """生活动态。配图与位置始终随动态整体读写，用 JSON 整段保存。"""

    __tablename__ = "moments"
    __table_args__ = (
        CheckConstraint("status IN ('draft', 'published')", name="ck_moments_status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    content: Mapped[str] = mapped_column(Text, default="")
    images: Mapped[list[dict]] = mapped_column(JSON, default=list)
    location: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        onupdate=datetime.now,
    )
