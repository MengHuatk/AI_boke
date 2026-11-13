import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createAlbum, deleteAlbum, updateAlbum } from "../api/client";
import type {
  AdminPhotoAlbumDetail,
  PhotoAlbumWrite,
  PhotoItemWrite,
  PostStatus,
} from "../api/types";
import { previewAssetUrl } from "../lib/format";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field } from "./Field";
import { ImageUploadButton } from "./ImageUploadButton";
import { StatusBadge } from "./StatusBadge";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface PhotoDraft extends PhotoItemWrite {
  key: string;
}

interface AlbumFormProps {
  initial: AdminPhotoAlbumDetail | null;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function createDraft(source: PhotoItemWrite): PhotoDraft {
  return {
    src: source.src,
    alt: source.alt,
    title: source.title,
    width: source.width,
    height: source.height,
    key: crypto.randomUUID(),
  };
}

export function AlbumForm({ initial }: AlbumFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [createdAt, setCreatedAt] = useState(initial?.created_at ?? today());
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? "draft");
  const [photos, setPhotos] = useState<PhotoDraft[]>(
    initial?.photos.map(createDraft) ?? [],
  );

  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (nextStatus: PostStatus) => {
      const payload: PhotoAlbumWrite = {
        slug: slug.trim(),
        title: title.trim(),
        description: description.trim(),
        created_at: createdAt,
        status: nextStatus,
        photos: photos.map((photo) => ({
          src: photo.src,
          alt: photo.alt.trim(),
          title: photo.title.trim(),
          width: photo.width,
          height: photo.height,
        })),
      };

      return initial ? updateAlbum(initial.id, payload) : createAlbum(payload);
    },
    onSuccess: (result) => {
      setStatus(result.status);
      setMessage("已保存");
      queryClient.invalidateQueries({ queryKey: ["admin-albums"] });
      queryClient.invalidateQueries({ queryKey: ["admin-album", result.id] });

      if (!initial) {
        navigate(`/albums/${result.id}`, { replace: true });
      }
    },
    onError: (cause) => {
      setMessage("");
      setFormError(cause instanceof Error ? cause.message : "保存失败");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!initial) throw new Error("照片集尚未保存");
      return deleteAlbum(initial.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-albums"] });
      navigate("/albums", { replace: true });
    },
    onError: (cause) => {
      setConfirmDelete(false);
      setFormError(cause instanceof Error ? cause.message : "删除失败");
    },
  });

  const busy = saveMutation.isPending || deleteMutation.isPending;

  function updatePhoto(key: string, patch: Partial<PhotoItemWrite>) {
    setPhotos((current) =>
      current.map((photo) => (photo.key === key ? { ...photo, ...patch } : photo)),
    );
  }

  function movePhoto(index: number, direction: -1 | 1) {
    setPhotos((current) => {
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

    if (!title.trim()) {
      setFormError("标题不能为空");
      return;
    }
    if (!SLUG_PATTERN.test(slug.trim())) {
      setFormError("slug 只能包含小写字母、数字与连字符");
      return;
    }
    if (!createdAt) {
      setFormError("请选择拍摄 / 创建日期");
      return;
    }
    if (photos.length === 0) {
      setFormError("至少需要一张照片，公开页的堆叠卡片才能正常渲染");
      return;
    }

    saveMutation.mutate(nextStatus);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/35">
            {initial ? "编辑照片集" : "新建照片集"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white/90">
            {title.trim() || "未命名照片集"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/albums")}
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
                placeholder="照片集标题"
              />

              <Field
                label="Slug"
                hint="用于相册卡片排布的稳定种子，只能包含小写字母、数字与连字符"
              >
                <input
                  className="field"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="city-nights"
                />
              </Field>

              <Field label="简介" hint="显示在相册卡片标题下方">
                <textarea
                  className="field min-h-24 resize-y"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="这组照片记录了什么"
                />
              </Field>
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white/85">照片</h2>
                <p className="mt-1 text-xs text-white/35">
                  第一张作为列表封面；上传后自动记录宽高，顺序即展示顺序。
                </p>
              </div>
              <ImageUploadButton
                label="＋ 上传照片"
                onUploaded={(result) => {
                  setPhotos((current) => [
                    ...current,
                    createDraft({
                      src: result.url,
                      alt: "",
                      title: "",
                      width: result.width,
                      height: result.height,
                    }),
                  ]);
                }}
              />
            </div>

            {photos.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/30">
                还没有照片，先上传一张。
              </p>
            ) : (
              <ul className="mt-5 flex flex-col gap-3">
                {photos.map((photo, index) => (
                  <li
                    key={photo.key}
                    className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:flex-row"
                  >
                    <img
                      src={previewAssetUrl(photo.src)}
                      alt=""
                      className="h-24 w-36 shrink-0 rounded-lg object-cover"
                    />

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                        <span className="rounded bg-white/5 px-2 py-0.5">
                          {index === 0 ? "封面" : `第 ${index + 1} 张`}
                        </span>
                        <span>
                          {photo.width} × {photo.height}
                        </span>
                      </div>

                      <input
                        className="field"
                        value={photo.title}
                        onChange={(event) =>
                          updatePhoto(photo.key, { title: event.target.value })
                        }
                        placeholder="照片名（轻触卡片时显示）"
                      />
                      <input
                        className="field"
                        value={photo.alt}
                        onChange={(event) =>
                          updatePhoto(photo.key, { alt: event.target.value })
                        }
                        placeholder="替代文本（给读屏器）"
                      />
                    </div>

                    <div className="flex shrink-0 items-start gap-1.5">
                      <button
                        type="button"
                        className="btn btn-ghost px-2 py-1 text-xs"
                        onClick={() => movePhoto(index, -1)}
                        disabled={index === 0}
                        aria-label="上移照片"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost px-2 py-1 text-xs"
                        onClick={() => movePhoto(index, 1)}
                        disabled={index === photos.length - 1}
                        aria-label="下移照片"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger px-2 py-1 text-xs"
                        onClick={() =>
                          setPhotos((current) =>
                            current.filter((item) => item.key !== photo.key),
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
                  删除照片集
                </button>
              )}
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-5">
            <Field label="拍摄 / 创建日期" hint="显示在相册卡片标题旁">
              <input
                type="date"
                className="field"
                value={createdAt}
                onChange={(event) => setCreatedAt(event.target.value)}
              />
            </Field>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="删除这个照片集？"
        description="照片集和其中的照片会一起删除，公开页面会立即不再显示。"
        pending={deleteMutation.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
