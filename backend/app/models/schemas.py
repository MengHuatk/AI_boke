"""API 响应模型。

这些模型同时承担两个职责：
1. 约束后端返回结构，避免接口随手改动导致前端崩溃；
2. 作为前端 ``src/lib/types.ts`` 的对照参考，两边字段保持同名同义。

字段命名统一使用 snake_case，前端在 ``src/lib/types.ts`` 中镜像定义。
"""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

ContentStatus = Literal["draft", "published"]
# 兼容现有文章 / 杂谈路由里的命名；三类新内容复用同一组状态值。
PostStatus = ContentStatus

_UPLOAD_URL_PATTERN = re.compile(r"^https?://[^/]+(/uploads/.*)$")
_HTTP_URL_PATTERN = re.compile(r"^https?://\S+$")
_ASSET_URL_PATTERN = re.compile(r"^(?:https?://\S+|/(?!//)\S*)$")


def _normalize_cover_url(value: str | None) -> str | None:
    """把旧管理端可能写回的绝对上传地址归一为同源相对路径。"""
    if value:
        match = _UPLOAD_URL_PATTERN.match(value)
        if match:
            return match.group(1)
    return value


def _require_http_url(value: str) -> str:
    """项目仓库与友链地址只接受 http(s)，避免写入 javascript: 等协议。"""
    cleaned = value.strip()
    if not _HTTP_URL_PATTERN.match(cleaned):
        raise ValueError("必须是 http:// 或 https:// 开头的链接")
    return cleaned


def _require_asset_url(value: str) -> str:
    """图片地址只接受 http(s) 或站内绝对路径，避免写入脚本协议。"""
    normalized = _normalize_cover_url(value) or value
    cleaned = normalized.strip()
    if not _ASSET_URL_PATTERN.match(cleaned):
        raise ValueError("必须是 http(s) 链接或以 / 开头的站内路径")
    return cleaned


class NavItem(BaseModel):
    """顶部导航项。"""

    label: str = Field(description="展示文案")
    href: str = Field(description="站内路径或外链")


class SocialLink(BaseModel):
    """社交/联系方式。"""

    label: str = Field(description="展示文案")
    href: str = Field(description="完整链接")
    icon: str = Field(default="link", description="图标标识，前端据此映射图标组件")


class SiteConfig(BaseModel):
    """站点级配置：标题、导航、社交链接。"""

    name: str
    title: str
    description: str
    author: str
    nav: list[NavItem] = Field(default_factory=list)
    socials: list[SocialLink] = Field(default_factory=list)


class Profile(BaseModel):
    """博主个人资料卡。"""

    name: str
    avatar: str = Field(description="头像地址，可为站内静态资源或外链")
    headline: str = Field(description="一句话头衔")
    bio: str = Field(description="个人简介")
    location: str = ""
    skills: list[str] = Field(default_factory=list)


class PostSummary(BaseModel):
    """文章摘要，用于列表 / 卡片渲染。"""

    id: str
    slug: str
    title: str
    excerpt: str
    cover: str | None = None
    tags: list[str] = Field(default_factory=list)
    published_at: datetime
    reading_minutes: int = 5
    featured: bool = False


class PostDetail(PostSummary):
    """文章详情，在摘要基础上追加正文。"""

    body: str = ""


class TagStat(BaseModel):
    """标签及其文章数。"""

    name: str
    count: int


class SiteStats(BaseModel):
    """首页统计数字，数据由后端实时聚合，前端不写死。"""

    posts: int
    tags: int
    words: int
    since: int = Field(description="开始写作的年份")


class HomePayload(BaseModel):
    """首页聚合响应：一次请求拿齐首屏所需数据，减少串行请求。"""

    site: SiteConfig
    profile: Profile
    featured_posts: list[PostSummary]
    tags: list[TagStat]
    stats: SiteStats


class ChatTurn(BaseModel):
    """多轮对话里的一轮历史。"""

    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    """看板娘对话请求。history 只带当前消息之前的轮次。"""

    message: str = Field(min_length=1, max_length=200, description="用户这一轮说的话")
    history: list[ChatTurn] = Field(default_factory=list, max_length=6)


class ChatReply(BaseModel):
    """看板娘的回答、情绪，以及这句话适合的动作。"""

    reply: str
    emotion: Literal[
        "happy",
        "excited",
        "sad",
        "angry",
        "surprised",
        "shy",
        "thinking",
        "neutral",
    ]
    motion: Literal[
        "none",
        "nod",
        "shake_head",
        "wave",
        "smile",
        "laugh",
        "angry",
        "sad",
        "cry",
        "surprised",
        "think",
        "question",
        "serious",
        "wink",
        "pose",
    ]


# ---------------------------------------------------------------------------
# 杂谈（公开只读）
# ---------------------------------------------------------------------------


class TalkSummary(BaseModel):
    """杂谈摘要，字段与前端 ``Talk`` 保持一致。"""

    id: str
    slug: str
    title: str
    excerpt: str
    cover: str | None = None
    tags: list[str] = Field(default_factory=list)
    mood: str = ""
    published_at: datetime


class TalkDetail(TalkSummary):
    """杂谈详情，追加 Markdown 正文。"""

    body: str = ""


# ---------------------------------------------------------------------------
# 照片集 / 项目 / 友链（公开只读）
# ---------------------------------------------------------------------------


class PhotoItem(BaseModel):
    """照片集里的一张照片，字段与前端 ``PhotoItem`` 保持一致。"""

    id: str
    src: str
    alt: str = ""
    title: str = ""
    width: int
    height: int


class PhotoAlbum(BaseModel):
    """照片集，字段与前端 ``PhotoAlbum`` 保持一致。"""

    id: str
    slug: str
    title: str
    description: str = ""
    created_at: date
    photos: list[PhotoItem] = Field(default_factory=list)


class Project(BaseModel):
    """项目卡片，字段与前端 ``Project`` 保持一致。"""

    id: str
    title: str
    readme_title: str = ""
    tech_stack: list[str] = Field(default_factory=list)
    repo_url: str
    emoji: str = ""


class FriendLink(BaseModel):
    """友链卡片，字段与前端 ``FriendLink`` 保持一致。"""

    id: str
    name: str
    avatar: str
    bio: str = ""
    href: str


class MusicLyricLine(BaseModel):
    """一句带时间戳的歌词，``time`` 单位为秒。"""

    time: float = Field(ge=0)
    text: str = Field(min_length=1, max_length=500)


class MusicTrack(BaseModel):
    """音乐页曲目，字段与前端 ``MusicTrack`` 保持一致。"""

    id: str
    title: str
    artist: str
    duration: float
    cover: str
    audio_url: str | None = None
    lyrics: list[MusicLyricLine] = Field(default_factory=list)


class MomentLocation(BaseModel):
    """生活动态的位置，三段均可为空。"""

    province: str = ""
    city: str = ""
    district: str = ""


class MomentImage(BaseModel):
    """生活动态配图。宽高用于九宫格与灯箱在加载前占位。"""

    src: str
    alt: str = ""
    width: int
    height: int


class Moment(BaseModel):
    """生活动态，字段与前端 ``Moment`` 保持一致。"""

    id: str
    content: str
    images: list[MomentImage] = Field(default_factory=list)
    location: MomentLocation = Field(default_factory=MomentLocation)
    published_at: datetime


# ---------------------------------------------------------------------------
# 管理后台：写入模型
# ---------------------------------------------------------------------------


class PostWrite(BaseModel):
    """新建或更新文章。``reading_minutes`` 与发布时间由后端推导。"""

    slug: str = Field(
        min_length=1,
        max_length=200,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        description="小写字母、数字与连字符",
    )
    title: str = Field(min_length=1, max_length=300)
    excerpt: str = Field(default="", max_length=1000)
    cover: str | None = Field(default=None, max_length=500)
    body: str = ""
    tags: list[str] = Field(default_factory=list, max_length=20)
    status: PostStatus = "draft"
    featured: bool = False
    published_at: datetime | None = None

    @field_validator("cover")
    @classmethod
    def _normalize_cover(cls, value: str | None) -> str | None:
        return _normalize_cover_url(value)


class TalkWrite(BaseModel):
    """新建或更新杂谈。"""

    slug: str = Field(
        min_length=1,
        max_length=200,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        description="小写字母、数字与连字符",
    )
    title: str = Field(min_length=1, max_length=300)
    excerpt: str = Field(default="", max_length=1000)
    cover: str | None = Field(default=None, max_length=500)
    body: str = ""
    tags: list[str] = Field(default_factory=list, max_length=20)
    mood: str = Field(default="", max_length=100)
    status: PostStatus = "draft"
    published_at: datetime | None = None

    @field_validator("cover")
    @classmethod
    def _normalize_cover(cls, value: str | None) -> str | None:
        return _normalize_cover_url(value)


class PhotoItemWrite(BaseModel):
    """相册里的一张照片。宽高由上传接口返回，前端据此占位。"""

    src: str = Field(min_length=1, max_length=500)
    alt: str = Field(default="", max_length=300)
    title: str = Field(default="", max_length=300)
    width: int = Field(gt=0)
    height: int = Field(gt=0)

    @field_validator("src")
    @classmethod
    def _normalize_src(cls, value: str) -> str:
        return _require_asset_url(value)


class MomentImageWrite(BaseModel):
    """生活动态的一张配图。数组顺序即九宫格与灯箱顺序。"""

    src: str = Field(min_length=1, max_length=500)
    alt: str = Field(default="", max_length=300)
    width: int = Field(gt=0)
    height: int = Field(gt=0)

    @field_validator("src")
    @classmethod
    def _normalize_src(cls, value: str) -> str:
        return _require_asset_url(value)


class MomentLocationWrite(BaseModel):
    province: str = Field(default="", max_length=100)
    city: str = Field(default="", max_length=100)
    district: str = Field(default="", max_length=100)


class MomentWrite(BaseModel):
    """新建或更新生活动态。发布时间留空时由后端补当前时间。"""

    content: str = Field(min_length=1, max_length=5000)
    images: list[MomentImageWrite] = Field(default_factory=list)
    location: MomentLocationWrite = Field(default_factory=MomentLocationWrite)
    status: PostStatus = "draft"
    published_at: datetime | None = None


class PhotoAlbumWrite(BaseModel):
    """新建或更新照片集。照片数组顺序即展示顺序。"""

    slug: str = Field(
        min_length=1,
        max_length=200,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        description="小写字母、数字与连字符",
    )
    title: str = Field(min_length=1, max_length=300)
    description: str = Field(default="", max_length=2000)
    created_at: date
    status: ContentStatus = "draft"
    photos: list[PhotoItemWrite] = Field(min_length=1, max_length=200)


class ProjectWrite(BaseModel):
    """新建或更新项目卡片。"""

    title: str = Field(min_length=1, max_length=300)
    readme_title: str = Field(default="", max_length=300)
    tech_stack: list[str] = Field(default_factory=list, max_length=20)
    repo_url: str = Field(min_length=1, max_length=500)
    emoji: str = Field(default="", max_length=8)
    status: ContentStatus = "draft"

    @field_validator("repo_url")
    @classmethod
    def _validate_repo_url(cls, value: str) -> str:
        return _require_http_url(value)


class FriendLinkWrite(BaseModel):
    """新建或更新友链卡片。"""

    name: str = Field(min_length=1, max_length=300)
    avatar: str = Field(min_length=1, max_length=500)
    bio: str = Field(default="", max_length=1000)
    href: str = Field(min_length=1, max_length=500)
    status: ContentStatus = "draft"

    @field_validator("avatar")
    @classmethod
    def _normalize_avatar(cls, value: str) -> str:
        return _require_asset_url(value)

    @field_validator("href")
    @classmethod
    def _validate_href(cls, value: str) -> str:
        return _require_http_url(value)


class MusicTrackWrite(BaseModel):
    """新建或更新曲目。歌词顺序即展示顺序，数组内按时间自行排序。"""

    title: str = Field(min_length=1, max_length=300)
    artist: str = Field(min_length=1, max_length=300)
    duration: float = Field(gt=0, description="总时长（秒）")
    cover: str = Field(min_length=1, max_length=500)
    audio_url: str | None = Field(default=None, max_length=500)
    lyrics: list[MusicLyricLine] = Field(default_factory=list, max_length=1000)
    status: ContentStatus = "draft"

    @field_validator("cover")
    @classmethod
    def _normalize_cover(cls, value: str) -> str:
        return _require_asset_url(value)

    @field_validator("audio_url")
    @classmethod
    def _normalize_audio_url(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        return _require_asset_url(value)


# ---------------------------------------------------------------------------
# 管理后台：读取模型
# ---------------------------------------------------------------------------


class AdminPostSummary(BaseModel):
    """后台文章列表项，比公开摘要多了状态与时间戳。"""

    id: str
    slug: str
    title: str
    excerpt: str
    cover: str | None = None
    tags: list[str] = Field(default_factory=list)
    status: PostStatus
    featured: bool = False
    reading_minutes: int = 1
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class AdminPostDetail(AdminPostSummary):
    body: str = ""


class AdminTalkSummary(BaseModel):
    """后台杂谈列表项。"""

    id: str
    slug: str
    title: str
    excerpt: str
    cover: str | None = None
    tags: list[str] = Field(default_factory=list)
    mood: str = ""
    status: PostStatus
    reading_minutes: int = 1
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class AdminTalkDetail(AdminTalkSummary):
    body: str = ""


class AdminPhotoAlbumSummary(BaseModel):
    """后台照片集列表项：列表卡片只需要首图和照片数。"""

    id: str
    slug: str
    title: str
    description: str = ""
    created_at: date
    status: ContentStatus
    sort_order: int = 0
    photo_count: int = 0
    cover: str | None = None
    updated_at: datetime


class AdminPhotoAlbumDetail(AdminPhotoAlbumSummary):
    photos: list[PhotoItem] = Field(default_factory=list)


class AdminProjectSummary(Project):
    """后台项目列表项，比公开卡片多了状态与时间戳。"""

    status: ContentStatus
    sort_order: int = 0
    created_at: datetime
    updated_at: datetime


class AdminProjectDetail(AdminProjectSummary):
    pass


class AdminFriendLinkSummary(FriendLink):
    """后台友链列表项。"""

    status: ContentStatus
    sort_order: int = 0
    created_at: datetime
    updated_at: datetime


class AdminFriendLinkDetail(AdminFriendLinkSummary):
    pass


class AdminMusicTrackSummary(BaseModel):
    """后台曲目列表项：列表只需要封面、时长与歌词行数。"""

    id: str
    title: str
    artist: str
    duration: float
    cover: str
    audio_url: str | None = None
    lyric_count: int = 0
    status: ContentStatus
    sort_order: int = 0
    created_at: datetime
    updated_at: datetime


class AdminMusicTrackDetail(AdminMusicTrackSummary):
    lyrics: list[MusicLyricLine] = Field(default_factory=list)


class AdminMomentSummary(BaseModel):
    """后台生活动态列表项：列表卡片需要首图与图片数量。"""

    id: str
    content: str
    images: list[MomentImage] = Field(default_factory=list)
    location: MomentLocation = Field(default_factory=MomentLocation)
    status: ContentStatus
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class AdminMomentDetail(AdminMomentSummary):
    pass


# ---------------------------------------------------------------------------
# 管理后台：登录与上传
# ---------------------------------------------------------------------------


class AdminLoginRequest(BaseModel):
    password: str = Field(min_length=1, max_length=200)


class AdminSession(BaseModel):
    authenticated: bool


class UploadResult(BaseModel):
    url: str
    width: int
    height: int


class AudioUploadResult(BaseModel):
    url: str