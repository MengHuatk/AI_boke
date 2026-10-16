import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatCompactNumber } from "@/lib/format";
import type { SiteStats } from "@/lib/types";
import type { IconName } from "@/components/ui/Icon";

interface StatsCardProps {
  stats: SiteStats;
}

/**
 * 统计卡。
 * 数字全部由后端从文章数据聚合得出（见 backend/app/repositories/json_repository.py），
 * 前端不做任何计算，也不写死。
 */
export function StatsCard({ stats }: StatsCardProps) {
  const items: Array<{
    icon: IconName;
    value: string;
    unit: string;
    label: string;
  }> = [
    { icon: "document", value: String(stats.posts), unit: "篇", label: "文章" },
    { icon: "hash", value: String(stats.tags), unit: "个", label: "标签" },
    {
      icon: "pen",
      value: formatCompactNumber(stats.words),
      unit: "字",
      label: "累计写作",
    },
    { icon: "clock", value: String(stats.since), unit: "年", label: "始于" },
  ];

  return (
    <GlassCard as="section" padding="lg">
      <SectionHeading eyebrow="Stats" title="博客数据" icon="layers" />

      <ul className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <li
            key={item.label}
            className="glass-panel-subtle flex flex-col gap-2 rounded-glass p-4"
          >
            <Icon name={item.icon} size={16} className="text-brand-300/80" />
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-semibold tabular-nums text-white/90">
                {item.value}
              </span>
              <span className="text-[11px] text-white/40">{item.unit}</span>
            </div>
            <span className="text-[11px] tracking-wide text-white/45">
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}