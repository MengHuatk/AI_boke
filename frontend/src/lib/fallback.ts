/**
 * 本地兜底数据。
 *
 * 用途：后端未启动 / 请求超时 / 接口报错时，首页依然能完整渲染，
 *       方便单独调样式、跑静态导出，也避免开发时看到一片白屏。
 *
 * ⚠️ 这里只放「够渲染」的最小内容。真实内容以 backend/app/data/*.json 为准，
 *    不要把这里当成第二份内容源来维护。
 */

import type { HomePayload } from "@/lib/types";

export const fallbackHome: HomePayload = {
  site: {
    name: "个人博客",
    title: "梦华の小站",
    description: "世上只有一种英雄主义，那就是认清生活之后依旧热爱生活的人。",
    author: "梦华",
    nav: [
      { label: "首页", href: "/" },
      { label: "项目", href: "/projects" },
      { label: "归档", href: "/archive" },
      { label: "照片墙", href: "/photos" },
      { label: "音乐", href: "/music" },
      { label: "灵境", href: "/realm" },
      { label: "说说", href: "/moments" },
      { label: "杂谈", href: "/talks" },
      { label: "友链", href: "/links" },
      { label: "关于", href: "/about" },
    ],
    socials: [
      { label: "GitHub", href: "https://github.com/", icon: "github" },
      { label: "邮箱", href: "mailto:hello@example.com", icon: "mail" },
      { label: "RSS", href: "/rss.xml", icon: "rss" },
    ],
  },

  profile: {
    name: "梦华",
    avatar: "/avatar.jpg",
    headline: "全栈工程师 · 独立开发者",
    bio: "一位努力生活在普通中的普通人",
    location: "成都",
    skills: ["TypeScript", "React", "Next.js", "Python", "FastAPI", "Tailwind CSS"],
  },

  featured_posts: [
    {
      id: "p-001",
      slug: "glassmorphism-in-practice",
      title: "毛玻璃不是加个 backdrop-blur 就完事了",
      excerpt:
        "半透明面板谁都会写，难的是让它在深色背景、浅色背景、以及用户那台偏色的显示器上都好看。",
      cover: null,
      tags: ["设计", "CSS", "前端"],
      published_at: "2026-09-28T10:22:41",
      reading_minutes: 8,
      featured: true,
    },
    {
      id: "p-002",
      slug: "nextjs-app-router-notes",
      title: "App Router 用了两年，我留下了这五条习惯",
      excerpt:
        "服务端组件不是银弹，客户端组件也不该被妖魔化。真正的分界线是「这个组件需不需要交互状态」。",
      cover: null,
      tags: ["Next.js", "React", "前端"],
      published_at: "2026-09-12T19:03:55",
      reading_minutes: 11,
      featured: true,
    },
    {
      id: "p-003",
      slug: "fastapi-project-layout",
      title: "FastAPI 项目该怎么分层，才不会三个月后推倒重来",
      excerpt:
        "分层的目的不是好看，而是让你换数据库的那一天只改一个文件。路由层不碰 SQL，仓储层不碰 HTTP。",
      cover: null,
      tags: ["Python", "FastAPI", "后端"],
      published_at: "2026-08-30T08:47:12",
      reading_minutes: 9,
      featured: true,
    },
  ],

  tags: [
    { name: "前端", count: 3 },
    { name: "CSS", count: 2 },
    { name: "Next.js", count: 1 },
    { name: "React", count: 1 },
    { name: "Python", count: 1 },
    { name: "FastAPI", count: 1 },
    { name: "后端", count: 1 },
    { name: "设计", count: 1 },
    { name: "Tailwind", count: 1 },
    { name: "随笔", count: 1 },
  ],

  stats: {
    posts: 5,
    tags: 10,
    words: 1208,
    since: 2026,
  },
};