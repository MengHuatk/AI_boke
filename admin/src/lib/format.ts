/** 后台展示用的日期与标签格式化。 */

const publicSiteUrl =
  import.meta.env.VITE_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * 封面与正文图片的预览地址。
 *
 * 上传图片以 /uploads/... 相对路径入库：Vite dev server 与 FastAPI
 * 都代理/挂载了该路径，原样返回即可。旧内容的封面是公开站静态路径
 * （/images/...），后台跑在另一个端口，需要按公开站地址补全。
 */
export function previewAssetUrl(value: string): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/uploads/")) return value;
  return `${publicSiteUrl.replace(/\/+$/, "")}${value}`;
}

export function formatDateTime(value: string | null): string {
  if (!value) return "未发布";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/** 秒 → "m:ss"，与公开站播放器保持一致。 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

/** 后端是无时区 ISO；直接截字符串，避免 new Date 按 UTC 解释。 */
export function toDateTimeLocal(value: string | null): string {
  return value ? value.slice(0, 16) : "";
}

export function fromDateTimeLocal(value: string): string | null {
  return value ? `${value}:00` : null;
}

export function parseTags(value: string): string[] {
  const tags = value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  return Array.from(new Set(tags));
}

export function formatTags(tags: string[]): string {
  return tags.join(", ");
}
