import { ProjectsMatrix } from "@/components/projects/ProjectsMatrix";
import { PROJECTS } from "@/lib/project-fixtures";

/**
 * 项目页（/projects）。
 *
 * 导航栏里的「项目」项来自后端 site.json 的 nav 字段，这里补上
 * 对应路由，让它不再是死链。背景、导航、页脚由根布局的 SiteShell
 * 统一提供，页面只负责准备项目数据并交给客户端矩阵组件。
 */
export const metadata = {
  title: "项目",
};

export default function ProjectsPage() {
  return <ProjectsMatrix projects={PROJECTS} />;
}
