"use client";

import { Icon } from "@/components/ui/Icon";

interface TalkSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** 防抖等待中：右侧固定宽度显示轻提示，避免输入框宽度跳动 */
  searching?: boolean;
}

/**
 * 512×58 毛玻璃搜索胶囊。
 *
 * 外壳沿用 ArchiveSearch / MomentSearch 的尺寸与 glass-panel 配方；
 * focus-within 时边框转淡紫蓝并加一圈外发光。右侧常驻一块 52px 的
 * 提示位，防抖期间显示「搜索中…」，平时留空，布局不位移。
 */
export function TalkSearch({
  value,
  onChange,
  searching = false,
}: TalkSearchProps) {
  return (
    <label className="glass-panel flex h-[58px] w-[512px] max-w-full items-center gap-2 rounded-glass px-4 transition-[border-color,box-shadow] duration-300 focus-within:border-neon-500/60 focus-within:shadow-[0_0_0_1px_rgba(144,110,255,0.35),0_0_28px_-4px_rgba(144,110,255,0.65),0_10px_40px_-10px_rgba(0,0,0,0.5)]">
      <Icon name="search" size={16} className="shrink-0 text-white/40" />
      <input
        aria-label="搜索杂谈"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="搜索被遗忘的思绪…"
        className="h-full w-full bg-transparent font-xiaowei text-[16px] text-white/85 outline-none placeholder:text-white/35"
      />
      <span
        aria-live="polite"
        className="w-[52px] shrink-0 text-right text-[12px] text-white/35"
      >
        {searching ? "搜索中…" : ""}
      </span>
    </label>
  );
}
