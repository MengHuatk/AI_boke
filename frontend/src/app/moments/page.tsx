import { MomentsFeed } from "@/components/moments/MomentsFeed";
import { DevNotice } from "@/components/ui/DevNotice";
import { getMoments, getProfile } from "@/lib/api";

/**
 * 说说页（/moments）。
 *
 * 导航栏里的「说说」项来自后端 site.json 的 nav 字段，这里补上
 * 对应路由。背景、导航、页脚由根布局的 SiteShell 统一提供；
 * 页面从 `/moments` 取动态、从 `/profile` 取作者，交给客户端动态流。
 * 后端不可用时显示空列表与开发提示。
 */
export const metadata = {
  title: "生活动态",
};

export default async function MomentsPage() {
  const [momentsResult, profileResult] = await Promise.all([
    getMoments(),
    getProfile(),
  ]);

  return (
    <>
      {momentsResult.source === "fallback" && (
        <DevNotice message="后端未连接，生活动态暂时为空。启动 backend 后刷新即可看到真实内容。" />
      )}
      <MomentsFeed
        moments={momentsResult.data}
        author={{
          name: profileResult.data.name,
          avatar: profileResult.data.avatar,
        }}
      />
    </>
  );
}
