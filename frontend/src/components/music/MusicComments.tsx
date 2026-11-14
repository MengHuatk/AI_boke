import { GiscusComments } from "@/components/post/GiscusComments";
import { GlassCard } from "@/components/ui/GlassCard";

/**
 * 音乐页评论区：宽度 1198px、高度随评论数量自适应。
 *
 * 每首歌一个独立讨论（term = music/{id}），与说说的做法一致，
 * 切歌时评论区随之切换。三个 env 没配齐时会显示占位说明牌，
 * 不会影响音乐页其余部分。
 */
export function MusicComments({ trackId }: { trackId: string }) {
  return (
    <GlassCard
      padding="lg"
      className="mx-auto w-full max-w-[1198px]"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <span className="h-4 w-1 rounded-full bg-neon-500" />
        <h2 className="text-lg font-semibold text-white">乐评</h2>
      </div>
      <GiscusComments mapping="specific" term={`music/${trackId}`} />
    </GlassCard>
  );
}
