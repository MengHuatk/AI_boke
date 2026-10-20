import Image from "next/image";

import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import type { PostSummary } from "@/lib/types";

interface ArchiveCardProps {
  post: PostSummary;
  /** 文章列表页的路由前缀，与 PostCard 保持同一约定 */
  basePath?: string;
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
 */
export function ArchiveCard({ post, basePath = "/posts" }: ArchiveCardProps) {
  const href = `${basePath}/${post.slug}`;

  return (
    <GlassCard as="li" padding="none" interactive className="group w-[288px] h-[324px] overflow-hidden">
      {/* 整卡可点，与 PostCard 同样的热区处理 */}
      <SmartLink href={href} className="flex h-full flex-col">
        {/* 图片区：160px。overflow-hidden 兜住放大时的图片，不让它漫到下方文字上 */}
        <div className="relative h-[160px] shrink-0 overflow-hidden">
          {post.cover ? (
            <>
              <Image
                src={post.cover}
                alt={post.title}
                fill
                sizes="288px"
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
          <span className="absolute bottom-[10px] left-[15px] inline-flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] leading-none text-white/85 tabular-nums">
            <Icon name="calendar" size={10} />
            {post.published_at.slice(2)}
          </span>
        </div>

        {/* 信息区：160px，日期已移入图片徽章，从标题起排；pb-5 固定出标签块与下边线的 20px 留距 */}
        <div className="flex h-[160px] flex-col gap-1 px-2.5 pt-1 pb-5">
          {/* 标题：至多 2 行，超出省略号 */}
          <h3 className="line-clamp-2 text-[18px] font-semibold leading-6 text-white/90">
            {post.title}
          </h3>

          {/* 简介：至多 2 行，超出省略号 */}
          <p className="line-clamp-2 text-[10px] leading-3.5 text-white/45">
            {post.excerpt}
          </p>

          {/* 标签区：换行浮排至多 2 行（12×2 + 间隙 4 = 28px），mt-auto 锚定信息区底部，超出裁切 */}
          {post.tags.length > 0 && (
            <ul className="mt-auto flex h-7 flex-wrap gap-1 overflow-hidden">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="glass-panel inline-flex h-3 min-w-[30px] items-center justify-center rounded-[4px] px-1 text-[8px] leading-none whitespace-nowrap text-white/70"
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
