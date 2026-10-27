import Image from "next/image";
import { isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { GiscusComments } from "@/components/post/GiscusComments";
import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import { headingId } from "@/lib/markdown";
import type { PostDetail } from "@/lib/types";

/** 把 ReactNode 压平为纯文本：正文标题要么是白文、最多带粗体装饰，压平后即可算锚点 */
function flatText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flatText).join("");
  if (isValidElement(node)) {
    return flatText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

/**
 * 左主件 798 宽：厚玻璃（glass-panel-thick）长文容器，自上而下——
 * 封面 798×449 贴边出血 → 返回按钮 126×36 → 标题盒 702×228 →
 * 正文盒 702 宽 → 评论区。798 − 702 = 96，即内栏左右各 48px（px-12）。
 *
 * 标题盒里时间芯片打头（淡蓝紫 #9aa5ff，与目录滚动条同族），
 * 其后标签一律粉红。盒高 228 是规格的固定值，内容垂直居中。
 *
 * 正文只被 react-markdown 解析一次：段落 / h2 / h3 各渲染成一只
 * glass-panel-subtle 弱玻璃小盒（规格的「段落盒子 + 小标题盒子」），
 * 标题锚点 id 与目录提取同源，配方见 lib/markdown.ts。
 */
export function PostArticle({ post }: { post: PostDetail }) {
  return (
    <article className="glass-panel-thick w-[798px] max-w-full overflow-hidden rounded-glass lg:min-w-0">
      {/* 封面 798×449，贴容器边；无图时占位与归档卡同款 */}
      {post.cover ? (
        <div className=" h-[449px] overflow-hidden">
          <div className="relative h-[449px] w-full overflow-hidden hover:scale-[120%] transition-all duration-1000">
          <Image
            src={post.cover}
            alt={post.title}
            fill
            sizes="798px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/20 " />
        </div>
        </div>
        
      ) : (
        <div className="grid h-[449px] place-items-center bg-white/5">
          <Icon name="document" size={40} className="text-white/20" />
        </div>
      )}

      <div className="flex flex-col gap-6 px-12 pb-12 pt-6">
        {/* 返回上级：归档页是文章卡的唯一来源 */}
        <SmartLink
          href="/archive"
          className="glass-panel-subtle flex h-9 w-[126px] items-center justify-center gap-1.5 rounded-lg text-[13px] text-white/70 transition-colors hover:text-white"
        >
          <Icon name="arrowRight" size={13} className="rotate-180" />
          返回上级
        </SmartLink>

        {/* 标题盒 702×228 */}
        <header className="flex h-[228px] flex-col justify-center gap-5">
          <h1 className="font-xiaowei text-[30px] leading-[1.4] text-white/95">
            {post.title}
          </h1>
          <ul className="flex flex-wrap items-center gap-2">
            <li className="glass-panel-subtle inline-flex h-6 items-center gap-1 rounded-md px-2.5 text-[12px] leading-none whitespace-nowrap text-[#9aa5ff] tabular-nums">
              <Icon name="calendar" size={11} />
              {post.published_at.replace("T", " ")}
            </li>
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="glass-panel-subtle inline-flex h-6 items-center rounded-md px-2.5 text-[12px] leading-none whitespace-nowrap text-pink-400"
              >
                #{tag}
              </li>
            ))}
          </ul>
        </header>

        {/* 正文盒 */}
        <div className="flex flex-col gap-3">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="rounded-lg px-5 py-3.5 text-[15px] leading-7 text-white/75">
                  {children}
                </p>
              ),
              h2: ({ children }) => (
                <h2
                  id={headingId(flatText(children))}
                  className=" scroll-mt-[110px] rounded-lg px-5 py-3 font-xiaowei text-[22px] leading-8 text-white/90"
                >
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3
                  id={headingId(flatText(children))}
                  className="scroll-mt-[110px] rounded-lg px-5 py-2.5 font-xiaowei text-[18px] leading-7 text-white/85"
                >
                  {children}
                </h3>
              ),
              ul: ({ children }) => (
                <ul className="list-disc rounded-lg px-5 py-3.5 pl-9 text-[15px] leading-7 text-white/75 marker:text-white/40">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="glass-panel-subtle list-decimal rounded-lg px-5 py-3.5 pl-9 text-[15px] leading-7 text-white/75 marker:text-white/40">
                  {children}
                </ol>
              ),
              pre: ({ children }) => (
                <pre className="overflow-x-auto rounded-lg bg-black/45 px-5 py-4 font-mono text-[13px] leading-6 text-white/85">
                  {children}
                </pre>
              ),
              code: ({ className, children }) =>
                className ? (
                  <code className={className}>{children}</code>
                ) : (
                  <code className="rounded bg-white/10 px-1.5 py-0.5 text-[13px] text-[#9aa5ff]">
                    {children}
                  </code>
                ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  className="text-[#9aa5ff] underline decoration-white/25 underline-offset-2 hover:text-white"
                >
                  {children}
                </a>
              ),
              blockquote: ({ children }) => (
                <blockquote className="rounded-lg border-l-2 border-neon-500/60 bg-white/5 px-5 py-3 text-[15px] leading-7 text-white/60">
                  {children}
                </blockquote>
              ),
            }}
          >
            {post.body}
          </ReactMarkdown>
        </div>

        {/* 评论区：GitHub 登录后才可发表，实现为 giscus 嵌入 */}
        <section aria-label="评论" className="flex flex-col gap-4 pt-2">
          <h2 className="font-xiaowei text-[18px] text-white/85">评论</h2>
          <GiscusComments />
        </section>
      </div>
    </article>
  );
}
