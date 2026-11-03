"use client";

import { cn } from "@/lib/format";
import { ALL_TALK_TAG } from "@/lib/talks-fixtures";

/** 选中态：淡紫蓝底 + 亮紫文字 + 外发光，与归档标签栏同一套语言 */
const SELECTED_CLASS =
  "border border-neon-500/35 bg-neon-500/20 text-neon-500 shadow-[0_0_16px_-4px_var(--color-neon-500)] backdrop-blur-xl";

interface TalkTagBarProps {
  tags: string[];
  selectedTag: string;
  onSelectTag: (tag: string) => void;
}

/**
 * 杂谈标签区。
 *
 * 不套外层玻璃盒：每个标签本身就是 34px 高的毛玻璃圆角矩形，宽度随
 * 内容撑开；整行换行铺开并水平居中，容器高度由内容决定。
 */
export function TalkTagBar({
  tags,
  selectedTag,
  onSelectTag,
}: TalkTagBarProps) {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-2.5">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          aria-pressed={tag === selectedTag}
          onClick={() => onSelectTag(tag)}
          className={cn(
            "inline-flex h-[34px] items-center rounded-[10px] px-4 text-[13px] leading-none whitespace-nowrap transition-colors duration-300",
            tag === selectedTag
              ? SELECTED_CLASS
              : "glass-panel text-white/55 hover:border-white/20 hover:text-white/85",
          )}
        >
          {tag === ALL_TALK_TAG ? tag : `#${tag}`}
        </button>
      ))}
    </div>
  );
}
