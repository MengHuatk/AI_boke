import Image from "next/image";
import type { CSSProperties } from "react";

import { cn } from "@/lib/format";
import type { PhotoAlbum } from "@/lib/types";

interface AlbumCardProps {
  album: PhotoAlbum;
  /** 在过滤后列表中的序号，决定整组的倾角与高低错位 */
  index: number;
  onOpen: (album: PhotoAlbum) => void;
}

interface StackLayer {
  /** 静止位置的横向 / 纵向偏移 */
  x: number;
  y: number;
  /** 静止角度 */
  rot: number;
  /** hover 展开后的横向 / 纵向偏移与角度 */
  hoverX: number;
  hoverY: number;
  hoverRot: number;
  z: number;
}

/**
 * 六套手作照片堆排布。每套四层：第一层是正中的主图，其余三层以
 * 不同的上下偏移和角度错开露在白框外。相册按 slug 稳定地选一套，
 * 因此不同相册的静止构图和展开角度都不同，刷新后也不会变。
 * 没有用逐帧随机，避免服务端与客户端渲染出不同位置。
 */
const STACK_PRESETS: StackLayer[][] = [
  // 1 · 左散：后层主要向左下、右上展开
  [
    { x: 0, y: 0, rot: 0, hoverX: 0, hoverY: -10, hoverRot: 0, z: 40 },
    { x: -26, y: 10, rot: -9, hoverX: -56, hoverY: 18, hoverRot: -16, z: 30 },
    { x: 20, y: -8, rot: 7, hoverX: 50, hoverY: -16, hoverRot: 14, z: 20 },
    { x: 8, y: 18, rot: -3, hoverX: 16, hoverY: 30, hoverRot: -6, z: 10 },
  ],
  // 2 · 右倾：整体向右上偏，左下留出明显的背层
  [
    { x: 3, y: -2, rot: 1, hoverX: 3, hoverY: -12, hoverRot: 1, z: 40 },
    { x: -18, y: -12, rot: -7, hoverX: -40, hoverY: -24, hoverRot: -12, z: 30 },
    { x: 28, y: 6, rot: 10, hoverX: 56, hoverY: 14, hoverRot: 17, z: 20 },
    { x: -6, y: 18, rot: -5, hoverX: -14, hoverY: 30, hoverRot: -9, z: 10 },
  ],
  // 3 · 上扬：两张后层向上散开，一张留在下方
  [
    { x: -2, y: 2, rot: -1, hoverX: -2, hoverY: -8, hoverRot: -1, z: 40 },
    { x: -30, y: -4, rot: -11, hoverX: -58, hoverY: -14, hoverRot: -18, z: 30 },
    { x: 24, y: -14, rot: 8, hoverX: 54, hoverY: -28, hoverRot: 16, z: 20 },
    { x: 4, y: 16, rot: -2, hoverX: 8, hoverY: 30, hoverRot: -5, z: 10 },
  ],
  // 4 · 下沉：后层主要向下压，只有一张从上方探出来
  [
    { x: 1, y: 3, rot: 0.5, hoverX: 1, hoverY: -7, hoverRot: 0.5, z: 40 },
    { x: -22, y: 16, rot: -8, hoverX: -48, hoverY: 28, hoverRot: -14, z: 30 },
    { x: 26, y: 12, rot: 6, hoverX: 56, hoverY: 24, hoverRot: 12, z: 20 },
    { x: -4, y: -12, rot: -4, hoverX: -10, hoverY: -22, hoverRot: -8, z: 10 },
  ],
  // 5 · 交叉：左、右、下三个方向各展开一张
  [
    { x: 0, y: 0, rot: -0.5, hoverX: 0, hoverY: -11, hoverRot: -0.5, z: 40 },
    { x: -24, y: -10, rot: -6, hoverX: -52, hoverY: -20, hoverRot: -13, z: 30 },
    { x: 30, y: -2, rot: 9, hoverX: 56, hoverY: -10, hoverRot: 17, z: 20 },
    { x: -10, y: 16, rot: -7, hoverX: -20, hoverY: 28, hoverRot: -12, z: 10 },
  ],
  // 6 · 斜落：左上与右下拉开的一条对角构图
  [
    { x: -3, y: 1, rot: 0.8, hoverX: -3, hoverY: -9, hoverRot: 0.8, z: 40 },
    { x: -16, y: 16, rot: -10, hoverX: -36, hoverY: 30, hoverRot: -17, z: 30 },
    { x: 24, y: 8, rot: 5, hoverX: 52, hoverY: 20, hoverRot: 11, z: 20 },
    { x: 10, y: -14, rot: 3, hoverX: 20, hoverY: -26, hoverRot: 7, z: 10 },
  ],
];

/** 每组的整体倾角，制造拍立得墙的错落感 */
const ALBUM_TILTS = [-1.4, 1.8, -0.8, 1.2, -1.8, 0.6];

/** 每组的尺寸档位：±约 10%，让拍立得墙的大小不一 */
const ALBUM_SCALES = [0.9, 0.96, 1.02, 1.08, 1.12];

/** 每组在栅格里的高低错位；只在大屏生效，移动端保持单列整齐 */
const ALBUM_OFFSETS = [
  "sm:mt-0 lg:mt-0",
  "sm:mt-10 lg:mt-12",
  "sm:mt-2 lg:mt-5",
  "sm:mt-8 lg:mt-8",
  "sm:mt-0 lg:mt-2",
  "sm:mt-12 lg:mt-14",
];

/** 封面白框宽度（px），内图宽度为它减去两侧白边 */
const COVER_WIDTH = 260;

/** 白边内边距（px），对应层上的 p-1.5 */
const COVER_PADDING = 6;

/**
 * 错落拍立得墙里的一组照片。
 *
 * 按 slug 从六套手作排布里稳定选一套，取照片集前四张做堆叠：
 * 主图居中，另外三张以不同的上下偏移和角度垫在周围。
 * 白框用 bg-white + padding 模拟相片纸，内图按每张照片的真实宽高比
 * 撑高，竖图明显更高、横图更扁，白框不再统一裁成 4:3。
 * hover / 键盘 focus 时由 globals.css 的 .photo-stack-layer 配方让四层
 * 微微散开；最上方主图同时放大 1.10，下半 50% 渐变遮罩整体淡入，
 * 张数与淡紫色的 Click to Open 从下方 10px 错峰上浮淡入。
 * 散开幅度最大约 58px，仍在相邻卡片间隙附近。
 *
 * 集名旁挂创建日期，下方显示最多三行的照片集简介；
 * 张数保留在主图 hover 遮罩里。
 * 这是按钮而不是链接：进入详情只替换当前路由的照片集区，不产生新路径。
 */
export function AlbumCard({ album, index, onOpen }: AlbumCardProps) {
  const tilt = ALBUM_TILTS[index % ALBUM_TILTS.length];
  const offset = ALBUM_OFFSETS[index % ALBUM_OFFSETS.length];

  // 用 slug 的字符和派生尺寸档位与排布预设：结果稳定，避免 Math.random
  // 在服务端与客户端渲染出不同大小 / 位置导致水合不一致
  const scaleSeed = Array.from(album.slug).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  const scale = ALBUM_SCALES[scaleSeed % ALBUM_SCALES.length];
  const preset = STACK_PRESETS[scaleSeed % STACK_PRESETS.length];

  const stackPhotos = album.photos.slice(0, preset.length);

  // 白框宽度固定，内图按真实宽高比撑高，所以每层框高各不相同。四层都绕
  // 容器中心旋转并带纵向偏移，容器高度取「旋转后最高的一层 + 纵向偏移」，
  // 再乘整组缩放，竖图才不会压到下方的集名与简介。
  const maxHalfHeight = Math.max(
    ...stackPhotos.map((photo, layerIndex) => {
      const layer = preset[layerIndex];
      const frameHeight =
        (COVER_WIDTH - COVER_PADDING * 2) * (photo.height / photo.width) +
        COVER_PADDING * 2;
      const radians = (Math.abs(layer.rot) * Math.PI) / 180;
      const rotatedHalfHeight =
        (frameHeight * Math.cos(radians) + COVER_WIDTH * Math.sin(radians)) / 2;
      return rotatedHalfHeight + Math.abs(layer.y);
    }),
  );
  const stackHeight = maxHalfHeight * 2 * scale + 16;

  return (
    <li className={cn("flex justify-center", offset)}>
      <button
        type="button"
        onClick={() => onOpen(album)}
        className="group flex w-full max-w-[340px] cursor-pointer flex-col items-center gap-4 rounded-glass pb-2 text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neon-500"
      >
        {/* 整个堆叠区统一倾一个很小的角度，和相邻卡片形成错落；
            高度按本组叠放后最高的一层算，随照片比例变化 */}
        <span
          className="relative block w-full"
          style={{
            height: stackHeight,
            transform: `rotate(${tilt}deg) scale(${scale})`,
          }}
        >
          {stackPhotos.map((photo, layerIndex) => {
            const layer = preset[layerIndex];
            const isFront = layerIndex === 0;

            return (
              <span
                key={photo.id}
                className="photo-stack-layer absolute left-1/2 top-1/2 block rounded-[4px] bg-white p-1.5 shadow-[0_18px_45px_-18px_rgba(0,0,0,0.9)]"
                style={
                  {
                    width: COVER_WIDTH,
                    zIndex: layer.z,
                    "--x": `${layer.x}px`,
                    "--y": `${layer.y}px`,
                    "--rot": `${layer.rot}deg`,
                    "--hover-x": `${layer.hoverX}px`,
                    "--hover-y": `${layer.hoverY}px`,
                    "--hover-rot": `${layer.hoverRot}deg`,
                  } as CSSProperties
                }
              >
                {/* 内图按源文件宽高比撑高，白框高度随图变化，竖图更高 */}
                <span className="relative block overflow-hidden bg-ink-800">
                  {/* 堆叠图只是装饰，集名、简介与张数已构成按钮的可读名称 */}
                  <Image
                    src={photo.src}
                    alt=""
                    width={photo.width}
                    height={photo.height}
                    sizes="260px"
                    className={cn(
                      "block h-auto w-full",
                      isFront &&
                        "group-hover:scale-110 group-focus-visible:scale-110 transition-transform duration-600",
                    )}
                  />

                  {/* 只有最上方的主图挂 hover 遮罩：下半 50% 固定渐变，
                      hover 时整体淡入；张数与 CTA 从下方 10px 错峰上浮淡入 */}
                  {isFront && (
                    <span className="absolute inset-x-0 bottom-0 flex h-1/2 flex-col items-start justify-end gap-0.5 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-2 pb-4 text-left opacity-0 transition-opacity duration-[400ms] ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
                      <span className="block translate-y-2.5 font-xiaowei text-[18px] leading-3 text-white/80 opacity-0 transition-all duration-[200ms] ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:delay-[90ms] group-focus-visible:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:delay-[90ms] mb-2">
                        {album.photos.length} 张照片
                      </span>
                      <span className="block translate-y-2.5 font-xiaowei text-[13px] leading-3 text-neon-500 opacity-0 transition-all duration-[200ms] ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:delay-[130ms] group-focus-visible:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:delay-[130ms]">
                        Click to Open →
                      </span>
                    </span>
                  )}
                </span>
              </span>
            );
          })}
        </span>

        <span className="block">
          <span className="flex flex-wrap items-center justify-center gap-2">
            <span className="font-xiaowei text-[20px] leading-6 text-white/90 group-hover:text-[#A18CFF] transition-color duration-400">
              {album.title}
            </span>
            <span className="glass-panel inline-flex h-6 items-center rounded-[6px] px-2 text-[10px] leading-none text-white/50 tabular-nums font-yahei">
              {album.created_at}
            </span>
          </span>
          <span className="mt-1.5 line-clamp-3 text-xs leading-5 text-white/45 font-yahei">
            {album.description}
          </span>
        </span>
      </button>
    </li>
  );
}
