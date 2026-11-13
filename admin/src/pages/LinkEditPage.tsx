import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { getLink } from "../api/client";
import { LinkForm } from "../components/LinkForm";

export function LinkEditPage() {
  const { id = "" } = useParams();
  const isNew = id === "new";

  const query = useQuery({
    queryKey: ["admin-link", id],
    queryFn: () => getLink(id),
    enabled: !isNew,
    retry: false,
  });

  if (isNew) {
    return <LinkForm initial={null} />;
  }

  if (query.isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center text-sm text-white/40">
        正在加载友链…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <p className="text-sm text-rose-300">
          {query.error instanceof Error ? query.error.message : "友链不存在"}
        </p>
        <Link to="/links" className="btn btn-ghost mt-4">
          返回列表
        </Link>
      </div>
    );
  }

  return <LinkForm key={query.data.id} initial={query.data} />;
}
