/**
 * 运行期配置。
 *
 * 所有可变项都从环境变量读取（见 .env.example），代码里不出现魔法数字。
 * 改后端端口、改缓存时长、改首页展示条数，都只需要动 .env.local。
 */

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const apiConfig = {
  /** 后端 API 根地址，结尾多余的斜杠会被去掉 */
  baseUrl: (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1"
  ).replace(/\/+$/, ""),

  /** 接口结果缓存时长（秒） */
  revalidate: readNumber(process.env.NEXT_PUBLIC_API_REVALIDATE, 60),

  /** 单请求超时（毫秒），超时后回退到本地示例数据 */
  timeoutMs: readNumber(process.env.NEXT_PUBLIC_API_TIMEOUT_MS, 2500),
} as const;

export const uiConfig = {
  /** 用于 <html lang> 与日期格式化 */
  locale: process.env.NEXT_PUBLIC_LOCALE ?? "zh-CN",

  /** 首页精选文章条数 */
  homeFeaturedLimit: readNumber(process.env.NEXT_PUBLIC_HOME_FEATURED_LIMIT, 3),
} as const;

/**
 * 背景层配置。
 *
 * 页面背景由三层叠成：背景图轮播 → 极光光斑 → 噪点。
 * 留空 `images` 时退化成纯极光渐变（初版默认效果）。
 *
 * ⚠️ NEXT_PUBLIC_ 变量是构建期内联的，改完 .env.local 必须重启 dev server 才生效。
 */
export const backgroundConfig = {
  /**
   * 轮播的背景图，逗号分隔。图片放 public/ 下就填 "/images/backgrounds/a.jpg"，
   * 也可以直接填外链。留空数组表示不使用背景图，退化成纯极光渐变。
   *
   * 顺序即播放顺序；单张时不会启动轮播，等同于静态背景。
   */
  images: (process.env.NEXT_PUBLIC_BACKGROUND_IMAGES ?? "")
    .split(",")
    .map((src) => src.trim())
    .filter(Boolean),

  /** 每张图的停留时长（秒）。到点后交叉淡化到下一张 */
  intervalSeconds: readNumber(process.env.NEXT_PUBLIC_BACKGROUND_INTERVAL, 8),

  /** 背景图上的压暗遮罩强度，0–1。越大玻璃面板上的文字越清晰，照片越不明显 */
  imageDim: readNumber(process.env.NEXT_PUBLIC_BACKGROUND_IMAGE_DIM, 0.6),

  /**
   * 背景图模糊半径（px）。适度模糊能让照片不抢玻璃面板的焦点。0 = 不模糊。
   * 默认 12px：照片退成一片柔和色晕，仍认得出构图走向，但高频纹理不再干扰
   * 玻璃面板上的浅色文字。半径超过 20 就基本只剩色相，等于放弃了照片本身。
   */
  imageBlur: readNumber(process.env.NEXT_PUBLIC_BACKGROUND_IMAGE_BLUR, 12),

  /** 背景图整体不透明度，0–1 */
  imageOpacity: readNumber(process.env.NEXT_PUBLIC_BACKGROUND_IMAGE_OPACITY, 1),

  /**
   * 是否保留极光光斑。
   * 设为 false 就只剩背景图 + 噪点，显得更「素」，但玻璃质感会弱一些。
   */
  aurora: (process.env.NEXT_PUBLIC_BACKGROUND_AURORA ?? "true") !== "false",
} as const;