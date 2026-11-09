import Image from "next/image";

import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import type { Talk } from "@/lib/types";

interface TalkCardProps {
  talk: Talk;
}

/**
 * 杂谈卡片。
 *
 * 与 ArchiveCard 同源，区别是高度完全由内容撑开：图片固定 16:9，
 * 右上角压一枚 30px 高的心情盒；下方依次是淡紫时间盒、标题（2 行）、
 * 简介（5 行）、标签。
 *
 * 整卡可点：链接撑满卡片，沿用 PostCard / ArchiveCard 的热区处理；
 * hover 抬升来自 glass-interactive，图片微微放大、标题转霓虹紫。
 * 链接包在内层，外层 li 仍是 FLIP 的测量节点，入场与重排不受影响。
 */
export function TalkCard({ talk }: TalkCardProps) {
  return (
    <GlassCard
      as="article"
      padding="none"
      interactive
      className="group overflow-hidden"
    >
      <SmartLink
        href={`/talks/${talk.slug}`}
        className="flex flex-col focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-brand-400"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          {talk.cover ? (
            <Image
              src={talk.cover}
              alt={talk.title}
              fill
              sizes="(min-width: 1200px) 400px, (min-width: 768px) 33vw, 50vw"
              className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
            />
          ) : (
            /* 无封面时的占位：弱色底 + 居中图标，保持图片区高度稳定 */
            <div className="grid h-full place-items-center bg-white/5">
              <Icon name="document" size={28} className="text-white/20" />
            </div>
          )}

          {/* 心情盒：图片右上角，30px 高半透明白底 */}
          <span className="media-text absolute top-2 right-2 inline-flex h-[30px] items-center rounded-md border border-white/20 bg-white/15 px-2.5 text-[13px] leading-none whitespace-nowrap text-white/85 backdrop-blur-md">
            {talk.mood}
          </span>
        </div>

        <div className="flex flex-col gap-2 px-5 py-4">
          {/* 时间盒：半透明淡紫圆角矩形 */}
          <span className="inline-flex h-6 w-fit items-center rounded-md bg-neon-500/15 px-2 text-[11px] leading-none text-brand-200 tabular-nums">
            {talk.published_at.slice(0, 10).replaceAll("-", ".")}
          </span>

          <h3 className="line-clamp-2 text-[20px] leading-6 text-white/90 transition-colors group-hover:text-neon-500">
            {talk.title}
          </h3>

          <p className="line-clamp-5 text-[15px] leading-6 tracking-wide text-white/45">
            {talk.excerpt}
          </p>

          {talk.tags.length > 0 && (
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {talk.tags.map((tag) => (
                <li
                  key={tag}
                  className="glass-panel-thick inline-flex h-[21px] min-w-[40px] items-center justify-center rounded-[4px] px-2 text-[10px] leading-none whitespace-nowrap text-neon-500"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SmartLink>
    </GlassCard>
  );
}
