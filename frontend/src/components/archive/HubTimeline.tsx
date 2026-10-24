import type { CSSProperties } from "react";
import Image from "next/image";

import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import { cn } from "@/lib/format";
import type { PostSummary } from "@/lib/types";

interface HubTimelineProps {
  posts: PostSummary[];
}

/**
 * 中枢链路视图：垂直时间轴，档案卡片沿中轴左右交替排布。
 *
 * 与 ArchiveGrid 的内滚盒子相反，本视图不设自己的滚动容器：
 * 中轴顺文档流一路铺开，滚动是整页级的。视图切换挂载时与 grid
 * 共用同一套入场——ol 整块缓慢淡入（view-fade），每一行再按 DOM 序
 * 错峰自下而上升起、渐显（view-rise）；曾经的「弹簧出桩」scrub 已
 * 摘除，两套动画盯着同一批行的 transform 无法共存。配方见
 * globals.css 的同名段。
 *
 * 数据由外层传入并按选中标签过滤，卡片序沿用传入序
 * （fixture 已是新→旧），左右交替只看下标奇偶、不额外排序。
 */
export function HubTimeline({ posts }: HubTimelineProps) {
  return (
    /* 784 = 360×2 + 64（中缝），两列各 360 正好容下一张卡 */
    <ol className="view-fade relative mx-auto flex w-[784px] max-w-full flex-col gap-10 pb-10">
      <div
        aria-hidden
        className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-linear-to-b from-transparent via-neon-600/80 to-transparent"
      />
      {posts.map((post, index) => (
        <HubRow key={post.id} post={post} index={index} />
      ))}
    </ol>
  );
}

/**
 * 一行：左右两列 grid，卡片按序号奇偶占一侧，另一侧留空。
 *
 * view-rise 作用在整行上：卡片连它的节点、虚线一起升起渐显，
 * 中轴线不受牵连（它是 ol 的单条兄弟节点，不是逐行复制）。
 *
 * 节点与连线的 top-[210px] 不是拍脑袋——对齐的是卡片信息区里
 * 时间行的垂直中线：图片 192 + 信息区上内边距 12 + 半行文字 6。
 */
function HubRow({ post, index }: { post: PostSummary; index: number }) {
  const left = index % 2 === 0;
  return (
    <li
      className="view-rise relative grid grid-cols-2 gap-x-16"
      style={{ "--i": index } as CSSProperties}
    >
      {/* 光点节点：垫在中轴上，压在细线之上 */}
      <span
        aria-hidden
        className="absolute top-[210px] left-1/2 z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-500 shadow-[0_0_14px_2px_var(--color-neon-500)]"
      />
      {/* 虚线连接：从中缝伸到占位侧的卡片边缘（半缝 32 = 线 24 + 离点 8） */}
      <span
        aria-hidden
        className={cn(
          "absolute top-[210px] w-6 border-t border-dashed border-neon-500/40",
          left ? "mr-2 right-1/2" : "ml-2 left-1/2",
        )}
      />
      <HubCard
        post={post}
        className={left ? "col-start-1 justify-self-end" : "col-start-2 justify-self-start"}
      />
    </li>
  );
}

/**
 * 360×342 链路卡：上 192px 图片、下 148px 信息区。
 *
 * 配方与 ArchiveCard 同源（glass 容器、封面遮罩、hover 放大、
 * 无图占位、小薇标题/简介、glass-panel 标签浮排），差异有两处：
 * 日期不再做成图片角标，而是信息区首行的完整时间戳（YYYY-MM-DD 时:分:秒）；
 * 信息区顺序为时间 → 标题 → 标签 → 简介，标签只放得下一行，超出裁切。
 */
function HubCard({ post, className }: { post: PostSummary; className?: string }) {
  return (
    <GlassCard
      as="div"
      padding="none"
      interactive
      className={cn("group h-[342px] w-[360px] overflow-hidden", className)}
    >
      <SmartLink href={`/posts/${post.slug}`} className="flex h-full flex-col">
        {/* 图片区：192px */}
        <div className="relative h-[192px] shrink-0 overflow-hidden">
          {post.cover ? (
            <>
              <Image
                src={post.cover}
                alt={post.title}
                fill
                sizes="360px"
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-115"
              />
              <div className="absolute inset-0 bg-black/25" />
            </>
          ) : (
            <div className="grid h-full place-items-center bg-white/5">
              <Icon name="document" size={28} className="text-white/20" />
            </div>
          )}
        </div>

        {/* 信息区：148px，固定四段顺序，溢出裁掉 */}
        <div className="flex h-[148px] flex-col gap-1 overflow-hidden px-5 pt-3 pb-2.5">
          {/* 完整时间戳：日历图标 + YYYY-MM-DD 时:分:秒 */}
          <span className="inline-flex items-center gap-1 text-[12px] leading-none text-white/55 tabular-nums">
            <Icon name="calendar" size={11} />
            {post.published_at.replace("T", " ")}
          </span>

          <h3 className="line-clamp-2 font-xiaowei text-[18px] leading-6 text-white/90 group-hover:text-[#906eff]">
            {post.title}
          </h3>

          {/* 标签：一行浮排，超出裁切 */}
          {post.tags.length > 0 && (
            <ul className="flex h-[21px] flex-wrap gap-1 overflow-hidden">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="glass-panel inline-flex h-[21px] min-w-[40px] items-center justify-center rounded-[4px] px-1 text-[10px] leading-none whitespace-nowrap text-[#906eff]"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          )}

          <p className="line-clamp-2 font-xiaowei text-[16px] leading-3.5 text-white/45 tracking-wide">
            {post.excerpt}
          </p>
        </div>
      </SmartLink>
    </GlassCard>
  );
}
