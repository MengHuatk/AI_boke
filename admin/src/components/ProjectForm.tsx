import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createProject, deleteProject, updateProject } from "../api/client";
import type { AdminProjectDetail, PostStatus, ProjectWrite } from "../api/types";
import { formatTags, parseTags } from "../lib/format";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field } from "./Field";
import { StatusBadge } from "./StatusBadge";

interface ProjectFormProps {
  initial: AdminProjectDetail | null;
}

export function ProjectForm({ initial }: ProjectFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [readmeTitle, setReadmeTitle] = useState(initial?.readme_title ?? "");
  const [techStack, setTechStack] = useState(
    formatTags(initial?.tech_stack ?? []),
  );
  const [repoUrl, setRepoUrl] = useState(initial?.repo_url ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "");
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? "draft");

  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (nextStatus: PostStatus) => {
      const payload: ProjectWrite = {
        title: title.trim(),
        readme_title: readmeTitle.trim(),
        tech_stack: parseTags(techStack),
        repo_url: repoUrl.trim(),
        emoji: emoji.trim(),
        status: nextStatus,
      };

      return initial ? updateProject(initial.id, payload) : createProject(payload);
    },
    onSuccess: (result) => {
      setStatus(result.status);
      setMessage("已保存");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-project", result.id] });

      if (!initial) {
        navigate(`/projects/${result.id}`, { replace: true });
      }
    },
    onError: (cause) => {
      setMessage("");
      setFormError(cause instanceof Error ? cause.message : "保存失败");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!initial) throw new Error("项目尚未保存");
      return deleteProject(initial.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      navigate("/projects", { replace: true });
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
      setFormError("项目名不能为空");
      return;
    }
    if (!/^https?:\/\/\S+$/.test(repoUrl.trim())) {
      setFormError("仓库地址必须以 http:// 或 https:// 开头");
      return;
    }

    saveMutation.mutate(nextStatus);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/35">
            {initial ? "编辑项目" : "新建项目"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white/90">
            {title.trim() || "未命名项目"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/projects")}
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
                aria-label="项目名"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-lg font-medium text-white/90 outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-brand-400 focus:bg-white/[0.07]"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="项目名"
              />

              <Field label="README 标题" hint="卡片上的单行描述">
                <input
                  className="field"
                  value={readmeTitle}
                  onChange={(event) => setReadmeTitle(event.target.value)}
                  placeholder="一句话说明这个项目"
                />
              </Field>

              <Field
                label="技术栈"
                hint="用逗号分隔，卡片上显示为紫色胶囊"
              >
                <input
                  className="field"
                  value={techStack}
                  onChange={(event) => setTechStack(event.target.value)}
                  placeholder="Next.js, React, Tailwind CSS"
                />
              </Field>

              <Field label="仓库地址" hint="整张卡片点击后跳转到这里">
                <input
                  type="url"
                  className="field"
                  value={repoUrl}
                  onChange={(event) => setRepoUrl(event.target.value)}
                  placeholder="https://github.com/..."
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
                  删除项目
                </button>
              )}
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-5">
            <Field
              label="图标"
              hint="留空时前端按项目 id 稳定选一个 emoji"
            >
              <input
                className="field"
                value={emoji}
                maxLength={8}
                onChange={(event) => setEmoji(event.target.value)}
                placeholder="✨"
              />
            </Field>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="删除这个项目？"
        description="删除后无法恢复，公开页面会立即不再显示。"
        pending={deleteMutation.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
