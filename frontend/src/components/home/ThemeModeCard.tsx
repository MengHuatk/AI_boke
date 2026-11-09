"use client";

import { useEffect, useRef } from "react";

import { setTheme, useTheme } from "@/components/layout/useTheme";
import { Icon } from "@/components/ui/Icon";

/**
 * 首页主题切换卡（桌面 220×218）。
 *
 * 卡内上方是一枚深蓝紫圆形按钮，中央星形图标；点击后整页颜色在
 * 600ms 内从当前主题过渡到新主题：背景、玻璃、文字、描边、阴影
 * 一起淡出淡入，没有任何覆盖层，也没有从按钮向外扩张的动画。
 * 日间模式下按钮变成暖米金 + 太阳，标签与提示同步换文案。
 *
 * 主题状态由 useTheme 读写 <html data-theme>，换肤细节全部在 globals.css。
 */
export function ThemeModeCard() {
  const theme = useTheme();
  const isDay = theme === "day";
  const switching = useRef(false);
  const raf = useRef<number | null>(null);
  const endTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      if (endTimer.current !== null) window.clearTimeout(endTimer.current);
      document.documentElement.classList.remove("theme-fading");
    },
    [],
  );

  const handleToggle = () => {
    // 过渡进行中忽略重复点击，避免旧定时器与新过渡互相打断
    if (switching.current) return;

    const next = isDay ? "night" : "day";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTheme(next);
      return;
    }

    switching.current = true;
    const root = document.documentElement;
    root.classList.add("theme-fading");

    // 第一帧先让过渡声明落到整棵树上，第二帧再切主题，
    // 颜色才会从旧值插值到新值，而不是直接跳变
    raf.current = requestAnimationFrame(() => {
      raf.current = requestAnimationFrame(() => {
        setTheme(next);

        endTimer.current = window.setTimeout(() => {
          root.classList.remove("theme-fading");
          switching.current = false;
        }, 700);
      });
    });
  };

  return (
    <div
      role="group"
      aria-label="主题模式切换"
      className="relative flex h-[218px] w-full flex-col overflow-hidden rounded-glass glass-panel p-4 sm:w-[220px] sm:shrink-0"
    >
      <div className="flex items-center justify-between">
        <span className="font-xiaowei text-[14px] tracking-[0.14em] text-white/70">
          THEME
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] leading-none text-white/40">
          <span className="theme-night-only">夜间</span>
          <span className="theme-day-only">日间</span>
        </span>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={isDay}
        aria-label={isDay ? "切换到夜间模式" : "切换到日间模式"}
        className="theme-orb-button group/orb relative mx-auto mt-3 grid size-[100px] shrink-0 place-items-center rounded-full border transition-[transform,box-shadow,background-color,border-color] duration-500 ease-out hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400"
      >
        {/* 两套渐变叠在一起，按主题交叉淡化，避免背景图直接跳变 */}
        <span
          aria-hidden="true"
          className="theme-orb-bg theme-orb-bg-night"
        />
        <span aria-hidden="true" className="theme-orb-bg theme-orb-bg-day" />

        {/* hover 才浮出的虚线轨道 */}
        <span
          aria-hidden="true"
          className="theme-orbit pointer-events-none absolute inset-[-9px] rounded-full border border-dashed opacity-0 transition-opacity duration-500 group-hover/orb:opacity-100"
        />

        <Icon
          name="star"
          size={38}
          className="theme-orb-icon theme-orb-icon-night theme-star text-[#f4e9ff]"
        />
        <Icon
          name="sun"
          size={38}
          className="theme-orb-icon theme-orb-icon-day text-[#6b4310] drop-shadow-[0_0_10px_rgba(255,236,190,0.9)]"
        />
      </button>

      <p className="mt-3 text-center font-xiaowei text-[15px] leading-5 text-white/90">
        <span className="theme-night-only">夜间模式</span>
        <span className="theme-day-only">日间模式</span>
      </p>
      <p className="mt-1 text-center text-[10px] leading-4 text-white/40">
        <span className="theme-night-only">点击星星，迎向白昼</span>
        <span className="theme-day-only">点击太阳，回到夜晚</span>
      </p>
    </div>
  );
}
