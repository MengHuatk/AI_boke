/**
 * 展示层格式化工具。
 * 集中放在这里，避免各组件各写一套日期/数字格式。
 */

import { uiConfig } from "@/lib/config";
import type { MomentLocation } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat(uiConfig.locale, {
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** "2026-09-28" → "2026年9月28日" */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : dateFormatter.format(date);
}

/** 时间轴用：2026-10-30T21:10:00 → "2026-10-30 21:10" */
export function formatTimelineTime(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** 大数字缩写：1200 → "1.2k"，18000 → "1.8w"（中文习惯用「万」） */
export function formatCompactNumber(value: number): string {
  if (value < 1000) return String(value);
  if (value < 10000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${(value / 10000).toFixed(1).replace(/\.0$/, "")}w`;
}

/** 判断是否为外链，供 SmartLink 决定用 <Link> 还是 <a target="_blank"> */
export function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//.test(href) || /^(mailto|tel):/.test(href);
}

/** 把类名数组拼成字符串，过滤掉 falsy 项 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** 说说位置：省 · 市 · 区；缺项自动跳过，全空时给占位文案 */
export function formatMomentLocation(location: MomentLocation): string {
  const parts = [
    location.province,
    location.city,
    location.district,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "未标注位置";
}
