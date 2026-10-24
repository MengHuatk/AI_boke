import { ArchiveCard } from "@/components/archive/ArchiveCard";
import type { PostSummary } from "@/lib/types";

interface ArchiveGridProps {
  posts: PostSummary[];
}

/**
 * 归档栅格（944px 容器，一行 3 张，等间距）。
 *
 * 作为 ArchiveBanner 的 flex-1 子项吃满标签栏以下的剩余高度：
 * 可见行数 = 当前视口放得下的行数，超出的行不撑高容器，
 * 在本容器内纵向滚动。滚动条由 globals.css 的 .archive-scroll
 * 染色：深紫圆条，hover / 拖动变浅紫。
 *
 * 数据由外层传入并按选中标签过滤；测试数据在 lib/archive-fixtures，
 * 真实档案接入后换掉来源即可，布局骨架不动。
 *
 * 视图切换挂载时整块缓慢淡入（view-fade），卡片再按 DOM 序
 * （从左到右、从上到下）逐张错峰升起（view-rise，见 globals.css）。
 */
export function ArchiveGrid({ posts }: ArchiveGridProps) {
  return (
    <div className="archive-scroll view-fade min-h-0 w-full max-w-[944px] flex-1 overflow-y-auto">
      <ul className="grid grid-cols-3 justify-items-center gap-6">
        {posts.map((post, index) => (
          <ArchiveCard key={post.id} post={post} index={index} />
        ))}
      </ul>
    </div>
  );
}
