import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import { cn } from "@/lib/format";

interface TagChipProps {
  label: string;
  /** 该标签下的文章数，不传则不显示 */
  count?: number;
  /** 传了就变成可点击的筛选入口 */
  href?: string;
  className?: string;
}

/**
 * 标签胶囊。可点击 / 纯展示共用同一个组件，只差一个 href。
 */
export function TagChip({ label, count, href, className }: TagChipProps) {
  const content = (
    <>
      <Icon name="hash" size={12} className="text-brand-300/80" />
      <span>{label}</span>
      {count !== undefined && (
        <span className="text-white/40 tabular-nums">{count}</span>
      )}
    </>
  );

  const classes = cn(
    "glass-panel-subtle inline-flex items-center gap-1 rounded-full",
    "px-3 py-1.5 text-xs text-white/75",
    "transition-colors duration-200",
    href && "hover:border-white/25 hover:bg-white/10 hover:text-white",
    className,
  );

  if (href) {
    return (
      <SmartLink href={href} className={classes}>
        {content}
      </SmartLink>
    );
  }

  return <span className={classes}>{content}</span>;
}