import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TagChip } from "@/components/ui/TagChip";
import type { TagStat } from "@/lib/types";

interface TagCloudProps {
  tags: TagStat[];
  /** 标签详情页的路由前缀 */
  basePath?: string;
}

/**
 * 标签云。标签与文章数由后端从文章数据推导，不需要单独维护。
 */
export function TagCloud({ tags, basePath = "/tags" }: TagCloudProps) {
  return (
    <GlassCard as="section" padding="lg">
      <SectionHeading eyebrow="Topics" title="标签" icon="hash" />

      {tags.length === 0 ? (
        <p className="text-sm text-white/40">暂无标签。</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag.name}>
              <TagChip
                label={tag.name}
                count={tag.count}
                href={`${basePath}/${encodeURIComponent(tag.name)}`}
              />
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}