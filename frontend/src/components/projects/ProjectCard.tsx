"use client";

import { useEffect, useRef } from "react";

import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import { cn } from "@/lib/format";
import type { Project } from "@/lib/types";

/** 卡片阶段：visible 静止；entering 播入场；exiting 播退场，结束后由父层摘除 */
export type ProjectCardPhase = "visible" | "entering" | "exiting";

/** 卡片左上角的图标池；按项目 id 稳定选取，刷新不会跳变 */
const EMOJI_POOL = ["✨", "🚀", "🛠️", "🧪", "🌌", "🧩", "⚡", "🌱", "🛰️", "🧠"];

function emojiFor(id: string): string {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  }
  return EMOJI_POOL[hash % EMOJI_POOL.length];
}

interface ProjectCardProps {
  project: Project;
  phase: ProjectCardPhase;
  onPhaseComplete: (id: string, phase: "entering" | "exiting") => void;
}

/**
 * 524×255 项目链接卡。
 *
 * 版式：顶部一行「图标 + 标题（至多 2 行）+ GitHub 图标」，其下是
 * README 标题行（单行截断），底部技术栈胶囊贴卡片下边线。
 *
 * 整卡是一个 SmartLink，点击直接打开对应 GitHub 仓库；右上角 GitHub
 * 图标只是装饰，不能再包一层链接，否则会形成嵌套 <a>。
 *
 * 卡片用标准毛玻璃（glass-panel）；hover 抬升来自 glass-interactive。
 *
 * 动效走 Web Animations API，不依赖 CSS 类和 animationend：
 * entering 从下方升起淡入，exiting 缩小上移淡出；动画结束回调父层。
 * 系统开启“减少动态效果”时退化为纯淡入淡出，不做位移和缩放。
 */
export function ProjectCard({
  project,
  phase,
  onPhaseComplete,
}: ProjectCardProps) {
  const emoji = project.emoji ?? emojiFor(project.id);
  const cardRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element || phase === "visible") return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isEntering = phase === "entering";

    const keyframes: Keyframe[] = reduceMotion
      ? [
          { opacity: isEntering ? 0 : 1 },
          { opacity: isEntering ? 1 : 0 },
        ]
      : isEntering
        ? [
            { opacity: 0, transform: "translate3d(0, 24px, 0) scale(0.96)" },
            { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
          ]
        : [
            { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
            { opacity: 0, transform: "translate3d(0, -24px, 0) scale(0.82)" },
          ];

    const animation = element.animate(keyframes, {
      duration: reduceMotion ? 160 : isEntering ? 320 : 280,
      easing: reduceMotion
        ? "ease"
        : isEntering
          ? "cubic-bezier(0.22, 1, 0.36, 1)"
          : "cubic-bezier(0.4, 0, 1, 1)",
      fill: "forwards",
    });

    animation.onfinish = () => onPhaseComplete(project.id, phase);

    return () => {
      animation.onfinish = null;
      animation.cancel();
    };
  }, [phase, project.id, onPhaseComplete]);

  return (
    <li
      ref={cardRef}
      className={cn(
        "group h-[255px] w-full max-w-[524px]",
        // 入场首帧先隐身，避免 WAAPI 在 effect 里启动前闪一下完整卡片
        phase === "entering" && "opacity-0",
        phase === "exiting" && "pointer-events-none",
      )}
    >
      <GlassCard
        as="div"
        tone="default"
        padding="none"
        interactive
        className="h-full w-full overflow-hidden py-4 px-3"
      >
        <SmartLink
          href={project.repo_url}
          className="flex h-full flex-col gap-2.5 p-6"
        >
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="text-[30px] leading-7">
              {emoji}
            </span>
            <h2 className="line-clamp-2 min-w-0 flex-1 font-xiaowei text-[30px] leading-6 text-white/90 transition-colors group-hover:text-neon-500" >
              {project.title}
            </h2>
            <Icon
              name="github"
              size={30}
              className="mt-1 shrink-0 text-white/35 transition-colors group-hover:text-white/85"
            />
          </div>

          <p className="line-clamp-1 font-xiaowei text-[16px] leading-5 text-white/45">
            {project.readme_title}
          </p>

          <ul className="mt-auto flex max-h-[72px] flex-wrap gap-2 overflow-hidden">
            {project.tech_stack.map((tag) => (
              <li
                key={tag}
                className="inline-flex h-8 items-center rounded-[10px] bg-[#422880]/25 px-4 text-[13px] leading-none whitespace-nowrap text-[#8C57FF] border-[#4E2E94] font-yahei  border-1"
              >
                {tag}
              </li>
            ))}
          </ul>
        </SmartLink>
      </GlassCard>
    </li>
  );
}
