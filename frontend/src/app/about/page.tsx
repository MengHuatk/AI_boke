import { AboutCard } from "@/components/about/AboutCard";
import { toStaticActivity } from "@/lib/activity";
import { getHomeData, getRecentPosts } from "@/lib/api";
import { MOMENTS } from "@/lib/moments-fixtures";
import { TALKS } from "@/lib/talks-fixtures";

/**
 * 关于页（/about）。
 *
 * 导航栏里的「关于」项来自 site.json 的 nav 字段，首页 Hero 的
 * 「关于我」按钮也指向这里，本文件补上对应路由。
 *
 * 头像与首页 Hero 同源（都取 profile.avatar），背景、导航、页脚仍由
 * 根布局的 SiteShell 统一提供；页面只负责取资料并把主体交给 AboutCard。
 *
 * 「思绪动态」的时间轴里，文章来自后端 /posts，杂谈与说说仍是本地
 * fixture。后者只在这里映射成轻量条目，不把整篇正文发给客户端。
 */
export const metadata = {
  title: "关于我",
};

export default async function AboutPage() {
  const [{ data }, { data: posts }] = await Promise.all([
    getHomeData(),
    getRecentPosts(),
  ]);

  return (
    <AboutCard
      avatar={data.profile.avatar}
      authorName={data.profile.name}
      initialPosts={posts}
      staticItems={toStaticActivity(TALKS, MOMENTS)}
    />
  );
}
