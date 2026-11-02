import { MomentsFeed } from "@/components/moments/MomentsFeed";
import { MOMENT_AUTHOR, MOMENTS } from "@/lib/moments-fixtures";

/**
 * 说说页（/moments）。
 *
 * 导航栏里的「说说」项来自后端 site.json 的 nav 字段，这里补上
 * 对应路由。背景、导航、页脚由根布局的 SiteShell 统一提供；
 * 页面只负责把本地 fixture 交给客户端动态流。
 *
 * 当前数据来自 lib/moments-fixtures，后端接口接入后换成真实
 * Moment[] 即可，组件与布局骨架不动。
 */
export const metadata = {
  title: "生活动态",
};

export default function MomentsPage() {
  return <MomentsFeed moments={MOMENTS} author={MOMENT_AUTHOR} />;
}
