"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import { MomentCard } from "@/components/moments/MomentCard";
import { MomentLightbox } from "@/components/moments/MomentLightbox";
import { MomentSearch } from "@/components/moments/MomentSearch";
import {
  MomentSortBar,
  type MomentSort,
} from "@/components/moments/MomentSortBar";
import { Icon } from "@/components/ui/Icon";
import { cn, formatMomentLocation } from "@/lib/format";
import type { Moment, MomentAuthor } from "@/lib/types";

interface MomentsFeedProps {
  moments: Moment[];
  author: MomentAuthor;
}

/** 内容区比 SiteShell 的 max-w-6xl 宽，用负外边距居中破格（同 PhotoGallery） */
const WIDE_WIDTH = "min(1200px, calc(100vw - 2rem))";

/**
 * 说说页主体。
 *
 * 自上而下：标题 → 星形副标题 → 搜索胶囊（512×58）→ 排序药丸
 * （202×46）→ 560px 双列照片墙。1200px 内容区比 SiteShell 的
 * max-w-6xl 宽，用「宽度 = min(1200px, 100vw - 2rem) + 左右负外边距
 * 居中」破格，不用 transform，避免给灯箱的 fixed 遮罩制造新的包含块。
 *
 * 排序后的说说按奇偶拆成左右两列（1/3/5… 与 2/4/6…），每列独立
 * flex 纵向堆叠，下一张紧接同列上一张尾部，不再强制行高对齐；
 * 窄屏用 display:contents + order 恢复原始单列顺序。
 *
 * 搜索匹配正文与「省 · 市 · 区」；排序在过滤后的集合上做，默认最新。
 * 评论区同一时间只开一条，状态收在这里，避免多个 Giscus iframe 同时加载。
 *
 * 错峰入场只在用户切换排序时播放：首访交给路由过渡，不播内部入场；
 * 1.2s 后摘掉类名，后续搜索过滤不会误触发。配方见 globals.css。
 */
export function MomentsFeed({ moments, author }: MomentsFeedProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<MomentSort>("newest");
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{
    momentId: string;
    index: number;
  } | null>(null);
  const [entranceNonce, setEntranceNonce] = useState(0);

  useEffect(() => {
    if (entranceNonce === 0) return;

    const timer = window.setTimeout(() => setEntranceNonce(0), 1200);
    return () => window.clearTimeout(timer);
  }, [entranceNonce]);

  const keyword = query.trim();
  const normalizedKeyword = keyword.toLowerCase();

  const visibleMoments = moments
    .filter((moment) => {
      if (!normalizedKeyword) return true;

      const location = formatMomentLocation(moment.location).toLowerCase();
      return (
        moment.content.toLowerCase().includes(normalizedKeyword) ||
        location.includes(normalizedKeyword)
      );
    })
    .sort((a, b) => {
      const delta = Date.parse(a.published_at) - Date.parse(b.published_at);
      return sort === "newest" ? -delta : delta;
    });

  // 左列 1/3/5…、右列 2/4/6…；index 保留原始序号，移动端 order
  // 与错峰入场的 --i 共用同一份序号
  const indexedMoments = visibleMoments.map((moment, index) => ({
    moment,
    index,
  }));
  const momentColumns = [
    indexedMoments.filter(({ index }) => index % 2 === 0),
    indexedMoments.filter(({ index }) => index % 2 === 1),
  ];

  const lightboxMoment = lightbox
    ? (moments.find((moment) => moment.id === lightbox.momentId) ?? null)
    : null;

  const animateEntrance = entranceNonce > 0;

  function handleSortChange(next: MomentSort) {
    if (next === sort) return;

    setSort(next);
    setOpenComments(null);
    setEntranceNonce((current) => current + 1);
  }

  function handleQueryChange(nextQuery: string) {
    // 搜索时立刻摘掉排序入场的类名，避免新命中的卡片误播错峰动画
    setEntranceNonce(0);
    setQuery(nextQuery);
  }

  function toggleComments(id: string) {
    setOpenComments((current) => (current === id ? null : id));
  }

  return (
    <section
      aria-label="生活动态"
      style={{
        width: WIDE_WIDTH,
        marginInline: `calc((100% - ${WIDE_WIDTH}) / 2)`,
      }}
    >
      <header className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-xiaowei text-[50px] leading-tight text-white/90">
            生活动态
          </h1>
          <p className="inline-flex items-center gap-2 font-xiaowei text-[14px] text-white/50">
            <Icon
              name="sparkle"
              size={14}
              className="text-brand-300 drop-shadow-[0_0_6px_rgba(144,110,255,0.65)]"
            />
            在代码之外捕捉瞬间的温度
          </p>
        </div>

        <MomentSearch value={query} onChange={handleQueryChange} />
        <MomentSortBar sort={sort} onChange={handleSortChange} />
      </header>

      {visibleMoments.length > 0 ? (
        <div
          key={sort}
          className={cn(
            "mx-auto mt-10 flex w-full max-w-[1144px] flex-col gap-6 min-[1200px]:flex-row min-[1200px]:items-start",
            animateEntrance && "view-fade",
          )}
        >
          {momentColumns.map((column, columnIndex) => (
            <ul
              key={columnIndex}
              className="contents min-[1200px]:flex min-[1200px]:w-[560px] min-[1200px]:flex-col min-[1200px]:gap-6"
            >
              {column.map(({ moment, index }) => (
                <li
                  key={moment.id}
                  className={cn(
                    "mx-auto w-full max-w-[560px]",
                    animateEntrance && "view-rise",
                  )}
                  style={{ order: index, "--i": index } as CSSProperties}
                >
                  <MomentCard
                    moment={moment}
                    author={author}
                    keyword={keyword}
                    commentOpen={openComments === moment.id}
                    onToggleComments={() => toggleComments(moment.id)}
                    onOpenImage={(imageIndex) =>
                      setLightbox({ momentId: moment.id, index: imageIndex })
                    }
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      ) : (
        <p className="glass-panel-subtle mx-auto mt-10 flex h-40 w-full max-w-[560px] items-center justify-center rounded-glass px-6 text-center text-[14px] text-white/50">
          没有找到与「{keyword}」匹配的生活动态
        </p>
      )}

      {lightboxMoment && lightbox && (
        <MomentLightbox
          images={lightboxMoment.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}
