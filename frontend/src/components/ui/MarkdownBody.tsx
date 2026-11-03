import { isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { headingId } from "@/lib/markdown";

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
 * 文章页与杂谈页共用的 Markdown 正文渲染。
 *
 * 段落、h2/h3、列表、代码块、引用与链接的玻璃配方都在这里维护，
 * 两页只负责把 body 传进来。标题锚点 id 与目录提取同源，配方见
 * lib/markdown.ts；杂谈页虽然暂时没有目录盒，保留锚点不影响阅读。
 */
export function MarkdownBody({ body }: { body: string }) {
  return (
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
              className="scroll-mt-[110px] rounded-lg px-5 py-3 font-xiaowei text-[22px] leading-8 text-white/90"
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
        {body}
      </ReactMarkdown>
    </div>
  );
}
