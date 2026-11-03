import { TalksBanner } from "@/components/talks/TalksBanner";

/**
 * 杂谈页（/talks）。
 *
 * 导航栏里的「杂谈」项来自 site.json 的 nav 字段，这里补上对应路由。
 * 背景、导航、页脚由根布局的 SiteShell 统一提供；页面只把本地 fixture
 * 交给客户端主体。后端接口接入后替换 fixture 来源即可，布局骨架不动。
 */
export const metadata = {
  title: "云端杂谈",
};

export default function TalksPage() {
  return <TalksBanner />;
}
