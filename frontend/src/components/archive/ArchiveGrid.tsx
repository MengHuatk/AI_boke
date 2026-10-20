import { ArchiveCard } from "@/components/archive/ArchiveCard";
import type { PostSummary } from "@/lib/types";

/**
 * 测试用文章数据。真实归档数据接入后整块删除，
 * 由 ArchiveGrid 收后端返回的 PostSummary[] 替代。
 * cover 故意两种状态都有：非 null 跑图片分支，null 跑占位分支。
 */
const TEST_POSTS: PostSummary[] = [
  {
    id: "t-001",
    slug: "cpp-coroutine-notes",
    title: "C++ 协程从语法到调度",
    excerpt: "promise_type 不是玄学，把它拆开看每一步都做了什么。",
    cover: "/images/backgrounds/01.jpg",
    tags: ["C++", "学习", "后端"],
    published_at: "2026-07-15",
    reading_minutes: 12,
    featured: false,
  },
  {
    id: "t-002",
    slug: "work-retro-quarterly",
    title: "季度复盘：慢下来的三个月",
    excerpt: "进度条没走多远，但把地基重新打了一遍。",
    cover: null,
    tags: ["工作", "随笔"],
    published_at: "2026-04-02",
    reading_minutes: 6,
    featured: false,
  },
  {
    id: "t-003",
    slug: "nextjs-image-pitfalls",
    title: "next/image 的那些坑",
    excerpt: "fill、sizes、priority 三个参数组合起来的隐藏规则。",
    cover: "/images/backgrounds/02.jpg",
    tags: ["Next.js", "前端", "学习"],
    published_at: "2026-09-20",
    reading_minutes: 9,
    featured: false,
  },
  {
    id: "t-004",
    slug: "study-method-notes",
    title: "学习笔记该记成什么样",
    excerpt: "抄板书不如写问题，回顾时才知道该从哪里想起。",
    cover: null,
    tags: ["学习", "方法"],
    published_at: "2025-11-08",
    reading_minutes: 5,
    featured: false,
  },
  {
    id: "t-005",
    slug: "fastapi-background-tasks",
    title: "FastAPI 后台任务的第一版写法",
    excerpt: "BackgroundTasks 够用，但边界在哪要提前想清楚。",
    cover: "/images/backgrounds/03.jpg",
    tags: ["Python", "FastAPI", "工作"],
    published_at: "2025-06-27",
    reading_minutes: 8,
    featured: false,
  },
  {
    id: "t-006",
    slug: "fastapi-background-tasks-2",
    title: "FastAPI 后台任务的第一版写法",
    excerpt: "BackgroundTasks 够用，但边界在哪要提前想清楚。",
    cover: "/images/backgrounds/03.jpg",
    tags: ["Python", "FastAPI", "工作"],
    published_at: "2025-06-27",
    reading_minutes: 8,
    featured: false,
  },
  {
    id: "t-007",
    slug: "fastapi-background-tasks-3",
    title: "FastAPI 后台任务的第一版写法",
    excerpt: "BackgroundTasks 够用，但边界在哪要提前想清楚。",
    cover: "/images/backgrounds/03.jpg",
    tags: ["Python", "FastAPI", "工作"],
    published_at: "2025-06-27",
    reading_minutes: 8,
    featured: false,
  },
  {
    id: "t-008",
    slug: "fastapi-background-tasks-4",
    title: "FastAPI 后台任务的第一版写法",
    excerpt: "BackgroundTasks 够用，但边界在哪要提前想清楚。",
    cover: "/images/backgrounds/03.jpg",
    tags: ["Python", "FastAPI", "工作"],
    published_at: "2025-06-27",
    reading_minutes: 8,
    featured: false,
  },
  {
    id: "t-009",
    slug: "fastapi-background-tasks-5",
    title: "FastAPI 后台任务的第一版写法",
    excerpt: "BackgroundTasks 够用，但边界在哪要提前想清楚。",
    cover: "/images/backgrounds/03.jpg",
    tags: ["Python", "FastAPI", "工作"],
    published_at: "2025-06-27",
    reading_minutes: 8,
    featured: false,
  },
  {
    id: "t-010",
    slug: "fastapi-background-tasks-6",
    title: "FastAPI 后台任务的第一版写法",
    excerpt: "BackgroundTasks 够用，但边界在哪要提前想清楚。",
    cover: "/images/backgrounds/03.jpg",
    tags: ["Python", "FastAPI", "工作"],
    published_at: "2025-06-27",
    reading_minutes: 8,
    featured: false,
  },
  {
    id: "t-011",
    slug: "fastapi-background-tasks-7",
    title: "FastAPI 后台任务的第一版写法",
    excerpt: "BackgroundTasks 够用，但边界在哪要提前想清楚。",
    cover: "/images/backgrounds/03.jpg",
    tags: ["Python", "FastAPI", "工作"],
    published_at: "2025-06-27",
    reading_minutes: 8,
    featured: false,
  },
  {
    id: "t-012",
    slug: "fastapi-background-tasks-8",
    title: "FastAPI 后台任务的第一版写法",
    excerpt: "BackgroundTasks 够用，但边界在哪要提前想清楚。",
    cover: "/images/backgrounds/03.jpg",
    tags: ["Python", "FastAPI", "工作"],
    published_at: "2025-06-27",
    reading_minutes: 8,
    featured: false,
  },
  {
    id: "t-013",
    slug: "fastapi-background-tasks-9",
    title: "FastAPI 后台任务的第一版写法",
    excerpt: "BackgroundTasks 够用，但边界在哪要提前想清楚。",
    cover: "/images/backgrounds/03.jpg",
    tags: ["Python", "FastAPI", "工作"],
    published_at: "2025-06-27",
    reading_minutes: 8,
    featured: false,
  },
];

/**
 * 归档栅格（944px 容器，一行 3 张，等间距）。
 *
 * 作为 ArchiveBanner 的 flex-1 子项吃满标题以下的剩余高度：
 * 可见行数 = 当前视口放得下的行数，超出的行不撑高容器，
 * 而是在本容器内纵向滚动。滚动条由 globals.css 的 .archive-scroll
 * 染色：深紫圆条，hover / 拖动变浅紫。
 *
 * 目前渲染的是内置测试数据：cover 故意两种状态都有——
 * 非 null 跑图片分支，null 跑占位分支。
 *
 * 后续接入真实档案时：删掉 TEST_POSTS，本组件改为收 PostSummary[]
 * （或由服务端组件取数后传入），布局骨架不动。
 */
export function ArchiveGrid() {
  return (
    <div className="archive-scroll min-h-0 w-full max-w-[944px] flex-1 overflow-y-auto">
      <ul className="grid grid-cols-3 justify-items-center gap-6">
        {TEST_POSTS.map((post) => (
          <ArchiveCard key={post.id} post={post} />
        ))}
      </ul>
    </div>
  );
}
