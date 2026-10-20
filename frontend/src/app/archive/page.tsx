import { ArchiveBanner } from "@/components/archive/ArchiveBanner";

/**
 * 归档页（/archive）。
 *
 * 导航栏里的「归档」项来自后端 site.json 的 nav 字段，这里补上
 * 对应路由让它不再是死链。背景、导航、页脚由根布局的 SiteShell
 * 统一提供，页面本身只管往 main 区域塞内容。
 *
 * 当前主体是一屏高的档案预留横幅（ArchiveBanner），
 * 后续归档内容直接替换/填充该组件内部即可。
 */
export const metadata = {
  title: "归档",
};

export default function ArchivePage() {
  return <ArchiveBanner />;
}
