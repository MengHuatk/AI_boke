"use client";

import { useEffect, useRef, useState } from "react";

import { useMusic } from "@/components/music/MusicProvider";
import { findActiveLine, type MusicLyricLine } from "@/lib/music-fixtures";

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

type LyricPhase = "typing" | "idle" | "erasing" | "empty";

interface LyricFrame {
  /** 当前句下标，-1 表示前奏/间奏里还没到第一句 */
  lineIndex: number;
  /** 此刻该显示的字符，退格阶段会逐字变短 */
  text: string;
  /** 打字 / 停留 / 退格 / 空行，横向滚动策略按它区分 */
  phase: LyricPhase;
}

const EMPTY_FRAME: LyricFrame = { lineIndex: -1, text: "", phase: "empty" };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 求出某一时刻该显示的歌词帧（纯函数，便于由 elapsed 随时重算）。
 *
 * 甲案把一句的时间切成三段：
 *   打字（前 65%）→ 停留（光标闪）→ 退格（18ms/字，结束于下一句前 80ms）。
 * 退格排在打字之后、又在下一句到点之前，所以新句能整点开打、继续跟拍；
 * 间奏很长时用 TYPE_MAX_SEC 兜底，不会一句打十几秒。
 */
function frameAt(
  lyrics: MusicLyricLine[],
  duration: number,
  elapsed: number,
): LyricFrame {
  const lineIndex = findActiveLine(lyrics, elapsed);
  if (lineIndex < 0) return EMPTY_FRAME;

  const line = lyrics[lineIndex];
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

/**
 * 文章页右轨「正在播放」盒（320×210）。
 *
 * 自上而下：固定标题 NOW PLAYING → 50px 黑胶唱片 + 歌名/歌手 →
 * 270×60 单行歌词区。唱片播放时匀速旋转、暂停停在当前帧；
 * 歌词按「打字 → 停留 → 退格」循环推进，主紫 #906EFF，末尾光标硬闪。
 *
 * 状态全部来自 MusicProvider，和音乐页大播放器、右下角迷你盒同源。
 * provider 的 elapsed 是粗锚点（无音频直链时 1 秒才跳一次），这里在
 * 两跳之间用 performance.now 插值，字才会匀速出现而不是一秒蹦一串。
 *
 * 装得下一行时，已打文字 + 光标作为整体在盒内实时居中（flex 的
 * mx-auto）：每多一个字，整行向左挪半格，从中间向两侧生长。
 * 装不下时（270px 在 14px 下约 19 个全角字）自动退回左对齐，
 * 打字与退格把光标钉在右缘、停留期缓动回滚到句首让人读完。
 */
export function PostNowPlaying() {
  const { track, playing, elapsed } = useMusic();
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
    let raf = 0;

    const tick = () => {
      const { base, anchor } = clockRef.current;
      const virtual = playingRef.current
        ? base + (performance.now() - anchor) / 1000
        : base;
      virtualRef.current = virtual;

      const next = frameAt(track.lyrics, track.duration, virtual);
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
      role="group"
      aria-label="正在播放"
      className="glass-panel-thick flex h-[210px] w-full shrink-0 flex-col justify-between rounded-glass px-6 py-5"
    >
      <span className="font-xiaowei text-[16px] leading-none tracking-[0.22em] text-white/85">
        NOW PLAYING
      </span>

      {/* 音乐状态区：左唱片 + 右歌名/歌手 */}
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="vinyl-spin grid size-[50px] shrink-0 place-items-center rounded-full border border-white/15 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.25)]"
          style={{
            background: track.cover,
            animationPlayState: playing ? "running" : "paused",
          }}
        >
          <span className="size-[7px] rounded-full bg-[#0a1424] ring-1 ring-white/30" />
        </span>

        <div className="min-w-0">
          <p className="truncate font-yahei text-[14px] leading-5 text-white/90">
            {track.title}
          </p>
          <p className="truncate font-yahei text-[11px] leading-4 text-white/45">
            {track.artist}
          </p>
        </div>
      </div>

      {/* 歌词区 270×60：单行打字机，装得下时整体居中，溢出后退回左对齐横滚 */}
      <div
        ref={viewportRef}
        className="flex h-[60px] w-[270px] items-center overflow-hidden glass-panel rounded-[16px]"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        <span className="mx-auto shrink-0 whitespace-nowrap font-yahei text-[14px] leading-none tracking-wide text-neon-500">
          {frame.text}
          <span
            aria-hidden
            className="caret-blink ml-0.5 inline-block h-[14px] w-[2px] translate-y-[1px] bg-neon-500"
          />
        </span>
      </div>
    </div>
  );
}
