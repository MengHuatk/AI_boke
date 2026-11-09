import Image from "next/image";

import { SmartLink } from "@/components/ui/SmartLink";

export interface PhotoSpotlightData {
  albumTitle: string;
  albumDescription: string;
  photoSrc: string;
  photoAlt: string;
  photoCount: number;
}

/**
 * 右上相册精选（桌面 705×218）。
 *
 * 随机相片铺满整张卡，压一层薄渐变与极淡的紫粉双色调；
 * 相册标题放在玻璃胶囊里，下方叠一条 5px 粉色粗下划线并压住
 * 文字底部 2px，描述跟在胶囊下方。整卡可点进照片墙。
 */
export function PhotoSpotlight({
  albumTitle,
  albumDescription,
  photoSrc,
  photoAlt,
}: PhotoSpotlightData) {
  return (
    <div
      role="group"
      aria-label="相册精选"
      className="group media-text relative isolate h-[218px] w-full overflow-hidden rounded-glass bg-[#0a0f1d] shadow-[0_22px_60px_-24px_rgba(0,0,0,0.95)] transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_28px_70px_-26px_rgba(0,0,0,1),0_0_44px_-12px_rgba(144,110,255,0.45)]"
    >
      <Image
        src={photoSrc}
        alt={photoAlt}
        fill
        sizes="(min-width: 1280px) 705px, 100vw"
        className="object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-105"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#05080f]/92 via-[#05080f]/25 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-[#5D4CC2]/25 via-transparent to-[#FF8FC4]/12 mix-blend-screen"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2 z-10 rounded-[18px] "
      />

      {/* hover 顶部 1px 高光：只亮上沿，底部保持干净 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
      />



      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 p-7">
        <div className="w-fit rounded-[14px] px-4 py-2.5">
          <h2 className="relative inline-block font-xiaowei text-[28px] leading-none text-white/95">
            {albumTitle}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 -bottom-0.5 h-[5px] -rotate-[0.6deg] rounded-full bg-[#FF8FC4]/90"
            />
          </h2>
        </div>
        <p className="line-clamp-1 font-yahei text-[13px] leading-5 text-white/65">
          {albumDescription}
        </p>
      </div>

      <SmartLink
        href="/photos"
        aria-label={`查看相册：${albumTitle}`}
        className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-brand-400"
      >
        <span aria-hidden="true" />
      </SmartLink>
    </div>
  );
}
