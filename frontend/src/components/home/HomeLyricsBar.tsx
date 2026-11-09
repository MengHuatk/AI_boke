"use client";

import { useRef, useState, type PointerEvent } from "react";

import { LyricViewport } from "@/components/music/LyricViewport";
import { useMusic } from "@/components/music/MusicProvider";

/** 悬停视差的最大位移：横向 ±5px、纵向 ±3px */
const PARALLAX_X = 10;
const PARALLAX_Y = 6;

/**
 * 首页大字歌词盒（桌面端 1068×80）。
 *
 * 位于简介卡与音乐卡下方，只负责显示歌词：深黑圆角底 + 封面颜色
 * 极淡铺底，播放时边缘有一圈缓慢呼吸的微光，暂停即静止。
 * 封面以 40 秒一轮的不等距路点缓慢游走，鼠标悬停时再随指针做几像素
 * 的视差；切歌时底层保持上一张封面，新封面从模糊中淡入，同时底部
 * 扫过一道细光。歌词的打字 / 停留 / 退格、光标、长句滚动与两端渐隐
 * 全部复用 LyricViewport；还没到第一句时显示第一句，不显示乐队名。
 */
export function HomeLyricsBar() {
  const { track, playing, elapsed } = useMusic();
  const parallaxRef = useRef<HTMLDivElement>(null);

  // 记下上一张封面：切歌时底层换成上一张，新封面在顶层淡入。
  // 用渲染期派生状态（受 track.id 守卫），避免 effect 里同步 setState。
  const [cover, setCover] = useState({
    trackId: track.id,
    previous: track.cover,
    current: track.cover,
    version: 0,
  });
  if (cover.trackId !== track.id) {
    setCover({
      trackId: track.id,
      previous: cover.current,
      current: track.cover,
      version: cover.version + 1,
    });
  }

  /** 悬停视差：背景最多朝指针方向偏移 5×3px，离开后缓慢归位 */
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const layer = parallaxRef.current;
    if (!layer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    layer.style.transform = `translate3d(${x * PARALLAX_X}px, ${y * PARALLAX_Y}px, 0)`;
  };

  const handlePointerLeave = () => {
    const layer = parallaxRef.current;
    if (layer) layer.style.transform = "translate3d(0, 0, 0)";
  };

  return (
    <div className="relative w-full xl:max-w-[1068px]">
      {/* 播放时的边缘呼吸光；暂停冻在当前帧 */}
      <div
        aria-hidden="true"
        className="home-lyrics-glow pointer-events-none absolute -inset-px rounded-glass opacity-30"
        style={{
          boxShadow: "0 0 44px -14px rgba(144,110,255,0.55)",
          animationPlayState: playing ? "running" : "paused",
        }}
      />

      <div
        role="group"
        aria-label="当前歌词"
        className="home-lyrics-bar relative flex h-20 w-full overflow-hidden rounded-glass border border-white/8 bg-[#0a1424]/95"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {/* 封面底色：底层始终铺上一张封面，切歌时顶层从模糊中淡入当前封面。
            和 BackgroundCarousel 同一套做法——底层满幅、顶层淡入，
            合成结果全程线性，中途不会发暗，也不依赖 animationend。 */}
        <div
          aria-hidden="true"
          className="home-cover-drift pointer-events-none absolute inset-0"
          style={{
            opacity: 0.24,
            filter: "blur(7px)",
            animationPlayState: playing ? "running" : "paused",
          }}
        >
          <div
            ref={parallaxRef}
            className="absolute inset-0 transition-transform duration-300 ease-out"
          >
            <div
              className="absolute inset-0"
              style={{ background: cover.previous }}
            />
            {cover.version > 0 && (
              <div
                key={cover.version}
                className="absolute inset-0"
                style={{
                  background: cover.current,
                  animation: "home-cover-in 900ms ease-in-out both",
                }}
              />
            )}
          </div>
        </div>

        {/* 切歌时的底部横光，只在真正切歌后出现 */}
        {cover.version > 0 && (
          <span
            key={`sweep-${cover.version}`}
            aria-hidden="true"
            className="home-cover-sweep pointer-events-none absolute bottom-0 left-0 h-0.5 w-1/2 bg-gradient-to-r from-transparent via-neon-500/70 to-transparent shadow-[0_0_12px_rgba(144,110,255,0.55)]"
          />
        )}

        <LyricViewport
          track={track}
          playing={playing}
          elapsed={elapsed}
          className="relative h-full w-full px-10"
          textClassName="home-lyric-glow text-[24px]"
          caretClassName="h-[22px] w-[2px] translate-y-[2px] shadow-[0_0_10px_rgba(144,110,255,0.65)]"
        />
      </div>
    </div>
  );
}
