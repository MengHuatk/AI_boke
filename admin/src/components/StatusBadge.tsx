import type { PostStatus } from "../api/types";

export function StatusBadge({ status }: { status: PostStatus }) {
  const published = status === "published";

  return (
    <span
      className={
        published
          ? "inline-flex rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs text-emerald-200 ring-1 ring-emerald-300/20"
          : "inline-flex rounded-full bg-amber-400/15 px-2 py-0.5 text-xs text-amber-200 ring-1 ring-amber-300/20"
      }
    >
      {published ? "已发布" : "草稿"}
    </span>
  );
}
