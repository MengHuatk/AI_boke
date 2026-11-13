import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { getMusicTrack } from "../api/client";
import { MusicForm } from "../components/MusicForm";

export function MusicEditPage() {
  const { id = "" } = useParams();
  const isNew = id === "new";

  const query = useQuery({
    queryKey: ["admin-music-track", id],
    queryFn: () => getMusicTrack(id),
    enabled: !isNew,
    retry: false,
  });

  if (isNew) {
    return <MusicForm initial={null} />;
  }

  if (query.isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center text-sm text-white/40">
        正在加载曲目…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <p className="text-sm text-rose-300">
          {query.error instanceof Error ? query.error.message : "曲目不存在"}
        </p>
        <Link to="/music" className="btn btn-ghost mt-4">
          返回列表
        </Link>
      </div>
    );
  }

  return <MusicForm key={query.data.id} initial={query.data} />;
}
