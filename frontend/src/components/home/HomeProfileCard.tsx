"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { GlassCard } from "@/components/ui/GlassCard";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import { HOME_CONTACTS, type HomeContactKey } from "@/lib/home-contacts";
import type { Profile } from "@/lib/types";

interface HomeProfileCardProps {
  profile: Profile;
  articleCount: number;
  talkCount: number;
  photoCount: number;
}

const CONTACT_ORDER: HomeContactKey[] = ["github", "email", "qq", "wechat"];

const CONTACT_META: Record<
  HomeContactKey,
  { label: string; icon: IconName }
> = {
  github: { label: "GitHub", icon: "github" },
  email: { label: "邮箱", icon: "mail" },
  qq: { label: "QQ", icon: "comment" },
  wechat: { label: "微信", icon: "wechat" },
};

const CONTACT_BTN =
  "relative grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/55 transition-colors duration-200 hover:border-brand-300/40 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400";

/**
 * 首页自我简介卡（桌面端 615×280）。
 *
 * 信笺式排版：左上渐变描边头像 + 姓名/头衔/简介，右上淡紫细线作装饰；
 * 底行左侧是文章 / 杂谈 / 照片三项统计（竖线分隔），右侧是四个联系方式。
 * GitHub 直接跳转，邮箱 / QQ / 微信点击复制，并在按钮上方短暂显示「已复制」。
 */
export function HomeProfileCard({
  profile,
  articleCount,
  talkCount,
  photoCount,
}: HomeProfileCardProps) {
  const [copied, setCopied] = useState<HomeContactKey | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  function copyContact(key: HomeContactKey) {
    void navigator.clipboard.writeText(HOME_CONTACTS[key]);
    setCopied(key);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <GlassCard
      padding="none"
      className="relative flex w-full flex-col p-6 xl:h-[280px] xl:w-[615px] xl:shrink-0 xl:p-7 hover:scale-102 duration-1000 transition-all"
    >
      {/* 整卡入口：覆盖在文字之上、联系方式之下 */}
      <SmartLink
        href="/about"
        aria-label="查看关于我"
        className="absolute inset-0 z-10 rounded-glass transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
      >
        <span aria-hidden="true" />
      </SmartLink>

      {/* 信笺装饰：右上角一条向右淡出的细线与星点 */}
      <span
        aria-hidden="true"
        className="absolute top-6 right-7 flex items-center gap-2"
      >
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-brand-300/50" />
        <Icon name="sparkle" size={12} className="text-brand-300/70" />
      </span>

      <div className="flex items-start gap-5">
        {/* 头像：88px 圆角正矩形 + 渐变描边 */}
        <div className="relative shrink-0 rounded-[22px] bg-gradient-to-br from-[#5D4CC2] to-[#A656DB] p-[5px] shadow-[0_10px_30px_-10px_rgba(93,76,194,0.8)] ">
          <Image
            src={profile.avatar}
            alt={`${profile.name} 的头像`}
            width={88}
            height={88}
            priority
            unoptimized
            className="block size-[88px] rounded-[19px] object-cover"
          />
        </div>

        <div className="min-w-0 pt-0.5">
          <h1 className="truncate font-xiaowei text-[30px] leading-none text-white/95">
            {profile.name}
          </h1>
          <p className="mt-2 truncate text-[11px] tracking-[0.12em] text-brand-200/80">
            {profile.headline}
          </p>
          <p className="mt-3 line-clamp-2 font-xiaowei text-[15px] leading-6 text-white/55">
            {profile.bio}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 pt-4">
        {/* 统计：数字在上、大类在下，竖线分隔 */}
        <div className="flex items-center gap-5">
          <Stat className="s"  value={articleCount} label="文章"/>
          <span aria-hidden="true" className="h-9 w-px bg-white/10" />
          <Stat value={talkCount} label="杂谈" />
          <span aria-hidden="true" className="h-9 w-px bg-white/10" />
          <Stat value={photoCount} label="照片" />
        </div>

        {/* 联系方式 */}
        <ul className="relative z-20 flex items-center gap-2">
          {CONTACT_ORDER.map((key) => {
            const meta = CONTACT_META[key];

            if (key === "github") {
              return (
                <li key={key}>
                  <SmartLink
                    href={HOME_CONTACTS.github}
                    aria-label={meta.label}
                    title={meta.label}
                    className={CONTACT_BTN}
                  >
                    <Icon name={meta.icon} size={16} />
                  </SmartLink>
                </li>
              );
            }

            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => copyContact(key)}
                  aria-label={`复制${meta.label}`}
                  title={`复制${meta.label}`}
                  className={CONTACT_BTN}
                >
                  <Icon name={copied === key ? "check" : meta.icon} size={16} />
                  {copied === key && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-ink-950/90 px-2 py-1 text-[10px] whitespace-nowrap text-white/85">
                      已复制
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </GlassCard>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[22px] leading-none font-semibold tabular-nums text-white/90">
        {value}
      </span>
      <span className="text-[11px] tracking-wide text-white/40">{label}</span>
    </div>
  );
}
