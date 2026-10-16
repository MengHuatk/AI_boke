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

/** 文章摘要，用于列表与卡片 */
export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover: string | null;
  tags: string[];
  /** ISO 日期字符串，如 "2026-09-28" */
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

/** 数据来源标记：来自后端接口，还是本地兜底数据 */
export type DataSource = "api" | "fallback";

export interface DataResult<T> {
  data: T;
  source: DataSource;
}