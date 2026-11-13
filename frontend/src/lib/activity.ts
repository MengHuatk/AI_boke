/**
 * 关于页「思绪动态」的数据拼装。
 *
 * 文章、杂谈与说说都来自后端接口；
 * 这里只保留时间轴需要的四个字段，不把正文带进客户端。
 */

import type { Moment, PostSummary, Talk } from "@/lib/types";

export type ActivityKind = "post" | "talk" | "moment";

/** 时间轴上的一条动态：类型、标题（说说没有）、跳转目标和发布时间 */
export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string | null;
  href: string;
  published_at: string;
}

/** 把杂谈与说说转成时间轴条目，由服务端调用一次，结果作为静态 props 下发 */
export function toStaticActivity(
  talks: Talk[],
  moments: Moment[],
): ActivityItem[] {
  return [
    ...talks.map((talk) => ({
      id: `talk-${talk.id}`,
      kind: "talk" as const,
      title: talk.title,
      href: `/talks/${talk.slug}`,
      published_at: talk.published_at,
    })),
    ...moments.map((moment) => ({
      id: `moment-${moment.id}`,
      kind: "moment" as const,
      title: null,
      href: "/moments",
      published_at: moment.published_at,
    })),
  ];
}

/** 最新文章 + 固定的杂谈/说说，合成一条按时间倒序的动态流 */
export function buildActivity(
  posts: PostSummary[],
  staticItems: ActivityItem[],
): ActivityItem[] {
  return [
    ...posts.map((post) => ({
      id: `post-${post.id}`,
      kind: "post" as const,
      title: post.title,
      href: `/posts/${post.slug}`,
      published_at: post.published_at,
    })),
    ...staticItems,
  ].sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
}
