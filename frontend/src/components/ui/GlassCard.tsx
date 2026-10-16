import type { ReactNode } from "react";

import { cn } from "@/lib/format";

/** 玻璃强度：对应 globals.css 里的三个 @utility 配方 */
type GlassTone = "default" | "strong" | "subtle";

/** 内边距档位。none 用于需要自行控制内边距的场景（如列表卡片） */
type GlassPadding = "none" | "sm" | "md" | "lg";

const TONE_CLASS: Record<GlassTone, string> = {
  default: "glass-panel",
  strong: "glass-panel-strong",
  subtle: "glass-panel-subtle",
};

const PADDING_CLASS: Record<GlassPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-7 sm:p-9",
};

interface GlassCardProps {
  children: ReactNode;
  /** 语义化标签，默认 div。列表项请传 "li"，文章卡片传 "article" */
  as?: "div" | "section" | "article" | "aside" | "li" | "header" | "footer";
  tone?: GlassTone;
  padding?: GlassPadding;
  /** 是否启用 hover 抬升反馈（可点击的卡片才需要） */
  interactive?: boolean;
  className?: string;
}

/**
 * 毛玻璃容器 —— 页面里所有「盒子」的基类。
 *
 * 视觉细节（模糊半径、描边高光、投影层次）全部封装在 globals.css 的
 * @utility 里，这里只负责选择档位和布局。要调整整体质感改 CSS，不要改这个文件。
 */
export function GlassCard({
  children,
  as: Tag = "div",
  tone = "default",
  padding = "md",
  interactive = false,
  className,
}: GlassCardProps) {
  return (
    <Tag
      className={cn(
        "rounded-glass",
        TONE_CLASS[tone],
        PADDING_CLASS[padding],
        interactive && "glass-interactive",
        className,
      )}
    >
      {children}
    </Tag>
  );
}