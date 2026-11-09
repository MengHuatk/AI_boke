"use client";

import Image from "next/image";
import { useState } from "react";

import { SmartLink } from "@/components/ui/SmartLink";
import type { Talk } from "@/lib/types";
import { ShowcaseDots } from "./ShowcaseDots";
import { useShowcaseCarousel } from "./useShowcaseCarousel";

/** 杂谈轮播每页停留 5.6 秒 */
const INTERVAL_MS = 5600;

/**
 * 首页右下杂谈轮播（桌面 461×218）。
 *
 * 和归档轮播同一套玻璃信息条与圆点，只把尺寸按盒子比例收紧：
 * 标题单行 20px、简介两行 12px，信息条底边 12px、内边距 12px，
 * 文字底边落在 24px。整卡可点进杂谈详情。
 */
export function TalkShowcase({ talks }: { talks: Talk[] }) {
  const { index, setIndex, setPaused } = useShowcaseCarousel(
    talks.length,
    INTERVAL_MS,
  );

  // 记下上一张：换页时底层保留旧封面，新封面在顶层从模糊中显影。
  // 渲染期派生状态（受 index 守卫），与首页歌词盒同一套做法。
  const [slides, setSlides] = useState({ index, previousIndex: index });
  if (slides.index !== index) {
    setSlides({ index, previousIndex: slides.index });
  }

  const talk = talks[index];
  const previousTalk = talks[slides.previousIndex];

  /** 封面与底部压暗渐变；新旧两层共用，只有动画挂在顶层 */
  const renderCover = (item: Talk) => (
    <>
      {item.cover ? (
        <Image
          src={item.cover}
          alt={item.title}
          fill
          sizes="(min-width: 1280px) 461px, 100vw"
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
      aria-label="杂谈精选"
      className="group media-text relative h-[218px] w-full overflow-hidden rounded-glass bg-[#0a0f1d] shadow-[0_22px_60px_-24px_rgba(0,0,0,0.95)] transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_28px_70px_-26px_rgba(0,0,0,1),0_0_44px_-12px_rgba(144,110,255,0.45)] sm:flex-1 xl:w-[461px] xl:flex-none"
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
        {renderCover(previousTalk)}
      </div>

      {/* 顶层：当前封面从模糊、微缩放与偏暗中淡入 */}
      <div
        key={talk.id}
        aria-hidden="true"
        className="showcase-cover absolute inset-0"
      >
        {renderCover(talk)}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2 z-10 rounded-[14px] "
      />

      {/* hover 顶部 1px 高光：只亮上沿，底部保持干净 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
      />

      {/* 信息条：底边 12px + p-3 = 文字底边 24px */}
      <div
        key={`text-${talk.id}`}
        className="showcase-text pointer-events-none absolute inset-x-3 bottom-3 z-20 rounded-[14px] p-3"
      >
        <h2 className="line-clamp-1 font-xiaowei text-[20px] leading-6 text-white/95">
          {talk.title}
        </h2>
        <p className="mt-1.5 line-clamp-2 font-yahei text-[12px] leading-5 text-white/60">
          {talk.excerpt}
        </p>
      </div>

      {/* 圆点：按钮高 24px、视觉圆点 6px。容器 bottom 7px，圆点在按钮内
          居中后落在 16–22px，信息条里的文字底边是 24px，互不重叠 */}
      <ShowcaseDots
        count={talks.length}
        active={index}
        labels={talks.map((item) => item.title)}
        onSelect={setIndex}
        label="杂谈"
        className="absolute right-6 bottom-[7px] z-30"
      />

      <SmartLink
        href={`/talks/${talk.slug}`}
        aria-label={`阅读杂谈：${talk.title}`}
        className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-brand-400"
      >
        <span aria-hidden="true" />
      </SmartLink>
    </div>
  );
}
