"use client";

/**
 * 背景图轮播层。
 *
 * 切换方式刻意不用左右平移，而是**交叉淡化**：上一张渐隐、下一张渐显。
 * 这一层相对视口固定不动，图片一移动整页背景都会跟着「晃」，
 * 毛玻璃面板的稳定感就没了。
 *
 * 淡化用「底图 + 顶层」两层实现，而不是让所有图一起改 opacity：
 * 底图恒为不透明，顶层从 0 淡到 1，合成结果全程线性，中途不会变暗。
 * 若放任每张图各自淡，切换中点两张都不到全不透明，底色就会透上来，
 * 每次换图整页都会跟着「呼吸」一下。
 *
 * 顶层的 `key` 让每轮重新挂载、动画从头播；挂载的同一帧里底图换成上一张，
 * 两张接的是同一画面，所以看不到接缝。这样一来切换完全不依赖
 * animationend 事件，后台标签页被节流时也不会卡住。
 *
 * 只有一张图时不启动计时器，等同静态背景；一张都没有时整个组件不渲染，
 * 页面回落到纯极光效果（初版行为）。
 */

import { useEffect, useState } from "react";

import { backgroundConfig } from "@/lib/config";

export function BackgroundCarousel() {
  const { images, intervalSeconds, imageBlur, imageOpacity } = backgroundConfig;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;

    const timer = setInterval(
      () => setTick((value) => value + 1),
      intervalSeconds * 1000,
    );

    return () => clearInterval(timer);
  }, [images.length, intervalSeconds]);

  if (images.length === 0) return null;

  // 底图永远是「上一张」，顶层淡入「当前张」。首帧还没有上一张，直接用第一张
  const currentIndex = tick % images.length;
  const baseIndex = tick === 0 ? 0 : (tick - 1) % images.length;

  return (
    <div
      className="absolute inset-0"
      style={{
        opacity: imageOpacity,
        // 模糊会把边缘糊掉、露出底色，所以放大一点点把毛边推出画外
        filter: imageBlur > 0 ? `blur(${imageBlur}px)` : undefined,
        transform: imageBlur > 0 ? "scale(1.06)" : undefined,
      }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${images[baseIndex]}")` }}
      />

      {tick > 0 && (
        <div
          key={tick}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("${images[currentIndex]}")`,
            animation: "crossfade-in var(--duration-bg-fade) ease-in-out both",
          }}
        />
      )}
    </div>
  );
}