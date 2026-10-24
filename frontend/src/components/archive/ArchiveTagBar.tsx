"use client";

import { Icon } from "@/components/ui/Icon";
import { ALL_TAG } from "@/lib/archive-fixtures";
import { cn } from "@/lib/format";

/** 归档显示模式：grid = 矩形网格（ArchiveGrid），hub = 中枢链路（HubTimeline）。 */
export type ArchiveViewMode = "hub" | "grid";

const VIEW_MODES = [
  { key: "hub", label: "中枢链路", icon: "link" },
  { key: "grid", label: "矩形网格", icon: "grid" },
] as const;

/** 选中态统一的淡紫药丸配方：底色 + 亮紫文字 + 微光环 + 外发光 */
const SELECTED_PILL =
  "bg-neon-500/20 text-neon-500 ring-1 ring-neon-500/35 shadow-[0_0_16px_-4px_var(--color-neon-500)]";

interface ArchiveTagBarProps {
  tags: string[];
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  viewMode: ArchiveViewMode;
  onViewModeChange: (mode: ArchiveViewMode) => void;
}

/**
 * 标签栏（944×146，毛玻璃滑轨胶囊风格）。
 *
 * 左侧标签按序铺开成至多两行胶囊（ALL_TAG 无 # 前缀，其余带 #），
 * 选中项垫一块淡紫发光药丸；右侧 232×44 是视图切换胶囊——
 * 一枚分段控件，两档共用外壳，选中段填淡紫，贴最右、垂直居中。
 */
export function ArchiveTagBar({
  tags,
  selectedTag,
  onSelectTag,
  viewMode,
  onViewModeChange,
}: ArchiveTagBarProps) {
  return (
    <div className="glass-panel flex h-[146px] w-full max-w-[944px] shrink-0 items-center gap-6 overflow-hidden rounded-glass px-6 ">
      {/* 标签区：占满剩余宽度，胶囊换行铺开，两行放不下直接裁掉 */}
      <ul className="flex min-w-0 flex-1 flex-wrap content-center gap-2.5 ">
        {tags.map((tag) => (
          <li key={tag}>
            <button
              type="button"
              aria-pressed={tag === selectedTag}
              onClick={() => onSelectTag(tag)}
              className={cn(
                "inline-flex h-8 items-center rounded-full px-4 text-[13px] leading-none whitespace-nowrap transition-colors duration-300",
                tag === selectedTag
                  ? SELECTED_PILL
                  : "text-white/55 hover:bg-white/5 hover:text-white/85",
              )}
            >
              {tag === ALL_TAG ? tag : `#${tag}`}
            </button>
          </li>
        ))}
      </ul>

      {/* 视图切换胶囊：232×44，贴最右侧、垂直居中 */}
      <div
        role="group"
        aria-label="归档视图切换"
        className="glass-panel-subtle flex h-[44px] w-[232px] shrink-0 items-center gap-1 rounded-full p-1"
      >
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            aria-pressed={mode.key === viewMode}
            onClick={() => onViewModeChange(mode.key)}
            className={cn(
              "flex h-full flex-1 items-center justify-center gap-1.5 rounded-full text-xs transition-colors duration-300",
              mode.key === viewMode
                ? SELECTED_PILL
                : "text-white/50 hover:text-white/80",
            )}
          >
            <Icon name={mode.icon} size={13} />
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
