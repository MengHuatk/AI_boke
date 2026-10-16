import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteShell } from "@/components/layout/SiteShell";
import { getSite } from "@/lib/api";
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
 * 只负责三件事：字体变量、全局样式、套上 SiteShell。
 * 页面本身不关心背景/导航/页脚，新增路由自动继承。
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={uiConfig.locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}