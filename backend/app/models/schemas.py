"""API 响应模型。

这些模型同时承担两个职责：
1. 约束后端返回结构，避免接口随手改动导致前端崩溃；
2. 作为前端 ``src/lib/types.ts`` 的对照参考，两边字段保持同名同义。

字段命名统一使用 snake_case，前端在 ``src/lib/types.ts`` 中镜像定义。
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


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
# 管理后台：写入模型
# ---------------------------------------------------------------------------

PostStatus = Literal["draft", "published"]


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