"use client";

import { usePathname } from "next/navigation";
import { ViewTransition, type ReactNode } from "react";

/**
 * 路由级过渡。
 *
 * 不能依赖 template 的重挂载来触发入场：Next 的 template 只在「自己所在的
 * 段」变化时重建，站点里的跳转都发生在更深的段，根 template 会一直挂着。
 * 所以这里显式用 pathname 作为 ViewTransition 的 key——路径一变，旧的
 * ViewTransition 退出、新的进入，React 才会把旧页/新页两张快照交给浏览器
 * 做交叉过渡（同 Next 文档里 key={slug} 的用法）。
 *
 * 只包一层 div 是刻意的：ViewTransition 会把 view-transition-name 传给
 * 子宿主节点，包成单个节点才能让整页共用同一个过渡分组，不会因页面顶层
 * 块数量不同而拆成多组。导航栏、背景轮播、弹幕、页脚都在 main 之外，
 * 不参与内容组的快照；它们留在 root 快照里，过渡期间保持静态画面。
 *
 * 首屏没有旧页面可交叉，入场由 SiteShell 的 .route-enter-initial 负责；
 * 这里只管站内导航。enter / exit 的类名在 globals.css 里定义。
 */
export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ViewTransition
      key={pathname}
      name="route"
      enter="route-in"
      exit="route-out"
      default="none"
    >
      <div>{children}</div>
    </ViewTransition>
  );
}
