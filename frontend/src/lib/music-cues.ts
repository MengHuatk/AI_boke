import type { AnonEmotion } from "@/lib/types";

/** 一首歌在某个时间点触发的看板娘台词 */
export interface MusicCue {
  /** 播放到第几秒触发 */
  at: number;
  /** 气泡里显示的文本 */
  text: string;
  /** 同时切换的表情 */
  emotion: AnonEmotion;
  /** 可选：模型动作组名，例如 mtn_smile01_C；留空则只切表情 */
  motion?: string;
}

/** 音乐台词事件名；MusicCueBridge 派发，AnonChat 订阅 */
export const ANON_CUE_EVENT = "anon:music-cue";

/**
 * 曲目 id → 时间轴台词。
 *
 * 曲目 id 与后端 /api/v1/music 返回的 id 对齐；时间单位是秒，
 * 和播放进度共用同一套计时。
 * 已触发过的台词不会重复；往回拖动后重新播放到该时间点可以再次触发。
 * 当前给春日影配了开场一句，其余曲目照这个格式追加。
 *
 * 常用动作组（8 套 adv_* 服装完全一致）：
 * mtn_smile01_C、mtn_sad01_C、mtn_surprised01_C、mtn_thinking01_C、
 * mtn_nod01_C、mtn_wink01_C、mtn_bye01_C、mtn_kime01_C。
 */
export const MUSIC_CUES: Record<string, MusicCue[]> = {
  "chun-ri-ying": [
    {
      at: 0,
      text: "为什么要演奏春日影？！",
      emotion: "angry",
      motion: "mtn_angry01_C",
    },
    {
     at: 5,
      text: "soyorin当时这么说的时候我们可是吓了一跳呢~",
      emotion: "surprised",
      motion: "mtn_smile01_C",
    },
       {
     at: 15,
      text: "可是我认为春日影是一首好歌呢~嘿嘿",
      emotion: "happy",
      motion: "mtn_thinking01_C",
    },
  ],
  "sora-no-musica":[
    {
      at: 1,
      text: "柿本广大我*你仙人！！",
      emotion: "angry",
      motion: "mtn_nod01_C",
    },
      {
      at: 6,
      text: "不过歌很好听呢~最后大家一起包寿司吧~",
      emotion: "excited",
      motion: "mtn_nod01_C",
    },
      {
      at: 235,
      text: "前往明天吧~美好的时代",
      emotion: "happy",
      motion: "mtn_bye01_C",
    },
      {
      at: 244,
      text: "人会逐渐忘却，一切终将消逝",
      emotion: "happy",
      motion: "mtn_wink01_C",
    },
  
  ],
  "meisei-kyou":[
     {
      at: 1,
      text: "It's MyGO!!!!!",
      emotion: "happy",
      motion: "mtn_smile01_C",
    },
  ],
  "rinpuu":[
    {
       at: 1,
      text: "整曲都弥漫着一股不肯和解，不肯忘记，不肯原谅的味道啊......真是执着呢，soyorin",
      emotion: "thinking",
      motion: "mtn_thinking01_C",
    }
  ],
  "wo-hai-nian-qing":[
 {
       at: 244,
      text: "登神长阶~",
      emotion: "happy",
      motion: "mtn_thinking01_C",
    }
  ],
 "hekiten-bansou":[
 {
       at: 1,
      text: "这一次我不会再逃避了！",
      emotion: "happy",
      motion: "mtn_smile01_C",
    }
  ],
  "hito-shizuku-sora":[
     {
       at: 1,
      text: "开始吧，属于我们一辈子的约定!",
      emotion: "happy",
      motion: "mtn_smile01_C",
    }
  ]
};
