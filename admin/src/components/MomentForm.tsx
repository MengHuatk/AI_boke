import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createMoment, deleteMoment, updateMoment } from "../api/client";
import type {
  AdminMomentDetail,
  MomentImage,
  MomentWrite,
  PostStatus,
} from "../api/types";
import {
  fromDateTimeLocal,
  previewAssetUrl,
  toDateTimeLocal,
} from "../lib/format";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field } from "./Field";
import { ImageUploadButton } from "./ImageUploadButton";
import { StatusBadge } from "./StatusBadge";

interface ImageDraft extends MomentImage {
  key: string;
}

interface MomentFormProps {
  initial: AdminMomentDetail | null;
}

function createDraft(source: MomentImage): ImageDraft {
  return {
    src: source.src,
    alt: source.alt,
    width: source.width,
    height: source.height,
    key: crypto.randomUUID(),
  };
}

export function MomentForm({ initial }: MomentFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState(initial?.content ?? "");
  const [images, setImages] = useState<ImageDraft[]>(
    initial?.images.map(createDraft) ?? [],
  );
  const [province, setProvince] = useState(
    initial?.location.province ?? "",
  );
  const [city, setCity] = useState(initial?.location.city ?? "");
  const [district, setDistrict] = useState(
    initial?.location.district ?? "",
  );
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState(
    toDateTimeLocal(initial?.published_at ?? null),
  );

  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (nextStatus: PostStatus) => {
      const payload: MomentWrite = {
        content: content.trim(),
        images: images.map((image) => ({
          src: image.src,
          alt: image.alt.trim(),
          width: image.width,
          height: image.height,
        })),
        location: {
          province: province.trim(),
          city: city.trim(),
          district: district.trim(),
        },
        status: nextStatus,
        published_at: fromDateTimeLocal(publishedAt),
      };

      return initial
        ? updateMoment(initial.id, payload)
        : createMoment(payload);
    },
    onSuccess: (result) => {
      setStatus(result.status);
      setPublishedAt(toDateTimeLocal(result.published_at));
      setMessage("已保存");
      queryClient.invalidateQueries({ queryKey: ["admin-moments"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-moment", result.id],
      });

      if (!initial) {
        navigate(`/moments/${result.id}`, { replace: true });
      }
    },
    onError: (cause) => {
      setMessage("");
      setFormError(cause instanceof Error ? cause.message : "保存失败");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!initial) throw new Error("生活动态尚未保存");
      return deleteMoment(initial.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-moments"] });
      navigate("/moments", { replace: true });
    },
    onError: (cause) => {
      setConfirmDelete(false);
      setFormError(cause instanceof Error ? cause.message : "删除失败");
    },
  });

  const busy = saveMutation.isPending || deleteMutation.isPending;

  function updateImage(key: string, patch: Partial<MomentImage>) {
    setImages((current) =>
      current.map((image) =>
        image.key === key ? { ...image, ...patch } : image,
      ),
    );
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function save(nextStatus: PostStatus) {
    setMessage("");
    setFormError("");

    if (!content.trim()) {
      setFormError("正文不能为空");
      return;
    }

    saveMutation.mutate(nextStatus);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/35">
            {initial ? "编辑生活动态" : "新建生活动态"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white/90">
            {content.trim() || "未命名动态"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/moments")}
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
            <Field label="正文" hint="保留换行；显示在说说卡片的作者区下方">
              <textarea
                className="field min-h-40 resize-y font-xiaowei text-[15px] leading-7"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="此刻想记录的事…"
              />
            </Field>
          </section>

          <section className="glass-panel rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white/85">配图</h2>
                <p className="mt-1 text-xs text-white/35">
                  顺序即九宫格与灯箱顺序；超过九张时第九张显示 +N。
                </p>
              </div>
              <ImageUploadButton
                label="＋ 上传图片"
                onUploaded={(result) => {
                  setImages((current) => [
                    ...current,
                    createDraft({
                      src: result.url,
                      alt: "",
                      width: result.width,
                      height: result.height,
                    }),
                  ]);
                }}
              />
            </div>

            {images.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/30">
                还没有配图。纯文字动态也可以直接发布。
              </p>
            ) : (
              <ul className="mt-5 flex flex-col gap-3">
                {images.map((image, index) => (
                  <li
                    key={image.key}
                    className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:flex-row"
                  >
                    <img
                      src={previewAssetUrl(image.src)}
                      alt=""
                      className="size-24 shrink-0 rounded-lg object-cover"
                    />

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                        <span className="rounded bg-white/5 px-2 py-0.5">
                          第 {index + 1} 张
                        </span>
                        <span>
                          {image.width} × {image.height}
                        </span>
                      </div>

                      <input
                        className="field"
                        value={image.alt}
                        onChange={(event) =>
                          updateImage(image.key, { alt: event.target.value })
                        }
                        placeholder="替代文本（给读屏器与灯箱）"
                      />
                    </div>

                    <div className="flex shrink-0 items-start gap-1.5">
                      <button
                        type="button"
                        className="btn btn-ghost px-2 py-1 text-xs"
                        onClick={() => moveImage(index, -1)}
                        disabled={index === 0}
                        aria-label="上移图片"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost px-2 py-1 text-xs"
                        onClick={() => moveImage(index, 1)}
                        disabled={index === images.length - 1}
                        aria-label="下移图片"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger px-2 py-1 text-xs"
                        onClick={() =>
                          setImages((current) =>
                            current.filter((item) => item.key !== image.key),
                          )
                        }
                      >
                        移除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
                  删除动态
                </button>
              )}
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-5">
            <div className="flex flex-col gap-4">
              <Field label="省份">
                <input
                  className="field"
                  value={province}
                  onChange={(event) => setProvince(event.target.value)}
                  placeholder="四川省"
                />
              </Field>

              <Field label="城市">
                <input
                  className="field"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="成都市"
                />
              </Field>

              <Field label="区县" hint="三段都留空时卡片显示「未标注位置」">
                <input
                  className="field"
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                  placeholder="武侯区"
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
        title="删除这条生活动态？"
        description="删除后无法恢复，公开说说页会立即不再显示。"
        pending={deleteMutation.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
