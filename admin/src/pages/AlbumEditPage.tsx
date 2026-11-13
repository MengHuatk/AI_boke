import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { getAlbum } from "../api/client";
import { AlbumForm } from "../components/AlbumForm";

export function AlbumEditPage() {
  const { id = "" } = useParams();
  const isNew = id === "new";

  const query = useQuery({
    queryKey: ["admin-album", id],
    queryFn: () => getAlbum(id),
    enabled: !isNew,
    retry: false,
  });

  if (isNew) {
    return <AlbumForm initial={null} />;
  }

  if (query.isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center text-sm text-white/40">
        正在加载照片集…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <p className="text-sm text-rose-300">
          {query.error instanceof Error ? query.error.message : "照片集不存在"}
        </p>
        <Link to="/albums" className="btn btn-ghost mt-4">
          返回列表
        </Link>
      </div>
    );
  }

  return <AlbumForm key={query.data.id} initial={query.data} />;
}
