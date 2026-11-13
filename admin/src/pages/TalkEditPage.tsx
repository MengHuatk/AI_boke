import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { getTalk } from "../api/client";
import { TalkForm } from "../components/TalkForm";

export function TalkEditPage() {
  const { id = "" } = useParams();
  const isNew = id === "new";

  const query = useQuery({
    queryKey: ["admin-talk", id],
    queryFn: () => getTalk(id),
    enabled: !isNew,
    retry: false,
  });

  if (isNew) {
    return <TalkForm initial={null} />;
  }

  if (query.isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center text-sm text-white/40">
        正在加载杂谈…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <p className="text-sm text-rose-300">
          {query.error instanceof Error ? query.error.message : "杂谈不存在"}
        </p>
        <Link to="/talks" className="btn btn-ghost mt-4">
          返回列表
        </Link>
      </div>
    );
  }

  return <TalkForm key={query.data.id} initial={query.data} />;
}
