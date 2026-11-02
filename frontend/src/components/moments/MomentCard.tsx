"use client";

import Image from "next/image";

import { MomentComments } from "@/components/moments/MomentComments";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { cn, formatMomentLocation } from "@/lib/format";
import type { Moment, MomentAuthor } from "@/lib/types";

interface MomentCardProps {
  moment: Moment;
  author: MomentAuthor;
  keyword: string;
  commentOpen: boolean;
  onToggleComments: () => void;
  onOpenImage: (index: number) => void;
}

const MAX_VISIBLE_IMAGES = 9;

/**
 * 一条生活动态：作者区 → 分割线 → 正文 → 九宫格 → 位置 / 评论。
 *
 * 卡片本身是 560px 宽的 glass-panel（由外层列约束），高度随内容
 * 自然伸展。图片区居中：桌面 100px 圆角方块、一行三个；1–2 张时
 * 图片本身也居中；超过九张时第九张盖一层模糊遮罩，正中显示多出的
 * 张数。点任意一张打开灯箱。
 *
 * 评论区默认收起，展开时用 grid-rows 0fr → 1fr 做高度过渡；同一
 * 时间只允许一条展开（状态收在 MomentsFeed）。
 */
export function MomentCard({
  moment,
  author,
  keyword,
  commentOpen,
  onToggleComments,
  onOpenImage,
}: MomentCardProps) {
  const publishedDate = moment.published_at.slice(0, 10).replaceAll("-", ".");
  const visibleImages = moment.images.slice(0, MAX_VISIBLE_IMAGES);
  const hiddenImageCount = moment.images.length - MAX_VISIBLE_IMAGES;

  return (
    <GlassCard as="article" padding="md" className="flex w-full flex-col">
      {/* 作者区：头像 + 名字，名字下方是时钟图标 + 发布时间 */}
      <header className="flex items-center gap-3">
        <Image
          src={author.avatar}
          alt={`${author.name} 的头像`}
          width={40}
          height={40}
          unoptimized
          className="size-10 shrink-0 rounded-full border border-white/15 object-cover"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] leading-5 font-medium text-white/90">
            {author.name}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[12px] leading-4 text-white/45 tabular-nums">
            <Icon name="clock" size={12} className="shrink-0" />
            <time dateTime={moment.published_at}>{publishedDate}</time>
          </span>
        </div>
      </header>

      <div className="my-4 h-px w-full bg-white/10" />

      {/* 正文：保留换行；搜索命中的词用淡紫底色标出 */}
      <p className="font-xiaowei text-[15px] leading-7 whitespace-pre-line text-white/80">
        <HighlightText text={moment.content} keyword={keyword} />
      </p>

      {visibleImages.length > 0 && (
        <div className="mx-auto mt-4 flex w-full max-w-[316px] flex-wrap justify-center gap-2">
          {visibleImages.map((image, index) => {
            const isLastVisible = index === visibleImages.length - 1;
            const showOverflow = isLastVisible && hiddenImageCount > 0;

            return (
              <button
                key={`${image.src}-${index}`}
                type="button"
                onClick={() => onOpenImage(index)}
                aria-label={
                  showOverflow
                    ? `查看全部 ${moment.images.length} 张图片`
                    : `查看第 ${index + 1} 张图片`
                }
                className="group relative aspect-square w-[calc((100%_-_1rem)/3)] max-w-[100px] shrink-0 overflow-hidden rounded-xl border border-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-500"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="100px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {showOverflow && (
                  <span className="absolute inset-0 grid place-items-center bg-black/45 text-[15px] font-medium text-white backdrop-blur-[3px]">
                    +{hiddenImageCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 位置胶囊 + 评论按钮：位置靠左，评论贴最右 */}
      <div className="mt-4 flex items-center gap-3">
        <span className="inline-flex h-8 min-w-0 max-w-full items-center gap-1.5 rounded-full border border-brand-300/20 bg-brand-500/15 px-3 text-[12px] text-brand-200">
          <Icon name="pin" size={12} className="shrink-0" />
          <span className="min-w-0 truncate">
            <HighlightText
              text={formatMomentLocation(moment.location)}
              keyword={keyword}
            />
          </span>
        </span>
        <button
          type="button"
          onClick={onToggleComments}
          aria-expanded={commentOpen}
          aria-controls={`moment-comments-${moment.id}`}
          className={cn(
            "ml-auto inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] transition-colors duration-200",
            commentOpen
              ? "bg-neon-500/20 text-neon-500"
              : "text-white/55 hover:bg-white/5 hover:text-white/85",
          )}
        >
          <Icon name="comment" size={13} />
          评论
        </button>
      </div>

      {/* 评论区：收起时高度为 0，展开时撑开卡片；Giscus 只在展开时挂载。
          id 单独放在无样式的锚点上，避免同一元素同时挂 class 和 id。 */}
      <div id={`moment-comments-${moment.id}`}>
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
            commentOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="mt-4 border-t border-white/10 pt-4">
              {commentOpen && <MomentComments momentId={moment.id} />}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/** 大小写不敏感地把 keyword 命中的片段包成淡紫 mark */
function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  const normalizedKeyword = keyword.trim();

  if (!normalizedKeyword) return <>{text}</>;

  const pattern = new RegExp(`(${escapeRegExp(normalizedKeyword)})`, "gi");

  return (
    <>
      {text.split(pattern).map((part, index) =>
        part.toLowerCase() === normalizedKeyword.toLowerCase() ? (
          <mark
            key={index}
            className="rounded-[3px] bg-neon-500/25 px-0.5 text-inherit"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

/** 把搜索词里的正则元字符转义，避免用户输入 "." 之类把整段拆坏 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
