import { ProjectCard } from "@/components/projects/ProjectCard";
import type { ProjectCardPhase } from "@/components/projects/ProjectCard";
import type { Project } from "@/lib/types";

export interface ProjectGridItem {
  project: Project;
  phase: ProjectCardPhase;
}

interface ProjectGridProps {
  cards: ProjectGridItem[];
  hasQuery: boolean;
  /** 卡片入场 / 退场动画结束后的回调，由 ProjectsMatrix 维护阶段状态 */
  onPhaseComplete: (id: string, phase: "entering" | "exiting") => void;
}

/**
 * 1072px 项目网格（纯展示）。
 *
 * 两列 524×255 卡片 + 24px 间距恰好铺满 1072：
 * 524 × 2 + 24 = 1072，所以容器水平方向不留内边距；垂直留 24px。
 * 窄屏退成单列，并补上左右内边距，避免卡片贴住容器边。
 *
 * 过滤与入场 / 退场阶段由 ProjectsMatrix 计算，这里只按 cards 渲染；
 * 筛选结果为空时，盒内撑出与卡片同高的空态，盒外布局不动。
 */
export function ProjectGrid({ cards, hasQuery, onPhaseComplete }: ProjectGridProps) {
  return (
    <div className="w-full rounded-glass p-3 sm:p-4 lg:px-0 lg:py-6">
      {cards.length === 0 ? (
        <p className="flex h-[255px] items-center justify-center font-xiaowei text-[15px] text-white/55">
          {hasQuery ? "没有找到匹配的项目 🌌" : "项目正在整理中，稍后再来看看"}
        </p>
      ) : (
        <ul className="grid grid-cols-1 justify-items-center gap-6 lg:grid-cols-2">
          {cards.map((card) => (
            <ProjectCard
              key={card.project.id}
              project={card.project}
              phase={card.phase}
              onPhaseComplete={onPhaseComplete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
