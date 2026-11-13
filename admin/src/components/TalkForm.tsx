import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createTalk, deleteTalk, updateTalk } from "../api/client";
import type { AdminTalkDetail, PostStatus, TalkWrite } from "../api/types";
import {
  formatTags,
  fromDateTimeLocal,
  parseTags,
  previewAssetUrl,
  toDateTimeLocal,
} from "../lib/format";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field } from "./Field";
import { ImageUploadButton } from "./ImageUploadButton";
import { MarkdownEditor } from "./MarkdownEditor";
import { StatusBadge } from "./StatusBadge";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface TalkFormProps {
  initial: AdminTalkDetail | null;
}

export function TalkForm({ initial }: TalkFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [cover, setCover] = useState(initial?.cover ?? "");
  const [tags, setTags] = useState(formatTags(initial?.tags ?? []));
  const [mood, setMood] = useState(initial?.mood ?? "");
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState(
    toDateTimeLocal(initial?.published_at ?? null),
  );
  const [body, setBody] = useState(initial?.body ?? "");

  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (nextStatus: PostStatus) => {
      const payload: TalkWrite = {
        slug: slug.trim(),
        title: title.trim(),
        excerpt: excerpt.trim(),
        cover: cover.trim() || null,
        body,
        tags: parseTags(tags),
        mood: mood.trim(),
        status: nextStatus,
        published_at: fromDateTimeLocal(publishedAt),
      };

      return initial ? updateTalk(initial.id, payload) : createTalk(payload);
    },
    onSuccess: (result) => {
      setStatus(result.status);
      setExcerpt(result.excerpt);
      setPublishedAt(toDateTimeLocal(result.published_at));
      setMessage("已保存");
      queryClient.invalidateQueries({ queryKey: ["admin-talks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-talk", result.id] });

      if (!initial) {
        navigate(`/talks/${result.id}`, { replace: true });
      }
    },
    onError: (cause) => {
      setMessage("");
      setFormError(cause instanceof Error ? cause.message : "保存失败");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!initial) throw new Error("杂谈尚未保存");
      return deleteTalk(initial.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-talks"] });
      navigate("/talks", { replace: true });
    },
    onError: (cause) => {
      setConfirmDelete(false);
      setFormError(cause instanceof Error ? cause.message : "删除失败");
    },
  });

  const busy = saveMutation.isPending || deleteMutation.isPending;

  function save(nextStatus: PostStatus) {
    setMessage("");
    setFormError("");

    if (!title.trim()) {
      setFormError("标题不能为空");
      return;
    }
    if (!SLUG_PATTERN.test(slug.trim())) {
      setFormError("slug 只能包含小写字母、数字与连字符");
      return;
    }

    saveMutation.mutate(nextStatus);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/35">
            {initial ? "编辑杂谈" : "新建杂谈"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white/90">
            {title.trim() || "未命名杂谈"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/talks")}
          >
            返回列表
          </button>
        </div>
      </header>

      {formError && (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {formError}
        </p>
      )}
      {message && (
        <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="glass-panel rounded-2xl p-6">
            <div className="flex flex-col gap-4">
              <input
                aria-label="标题"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-lg font-medium text-white/90 outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-brand-400 focus:bg-white/[0.07]"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="杂谈标题"
              />

              <Field
                label="Slug"
                hint="用于 /talks/xxx，只能包含小写字母、数字与连字符"
              >
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-xs text-white/30">/talks/</span>
                  <input
                    className="field"
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    placeholder="rain-on-the-blog"
                  />
                </div>
              </Field>

              <Field label="摘要" hint="留空时自动截取正文前 120 字">
                <textarea
                  className="field min-h-24 resize-y"
                  value={excerpt}
                  onChange={(event) => setExcerpt(event.target.value)}
                  placeholder="一句话概括这条杂谈"
                />
              </Field>
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-6">
            <MarkdownEditor value={body} onChange={setBody} />
          </section>
        </div>

        <aside className="flex flex-col gap-6 xl:sticky xl:top-24 xl:self-start">
          <section className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white/85">发布</h2>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => save(status)}
                disabled={busy}
              >
                {saveMutation.isPending ? "保存中…" : "保存"}
              </button>

              {status === "published" ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => save("draft")}
                  disabled={busy}
                >
                  转为草稿
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => save("published")}
                  disabled={busy}
                >
                  发布
                </button>
              )}

              {initial && (
                <button
                  type="button"
                  className="btn btn-danger mt-2"
                  onClick={() => setConfirmDelete(true)}
                  disabled={busy}
                >
                  删除杂谈
                </button>
              )}
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white/85">封面</h2>
            <div className="mt-4 flex flex-col gap-3">
              {cover ? (
                <div className="relative overflow-hidden rounded-xl border border-white/10">
                  <img
                    src={previewAssetUrl(cover)}
                    alt="封面预览"
                    className="aspect-video w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white/80 transition hover:bg-black/80"
                    onClick={() => setCover("")}
                  >
                    移除
                  </button>
                </div>
              ) : (
                <div className="grid aspect-video place-items-center rounded-xl border border-dashed border-white/10 text-xs text-white/30">
                  暂无封面
                </div>
              )}
              <ImageUploadButton
                label="上传封面"
                onUploaded={(result) => setCover(result.url)}
              />
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-5">
            <div className="flex flex-col gap-4">
              <Field label="标签" hint="用逗号分隔">
                <input
                  className="field"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="生活, 随笔"
                />
              </Field>

              <Field label="心情" hint="显示在卡片上的短句">
                <input
                  className="field"
                  value={mood}
                  onChange={(event) => setMood(event.target.value)}
                  placeholder="✨平静"
                />
              </Field>

              <Field label="发布时间" hint="留空则首次发布时自动填写">
                <input
                  type="datetime-local"
                  className="field"
                  value={publishedAt}
                  onChange={(event) => setPublishedAt(event.target.value)}
                />
              </Field>
            </div>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="删除这条杂谈？"
        description="删除后无法恢复，公开页面会立即不再显示。"
        pending={deleteMutation.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
