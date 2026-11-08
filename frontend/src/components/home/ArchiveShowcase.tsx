"use client";

import Image from "next/image";
import { useState } from "react";

import { SmartLink } from "@/components/ui/SmartLink";
import type { PostSummary } from "@/lib/types";
import { ShowcaseDots } from "./ShowcaseDots";
import { useShowcaseCarousel } from "./useShowcaseCarousel";

/** 归档轮播每页停留 6.2 秒 */
const INTERVAL_MS = 6200;

/**
 * 首页左栏归档轮播（桌面 340×462）。
 *
 * 封面铺满整张卡，底部一条玻璃信息条压住标题与最多三行简介；
 * 信息条底边距卡片 24px，内部 p-4 让文字底边正好落在 40px。
 * 圆点落在信息条右下角的留白里，整卡可点进文章详情。
 */
export function ArchiveShowcase({ posts }: { posts: PostSummary[] }) {
  const { index, setIndex, setPaused } = useShowcaseCarousel(
    posts.length,
    INTERVAL_MS,
  );

  // 记下上一张：换页时底层保留旧封面，新封面在顶层从模糊中显影。
  // 渲染期派生状态（受 index 守卫），与首页歌词盒同一套做法。
  const [slides, setSlides] = useState({ index, previousIndex: index });
  if (slides.index !== index) {
    setSlides({ index, previousIndex: slides.index });
  }

  const post = posts[index];
  const previousPost = posts[slides.previousIndex];

  /** 封面与底部压暗渐变；新旧两层共用，只有动画挂在顶层 */
  const renderCover = (item: PostSummary) => (
    <>
      {item.cover ? (
        <Image
          src={item.cover}
          alt={item.title}
          fill
          sizes="(min-width: 1280px) 340px, 100vw"
          className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/45 via-[#0a0f1d] to-[#1b1230]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#05080f]/92 via-[#05080f]/35 to-[#05080f]/10" />
    </>
  );

  return (
    <div
      role="group"
      aria-roledescription="轮播"
      aria-label="归档精选"
      className="group relative h-[462px] w-full overflow-hidden rounded-glass bg-[#0a0f1d] shadow-[0_22px_60px_-24px_rgba(0,0,0,0.95)] transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_28px_70px_-26px_rgba(0,0,0,1),0_0_44px_-12px_rgba(144,110,255,0.45)] xl:w-[340px] xl:shrink-0"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      {/* 底层：上一张封面保持清晰，新封面在它上面显影 */}
      <div aria-hidden="true" className="absolute inset-0">
        {renderCover(previousPost)}
      </div>

      {/* 顶层：当前封面从模糊、微缩放与偏暗中淡入 */}
      <div
        key={post.id}
        aria-hidden="true"
        className="showcase-cover absolute inset-0"
      >
        {renderCover(post)}
      </div>

      {/* 玻璃内框：和卡片圆角错开 8px，强化展柜感 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2 z-10 rounded-[18px]"
      />

      {/* hover 顶部 1px 高光：只亮上沿，底部保持干净 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
      />

      {/* 玻璃信息条：底边 24px + p-4 = 文字底边 40px */}
      <div
        key={`text-${post.id}`}
        className="showcase-text pointer-events-none absolute inset-x-4 bottom-6 z-20 rounded-[18px] p-4"
      >
        <h2 className="line-clamp-2 font-xiaowei text-[26px] leading-8 text-white/95">
          {post.title}
        </h2>
        <p className="mt-2 line-clamp-3 font-yahei text-[13px] leading-[22px] text-white/60">
          {post.excerpt}
        </p>
      </div>

      {/* 圆点：按钮高 24px、视觉圆点 6px。容器 bottom 21px，圆点在按钮内
          居中后落在 30–36px，信息条里的文字底边是 40px，互不重叠 */}
      <ShowcaseDots
        count={posts.length}
        active={index}
        labels={posts.map((item) => item.title)}
        onSelect={setIndex}
        label="归档"
        className="absolute right-8 bottom-[21px] z-30"
      />

      <SmartLink
        href={`/posts/${post.slug}`}
        aria-label={`阅读文章：${post.title}`}
        className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-brand-400"
      >
        <span aria-hidden="true" />
      </SmartLink>
    </div>
  );
}
