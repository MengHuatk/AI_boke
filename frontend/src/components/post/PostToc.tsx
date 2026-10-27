"use client";

import { cn } from "@/lib/format";
import type { HeadingEntry } from "@/lib/markdown";

/**
 * 目录盒 320×238：右列末位挂 sticky 轨道（定位由 PostSidebar 那层给）。
 * 点子用 scrollIntoView 平滑滚动整页；标题自带 scroll-mt-[110px]，
 * 滚完正好停在锚点轨下方 38px 处，不会被 72px 的导航栏压住头。
 */
export function PostToc({ headings }: { headings: HeadingEntry[] }) {
  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      aria-label="正文目录"
      className="glass-panel flex h-[238px] w-full shrink-0 flex-col gap-2 rounded-glass px-5 py-4"
    >
      <span className="font-xiaowei text-[13px] text-white/60">目录</span>
      <ul className="archive-lookup-scroll flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
        {headings.map((h) => (
          <li key={h.id}>
            <button
              type="button"
              onClick={() => jump(h.id)}
              className={cn(
                "block w-full truncate text-left text-[12.5px] leading-5 text-white/55 transition-colors hover:text-[#9aa5ff]",
                h.level === 3 && "pl-4",
              )}
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
