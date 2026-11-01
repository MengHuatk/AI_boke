"use client";

import { useState } from "react";

import { AlbumCard } from "@/components/photo/AlbumCard";
import { AlbumDetail } from "@/components/photo/AlbumDetail";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/format";
import type { PhotoAlbum } from "@/lib/types";

interface PhotoGalleryProps {
  albums: PhotoAlbum[];
}

/**
 * 照片墙主体。
 *
 * 两态共用一个路由：activeAlbum 为空时是错落拍立得墙 + 顶部标题栏；
 * 选中某组后把照片集区换成该组详情，标题栏与搜索框一并隐藏，
 * 页面上只保留返回按钮、照片集标题/简介与照片列表。
 *
 * 1200px 宽度需要突破 SiteShell 的 max-w-6xl（内容宽 1104px），
 * 这里用「宽度 = min(1200px, 100vw - 2rem) + 左右负外边距居中」实现，
 * 不用 transform，避免给内部 fixed 灯箱制造新的包含块。
 *
 * 搜索只过滤照片集标题与简介，只在画廊态可用。
 *
 * 首访不播内部切换动画，整页入场交给 app/template.tsx 的
 * ViewTransition；只有用户主动进入 / 返回时才给容器挂 photo-swap。
 */
export function PhotoGallery({ albums }: PhotoGalleryProps) {
  const [query, setQuery] = useState("");
  const [activeAlbum, setActiveAlbum] = useState<PhotoAlbum | null>(null);
  const [hasSwitched, setHasSwitched] = useState(false);

  const keyword = query.trim().toLowerCase();
  const visibleAlbums = keyword
    ? albums.filter(
        (album) =>
          album.title.toLowerCase().includes(keyword) ||
          album.description.toLowerCase().includes(keyword),
      )
    : albums;

  function openAlbum(album: PhotoAlbum) {
    setHasSwitched(true);
    setActiveAlbum(album);
  }

  function backToGallery() {
    setHasSwitched(true);
    setActiveAlbum(null);
  }

  return (
    <div
      style={{
        width: "min(1200px, calc(100vw - 2rem))",
        marginInline: "calc((100% - min(1200px, calc(100vw - 2rem))) / 2)",
      }}
    >
      {/* 1200×80 透明标题栏：只在画廊态显示，进入照片列表后整块隐藏 */}
      {!activeAlbum && (
        <header className="flex min-h-20 flex-col justify-center gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div>
            <h1 className="font-xiaowei text-[30px] leading-tight text-white/90 sm:text-[34px]">
              光影画廊
            </h1>
            <p className="mt-1 text-[13px] text-white/45 sm:text-sm">
              定格时间，封存虚拟与现实的每一次心跳
            </p>
          </div>

          <label className="glass-panel flex h-12 w-full items-center gap-2 rounded-glass px-4 sm:w-80 sm:shrink-0">
            <Icon name="search" size={16} className="shrink-0 text-white/40" />
            <input
              aria-label="搜索照片集"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索照片集…"
              className="h-full w-full bg-transparent text-sm text-white/85 outline-none placeholder:text-white/35"
            />
          </label>
        </header>
      )}

      <div
        key={activeAlbum?.slug ?? "gallery"}
        className={cn(
          !activeAlbum && "mt-8",
          hasSwitched && "photo-swap",
        )}
      >
        {activeAlbum ? (
          <AlbumDetail album={activeAlbum} onBack={backToGallery} />
        ) : (
          <section aria-label="照片集">
            {visibleAlbums.length > 0 ? (
              <ul className="grid grid-cols-1 items-start gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {visibleAlbums.map((album, index) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    index={index}
                    onOpen={openAlbum}
                  />
                ))}
              </ul>
            ) : (
              <p className="glass-panel-subtle flex h-40 items-center justify-center rounded-glass text-sm text-white/50">
                没有找到与「{query.trim()}」匹配的照片集
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
