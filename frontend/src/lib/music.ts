/**
 * 音乐数据模型与纯函数。
 *
 * 字段与后端 `MusicTrack` 保持一致；数据由根布局从 `/api/v1/music`
 * 取好后传给 MusicProvider，组件不再直接 import 本地曲目。
 */

export type PlayOrder = "sequence" | "single" | "shuffle";

export interface MusicLyricLine {
  /** 该行开始演唱的时间点（秒） */
  time: number;
  text: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  /** 总时长（秒） */
  duration: number;
  /** 封面地址：站内路径或外链 */
  cover: string;
  /** 音频地址；为空时前端用定时器模拟进度 */
  audio_url: string | null;
  lyrics: MusicLyricLine[];
}

/** 秒 → "m:ss"，播放器进度与歌单时长共用 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

/** 当前唱到第几行：最后一个 time ≤ elapsed 的行；还没到第一行时返回 -1 */
export function findActiveLine(
  lyrics: MusicLyricLine[],
  elapsed: number,
): number {
  let active = -1;
  for (let index = 0; index < lyrics.length; index += 1) {
    if (lyrics[index].time > elapsed) break;
    active = index;
  }
  return active;
}

/**
 * 把封面地址转成 CSS background。
 *
 * 后端只存 URL，不再存整段 `url(...) center / cover no-repeat`；
 * JSON.stringify 负责转义引号，避免管理端输入破坏内联样式。
 */
export function coverBackground(cover: string): string {
  return `url(${JSON.stringify(cover)}) center / cover no-repeat`;
}
