"use client";

import { useEffect, useRef, useState } from "react";

import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/format";
import {
  findActiveLine,
  formatDuration,
  type MusicTrack,
} from "@/lib/music-fixtures";

type RightView = "lyrics" | "playlist";

const VIEWS = [
  { key: "lyrics", label: "歌词" },
  { key: "playlist", label: "歌单" },
] as const;

/** 与归档标签栏同一套选中配方：淡紫底 + 亮紫文字 + 微光环 */
const SELECTED_PILL =
  "bg-neon-500/20 text-neon-500 ring-1 ring-neon-500/35 shadow-[0_0_16px_-4px_var(--color-neon-500)]";

/**
 * 焦点透镜档位：按与当前行的距离决定字号和上下留白。
 * 当前行 19px，相邻行 17px，再远一行 16px，其余回到 15px。
 */
const LYRIC_STEPS = [
  { fontSize: 19, paddingY: 18 },
  { fontSize: 17, paddingY: 15 },
  { fontSize: 16, paddingY: 13 },
] as const;

const BASE_LYRIC_STEP = { fontSize: 15, paddingY: 12 };

/** 基准歌词行的半高：首尾留白扣掉它，让行中心而不是行顶对齐容器中心 */
const HALF_LINE_HEIGHT = 24;

function getLyricStep(distance: number) {
  return LYRIC_STEPS[distance] ?? BASE_LYRIC_STEP;
}

interface MusicRightPanelProps {
  tracks: MusicTrack[];
  currentIndex: number;
  playing: boolean;
  elapsed: number;
  onSelectTrack: (index: number) => void;
  onSeek: (seconds: number) => void;
}

/**
 * 右侧盒（桌面端 687×637）：歌词 / 歌单，用胶囊按钮切换。
 *
 * 顶部是居中的分段胶囊；切到歌单后，胶囊下方出现
 * 胶囊搜索框，固定不随列表滚动。下方内容区独立滚动，
 * 盒子高度锁死时不会把页面撑高。歌词居中并按进度高亮当前行，
 * 同时按与当前行的距离做焦点透镜（字号和上下留白分档变大），
 * 每次换行把当前行平滑滚到中心，列表首尾另有半屏留白，
 * 所以首行和末行也能真正居中；点任意一行或任意曲目都能直接跳转；
 * 歌单每行左侧是封面缩略图。
 */
export function MusicRightPanel({
  tracks,
  currentIndex,
  playing,
  elapsed,
  onSelectTrack,
  onSeek,
}: MusicRightPanelProps) {
  const [view, setView] = useState<RightView>("lyrics");
  const [query, setQuery] = useState("");
  const track = tracks[currentIndex];
  const activeLine = findActiveLine(track.lyrics, elapsed);

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLButtonElement>(null);
  const lastTrackIdRef = useRef(track.id);

  /**
   * 首尾留白 + 当前行居中。
   *
   * 列表上下各垫「半个容器高度减半行高」的空白，第一行和最后一行
   * 才有可滚动的余量落到正中心。留白写进容器上的 --lyric-pad，
   * 由歌词列表消费；ResizeObserver 跟随容器高度（歌词/歌单切换、
   * 窗口缩放），尺寸一变就重算留白并重新居中。切换曲目时直接跳到
   * 目标位置，避免上一首的滚动位置残留。
   */
  useEffect(() => {
    if (view !== "lyrics") return;
    const container = scrollRef.current;
    if (!container) return;

    const trackChanged = lastTrackIdRef.current !== track.id;
    lastTrackIdRef.current = track.id;

    const update = () => {
      const pad = Math.max(0, container.clientHeight / 2 - HALF_LINE_HEIGHT);
      container.style.setProperty("--lyric-pad", `${pad}px`);

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const behavior = trackChanged || reduceMotion ? "auto" : "smooth";
      const line = activeLineRef.current;
      if (!line) {
        // 前奏还没到第一行：回到列表顶部，靠首端留白把首行放在中间
        container.scrollTo({ top: 0, behavior });
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const lineRect = line.getBoundingClientRect();
      const offset =
        lineRect.top -
        containerRect.top -
        (containerRect.height - lineRect.height) / 2;

      container.scrollTo({ top: container.scrollTop + offset, behavior });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [view, activeLine, track.id]);

  const keyword = query.trim().toLowerCase();
  const visibleTracks = tracks
    .map((item, index) => ({ track: item, index }))
    .filter(
      ({ track: item }) =>
        item.title.toLowerCase().includes(keyword) ||
        item.artist.toLowerCase().includes(keyword),
    );

  return (
    <GlassCard
      padding="none"
      className="flex h-[520px] w-full flex-col overflow-hidden font-yahei xl:h-[637px]"
    >
      {/* 顶部：胶囊切换 */}
      <div className="flex shrink-0 items-center justify-center px-6 pt-6 pb-4">
        <div
          role="group"
          aria-label="歌词与歌单切换"
          className="glass-panel-subtle flex h-11 items-center gap-1 rounded-full p-1"
        >
          {VIEWS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={view === item.key}
              onClick={() => setView(item.key)}
              className={cn(
                "flex h-full w-20 items-center justify-center rounded-full text-[13px] transition-colors duration-300",
                view === item.key
                  ? SELECTED_PILL
                  : "text-white/50 hover:text-white/80",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

      </div>

      {/* 搜索：只在歌单视图顶部出现，固定在列表上方 */}
      {view === "playlist" && (
        <div className="shrink-0 px-6 pb-3">
          <label className="glass-panel-subtle flex h-10 items-center gap-2 rounded-full px-4">
            <Icon name="search" size={14} className="shrink-0 text-white/35" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索歌名或歌手"
              aria-label="搜索音乐"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-white placeholder:text-white/30 focus:outline-none"
            />
          </label>
        </div>
      )}

      {/* 内容区：独立滚动 */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-14 pb-6">
        {view === "lyrics" ? (
          <ul
            className="flex flex-col gap-1"
            style={{
              paddingTop: "var(--lyric-pad, 0px)",
              paddingBottom: "var(--lyric-pad, 0px)",
            }}
          >
            {track.lyrics.map((line, index) => {
              const active = index === activeLine;
              const step = getLyricStep(Math.abs(index - activeLine));
              return (
                <li key={`${line.time}-${index}`}>
                  <button
                    type="button"
                    ref={active ? activeLineRef : undefined}
                    onClick={() => onSeek(line.time)}
                    style={{
                      fontSize: `${step.fontSize}px`,
                      paddingTop: `${step.paddingY}px`,
                      paddingBottom: `${step.paddingY}px`,
                    }}
                    className={cn(
                      "w-full rounded-lg px-3 text-center leading-relaxed transition-all duration-500 ease-out",
                      active
                        ? "bg-neon-500/15 font-medium text-brand-200 ring-1 ring-neon-500/25 shadow-[0_0_24px_-14px_var(--color-neon-500)]"
                        : "text-brand-300/55 hover:bg-white/5 hover:text-brand-200/80",
                    )}
                  >
                    {line.text}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : visibleTracks.length > 0 ? (
          <ol className="flex flex-col py-1">
            {visibleTracks.map(({ track: item, index }) => {
              const active = index === currentIndex;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelectTrack(index)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-300",
                      active
                        ? "bg-white/8 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white/85",
                    )}
                  >
                    {/* 封面缩略图：使用曲目 cover 的 CSS 背景（渐变或图片） */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-10 shrink-0 rounded-lg border shadow-[inset_0_1px_0_0_rgb(255_255_255/0.2)]",
                        active ? "border-neon-500/50" : "border-white/10",
                      )}
                      style={{ background: item.cover }}
                    />

                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {item.title}
                      </span>
                      <span className="truncate text-xs text-white/35">
                        {item.artist}
                      </span>
                    </span>

                    {active && playing ? (
                      <span className="shrink-0 text-[11px] text-neon-500">
                        播放中
                      </span>
                    ) : (
                      <span className="shrink-0 text-[11px] tabular-nums text-white/30">
                        {formatDuration(item.duration)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="py-16 text-center text-xs text-white/35">
            没有找到相关歌曲
          </p>
        )}
      </div>
    </GlassCard>
  );
}
