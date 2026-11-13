import { TalksBanner } from "@/components/talks/TalksBanner";
import { DevNotice } from "@/components/ui/DevNotice";
import { getTalks } from "@/lib/api";

/**
 * 杂谈页（/talks）。
 *
 * 导航栏里的「杂谈」项来自 site.json 的 nav 字段，这里补上对应路由。
 * 背景、导航、页脚由根布局的 SiteShell 统一提供；页面只把接口数据
 * 交给客户端主体。后端不可用时显示空列表与开发提示。
 */
export const metadata = {
  title: "云端杂谈",
};

export default async function TalksPage() {
  const result = await getTalks();

  return (
    <>
      {result.source === "fallback" && (
        <DevNotice message="后端未连接，杂谈列表暂时为空。启动 backend 后刷新即可看到真实内容。" />
      )}
      <TalksBanner talks={result.data} />
    </>
  );
}
