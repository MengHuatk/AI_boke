/**
 * 前端类型定义。
 *
 * ⚠️ 这些接口与后端 `backend/app/models/schemas.py` 一一对应，
 *    字段名保持完全一致（snake_case），改动时请两边同步。
 *    后续接入 OpenAPI 代码生成后，本文件可改为自动生成。
 */

export interface NavItem {
  label: string;
  href: string;
}

export interface SocialLink {
  label: string;
  href: string;
  /** 图标标识，在 components/ui/Icon.tsx 中映射到具体图标 */
  icon: string;
}

/** 站点级配置：标题、导航、社交链接 */
export interface SiteConfig {
  name: string;
  title: string;
  description: string;
  author: string;
  nav: NavItem[];
  socials: SocialLink[];
}

/** 博主资料卡 */
export interface Profile {
  name: string;
  avatar: string;
  headline: string;
  bio: string;
  location: string;
  skills: string[];
}

/**
 * 友链。
 *
 * 数据来自后端 `/api/v1/links`；字段与后端 FriendLink 保持一致。
 */
export interface FriendLink {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  href: string;
}

/** 文章摘要，用于列表与卡片 */
export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover: string | null;
  tags: string[];
  /** ISO 日期时间字符串，如 "2026-09-28T14:05:09" */
  published_at: string;
  reading_minutes: number;
  featured: boolean;
}

/** 文章详情 */
export interface PostDetail extends PostSummary {
  body: string;
}

/** 标签及其文章数 */
export interface TagStat {
  name: string;
  count: number;
}

/** 站点统计数字 */
export interface SiteStats {
  posts: number;
  tags: number;
  words: number;
  since: number;
}

/** 首页聚合响应 */
export interface HomePayload {
  site: SiteConfig;
  profile: Profile;
  featured_posts: PostSummary[];
  tags: TagStat[];
  stats: SiteStats;
}

/**
 * 单张照片。
 *
 * 数据来自后端 `/api/v1/albums`；width / height 用于 next/image
 * 计算比例，也让瀑布流在图片加载前就能占住正确的高度。
 */
export interface PhotoItem {
  id: string;
  src: string;
  alt: string;
  /** 展示用照片名，详情页 hover 遮罩显示 */
  title: string;
  width: number;
  height: number;
}

/** 照片集：画廊里的一个相册，包含若干张照片 */
export interface PhotoAlbum {
  id: string;
  slug: string;
  title: string;
  description: string;
  /** 创建日期，yyyy-mm-dd */
  created_at: string;
  photos: PhotoItem[];
}

/** 项目卡片，数据来自后端 `/api/v1/projects` */
export interface Project {
  id: string;
  /** GitHub 仓库标题 */
  title: string;
  /** README 首个标题行，卡片描述 */
  readme_title: string;
  /** 技术栈标签 */
  tech_stack: string[];
  /** GitHub 仓库地址 */
  repo_url: string;
  /** 可选：手动指定图标；留空则按 id 稳定选取 */
  emoji: string;
}

/**
 * 说说（生活动态）。
 *
 * 数据来自后端 `/api/v1/moments`；字段与后端 Moment 保持一致。
 */
export interface MomentLocation {
  province: string;
  city: string;
  district: string;
}

/** 说说配图：卡片里裁成 100px 方块，灯箱按原始比例显示 */
export interface MomentImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/** 一条生活动态 */
export interface Moment {
  id: string;
  /** 正文，保留换行 */
  content: string;
  images: MomentImage[];
  location: MomentLocation;
  /** ISO 日期时间字符串，如 "2026-11-02T09:15:00" */
  published_at: string;
}

/** 说说作者：头像 + 名字 */
export interface MomentAuthor {
  name: string;
  avatar: string;
}

/**
 * 一篇杂谈。
 *
 * 数据来自后端 `/api/v1/talks`；字段与后端 TalkSummary 保持一致。
 */
export interface Talk {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover: string | null;
  tags: string[];
  /** 发布时的心情，如 "✨平静"、"✨emo" */
  mood: string;
  /** ISO 日期时间字符串，如 "2026-10-30T21:10:00" */
  published_at: string;
}

/** 杂谈详情：在卡片摘要之外补上 Markdown 正文 */
export interface TalkDetail extends Talk {
  body: string;
}

/** 数据来源标记：来自后端接口，还是本地兜底数据 */
export type DataSource = "api" | "fallback";

export interface DataResult<T> {
  data: T;
  source: DataSource;
}

/** 看板娘回答的情绪，和后端 ChatReply.emotion 一一对应 */
export type AnonEmotion =
  | "happy"
  | "excited"
  | "sad"
  | "angry"
  | "surprised"
  | "shy"
  | "thinking"
  | "neutral";

/** AI 回答时挑选的语义动作，前端再映射到具体模型动作组 */
export type AnonMotion =
  | "none"
  | "nod"
  | "shake_head"
  | "wave"
  | "smile"
  | "laugh"
  | "angry"
  | "sad"
  | "cry"
  | "surprised"
  | "think"
  | "question"
  | "serious"
  | "wink"
  | "pose";

/** 多轮对话里的一轮历史 */
export interface AnonChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** 看板娘对话接口的响应 */
export interface AnonChatReply {
  reply: string;
  emotion: AnonEmotion;
  motion: AnonMotion;
}