import { ArchiveGrid } from "@/components/archive/ArchiveGrid";

/**
 * 归档页横幅（档案预留位）。
 *
 * 宽最大 1024px、窄屏随容器自适应，高度锁死一整屏（h-dvh）：
 * 标题「归档与探索」顶部锚定，剩余高度全部交给 ArchiveGrid，
 * 栅格可见行数 = 当前视口放得下的行数，超出的行在栅格内部
 * 纵向滚动（见 ArchiveGrid 与 globals.css 的 .archive-scroll）。
 *
 * 底子是 globals.css 的 glass-panel；「虚线框」用 outline 表达而不是
 * border——glass-panel 自带一圈 1px 实线描边，若再用 border-dashed 覆盖，
 * 谁生效取决于工具类和 @utility 的层内排序，outline 完全不参与这场冲突。
 */
export function ArchiveBanner() {
  return (
    <section
      aria-label="档案预留区"
      className="glass-panel mx-auto flex h-dvh w-full max-w-[1024px] flex-col items-center gap-10 rounded-glass outline-1 outline-dashed -outline-offset-8 outline-white/25 py-10"
    >
      <span className="text-[50px] font-bold">归档与探索</span>

      <ArchiveGrid />
    </section>
  );
}
