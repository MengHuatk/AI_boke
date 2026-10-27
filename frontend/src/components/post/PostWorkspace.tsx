import { PostArticle } from "@/components/post/PostArticle";
import { PostSidebar } from "@/components/post/PostSidebar";
import { extractHeadings } from "@/lib/markdown";
import type { PostDetail, PostSummary, Profile, SocialLink } from "@/lib/types";

interface PostWorkspaceProps {
  post: PostDetail;
  profile: Profile;
  socials: SocialLink[];
  /** 相关推荐：外层取「排除本篇之外的前几篇」 */
  related: PostSummary[];
}

/**
 * 文章页双栏 1152 宽：798 正文主件 + 34 中缝 + 320 右轨。
 * 容器本身透明——背景光效归 SiteShell，这里只管排布。
 *
 * 外壳 SiteShell 的 main 是 max-w-6xl + px-6，子内容可用宽被锁在
 * 1152 − 48 = 1104，缺口恰好就是 main 自己的左右内边距。本页在 lg
 * 档用 lg:-mx-6 + lg:w-[calc(100%+48px)] 把这 48px 吃回来，只越界
 * 到 main 的 padding 区（不溢出 main 的边框盒），全站其他页不受影响。
 * 容器自己不再加水平内边距，避免手机端与 main 的留白叠成双层。
 *
 * 响应式单断点（A 案）：lg 以下竖排——正文在上，右轨四盒拉满宽度
 * 依次堆在正文下方；lg 以上双栏，右轨回归 320。lg 档不设 flex-wrap：
 * 容器喂不饱 1152 时由主件收窄（lg:min-w-0）消化，右轨永远留在右侧。
 *
 * 刻意不设 items-start：右轨的 aside 必须拉伸到与主件同高，
 * 末位目录盒的 sticky 轨程才由正文长度决定（详见 PostSidebar）。
 */
export function PostWorkspace({ post, profile, socials, related }: PostWorkspaceProps) {
  return (
    <div className="flex w-full max-w-[1152px] flex-col gap-5 pt-6 pb-16 lg:-mx-6 lg:w-[calc(100%+48px)] lg:max-w-none lg:flex-row lg:gap-[34px]">
      <PostArticle post={post} />
      <PostSidebar
        profile={profile}
        socials={socials}
        related={related}
        headings={extractHeadings(post.body)}
      />
    </div>
  );
}
