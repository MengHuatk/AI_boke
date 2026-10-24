"use client";

import { useState } from "react";

import { ArchiveGrid } from "@/components/archive/ArchiveGrid";
import {
  ArchiveTagBar,
  type ArchiveViewMode,
} from "@/components/archive/ArchiveTagBar";
import { HubTimeline } from "@/components/archive/HubTimeline";
import { ALL_TAG, ARCHIVE_TAGS, TEST_POSTS } from "@/lib/archive-fixtures";
import { cn } from "@/lib/format";

/**
 * 归档页主体。
 *
 * 两套视图两种壳：
 * grid → 一屏高的玻璃盒（1024 宽、内滚，ArchiveGrid 塞在盒里）；
 * hub  → 脱壳直出，标题 + 标签栏浮在页首，HubTimeline 顺文档流铺开，
 *        滚动还给整页。
 * 两模顶部同为 pt-4：切换瞬间标题与标签栏零位移（曾有的虚线占位框
 * 连同它撑出的 40px 上留白一起摘除）。两套视图共用切换挂载入场——
 * 整块缓慢淡入 + 卡片错峰自下而上升起，配方见 globals.css。
 *
 * 选中态都收在这层：selectedTag 默认「全部档案」，过滤后的文章
 * 是两条视图共同的入参；viewMode 决定渲染哪个、也决定用哪套壳。
 */
export function ArchiveBanner() {
  const [selectedTag, setSelectedTag] = useState<string>(ALL_TAG);
  const [viewMode, setViewMode] = useState<ArchiveViewMode>("grid");

  const posts =
    selectedTag === ALL_TAG
      ? TEST_POSTS
      : TEST_POSTS.filter((post) => post.tags.includes(selectedTag));

  const isHub = viewMode === "hub";

  return (
    <section
      aria-label="档案预留区"
      className={cn(
        "mx-auto flex w-full max-w-[1024px] flex-col items-center gap-10",
        isHub ? "pt-4" : "h-dvh rounded-glass pt-4 pb-10",
      )}
    >
      <span className="text-[50px] font-bold">归档与探索</span>

      <ArchiveTagBar
        tags={ARCHIVE_TAGS}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {isHub ? <HubTimeline posts={posts} /> : <ArchiveGrid posts={posts} />}
    </section>
  );
}
