import { PostCard } from "@/components/post/PostCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { PostSummary } from "@/lib/types";

interface FeaturedPostsProps {
  posts: PostSummary[];
}

/**
 * 精选文章区块。
 * 条数由后端 /home?featured_limit=N 决定，前端不写死。
 */
export function FeaturedPosts({ posts }: FeaturedPostsProps) {
  return (
    <GlassCard as="section" padding="lg" className="animate-fade-up">
      <SectionHeading
        eyebrow="Featured"
        title="精选文章"
        icon="document"
        action={{ label: "全部文章", href: "/posts" }}
      />

      {posts.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/40">
          还没有标记为精选的文章。
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </ul>
      )}
    </GlassCard>
  );
}