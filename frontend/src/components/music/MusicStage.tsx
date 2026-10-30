"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MusicComments } from "@/components/music/MusicComments";
import { MusicPlayer } from "@/components/music/MusicPlayer";
import { MusicRightPanel } from "@/components/music/MusicRightPanel";
import { MUSIC_TRACKS, type PlayOrder } from "@/lib/music-fixtures";
import { MUSIC_AUDIO_SOURCES } from "@/lib/music-sources";

/** 播放模式轮换顺序：顺序 → 单曲 → 随机 */
const ORDER_CYCLE: PlayOrder[] = ["sequence", "single", "shuffle"];

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
 * 音频源由 music-sources.ts 按曲目 id 配置：有直链的曲目由
 * <audio> 驱动真实的进度、时长、音量与结束切歌；没配置的曲目
 * 仍用 1 秒定时器模拟进度，静态骨架随时可用。
 */
export function MusicStage() {
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(70);
  const [order, setOrder] = useState<PlayOrder>("sequence");
  const [loadedDuration, setLoadedDuration] = useState<{
    trackIndex: number;
    seconds: number;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const track = MUSIC_TRACKS[trackIndex];
  const src = MUSIC_AUDIO_SOURCES[track.id];
  // 真实音频的 metadata 加载前，先用 fixtures 里的占位时长
  const duration =
    loadedDuration?.trackIndex === trackIndex
      ? loadedDuration.seconds
      : track.duration;

  const selectTrack = useCallback((index: number) => {
    setTrackIndex(index);
    setElapsed(0);
    setPlaying(true);
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, []);

  /** 进度条、歌词跳转共用：同步 UI 状态和真实音频位置 */
  const seek = useCallback(
    (seconds: number) => {
      setElapsed(seconds);
      if (src && audioRef.current) audioRef.current.currentTime = seconds;
    },
    [src],
  );

  const goNext = useCallback(() => {
    setTrackIndex((current) => {
      if (order !== "shuffle") return (current + 1) % MUSIC_TRACKS.length;
      // 随机模式下跳过当前曲目，保证每次切歌都有变化
      const offset = 1 + Math.floor(Math.random() * (MUSIC_TRACKS.length - 1));
      return (current + offset) % MUSIC_TRACKS.length;
    });
    setElapsed(0);
  }, [order]);

  const goPrev = useCallback(() => {
    // 和常见播放器一致：进度超过 3 秒时先回到本曲开头
    if (elapsed > 3) {
      seek(0);
      return;
    }
    setTrackIndex(
      (current) => (current - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length,
    );
    setElapsed(0);
  }, [elapsed, seek]);

  const togglePlay = useCallback(() => {
    setPlaying((value) => !value);
    setElapsed((value) => (value >= duration ? 0 : value));
  }, [duration]);

  const cycleOrder = useCallback(() => {
    setOrder(
      (current) =>
        ORDER_CYCLE[(ORDER_CYCLE.indexOf(current) + 1) % ORDER_CYCLE.length],
    );
  }, []);

  const changeVolume = useCallback((value: number) => {
    setVolume(value);
  }, []);

  // 音量状态同步到真实音频；src 变化时也要重设，
  // 因为 <audio> 是有直链时才挂载的
  useEffect(() => {
    const audio = audioRef.current;
    if (!src || !audio) return;
    audio.volume = volume / 100;
  }, [volume, src]);

  // 播放/暂停状态同步到真实音频；没有直链时没有 <audio>，直接跳过
  useEffect(() => {
    const audio = audioRef.current;
    if (!src || !audio) return;
    if (playing) void audio.play();
    else audio.pause();
  }, [playing, src]);

  // 静态骨架的进度模拟：只有在曲目没有外部直链时才启用
  useEffect(() => {
    if (!playing || src) return;
    const timer = window.setTimeout(() => {
      if (elapsed + 1 < track.duration) {
        setElapsed(elapsed + 1);
        return;
      }
      if (order === "single") {
        setElapsed(0);
        return;
      }
      goNext();
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [playing, elapsed, order, track.duration, goNext, src]);

  return (
    <section className="relative left-1/2 flex w-[1200px] max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col gap-8">
      {/* 有直链的曲目由真实音频驱动；没配置的曲目继续走模拟进度 */}
      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          hidden
          loop={order === "single"}
          onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) =>
            setLoadedDuration({
              trackIndex,
              seconds: event.currentTarget.duration,
            })
          }
          onEnded={goNext}
        />
      )}

      {/* 标题区：贴 1200px 面板左侧 */}
      <header className="flex flex-col gap-3">
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl xl:text-[64px]">
          云端乐律
        </h1>
        <p className="text-sm text-white/45 sm:text-[15px]">
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
          tracks={MUSIC_TRACKS}
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
