"use client";

import Image from "next/image";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { GiscusComments } from "@/components/post/GiscusComments";
import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import {
  buildActivity,
  type ActivityItem,
  type ActivityKind,
} from "@/lib/activity";
import {
  ABOUT_ACCENT,
  ABOUT_BANNER,
  ABOUT_GREETING,
  ABOUT_INTRO,
  ABOUT_LINK,
} from "@/lib/about-fixtures";
import { fetchPosts } from "@/lib/api";
import { cn, formatTimelineTime } from "@/lib/format";
import type { PostSummary } from "@/lib/types";

type AboutTab = "intro" | "moments";

const TABS: { key: AboutTab; label: string }[] = [
  { key: "intro", label: "自我介绍" },
  { key: "moments", label: "思绪动态" },
];

/** 轮询间隔：与后端 60s 的页面缓存相比，30s 能更快看到新文章 */
const SYNC_INTERVAL_MS = 30_000;

/** NEW 徽标的有效期：发布时间在 24 小时内 */
const NEW_WINDOW_MS = 24 * 60 * 60 * 1000;

/** 三种动态各自的文案与颜色 */
const KIND_META: Record<
  ActivityKind,
  { label: string; text: string; dot: string; glow: string }
> = {
  post: {
    label: "更新了文章",
    text: "text-[#7DD3FC]",
    dot: "bg-[#7DD3FC]",
    glow: "shadow-[0_0_10px_rgba(125,211,252,0.75)]",
  },
  talk: {
    label: "更新了杂谈",
    text: "text-[#A78BFA]",
    dot: "bg-[#A78BFA]",
    glow: "shadow-[0_0_10px_rgba(167,139,250,0.75)]",
  },
  moment: {
    label: "发布了说说",
    text: "text-[#F9A8D4]",
    dot: "bg-[#F9A8D4]",
    glow: "shadow-[0_0_10px_rgba(249,168,212,0.75)]",
  },
};

/** 服务端没有 layout 阶段，用 useEffect 顶上，避免 React 的 SSR 告警 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

interface AboutCardProps {
  /** 与首页 Hero 同一个来源，保证两处头像一致 */
  avatar: string;
  /** 时间轴里的作者名，同样来自 profile */
  authorName: string;
  /** 服务端取到的最近文章，客户端轮询时以此作为起点 */
  initialPosts: PostSummary[];
  /** 杂谈与说说的轻量条目，服务端映射好再下发 */
  staticItems: ActivityItem[];
}

/**
 * 关于页主体（/about）：895px 玻璃大盒，高度随内容撑开。
 *
 * 自上而下：256px 横幅 → 骑缝头像 → 766×88 头部区（标题、副标题、
 * 标签切换）→ 深灰细线 → 内容区 → Giscus 评论区。
 *
 * 横幅拆成两层：外层 .about-drift 做极缓慢的待机漂移，内层图片负责
 * hover 的 1.15 倍放大。两个 transform 放在不同节点，动画才不会把
 * hover 的缩放覆盖掉。
 *
 * 标签切换时，外层容器先锁住旧高度，内层按 tab 重挂载；layout 阶段
 * 测出新内容高度后再把容器高度改过去，形成 300ms 的高度过渡，避免
 * 两个标签内容不等高时页面整体跳一下。内容本身的错峰只在用户点击
 * 后挂上 .about-line——首访不播透明度动画，免得被 View Transitions
 * 拍成透明快照。
 */
export function AboutCard({
  avatar,
  authorName,
  initialPosts,
  staticItems,
}: AboutCardProps) {
  const [tab, setTab] = useState<AboutTab>("intro");
  const [animate, setAnimate] = useState(false);
  const [posts, setPosts] = useState(initialPosts);
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());
  const [enterIds, setEnterIds] = useState<Set<string>>(() => new Set());
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const seenIdsRef = useRef(
    new Set(initialPosts.map((post) => `post-${post.id}`)),
  );

  const activity = useMemo(
    () => buildActivity(posts, staticItems),
    [posts, staticItems],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  // 切到「思绪动态」时拉一次最新文章，之后每 30s 同步；
  // 只有新出现的文章才标记 NEW 并播放滑入。
  useEffect(() => {
    if (tab !== "moments") return;

    let cancelled = false;
    let clearTimer: number | null = null;

    async function syncPosts() {
      try {
        const next = await fetchPosts({ limit: 20 });
        if (cancelled) return;

        const fresh = next
          .map((post) => `post-${post.id}`)
          .filter((id) => !seenIdsRef.current.has(id));

        next.forEach((post) => seenIdsRef.current.add(`post-${post.id}`));
        setPosts(next);

        if (fresh.length === 0) return;

        setNewIds((prev) => new Set([...prev, ...fresh]));
        setEnterIds((prev) => new Set([...prev, ...fresh]));
        clearTimer = window.setTimeout(() => {
          setEnterIds((prev) => {
            const remaining = new Set(prev);
            fresh.forEach((id) => remaining.delete(id));
            return remaining;
          });
        }, 900);
      } catch {
        // 后端暂时不可用就保留上一份数据，下一轮再试
      }
    }

    void syncPosts();
    const timer = window.setInterval(syncPosts, SYNC_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      if (clearTimer !== null) window.clearTimeout(clearTimer);
    };
  }, [tab]);

  useIsomorphicLayoutEffect(() => {
    const stage = stageRef.current;
    const content = contentRef.current;

    // 首访没有在切换入口锁高，直接让内容自然撑开
    if (!stage || !content || !stage.style.height) return;

    const nextHeight = content.offsetHeight;
    void stage.offsetHeight; // 先让浏览器记住旧高度，再改目标值
    stage.style.height = `${nextHeight}px`;

    const handleEnd = (event: TransitionEvent) => {
      if (event.propertyName !== "height") return;
      stage.style.height = "";
    };

    stage.addEventListener("transitionend", handleEnd);
    return () => stage.removeEventListener("transitionend", handleEnd);
  }, [tab]);

  function selectTab(next: AboutTab) {
    if (next === tab) return;

    const stage = stageRef.current;
    if (stage) stage.style.height = `${stage.offsetHeight}px`;

    setAnimate(true);
    setTab(next);

    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    // 11 行文字最长延迟约 1050ms，留到 1400ms 再摘类名
    timerRef.current = window.setTimeout(() => setAnimate(false), 1400);
  }

  return (
    <section aria-label="关于我" className="mx-auto w-full max-w-[895px]">
      <div className="glass-panel overflow-hidden rounded-glass">
        {/* 横幅：外层待机漂移，内层 hover 放大 */}
        <div className="group relative h-[256px] overflow-hidden">
          <div className="about-drift absolute inset-0">
            <Image
              src={ABOUT_BANNER}
              alt=""
              fill
              priority
              sizes="(max-width: 895px) 100vw, 895px"
              className="object-cover transition-transform duration-[2500ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.1]"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/35" />
        </div>

        {/* 头像：中心点压在横幅底边，左缘与下方 766px 内容列对齐 */}
        <div className="relative z-10 -mt-[68px] mx-auto w-full max-w-[766px] px-5 sm:px-8 lg:px-0">
          <div className="relative w-fit">
            <span
              aria-hidden="true"
              className="avatar-halo pointer-events-none absolute -inset-4 rounded-full blur-xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(144,110,255,0.55) 0%, rgba(144,110,255,0) 70%)",
              }}
            />
            <div className="relative rounded-full bg-gradient-to-br from-[#5D4CC2] to-[#A656DB] p-[4px] shadow-[0_10px_30px_-10px_rgba(93,76,194,0.8)]">
              <Image
                src={avatar}
                alt="梦华"
                width={128}
                height={128}
                unoptimized
                className="block size-32 rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* 766px 内容列：头部区、分割线、标签内容、评论区 */}
        <div className="mx-auto w-full max-w-[766px] px-5 sm:px-8 lg:px-0">
          <div className="flex flex-col gap-4 py-5 sm:h-[88px] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-0">
            <div className="flex flex-col gap-1">
              <h1 className="font-xiaowei text-[50px] leading-none text-white/90">
                关于我
              </h1>
              <p className="font-xiaowei text-[20px] text-[#957DFF] tracking-[3px]">
                {ABOUT_GREETING}
              </p>
            </div>

            <div
              role="group"
              aria-label="切换关于页内容"
              className="glass-panel-subtle relative flex h-10 w-[184px] shrink-0 rounded-full p-1"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%_-_4px)] rounded-full bg-gradient-to-br from-brand-500/90 to-brand-600/90 shadow-[0_4px_14px_-6px_var(--color-brand-500)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  tab === "moments" && "translate-x-full",
                )}
              />
              {TABS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={tab === item.key}
                  onClick={() => selectTab(item.key)}
                  className={cn(
                    "relative z-10 flex-1 rounded-full text-[13px] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
                    tab === item.key
                      ? "text-white"
                      : "text-white/55 hover:text-white/80",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-white/10" />

          {/* 高度过渡容器：内层按 tab 重挂载，切换时从旧高度滑到新高度 */}
          <div
            ref={stageRef}
            className="overflow-hidden transition-[height] duration-300 ease-out"
          >
            <div ref={contentRef} key={tab}>
              {tab === "intro" ? (
                <div className="py-8">
                  {/* 问候：星形起笔 + 向右淡出的星轨线 */}
                  <div
                    className={cn(
                      "flex items-center gap-3",
                      animate && "about-line",
                    )}
                    style={{ "--i": 0 } as CSSProperties}
                  >
                    <Icon
                      name="sparkle"
                      size={20}
                      className="shrink-0 text-brand-300 drop-shadow-[0_0_10px_rgba(144,110,255,0.7)]"
                    />
                    <p className="font-xiaowei text-[26px] leading-tight text-white/95 [text-shadow:0_0_20px_rgba(144,110,255,0.3)]">
                      {ABOUT_INTRO.greeting}
                    </p>
                    <span
                      aria-hidden="true"
                      className="h-px min-w-8 flex-1 bg-gradient-to-r from-brand-300/50 via-white/10 to-transparent"
                    />
                  </div>

                  <div className="mt-5 flex flex-col gap-2">
                    {ABOUT_INTRO.body.map((line, index) => (
                      <p
                        key={line}
                        className={cn(
                          "font-xiaowei text-[16px] leading-8 text-white/70",
                          animate && "about-line",
                        )}
                        style={{ "--i": index + 1 } as CSSProperties}
                      >
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* 致谢：弱化的小字，名字带渐变下划线，hover 时发光 */}
                  <p
                    className={cn(
                      "mt-6 font-xiaowei text-[13px] leading-7 text-white/45",
                      animate && "about-line",
                    )}
                    style={
                      {
                        "--i": ABOUT_INTRO.body.length + 1,
                      } as CSSProperties
                    }
                  >
                    {ABOUT_INTRO.thanks.before}
                    <SmartLink
                      href={ABOUT_LINK.href}
                      className="bg-gradient-to-r from-[#A9A4FF] via-[#C4B5FD] to-[#7DD3FC] bg-[length:100%_1px] bg-bottom bg-no-repeat pb-px font-medium text-white/85 transition-[background-size,color,filter] duration-300 hover:bg-[length:100%_2px] hover:text-white hover:drop-shadow-[0_0_8px_rgba(169,164,255,0.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
                    >
                      {ABOUT_LINK.label}
                    </SmartLink>
                    {ABOUT_INTRO.thanks.after}
                  </p>

                  {/* 诗句：左侧淡紫引文线，顶端一颗亮点 */}
                  <div className="relative mt-8 pl-5">
                    <span
                      aria-hidden="true"
                      className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-brand-300/80 via-brand-500/35 to-transparent"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute -left-[3px] top-1 size-[7px] rounded-full bg-brand-300 shadow-[0_0_10px_2px_rgba(144,110,255,0.6)]"
                    />
                    {ABOUT_INTRO.poem.map((line, index) => (
                      <p
                        key={line}
                        className={cn(
                          "font-xiaowei text-[16px] leading-9 text-white/75",
                          animate && "about-line",
                        )}
                        style={
                          {
                            "--i": ABOUT_INTRO.body.length + 2 + index,
                          } as CSSProperties
                        }
                      >
                        <AccentedLine text={line} />
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-7">
                  <ol
                    className={cn(
                      "relative flex flex-col gap-[30px]",
                      animate && "about-line",
                    )}
                    style={{ "--i": 0 } as CSSProperties}
                  >
                    {/* 轨道：从第一个节点连到最后一个节点 */}
                    <span
                      aria-hidden="true"
                      className="absolute top-[37px] bottom-[37px] left-[11px] w-px bg-gradient-to-b from-brand-300/40 via-white/10 to-transparent"
                    />

                    {activity.map((item, index) => {
                      const meta = KIND_META[item.kind];

                      return (
                        <li
                          key={item.id}
                          className={cn(
                            "relative flex",
                            enterIds.has(item.id) && "activity-enter",
                          )}
                        >
                          {/* 34px 时间轴槽：节点与卡片垂直中心对齐 */}
                          <div className="relative w-[34px] shrink-0">
                            {index === 0 && (
                              <span
                                aria-hidden="true"
                                className="absolute top-1/2 left-[3px] size-4 -translate-y-1/2"
                              >
                                <span
                                  className={cn(
                                    "activity-pulse block size-full rounded-full blur-[4px]",
                                    meta.dot,
                                  )}
                                />
                              </span>
                            )}
                            <span
                              aria-hidden="true"
                              className={cn(
                                "absolute top-1/2 left-[7px] size-[9px] -translate-y-1/2 rounded-full",
                                meta.dot,
                                meta.glow,
                              )}
                            />
                          </div>

                          <ActivityCard
                            item={item}
                            avatar={avatar}
                            authorName={authorName}
                            isNew={
                              newIds.has(item.id) || isRecent(item.published_at)
                            }
                          />
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </div>
          </div>

          {tab === "intro" && (
            <div className="pt-2 pb-10">
              <GiscusComments />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * 诗句里的强调：只把 ABOUT_ACCENT 这个词染成淡紫并加一点柔光，
 * 同句的其余文字保持原色。
 */
function AccentedLine({ text }: { text: string }) {
  const parts = text.split(ABOUT_ACCENT);

  return (
    <>
      {parts.map((part, index) => (
        <span key={index}>
          {part}
          {index < parts.length - 1 && (
            <span className="text-[#A9A4FF] drop-shadow-[0_0_8px_rgba(169,164,255,0.45)]">
              {ABOUT_ACCENT}
            </span>
          )}
        </span>
      ))}
    </>
  );
}

/** 发布时间在 24 小时内的条目显示 NEW */
function isRecent(iso: string): boolean {
  return Date.now() - Date.parse(iso) < NEW_WINDOW_MS;
}

/**
 * 时间轴右侧的动态卡片：34px 时间轴槽 + flex-1，桌面端正好 732×74。
 *
 * 单行内容垂直居中：头像、作者、状态、竖线、标题和时间排在同一行。
 * 竖线只有文章与杂谈才有，标题用《》包住；书名号固定不参与截断，
 * 只有中间标题文字会显示省略号。说说没有竖线和标题。
 */
function ActivityCard({
  item,
  avatar,
  authorName,
  isNew,
}: {
  item: ActivityItem;
  avatar: string;
  authorName: string;
  isNew: boolean;
}) {
  const meta = KIND_META[item.kind];

  return (
    <SmartLink
      href={item.href}
      className="glass-panel flex h-[74px] min-w-0 flex-1 items-center gap-2.5 rounded-2xl px-3 font-xiaowei transition-all duration-500 hover:-translate-y-0.5 hover:border-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 sm:px-4"
    >
      <Image
        src={avatar}
        alt=""
        width={36}
        height={36}
        unoptimized
        className="size-[36px] shrink-0 rounded-full object-cover ring-1 ring-white/15"
      />

      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
        <span className="shrink-0 text-[16px] font-medium text-white/85">
          {authorName}
        </span>
        <span className={cn("shrink-0 text-[14px]", meta.text)}>
          {meta.label}
        </span>
        {isNew && (
          <span className="activity-new inline-flex h-[15px] shrink-0 items-center rounded-full border border-white/10 bg-white/10 px-1.5 text-[9px] font-medium tracking-[0.08em] text-white/80">
            NEW
          </span>
        )}

        {item.title && (
          <>
            <span
              aria-hidden="true"
              className="h-8 w-px shrink-0 bg-white/30 mx-2"
            />
            <span className="flex min-w-0 flex-1 items-center text-[18px] leading-none">
              <span className="shrink-0 text-white/70">《</span>
              <span className="min-w-0 truncate text-white/90">
                {item.title}
              </span>
              <span className="shrink-0 text-white/70">》</span>
            </span>
          </>
        )}
      </div>

      <time
        dateTime={item.published_at}
        className="shrink-0 text-[10px] tabular-nums text-white/35 sm:text-[11px]"
      >
        {formatTimelineTime(item.published_at)}
      </time>
    </SmartLink>
  );
}
