import { ArchiveBanner } from "@/components/archive/ArchiveBanner";
import { DevNotice } from "@/components/ui/DevNotice";
import { getPublishedPosts } from "@/lib/api";

/**
 * 归档页（/archive）。
 *
 * 导航栏里的「归档」项来自后端 site.json 的 nav 字段，这里补上
 * 对应路由让它不再是死链。背景、导航、页脚由根布局的 SiteShell
 * 统一提供，页面本身只管往 main 区域塞内容。
 *
 * 文章在服务端一次性取好，交给客户端主体做标签过滤、搜索与视图
 * 切换；后端不可用时返回空列表，并给出一条开发提示，不展示任何
 * 占位文章。
 */
export const metadata = {
  title: "归档",
};

export default async function ArchivePage() {
  const { data: posts, source } = await getPublishedPosts();

  return (
    <>
      {source === "fallback" && (
        <DevNotice message="后端未连接，归档暂时没有内容。启动 backend 后刷新即可看到真实文章。" />
      )}
      <ArchiveBanner posts={posts} />
    </>
  );
}
