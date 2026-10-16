"""API 响应模型。

这些模型同时承担两个职责：
1. 约束后端返回结构，避免接口随手改动导致前端崩溃；
2. 作为前端 ``src/lib/types.ts`` 的对照参考，两边字段保持同名同义。

字段命名统一使用 snake_case，前端在 ``src/lib/types.ts`` 中镜像定义。
"""

from __future__ import annotations

from datetime import date

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
    published_at: date
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