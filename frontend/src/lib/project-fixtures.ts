/**
 * 项目矩阵测试数据。
 *
 * 本地方案：新增 / 修改项目只动这个数组，组件层不需要改。
 * repo_url 先填成示例地址，接入真实仓库时逐条替换即可。
 * readme_title 对应 README 的首个标题行（不含开头的 #），作为卡片描述。
 */

export interface Project {
  id: string;
  /** GitHub 仓库标题 */
  title: string;
  /** README 首个标题行，卡片描述 */
  readme_title: string;
  /** 技术栈标签 */
  tech_stack: string[];
  /** GitHub 仓库地址 */
  repo_url: string;
  /** 可选：手动指定图标；留空则按 id 稳定选取 */
  emoji?: string;
}

export const PROJECTS: Project[] = [
  {
    id: "blog-glass",
    title: "Glass Notes",
    readme_title: "一个把毛玻璃做到极致的个人博客",
    tech_stack: ["Next.js", "React", "Tailwind CSS"],
    repo_url: "https://github.com/MengHuatk/AI_boke",
  },
  {
    id: "island-demo",
    title: "Island Demo",
    readme_title: "仿造游戏islande官网制作的前端非官方网页",
    tech_stack: [ "Less", "Vue"],
    repo_url: "https://github.com/MengHuatk/island_demo",
  },
];
