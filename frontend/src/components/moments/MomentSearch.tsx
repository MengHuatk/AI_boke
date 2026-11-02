"use client";

import { Icon } from "@/components/ui/Icon";

interface MomentSearchProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * 512×58 毛玻璃搜索胶囊。
 *
 * 外壳沿用 ArchiveSearch 的尺寸与 glass-panel 配方；额外在
 * focus-within 时把边框换成淡紫蓝并加一圈外发光。输入本身不画
 * outline，焦点反馈全部落在外壳上。
 */
export function MomentSearch({ value, onChange }: MomentSearchProps) {
  return (
    <label className="glass-panel flex h-[58px] w-[512px] max-w-full items-center gap-2 rounded-glass px-4 transition-[border-color,box-shadow] duration-300 focus-within:border-neon-500/60 focus-within:shadow-[0_0_0_1px_rgba(144,110,255,0.35),0_0_28px_-4px_rgba(144,110,255,0.65),0_10px_40px_-10px_rgba(0,0,0,0.5)]">
      <Icon name="search" size={16} className="shrink-0 text-white/40" />
      <input
        aria-label="搜索说说"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="搜索正文或位置…"
        className="h-full w-full bg-transparent font-xiaowei text-[16px] text-white/85 outline-none placeholder:text-white/35"
      />
    </label>
  );
}
