import { FeaturedPosts } from "@/components/home/FeaturedPosts";
import { FireflyShadow } from "@/components/home/FireflyShadow";
import { GrassField } from "@/components/home/GrassField";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsCard } from "@/components/home/StatsCard";
import { TagCloud } from "@/components/home/TagCloud";
import { DevNotice } from "@/components/ui/DevNotice";
import { getHomeData } from "@/lib/api";

/**
 * 首页。
 *
 * 页面只做两件事：取数据、把区块拼起来。
 * 每个区块是一个独立组件，想调整顺序或增删区块，改下面的 JSX 结构即可。
 *
 * 新增一个区块的做法：
 *   1. 在 components/home/ 下新建组件，用 GlassCard 作容器；
 *   2. 需要新数据就在 lib/api.ts 加一个 fetch 函数，并在 lib/types.ts 补类型；
 *   3. 在这里 import 并插到合适的位置。
 *
 * 目前是一个两栏布局：左栏放主内容，右栏放辅助信息。
 * 屏幕较窄时自动堆叠成单栏。
 */
export default async function HomePage() {
  const { data, source } = await getHomeData();
  const { profile, featured_posts, tags, stats } = data;

  return (
    <>
      {source === "fallback" && (
        <DevNotice message="后端未连接，当前展示的是本地示例数据。启动 backend 后刷新即可看到真实内容。" />
      )}

      {/* 视口底部的草坪装饰层，垫在所有内容之下，仅电脑端显示 */}
      <GrassField />

      {/* 视空中的萤火虫光点层，垫在草地之上、所有内容之下，仅电脑端显示 */}
      <FireflyShadow />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* 左栏：自我介绍 + 精选文章 */}
        <div className="flex flex-col gap-5">
          <HeroSection profile={profile} stats={stats} />
          <FeaturedPosts posts={featured_posts} />
        </div>

        {/* 右栏：辅助信息 */}
        <div className="flex flex-col gap-5">
          <StatsCard stats={stats} />
          <TagCloud tags={tags} />
        </div>
      </div>
    </>
  );
}