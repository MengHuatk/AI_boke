import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { deletePost, listPosts } from "../api/client";
import type { AdminPostSummary, PostStatus } from "../api/types";
import { PostAdminCard } from "../components/ContentCards";
import { ConfirmDialog } from "../components/ConfirmDialog";

type Filter = "all" | PostStatus;

const TABS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "draft", label: "草稿" },
  { value: "published", label: "已发布" },
];

export function PostListPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<AdminPostSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedQuery(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const listQuery = useQuery({
    queryKey: ["admin-posts", filter, appliedQuery],
    queryFn: () =>
      listPosts({
        status: filter === "all" ? undefined : filter,
        q: appliedQuery || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => {
      setPendingDelete(null);
      setError("");
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    },
    onError: (cause) => {
      setPendingDelete(null);
      setError(cause instanceof Error ? cause.message : "删除失败");
    },
  });

  const posts = listQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-white/35">内容管理</p>
          <h1 className="mt-1 text-2xl font-semibold text-white/90">文章</h1>
          <p className="mt-1 text-sm text-white/40">
            当前筛选下 {posts.length} 篇
          </p>
        </div>
        <Link to="/posts/new" className="btn btn-primary">
          ＋ 新建文章
        </Link>
      </header>

      {error && (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <section className="glass-panel rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={
                  filter === tab.value
                    ? "rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white"
                    : "rounded-lg px-3 py-1.5 text-xs text-white/45 transition hover:text-white/80"
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            className="field sm:ml-auto sm:max-w-xs"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题、摘要或 slug"
          />
        </div>

        {listQuery.isLoading && (
          <p className="py-10 text-center text-sm text-white/35">正在加载…</p>
        )}

        {listQuery.isError && (
          <p className="py-10 text-center text-sm text-rose-300">
            {listQuery.error instanceof Error
              ? listQuery.error.message
              : "加载失败"}
          </p>
        )}

        {!listQuery.isLoading && !listQuery.isError && posts.length === 0 && (
          <p className="py-10 text-center text-sm text-white/35">
            还没有文章。点右上角新建一篇。
          </p>
        )}

        {posts.length > 0 && (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <PostAdminCard
                key={post.id}
                post={post}
                onDelete={() => setPendingDelete(post)}
              />
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除这篇文章？"
        description={`「${pendingDelete?.title ?? ""}」删除后无法恢复，公开页面会立即不再显示。`}
        pending={deleteMutation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
        }}
      />
    </div>
  );
}
