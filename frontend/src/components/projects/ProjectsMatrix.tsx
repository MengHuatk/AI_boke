"use client";

import { useCallback, useRef, useState } from "react";

import { ProjectGrid } from "@/components/projects/ProjectGrid";
import type { ProjectGridItem } from "@/components/projects/ProjectGrid";
import { ProjectSearch } from "@/components/projects/ProjectSearch";
import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import type { Project } from "@/lib/types";

interface ProjectsMatrixProps {
  projects: Project[];
}

/** 卡片正在播放的过渡阶段；不在表里的已匹配卡片就是静止 visible */
type AnimatedPhase = "entering" | "exiting";

/** 关键字命中项目名 / README 标题 / 技术栈任意一处即算匹配 */
function matchedIdsOf(projects: Project[], keyword: string): Set<string> {
  return new Set(
    projects
      .filter(
        (project) =>
          !keyword ||
          [project.title, project.readme_title, ...project.tech_stack].some(
            (field) => field.toLowerCase().includes(keyword),
          ),
      )
      .map((project) => project.id),
  );
}

/**
 * 项目矩阵页主体。
 *
 * 自上而下：返回上级胶囊（126×36）→ 标题 / 副标题 → 搜索胶囊
 * （512×50）→ 1072px 项目网格。
 *
 * 过滤结果在渲染时直接由 query 派生，动画阶段只决定卡片挂哪个类：
 * 非匹配卡片若不在退场表中，会立刻被过滤掉——搜索本身不依赖动画回调。
 * 阶段表由输入事件同步维护，新命中的卡进入 entering，离开结果集的卡
 * 进入 exiting 并保留到动画结束。
 */
export function ProjectsMatrix({ projects }: ProjectsMatrixProps) {
  const [query, setQuery] = useState("");
  const [phases, setPhases] = useState<Record<string, AnimatedPhase>>({});
  // 上一次输入命中的 id 集合，用来判断哪张卡真正“进入 / 离开”了结果集
  const previousMatchedIds = useRef(
    new Set(projects.map((project) => project.id)),
  );

  function handleQueryChange(nextQuery: string) {
    const nextMatchedIds = matchedIdsOf(
      projects,
      nextQuery.trim().toLowerCase(),
    );
    const wasMatchedIds = previousMatchedIds.current;
    previousMatchedIds.current = nextMatchedIds;

    setPhases((current) => {
      const next = { ...current };

      for (const project of projects) {
        const wasMatched = wasMatchedIds.has(project.id);
        const isMatched = nextMatchedIds.has(project.id);

        if (wasMatched && !isMatched) {
          next[project.id] = "exiting";
        } else if (!wasMatched && isMatched) {
          next[project.id] = "entering";
        } else if (wasMatched && isMatched && next[project.id] === "exiting") {
          next[project.id] = "entering";
        }
      }

      return next;
    });

    setQuery(nextQuery);
  }

  // 入场动画结束 → 摘掉 entering，恢复 visible 与 hover 位移；
  // 退场动画结束 → 摘掉 exiting，卡片不再进入渲染列表。
  const handlePhaseComplete = useCallback(
    (id: string, phase: AnimatedPhase) => {
      setPhases((current) => {
        if (current[id] !== phase) return current;
        const next = { ...current };
        delete next[id];
        return next;
      });
    },
    [],
  );

  const keyword = query.trim().toLowerCase();
  const matchedIds = matchedIdsOf(projects, keyword);
  const cards: ProjectGridItem[] = [];

  for (const project of projects) {
    const phase = phases[project.id];

    if (matchedIds.has(project.id)) {
      cards.push({
        project,
        phase: phase === "entering" ? "entering" : "visible",
      });
    } else if (phase === "exiting") {
      cards.push({ project, phase: "exiting" });
    }
  }

  return (
    <section
      aria-label="项目矩阵"
      className="mx-auto flex w-full max-w-[1072px] flex-col gap-8"
    >
      <SmartLink
        href="/"
        className="glass-panel inline-flex h-9 w-[126px] items-center justify-center gap-1.5 rounded-full text-[13px] text-white/70 transition-colors hover:text-white font-yahei"
      >
        <Icon name="arrowRight" size={13} className="rotate-180" />
        返回上一级
      </SmartLink>

      <header className="flex flex-col gap-2">
        <h1 className="text-[38px] leading-[1.1] font-xiaowei text-white/95 sm:text-[50px]">
          Projects Matrix
        </h1>
        <p className="font-xiaowei text-[15px] text-white/50 sm:text-[16px]">
          开源项目、科研代码与自己瞎折腾的小玩意
        </p>
      </header>

      <ProjectSearch value={query} onChange={handleQueryChange} />

      <ProjectGrid
        cards={cards}
        hasQuery={keyword.length > 0}
        onPhaseComplete={handlePhaseComplete}
      />
    </section>
  );
}
