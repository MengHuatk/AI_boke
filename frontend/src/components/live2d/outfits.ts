/**
 * 右下角看板娘的服装清单。
 *
 * 只收录 8 套 `adv_*` 完整模型：每套都有 66 组动作和 36 个表情，
 * 后续 AI 表情可以直接复用。`live2d_anon_002_live_01*` 是同套 LIVE 服的
 * 简化/低画质版本（只有 9 组动作、0 个表情），不进轮播。
 */
export interface Live2DOutfit {
  /** localStorage 里持久化的稳定 id，不要用数组下标 */
  id: string;
  /** 控制栏里显示的中文名 */
  name: string;
  /** public/live2D/anon 下的目录名，同时也是 .model3.json 的文件名 */
  folder: string;
}

export const LIVE2D_OUTFITS: Live2DOutfit[] = [
  {
    id: "casual-spring",
    name: "春季便服",
    folder: "adv_live2d_anon_002_casual_spring_01",
  },
  {
    id: "casual-spring-glasses",
    name: "春季便服 · 眼镜",
    folder: "adv_live2d_anon_002_casual_spring_01_glasses",
  },
  {
    id: "live",
    name: "LIVE 服",
    folder: "adv_live2d_anon_002_live_01",
  },
  {
    id: "roomwear",
    name: "居家服",
    folder: "adv_live2d_anon_002_roomwear_01",
  },
  {
    id: "roomwear-glasses",
    name: "居家服 · 眼镜",
    folder: "adv_live2d_anon_002_roomwear_01_glasses",
  },
  {
    id: "school-summer",
    name: "夏季校服",
    folder: "adv_live2d_anon_002_school_summer_hs_1st",
  },
  {
    id: "school-winter",
    name: "冬季校服",
    folder: "adv_live2d_anon_002_school_winter_hs_1st",
  },
  {
    id: "school-winter-glasses",
    name: "冬季校服 · 眼镜",
    folder: "adv_live2d_anon_002_school_winter_hs_1st_glasses",
  },
];

/** 默认春季便服，也是 localStorage 里没有记录时的回退 */
export const DEFAULT_OUTFIT_ID = "casual-spring";

/** 模型文件名和目录名一致，集中在这里拼，避免 8 处手写路径 */
export function outfitModelPath(outfit: Live2DOutfit): string {
  return `/live2D/anon/${outfit.folder}/${outfit.folder}.model3.json`;
}
