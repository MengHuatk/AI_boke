"use client";

import { useEffect, useRef } from "react";

interface RainCanvasProps {
  playing: boolean;
  /** 0.15–1：由播放进度换算出的目标雨势 */
  level: number;
  /** 暂停后继续绘制多久再停掉 requestAnimationFrame */
  pauseFadeMs: number;
}

interface RainDrop {
  /** 横向位置，0–1，窗口缩放时自动跟着宽度走 */
  x: number;
  /** 雨滴头部当前位置（CSS 像素） */
  y: number;
  /** 雨丝长度 */
  length: number;
  /** 雨丝粗细 */
  width: number;
  /** 下落速度，CSS 像素/秒 */
  speed: number;
  /** 每颗雨滴额外的横向斜率，叠在全局风场上 */
  drift: number;
  /** 本颗雨滴的基础亮度 */
  alpha: number;
  /** 雨势涨到多少时开始出现，让雨由疏到密 */
  threshold: number;
  /** 头部这次下落是否已经在底部溅起过水花 */
  splashed: boolean;
}

interface RainSplash {
  /** 水花中心（视口底部） */
  x: number;
  y: number;
  /** 已经存在多久（秒） */
  age: number;
  /** 存活时长（秒） */
  life: number;
  /** 最大扩散半径 */
  radius: number;
  /** 基础亮度，随雨滴深度变化 */
  alpha: number;
}

/** 按面积决定雨滴数量，小屏不会被几百颗雨滴拖慢 */
function getDropCount(width: number, height: number) {
  return Math.round(Math.min(240, Math.max(90, (width * height) / 9000)));
}

/**
 * 大雨回落成小雨的速度（雨势/秒）。
 * 0.16 约 5.3 秒从满雨落到开场小雨：雨滴一颗颗退场，
 * 不会在切歌那一帧从暴雨直接切成稀雨。
 */
const RAIN_THIN_PER_SECOND = 0.16;

/** 风的最大斜率：约 12°，雨丝的倾斜和横向位移共用同一个斜率 */
const WIND_SLOPE = 0.22;

/** 同屏水花上限，暴雨时也不会无限堆积 */
const MAX_SPLASHES = 48;

/**
 * 雨滴精灵的尺寸：柔光与雨丝按 72:20 的宽度比烘焙到一张小图上，
 * 绘制时整体缩放。GLOW_SCALE 就是外层柔光相对于雨丝本体的宽度倍数。
 */
const SPRITE_WIDTH = 72;
const SPRITE_CORE_WIDTH = 20;
const SPRITE_HEIGHT = 128;
const GLOW_SCALE = SPRITE_WIDTH / SPRITE_CORE_WIDTH;

/**
 * 全局风场：一条约 20 秒的大风向 + 一条约 7 秒的阵风叠加。
 * 返回值在 -0.85–0.85 之间，让整片雨慢慢左右摆动。
 */
function getWind(now: number) {
  const seconds = now / 1000;
  return (
    0.6 * Math.sin(seconds * 0.32) + 0.25 * Math.sin(seconds * 0.9 + 1.7)
  );
}

/**
 * 预渲染一颗雨滴的「外层柔光 + 雨丝主体」。
 *
 * 原先每颗雨滴都要画两条不同宽度的描边，改为整帧只需要对每颗雨滴
 * 做一次 drawImage；光晕和本体都从这张固定小图里按实际粗细缩放。
 * 两层在精灵内部同样使用 lighter 叠加，和原来主画布上的效果一致。
 */
function createRainSprite() {
  const sprite = document.createElement("canvas");
  sprite.width = SPRITE_WIDTH;
  sprite.height = SPRITE_HEIGHT;

  const spriteCtx = sprite.getContext("2d");
  if (!spriteCtx) return null;

  spriteCtx.globalCompositeOperation = "lighter";
  spriteCtx.lineCap = "butt";

  const center = SPRITE_WIDTH / 2;

  // 外层柔光：对应原先「0.45 颜色透明度 × 0.28 全局透明度」
  spriteCtx.strokeStyle = "rgba(236, 242, 255, 0.126)";
  spriteCtx.lineWidth = SPRITE_WIDTH;
  spriteCtx.beginPath();
  spriteCtx.moveTo(center, 0);
  spriteCtx.lineTo(center, SPRITE_HEIGHT);
  spriteCtx.stroke();

  // 雨丝主体：对应原先「0.85 × 0.75」
  spriteCtx.strokeStyle = "rgba(236, 242, 255, 0.6375)";
  spriteCtx.lineWidth = SPRITE_CORE_WIDTH;
  spriteCtx.beginPath();
  spriteCtx.moveTo(center, 0);
  spriteCtx.lineTo(center, SPRITE_HEIGHT);
  spriteCtx.stroke();

  return sprite;
}

/**
 * 生成一整批雨滴。
 *
 * depth 越大，雨滴越粗、越长、越快、越亮，形成近大远小的层次；
 * threshold 分散在 0–0.82，播放进度越高，能越过门槛的雨滴越多。
 * 每颗雨滴的长度、粗细、速度、亮度、附加斜率都单独随机，不会出现一批同模子。
 */
function seedDrops(drops: RainDrop[], width: number, height: number) {
  const count = getDropCount(width, height);
  drops.length = 0;

  for (let index = 0; index < count; index += 1) {
    const depth = Math.random();
    const length = 9 + depth * 44 + Math.random() * 10;

    drops.push({
      x: Math.random(),
      // 初始位置铺满整个视口，播放开始时雨已经在落
      y: Math.random() * (height + length) - length,
      length,
      width: 0.8 + depth * 1.7,
      speed: 520 + depth * 820 + Math.random() * 180,
      drift: 0.008 + depth * 0.018 + Math.random() * 0.01,
      alpha: 0.3 + depth * 0.45 + Math.random() * 0.15,
      threshold: Math.random() * 0.82,
      splashed: false,
    });
  }
}

/**
 * 雨滴头部触底时生成一个向上扩散的水花。
 * 只有较近、较粗且当前可见的雨滴才配溅水，避免小雨也铺满底部。
 */
function spawnSplash(
  splashes: RainSplash[],
  drop: RainDrop,
  width: number,
  height: number,
  reveal: number,
) {
  if (splashes.length >= MAX_SPLASHES) splashes.shift();

  splashes.push({
    x: drop.x * width,
    y: height - 4,
    age: 0,
    life: 0.32 + Math.random() * 0.2,
    radius: 3 + drop.width * 2.8,
    alpha: (0.18 + drop.alpha * 0.22) * reveal,
  });
}

/**
 * 更新并绘制底部水花：一圈从落点向上展开的椭圆弧，
 * 越接近消散越淡；水花同样走 lighter，和雨丝的发光一致。
 */
function drawSplashes(
  ctx: CanvasRenderingContext2D,
  splashes: RainSplash[],
  dt: number,
) {
  for (let index = splashes.length - 1; index >= 0; index -= 1) {
    const splash = splashes[index];
    splash.age += dt;

    if (splash.age >= splash.life) {
      splashes.splice(index, 1);
      continue;
    }

    const progress = splash.age / splash.life;
    const radius = splash.radius * (0.3 + progress * 0.9);
    const fade = 1 - progress;

    ctx.globalAlpha = splash.alpha * fade * fade;
    ctx.strokeStyle = "rgba(236, 242, 255, 0.8)";
    ctx.lineWidth = 1.2 * (0.5 + fade * 0.5);
    ctx.beginPath();
    // 只画上半圈：水花从底部向上打开，不把圆环画完整
    ctx.ellipse(
      splash.x,
      splash.y,
      radius,
      radius * 0.42,
      0,
      Math.PI,
      Math.PI * 2,
    );
    ctx.stroke();
  }
}

/**
 * 一帧：先推进每颗雨滴，再画「外层柔光 + 雨丝 + 亮头」。
 * 雨丝是一段短胶囊，而不是贯穿整个视口的长线；
 * 雨丝方向跟随当前风场倾斜，lighter 叠加让重叠处的雨滴自然变亮。
 * 柔光和雨丝合并成一张预渲染精灵，每颗雨滴只做一次 drawImage；
 * 头部触底时另起一圈短命水花，落在视口底部。
 */
function drawFrame(
  ctx: CanvasRenderingContext2D,
  drops: RainDrop[],
  splashes: RainSplash[],
  sprite: HTMLCanvasElement,
  width: number,
  height: number,
  dt: number,
  level: number,
  wind: number,
) {
  ctx.clearRect(0, 0, width, height);

  const gust = Math.abs(wind);
  // 风越大，雨落得稍快；幅度很小，只是让整片雨有呼吸感
  const fallScale = 0.9 + gust * 0.18;

  for (const drop of drops) {
    const slope = wind * WIND_SLOPE + drop.drift;
    const fallSpeed = drop.speed * fallScale;

    drop.y += fallSpeed * dt;
    drop.x += (slope * fallSpeed * dt) / width;

    if (drop.x > 1) drop.x -= 1;
    else if (drop.x < 0) drop.x += 1;

    // 雨势越高，原本被门槛挡住的雨滴逐渐淡入，形成由疏到密
    const reveal = Math.min(
      1,
      Math.max(0, (level - drop.threshold) / 0.12),
    );

    // 头部触底：较近、较粗且当前可见的雨滴才溅水，
    // 先用 splashed 记一次，避免同一颗雨滴连续几帧都触发。
    if (!drop.splashed && drop.y >= height) {
      drop.splashed = true;
      if (
        reveal > 0.25 &&
        drop.width > 1.4 &&
        Math.random() < 0.4
      ) {
        spawnSplash(splashes, drop, width, height, reveal);
      }
    }

    // 整颗雨滴都落到视口下方：从顶部换一颗新雨滴继续落
    if (drop.y - drop.length > height) {
      drop.y = -drop.length - Math.random() * height * 0.2;
      drop.x = Math.random();
      drop.splashed = false;
    }

    if (reveal <= 0) continue;

    const x = drop.x * width;
    const y = drop.y;
    const alpha = drop.alpha * reveal * (0.55 + level * 0.45);
    const angle = Math.atan(slope);
    const destWidth = drop.width * GLOW_SCALE;
    // 精灵绕头部旋转后，竖直投影要仍等于雨丝长度，所以先除以 cos
    const destHeight = drop.length / Math.cos(angle);

    // 精灵从雨滴头部向上延伸。Canvas 的 y 轴向下，正角度会把
    // 精灵顶部（尾部）转向右侧；而 slope > 0 表示雨滴向右下方移动，
    // 尾部应该在左上，所以这里的旋转方向要取反。
    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-angle);
    ctx.drawImage(
      sprite,
      -destWidth / 2,
      -destHeight,
      destWidth,
      destHeight,
    );
    ctx.restore();

    // 亮头：让每颗雨滴有清楚的落点，而不是一根均匀的线
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(242, 247, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(
      x - slope * drop.width * 0.4,
      y - drop.width * 0.4,
      drop.width * 0.9,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // 水花画在雨滴之后，落在视口底部
  drawSplashes(ctx, splashes, dt);

  ctx.globalAlpha = 1;
}

/**
 * Canvas 雨滴层。
 *
 * 每颗雨滴拥有独立的长度、粗细、下落速度、亮度和出现门槛；
 * 全局风场缓慢左右摆动，雨丝方向和横向位移一起倾斜；
 * 阵风时整片雨落得稍快，形成一点呼吸感。
 * 播放进度越高，越过门槛的雨滴越多，雨势由小雨逐渐变密。
 * 目标雨势先做一次平滑，切歌或拖动进度时不会瞬间从暴雨变成细雨。
 *
 * 外层柔光和雨丝主体预渲染成一张精灵，每颗雨滴只做一次 drawImage；
 * 较近的雨滴落到视口底部时会溅起一圈短暂的水花，雨越密水花越多。
 *
 * 暂停时 canvas 继续画满 2.5s，和 MusicRain 的 CSS 淡出同步，
 * 淡出结束后停掉 requestAnimationFrame，不留下空转的动画循环。
 */
export function RainCanvas({
  playing,
  level,
  pauseFadeMs,
}: RainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelRef = useRef(level);
  const playingRef = useRef(playing);
  const stopAtRef = useRef(0);
  const startRef = useRef<() => void>(() => {});

  // 最新雨势和播放状态写进 ref，主循环不需要因为 props 变化重建
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    playingRef.current = playing;

    if (playing) {
      stopAtRef.current = 0;
      startRef.current();
      return;
    }

    // 暂停后让画面继续跑完淡出时长，再停掉循环
    stopAtRef.current = performance.now() + pauseFadeMs;
  }, [playing, pauseFadeMs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 系统要求减少动态效果时，连 requestAnimationFrame 也一起省掉
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 柔光 + 雨丝的预渲染精灵，整层共用一张
    const rainSprite = createRainSprite();
    if (!rainSprite) return;

    let width = 0;
    let height = 0;
    let last = 0;
    let raf = 0;
    let running = false;
    let smoothedLevel = levelRef.current;
    const drops: RainDrop[] = [];
    const splashes: RainSplash[] = [];

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const frame = (now: number) => {
      if (!running) return;

      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;

      // 暂停淡出结束后收手：画面已经透明，不需要再画
      if (!playingRef.current && now >= stopAtRef.current) {
        stop();
        return;
      }

      const target = levelRef.current;
      if (target >= smoothedLevel) {
        // 雨势上涨跟得快，保持和歌曲推进同步
        smoothedLevel += (target - smoothedLevel) * Math.min(1, dt * 4);
      } else {
        // 回落走慢速线性：切歌、循环或往回拖进度时，
        // 超过当前雨势门槛的雨滴会一颗颗淡出，最后只剩小雨的数量
        smoothedLevel = Math.max(
          target,
          smoothedLevel - dt * RAIN_THIN_PER_SECOND,
        );
      }

      const wind = getWind(now);
      drawFrame(
        ctx,
        drops,
        splashes,
        rainSprite,
        width,
        height,
        dt,
        smoothedLevel,
        wind,
      );
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    startRef.current = start;

    const resize = () => {
      // 用 canvas 自己的 CSS 尺寸，和实际绘制区域严格一致
      // （window.innerWidth 可能把滚动条也算进去）
      const nextWidth = canvas.clientWidth;
      const nextHeight = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      const widthChanged = nextWidth !== width;

      width = nextWidth;
      height = nextHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.globalCompositeOperation = "lighter";

      // 地址栏伸缩只会改高度，没必要把整批雨滴重新洗牌；
      // 宽度变化（窗口缩放/横竖屏）才重新铺一次。
      if (widthChanged) seedDrops(drops, width, height);

      // 底部位置已经变了，旧水花直接清掉，避免留在半空
      splashes.length = 0;

      last = performance.now();
    };

    resize();
    window.addEventListener("resize", resize);

    if (playingRef.current) start();

    return () => {
      window.removeEventListener("resize", resize);
      stop();
      // StrictMode 会先跑一遍 cleanup 再重跑 effect；把启动入口换回空函数，
      // 避免上一轮的 start 被重新调用后多开一条 requestAnimationFrame。
      startRef.current = () => {};
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 size-full"
    />
  );
}
