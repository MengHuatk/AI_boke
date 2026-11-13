import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SakuraPetals } from "@/components/layout/SakuraPetals";
import { SiteShell } from "@/components/layout/SiteShell";
import { Live2DAnon } from "@/components/live2d/Live2DAnon";
import { MiniMusicPlayer } from "@/components/music/MiniMusicPlayer";
import { MusicProvider } from "@/components/music/MusicProvider";
import { MusicRain } from "@/components/music/MusicRain";
import { RainControl } from "@/components/music/RainControl";
import { RainSettingsProvider } from "@/components/music/RainSettingsProvider";
import { getMusicTracks, getSite } from "@/lib/api";
import { uiConfig } from "@/lib/config";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * 站点元信息同样来自后端，和页面内容保持同一个数据源。
 * 后端不可用时 getSite() 会退回本地示例数据，不会让构建失败。
 */
export async function generateMetadata(): Promise<Metadata> {
  const { data: site } = await getSite();

  return {
    title: {
      default: site.title,
      // 子页面只需导出 title: "文章标题"，即可自动拼成 "文章标题 · Glass Notes"
      template: `%s · ${site.name}`,
    },
    description: site.description,
    authors: [{ name: site.author }],
    openGraph: {
      title: site.title,
      description: site.description,
      type: "website",
    },
  };
}

/**
 * 根布局。
 *
 * 只负责字体变量、全局样式和站点外壳；播放状态放在
 * MusicProvider 这一层，站内切页时不会卸载，音乐可以连续播放。
 * 页面本身不关心背景/导航/页脚，新增路由自动继承。
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { data: tracks } = await getMusicTracks();

  return (
    <html
      lang={uiConfig.locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* 首帧前恢复本地主题，避免日间用户先看到一帧夜色。
            服务端输出 text/javascript 立即执行；客户端 hydration 时渲染为
            text/plain，避免 React 对组件内 <script> 的告警。 */}
        <script
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `if(localStorage.getItem("glass-notes-theme")==="day")document.documentElement.dataset.theme="day";`,
          }}
        />
      </head>
      <body className="min-h-full">
        <MusicProvider tracks={tracks}>
          <RainSettingsProvider>
            <SiteShell>{children}</SiteShell>
            <MusicRain />
            <SakuraPetals />
            <MiniMusicPlayer />
            <RainControl />
            <Live2DAnon />
          </RainSettingsProvider>
        </MusicProvider>
      </body>
    </html>
  );
}