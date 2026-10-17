import type { ReactNode } from "react";

import { AuroraBackground } from "@/components/layout/AuroraBackground";
import { DanMu } from "@/components/layout/DanMu";
import { FireflyShadow } from "@/components/layout/FireflyShadow";
import { GrassField } from "@/components/layout/GrassField";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Ripple } from "@/components/layout/Ripple";
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

      {/* 视口底部的草坪装饰层，垫在所有内容之下，仅电脑端显示 */}
      <GrassField />

      {/* 视空中的萤火虫光点层，垫在草地之上、所有内容之下，仅电脑端显示 */}
      <FireflyShadow />

      {/* 视口上三分之一的字体弹幕层，垫在萤火虫之上、所有内容之下，仅电脑端显示 */}
      <DanMu />

      <Navbar site={site} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      <Footer site={site} />

      {/* 盖在最上层的点击涟漪层，只看不拦交互 */}
      <Ripple />
    </div>
  );
}