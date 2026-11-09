"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { RainCanvas } from "@/components/music/RainCanvas";
import { useMusic } from "@/components/music/MusicProvider";
import { useRainSettings } from "@/components/music/RainSettingsProvider";
import { useTheme } from "@/components/layout/useTheme";

/** 开启雨幕时整层淡入的时长 */
const ON_FADE_SECONDS = 2;
/** 关闭雨幕时整层淡出的时长；Canvas 也会继续画这么久再停 */
const OFF_FADE_SECONDS = 3;
/** 关闭「仅播放时下雨」后，暂停时保留的基础雨势 */
const PAUSED_LEVEL = 0.65;

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
 * 全站雨幕。默认「仅播放时下雨」：播放时雨势随进度由小变大，
 * 暂停后整层淡出；用户在左下角取消该选项后改为常开，暂停时停在基础雨势。
 * 「雨量跟随进度」关闭后雨量不再随播放变化，固定为满雨势。
 * 总开关负责彻底关闭雨幕。
 *
 * 由根布局挂载在 MusicProvider 内，所以站内切页不会中断下雨，
 * 全站所有页面共用同一份雨幕设置和播放进度。
 *
 * 雨滴由 RainCanvas 逐帧绘制：每颗雨滴的长度、粗细、速度、亮度都
 * 单独随机；播放进度越高，越过出现门槛的雨滴越多，雨势由疏到密。
 * 雨量密度会再抬高一次门槛，因此「小 / 中 / 大」三档和滑杆都能
 * 只改变可见雨滴比例，不需要重建整批雨滴。
 * 较近的雨滴落到视口底部时会溅起水花，雨势越密水花越多；
 * 水花和低画质模式都可以在左下角面板里单独关闭。
 *
 * 雨幕必须挂到 body：MusicStage 的 section 用 translateX(-50%)
 * 横向居中，而 transform 祖先会把 position: fixed 的包含块改成自身，
 * 雨幕就只会盖住 1200px 面板，而不是整个视口。等服务端渲染结束后
 * 再 portal，浏览器里才有 document.body。
 */
export function MusicRain() {
  const { playing, elapsed, duration } = useMusic();
  const { settings } = useRainSettings();
  const theme = useTheme();
  const mounted = useSyncExternalStore(
    subscribeMounted,
    getMountedSnapshot,
    getServerMountedSnapshot,
  );
  // 只跟随音乐时，暂停就没有雨；取消该选项后雨幕常开
  const rainOn =
    settings.enabled &&
    settings.density > 0 &&
    (!settings.followMusic || playing);
  // 雨量跟随进度：开启时雨势随播放由小变大（原有曲线），
  // 关闭后固定满雨势，实际多少只由雨量滑杆决定
  const level = !settings.followProgress
    ? 1
    : !playing && !settings.followMusic
      ? PAUSED_LEVEL
      : getRainLevel(elapsed, duration);
  // 低画质在密度基础上再减三成雨滴；0.02 避免滑杆归零时除以零
  const density = Math.max(
    0.02,
    (settings.density / 100) * (settings.lowQuality ? 0.7 : 1),
  );

  if (!mounted) return null;

  return createPortal(
    <div
      aria-hidden="true"
      className="music-rain pointer-events-none fixed inset-0 z-[-6] overflow-hidden"
      style={{
        opacity: rainOn ? 1 : 0,
        // 关闭时多留一点时间让雨慢慢收住，重新打开时快速回来
        transition: `opacity ${rainOn ? ON_FADE_SECONDS : OFF_FADE_SECONDS}s ease`,
        // 亮底上用 screen 会叠成白色，日间改成正常覆盖
        mixBlendMode: theme === "day" ? "normal" : "screen",
      }}
    >
      {/* 底部白雾：雨落到底部的一点积光，垫在雨滴后面；日间换成淡蓝雾 */}
      <div
        className="absolute inset-x-0 bottom-0 h-[42%]"
        style={{
          background:
            theme === "day"
              ? "radial-gradient(ellipse 80% 100% at 50% 100%, rgb(147 197 253 / 0.3), rgb(191 219 254 / 0.08) 48%, transparent 78%)"
              : "radial-gradient(ellipse 80% 100% at 50% 100%, rgb(238 244 255 / 0.24), rgb(238 244 255 / 0.06) 48%, transparent 78%)",
          // 雾光也随雨量缩放，小雨时底部不会先亮起来
          opacity: (0.18 + level * 0.5) * density,
          // 比雨滴退场（约 5s）略短，底部雾光慢慢收住，不先一步消失
          transition: "opacity 3s ease",
        }}
      />

      <RainCanvas
        active={rainOn}
        level={level}
        density={density}
        splashEnabled={settings.splashes}
        lowQuality={settings.lowQuality}
        fadeOutMs={OFF_FADE_SECONDS * 1000}
        theme={theme}
      />
    </div>,
    document.body,
  );
}
