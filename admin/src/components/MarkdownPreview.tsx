import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { previewAssetUrl } from "../lib/format";

export function MarkdownPreview({ value }: { value: string }) {
  if (!value.trim()) {
    return <p className="text-sm text-white/25">正文预览会显示在这里。</p>;
  }

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt }) => (
            <img
              src={typeof src === "string" ? previewAssetUrl(src) : undefined}
              alt={alt ?? ""}
            />
          ),
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}
