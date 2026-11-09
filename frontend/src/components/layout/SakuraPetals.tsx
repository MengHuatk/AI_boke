"use client";

/**
 * 全站樱花花瓣层（仅电脑端、仅日间主题）。
 *
 * 由根布局挂在 MusicProvider 内，和音乐雨共用同一份播放状态；切页不会卸载，
 * 所以日间主题下全站都会飘花瓣。花瓣画在内容之下、装饰层之上（z-index -2）：
 * 毛玻璃卡片会把背后的花瓣模糊成柔光，不会盖住文字。
 *
 * 花瓣由 Canvas 逐帧绘制，而不是 DOM：
 *   - 风向直接复用音乐雨的 getWind(now)，两边处在同一条时间线上；
 *     没有音乐雨时改用一个固定风向，切换时做短暂平滑，不会突然折向；
 *   - 每片花瓣有独立的尺寸、速度、旋转、自旋、摆动相位和透明度，
 *     按近 / 中 / 远三档景深分层，远处更小更淡更慢；
 *   - 飘出视口后立即从数组里移除，隔一小段随机时间再从顶部补一片，
 *     同屏数量恒定，天然满足「清除后重新生成」；
 *   - 切到夜间时停止补种，整层在 1.8 秒内淡到透明后再停掉 rAF。
 *
 * 和 RainCanvas 一样，外层容器用 hidden lg:block 限电脑端；Canvas 循环
 * 还会检查自己的 clientWidth，移动端不会空转。减少动态效果时整层不渲染。
 */

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { useTheme, type Theme } from "@/components/layout/useTheme";
import { useMusic } from "@/components/music/MusicProvider";
import { getWind } from "@/components/music/wind";

/** 未播放音乐时的同屏花瓣数 */
const BASE_COUNT = 14;
/** 音乐播放时略增；暂停后随着花瓣自然落出视口回落到基础数量 */
const PLAYING_COUNT = 17;
/** 没有音乐雨可跟随时固定向右下的风向 */
const FIXED_WIND = 0.45;
/** 横向位移相对下落速度的斜率；花瓣比雨滴轻，风感略强 */
const PETAL_WIND_SLOPE = 0.3;
/** 切夜时整层淡出的时长（秒） */
const NIGHT_FADE_SECONDS = 1.8;

type Depth = "near" | "mid" | "far";

interface DepthSpec {
  sizeMin: number;
  sizeMax: number;
  speedMin: number;
  speedMax: number;
  alphaMin: number;
  alphaMax: number;
}

/** 近大远小：尺寸、下落速度、不透明度都按景深分档 */
const DEPTHS: Record<Depth, DepthSpec> = {
  near: {
    sizeMin: 20,
    sizeMax: 28,
    speedMin: 72,
    speedMax: 102,
    alphaMin: 0.78,
    alphaMax: 0.96,
  },
  mid: {
    sizeMin: 13,
    sizeMax: 19,
    speedMin: 52,
    speedMax: 80,
    alphaMin: 0.55,
    alphaMax: 0.78,
  },
  far: {
    sizeMin: 8,
    sizeMax: 12,
    speedMin: 34,
    speedMax: 58,
    alphaMin: 0.32,
    alphaMax: 0.55,
  },
};

interface Petal {
  /** 视口内横向位置，CSS 像素 */
  x: number;
  /** 视口内纵向位置，CSS 像素 */
  y: number;
  /** 花瓣直径，CSS 像素 */
  size: number;
  /** 下落速度，CSS 像素/秒 */
  speed: number;
  /** 当前旋转角，弧度 */
  rotation: number;
  /** 自旋角速度，弧度/秒；正负随机，旋转方向不一致 */
  spin: number;
  /** 摆动相位 */
  swayPhase: number;
  /** 摆动角速度，弧度/秒 */
  swaySpeed: number;
  /** 摆动横向振幅，CSS 像素/秒 */
  swayAmp: number;
  /** 基础不透明度 */
  alpha: number;
  /** 景深档位，决定精灵与尺寸范围 */
  depth: Depth;
}

const SPRITE_SIZE = 96;

interface PetalColors {
  /** 花瓣顶端 */
  top: string;
  /** 花瓣底部 */
  bottom: string;
}

const PETAL_COLORS: Record<Depth, PetalColors> = {
  near: {
    top: "rgba(255, 228, 238, 0.98)",
    bottom: "rgba(242, 158, 188, 0.92)",
  },
  mid: {
    top: "rgba(255, 236, 243, 0.92)",
    bottom: "rgba(246, 174, 198, 0.86)",
  },
  far: {
    top: "rgba(255, 243, 247, 0.75)",
    bottom: "rgba(250, 196, 213, 0.66)",
  },
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** 按比例抽景深：近景最少，中景最多，远景次之 */
function pickDepth(): Depth {
  const roll = Math.random();
  if (roll < 0.25) return "near";
  if (roll < 0.7) return "mid";
  return "far";
}

/** 极简椭圆花瓣：顶端圆钝、底部收窄成尖，左右曲率略不对称 */
function tracePetal(ctx: CanvasRenderingContext2D, radius: number) {
  ctx.beginPath();
  ctx.moveTo(-radius * 0.5, -radius * 0.7);
  // 顶端圆弧：略微偏右，避免完全对称
  ctx.bezierCurveTo(
    -radius * 0.22,
    -radius * 1.02,
    radius * 0.32,
    -radius,
    radius * 0.58,
    -radius * 0.64,
  );
  // 右侧向底部收尖
  ctx.bezierCurveTo(
    radius * 0.94,
    -radius * 0.16,
    radius * 0.48,
    radius * 0.62,
    0,
    radius,
  );
  // 左侧回到顶端，曲率比右侧略缓
  ctx.bezierCurveTo(
    -radius * 0.46,
    radius * 0.58,
    -radius * 0.88,
    -radius * 0.18,
    -radius * 0.5,
    -radius * 0.7,
  );
  ctx.closePath();
}

/**
 * 预渲染一片极简椭圆花瓣。
 *
 * 一条闭合贝塞尔曲线：顶端圆钝、底部收窄成尖，左右曲率略不对称；
 * 没有缺口、描边和高光点，只铺一层浅粉到中粉的线性渐变。
 * 近景清晰，中景和远景保留轻微虚化，小尺寸下也不会出现细节噪点。
 * 所有花瓣共用同一档精灵，绘制时按实际尺寸缩放，每帧只需一次 drawImage。
 */
function createPetalSprite(depth: Depth) {
  const sprite = document.createElement("canvas");
  sprite.width = SPRITE_SIZE;
  sprite.height = SPRITE_SIZE;

  const ctx = sprite.getContext("2d");
  if (!ctx) return null;

  const center = SPRITE_SIZE / 2;
  const radius = SPRITE_SIZE * 0.4;
  const colors = PETAL_COLORS[depth];
  const baseBlur = depth === "far" ? 1.4 : depth === "mid" ? 0.6 : 0;

  ctx.translate(center, center);
  if (baseBlur > 0) ctx.filter = `blur(${baseBlur}px)`;

  const gradient = ctx.createLinearGradient(0, -radius, 0, radius);
  gradient.addColorStop(0, colors.top);
  gradient.addColorStop(1, colors.bottom);

  tracePetal(ctx, radius);
  ctx.fillStyle = gradient;
  ctx.fill();

  return sprite;
}

/** 从视口顶部上方生成一片花瓣；x 允许略微超出左右边缘 */
function createPetal(width: number, height: number): Petal {
  const depth = pickDepth();
  const spec = DEPTHS[depth];
  const size = randomBetween(spec.sizeMin, spec.sizeMax);
  // 缓缓旋转：每片都转，但方向和角速度不同；去掉翻折后只保留这一层旋转
  const spin = randomBetween(0.25, 0.65) * (Math.random() < 0.5 ? -1 : 1);

  return {
    x: randomBetween(-size, width + size),
    // 出生在视口上方一点，落进来时不会凭空出现
    y: -size - randomBetween(0, height * 0.2),
    size,
    speed: randomBetween(spec.speedMin, spec.speedMax),
    rotation: randomBetween(0, Math.PI * 2),
    spin,
    swayPhase: randomBetween(0, Math.PI * 2),
    swaySpeed: randomBetween(0.7, 1.7),
    swayAmp: randomBetween(4, 16),
    alpha: randomBetween(spec.alphaMin, spec.alphaMax),
    depth,
  };
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

interface SakuraCanvasProps {
  playing: boolean;
  theme: Theme;
}

function SakuraCanvas({ playing, theme }: SakuraCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playingRef = useRef(playing);
  const themeRef = useRef(theme);
  const startRef = useRef<() => void>(() => {});

  // 切回日间时重新启动循环；切夜不在这里停，留给主循环淡完自己收手
  useEffect(() => {
    themeRef.current = theme;
    if (theme === "day") startRef.current();
  }, [theme]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 系统要求减少动态效果时，整层不绘制，也不启动 rAF
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sprites: Record<Depth, HTMLCanvasElement | null> = {
      near: createPetalSprite("near"),
      mid: createPetalSprite("mid"),
      far: createPetalSprite("far"),
    };

    let width = 0;
    let height = 0;
    let last = 0;
    let raf = 0;
    let running = false;
    let fade = themeRef.current === "day" ? 1 : 0;
    let smoothedWind = FIXED_WIND;
    let nextSpawnAt = 0;
    const petals: Petal[] = [];

    function stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    }

    function start() {
      if (running || width === 0 || height === 0) return;
      running = true;
      last = performance.now();
      // 从夜间淡出停手后重新开始，先隔一小段时间再补第一片
      if (petals.length === 0) {
        nextSpawnAt = last + randomBetween(0.3, 0.8);
      }
      raf = requestAnimationFrame(frame);
    }

    function frame(now: number) {
      if (!running) return;

      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;

      // 日间淡入、夜间淡出，线性走完 NIGHT_FADE_SECONDS
      const targetFade = themeRef.current === "day" ? 1 : 0;
      if (fade < targetFade) {
        fade = Math.min(targetFade, fade + dt / NIGHT_FADE_SECONDS);
      } else if (fade > targetFade) {
        fade = Math.max(targetFade, fade - dt / NIGHT_FADE_SECONDS);
      }

      // 夜间已完全淡出：清空画布和花瓣，停掉循环
      if (themeRef.current === "night" && fade <= 0.01) {
        ctx.clearRect(0, 0, width, height);
        petals.length = 0;
        stop();
        return;
      }

      // 音乐雨播放时跟随共享风场；暂停时用固定风向，切换做短暂平滑
      const targetWind = playingRef.current ? getWind(now) : FIXED_WIND;
      smoothedWind += (targetWind - smoothedWind) * Math.min(1, dt * 1.4);

      // 夜间只让已在场上的花瓣淡出，不再补种；播放时目标数量略增
      const targetCount = playingRef.current ? PLAYING_COUNT : BASE_COUNT;
      if (
        themeRef.current === "day" &&
        petals.length < targetCount &&
        now >= nextSpawnAt
      ) {
        petals.push(createPetal(width, height));
        nextSpawnAt = now + randomBetween(0.35, 0.8);
      }

      ctx.clearRect(0, 0, width, height);

      const slope = smoothedWind * PETAL_WIND_SLOPE;

      for (let index = petals.length - 1; index >= 0; index -= 1) {
        const petal = petals[index];

        petal.y += petal.speed * dt;
        petal.swayPhase += petal.swaySpeed * dt;
        petal.x +=
          (slope * petal.speed + Math.cos(petal.swayPhase) * petal.swayAmp) *
          dt;
        petal.rotation += petal.spin * dt;

        // 飘出视口：立即移除，稍后从顶部补一片，维持同屏数量
        if (
          petal.y - petal.size > height ||
          petal.x < -petal.size * 2 ||
          petal.x > width + petal.size * 2
        ) {
          petals.splice(index, 1);
          nextSpawnAt = now + randomBetween(0.3, 0.9);
          continue;
        }

        const sprite = sprites[petal.depth];
        if (!sprite) continue;

        ctx.save();
        ctx.translate(petal.x, petal.y);
        ctx.rotate(petal.rotation);
        ctx.globalAlpha = petal.alpha * fade;
        ctx.drawImage(
          sprite,
          -petal.size / 2,
          -petal.size / 2,
          petal.size,
          petal.size,
        );
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    startRef.current = start;

    function resize() {
      // 用 canvas 自己的 CSS 尺寸，和实际绘制区域严格一致
      const nextWidth = canvas.clientWidth;
      const nextHeight = canvas.clientHeight;

      // 移动端被 hidden 隐藏时宽度为 0：停掉循环，不在后台空转
      if (nextWidth === 0 || nextHeight === 0) {
        stop();
        width = 0;
        height = 0;
        petals.length = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio, 2);
      const widthChanged = nextWidth !== width;

      width = nextWidth;
      height = nextHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 宽度变化（窗口缩放/横竖屏）重新铺一次；只变高度时保留现有花瓣
      if (widthChanged) {
        petals.length = 0;
        nextSpawnAt = performance.now() + randomBetween(0.3, 0.8);
      }

      last = performance.now();

      // 夜间不启动；日间（包括从移动端拉宽到桌面端）才开始
      if (themeRef.current === "day") start();
    }

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      stop();
      // StrictMode 会先跑一遍 cleanup 再重跑 effect；把启动入口换回空函数，
      // 避免上一轮的 start 被重新调用后多开一条 requestAnimationFrame。
      startRef.current = () => {};
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 size-full" />;
}

export function SakuraPetals() {
  const { playing } = useMusic();
  const theme = useTheme();
  const mounted = useSyncExternalStore(
    subscribeMounted,
    getMountedSnapshot,
    getServerMountedSnapshot,
  );

  if (!mounted) return null;

  return createPortal(
    <div
      aria-hidden="true"
      className="sakura-petals pointer-events-none fixed inset-0 z-[-2] hidden overflow-hidden lg:block"
    >
      <SakuraCanvas playing={playing} theme={theme} />
    </div>,
    document.body,
  );
}
