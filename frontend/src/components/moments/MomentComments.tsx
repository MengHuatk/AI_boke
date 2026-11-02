"use client";

import { GiscusComments } from "@/components/post/GiscusComments";

/**
 * 说说评论区：每条说说用 specific 映射开独立 discussion。
 *
 * Giscus iframe 的高度由宿主 div 的 min-h 兜底（见 GiscusComments），
 * 展开动画在 iframe 加载前也有稳定的落点。GitHub 登录由 giscus 自带。
 */
export function MomentComments({ momentId }: { momentId: string }) {
  return <GiscusComments mapping="specific" term={`moments/${momentId}`} />;
}
