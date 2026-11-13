import type { AnonMotion } from "@/lib/types";

/**
 * AI 语义动作到模型动作组的映射。
 *
 * 动作组名取自 8 套 adv_* 服装的 model3.json，统一用居中的 `_C` 版本；
 * none 不播动作，只保留表情和气泡。
 */
export const MOTION_GROUPS: Record<AnonMotion, string | null> = {
  none: null,
  nod: "mtn_nod01_C",
  shake_head: "mtn_denial01_C",
  wave: "mtn_bye01_C",
  smile: "mtn_smile01_C",
  laugh: "mtn_smile02_C",
  angry: "mtn_angry01_C",
  sad: "mtn_sad01_C",
  cry: "mtn_cry01_C",
  surprised: "mtn_surprised01_C",
  think: "mtn_thinking01_C",
  question: "mtn_question01_C",
  serious: "mtn_serious01_C",
  wink: "mtn_wink01_C",
  pose: "mtn_kime01_C",
};
