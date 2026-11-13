import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { getMoment } from "../api/client";
import { MomentForm } from "../components/MomentForm";

export function MomentEditPage() {
  const { id = "" } = useParams();
  const isNew = id === "new";

  const query = useQuery({
    queryKey: ["admin-moment", id],
    queryFn: () => getMoment(id),
    enabled: !isNew,
    retry: false,
  });

  if (isNew) {
    return <MomentForm initial={null} />;
  }

  if (query.isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center text-sm text-white/40">
        正在加载动态…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <p className="text-sm text-rose-300">
          {query.error instanceof Error ? query.error.message : "动态不存在"}
        </p>
        <Link to="/moments" className="btn btn-ghost mt-4">
          返回列表
        </Link>
      </div>
    );
  }

  return <MomentForm key={query.data.id} initial={query.data} />;
}
