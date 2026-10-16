/**
 * 背景层。
 *
 * 从下往上叠四层，任何一层都可以单独关掉：
 *   1. 背景图轮播（可选，由 NEXT_PUBLIC_BACKGROUND_IMAGES 控制，交叉淡化切换）
 *   2. 压暗遮罩（保证玻璃面板上的文字对比度）
 *   3. 极光光斑（本页的视觉识别度，可用 NEXT_PUBLIC_BACKGROUND_AURORA=false 关掉）
 *   4. 噪点 + 底部压暗
 *
 * 毛玻璃面板需要「背后有东西可透」才成立。这一层相对页面固定不动，
 * 内容滚动时颜色会在玻璃下缓慢流过，是最出效果的一环。
 *
 * 光斑的位置、颜色、尺寸全部由 BLOBS 数组驱动 —— 想换配色改数组即可，
 * 不用碰 JSX 结构。
 */

import { BackgroundCarousel } from "@/components/layout/BackgroundCarousel";
import { backgroundConfig } from "@/lib/config";

interface Blob {
  /** 颜色，直接引用 globals.css 里的 @theme 令牌 */
  color: string;
  /** 直径，用 vw/vh 混合单位保证不同屏幕比例下构图稳定 */
  size: string;
  top: string;
  left: string;
  opacity: number;
  /** 漂移动画时长，几个光斑取不同的值可以避免同步摆动 */
  animation: string;
}

const BLOBS: Blob[] = [
  {
    color: "var(--color-aurora-violet)",
    size: "52vw",
    top: "-14vh",
    left: "-10vw",
    opacity: 0.55,
    animation: "var(--animate-drift)",
  },
  {
    color: "var(--color-aurora-cyan)",
    size: "44vw",
    top: "8vh",
    left: "58vw",
    opacity: 0.4,
    animation: "var(--animate-drift-slow)",
  },
  {
    color: "var(--color-aurora-rose)",
    size: "38vw",
    top: "58vh",
    left: "4vw",
    opacity: 0.32,
    animation: "var(--animate-drift-slow)",
  },
  {
    color: "var(--color-aurora-amber)",
    size: "30vw",
    top: "72vh",
    left: "66vw",
    opacity: 0.24,
    animation: "var(--animate-drift)",
  },
];

/** 细颗粒噪点。纯渐变容易显得「塑料」，加一层噪点后质感接近真实玻璃 */
const NOISE_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function AuroraBackground() {
  const { images, imageDim, aurora } = backgroundConfig;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950"
    >
      {/* 1. 背景图轮播。容器本身是 fixed，所以图片天然不随页面滚动 */}
      <BackgroundCarousel />

      {/* 2. 压暗遮罩。照片本身通常太亮，不压暗玻璃面板上的字会读不清。
             刻意放在轮播层外面而不是跟着图一起淡化 —— 否则每次切图，
             整页明暗都会跟着闪一下 */}
      {images.length > 0 && imageDim > 0 && (
        <div className="absolute inset-0 bg-ink-950" style={{ opacity: imageDim }} />
      )}

      {/* 3. 极光光斑 */}
      {aurora &&
        BLOBS.map((blob, index) => (
          <div
            key={index}
            className="absolute rounded-full blur-[100px] will-change-transform"
            style={{
              width: blob.size,
              height: blob.size,
              top: blob.top,
              left: blob.left,
              opacity: blob.opacity,
              background: `radial-gradient(circle at center, ${blob.color} 0%, transparent 70%)`,
              animation: blob.animation,
            }}
          />
        ))}

      {/* 4. 噪点 */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{ backgroundImage: NOISE_URL }}
      />

      {/* 5. 底部压暗，保证页脚区域的文字对比度 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950/80" />
    </div>
  );
}