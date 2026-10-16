import Image from "next/image";

import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { TagChip } from "@/components/ui/TagChip";
import type { Profile, SiteStats } from "@/lib/types";

interface HeroSectionProps {
  profile: Profile;
  stats: SiteStats;
}

/**
 * 首屏主卡：头像 + 自我介绍 + 技能 + 行动入口。
 *
 * 所有文案来自后端 profile.json，组件里没有硬编码的自我介绍。
 */
export function HeroSection({ profile, stats }: HeroSectionProps) {
  return (
    <GlassCard padding="lg" className="animate-fade-up">
      <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:gap-8">
        {/* 头像 */}
        <div className="relative shrink-0">
          {/* 渐变光晕，让头像从玻璃里「浮」出来 */}
          <div className="absolute -inset-1.5 rounded-[1.75rem] bg-gradient-to-br from-brand-400/50 via-aurora-cyan/30 to-transparent blur-md" />
          <Image
            src={profile.avatar}
            alt={`${profile.name} 的头像`}
            width={104}
            height={104}
            priority
            // 头像可能是 SVG 或站外地址，跳过图片优化管线，
            // 免得为每个来源单独配 remotePatterns
            unoptimized
            className="relative size-[104px] rounded-[1.5rem] border border-white/20 object-cover"
          />
        </div>

        {/* 文字区 */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-brand-300/25 bg-brand-500/12 px-3 py-1 text-[11px] font-medium tracking-wide text-brand-200">
              <Icon name="sparkle" size={12} />
              {profile.headline}
            </span>

            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {profile.name}
            </h1>
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-white/60">
            {profile.bio}
          </p>

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/45">
            {profile.location && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="pin" size={13} />
                {profile.location}
              </span>
            )}
            {stats.since > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="clock" size={13} />
                {stats.since} 年起持续写作
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Icon name="document" size={13} />
              {stats.posts} 篇文章
            </span>
          </div>

          {/* 技能标签 */}
          {profile.skills.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <li key={skill}>
                  <TagChip label={skill} />
                </li>
              ))}
            </ul>
          )}

          {/* 行动入口 */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            <GlassButton href="/posts" variant="primary">
              读文章
              <Icon name="arrowRight" size={15} />
            </GlassButton>
            <GlassButton href="/about" variant="glass">
              关于我
            </GlassButton>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}