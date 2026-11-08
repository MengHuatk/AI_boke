"use client";

import { useEffect, useState } from "react";

/**
 * 首页精选轮播的共用状态。
 *
 * 自动轮播用 setTimeout 而不是 setInterval：每次切页或手动点选后
 * 重新计时，避免刚点完圆点又立刻跳走。悬停、聚焦由调用方通过
 * setPaused 暂停；系统开启「减少动态效果」时完全不自动切换，
 * 但圆点仍可手动操作。
 */
export function useShowcaseCarousel(count: number, intervalMs: number) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || count <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % count);
    }, intervalMs);

    return () => window.clearTimeout(timer);
  }, [paused, count, intervalMs, index]);

  return { index, setIndex, setPaused };
}
