"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/format";
import {
  findActiveLine,
  type MusicLyricLine,
  type MusicTrack,
} from "@/lib/music";

/** 打字占一句时长的比例，尾巴留给光标停留与退格 */
const TYPE_SHARE = 0.65;
/** 整句打字时长的上下限：间奏前不拖成几十秒，短句也不至于快到看不清 */
const TYPE_MIN_SEC = 0.6;
const TYPE_MAX_SEC = 4.5;
/** 单字速度上下限：随句时长与字数反推后再夹一次 */
const PACE_MIN_SEC = 0.045;
const PACE_MAX_SEC = 0.3;
/** 逐字退格：18ms/字，整句总时长夹在 120–400ms */
const ERASE_PER_CHAR_SEC = 0.018;
const ERASE_MIN_SEC = 0.12;
const ERASE_MAX_SEC = 0.4;
/** 退格结束与下一句之间留的呼吸 */
const ERASE_GAP_SEC = 0.08;

/** 切歌时擦掉上一首当前显示文字的节奏：15ms/字，整段 120–320ms */
const SWITCH_ERASE_PER_CHAR_SEC = 0.015;
const SWITCH_ERASE_MIN_SEC = 0.12;
const SWITCH_ERASE_MAX_SEC = 0.32;
/** 新曲第一句的入场打字：45ms/字，整段 0.35–1.4s */
const SWITCH_TYPE_PER_CHAR_SEC = 0.045;
const SWITCH_TYPE_MIN_SEC = 0.35;
const SWITCH_TYPE_MAX_SEC = 1.4;
/** 擦除结束到第一句开口之间的停顿 */
const SWITCH_GAP_SEC = 0.08;

type LyricPhase = "typing" | "idle" | "erasing" | "empty";

interface LyricFrame {
  /** 当前句下标，-1 表示没有歌词 */
  lineIndex: number;
  /** 此刻该显示的字符，退格阶段会逐字变短 */
  text: string;
  /** 打字 / 停留 / 退格 / 空行，横向滚动策略按它区分 */
  phase: LyricPhase;
}

/** 一次切歌的过渡：先快速擦掉旧文字，再逐字打出新曲第一句 */
interface TrackSwitch {
  oldChars: string[];
  firstChars: string[];
  startedAt: number;
  eraseDuration: number;
  typeDuration: number;
}

const EMPTY_FRAME: LyricFrame = { lineIndex: -1, text: "", phase: "empty" };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 求出某一时刻该显示的歌词帧（纯函数，便于由 elapsed 随时重算）。
 *
 * 一句的时间切成三段：打字（前 65%）→ 停留（光标闪）→ 退格
 * （18ms/字，结束于下一句前 80ms）。间奏很长时用 TYPE_MAX_SEC 兜底。
 *
 * 还没到第一句（未播放、前奏、暂停在开头）时直接整句显示第一句；
 * 第一句本身也不再重打，避免「整句 → 清空 → 重打」的跳变。
 * 从第二句开始进入正常的打字 / 停留 / 退格循环。
 */
function frameAt(
  lyrics: MusicLyricLine[],
  duration: number,
  elapsed: number,
): LyricFrame {
  const lineIndex = findActiveLine(lyrics, elapsed);
  if (lineIndex < 0) {
    const first = lyrics[0];
    return first
      ? { lineIndex: 0, text: first.text, phase: "idle" }
      : EMPTY_FRAME;
  }

  const line = lyrics[lineIndex];
  if (lineIndex === 0) {
    return { lineIndex, text: line.text, phase: "idle" };
  }

  // 按单字数组走，避免按 UTF-16 下标切断代理对
  const chars = Array.from(line.text);
  const next = lyrics[lineIndex + 1];
  // 最后一句没有后继时间点，用曲末往后放 4 秒当尾巴
  const lineEnd = next ? next.time : duration + 4;
  const span = Math.max(lineEnd - line.time, 0.001);

  const typeDuration = clamp(
    clamp(
      span * TYPE_SHARE,
      chars.length * PACE_MIN_SEC,
      chars.length * PACE_MAX_SEC,
    ),
    TYPE_MIN_SEC,
    TYPE_MAX_SEC,
  );
  const typeEnd = line.time + typeDuration;

  const eraseDuration = clamp(
    chars.length * ERASE_PER_CHAR_SEC,
    ERASE_MIN_SEC,
    ERASE_MAX_SEC,
  );
  const eraseEnd = lineEnd - ERASE_GAP_SEC;
  // 打字结束后才开始退格；时值不够时退格就紧贴下一句
  const eraseStart = Math.max(typeEnd, eraseEnd - eraseDuration);

  if (elapsed < typeEnd) {
    const ratio = clamp((elapsed - line.time) / (typeEnd - line.time), 0, 1);
    return {
      lineIndex,
      text: chars.slice(0, Math.floor(ratio * chars.length)).join(""),
      phase: "typing",
    };
  }

  if (elapsed < eraseStart) {
    return { lineIndex, text: line.text, phase: "idle" };
  }

  if (elapsed < eraseEnd) {
    const ratio = clamp((elapsed - eraseStart) / (eraseEnd - eraseStart), 0, 1);
    const remain = Math.ceil((1 - ratio) * chars.length);
    return {
      lineIndex,
      text: chars.slice(0, remain).join(""),
      phase: "erasing",
    };
  }

  // 退格完成到下一句到点之间：空行只留光标
  return { lineIndex, text: "", phase: "empty" };
}

interface LyricViewportProps {
  track: MusicTrack;
  playing: boolean;
  elapsed: number;
  /** 容器尺寸、背景、内边距等（文章页 270×60 玻璃盒 / 首页 1068×80 黑盒） */
  className?: string;
  /** 歌词文字样式，默认文章页的 14px */
  textClassName?: string;
  /** 光标尺寸，默认文章页的 14×2 */
  caretClassName?: string;
}

/**
 * 单行歌词视口：打字 → 停留 → 退格 + 末尾光标。
 *
 * 装得下一行时，已打文字 + 光标作为整体在盒内实时居中；装不下时
 * 自动退回左对齐，打字与退格把光标钉在右缘、停留期缓动回滚到句首。
 * 视图口滚动与两端渐隐遮罩都在这里处理，调用方只给尺寸和配色。
 *
 * 切歌时不会直接跳到新曲第一句：先把上一首此刻显示的文字快速擦掉，
 * 停一拍，再逐字打出新曲第一句，随后交回正常时间轴。
 *
 * provider 的 elapsed 是粗锚点（无音频直链时 1 秒才跳一次），这里在
 * 两跳之间用 performance.now 插值，字才会匀速出现而不是一秒蹦一串。
 */
export function LyricViewport({
  track,
  playing,
  elapsed,
  className,
  textClassName,
  caretClassName,
}: LyricViewportProps) {
  const [frame, setFrame] = useState<LyricFrame>(EMPTY_FRAME);
  // 视图口的滚动 / 溢出状态，决定渐隐遮罩要不要出现
  const [viewportState, setViewportState] = useState({
    atStart: true,
    overflowing: false,
  });

  // 锚点：provider 每次更新 elapsed 就重设，帧间自己往下插值
  const clockRef = useRef({ base: elapsed, anchor: 0 });
  // 帧内推进出的虚拟时间：暂停时冻在它上面，避免回到 provider 的整秒锚点；
  // 挂载时若音乐已暂停在中段，也要从当前位置起步
  const virtualRef = useRef(elapsed);
  // 上一次看到的 elapsed / 曲目，用来区分「时间真的变了」和「只是暂停/继续」
  const prevClockKeyRef = useRef({ elapsed, trackId: track.id });
  const playingRef = useRef(playing);
  const viewportStateRef = useRef({ atStart: true, overflowing: false });
  const viewportRef = useRef<HTMLDivElement>(null);
  // 当前帧的文字：切歌时要拿它做快速擦除
  const frameRef = useRef<LyricFrame>(EMPTY_FRAME);
  // 上一首曲目 id：变化时启动「擦掉旧词 → 打出新曲第一句」的过渡
  const previousTrackIdRef = useRef(track.id);
  const switchRef = useRef<TrackSwitch | null>(null);

  useEffect(() => {
    const changed =
      prevClockKeyRef.current.elapsed !== elapsed ||
      prevClockKeyRef.current.trackId !== track.id;
    prevClockKeyRef.current = { elapsed, trackId: track.id };

    clockRef.current = {
      // 时间点变了（播放推进 / seek / 切歌）以 provider 为准；
      // 只是按下暂停时冻在虚拟时间上，别把已经打出的字退回去
      base: changed || playing ? elapsed : virtualRef.current,
      anchor: performance.now(),
    };
  }, [elapsed, track.id, playing]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    // 切歌：记下上一首此刻显示的文字，先快速擦掉，再打出新曲第一句
    if (previousTrackIdRef.current !== track.id) {
      const oldChars = Array.from(frameRef.current.text);
      const firstChars = Array.from(track.lyrics[0]?.text ?? "");
      switchRef.current = {
        oldChars,
        firstChars,
        startedAt: performance.now(),
        eraseDuration: oldChars.length
          ? clamp(
              oldChars.length * SWITCH_ERASE_PER_CHAR_SEC,
              SWITCH_ERASE_MIN_SEC,
              SWITCH_ERASE_MAX_SEC,
            )
          : 0,
        typeDuration: clamp(
          firstChars.length * SWITCH_TYPE_PER_CHAR_SEC,
          SWITCH_TYPE_MIN_SEC,
          SWITCH_TYPE_MAX_SEC,
        ),
      };
      previousTrackIdRef.current = track.id;
    }

    let raf = 0;

    const tick = () => {
      const { base, anchor } = clockRef.current;
      const virtual = playingRef.current
        ? base + (performance.now() - anchor) / 1000
        : base;
      virtualRef.current = virtual;

      let next: LyricFrame;
      const switching = switchRef.current;
      if (switching) {
        const t = (performance.now() - switching.startedAt) / 1000;
        const typeStart = switching.eraseDuration + SWITCH_GAP_SEC;
        const typeEnd = typeStart + switching.typeDuration;

        if (t < switching.eraseDuration) {
          // 快速倒着删掉上一首此刻显示的歌词
          const remain = Math.ceil(
            (1 - t / switching.eraseDuration) * switching.oldChars.length,
          );
          next = {
            lineIndex: -1,
            text: switching.oldChars.slice(0, remain).join(""),
            phase: "erasing",
          };
        } else if (t < typeStart) {
          // 擦完停一拍，只留光标
          next = { lineIndex: -1, text: "", phase: "empty" };
        } else if (t < typeEnd) {
          // 新曲第一句逐字打出
          const count = Math.floor(
            ((t - typeStart) / switching.typeDuration) *
              switching.firstChars.length,
          );
          next = {
            lineIndex: 0,
            text: switching.firstChars.slice(0, count).join(""),
            phase: "typing",
          };
        } else {
          // 过渡结束，交回正常的时间轴
          switchRef.current = null;
          next = frameAt(track.lyrics, track.duration, virtual);
        }
      } else {
        next = frameAt(track.lyrics, track.duration, virtual);
      }

      frameRef.current = next;
      setFrame((prev) =>
        prev.lineIndex === next.lineIndex &&
        prev.text === next.text &&
        prev.phase === next.phase
          ? prev
          : next,
      );

      const viewport = viewportRef.current;
      if (viewport) {
        const max = viewport.scrollWidth - viewport.clientWidth;
        if (next.phase === "idle") {
          // 停留期缓动回滚到句首，把整句让出来
          viewport.scrollLeft += (0 - viewport.scrollLeft) * 0.1;
          if (viewport.scrollLeft < 0.5) viewport.scrollLeft = 0;
        } else if (next.phase === "erasing") {
          // 退格前先快速追到行尾，别让删除发生在视野外
          viewport.scrollLeft += (max - viewport.scrollLeft) * 0.25;
        } else {
          // 打字时追着光标跑，新字始终出现在视野内
          viewport.scrollLeft = max;
        }

        // 遮罩只在真正裁字时出现：
        // 滚过句首 → 左缘裁字；行宽溢出且停在句首 → 右缘裁字
        const nextState = {
          atStart: viewport.scrollLeft <= 2,
          overflowing: viewport.scrollWidth > viewport.clientWidth + 1,
        };
        const prevState = viewportStateRef.current;
        if (
          prevState.atStart !== nextState.atStart ||
          prevState.overflowing !== nextState.overflowing
        ) {
          viewportStateRef.current = nextState;
          setViewportState(nextState);
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [track]);

  // 左缘：滚动过才裁字；右缘：只有「行宽溢出 + 停留期回滚到句首」才会
  // 裁掉后半截。居中且不溢出的整句不加任何遮罩，也免得把光标压暗。
  const { atStart, overflowing } = viewportState;
  const fadeLeft = !atStart;
  const fadeRight = overflowing && frame.phase === "idle";
  const mask =
    fadeLeft && fadeRight
      ? "linear-gradient(90deg, transparent 0, black 14px, black calc(100% - 14px), transparent 100%)"
      : fadeLeft
        ? "linear-gradient(90deg, transparent 0, black 14px, black 100%)"
        : fadeRight
          ? "linear-gradient(90deg, black 0, black calc(100% - 14px), transparent 100%)"
          : undefined;

  return (
    <div
      ref={viewportRef}
      className={cn("flex items-center overflow-hidden", className)}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <span
        className={cn(
          "mx-auto shrink-0 whitespace-nowrap font-yahei leading-none tracking-wide text-neon-500",
          textClassName ?? "text-[14px]",
        )}
      >
        {frame.text}
        <span
          aria-hidden
          className={cn(
            "caret-blink ml-0.5 inline-block bg-neon-500",
            caretClassName ?? "h-[14px] w-[2px] translate-y-[1px]",
          )}
        />
      </span>
    </div>
  );
}
