"use client";

import { useEffect, useRef, useState } from "react";

import { useMusic } from "@/components/music/MusicProvider";
import { useRainSettings } from "@/components/music/RainSettingsProvider";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/format";

/** 三档预设，和滑杆共用 0–100 的密度值 */
const PRESETS = [
  { label: "小", density: 45 },
  { label: "中", density: 70 },
  { label: "大", density: 100 },
] as const;

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** 面板里的一行开关，两处复用 */
function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between text-[12px] text-white/65 transition hover:text-white/85"
    >
      <span>{label}</span>
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-brand-500/80" : "bg-white/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white shadow-sm ring-1 ring-black/10 transition-all",
            checked ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

/**
 * 全站左下角的雨幕控制。
 *
 * 收起时只是一枚小圆按钮；点开后向上展开设置面板，包含总开关、
 * 仅播放时下雨、雨量跟随进度、雨量滑杆、三档预设、水花开关、
 * 低画质模式和恢复默认。
 * 点击面板外部或按 Esc 收起，避免一直挡着左下角。
 *
 * 设置由 RainSettingsProvider 保存到 localStorage；
 * 这里只负责交互，不直接碰 Canvas 或播放状态。
 */
export function RainControl() {
  const { settings, update, reset } = useRainSettings();
  const { playing } = useMusic();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const rainOn =
    settings.enabled &&
    settings.density > 0 &&
    (!settings.followMusic || playing);
  // 开启中但被「仅播放时下雨」挡住时，提示等待播放而不是显示已关闭
  const statusText = rainOn
    ? "已开启"
    : settings.enabled && settings.density > 0
      ? "等待播放"
      : "已关闭";

  return (
    <div ref={wrapperRef} className="fixed bottom-5 left-5 z-[60]">
      {open && (
        <div
          role="dialog"
          aria-label="雨幕设置"
          className="glass-panel absolute bottom-[calc(100%+10px)] left-0 w-[236px] rounded-glass p-4 text-white/85 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <span className="font-xiaowei text-[13px] tracking-[0.14em] text-white/70">
              RAIN
            </span>
            <span className="text-[10px] text-white/40">{statusText}</span>
          </div>

          <button
            type="button"
            aria-pressed={settings.enabled}
            onClick={() => update({ enabled: !settings.enabled })}
            className="mt-4 flex w-full items-center justify-between text-[12px] text-white/75 transition hover:text-white/90"
          >
            <span>显示雨幕</span>
            <span
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                settings.enabled ? "bg-brand-500/80" : "bg-white/15",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-4 rounded-full bg-white shadow-sm ring-1 ring-black/10 transition-all",
                  settings.enabled ? "left-[18px]" : "left-0.5",
                )}
              />
            </span>
          </button>

          <div className="mt-3">
            <ToggleRow
              label="仅播放时下雨"
              checked={settings.followMusic}
              onChange={(checked) => update({ followMusic: checked })}
            />
          </div>

          <div className="mt-3">
            <ToggleRow
              label="雨量跟随进度"
              checked={settings.followProgress}
              onChange={(checked) => update({ followProgress: checked })}
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-white/55">
              <span>雨量</span>
              <span className="text-white/80 tabular-nums">
                {settings.density}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={settings.density}
              aria-label="雨量"
              onChange={(event) =>
                update({ density: Number(event.target.value) })
              }
              className="mt-2 w-full accent-brand-400"
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                aria-pressed={settings.density === preset.density}
                onClick={() => update({ density: preset.density })}
                className={cn(
                  "rounded-full border px-2 py-1 text-[11px] transition",
                  settings.density === preset.density
                    ? "border-brand-400/60 bg-brand-500/25 text-white"
                    : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2.5 border-t border-white/10 pt-3">
            <ToggleRow
              label="底部水花"
              checked={settings.splashes}
              onChange={(checked) => update({ splashes: checked })}
            />
            <ToggleRow
              label="低画质模式"
              checked={settings.lowQuality}
              onChange={(checked) => update({ lowQuality: checked })}
            />
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-4 w-full rounded-full border border-white/10 py-1.5 text-[11px] text-white/50 transition hover:bg-white/10 hover:text-white/75"
          >
            恢复默认
          </button>
        </div>
      )}

      <button
        type="button"
        aria-label="雨幕设置"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="keep-light relative grid size-11 place-items-center rounded-full border border-white/15 bg-[#0a1424]/85 text-white/85 shadow-[0_12px_30px_-14px_rgb(0_0_0/0.9)] backdrop-blur-md transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
      >
        <Icon name="rain" size={20} />
        <span
          className={cn(
            "absolute right-1.5 bottom-1.5 size-1.5 rounded-full",
            rainOn ? "bg-emerald-300" : "bg-white/30",
          )}
        />
      </button>
    </div>
  );
}
