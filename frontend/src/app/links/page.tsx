import { LinksBanner } from "@/components/links/LinksBanner";
import { FRIEND_LINKS } from "@/lib/links-fixtures";

/**
 * 友链页（/links）。
 *
 * 导航栏里的「友链」项来自 site.json 的 nav 字段，这里补上对应路由。
 * 背景、导航、页脚由根布局的 SiteShell 统一提供；页面只把本地 fixture
 * 交给主体。后端接口接入后替换 fixture 来源即可，布局骨架不动。
 */
export const metadata = {
  title: "云端引力",
};

export default function LinksPage() {
  return <LinksBanner friends={FRIEND_LINKS} />;
}
