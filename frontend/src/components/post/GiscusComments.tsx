"use client";

import { useEffect, useRef } from "react";

import { useTheme } from "@/components/layout/useTheme";

/** giscus 三件套：仓库开 Discussions 后在 https://giscus.app/ 生成，填进 .env.local */
const GISCUS = {
  repo: process.env.NEXT_PUBLIC_GISCUS_REPO ?? "",
  repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID ?? "",
  categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID ?? "",
  category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY ?? "Announcements",
};

const CONFIGURED = Boolean(GISCUS.repo && GISCUS.repoId && GISCUS.categoryId);

/** giscus 官方支持的讨论映射方式 */
type GiscusMapping =
  | "pathname"
  | "url"
  | "title"
  | "og:title"
  | "specific"
  | "number";

interface GiscusCommentsProps {
  /** 默认按路径映射；说说用 specific + term 让每条动态拥有独立讨论 */
  mapping?: GiscusMapping;
  /** mapping="specific" 时作为讨论标题，例如 "moments/m-001" */
  term?: string;
}

/**
 * 评论区：giscus 嵌入壳。
 *
 * 「通过 GitHub 登录才可发表」这条规格由 giscus 自带——它的发表
 * 按钮就走 GitHub OAuth，评论本体寄存在本仓库的 Discussions 里，
 * 自家后端零工作量。giscus 官方姿势是注入 client.js，这里照办。
 *
 * 默认按 pathname 映射，文章页直接 <GiscusComments /> 即可；
 * 说说页传入 mapping="specific" 与 term，让每条说说各自开一个讨论。
 *
 * 三个 env 没配齐时退化成一块说明牌，页面其余部分不受牵连。
 */
export function GiscusComments({
  mapping = "pathname",
  term,
}: GiscusCommentsProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  useEffect(() => {
    const host = hostRef.current;
    if (!CONFIGURED || !host) return;

    // mapping / term 变化时先清空，避免残留上一个 iframe
    host.replaceChildren();

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", GISCUS.repo);
    script.setAttribute("data-repo-id", GISCUS.repoId);
    script.setAttribute("data-category", GISCUS.category);
    script.setAttribute("data-category-id", GISCUS.categoryId);
    script.setAttribute("data-mapping", mapping);
    if (term) script.setAttribute("data-term", term);
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-theme", theme === "day" ? "light" : "transparent_dark");
    host.appendChild(script);

    return () => {
      host.replaceChildren();
    };
  }, [mapping, term, theme]);

  if (!CONFIGURED) {
    return (
      <div className="glass-panel-subtle flex h-[120px] flex-col items-center justify-center gap-2 rounded-glass px-6 text-center text-[12px] leading-5 text-white/45">
        <span>评论区由 giscus 承载，GitHub 登录后方可发表</span>
        <span>待配置：NEXT_PUBLIC_GISCUS_REPO / _REPO_ID / _CATEGORY_ID</span>
      </div>
    );
  }

  return <div ref={hostRef} className="min-h-[320px]" />;
}
