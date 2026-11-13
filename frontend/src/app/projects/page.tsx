import { ProjectsMatrix } from "@/components/projects/ProjectsMatrix";
import { DevNotice } from "@/components/ui/DevNotice";
import { getProjects } from "@/lib/api";

/**
 * 项目页（/projects）。
 *
 * 导航栏里的「项目」项来自后端 site.json 的 nav 字段，这里补上
 * 对应路由，让它不再是死链。背景、导航、页脚由根布局的 SiteShell
 * 统一提供，页面在服务端取已发布项目后交给客户端矩阵组件。
 */
export const metadata = {
  title: "项目",
};

export default async function ProjectsPage() {
  const { data: projects, source } = await getProjects();

  return (
    <>
      {source === "fallback" && (
        <DevNotice message="后端未连接，项目矩阵暂时没有内容。启动 backend 后刷新即可看到真实项目。" />
      )}
      <ProjectsMatrix projects={projects} />
    </>
  );
}
