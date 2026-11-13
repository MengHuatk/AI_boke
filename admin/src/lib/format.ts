/** 后台展示用的日期与标签格式化。 */

const publicSiteUrl =
  import.meta.env.VITE_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * 封面与正文图片的预览地址。
 *
 * 旧内容的封面是公开站静态路径（/images/...），后台跑在另一个端口，
 * 直接引用会 404；这里按公开站地址补全。上传接口返回的是完整 URL，
 * 原样返回。
 */
export function previewAssetUrl(value: string): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${publicSiteUrl.replace(/\/+$/, "")}${value}`;
}

export function formatDateTime(value: string | null): string {
  if (!value) return "未发布";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
