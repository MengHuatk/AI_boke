"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import type { PostSummary } from "@/lib/types";

interface ArchiveSearchProps {
  posts: PostSummary[];
}

/**
 * 归档搜索：512×58 毛玻璃胶囊 + 512×360 悬浮结果盒。
 *
 * 插在标题与标签栏之间，喂的是与两条视图同一份过滤后的帖子池。
 * 关键字对标题 / 简介 / 标签三处做大小写不敏感的子串匹配。浮层
 * 三态：无输入隐身；有命中弹 512×360 结果盒；零命中原地弹
 * 510×84 小提示盒（84 与条目盒 82.5 一脉，恰好装得下一句空态）。
 *
 * 结果盒是 absolute 悬浮层（顶在胶囊下方 8px）：它盖住标签栏与
 * 档案卡，但不挤压它们——打字全程整页布局纹丝不动，与「标签栏
 * 零位移」同一原则。深黑蓝底取 ink-950 令牌，淡蓝紫滚动条配方
 * 见 globals.css 的 .archive-lookup-scroll 段。
 */
export function ArchiveSearch({ posts }: ArchiveSearchProps) {
  const [query, setQuery] = useState("");

  const keyword = query.trim().toLowerCase();
  const matches = keyword
    ? posts.filter(
        (post) =>
          post.title.toLowerCase().includes(keyword) ||
          post.excerpt.toLowerCase().includes(keyword) ||
          post.tags.some((tag) => tag.toLowerCase().includes(keyword)),
      )
    : [];

  return (
    <div className="relative z-20">
      {/* 搜索胶囊：512×58，glass-panel 配方与标签栏同源 */}
      <label className="glass-panel flex h-[58px] w-[512px] max-w-full items-center gap-2 rounded-glass px-4">
        <Icon name="search" size={16} className="shrink-0 text-white/40" />
        <input
          aria-label="搜索归档"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索标题、简介或标签…"
          className="h-full w-full bg-transparent font-xiaowei text-[16px] text-white/85 outline-none placeholder:text-white/35 "
        />
      </label>

      {/* 结果盒：512×360，只被胶囊的下缘托着悬进档案区上方 */}
      {matches.length > 0 && (
        <ul className="archive-lookup-scroll absolute top-[calc(100%+8px)] left-0 flex h-[360px] w-[512px] max-w-full flex-col gap-2 overflow-y-auto rounded-glass bg-ink-950/95 px-1.5 py-2">
          {matches.map((post) => (
            <LookupRow key={post.id} post={post} />
          ))}
        </ul>
      )}

      {/* 空态盒：零命中时取代结果盒的原位，510×84，提示词正中悬停 */}
      {keyword && matches.length === 0 && (
        <p className="absolute top-[calc(100%+8px)] left-1/2 flex h-[84px] w-[510px] max-w-full -translate-x-1/2 items-center justify-center rounded-glass bg-ink-950/95 font-xiaowei text-[15px] text-white/65">
          赛博空间里找不到这个印记 🌌
        </p>
      )}
    </div>
  );
}

/**
 * 条目盒 500×82.5：首行「标题 381×24（左）+ 时间 71×24（右）」，
 * 次行「简介 452×19.5」，横向 6+452+24+…收拢后内容宽恰为 452。
 * 三段全部单行截断出省略号；日期沿用 ArchiveCard 徽章的 YY-MM-DD
 * 短格式——71px 放不下完整 datetime。整盒可点，跳文章页。
 */
function LookupRow({ post }: { post: PostSummary }) {
  return (
    <li className="w-[500px] shrink-0">
      <SmartLink
        href={`/posts/${post.slug}`}
        className="flex h-[82.5px] flex-col justify-center gap-2.5 rounded-lg px-6 transition-colors hover:bg-white/5"
      >
        <div className="flex items-center">
          <h4 className="w-[381px] truncate font-xiaowei text-[16px] leading-6 text-white/85">
            {post.title}
          </h4>
          <time className="w-[71px] shrink-0 text-right text-[12px] leading-6 text-white/45 tabular-nums">
            {post.published_at.slice(2, 10)}
          </time>
        </div>
        <p className="w-[452px] truncate font-xiaowei text-[12px] leading-[19.5px] text-white/45">
          {post.excerpt}
        </p>
      </SmartLink>
    </li>
  );
}
