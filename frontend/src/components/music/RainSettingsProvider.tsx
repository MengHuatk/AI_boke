"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/** 雨幕设置；面板里的开关、滑杆和附加选项共用这一份状态 */
export interface RainSettings {
  /** 总开关 */
  enabled: boolean;
  /** 雨量密度，0–100；0 等同于关闭 */
  density: number;
  /** 是否只在音乐播放时下雨；关闭后雨幕常开 */
  followMusic: boolean;
  /** 雨量是否随播放进度由小变大；关闭后固定为满雨势 */
  followProgress: boolean;
  /** 是否生成底部水花 */
  splashes: boolean;
  /** 低画质：DPR 上限降到 1.5，并进一步减少可见雨滴 */
  lowQuality: boolean;
}

export const DEFAULT_RAIN_SETTINGS: RainSettings = {
  enabled: true,
  density: 70,
  followMusic: true,
  followProgress: true,
  splashes: true,
  lowQuality: false,
};

/** 与雨幕层、控制面板共用同一个 key */
const STORAGE_KEY = "glass-notes-rain-settings";

interface RainSettingsContextValue {
  settings: RainSettings;
  update: (patch: Partial<RainSettings>) => void;
  reset: () => void;
}

const RainSettingsContext = createContext<RainSettingsContextValue | null>(null);

export function useRainSettings() {
  const value = useContext(RainSettingsContext);
  if (!value) {
    throw new Error("useRainSettings 必须在 RainSettingsProvider 内使用");
  }
  return value;
}

/**
 * 全站雨幕设置。
 *
 * 首帧统一用默认值，挂载后再读 localStorage，避免 SSR/水合不一致；
 * 读取完成前不回写，否则默认值会先一步覆盖掉本地保存的设置。
 * 播放状态仍由 MusicProvider 提供，这里只负责「雨幕怎么显示」。
 */
export function RainSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_RAIN_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as Partial<RainSettings>;
      setSettings({ ...DEFAULT_RAIN_SETTINGS, ...stored });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [hydrated, settings]);

  const update = useCallback((patch: Partial<RainSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_RAIN_SETTINGS);
  }, []);

  return (
    <RainSettingsContext.Provider value={{ settings, update, reset }}>
      {children}
    </RainSettingsContext.Provider>
  );
}
