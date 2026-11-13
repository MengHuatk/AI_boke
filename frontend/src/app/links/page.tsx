import { LinksBanner } from "@/components/links/LinksBanner";
import { DevNotice } from "@/components/ui/DevNotice";
import { getFriendLinks } from "@/lib/api";

/**
 * 友链页（/links）。
 *
 * 导航栏里的「友链」项来自 site.json 的 nav 字段，这里补上对应路由。
 * 背景、导航、页脚由根布局的 SiteShell 统一提供；页面在服务端取
 * 已发布友链，后端不可用时展示空列表与提示。
 */
export const metadata = {
  title: "云端引力",
};

export default async function LinksPage() {
  const { data: friends, source } = await getFriendLinks();

  return (
    <>
      {source === "fallback" && (
        <DevNotice message="后端未连接，友链暂时没有内容。启动 backend 后刷新即可看到真实友链。" />
      )}
      <LinksBanner friends={friends} />
    </>
  );
}
