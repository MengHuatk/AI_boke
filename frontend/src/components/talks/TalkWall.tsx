"use client";

import type { CSSProperties } from "react";

import { TalkCard } from "@/components/talks/TalkCard";
import { useTalkFlip } from "@/components/talks/useTalkFlip";
import { cn } from "@/lib/format";
import type { Talk } from "@/lib/types";

interface TalkWallProps {
  talks: Talk[];
  /** 当前断点下的列数：PC 3，手机 2 */
  columns: number;
  /** 标签切换或搜索应用后递增，驱动 FLIP */
  filterSignal: number;
  animateEntrance: boolean;
  emptyText: string;
}

/**
 * 杂谈瀑布流。
 *
 * 每列是独立的 flex 纵向盒子。卡片按「行优先轮询」分配：
 * 第 0 张进第 1 列、第 1 张进第 2 列、第 2 张进第 3 列、第 3 张再回
 * 第 1 列……视觉顺序是从左到右、从上到下。n 大于等于列数时每列至少
 * 一张；n 小于列数时按固定列数保留空列，列宽不跳变。
 *
 * view-rise 放在 li 的内层：li 只承担 data-talk-id 与 rect 测量，
 * 内层 transform 不会改变 li 的布局盒子，避免入场动画污染 FLIP 的旧位置。
 * data-talk-order 记录行优先序号，供 FLIP 的错峰延迟使用。
 */
export function TalkWall({
  talks,
  columns,
  filterSignal,
  animateEntrance,
  emptyText,
}: TalkWallProps) {
  const wallRef = useTalkFlip<HTMLDivElement>({ signal: filterSignal });

  const indexedTalks = talks.map((talk, index) => ({ talk, index }));
  const columnItems = Array.from({ length: columns }, (_, columnIndex) =>
    indexedTalks.filter(({ index }) => index % columns === columnIndex),
  );

  return (
    <div className="relative mt-2 w-full">
      <div
        ref={wallRef}
        className={cn(
          "flex w-full items-start gap-5",
          animateEntrance && "view-fade",
          talks.length === 0 && "hidden",
        )}
      >
        {columnItems.map((items, columnIndex) => (
          <ul key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-5">
            {items.map(({ talk, index }) => (
              <li
                key={talk.id}
                data-talk-id={talk.id}
                data-talk-order={index}
              >
                <div
                  className={cn(animateEntrance && "view-rise")}
                  style={{ "--i": Math.min(index, 12) } as CSSProperties}
                >
                  <TalkCard talk={talk} />
                </div>
              </li>
            ))}
          </ul>
        ))}
      </div>

      {talks.length === 0 && (
        <p className="glass-panel-subtle view-fade mx-auto flex h-40 w-full max-w-[560px] items-center justify-center rounded-glass px-6 text-center text-[14px] text-white/50">
          {emptyText}
        </p>
      )}
    </div>
  );
}
