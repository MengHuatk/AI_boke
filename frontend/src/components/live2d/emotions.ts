import type { AnonEmotion } from "@/lib/types";

/**
 * 情绪到模型表情文件的映射。
 *
 * 文件名取自模型自带的 Expressions 目录，必须带 `.exp3` 后缀；
 * neutral 不设表情，靠复位回到默认脸。
 */
export const EMOTION_EXPRESSIONS: Record<AnonEmotion, string | null> = {
  happy: "exp_smile01.exp3",
  excited: "exp_bsmile01.exp3",
  sad: "exp_sad01.exp3",
  angry: "exp_angry01.exp3",
  surprised: "exp_surprised01.exp3",
  shy: "exp_shy01.exp3",
  thinking: "exp_thinking01.exp3",
  neutral: null,
};

/**
 * 气泡和表情共用的时长。
 *
 * 先按 25ms/字逐字显示（最多 1.2 秒），再按 150ms/字停留；
 * 停留最低 3 秒、最高 20 秒。totalMs 包含逐字阶段，
 * 保证表情和气泡同时结束。
 */
export function replyTiming(reply: string) {
  const chars = [...reply].length;
  const revealMs = Math.min(1200, chars * 25);
  const holdMs = Math.max(3000, Math.min(20000, chars * 150));

  return { revealMs, totalMs: revealMs + holdMs };
}
