import { TalkArticle } from "@/components/talks/TalkArticle";
import { TalkSidebar } from "@/components/talks/TalkSidebar";
import type { Profile, SocialLink, Talk, TalkDetail } from "@/lib/types";

interface TalkWorkspaceProps {
  talk: TalkDetail;
  profile: Profile;
  socials: SocialLink[];
  /** 相关杂谈：外层取「排除本篇之外的前几篇」 */
  related: Talk[];
}

/**
 * 杂谈详情双栏 1152 宽：798 正文主件 + 34 中缝 + 320 右轨。
 * 容器本身透明——背景光效归 SiteShell，这里只管排布。
 *
 * 外壳 SiteShell 的 main 是 max-w-6xl + px-6，子内容可用宽被锁在
 * 1152 − 48 = 1104；本页在 lg 档用 lg:-mx-6 + lg:w-[calc(100%+48px)]
 * 把这 48px 吃回来，只越界到 main 的 padding 区。
 *
 * 刻意不设 items-start：右轨的 aside 必须拉伸到与主件同高，
 * 末位日历盒的 sticky 轨程才由正文长度决定（详见 TalkSidebar）。
 */
export function TalkWorkspace({
  talk,
  profile,
  socials,
  related,
}: TalkWorkspaceProps) {
  return (
    <div className="flex w-full max-w-[1152px] flex-col gap-5 pt-6 pb-16 lg:-mx-6 lg:w-[calc(100%+48px)] lg:max-w-none lg:flex-row lg:gap-[34px]">
      <TalkArticle talk={talk} />
      <TalkSidebar
        profile={profile}
        socials={socials}
        related={related}
        publishedAt={talk.published_at}
      />
    </div>
  );
}
