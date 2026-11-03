import Image from "next/image";
import type { CSSProperties } from "react";

import { SmartLink } from "@/components/ui/SmartLink";
import type { FriendLink } from "@/lib/types";

interface FriendCardProps {
  friend: FriendLink;
  /** DOM 序号，驱动 friend-rise 的错峰档位 */
  index: number;
}

/**
 * 300×152 友链卡片。
 *
 * 版式：头像 + 名字/ONLINE → 简介（至多三行，超出省略号）。
 * 头像沿用 PostSidebar 的渐变环，hover 时随整卡微微旋转；整卡的抬升
 * 与描边提亮来自 glass-interactive。
 *
 * 右下角的光是玻璃之下一层不接收指针事件的径向渐变：hover 时以右下角
 * 为原点放大并淡入，看上去像光从边缘向卡片中部渗开。
 *
 * 入场由 .friend-rise 负责，--i 来自 index；起点延迟与路由过渡对齐。
 */
export function FriendCard({ friend, index }: FriendCardProps) {
  return (
    <li className="w-full max-w-[300px]">
      <SmartLink
        href={friend.href}
        className="glass-panel friend-rise group relative flex h-[152px] w-full flex-col justify-center overflow-hidden rounded-glass px-4 py-4 transition-transform duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-brand-400"
        style={{ "--i": index } as CSSProperties}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 origin-bottom-right scale-90 rounded-glass opacity-0 transition-[opacity,transform] duration-500 ease-out group-hover:scale-110 group-hover:opacity-100 group-focus-visible:scale-110 group-focus-visible:opacity-100"
          style={{
            background:
              "radial-gradient(130% 130% at 100% 100%, rgb(169 164 255 / 0.44) 0%, rgb(169 164 255 / 0.14) 32%, transparent 68%)",
          }}
        />

        <div className="relative z-10 flex min-w-0 flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="shrink-0 rounded-full bg-gradient-to-br from-[#5D4CC2] to-[#A656DB] p-[4px] transition-transform duration-1200 ease-out group-hover:rotate-360 group-focus-visible:rotate-360">
              <Image
                src={friend.avatar}
                alt=""
                width={80}
                height={80}
                unoptimized
                className="block size-13 rounded-full object-cover"
              />
            </div>

            <div className="flex min-w-0 flex-col">
              <span className="truncate font-xiaowei text-[20px] leading-5 text-white/85 mb-1">
                {friend.name}
              </span>
              <span className="flex items-center gap-1.5 text-[14px] leading-3 tracking-[0.12em] text-[#A9A4FF]/85">
                <span className="animate-online-breathe size-[8px] shrink-0 rounded-full bg-[#A9A4FF]" />
                ONLINE
              </span>
            </div>
          </div>

          <p className="line-clamp-3 font-xiaowei text-[15px] leading-4 text-white/65 mt-2">
            {friend.bio}
          </p>
        </div>
      </SmartLink>
    </li>
  );
}
