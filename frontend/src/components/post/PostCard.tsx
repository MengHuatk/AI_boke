import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import { TagChip } from "@/components/ui/TagChip";
import { formatDate } from "@/lib/format";
import type { PostSummary } from "@/lib/types";

interface PostCardProps {
  post: PostSummary;
  /** 文章列表页的路由前缀，默认 /posts，方便以后改路由结构 */
  basePath?: string;
}

/**
 * 文章卡片。
 *
 * 放在 components/post/ 而不是 components/home/，因为它未来会被
 * 文章列表页、标签页、搜索结果页复用。
 */
export function PostCard({ post, basePath = "/posts" }: PostCardProps) {
  const href = `${basePath}/${post.slug}`;

  return (
    <GlassCard as="li" padding="none" interactive className="group overflow-hidden">
      {/* 整卡可点：链接撑满卡片，避免只有标题那一小块是热区 */}
      <SmartLink href={href} className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold leading-snug text-white/90 transition-colors group-hover:text-white">
            {post.title}
          </h3>
          <Icon
            name="arrowRight"
            size={15}
            className="mt-0.5 shrink-0 text-white/25 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-brand-300"
          />
        </div>

        <p className="line-clamp-2 text-[13px] leading-relaxed text-white/50">
          {post.excerpt}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-[11px] text-white/40">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="calendar" size={12} />
            {formatDate(post.published_at)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" size={12} />
            约 {post.reading_minutes} 分钟
          </span>
        </div>

        {post.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 border-t border-white/8 pt-3">
            {post.tags.map((tag) => (
              <li key={tag}>
                <TagChip label={tag} />
              </li>
            ))}
          </ul>
        )}
      </SmartLink>
    </GlassCard>
  );
}