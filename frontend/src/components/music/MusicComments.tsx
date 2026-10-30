import { GiscusComments } from "@/components/post/GiscusComments";
import { GlassCard } from "@/components/ui/GlassCard";

/**
 * 评论区大盒：宽度 1198px、高度随评论数量自适应。
 *
 * 承载方式与文章页一致，直接复用 GiscusComments；
 * 三个 env 没配齐时它会显示占位说明牌，不会影响音乐页其余部分。
 */
export function MusicComments() {
  return (
    <GlassCard
      padding="lg"
      className="mx-auto w-full max-w-[1198px]"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <span className="h-4 w-1 rounded-full bg-neon-500" />
        <h2 className="text-lg font-semibold text-white">乐评</h2>
      </div>
      <GiscusComments />
    </GlassCard>
  );
}
