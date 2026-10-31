"use client";

import { Icon } from "@/components/ui/Icon";

interface ProjectSearchProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * 512×50 毛玻璃搜索胶囊。
 *
 * 受控组件，状态收在 ProjectsMatrix；输入即过滤下方项目卡。
 * 匹配范围在父层定义：项目名 / README 标题 / 技术栈。
 */
export function ProjectSearch({ value, onChange }: ProjectSearchProps) {
  return (
    <label className="glass-panel flex h-[50px] w-[512px] max-w-full self-center items-center gap-2 rounded-full px-4">
      <Icon name="search" size={16} className="shrink-0 text-white/40" />
      <input
        aria-label="搜索项目"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="搜索项目名、描述或技术栈…"
        className="h-full w-full bg-transparent font-xiaowei text-[16px] text-white/85 outline-none placeholder:text-white/35"
      />
    </label>
  );
}
