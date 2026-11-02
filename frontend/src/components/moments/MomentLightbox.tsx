"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/format";
import type { MomentImage } from "@/lib/types";

interface MomentLightboxProps {
  images: MomentImage[];
  initialIndex: number;
  onClose: () => void;
}

/**
 * 说说图片灯箱。
 *
 * 点击九宫格任意一张打开，左右方向键 / 两侧按钮在同一组图片里循环，
 * 底部常驻「当前 / 总数」。Esc、点遮罩、右上角关闭都走同一条退出路径。
 * 通过 portal 挂到 body，避免被卡片的毛玻璃层或 transform 困住。
 */
export function MomentLightbox({
  images,
  initialIndex,
  onClose,
}: MomentLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [shown, setShown] = useState(false);
  const [closing, setClosing] = useState(false);

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setShown(false);
  }, [closing]);

  // 首帧先以 opacity-0 渲染，下一帧再切到 opacity-100，淡入才会被触发
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // 键盘：Esc 关闭，左右方向键循环切换
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        requestClose();
      } else if (event.key === "ArrowLeft") {
        setIndex((current) => (current - 1 + images.length) % images.length);
      } else if (event.key === "ArrowRight") {
        setIndex((current) => (current + 1) % images.length);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [images.length, requestClose]);

  // 锁滚动；滚动条消失会让底层内容变宽，用等宽右内边距补回来
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const paddingRight = Number.parseFloat(
        window.getComputedStyle(document.body).paddingRight,
      );
      document.body.style.paddingRight = `${paddingRight + scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  function showPrevious() {
    setIndex((current) => (current - 1 + images.length) % images.length);
  }

  function showNext() {
    setIndex((current) => (current + 1) % images.length);
  }

  const image = images[index];
  const frameWidth = `min(1200px, calc(100vw - 2rem), calc(78dvh * ${
    image.width / image.height
  }))`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="查看说说图片"
      onClick={requestClose}
      onTransitionEnd={(event) => {
        // 只认遮罩自身的 opacity 过渡，避免子元素变色误触发
        if (
          closing &&
          event.target === event.currentTarget &&
          event.propertyName === "opacity"
        ) {
          onClose();
        }
      }}
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm transition-opacity duration-300 ease-out",
        shown ? "opacity-100" : "opacity-0",
      )}
    >
      <button
        type="button"
        autoFocus
        aria-label="关闭大图"
        onClick={(event) => {
          event.stopPropagation();
          requestClose();
        }}
        className="glass-panel absolute top-5 right-5 z-10 grid size-11 place-items-center rounded-full text-white/75 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neon-500"
      >
        <Icon name="close" size={20} />
      </button>

      {/* 画框宽高按图片原始比例算，容器正好包住图片；
          点图不关，点容器外的遮罩才关 */}
      <div
        className="relative"
        style={{
          width: frameWidth,
          aspectRatio: `${image.width} / ${image.height}`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="100vw"
          className="rounded-lg object-contain shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
        />
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="上一张"
            onClick={(event) => {
              event.stopPropagation();
              showPrevious();
            }}
            className="glass-panel absolute top-1/2 left-4 grid size-11 -translate-y-1/2 place-items-center rounded-full text-white/75 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neon-500"
          >
            <Icon name="arrowRight" size={18} className="rotate-180" />
          </button>
          <button
            type="button"
            aria-label="下一张"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            className="glass-panel absolute top-1/2 right-4 grid size-11 -translate-y-1/2 place-items-center rounded-full text-white/75 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neon-500"
          >
            <Icon name="arrowRight" size={18} />
          </button>
        </>
      )}

      <span
        aria-live="polite"
        onClick={(event) => event.stopPropagation()}
        className="glass-panel-strong absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-[13px] text-white/75 tabular-nums"
      >
        {index + 1} / {images.length}
      </span>
    </div>,
    document.body,
  );
}
