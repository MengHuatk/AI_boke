"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import { cn } from "@/lib/format";
import type { PostSummary, Talk } from "@/lib/types";

interface HomeSearchProps {
  posts: PostSummary[];
  talks: Talk[];
}

interface SearchHit {
  id: string;
  kind: "post" | "talk";
  title: string;
  excerpt: string;
  href: string;
  published_at: string;
}

/**
 * 首页搜索：672×62 毛玻璃胶囊 + 672 宽悬浮结果层。
 *
 * 关键字对归档文章与杂谈的标题 / 简介 / 标签三处做大小写不敏感匹配，
 * 结果按「归档」「杂谈」分组。浮层是 absolute，打字时页面布局不位移。
 */
export function HomeSearch({ posts, talks }: HomeSearchProps) {
  const [query, setQuery] = useState("");
  const keyword = query.trim().toLowerCase();

  const postHits: SearchHit[] = keyword
    ? posts.filter((post) => matches(post, keyword)).map(toPostHit)
    : [];
  const talkHits: SearchHit[] = keyword
    ? talks.filter((talk) => matches(talk, keyword)).map(toTalkHit)
    : [];
  const total = postHits.length + talkHits.length;

  return (
    <div className="relative z-20 w-[672px] max-w-full">
      <label className="glass-panel flex h-[62px] w-full items-center gap-3 rounded-glass px-5 transition-[border-color,box-shadow] duration-300 focus-within:border-neon-500/60 focus-within:shadow-[0_0_0_1px_rgba(144,110,255,0.35),0_0_28px_-4px_rgba(144,110,255,0.65),0_10px_40px_-10px_rgba(0,0,0,0.5)]">
        <Icon name="search" size={18} className="shrink-0 text-white/40" />
        <input
          aria-label="搜索归档与杂谈"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setQuery("");
          }}
          placeholder="在电子海中寻找一处避风港"
          className="h-full w-full bg-transparent font-xiaowei text-[16px] text-white/85 outline-none placeholder:text-white/35"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="清空搜索"
            className="grid size-6 shrink-0 place-items-center rounded-full text-white/35 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon name="close" size={12} />
          </button>
        )}
      </label>

      {keyword && (
        <div className="archive-lookup-scroll absolute top-[calc(100%+8px)] left-0 max-h-[360px] w-full overflow-y-auto rounded-glass bg-ink-950/95 px-2 py-2 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)]">
          {total === 0 ? (
            <p className="flex h-[84px] items-center justify-center font-xiaowei text-[15px] text-white/60">
              电子海里没有找到这个字眼 🌌
            </p>
          ) : (
            <>
              {postHits.length > 0 && (
                <ResultGroup label="归档" hits={postHits} />
              )}
              {talkHits.length > 0 && (
                <ResultGroup label="杂谈" hits={talkHits} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ResultGroup({ label, hits }: { label: string; hits: SearchHit[] }) {
  return (
    <section className="flex flex-col">
      <h2 className="px-3 pt-2 pb-1 text-[10px] tracking-[0.22em] text-white/30">
        {label}
      </h2>
      <ul className="flex flex-col gap-1">
        {hits.map((hit) => (
          <li key={hit.id}>
            <SmartLink
              href={hit.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-md text-[10px] font-medium",
                  hit.kind === "post"
                    ? "bg-brand-500/20 text-brand-200"
                    : "bg-neon-500/20 text-neon-500",
                )}
              >
                {hit.kind === "post" ? "文" : "谈"}
              </span>

              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-xiaowei text-[15px] leading-6 text-white/85">
                  {hit.title}
                </span>
                <span className="truncate text-[11px] leading-4 text-white/40">
                  {hit.excerpt}
                </span>
              </span>

              <time
                dateTime={hit.published_at}
                className="shrink-0 text-[11px] tabular-nums text-white/35"
              >
                {hit.published_at.slice(0, 10)}
              </time>
            </SmartLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface Searchable {
  title: string;
  excerpt: string;
  tags: string[];
}

function matches(item: Searchable, keyword: string): boolean {
  return (
    item.title.toLowerCase().includes(keyword) ||
    item.excerpt.toLowerCase().includes(keyword) ||
    item.tags.some((tag) => tag.toLowerCase().includes(keyword))
  );
}

function toPostHit(post: PostSummary): SearchHit {
  return {
    id: `post-${post.id}`,
    kind: "post",
    title: post.title,
    excerpt: post.excerpt,
    href: `/posts/${post.slug}`,
    published_at: post.published_at,
  };
}

function toTalkHit(talk: Talk): SearchHit {
  return {
    id: `talk-${talk.id}`,
    kind: "talk",
    title: talk.title,
    excerpt: talk.excerpt,
    href: `/talks/${talk.slug}`,
    published_at: talk.published_at,
  };
}
