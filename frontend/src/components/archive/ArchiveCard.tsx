import Image from "next/image";
import type { CSSProperties } from "react";

import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import { cn } from "@/lib/format";
import type { PostSummary } from "@/lib/types";

interface ArchiveCardProps {
  post: PostSummary;
  /** 在列表中的 DOM 序号，驱动 view-rise 错峰入场的 --i 档位 */
  index: number;
  /** 文章列表页的路由前缀，与 PostCard 保持同一约定 */
  basePath?: string;
  /** 用户主动切换视图时播错峰入场；路由首访交给 ViewTransition */
  animateEntrance?: boolean;
}

/**
 * 288×324 长方形归档卡片。
 *
 * 版式：上 160px 图片，图片左下角（left-15px / bottom-10px）叠一枚
 * 日期徽章（日历图标 + YY-MM-DD、黑色半透明底）；下 160px 依次为
 * 标题（至多 2 行）、简介（至多 2 行，超出省略号）、
 * 分类标签（至多 2 行换行浮排、锚定距卡片下边线 20px、超出裁切）。
 * 卡片容器与每个分类标签都用 globals.css 的 glass-panel 配方。
 *
 * hover：沿用 glass-interactive 的抬升，图片在其内向中心微微放大
 * （group + group-hover:scale-105）；遮罩与日期徽章都是图片的兄弟节点，
 * 常驻不动、不跟着缩放。
 *
 * 分类标签为 12px 高、最小 30px 宽的小圆角矩形，内容以「#」开头，
 * 随标签长度伸展。
 *
 * 视图切换时随 grid 整块缓慢淡入，自身再按 index 档位错峰自下而上
 * 升起渐显（view-rise 配方见 globals.css）。路由首访不播，交给整页过渡。
 *
 * 手机端（<768px）：宽度跟随两列网格，高度由内容撑开；封面改成
 * 1.8:1 随列宽缩放，信息区字号、间距、标签尺寸整体收一档，版式顺序不变。
 */
export function ArchiveCard({
  post,
  index,
  basePath = "/posts",
  animateEntrance = true,
}: ArchiveCardProps) {
  const href = `${basePath}/${post.slug}`;

  return (
    <GlassCard
      as="li"
      padding="none"
      interactive
      className={cn(
        // 手机端改为两列流式宽度、高度由内容撑开，桌面仍是固定 288×372
        "group w-[288px] h-[372px] overflow-hidden max-md:h-auto max-md:w-full",
        animateEntrance && "view-rise",
      )}
      style={{ "--i": index } as CSSProperties}
    >
      {/* 整卡可点，与 PostCard 同样的热区处理 */}
      <SmartLink href={href} className="flex h-full flex-col">
        {/* 图片区：桌面 160px；手机按 1.8:1 跟随列宽缩放 */}
        <div className="relative h-[160px] shrink-0 overflow-hidden max-md:h-auto max-md:aspect-[1.8/1]">
          {post.cover ? (
            <>
              <Image
                src={post.cover}
                alt={post.title}
                fill
                sizes="(max-width: 767px) 45vw, 288px"
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-115"
              />
              {/* 静态压暗遮罩：uniform 薄黑常驻，不参与 hover 的缩放与淡化 */}
              <div className="absolute inset-0 bg-black/25" />
            </>
          ) : (
            /* 无封面时的占位：弱色底 + 居中图标，保持卡片高度稳定 */
            <div className="grid h-full place-items-center bg-white/5">
              <Icon name="document" size={28} className="text-white/20" />
            </div>
          )}

          {/* 日期徽章：叠在图片上，left-15px / bottom-10px，黑色半透明底保证压图可读 */}
          <span className="media-text absolute bottom-[10px] left-[15px] inline-flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] leading-none text-white/85 tabular-nums max-md:bottom-1.5 max-md:left-2 max-md:px-1 max-md:text-[9px]">
            <Icon name="calendar" size={10} />
            {post.published_at.slice(2, 10)}
          </span>
        </div>

        {/* 信息区：桌面 212px，日期已移入图片徽章，从标题起排；pb-5 固定出标签块与下边线的 20px 留距。
            手机端高度由内容撑开，边距与字号整体缩小一档 */}
        <div className="flex h-[212px] flex-col gap-1 px-[20px] pt-1 pb-5 mt-[20px] max-md:mt-0 max-md:h-auto max-md:gap-0.5 max-md:px-2.5 max-md:pt-1.5 max-md:pb-2.5">
          {/* 标题：至多 2 行，超出省略号；ZCOOL XiaoWe 只注册了 400 字重，不加 font-semibold 免合成粗体 */}
          <h3 className="line-clamp-2 font-xiaowei text-[20px] leading-6 text-white/90 group-hover:text-[#906eff] max-md:text-[13.5px] max-md:leading-[17px]">
            {post.title}
          </h3>

          {/* 简介：至多 2 行，超出省略号 */}
          <p className="line-clamp-2 font-xiaowei text-[18px] leading-3.5 text-white/45 tracking-wide max-md:text-[10px] max-md:leading-[13px]">
            {post.excerpt}
          </p>

          {/* 标签区：换行浮排至多 2 行（12×2 + 间隙 4 = 28px），mt-auto 锚定信息区底部，超出裁切 */}
          {post.tags.length > 0 && (
            <ul className="mt-auto flex h-7 flex-wrap gap-1 overflow-hidden max-md:h-4 max-md:gap-0.5">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="glass-panel-thick inline-flex h-[21px] min-w-[40px] items-center justify-center rounded-[4px] px-1 text-[10px] leading-none whitespace-nowrap text-[#906eff] p-[10px] max-md:h-[16px] max-md:min-w-[30px] max-md:p-[3px] max-md:text-[9px]"
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
