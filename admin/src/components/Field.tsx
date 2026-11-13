import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

/** 文本类字段的统一标签与提示排布。 */
export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium tracking-wide text-white/50">
        {label}
      </span>
      {children}
      {hint && <span className="text-xs leading-5 text-white/30">{hint}</span>}
    </label>
  );
}
