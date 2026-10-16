import type { ReactNode } from "react";

import { AuroraBackground } from "@/components/layout/AuroraBackground";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getSite } from "@/lib/api";

interface SiteShellProps {
  children: ReactNode;
}

/**
 * 全站外壳：背景 + 导航 + 内容 + 页脚。
 *
 * 由根布局 layout.tsx 调用一次，之后新增的任何页面都会自动获得
 * 一致的背景、导航和页脚，不需要在页面里重复拼装。
 *
 * 站点配置在这里取一次，导航栏和页脚共用，避免重复请求。
 */
export async function SiteShell({ children }: SiteShellProps) {
  const { data: site } = await getSite();

  return (
    <div className="relative flex min-h-dvh flex-col">
      <AuroraBackground />
      <Navbar site={site} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      <Footer site={site} />
    </div>
  );
}