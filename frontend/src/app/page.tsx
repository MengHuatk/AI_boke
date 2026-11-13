import { HomeLyricsBar } from "@/components/home/HomeLyricsBar";
import { HomeMusicCard } from "@/components/home/HomeMusicCard";
import { HomeProfileCard } from "@/components/home/HomeProfileCard";
import { HomeSearch } from "@/components/home/HomeSearch";
import { HomeShowcase } from "@/components/home/HomeShowcase";
import { DevNotice } from "@/components/ui/DevNotice";
import {
  getAlbums,
  getHomeData,
  getRecentPosts,
  getTalks,
  pickRandomSpotlight,
} from "@/lib/api";

/** 精选区每条轮播展示的条数 */
const SHOWCASE_LIMIT = 6;

/**
 * 首页。
 *
 * 自上而下：居中搜索框 → 自我简介卡 + 迷你音乐卡 → 大字歌词盒 →
 * 归档 / 相册 / 杂谈精选区。搜索覆盖归档文章与杂谈的标题 / 简介 / 标签；
 * 文章与杂谈数据在服务端取好一次性下发给客户端搜索组件。
 * 相册精选每次服务端渲染随机挑一张照片，随 props 下发，避免水合不一致。
 */
export default async function HomePage() {
  const [{ data, source }, { data: posts }, { data: albums }, { data: talks }] =
    await Promise.all([
      getHomeData(),
      getRecentPosts(100),
      getAlbums(),
      getTalks(),
    ]);
  const { profile, stats } = data;
  const photoCount = albums.reduce(
    (total, album) => total + album.photos.length,
    0,
  );

  // 每次服务端渲染随机一张相片；页面受 60s 缓存影响，刷新间隔足够时才会换
  const spotlight = pickRandomSpotlight(albums);

  return (
    <>
      {source === "fallback" && (
        <DevNotice message="后端未连接，当前展示的是本地示例数据。启动 backend 后刷新即可看到真实内容。" />
      )}

      <div className="flex flex-col items-center gap-6 pt-2 sm:pt-6">
        <HomeSearch posts={posts} talks={talks} />

        <div className="flex w-full flex-col justify-center gap-5 xl:max-w-[1068px] xl:flex-row">
          <HomeProfileCard
            profile={profile}
            articleCount={stats.posts}
            talkCount={talks.length}
            photoCount={photoCount}
          />
          <HomeMusicCard />
        </div>

        <HomeLyricsBar />

        <HomeShowcase
          posts={posts.slice(0, SHOWCASE_LIMIT)}
          talks={talks.slice(0, SHOWCASE_LIMIT)}
          spotlight={spotlight}
        />
      </div>
    </>
  );
}
