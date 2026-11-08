"use client";

import { cn } from "@/lib/format";

interface ShowcaseDotsProps {
  count: number;
  active: number;
  /** 每页的标题，用作圆点的无障碍名称 */
  labels: string[];
  onSelect: (index: number) => void;
  /** 无障碍名称前缀，例如「归档」「杂谈」 */
  label: string;
  className?: string;
}

/**
 * 轮播圆点：静默态 8×6，活动态拉伸到 24×6。
 *
 * 视觉圆点只有 6px 高，按钮本身做成 24px 高的点击热区；
 * 宽度跟随活动态一起过渡，所以圆点是从右往左「长」出来的。
 */
export function ShowcaseDots({
  count,
  active,
  labels,
  onSelect,
  label,
  className,
}: ShowcaseDotsProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === active;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`查看${label}第 ${index + 1} 项：${labels[index]}`}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "group/dot flex h-6 cursor-pointer items-center justify-center transition-[width] duration-500 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
              isActive ? "w-6" : "w-2",
            )}
          >
            <span
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                isActive ? "w-6 bg-[#613DFF]/85" : "w-2 bg-white/30 group-hover/dot:bg-white/60",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
