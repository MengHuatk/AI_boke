"use client";

/**
 * 首页萤火虫光点层（仅电脑端，lg 以上显示）。
 *
 * 垫在草地层（-z-5）之上、正文所有内容之下：同样用负 z-index（-4）实现，
 * pointer-events-none 保证完全不挡交互。
 *
 * 一只萤火虫拆成两层 span，各管一个 transform，互不覆盖：
 *   - 外层只做平移（firefly-wander），四个锚点首尾回到原点，无限循环不跳变；
 *   - 内层只做缩放与透明度（firefly-life），呈现「长大 → 亮着飘 → 收小」；
 *   - 光晕是内层的双层 box-shadow（近实远虚），被外层 scale 一并缩放，
 *     所以晕会跟着点一起长大，不需要单独动画。
 *
 * 生灭三段比例在关键帧里写死（15% / 70% / 15%），因为关键帧的位置不接受
 * var()；配 life 6–8s 即生长 0.9–1.2s、保持 4.2–5.6s、收缩 0.9–1.2s。
 * 保持期略窄于需求的 4–6s 是刻意取舍：每只仍随机、且始终落在区间内。
 *
 * 密度恒定靠 animation-iteration-count: infinite + 负延迟错相位，零 JS 定时器；
 * 延迟的随机范围取各字段上界而不是自身时长，才能保证任一相位都可能被抽中。
 *
 * 位置用视口百分比，天然自适应，不需要监听 resize。
 * 随机数没法在 SSR 两端一致，所以走 useSyncExternalStore：服务端快照固定为
 * null（不渲染），客户端挂载后读快照时才生成数据，天然躲开水合不匹配。
 */

import { useSyncExternalStore, type CSSProperties } from "react";

interface Firefly {
  /** 水平位置，视口百分比 */
  x: number;
  /** 垂直位置，视口百分比 */
  y: number;
  /** 直径，px */
  size: number;
  /** 峰值不透明度 */
  peak: number;
  /** 生灭一轮总时长，s */
  life: number;
  /** 生灭相位，负值 */
  lifeDelay: number;
  /** 漂移一轮时长，s */
  wander: number;
  /** 漂移相位，负值 */
  wanderDelay: number;
  /** 第一个漂移锚点位移，px */
  w1x: number;
  w1y: number;
  /** 第二个漂移锚点位移，px */
  w2x: number;
  w2y: number;
  /** 第三个漂移锚点位移，px */
  w3x: number;
  w3y: number;
}

const RANGE = {
  countMin: 10,
  countSpan: 6,
  xMin: 2,
  xMax: 98,
  yMin: 6,
  yMax: 94,
  sizeMin: 2.5,
  sizeMax: 7.5,
  peakMin: 0.55,
  peakMax: 0.95,
  lifeMin: 6,
  lifeMax: 8,
  wanderMin: 15,
  wanderMax: 20,
  wanderAmplitudeMin: 25,
  wanderAmplitudeMax: 90,
} as const;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** 幅度落在 [min, max]，方向随机 */
function signedBetween(min: number, max: number): number {
  const magnitude = randomBetween(min, max);
  return Math.random() < 0.5 ? -magnitude : magnitude;
}

/** 按视口百分比生成一屏萤火虫的随机参数 */
function generateFireflies(): Firefly[] {
  const count = RANGE.countMin + Math.floor(Math.random() * RANGE.countSpan);

  return Array.from({ length: count }, () => ({
    x: randomBetween(RANGE.xMin, RANGE.xMax),
    y: randomBetween(RANGE.yMin, RANGE.yMax),
    size: randomBetween(RANGE.sizeMin, RANGE.sizeMax),
    peak: randomBetween(RANGE.peakMin, RANGE.peakMax),
    life: randomBetween(RANGE.lifeMin, RANGE.lifeMax),
    // 负延迟 + 上界随机：让每只从周期中段开始，且任一相位都可能被抽中
    lifeDelay: -randomBetween(0, RANGE.lifeMax),
    wander: randomBetween(RANGE.wanderMin, RANGE.wanderMax),
    wanderDelay: -randomBetween(0, RANGE.wanderMax),
    w1x: signedBetween(RANGE.wanderAmplitudeMin, RANGE.wanderAmplitudeMax),
    w1y: signedBetween(RANGE.wanderAmplitudeMin, RANGE.wanderAmplitudeMax),
    w2x: signedBetween(RANGE.wanderAmplitudeMin, RANGE.wanderAmplitudeMax),
    w2y: signedBetween(RANGE.wanderAmplitudeMin, RANGE.wanderAmplitudeMax),
    w3x: signedBetween(RANGE.wanderAmplitudeMin, RANGE.wanderAmplitudeMax),
    w3y: signedBetween(RANGE.wanderAmplitudeMin, RANGE.wanderAmplitudeMax),
  }));
}

// useSyncExternalStore 要求 getSnapshot 返回稳定引用：客户端首次读取时生成，之后复用
let clientSnapshot: Firefly[] | null = null;

function subscribe(): () => void {
  return () => {};
}

function getClientSnapshot(): Firefly[] {
  clientSnapshot ??= generateFireflies();
  return clientSnapshot;
}

function getServerSnapshot(): Firefly[] | null {
  return null;
}

export function FireflyShadow() {
  const flies = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  if (flies === null) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[-4] hidden overflow-hidden lg:block"
    >
      {flies.map((fly, index) => (
        <span
          key={index}
          style={
            {
              position: "absolute",
              left: `${fly.x}%`,
              top: `${fly.y}%`,
              width: `${fly.size}px`,
              height: `${fly.size}px`,
              // 中心对齐用负 margin，不占用外层 transform
              marginLeft: `${-fly.size / 2}px`,
              marginTop: `${-fly.size / 2}px`,
              animation: `firefly-wander ${fly.wander}s linear ${fly.wanderDelay}s infinite`,
              "--w1x": `${fly.w1x}px`,
              "--w1y": `${fly.w1y}px`,
              "--w2x": `${fly.w2x}px`,
              "--w2y": `${fly.w2y}px`,
              "--w3x": `${fly.w3x}px`,
              "--w3y": `${fly.w3y}px`,
            } as CSSProperties
          }
        >
          <span
            style={
              {
                display: "block",
                width: "100%",
                height: "100%",
                borderRadius: "9999px",
                background: "rgb(255 255 255)",
                boxShadow:
                  `0 0 ${fly.size * 2}px ${fly.size * 0.75}px rgb(148 255 148 / 0.8), ` +
                  `0 0 ${fly.size * 5}px ${fly.size * 2}px rgb(148 255 148 / 0.35)`,
                animation: `firefly-life ${fly.life}s ease-in-out ${fly.lifeDelay}s infinite`,
                "--peak": fly.peak,
              } as CSSProperties
            }
          />
        </span>
      ))}
    </div>
  );
}
