import { Icon } from "@/components/ui/Icon";

interface DevNoticeProps {
  /** 展示哪一段提示文案 */
  message: string;
}

/**
 * 开发期提示条。
 *
 * 只在 development 下渲染，用来提醒「现在看到的是本地示例数据」，
 * 避免有人改了半天 JSON 却发现后端根本没启动。
 * 生产构建会被 tree-shake 掉。
 */
export function DevNotice({ message }: DevNoticeProps) {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="glass-panel-subtle mb-5 flex items-center gap-2.5 rounded-full px-4 py-2 text-xs text-amber-200/80">
      <Icon name="sparkle" size={13} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}