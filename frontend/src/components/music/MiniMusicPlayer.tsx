"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent } from "react";

import { useMusic } from "@/components/music/MusicProvider";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/format";
import { findActiveLine } from "@/lib/music-fixtures";

/** 胶囊盒子的设计尺寸 */
const BOX_WIDTH = 274;
const BOX_HEIGHT = 58;
/** 默认距视口右下角的距离 */
const EDGE_GAP = 24;
/** 拖动后的位置存在这里，刷新页面也能恢复 */
const POSITION_KEY = "music-box-position";

interface BoxPosition {
  x: number;
  y: number;
}

/** 把盒子钉在视口坐标，并解除默认的右下角锚定 */
function applyPosition(box: HTMLDivElement, position: BoxPosition) {
  box.style.left = `${position.x}px`;
  box.style.top = `${position.y}px`;
  box.style.right = "auto";
  box.style.bottom = "auto";
}

/** 把位置限制在视口内，窗口缩小后不会把盒子留在屏幕外 */
function clampPosition(x: number, y: number): BoxPosition {
  return {
    x: Math.min(Math.max(0, x), Math.max(0, window.innerWidth - BOX_WIDTH)),
    y: Math.min(Math.max(0, y), Math.max(0, window.innerHeight - BOX_HEIGHT)),
  };
}

function readStoredPosition(): BoxPosition | null {
  const raw = window.localStorage.getItem(POSITION_KEY);
  if (!raw) return null;
  const stored = JSON.parse(raw) as BoxPosition;
  return clampPosition(stored.x, stored.y);
}

/**
 * 全站迷你音乐盒（274×58 胶囊）。
 *
 * 左侧是当前曲目的圆形唱片封面、歌名和当前歌词行；
 * 右侧 60×32 控制面板只有播放/暂停和下一首。
 * 盒子默认贴在视口右下角，可按住左半区拖动；拖动结果写入
 * localStorage，站内切页和刷新后都停在原位。
 *
 * 播放状态来自 MusicProvider，和音乐页大播放器共用同一个音频源，
 * 所以在任何页面暂停、切歌，音乐页都会同步。
 */
export function MiniMusicPlayer() {
  const pathname = usePathname();
  const { track, playing, elapsed, togglePlay, goNext } = useMusic();
  const boxRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<BoxPosition | null>(null);
  const [ready, setReady] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const activeLine = findActiveLine(track.lyrics, elapsed);
  // 还没到第一句时也用第一句占位，避免显示乐队名
  const lyric =
    activeLine >= 0
      ? track.lyrics[activeLine].text
      : (track.lyrics[0]?.text ?? track.artist);

  // 首次定位完成前、以及身处首页时都保持隐藏
  const inactive = pathname === "/" || !ready;

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const saved = readStoredPosition();
    if (saved) {
      positionRef.current = saved;
      applyPosition(box, saved);
    }
    // 定位完成后再显形，避免恢复位置时先闪一下右下角
    const frame = window.requestAnimationFrame(() => setReady(true));

    const handleResize = () => {
      const position = positionRef.current;
      if (!position) return;
      const clamped = clampPosition(position.x, position.y);
      positionRef.current = clamped;
      applyPosition(box, clamped);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // 按钮区域只响应点击，不触发拖动
    if ((event.target as HTMLElement).closest("button")) return;

    const box = event.currentTarget;
    const rect = box.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    box.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const position = clampPosition(
      event.clientX - drag.offsetX,
      event.clientY - drag.offsetY,
    );
    positionRef.current = position;
    applyPosition(event.currentTarget, position);
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    const position = positionRef.current;
    if (position) {
      window.localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    }
  };

  return (
    <div
      ref={boxRef}
      role="group"
      aria-label="迷你音乐播放器"
      className={cn(
        "mini-player-shell fixed z-[55] flex h-[58px] w-[274px] cursor-grab touch-none items-center gap-2 rounded-full border border-white/10 bg-[#0a1424] pr-2 pl-2 shadow-[0_16px_40px_-18px_rgb(0_0_0/0.95)] transition-[opacity,filter,transform] ease-out select-none active:cursor-grabbing",
        // 进入首页：600ms 模糊溶解；离开首页：350ms 淡入
        inactive
          ? "pointer-events-none scale-[0.96] opacity-0 blur-[6px] duration-[600ms]"
          : "scale-100 opacity-100 blur-[0px] duration-[350ms]",
      )}
      inert={inactive}
      aria-hidden={inactive}
      style={{ right: EDGE_GAP, bottom: EDGE_GAP }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      {/* 圆形唱片封面，中间留一个小孔，和音乐页的黑胶盘呼应 */}
      <span
        aria-hidden="true"
        className="relative size-[42px] shrink-0 rounded-full border border-white/15 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.25)]"
        style={{ background: track.cover }}
      >
        <span className="absolute top-1/2 left-1/2 size-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0a1424] ring-1 ring-white/30" />
      </span>

      {/* 歌名在上、当前歌词在下 */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 font-yahei">
        <p className="truncate text-[12px] leading-none font-medium text-white">
          {track.title}
        </p>
        <p className="truncate text-[10px] leading-none text-white/45">
          {lyric}
        </p>
      </div>

      {/* 60×32 控制面板：32px 播放/暂停 + 20px 下一首，间距 8px */}
      <div className="flex h-8 w-[60px] shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "暂停" : "播放"}
          title={playing ? "暂停" : "播放"}
          className="keep-light grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-[#5D00FF] text-white transition-colors duration-200 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
        >
          <Icon name={playing ? "pause" : "play"} size={14} />
        </button>

        <button
          type="button"
          onClick={goNext}
          aria-label="下一首"
          title="下一首"
          className="grid size-5 shrink-0 cursor-pointer place-items-center rounded-full text-white/55 transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
        >
          <Icon name="next" size={12} />
        </button>
      </div>
    </div>
  );
}
