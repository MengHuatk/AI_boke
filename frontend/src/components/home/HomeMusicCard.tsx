"use client";

import { useEffect, useState } from "react";

import { useMusic } from "@/components/music/MusicProvider";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import { findActiveLine, formatDuration } from "@/lib/music-fixtures";

/** 打字机速度：每字 40ms */
const TYPE_SPEED_MS = 40;
/** 切歌时擦除上一首的速度：每字 15ms */
const ERASE_SPEED_MS = 15;
/** 擦完到新句开口之间的停顿 */
const SWITCH_GAP_MS = 60;

/** 76px 唱片中心孔的镂空遮罩 */
const HOLE_MASK =
  "radial-gradient(circle at center, transparent 0 5px, black 6px)";

/** 唱片纹路：一圈圈同心细线，和盘面共用同一个镂空遮罩 */
const GROOVES =
  "repeating-radial-gradient(circle at center, transparent 0 3px, rgb(0 0 0 / 0.32) 4px, transparent 5px)";

/**
 * 首页迷你音乐卡（桌面端 433×280）。
 *
 * 自上而下：
 *   76px 黑胶 + 右侧歌名/歌手 →
 *   单行歌词（切句时按固定速度逐字打出，不显示光标）→
 *   进度条 → 居中的上一首 / 暂停 / 下一首。
 *
 * 状态全部来自 MusicProvider，和音乐页、全站播放器共用同一份数据。
 */
export function HomeMusicCard() {
  const { track, playing, elapsed, duration, togglePlay, goPrev, goNext, seek } =
    useMusic();

  const active = findActiveLine(track.lyrics, elapsed);
  // 前奏时把第一句作为预告；没有歌词时才退回歌手名
  const lyric =
    active >= 0
      ? track.lyrics[active].text
      : (track.lyrics[0]?.text ?? track.artist);

  return (
    <GlassCard
      padding="none"
      className="relative flex w-full flex-col p-6 xl:h-[280px] xl:w-[433px] xl:shrink-0 hover:scale-102 duration-1000 transition-all"
    >
      {/* 整卡入口：覆盖在唱片/歌词之上、进度与播放控制之下 */}
      <SmartLink
        href="/music"
        aria-label="前往音乐页"
        className="absolute inset-0 z-10 rounded-glass transition-colors duration-200  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
      >
        <span aria-hidden="true" />
      </SmartLink>

      {/* 头部：76px 黑胶 + 歌名 / 歌手 */}
      <div className="flex items-center gap-4">
        <div className="relative size-[76px] shrink-0">
          <div
            className="absolute -inset-1 rounded-full opacity-40 blur-lg"
            style={{ background: track.cover }}
          />

          <div
            className="vinyl-spin relative size-full rounded-full shadow-[0_10px_24px_-12px_rgb(0_0_0/0.9)]"
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
            <div
              className="absolute inset-0 rounded-full opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(145deg, rgb(255 255 255 / 0.55), transparent 45%)",
                maskImage: HOLE_MASK,
                WebkitMaskImage: HOLE_MASK,
              }}
            />
            <div className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-xiaowei text-[25px] leading-tight text-white/95">
            {track.title}
          </h2>
          <p className="mt-1 truncate text-[16px] text-white/45">
            {track.artist}
          </p>
        </div>
      </div>

      {/* 歌词：单行打字机；换行/切歌时辉光扫过，无光标 */}
      <div className="relative my-4 flex h-10 items-center overflow-hidden">
        <span
          key={`${active}-${lyric}`}
          aria-hidden="true"
          className="home-lyric-sweep pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r "
        />
        <p className="relative w-full truncate font-yahei text-[14px] leading-6 text-[#7569FF]/85">
          <TypedLyric
            trackId={track.id}
            lineKey={`${active}-${lyric}`}
            text={lyric}
          />
        </p>
      </div>

      {/* 进度 */}
      <div className="relative z-20 mt-auto">
        <input
          type="range"
          min={0}
          max={duration}
          step={1}
          value={Math.min(elapsed, duration)}
          onChange={(event) => seek(Number(event.target.value))}
          aria-label="播放进度"
          className="w-full cursor-pointer accent-neon-500"
        />
        <div className="mt-2 flex items-center justify-between text-[10px] tabular-nums text-white/35">
          <span>{formatDuration(elapsed)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* 控制区：水平居中 */}
      <div className="relative z-20 mt-3 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={goPrev}
          aria-label="上一首"
          title="上一首"
          className="grid size-8 place-items-center rounded-full text-white/55 transition-colors duration-200 hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
        >
          <Icon name="prev" size={28} />
        </button>

        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "暂停" : "播放"}
          title={playing ? "暂停" : "播放"}
          className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-[inset_0_1px_0_0_rgb(255_255_255/0.3),0_10px_28px_-12px_var(--color-brand-600)] transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
        >
          <Icon name={playing ? "pause" : "play"} size={30} />
        </button>

        <button
          type="button"
          onClick={goNext}
          aria-label="下一首"
          title="下一首"
          className="grid size-8 place-items-center rounded-full text-white/55 transition-colors duration-200 hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
        >
          <Icon name="next" size={28} />
        </button>
      </div>
    </GlassCard>
  );
}

interface TypedLyricProps {
  trackId: string;
  /** 同一首内换行的标识：变化时从头重打 */
  lineKey: string;
  text: string;
}

interface TypedLyricState {
  trackId: string;
  lineKey: string;
  target: string;
  eraseFrom: string;
  visible: number;
  mode: "typing" | "erasing";
}

/**
 * 单行打字机。
 *
 * 同一首内换行：状态回到 0，从第一个字重新打。
 * 切歌：先把上一首此刻显示的文字快速擦掉，停一拍，再打出新曲第一句。
 * 用渲染期派生状态跟随 props，避免在 effect 里同步 setState。
 */
function TypedLyric({ trackId, lineKey, text }: TypedLyricProps) {
  const [state, setState] = useState<TypedLyricState>({
    trackId,
    lineKey,
    target: text,
    eraseFrom: "",
    visible: 0,
    mode: "typing",
  });

  if (state.trackId !== trackId) {
    // 切歌：保留此刻屏幕上的部分，先擦掉它
    const shown =
      state.mode === "erasing"
        ? state.eraseFrom.slice(0, state.visible)
        : state.target.slice(0, state.visible);
    setState({
      trackId,
      lineKey,
      target: text,
      eraseFrom: shown,
      visible: shown.length,
      mode: "erasing",
    });
  } else if (state.lineKey !== lineKey) {
    // 同一首内换行：直接从头打新的一句
    setState({
      trackId,
      lineKey,
      target: text,
      eraseFrom: "",
      visible: 0,
      mode: "typing",
    });
  }

  useEffect(() => {
    if (state.mode === "erasing" && state.visible <= 0) {
      // 擦完停一拍，再开始打新曲第一句
      const timer = window.setTimeout(() => {
        setState((prev) =>
          prev.mode === "erasing"
            ? { ...prev, mode: "typing", visible: 0, eraseFrom: "" }
            : prev,
        );
      }, SWITCH_GAP_MS);
      return () => window.clearTimeout(timer);
    }

    const full = state.mode === "erasing" ? state.eraseFrom : state.target;
    if (state.mode === "typing" && state.visible >= full.length) return;

    const step = state.mode === "erasing" ? -1 : 1;
    const timer = window.setTimeout(
      () => {
        setState((prev) => {
          if (prev.mode !== state.mode) return prev;
          const max =
            prev.mode === "erasing"
              ? prev.eraseFrom.length
              : prev.target.length;
          return {
            ...prev,
            visible: Math.min(Math.max(prev.visible + step, 0), max),
          };
        });
      },
      state.mode === "erasing" ? ERASE_SPEED_MS : TYPE_SPEED_MS,
    );

    return () => window.clearTimeout(timer);
  }, [state]);

  const source = state.mode === "erasing" ? state.eraseFrom : state.target;
  return <>{source.slice(0, state.visible)}</>;
}
