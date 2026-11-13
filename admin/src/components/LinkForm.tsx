import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createLink, deleteLink, updateLink } from "../api/client";
import type { AdminFriendLinkDetail, FriendLinkWrite, PostStatus } from "../api/types";
import { previewAssetUrl } from "../lib/format";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field } from "./Field";
import { ImageUploadButton } from "./ImageUploadButton";
import { StatusBadge } from "./StatusBadge";

interface LinkFormProps {
  initial: AdminFriendLinkDetail | null;
}

export function LinkForm({ initial }: LinkFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(initial?.name ?? "");
  const [avatar, setAvatar] = useState(initial?.avatar ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [href, setHref] = useState(initial?.href ?? "");
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? "draft");

  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (nextStatus: PostStatus) => {
      const payload: FriendLinkWrite = {
        name: name.trim(),
        avatar: avatar.trim(),
        bio: bio.trim(),
        href: href.trim(),
        status: nextStatus,
      };

      return initial ? updateLink(initial.id, payload) : createLink(payload);
    },
    onSuccess: (result) => {
      setStatus(result.status);
      setMessage("已保存");
      queryClient.invalidateQueries({ queryKey: ["admin-links"] });
      queryClient.invalidateQueries({ queryKey: ["admin-link", result.id] });

      if (!initial) {
        navigate(`/links/${result.id}`, { replace: true });
      }
    },
    onError: (cause) => {
      setMessage("");
      setFormError(cause instanceof Error ? cause.message : "保存失败");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!initial) throw new Error("友链尚未保存");
      return deleteLink(initial.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-links"] });
      navigate("/links", { replace: true });
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

    if (!name.trim()) {
      setFormError("名称不能为空");
      return;
    }
    if (!avatar.trim()) {
      setFormError("头像不能为空，可以上传或填写图片地址");
      return;
    }
    if (!/^https?:\/\/\S+$/.test(href.trim())) {
      setFormError("友链地址必须以 http:// 或 https:// 开头");
      return;
    }

    saveMutation.mutate(nextStatus);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/35">
            {initial ? "编辑友链" : "新建友链"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white/90">
            {name.trim() || "未命名友链"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/links")}
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
                aria-label="友链名称"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-lg font-medium text-white/90 outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-brand-400 focus:bg-white/[0.07]"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="友链名称"
              />

              <Field label="简介" hint="卡片上最多显示三行">
                <textarea
                  className="field min-h-24 resize-y"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="这位朋友在写什么"
                />
              </Field>

              <Field label="网站地址" hint="整张卡片点击后跳转到这里">
                <input
                  type="url"
                  className="field"
                  value={href}
                  onChange={(event) => setHref(event.target.value)}
                  placeholder="https://example.com"
                />
              </Field>
            </div>
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
                  删除友链
                </button>
              )}
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white/85">头像</h2>
            <div className="mt-4 flex flex-col gap-3">
              {avatar ? (
                <div className="relative overflow-hidden rounded-xl border border-white/10 p-3">
                  <img
                    src={previewAssetUrl(avatar)}
                    alt="头像预览"
                    className="mx-auto size-24 rounded-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white/80 transition hover:bg-black/80"
                    onClick={() => setAvatar("")}
                  >
                    移除
                  </button>
                </div>
              ) : (
                <div className="grid aspect-square place-items-center rounded-xl border border-dashed border-white/10 text-xs text-white/30">
                  暂无头像
                </div>
              )}

              <Field label="图片地址" hint="也可以直接粘贴站内或外链图片">
                <input
                  className="field"
                  value={avatar}
                  onChange={(event) => setAvatar(event.target.value)}
                  placeholder="/uploads/... 或 https://..."
                />
              </Field>

              <ImageUploadButton
                label="上传头像"
                onUploaded={(result) => setAvatar(result.url)}
              />
            </div>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="删除这条友链？"
        description="删除后无法恢复，公开页面会立即不再显示。"
        pending={deleteMutation.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
