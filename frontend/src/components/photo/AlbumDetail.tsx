"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/format";
import type { PhotoAlbum, PhotoItem } from "@/lib/types";

interface AlbumDetailProps {
  album: PhotoAlbum;
  onBack: () => void;
}

/**
 * 照片集详情：返回按钮 + 创建日期 → 标题 + 张数 → 简介 → 瀑布流照片墙。
 *
 * 整个详情仍在 /photos 路由内，由 PhotoGallery 用状态切换替换照片集区，
 * 不产生新路径。照片墙用 CSS 多栏实现瀑布流：每张图按原始宽高占位，
 * 加载前也不会把下方图片顶得跳来跳去。
 *
 * 每张图 hover / 键盘聚焦时以中心放大 1.05；下半 50% 的透明→黑色
 * 渐变遮罩固定在原位整体淡入，照片名从下方 10px 处淡入并上移。
 *
 * 点击照片打开灯箱。灯箱通过 portal 挂到 body：页面外层有 1200px
 * 的破格布局，动画期间也可能带 transform，挂在 portal 上才能保证
 * fixed 遮罩始终相对视口铺满。
 */
export function AlbumDetail({ album, onBack }: AlbumDetailProps) {
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null);

  return (
    <section aria-label={album.title}>
      <div className="flex flex-wrap items-center gap-3 ">
        <button
          type="button"
          onClick={onBack}
          className="glass-panel inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm text-white/65 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neon-500"
        >
          <Icon name="arrowRight" size={14} className="rotate-180" />
          返回画廊
        </button>

        {/* 与返回按钮同排的创建日期胶囊 */}
        <span className=" inline-flex h-8 items-center rounded-full px-3 text-[14px] text-white/50 tabular-nums">
          {album.created_at}
        </span>
      </div>

      <div className="mt-7 flex items-center justify-between gap-4">
        <h2 className="min-w-0 font-xiaowei text-[58px] leading-tight text-white/90">
          {album.title}
        </h2>
        <span className="glass-panel px-4 py-3 rounded-[16px] shrink-0 text-[16px] text-white/45 font-yahei">
          共 <span className="text-[#A18CFF] text-[18px]">{album.photos.length}</span> 瞬间
        </span>
      </div>
      <p className=" max-w-3xl text-[16px] leading-7 text-white/45 font-yahei">
        {album.description}
      </p>

      <div className="mt-8 columns-1 gap-6 sm:columns-2 lg:columns-3">
        {album.photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setActivePhoto(photo)}
            className="group relative mb-6 block w-full break-inside-avoid overflow-hidden rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-white/25 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neon-500"
          >
            {/* hover / 键盘聚焦时以中心为原点轻微放大，遮罩与图同步出现 */}
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="h-auto w-full group-hover:scale-110 group-focus-visible:scale-110 transition-transform duration-1000 "
            />

            {/* 下框渐变遮罩：固定覆盖图片下半 50%，hover 时整体淡入；
                照片名从最终位置下方 10px 处淡入并上移 */}
            <span className="media-text absolute inset-x-0 bottom-0 flex h-1/2 items-end bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-4 text-left opacity-0 transition-opacity duration-[880ms] ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="block translate-y-2.5 font-xiaowei text-[15px] leading-5 tracking-wide text-white/90 opacity-0 transition-all duration-[1000ms] ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:delay-[90ms] group-focus-visible:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:delay-[90ms]">
                {photo.title}
              </span>
            </span>
          </button>
        ))}
      </div>

      {activePhoto &&
        createPortal(
          <PhotoLightbox
            photo={activePhoto}
            onClose={() => setActivePhoto(null)}
          />,
          document.body,
        )}
    </section>
  );
}

/**
 * 全屏灯箱。点击遮罩、按 Esc 或点关闭按钮都走同一条关闭路径：
 * 先把整体淡出，等遮罩的 opacity 过渡结束后再真正卸载。
 * 打开期间锁住 body 滚动，卸载时恢复原值。
 *
 * 标题胶囊是 128×46 的深玻璃圆角条，水平居中，底部对齐图片下沿
 * 后再下移自身一半的高度——胶囊中心正好落在图片底边上，
 * 于是上半截压着图、下半截悬在图片外。
 */
function PhotoLightbox({
  photo,
  onClose,
}: {
  photo: PhotoItem;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(false);
  const [closing, setClosing] = useState(false);

  // 首帧先以 opacity-0 渲染，下一帧再切到 opacity-100，淡入才会被触发
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setClosing(true);
        setShown(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    // 锁滚动会让竖向滚动条消失，内容区变宽，居中的照片列表会向右跳。
    // 用等宽的右内边距把滚动条占的位置补回来。
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
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  function requestClose() {
    if (closing) return;
    setClosing(true);
    setShown(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
      onClick={requestClose}
      onTransitionEnd={(event) => {
        // 只认遮罩自身的 opacity 过渡，避免子元素（如关闭按钮的变色）误触发
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
        className="glass-panel absolute right-5 top-5 grid size-11 place-items-center rounded-full text-white/75 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neon-500"
      >
        <Icon name="close" size={20} />
      </button>

      {/* 按原始比例显式定宽，容器与图片的渲染尺寸完全一致；
          胶囊才能以图片下沿为定位基准 */}
      <div
        className="relative"
        style={{
          width: `min(92vw, calc((88dvh - 24px) * ${photo.width / photo.height}))`,
          aspectRatio: `${photo.width} / ${photo.height}`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="100vw"
          className="rounded-lg object-contain shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
        />

        {/* 128×46 深玻璃胶囊：中心对齐图片下沿，一半在图上、一半在图片外 */}
        <span className="glass-panel-strong absolute bottom-0 left-1/2 z-10 flex h-[46px] w-32 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full px-3">
          <span className="min-w-0 truncate font-xiaowei text-[13px] text-white/85">
            {photo.title}
          </span>
        </span>
      </div>
    </div>
  );
}
