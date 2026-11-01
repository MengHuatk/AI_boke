import { PhotoGallery } from "@/components/photo/PhotoGallery";
import { PHOTO_ALBUMS } from "@/lib/photo-fixtures";

/**
 * 照片墙（/photos）。
 *
 * 导航项「照片墙」来自后端 site.json 的 nav 字段，这里补上对应路由。
 * 背景、导航、页脚由根布局的 SiteShell 统一提供；页面本身只负责
 * 标题栏、照片集区与详情态。
 *
 * 当前照片集来自 lib/photo-fixtures 的测试数据，后端接口接入后
 * 换成真实数据即可，组件与布局骨架不动。
 */
export const metadata = {
  title: "光影画廊",
};

export default function PhotosPage() {
  return <PhotoGallery albums={PHOTO_ALBUMS} />;
}
