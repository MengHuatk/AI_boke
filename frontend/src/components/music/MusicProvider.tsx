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

import type { MusicTrack, PlayOrder } from "@/lib/music";

/** 播放模式轮换顺序：顺序 → 单曲 → 随机 */
const ORDER_CYCLE: PlayOrder[] = ["sequence", "single", "shuffle"];

interface MusicContextValue {
  tracks: MusicTrack[];
  /** 曲库为空时为 null；消费组件需要自行处理空态 */
  track: MusicTrack | null;
  trackIndex: number;
  playing: boolean;
  elapsed: number;
  /** 当前曲目时长：有外部音频时是真实时长，否则取曲目里的占位值 */
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

interface MusicProviderProps {
  children: ReactNode;
  /** 根布局从 /api/v1/music 取到的已发布曲目 */
  tracks: MusicTrack[];
}

/**
 * 全站音乐状态。
 *
 * 播放状态和唯一的 <audio> 都放在根布局这一层：站内切页时
 * Provider 不会卸载，音乐连续播放，进度也不会重置；
 * 音乐页的大播放器、雨幕和全站小盒子读的是同一份状态。
 *
 * 有音频地址的曲目由 <audio> 驱动真实进度、时长与结束切歌；
 * 没有音频地址的曲目仍用 1 秒定时器模拟进度，和原先一致。
 * 曲库为空时 track 为 null，由各消费组件渲染空态或隐藏自身。
 */
export function MusicProvider({ children, tracks }: MusicProviderProps) {
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

  // 曲库变短（例如后台删歌）时把下标收回有效范围。
  useEffect(() => {
    setTrackIndex((current) => {
      if (tracks.length === 0) return 0;
      return Math.min(current, tracks.length - 1);
    });
  }, [tracks.length]);

  const track = tracks[trackIndex] ?? null;
  const src = track?.audio_url || undefined;
  // 真实音频的 metadata 加载前，先用曲目里的占位时长
  const duration = track
    ? loadedDuration?.trackIndex === trackIndex
      ? loadedDuration.seconds
      : track.duration
    : 0;

  const selectTrack = useCallback(
    (index: number) => {
      if (index < 0 || index >= tracks.length) return;

      setTrackIndex(index);
      setElapsed(0);
      setPlaying(true);
      if (audioRef.current) audioRef.current.currentTime = 0;
    },
    [tracks.length],
  );

  /** 进度条、歌词跳转共用：同步 UI 状态和真实音频位置 */
  const seek = useCallback(
    (seconds: number) => {
      setElapsed(seconds);
      if (src && audioRef.current) audioRef.current.currentTime = seconds;
    },
    [src],
  );

  const goNext = useCallback(() => {
    if (tracks.length === 0) return;

    setTrackIndex((current) => {
      if (order !== "shuffle" || tracks.length === 1) {
        return (current + 1) % tracks.length;
      }
      // 随机模式下跳过当前曲目，保证每次切歌都有变化
      const offset = 1 + Math.floor(Math.random() * (tracks.length - 1));
      return (current + offset) % tracks.length;
    });
    setElapsed(0);
  }, [order, tracks.length]);

  const goPrev = useCallback(() => {
    if (tracks.length === 0) return;

    // 和常见播放器一致：进度超过 3 秒时先回到本曲开头
    if (elapsed > 3) {
      seek(0);
      return;
    }
    setTrackIndex(
      (current) => (current - 1 + tracks.length) % tracks.length,
    );
    setElapsed(0);
  }, [elapsed, seek, tracks.length]);

  const togglePlay = useCallback(() => {
    if (!track) return;

    const audio = audioRef.current;
    // 播到结尾后再次播放，从本曲开头重新开始
    if (!playing && src && audio && audio.currentTime >= duration) {
      audio.currentTime = 0;
    }
    setPlaying((value) => !value);
    setElapsed((value) => (value >= duration ? 0 : value));
  }, [track, playing, src, duration]);

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
  // 因为 <audio> 是有音频地址时才挂载的
  useEffect(() => {
    const audio = audioRef.current;
    if (!src || !audio) return;
    audio.volume = volume / 100;
  }, [volume, src]);

  // 播放/暂停状态同步到真实音频；没有音频地址时没有 <audio>，直接跳过
  useEffect(() => {
    const audio = audioRef.current;
    if (!src || !audio) return;
    if (playing) void audio.play();
    else audio.pause();
  }, [playing, src]);

  // 静态骨架的进度模拟：只有在曲目没有外部音频时才启用
  useEffect(() => {
    if (!playing || src || !track) return;

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
  }, [playing, elapsed, order, track, goNext, src]);

  const value: MusicContextValue = {
    tracks,
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

      {/* 全站唯一的音频源；没有音频地址的曲目由上面的定时器模拟进度 */}
      {track && src && (
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
