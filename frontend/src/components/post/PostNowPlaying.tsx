"use client";

import { useMusic } from "@/components/music/MusicProvider";
import { LyricViewport } from "@/components/music/LyricViewport";
import { coverBackground } from "@/lib/music";

/**
 * 文章页右轨「正在播放」盒（320×210）。
 *
 * 自上而下：固定标题 NOW PLAYING → 50px 黑胶唱片 + 歌名/歌手 →
 * 270×60 单行歌词区。唱片播放时匀速旋转、暂停停在当前帧；
 * 歌词的打字 / 停留 / 退格循环与光标由 LyricViewport 统一提供，
 * 首页大字歌词盒复用同一份实现。
 *
 * 状态全部来自 MusicProvider，和音乐页大播放器、右下角迷你盒同源。
 */
export function PostNowPlaying() {
  const { track, playing, elapsed } = useMusic();

  if (!track) {
    return (
      <div
        role="group"
        aria-label="正在播放"
        className="glass-panel-thick flex h-[210px] w-full shrink-0 flex-col justify-between rounded-glass px-6 py-5"
      >
        <span className="font-xiaowei text-[16px] leading-none tracking-[0.22em] text-white/85">
          NOW PLAYING
        </span>
        <p className="font-yahei text-[13px] text-white/45">
          还没有音乐，去后台添加曲目吧。
        </p>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="正在播放"
      className="glass-panel-thick flex h-[210px] w-full shrink-0 flex-col justify-between rounded-glass px-6 py-5"
    >
      <span className="font-xiaowei text-[16px] leading-none tracking-[0.22em] text-white/85">
        NOW PLAYING
      </span>

      {/* 音乐状态区：左唱片 + 右歌名/歌手 */}
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="vinyl-spin grid size-[50px] shrink-0 place-items-center rounded-full border border-white/15 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.25)]"
          style={{
            background: coverBackground(track.cover),
            animationPlayState: playing ? "running" : "paused",
          }}
        >
          <span className="size-[7px] rounded-full bg-[#0a1424] ring-1 ring-white/30" />
        </span>

        <div className="min-w-0">
          <p className="truncate font-yahei text-[14px] leading-5 text-white/90">
            {track.title}
          </p>
          <p className="truncate font-yahei text-[11px] leading-4 text-white/45">
            {track.artist}
          </p>
        </div>
      </div>

      {/* 歌词区 270×60：单行打字机，滚动与渐隐由 LyricViewport 处理 */}
      <LyricViewport
        track={track}
        playing={playing}
        elapsed={elapsed}
        className="h-[60px] w-[270px] glass-panel rounded-[16px]"
      />
    </div>
  );
}
