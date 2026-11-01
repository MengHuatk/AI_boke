"use client";

import { MusicComments } from "@/components/music/MusicComments";
import { MusicPlayer } from "@/components/music/MusicPlayer";
import { useMusic } from "@/components/music/MusicProvider";
import { MusicRightPanel } from "@/components/music/MusicRightPanel";

/**
 * 音乐页主体。
 *
 * 版面按设计稿的固定尺寸搭：
 *   标题区贴在 1200px 面板左侧 →
 *   1200×637 双栏（481 播放器 / 687 歌词歌单）→
 *   1198px 宽、高度自适应的评论盒。
 *
 * 主区被 SiteShell 限制在 max-w-6xl（内容 1104px），1200 放不下，
 * 所以整块用「相对定位 + 左移 50% + 自平移 -50%」横向突破，
 * 并加 max-w-[calc(100vw-2rem)] 兜住窄屏，不会产生横向滚动。
 * 低于 xl（1280px）时双栏改为上下堆叠，高度改由内容撑开。
 *
 * 播放状态和唯一的 <audio> 都在根布局的 MusicProvider 里，
 * 这里只消费状态，所以离开音乐页后音乐继续播放；
 * 全屏雨幕同样在根布局，播放期间全站都会下雨。
 */
export function MusicStage() {
  const {
    tracks,
    track,
    trackIndex,
    playing,
    elapsed,
    duration,
    volume,
    order,
    togglePlay,
    goPrev,
    goNext,
    seek,
    selectTrack,
    changeVolume,
    cycleOrder,
  } = useMusic();

  return (
    <section className="relative left-1/2 flex w-[1200px] max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col gap-8">
      {/* 标题区：贴 1200px 面板左侧 */}
      <header className="flex flex-col gap-3">
        <h1 className="text-5xl font-xiaowei tracking-tight text-white sm:text-6xl xl:text-[64px]">
          云端乐律
        </h1>
        <p className="text-sm text-white/45 sm:text-[15px] font-xiaowei">
          在代码的缝隙中寻找灵魂的共鸣
        </p>
      </header>

      {/* 1200×637 双栏：481 播放器 + 687 歌词/歌单 */}
      <div className="grid gap-8 xl:grid-cols-[481px_687px]">
        <MusicPlayer
          track={track}
          playing={playing}
          elapsed={elapsed}
          duration={duration}
          volume={volume}
          order={order}
          onTogglePlay={togglePlay}
          onPrev={goPrev}
          onNext={goNext}
          onSeek={seek}
          onVolumeChange={changeVolume}
          onCycleOrder={cycleOrder}
        />

        <MusicRightPanel
          tracks={tracks}
          currentIndex={trackIndex}
          playing={playing}
          elapsed={elapsed}
          onSelectTrack={selectTrack}
          onSeek={seek}
        />
      </div>

      {/* 1198px 宽、高度自适应的评论盒 */}
      <MusicComments />
    </section>
  );
}
