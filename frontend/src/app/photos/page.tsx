import { PhotoGallery } from "@/components/photo/PhotoGallery";
import { DevNotice } from "@/components/ui/DevNotice";
import { getAlbums } from "@/lib/api";

/**
 * 照片墙（/photos）。
 *
 * 导航项「照片墙」来自后端 site.json 的 nav 字段，这里补上对应路由。
 * 背景、导航、页脚由根布局的 SiteShell 统一提供；页面在服务端取
 * 已发布照片集，后端不可用时展示空列表与提示，而不是本地 fixture。
 */
export const metadata = {
  title: "光影画廊",
};

export default async function PhotosPage() {
  const { data: albums, source } = await getAlbums();

  return (
    <>
      {source === "fallback" && (
        <DevNotice message="后端未连接，照片墙暂时没有内容。启动 backend 后刷新即可看到真实照片集。" />
      )}
      <PhotoGallery albums={albums} />
    </>
  );
}
