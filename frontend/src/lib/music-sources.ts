/**
 * 音频源配置。
 *
 * 展示数据（标题、歌手、歌词、封面）仍然放在 music-fixtures.ts，
 * 这里只维护「曲目 id → 音频地址」。没有配置的曲目会退回静态骨架
 * （1 秒定时器模拟进度），可以逐首迁移，不影响其他曲目。
 *
 * 地址可以是站内相对路径（如 /audio/xxx.m4a），也可以是浏览器
 * 能直接请求的外部直链。第三方平台带签名的临时链接会过期，
 * 防盗链也可能按 Referer 拒绝，都不适合放在这里。
 */
export const MUSIC_AUDIO_SOURCES: Partial<Record<string, string>> = {
  // 文件实际是 MP4 容器；若部分浏览器不认 .aac 后缀，改名为 .m4a 后同步路径
  "chun-ri-ying": "/audio/chunriying.aac",
  "hito-shizuku-sora": "/audio/壱雫空.mp3",
  "sora-no-musica": "/audio/天球(そら)のMúsica.mp3",
  "kageiro-mai": "/audio/影色舞.mp3",
  "hekiten-bansou": "/audio/碧天伴走.mp3",
  "rinpuu": "/audio/輪符雨.mp3",
  // 文件名带尾随空格，URL 里用 %20
  "meisei-kyou": "/audio/迷星叫%20.mp3",
  "kodoku-kanja": "/audio/孤独患者填词.mp3",
  "wo-hai-nian-qing": "/audio/我还年轻填词.mp3",
};
