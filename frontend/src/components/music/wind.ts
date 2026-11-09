/**
 * 全站共享的风场。
 *
 * 音乐雨的雨丝和首页樱花花瓣都读同一个 getWind(now)，才能保证两边
 * 的风向、相位完全同步；如果各自实现一份近似函数，时间一长必然漂移。
 *
 * 返回值在 -0.85–0.85 之间：一条约 20 秒的大风向 + 一条约 7 秒的阵风叠加。
 */
export function getWind(now: number) {
  const seconds = now / 1000;
  return (
    0.6 * Math.sin(seconds * 0.32) + 0.25 * Math.sin(seconds * 0.9 + 1.7)
  );
}

/** 风的最大斜率：雨丝的倾斜和横向位移共用同一个斜率 */
export const WIND_SLOPE = 0.22;
