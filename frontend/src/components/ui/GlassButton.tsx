import type { ReactNode } from "react";

import { SmartLink } from "@/components/ui/SmartLink";
import { cn } from "@/lib/format";

type ButtonVariant = "primary" | "glass" | "ghost";
type ButtonSize = "sm" | "md";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  // 主行动点：实心渐变，视觉权重最高，一屏最多出现一个
  primary:
    "bg-gradient-to-br from-brand-400 to-brand-600 text-white border border-white/20 " +
    "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.3),0_10px_28px_-12px_var(--color-brand-600)] " +
    "hover:from-brand-300 hover:to-brand-500",

  // 次级行动点：玻璃质感，与卡片同源
  glass:
    "glass-panel-subtle text-white/85 hover:text-white hover:border-white/25 " +
    "hover:bg-white/10",

  // 第三级：纯文字，用于「查看更多」这类不抢注意力的入口
  ghost: "text-white/65 hover:text-white hover:bg-white/8 border border-transparent",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
};

interface GlassButtonProps {
  children: ReactNode;
  /** 传了 href 就渲染成链接，否则渲染成 button */
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
}

const BASE_CLASS =
  "inline-flex items-center justify-center rounded-full font-medium " +
  "transition-all duration-300 ease-out active:scale-[0.97] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400";

/**
 * 按钮。样式档位集中在上面的映射表里，新增变体只需要加一行。
 */
export function GlassButton({
  children,
  href,
  variant = "glass",
  size = "md",
  className,
  type = "button",
  onClick,
}: GlassButtonProps) {
  const classes = cn(BASE_CLASS, VARIANT_CLASS[variant], SIZE_CLASS[size], className);

  if (href) {
    return (
      <SmartLink href={href} className={classes}>
        {children}
      </SmartLink>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}