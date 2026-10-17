"use client";

/**
 * 全站草坪层（仅电脑端，lg 以上显示）。
 *
 * 由 SiteShell 渲染，固定在视口最底部，垫在页面所有内容之下、背景层（-z-10）之上：
 * 用负 z-index（-5）实现，pointer-events-none 保证完全不挡交互。
 *
 * 形态是「弯叶 + 阵风」：
 *   - 每棵草用 skewX 预弯出一个朝右的静态弧度，顶端圆头；
 *   - 摇摆以底边中心为轴（transform-origin: 50% 100%），摆幅 ±10–14°。
 *     刻意不到规格里的 ±25° —— 弯叶大摆顶端位移过大会散架，像杂草不像草；
 *   - 阵风感来自 animation-delay 随水平位置递减：一波草尖从左扫到右
 *     （约 1.8s 掠过），再叠每棵 ±0.25s 的抖动打散机械感。
 *
 * 尺寸 / 间距 / 透明度全部逐棵随机：高 30–50px、宽 3–5px、
 * 底部白色透明度 0.3–0.6（顶部渐隐到透明）、棵间间距 4–10px。
 *
 * 随机数没法在 SSR 两端一致，所以走 useSyncExternalStore：服务端快照固定为
 * null（不渲染），客户端挂载后读快照时才生成草叶数据，天然躲开水合不匹配。
 * 数量按视口宽度 ÷ 最小步幅（7px）向上取整，铺满有余，多出的被 overflow-hidden 裁掉。
 */

import { useSyncExternalStore, type CSSProperties } from "react";

interface Blade {
  height: number;
  width: number;
  /** 底部（渐变不透明端）的 alpha */
  alpha: number;
  /** 与下一棵的间距 */
  gap: number;
  /** 摇摆半幅，deg */
  amp: number;
  /** 预弯弧度，deg */
  skew: number;
  period: number;
  /** 可为负：负延迟让动画从中间相位开始，避免开场齐步静止 */
  delay: number;
}

const RANGE = {
  heightMin: 30,
  heightMax: 75,
  widthMin: 2.2,
  widthMax: 2.8,
  alphaMin: 0.1,
  alphaMax: 0.6,
  gapMin: 4,
  gapMax: 10,
  ampMin: 10,
  ampMax: 14,
  skewMin: 4,
  skewMax: 10,
  periodMin: 3.3,
  periodMax: 4.3,
} as const;

/** 阵风横扫整片草地所需时长（秒）与相位抖动上限（秒） */
const GUST_SWEEP_SECONDS = 1.8;
const GUST_JITTER_SECONDS = 0.25;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** 按当前视口宽度生成一整排草叶的随机参数 */
function generateBlades(): Blade[] {
  // 最小步幅 = 最小间距 4 + 最小宽 3，向下取整会露缝，所以除以 7 再补几棵
  const count = Math.ceil(window.innerWidth / 7) + 4;

  return Array.from({ length: count }, (_, index) => ({
    height: randomBetween(RANGE.heightMin, RANGE.heightMax),
    width: randomBetween(RANGE.widthMin, RANGE.widthMax),
    alpha: randomBetween(RANGE.alphaMin, RANGE.alphaMax),
    gap: randomBetween(RANGE.gapMin, RANGE.gapMax),
    amp: randomBetween(RANGE.ampMin, RANGE.ampMax),
    skew: randomBetween(RANGE.skewMin, RANGE.skewMax),
    period: randomBetween(RANGE.periodMin, RANGE.periodMax),
    // 位置越靠左相位越靠前（负得越多），摆动的波峰从左向右传播
    delay:
      -(1 - index / (count - 1)) * GUST_SWEEP_SECONDS +
      randomBetween(-GUST_JITTER_SECONDS, GUST_JITTER_SECONDS),
  }));
}

// useSyncExternalStore 要求 getSnapshot 返回稳定引用：客户端首次读取时生成，之后复用
let clientSnapshot: Blade[] | null = null;

function subscribe(): () => void {
  return () => {};
}

function getClientSnapshot(): Blade[] {
  clientSnapshot ??= generateBlades();
  return clientSnapshot;
}

function getServerSnapshot(): Blade[] | null {
  return null;
}

export function GrassField() {
  const blades = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  if (blades === null) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[-5] hidden items-end overflow-hidden lg:flex"
    >
      {blades.map((blade, index) => (
        <span
          key={index}
          style={
            {
              flexShrink: 0,
              width: `${blade.width}px`,
              height: `${blade.height}px`,
              marginRight: `${blade.gap}px`,
              borderRadius: "999px 999px 0 0",
              transformOrigin: "50% 100%",
              background: `linear-gradient(to top, rgb(255 255 255 / ${blade.alpha}), rgb(247 247 247 / 0))`,
              animation: `grass-sway ${blade.period}s ease-in-out ${blade.delay}s infinite`,
              "--amp": `${blade.amp}deg`,
              "--skew": `${blade.skew}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
