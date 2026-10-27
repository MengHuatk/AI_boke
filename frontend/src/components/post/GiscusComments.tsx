"use client";

import { useEffect, useRef } from "react";

/** giscus 三件套：仓库开 Discussions 后在 https://giscus.app/ 生成，填进 .env.local */
const GISCUS = {
  repo: process.env.NEXT_PUBLIC_GISCUS_REPO ?? "",
  repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID ?? "",
  categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID ?? "",
  category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY ?? "Announcements",
};

const CONFIGURED = Boolean(GISCUS.repo && GISCUS.repoId && GISCUS.categoryId);

/**
 * 评论区：giscus 嵌入壳。
 *
 * 「通过 GitHub 登录才可发表」这条规格由 giscus 自带——它的发表
 * 按钮就走 GitHub OAuth，评论本体寄存在本仓库的 Discussions 里，
 * 自家后端零工作量。giscus 官方姿势是注入 client.js，这里照办。
 *
 * 三个 env 没配齐时退化成一块说明牌，页面其余部分不受牵连。
 */
export function GiscusComments() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!CONFIGURED || !host) return;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", GISCUS.repo);
    script.setAttribute("data-repo-id", GISCUS.repoId);
    script.setAttribute("data-category", GISCUS.category);
    script.setAttribute("data-category-id", GISCUS.categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-theme", "transparent_dark");
    host.appendChild(script);
  }, []);

  if (!CONFIGURED) {
    return (
      <div className="glass-panel-subtle flex h-[120px] flex-col items-center justify-center gap-2 rounded-glass px-6 text-center text-[12px] leading-5 text-white/45">
        <span>评论区由 giscus 承载，GitHub 登录后方可发表</span>
        <span>待配置：NEXT_PUBLIC_GISCUS_REPO / _REPO_ID / _CATEGORY_ID</span>
      </div>
    );
  }

  return <div ref={hostRef} />;
}
