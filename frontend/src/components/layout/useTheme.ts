"use client";

import { useSyncExternalStore } from "react";

export type Theme = "night" | "day";

/** 与 layout.tsx 的预置脚本共用同一个 key */
const STORAGE_KEY = "glass-notes-theme";

/** 主题变化时通知所有订阅者；状态本体以 <html data-theme> 为准 */
const listeners = new Set<() => void>();

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "day" ? "day" : "night";
}

/** 服务端与首屏水合统一按夜间渲染，水合完成后再切到本地记忆的主题 */
function getServerSnapshot(): Theme {
  return "night";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setTheme(theme: Theme) {
  if (theme === "day") {
    document.documentElement.dataset.theme = "day";
  } else {
    delete document.documentElement.dataset.theme;
  }
  window.localStorage.setItem(STORAGE_KEY, theme);
  listeners.forEach((listener) => listener());
}
