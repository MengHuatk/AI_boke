import { useRef } from "react";

import { ImageUploadButton } from "./ImageUploadButton";
import { MarkdownPreview } from "./MarkdownPreview";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

/** 源码 + 实时预览。工具栏只放最常用的几个 Markdown 片段。 */
export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertAtCursor(text: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(`${value}${text}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    onChange(value.slice(0, start) + text + value.slice(end));

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + text.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function wrapSelection(before: string, after: string, placeholder: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    onChange(value.slice(0, start) + before + selected + after + value.slice(end));

    requestAnimationFrame(() => {
      textarea.focus();
      const selectionStart = start + before.length;
      textarea.setSelectionRange(selectionStart, selectionStart + selected.length);
    });
  }

  function prefixLine(prefix: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className="btn btn-ghost px-2.5 py-1 text-xs"
            onClick={() => wrapSelection("**", "**", "粗体")}
          >
            粗体
          </button>
          <button
            type="button"
            className="btn btn-ghost px-2.5 py-1 text-xs"
            onClick={() => prefixLine("## ")}
          >
            标题
          </button>
          <button
            type="button"
            className="btn btn-ghost px-2.5 py-1 text-xs"
            onClick={() => wrapSelection("[", "](https://)", "链接文字")}
          >
            链接
          </button>
          <button
            type="button"
            className="btn btn-ghost px-2.5 py-1 text-xs"
            onClick={() => wrapSelection("`", "`", "代码")}
          >
            行内代码
          </button>
          <button
            type="button"
            className="btn btn-ghost px-2.5 py-1 text-xs"
            onClick={() => insertAtCursor("\n```\n\n```\n")}
          >
            代码块
          </button>
          <ImageUploadButton
            label="插入图片"
            onUploaded={(result) => insertAtCursor(`![图片](${result.url})`)}
          />
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="用 Markdown 写正文…"
          spellCheck={false}
          className="field min-h-[520px] resize-y font-mono text-[13px] leading-6"
        />
        <p className="text-right text-xs text-white/30">
          {value.replace(/\s/g, "").length} 字
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <span className="px-1 text-xs font-medium tracking-wide text-white/40">
          实时预览
        </span>
        <div className="glass-panel-subtle min-h-[520px] overflow-auto rounded-xl px-5 py-4">
          <MarkdownPreview value={value} />
        </div>
      </div>
    </div>
  );
}
