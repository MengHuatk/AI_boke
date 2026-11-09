"use client";

import { useState } from "react";

import { GlassCard } from "@/components/ui/GlassCard";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/format";
import {
  formatDuration,
  type MusicTrack,
  type PlayOrder,
} from "@/lib/music-fixtures";

interface MusicPlayerProps {
  track: MusicTrack;
  playing: boolean;
  elapsed: number;
  /** 当前曲目时长：有外部音频时是真实时长，否则取 fixtures 占位值 */
  duration: number;
  volume: number;
  order: PlayOrder;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (value: number) => void;
  onCycleOrder: () => void;
}

/** 中心真正镂空的遮罩：0–13px 透明，14px 起不透明 */
const HOLE_MASK =
  "radial-gradient(circle at center, transparent 0 13px, black 14px)";

/** 唱片纹路：一圈圈同心细线，和盘面共用同一个镂空遮罩 */
const GROOVES =
  "repeating-radial-gradient(circle at center, transparent 0 3px, rgb(0 0 0 / 0.32) 4px, transparent 5px)";

const ORDER_META: Record<PlayOrder, { icon: IconName; label: string }> = {
  sequence: { icon: "repeat", label: "顺序播放" },
  single: { icon: "repeat", label: "单曲循环" },
  shuffle: { icon: "shuffle", label: "随机播放" },
};

const CONTROL_BTN =
  "grid size-9 shrink-0 place-items-center rounded-full text-white/55 transition-colors duration-200 hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 mx-3";

/**
 * 左侧播放器盒（桌面端 481×637）。
 *
 * 自上而下：中心镂空的黑胶唱片 → 歌名/歌手 → 进度条 →
 * 居中的播放顺序、上一首、播放/暂停、下一首与音量。
 * 音量滑块默认收起，点击音量图标向左展开，鼠标移出音量区自动收起。
 * 唱片盘面用曲目的 cover 生成（渐变或图片背景），播放时旋转、暂停时停在当前帧；
 * 中心孔是 mask 真正挖穿的，能透出盒子背后的玻璃底色。
 */
export function MusicPlayer({
  track,
  playing,
  elapsed,
  duration,
  volume,
  order,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onCycleOrder,
}: MusicPlayerProps) {
  const orderMeta = ORDER_META[order];
  const muted = volume === 0;
  // 音量滑块默认收起，点击音量图标后向左展开
  const [volumeOpen, setVolumeOpen] = useState(false);

  return (
    <GlassCard
      padding="none"
      className="flex w-full flex-col items-center px-10 py-9 font-yahei xl:h-[637px]"
    >
      {/* 唱片 */}
      <div className="relative grid size-[280px] shrink-0 place-items-center">
        {/* 盘面外发光，随封面颜色变化 */}
        <div
          className="absolute size-[250px] rounded-full opacity-40 blur-3xl"
          style={{ background: track.cover }}
        />

        <div
          className="vinyl-spin relative size-[280px] rounded-full shadow-[0_26px_60px_-20px_rgb(0_0_0/0.85)]"
          style={{ animationPlayState: playing ? "running" : "paused" }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: track.cover,
              maskImage: HOLE_MASK,
              WebkitMaskImage: HOLE_MASK,
            }}
          />
          <div
            className="absolute inset-0 rounded-full opacity-70"
            style={{
              backgroundImage: GROOVES,
              maskImage: HOLE_MASK,
              WebkitMaskImage: HOLE_MASK,
            }}
          />
          {/* 左上高光，让盘面不至于是一块死渐变 */}
          <div
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(145deg, rgb(255 255 255 / 0.55), transparent 45%)",
              maskImage: HOLE_MASK,
              WebkitMaskImage: HOLE_MASK,
            }}
          />
          {/* 中心孔外圈 */}
          <div className="absolute top-1/2 left-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
        </div>
      </div>

      {/* 歌名 / 歌手 */}
      <div className="mt-7 flex flex-col items-center gap-1.5 text-center">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          {track.title}
        </h2>
        <p className="text-[13px] text-white/50">{track.artist}</p>
      </div>

      {/* 进度 */}
      <div className="mt-auto w-full pt-8">
        <input
          type="range"
          min={0}
          max={duration}
          step={1}
          value={Math.min(elapsed, duration)}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label="播放进度"
          className="w-full cursor-pointer accent-neon-500"
        />
        <div className="mt-2 flex items-center justify-between text-[11px] tabular-nums text-white/40">
          <span>{formatDuration(elapsed)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* 播放控制：整排居中；音量滑块默认收起，点击图标向左展开 */}
      <div className="mt-6 flex w-full items-center justify-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCycleOrder}
            aria-label={`播放模式：${orderMeta.label}`}
            title={orderMeta.label}
            className={CONTROL_BTN}
          >
            <span className="relative">
              <Icon name={orderMeta.icon} size={20} />
              {order === "single" && (
                <span className="absolute -top-1 -right-1.5 text-[8px] leading-none text-white/70">
                  1
                </span>
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={onPrev}
            aria-label="上一首"
            title="上一首"
            className={CONTROL_BTN}
          >
            <Icon name="prev" size={35} />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={playing ? "暂停" : "播放"}
            title={playing ? "暂停" : "播放"}
            className="keep-light grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-[inset_0_1px_0_0_rgb(255_255_255/0.3),0_10px_28px_-12px_var(--color-brand-600)] transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 mx-2"
          >
            <Icon name={playing ? "pause" : "play"} size={35} />
          </button>

          <button
            type="button"
            onClick={onNext}
            aria-label="下一首"
            title="下一首"
            className={CONTROL_BTN}
          >
            <Icon name="next" size={35} />
          </button>
        </div>

        <div
          className="flex items-center gap-2"
          onMouseLeave={() => setVolumeOpen(false)}
        >
          {/* 宽度从 0 过渡到滑块宽度：向左展开，移出音量区自动收起 */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-out",
              volumeOpen ? "w-16 opacity-100 sm:w-18" : "w-0 opacity-0",
            )}
          >
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={volume}
              onChange={(event) => onVolumeChange(Number(event.target.value))}
              aria-label="音量"
              className="w-16 cursor-pointer accent-neon-500 sm:w-18"
            />
          </div>

          <button
            type="button"
            onClick={() => setVolumeOpen((open) => !open)}
            aria-label={volumeOpen ? "收起音量调节" : "展开音量调节"}
            aria-expanded={volumeOpen}
            title="音量"
            className={cn(CONTROL_BTN, "size-8")}
          >
            <Icon name={muted ? "volumeMute" : "volume"} size={20} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
