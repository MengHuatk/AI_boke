import Image from "next/image";

import { PostNowPlaying } from "@/components/post/PostNowPlaying";
import { TalkCalendar } from "@/components/talks/TalkCalendar";
import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import type { Profile, SocialLink, Talk } from "@/lib/types";

interface TalkSidebarProps {
  profile: Profile;
  socials: SocialLink[];
  related: Talk[];
  /** 本篇发布时间，交给日历盒定位高亮日期 */
  publishedAt: string;
}

/**
 * 杂谈详情右轨四盒，自上而下：自我介绍 320×228.5 → 正在播放 320×210 →
 * 其他杂谈 320×235 → 发布日期日历 320×341。
 *
 * 前三盒照搬文章页右轨；第四盒把目录替换成日历。日历沿用目录盒的
 * sticky 轨道——前三盒随列滚动，滚过之后日历咬在导航栏（h-18 = 72px）
 * 下方 38px 处。sticky 的行程由列高决定，所以这列绝不能 items-start：
 * aside 必须拉伸到与正文主件同高（见 TalkWorkspace）。
 *
 * 响应式与文章页一致：lg 以上 320 右轨；lg 以下整列降到正文下方、
 * 拉满视口宽，日历也取消 sticky，随列静态排布。
 */
export function TalkSidebar({
  profile,
  socials,
  related,
  publishedAt,
}: TalkSidebarProps) {
  return (
    <aside className="flex w-full flex-col gap-5 lg:w-[320px] lg:shrink-0">
      {/* 1 · 自我介绍：内容与首页 Hero 同源的浓缩版 */}
      <div className="glass-panel-thick flex h-[228.5px] w-full shrink-0 flex-col items-center justify-center gap-3 rounded-glass px-6">
        <div className="rounded-full bg-gradient-to-br from-[#5D4CC2] to-[#A656DB] p-[4px] transition-all duration-600 hover:rotate-10">
          <Image
            src={profile.avatar}
            alt=""
            width={72}
            height={72}
            unoptimized
            className="block rounded-full object-cover"
          />
        </div>
        <span className="font-xiaowei text-[22px] text-white/85">
          {profile.name}
        </span>
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

      {/* 2 · 正在播放：与全站音乐状态同源 */}
      <PostNowPlaying />

      {/* 3 · 其他杂谈：三篇标题一行、时间一行 */}
      <div className="glass-panel-thick flex h-[235px] w-full shrink-0 flex-col rounded-glass px-6 py-5">
        <span className="font-xiaowei text-[13px] text-white/60">其他杂谈</span>
        <div className="flex min-h-0 flex-1 flex-col justify-evenly">
          {related.map((item) => (
            <SmartLink
              key={item.id}
              href={`/talks/${item.slug}`}
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

      {/* 4 · 发布日期日历（lg 档的 sticky 轨） */}
      <div className="lg:sticky lg:top-[110px]">
        <TalkCalendar publishedAt={publishedAt} />
      </div>
    </aside>
  );
}
