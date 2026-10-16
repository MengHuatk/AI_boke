import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import type { IconName } from "@/components/ui/Icon";

interface SectionHeadingProps {
  title: string;
  /** 标题上方的小字，用于补充上下文 */
  eyebrow?: string;
  icon?: IconName;
  /** 右上角的「查看更多」入口 */
  action?: { label: string; href: string };
}

/**
 * 区块标题。首页每个盒子共用一个，保证节奏一致。
 */
export function SectionHeading({
  title,
  eyebrow,
  icon,
  action,
}: SectionHeadingProps) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        {eyebrow && (
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand-300/70">
            {eyebrow}
          </span>
        )}
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white/90">
          {icon && <Icon name={icon} size={18} className="text-brand-300" />}
          {title}
        </h2>
      </div>

      {action && (
        <SmartLink
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1 text-xs text-white/55 transition-colors hover:text-white"
        >
          {action.label}
          <Icon
            name="arrowRight"
            size={13}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </SmartLink>
      )}
    </div>
  );
}