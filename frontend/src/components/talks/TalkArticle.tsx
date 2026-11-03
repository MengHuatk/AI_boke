import Image from "next/image";

import { GiscusComments } from "@/components/post/GiscusComments";
import { Icon } from "@/components/ui/Icon";
import { MarkdownBody } from "@/components/ui/MarkdownBody";
import { SmartLink } from "@/components/ui/SmartLink";
import type { TalkDetail } from "@/lib/types";

/**
 * 杂谈详情左主件 798 宽，结构照搬 PostArticle：
 * 封面 798×449 → 返回按钮 126×36 → 标题盒 702×228 → 正文盒 → 评论区。
 *
 * 标题盒里时间芯片打头（淡蓝紫 #9aa5ff），心情芯片用中性白，标签沿用
 * 文章页的粉红；正文交给共享的 MarkdownBody。返回按钮落在杂谈列表
 * /talks，而不是归档页。
 */
export function TalkArticle({ talk }: { talk: TalkDetail }) {
  return (
    <article className="glass-panel-thick w-[798px] max-w-full overflow-hidden rounded-glass lg:min-w-0">
      {/* 封面 798×449，贴容器边；无图时占位与文章页同款 */}
      {talk.cover ? (
        <div className="h-[449px] overflow-hidden">
          <div className="relative h-[449px] w-full overflow-hidden transition-all duration-1000 hover:scale-[120%]">
            <Image
              src={talk.cover}
              alt={talk.title}
              fill
              sizes="798px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        </div>
      ) : (
        <div className="grid h-[449px] place-items-center bg-white/5">
          <Icon name="document" size={40} className="text-white/20" />
        </div>
      )}

      <div className="flex flex-col gap-6 px-12 pb-12 pt-6">
        {/* 返回杂谈列表 */}
        <SmartLink
          href="/talks"
          className="glass-panel-subtle flex h-9 w-[126px] items-center justify-center gap-1.5 rounded-lg text-[13px] text-white/70 transition-colors hover:text-white"
        >
          <Icon name="arrowRight" size={13} className="rotate-180" />
          返回杂谈
        </SmartLink>

        {/* 标题盒 702×228 */}
        <header className="flex h-[228px] flex-col justify-center gap-5">
          <h1 className="font-xiaowei text-[30px] leading-[1.4] text-white/95">
            {talk.title}
          </h1>
          <ul className="flex flex-wrap items-center gap-2">
            <li className="glass-panel-subtle inline-flex h-6 items-center gap-1 rounded-md px-2.5 text-[12px] leading-none whitespace-nowrap text-[#9aa5ff] tabular-nums">
              <Icon name="calendar" size={11} />
              {talk.published_at.replace("T", " ")}
            </li>
            <li className="glass-panel-subtle inline-flex h-6 items-center rounded-md px-2.5 text-[12px] leading-none whitespace-nowrap text-white/65">
              {talk.mood}
            </li>
            {talk.tags.map((tag) => (
              <li
                key={tag}
                className="glass-panel-subtle inline-flex h-6 items-center rounded-md px-2.5 text-[12px] leading-none whitespace-nowrap text-pink-400"
              >
                #{tag}
              </li>
            ))}
          </ul>
        </header>

        {/* 正文盒：与文章详情共用同一套 Markdown 渲染 */}
        <MarkdownBody body={talk.body} />

        {/* 评论区：giscus，按当前路径映射讨论 */}
        <section aria-label="评论" className="flex flex-col gap-4 pt-2">
          <h2 className="font-xiaowei text-[18px] text-white/85">评论</h2>
          <GiscusComments />
        </section>
      </div>
    </article>
  );
}
