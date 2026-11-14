"use client";

import { useEffect, useRef } from "react";

import { useTheme, type Theme } from "@/components/layout/useTheme";
import { commentConfig } from "@/lib/config";

/** 三个 id 齐了才注入脚本；缺一个就退化成说明牌 */
const CONFIGURED = Boolean(
  commentConfig.repo && commentConfig.repoId && commentConfig.categoryId,
);

/** giscus 官方支持的讨论映射方式 */
type GiscusMapping =
  | "pathname"
  | "url"
  | "title"
  | "og:title"
  | "specific"
  | "number";

interface GiscusCommentsProps {
  /** 默认按路径映射；说说与乐评用 specific + term 让每一条各开讨论 */
  mapping?: GiscusMapping;
  /** mapping="specific" 时作为讨论标题，例如 "moments/m-001" */
  term?: string;
}

/**
 * 站点自定义主题的地址。
 *
 * giscus 在 giscus.app 的 iframe 里用 <link crossorigin="anonymous"> 加载
 * 主题，跨域请求必须带 CORS 头；public/ 的静态文件没有这层头，所以由
 * app/giscus-theme/[theme]/route.ts 读取并补上。这里必须用站点 origin 拼
 * 绝对地址——相对路径会在 iframe 里被解析到 giscus.app 上。
 */
function giscusTheme(theme: Theme) {
  return `${window.location.origin}/giscus-theme/glass-${theme}`;
}

function giscusFrame(host: HTMLDivElement | null) {
  return host?.querySelector<HTMLIFrameElement>("iframe.giscus-frame") ?? null;
}

/** 切主题时只通知 iframe 换色，不重新注入脚本——重挂会丢掉正在写的草稿 */
function applyTheme(frame: HTMLIFrameElement | null, theme: Theme) {
  frame?.contentWindow?.postMessage(
    { giscus: { setConfig: { theme: giscusTheme(theme) } } },
    "https://giscus.app",
  );
}

/**
 * 评论区：giscus 嵌入壳。
 *
 * 「通过 GitHub 登录才可发表」这条规格由 giscus 自带——它的发表
 * 按钮就走 GitHub OAuth，评论本体寄存在评论仓库的 Discussions 里，
 * 自家后端零工作量。giscus 官方姿势是注入 client.js，这里照办。
 *
 * 默认按 pathname 映射，文章页直接 <GiscusComments /> 即可；
 * 说说与乐评传入 mapping="specific" 与 term，各自开独立讨论。
 *
 * 三个 id 没配齐时退化成一块说明牌，页面其余部分不受牵连。
 */
export function GiscusComments({
  mapping = "pathname",
  term,
}: GiscusCommentsProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const themeRef = useRef(theme);

  useEffect(() => {
    const host = hostRef.current;
    if (!CONFIGURED || !host) return;

    // mapping / term 变化时先清空，避免残留上一个 iframe
    host.replaceChildren();

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", commentConfig.repo);
    script.setAttribute("data-repo-id", commentConfig.repoId);
    script.setAttribute("data-category", commentConfig.category);
    script.setAttribute("data-category-id", commentConfig.categoryId);
    script.setAttribute("data-mapping", mapping);
    if (term) script.setAttribute("data-term", term);
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-theme", giscusTheme(themeRef.current));
    script.setAttribute("data-loading", "lazy");
    host.appendChild(script);

    // giscus 加载完、每次交互都会发 postMessage；借这个时机补上
    // 「脚本注入之后才切换的主题」，否则首帧颜色会停在旧主题
    const syncTheme = (event: MessageEvent) => {
      if (event.origin !== "https://giscus.app" || !event.data?.giscus) return;
      applyTheme(giscusFrame(host), themeRef.current);
    };
    window.addEventListener("message", syncTheme);

    return () => {
      window.removeEventListener("message", syncTheme);
      host.replaceChildren();
    };
  }, [mapping, term]);

  useEffect(() => {
    themeRef.current = theme;
    applyTheme(giscusFrame(hostRef.current), theme);
  }, [theme]);

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
