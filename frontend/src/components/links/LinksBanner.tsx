import { FriendCard } from "@/components/links/FriendCard";
import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import type { FriendLink } from "@/lib/types";

interface LinksBannerProps {
  friends: FriendLink[];
}

/**
 * 友链页主体（/links）。
 *
 * 自上而下：126×36 返回胶囊 → 左对齐标题「云端引力」→ 副标题 →
 * 三列 / 两列友链网格。卡片入场见 FriendCard 与 globals 的 .friend-rise。
 *
 * 容器上限 948px = 3×300 + 2×24，正好放下桌面端三列；lg 以下降到两列，
 * 卡片宽度流式、高度仍锁 152px。
 */
export function LinksBanner({ friends }: LinksBannerProps) {
  return (
    <section
      aria-label="友情链接"
      className="mx-auto flex w-full max-w-[948px] flex-col gap-8 font-xiaowei"
    >
      <SmartLink
        href="/"
        className="glass-panel inline-flex h-9 w-[126px] items-center justify-center gap-1.5 rounded-full text-[13px] text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neon-500"
      >
        <Icon name="arrowRight" size={13} className="rotate-180" />
        返回上一级
      </SmartLink>

      <header className="flex flex-col gap-2">
        <h1 className="text-[38px] leading-[1.1] text-white/95 sm:text-[50px]">
          云端引力
        </h1>
        <p className="text-[15px] text-white/50 sm:text-[16px] mb-4">
          那些散落在赛博宇宙各处的有趣灵魂与神经节点。
        </p>
      </header>

      {friends.length > 0 ? (
        <ul className="grid grid-cols-2 justify-items-center gap-x-4 gap-y-6 sm:gap-8 lg:grid-cols-3">
          {friends.map((friend, index) => (
            <FriendCard key={friend.id} friend={friend} index={index} />
          ))}
        </ul>
      ) : (
        <p className="glass-panel-subtle flex h-40 items-center justify-center rounded-glass text-sm text-white/50">
          还没有友链，去后台添加一条吧
        </p>
      )}
    </section>
  );
}
