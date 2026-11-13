import { ArchiveCard } from "@/components/archive/ArchiveCard";
import { cn } from "@/lib/format";
import type { PostSummary } from "@/lib/types";

interface ArchiveGridProps {
  posts: PostSummary[];
  /** 用户主动切换视图时播错峰入场；路由首访交给 ViewTransition */
  animateEntrance?: boolean;
}

/**
 * 归档栅格（944px 容器，一行 3 张，等间距）。
 *
 * 作为 ArchiveBanner 的 flex-1 子项吃满标签栏以下的剩余高度：
 * 可见行数 = 当前视口放得下的行数，超出的行不撑高容器，
 * 在本容器内纵向滚动。滚动条由 globals.css 的 .archive-scroll
 * 染色：深紫圆条，hover / 拖动变浅紫。
 *
 * 数据由归档页服务端取好后经 ArchiveBanner 传入，并按选中标签过滤；
 * 本组件只负责布局与入场动画。
 *
 * 视图切换挂载时整块缓慢淡入（view-fade），卡片再按 DOM 序
 * （从左到右、从上到下）逐张错峰升起（view-rise，见 globals.css）。
 * animateEntrance 只在用户主动切换视图时为 true；路由首访不播，
 * 否则新页快照会拍到透明初态。
 */
export function ArchiveGrid({ posts, animateEntrance = true }: ArchiveGridProps) {
  return (
    <div
      className={cn(
        "archive-scroll min-h-0 w-full max-w-[944px] flex-1 overflow-y-auto",
        animateEntrance && "view-fade",
      )}
    >
      <ul className="grid grid-cols-3 justify-items-center gap-6">
        {posts.map((post, index) => (
          <ArchiveCard
            key={post.id}
            post={post}
            index={index}
            animateEntrance={animateEntrance}
          />
        ))}
      </ul>
    </div>
  );
}
