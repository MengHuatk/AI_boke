import Image from "next/image";

import { PostNowPlaying } from "@/components/post/PostNowPlaying";
import { PostToc } from "@/components/post/PostToc";
import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import type { HeadingEntry } from "@/lib/markdown";
import type { PostSummary, Profile, SocialLink } from "@/lib/types";

interface PostSidebarProps {
  profile: Profile;
  socials: SocialLink[];
  related: PostSummary[];
  headings: HeadingEntry[];
}

/**
 * 右轨四盒，自上而下：自我介绍 320×228.5 → 正在播放 320×210（PostNowPlaying）→
 * 其他文档 320×235 → 目录 320×238。
 *
 * 目录盒是唯一的例外件：外面套一层 sticky 轨道——前三盒随列滚动，
 * 滚过之后目录咬在导航栏（h-18 = 72px）下方 38px 处。sticky 的行程
 * 由列高决定，所以这列绝不能 items-start：aside 必须拉伸到与正文
 * 主件同高，目录才有得滚（见 PostWorkspace）。
 *
 * 响应式（单断点 A 案）：lg 以上是 320 右轨；lg 以下整列降到正文
 * 下方、拉满视口宽，四盒全部 w-full。窄屏时目录已落在页尾，sticky
 * 黏在 110px 没有意义，一并取消——只剩 lg 档的轨道。
 */
export function PostSidebar({ profile, socials, related, headings }: PostSidebarProps) {
  return (
    <aside className="flex w-full flex-col gap-5 lg:w-[320px] lg:shrink-0">
      {/* 1 · 自我介绍：内容与首页 Hero 同源的浓缩版 */}
      <div className="glass-panel-thick flex h-[228.5px] w-full shrink-0 flex-col items-center justify-center gap-3 rounded-glass px-6">
   <div className="rounded-full bg-gradient-to-br from-[#5D4CC2] to-[#A656DB] p-[4px] transition-all duration-600 hover:rotate-10 ">
  <Image
    src={profile.avatar}
    alt=""
    width={72}
    height={72}
    unoptimized
    className="rounded-full object-cover block"
  />
</div>
        <span className="font-xiaowei text-[22px] text-white/85">{profile.name}</span>
        <p className="line-clamp-2 text-center font-xiaowei text-[12px] leading-5 text-white/50">
          {profile.bio}
        </p>
        <div className="flex items-center gap-3 pt-1">
          {socials.map((social) => (
            <SmartLink
              key={social.label}
              href={social.href}
              className="text-white/45 transition-colors hover:text-white"
            >
              <Icon name={social.icon} size={16} />
              <span className="sr-only">{social.label}</span>
            </SmartLink>
          ))}
        </div>
      </div>

      {/* 2 · 正在播放：与全站音乐状态同源，标题/唱片/歌词都在组件内 */}
      <PostNowPlaying />

      {/* 3 · 其他文档：三篇标题一行、时间一行 */}
      <div className="glass-panel-thick flex h-[235px] w-full shrink-0 flex-col rounded-glass px-6 py-5">
        <span className="font-xiaowei text-[13px] text-white/60">其他文档</span>
        <div className="flex min-h-0 flex-1 flex-col justify-evenly">
          {related.map((item) => (
            <SmartLink
              key={item.id}
              href={`/posts/${item.slug}`}
              className="group flex flex-col gap-0.5"
            >
              <span className="truncate font-xiaowei text-[13px] leading-5 text-white/80 group-hover:text-[#906eff]">
                {item.title}
              </span>
              <span className="text-[11px] leading-4 text-white/40 tabular-nums">
                {item.published_at.slice(0, 10)}
              </span>
            </SmartLink>
          ))}
        </div>
      </div>

      {/* 4 · 目录（lg 档的 sticky 轨；窄屏随列静态排布） */}
      <div className="lg:sticky lg:top-[110px]">
        <PostToc headings={headings} />
      </div>
    </aside>
  );
}
