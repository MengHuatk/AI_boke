import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { getPost } from "../api/client";
import { PostForm } from "../components/PostForm";

export function PostEditPage() {
  const { id = "" } = useParams();
  const isNew = id === "new";

  const query = useQuery({
    queryKey: ["admin-post", id],
    queryFn: () => getPost(id),
    enabled: !isNew,
    retry: false,
  });

  if (isNew) {
    return <PostForm initial={null} />;
  }

  if (query.isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center text-sm text-white/40">
        正在加载文章…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <p className="text-sm text-rose-300">
          {query.error instanceof Error ? query.error.message : "文章不存在"}
        </p>
        <Link to="/posts" className="btn btn-ghost mt-4">
          返回列表
        </Link>
      </div>
    );
  }

  return <PostForm key={query.data.id} initial={query.data} />;
}
