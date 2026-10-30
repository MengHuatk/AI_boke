import { MusicStage } from "@/components/music/MusicStage";

/**
 * 音乐页（/music）。
 *
 * 导航项已由后端的 site.nav 提供，这里只补上对应路由。
 * 背景、导航、页脚由根布局的 SiteShell 统一提供，
 * 页面本身只渲染 MusicStage。
 */
export const metadata = {
  title: "音乐",
};

export default function MusicPage() {
  return <MusicStage />;
}
