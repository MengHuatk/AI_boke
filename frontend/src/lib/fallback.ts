/**
 * 本地兜底数据。
 *
 * 用途：后端未启动 / 请求超时 / 接口报错时，首页依然能完整渲染，
 *       方便单独调样式、跑静态导出，也避免开发时看到一片白屏。
 *
 * ⚠️ 这里只放「够渲染」的最小内容。真实内容以 backend/app/data/*.json 为准，
 *    不要把这里当成第二份内容源来维护。
 */

import type { HomePayload, PostDetail } from "@/lib/types";

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

/**
 * 单篇文章正文的兜底：与首页同套路——后端没起、或归档 fixture
 * 的虚构 slug 撞进来时，文章页依然完整可读。
 *
 * body 特意带上 h2/h3、代码块与列表，够当目录盒、段落盒渲染的活教材。
 */
export const fallbackPostDetail: PostDetail = {
  id: "demo-post",
  slug: "terminal-log-gardening",
  title: "在终端日志里种花：一次面向过去的园艺",
  excerpt: "把废弃的运行时日志翻成土壤记录，让三千行报错开出第一篇园艺笔记。",
  cover: "/images/backgrounds/01.jpg",
  tags: ["随笔", "终端", "复盘"],
  published_at: "2026-09-20T21:34:07",
  reading_minutes: 6,
  featured: false,
  body: `## 起点：一份没人读的遗书

三年前的那次断电事故，把一整台开发机的运行时状态冻在了几千行终端日志里。当时只顾着抢救数据，等三个月后回头看，那些报错信息反倒成了最诚实的日记——不是我们想成为的样子，而是我们当时真实的样子。

## 工具与选型

园艺先松土。解析这份日志，只需要三件趁手工具：

- **解析层**：逐行状态机，够笨也够快，任何一行坏了都不拖垮下一行
- **存储层**：SQLite，单文件，好埋也好挖
- **渲染层**：\`react-markdown\` 加 \`remark-gfm\`，写完即所见

### 一个更小的插曲

状态机写到第七天的时候，我们发现日志里有 0.3% 的行是 UTF-8 半截字符。修不修？修了。这就是所谓花园里捉虫。

## 落地的样子

松土、播种、浇水，三步之内数据就该冒头：

\`\`\`ts
const soil = parseLogs(raw, { tolerant: true });
const bed = soil.byDay();
plot(bed, { into: "garden.svg", palette: "dusk" });
\`\`\`

跑通那一晚，图渲染出来的第一帧，所有人都安静了几秒——三千行报错，最后开出了一朵灰蓝色的、有点歪的花。

## 尾声

面向过去做园艺，修剪的是自己的记忆，施肥的是后来的工程习惯。日志会过期，但土壤永远留得住下一粒种子。`,
};