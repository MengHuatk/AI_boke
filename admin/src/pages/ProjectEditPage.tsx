import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { getProject } from "../api/client";
import { ProjectForm } from "../components/ProjectForm";

export function ProjectEditPage() {
  const { id = "" } = useParams();
  const isNew = id === "new";

  const query = useQuery({
    queryKey: ["admin-project", id],
    queryFn: () => getProject(id),
    enabled: !isNew,
    retry: false,
  });

  if (isNew) {
    return <ProjectForm initial={null} />;
  }

  if (query.isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center text-sm text-white/40">
        正在加载项目…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <p className="text-sm text-rose-300">
          {query.error instanceof Error ? query.error.message : "项目不存在"}
        </p>
        <Link to="/projects" className="btn btn-ghost mt-4">
          返回列表
        </Link>
      </div>
    );
  }

  return <ProjectForm key={query.data.id} initial={query.data} />;
}
