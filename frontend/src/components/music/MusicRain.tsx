"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { RainCanvas } from "@/components/music/RainCanvas";

interface MusicRainProps {
  playing: boolean;
  elapsed: number;
  duration: number;
}

/** 开始播放时整层淡入的时长 */
const PLAY_FADE_SECONDS = 1.2;
/** 暂停时整层淡出的时长；Canvas 也会继续画这么久再停 */
const PAUSE_FADE_SECONDS = 2.5;

/** 雨势：开场留一点小雨，随播放进度线性涨到满 */
function getRainLevel(elapsed: number, duration: number) {
  const progress = Math.min(1, Math.max(0, elapsed / duration));
  return 0.15 + 0.85 * progress;
}

// 水合前服务端和客户端都读 false，水合后再读客户端快照 true。
// 传稳定的模块级函数，避免 useSyncExternalStore 反复订阅。
function subscribeMounted(): () => void {
  return () => {};
}

function getMountedSnapshot() {
  return true;
}

function getServerMountedSnapshot() {
  return false;
}

/**
 * 播放时落下淡白雨滴，雨势随播放进度由小变大；暂停后整层淡出。
 *
 * 雨滴由 RainCanvas 逐帧绘制：每颗雨滴的长度、粗细、速度、亮度都
 * 单独随机；播放进度越高，越过出现门槛的雨滴越多，雨势由疏到密。
 * 较近的雨滴落到视口底部时会溅起水花，雨势越密水花越多。
 *
 * 雨幕必须挂到 body：MusicStage 的 section 用 translateX(-50%)
 * 横向居中，而 transform 祖先会把 position: fixed 的包含块改成自身，
 * 雨幕就只会盖住 1200px 面板，而不是整个视口。等服务端渲染结束后
 * 再 portal，浏览器里才有 document.body。
 */
export function MusicRain({ playing, elapsed, duration }: MusicRainProps) {
  const mounted = useSyncExternalStore(
    subscribeMounted,
    getMountedSnapshot,
    getServerMountedSnapshot,
  );
  const level = getRainLevel(elapsed, duration);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-hidden="true"
      className="music-rain pointer-events-none fixed inset-0 z-[-6] overflow-hidden"
      style={{
        opacity: playing ? 1 : 0,
        // 暂停多留一点时间让雨慢慢收住，重新播放时快速回来
        transition: `opacity ${playing ? PLAY_FADE_SECONDS : PAUSE_FADE_SECONDS}s ease`,
        mixBlendMode: "screen",
      }}
    >
      {/* 底部白雾：雨落到底部的一点积光，垫在雨滴后面 */}
      <div
        className="absolute inset-x-0 bottom-0 h-[42%]"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 100%, rgb(238 244 255 / 0.24), rgb(238 244 255 / 0.06) 48%, transparent 78%)",
          opacity: 0.18 + level * 0.5,
          // 比雨滴退场（约 5s）略短，底部雾光慢慢收住，不先一步消失
          transition: "opacity 3s ease",
        }}
      />

      <RainCanvas
        playing={playing}
        level={level}
        pauseFadeMs={PAUSE_FADE_SECONDS * 1000}
      />
    </div>,
    document.body,
  );
}
