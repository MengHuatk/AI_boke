import { TalksBanner } from "@/components/talks/TalksBanner";
import { getTalks } from "@/lib/api";

/**
 * 杂谈页（/talks）。
 *
 * 导航栏里的「杂谈」项来自 site.json 的 nav 字段，这里补上对应路由。
 * 背景、导航、页脚由根布局的 SiteShell 统一提供；页面只把接口数据
 * 交给客户端主体。后端不可用时 getTalks 会退回本地 fixture。
 */
export const metadata = {
  title: "云端杂谈",
};

export default async function TalksPage() {
  const result = await getTalks();

  return <TalksBanner talks={result.data} />;
}
