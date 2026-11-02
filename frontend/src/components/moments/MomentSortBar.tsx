"use client";

import { cn } from "@/lib/format";

/** 说说排序：newest = 发布时间从新到旧，oldest = 从旧到新 */
export type MomentSort = "newest" | "oldest";

const SORT_OPTIONS = [
  { key: "newest", label: "最新" },
  { key: "oldest", label: "最早" },
] as const;

interface MomentSortBarProps {
  sort: MomentSort;
  onChange: (sort: MomentSort) => void;
}

/** 选中态药丸：淡紫底 + 亮紫文字 + 微光环 + 外发光（同 ArchiveTagBar） */
const SELECTED_PILL =
  "bg-neon-500/20 text-neon-500 ring-1 ring-neon-500/35 shadow-[0_0_16px_-4px_var(--color-neon-500)]";

/**
 * 202×46 排序药丸毛玻璃盒。
 *
 * 两枚等宽药丸「最新 / 最早」共用一枚 glass-panel 外壳；选中项
 * 垫淡紫发光药丸。状态收在 MomentsFeed，点当前项不触发重排 / 重播。
 */
export function MomentSortBar({ sort, onChange }: MomentSortBarProps) {
  return (
    <div
      role="group"
      aria-label="说说排序"
      className="glass-panel flex h-[46px] w-[202px] shrink-0 items-center gap-1 rounded-full p-1"
    >
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          aria-pressed={option.key === sort}
          onClick={() => onChange(option.key)}
          className={cn(
            "flex h-full flex-1 items-center justify-center rounded-full text-[13px] leading-none transition-colors duration-300",
            option.key === sort
              ? SELECTED_PILL
              : "text-white/50 hover:bg-white/5 hover:text-white/80",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
