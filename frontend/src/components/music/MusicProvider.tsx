"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  MUSIC_TRACKS,
  type MusicTrack,
  type PlayOrder,
} from "@/lib/music-fixtures";
import { MUSIC_AUDIO_SOURCES } from "@/lib/music-sources";

/** 播放模式轮换顺序：顺序 → 单曲 → 随机 */
const ORDER_CYCLE: PlayOrder[] = ["sequence", "single", "shuffle"];

interface MusicContextValue {
  tracks: MusicTrack[];
  track: MusicTrack;
  trackIndex: number;
  playing: boolean;
  elapsed: number;
  /** 当前曲目时长：有外部音频时是真实时长，否则取 fixtures 占位值 */
  duration: number;
  volume: number;
  order: PlayOrder;
  togglePlay: () => void;
  goNext: () => void;
  goPrev: () => void;
  seek: (seconds: number) => void;
  selectTrack: (index: number) => void;
  cycleOrder: () => void;
  changeVolume: (value: number) => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

/** 读取全站共享的播放状态；必须在 MusicProvider 内使用 */
export function useMusic() {
  const value = useContext(MusicContext);
  if (!value) {
    throw new Error("useMusic 必须在 MusicProvider 内使用");
  }
  return value;
}

/**
 * 全站音乐状态。
 *
 * 播放状态和唯一的 <audio> 都放在根布局这一层：站内切页时
 * Provider 不会卸载，音乐连续播放，进度也不会重置；
 * 音乐页的大播放器、雨幕和全站小盒子读的是同一份状态。
 *
 * 有直链的曲目由 <audio> 驱动真实进度、时长与结束切歌；
 * 没配置直链的曲目仍用 1 秒定时器模拟进度，和原先一致。
 */
export function MusicProvider({ children }: { children: ReactNode }) {
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
    const audio = audioRef.current;
    // 播到结尾后再次播放，从本曲开头重新开始
    if (!playing && src && audio && audio.currentTime >= duration) {
      audio.currentTime = 0;
    }
    setPlaying((value) => !value);
    setElapsed((value) => (value >= duration ? 0 : value));
  }, [playing, src, duration]);

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

  const value: MusicContextValue = {
    tracks: MUSIC_TRACKS,
    track,
    trackIndex,
    playing,
    elapsed,
    duration,
    volume,
    order,
    togglePlay,
    goNext,
    goPrev,
    seek,
    selectTrack,
    cycleOrder,
    changeVolume,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}

      {/* 全站唯一的音频源；没配置直链的曲目由上面的定时器模拟进度 */}
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
    </MusicContext.Provider>
  );
}
