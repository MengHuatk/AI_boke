import type { PostSummary, Talk } from "@/lib/types";
import { ArchiveShowcase } from "./ArchiveShowcase";
import { PhotoSpotlight, type PhotoSpotlightData } from "./PhotoSpotlight";
import { TalkShowcase } from "./TalkShowcase";
import { ThemeModeCard } from "./ThemeModeCard";

interface HomeShowcaseProps {
  posts: PostSummary[];
  talks: Talk[];
  /** 后端还没有照片集时为 null，用同尺寸占位卡保持右列高度。 */
  spotlight: PhotoSpotlightData | null;
}

/**
 * 首页歌词盒下方的精选区（桌面 1068×462）。
 *
 * 左侧 340×462 归档轮播，右侧上下两层：705×218 相册精选 +
 * 705×218 的「杂谈轮播（461）+ 主题占位（220）」。
 * 340 + 23 间距 + 705 = 1068；右列 218 + 26 间距 + 218 = 462，
 * 与左栏同高。xl 以下整体改为纵向堆叠，各块保留固定高度。
 */
export function HomeShowcase({ posts, talks, spotlight }: HomeShowcaseProps) {
  return (
    <section
      aria-label="归档、相册与杂谈精选"
      className="flex w-full flex-col gap-6 xl:max-w-[1068px] xl:flex-row xl:gap-[23px]"
    >
      <ArchiveShowcase posts={posts} />

      <div className="flex w-full flex-col gap-6 xl:w-[705px] xl:gap-6.5">
        {spotlight ? (
          <PhotoSpotlight {...spotlight} />
        ) : (
          <div className="glass-panel grid h-[218px] w-full place-items-center rounded-glass text-sm text-white/40">
            还没有照片集，去后台添加一组吧
          </div>
        )}

        <div className="flex flex-col gap-6 sm:flex-row xl:h-[218px] xl:gap-6">
          <TalkShowcase talks={talks} />
          <ThemeModeCard />
        </div>
      </div>
    </section>
  );
}
