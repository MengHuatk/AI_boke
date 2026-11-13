"use client";

import { useEffect, useRef } from "react";

import { useMusic } from "@/components/music/MusicProvider";
import { ANON_CUE_EVENT, MUSIC_CUES, type MusicCue } from "@/lib/music-cues";

interface MusicCueBridgeProps {
  /** 模型加载完成后才接收台词 */
  enabled: boolean;
}

/**
 * 监听播放进度，在跨过配置的时间点时派发台词事件。
 *
 * 只有这个组件订阅 useMusic：播放进度每 250ms 更新一次，
 * 如果让 Live2DAnon 直接订阅，整棵模型组件树都会跟着重渲染。
 * 返回 null，不参与布局。
 */
export function MusicCueBridge({ enabled }: MusicCueBridgeProps) {
  const { track, playing, elapsed } = useMusic();
  const previousRef = useRef(elapsed);
  const trackIdRef = useRef(track.id);
  const playingRef = useRef(false);

  useEffect(() => {
    const previous = previousRef.current;
    const trackChanged = trackIdRef.current !== track.id;
    const started = !playingRef.current && playing;

    trackIdRef.current = track.id;
    previousRef.current = elapsed;
    playingRef.current = playing;

    // 切歌、暂停、模型未完成加载时只更新游标，不补发错过的台词
    if (!enabled || !playing) return;

    const cues = MUSIC_CUES[track.id];
    if (!cues) return;

    // 0 秒台词在开始播放、切到本曲、或拖回开头时立刻触发；
    // 其余台词只在播放进度跨过时间点时触发。
    const restarted =
      trackChanged || (started && elapsed < 1) || (previous > 1 && elapsed < 1);

    for (const cue of cues) {
      const atStart = cue.at === 0 && restarted;
      const crossed = !trackChanged && previous < cue.at && elapsed >= cue.at;

      if (atStart || crossed) {
        window.dispatchEvent(
          new CustomEvent<MusicCue>(ANON_CUE_EVENT, { detail: cue }),
        );
      }
    }
  }, [enabled, playing, elapsed, track.id]);

  return null;
}
