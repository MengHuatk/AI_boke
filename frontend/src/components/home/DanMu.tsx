"use client";

/**
 * 首页字体弹幕层（仅电脑端，lg 以上显示）。
 *
 * 垫在萤火虫层（-z-4）之上、正文所有内容之下：用负 z-index（-3）实现，
 * pointer-events-none 保证完全不挡交互。整层只占视口上三分之一。
 *
 * 分工是「位移归 CSS、生灭归 JS」：
 *   - 每条只跑一条 danmu-drift，从视口右侧外匀速飘到左侧外，全程在合成器上；
 *   - JS 只在两个瞬间动作——出生时往列表加一条，onAnimationEnd 里摘掉它并排一次补位；
 *   - 没有逐帧计算，主线程活跃度与草地、萤火虫那两层基本同级。
 *
 * 四个不太显然的选择：
 *   - animation 带 forwards：否则动画结束那一帧元素会退回 left:0，在视口左边缘闪一下，
 *     而 React 真正把节点摘掉要等到下一次提交；
 *   - 不用负延迟错峰（草地与萤火虫的做法）：每条只跑一次，负延迟会让它一出生就已经在
 *     视口中间，「从最右飘进来」就不成立了。错峰改用出生延迟；
 *   - 不走 useSyncExternalStore 快照：那套适合「一次性生成、永不变更」的数据，这里的
 *     列表持续增删。水合安全改由更简单的路径保证——首帧渲染空数组，随机全关在 effect 里；
 *   - 竖向互不遮挡：层内按 25px 一条划成若干轨道（20px 文本 + 5px 间隙，见 TRACK_PITCH），
 *     每条弹幕出生时独占一条空闲轨道，出屏归还。开局槽位数被夹在轨道数以内，
 *     所以任一出生瞬间必有空闲轨道，不需要重试或抢占。
 *
 * 数量恒定不需要守卫：开局定下槽位数，此后每出一个补一个，总数锁在那个值上；
 * 补位留一点间隙，同屏数量就在该值上下小幅浮动，这就是「动态平衡」。
 */

import { useCallback, useEffect, useRef, useState } from "react";

/** 弹幕库。想换文案只改这个数组，博客内不提供切换入口 */
const DANMU_TEXTS: readonly string[] = [
  "今天也在填坑",
  "能跑就别动它",
  "先提交，再想想",
  "报错是红的，喜庆",
  "文档明天写",
  "Ctrl S 保平安",
  "凌晨三点，差一个分号",
  "重构一时爽",
  "这个需求很简单",
  "读三遍源码不如打印一下",
  "欢迎来到我的小站",
  "随便逛逛，不用客气",
  "写完就跑，跑不通再说",
  "明天开始学新框架",
  "这里曾是一条弹幕",
  "慢一点也是前进",
];

interface Danmu {
  /** 仅作 React key：列表会中途插入与摘除，用下标会让补位的那条复用到旧节点上 */
  id: number;
  /** 文案，从 DANMU_TEXTS 等概率随机取一条 */
  text: string;
  /** 距层顶，px。出生时从空闲轨道取得，轨道间距见 TRACK_PITCH */
  top: number;
  /** 横穿一次时长，s */
  duration: number;
}

/** 轨道间距 = 20px 文本高 + 5px 间隙；文本高与 JSX 里的 text-[20px] leading-none 联动，改字号要一起改 */
const TRACK_PITCH = 25;

const RANGE = {
  countMin: 3,
  countSpan: 6,
  /** 轨道区间上下界，占本层高度的百分比 */
  topMin: 50,
  topMax: 84,
  durationMin: 15,
  durationMax: 20,
  /** 开局把各条出生时刻铺开到的总时长，s */
  seedSweep: 8,
  /** 叠在出生基准间隔上的抖动，s */
  seedJitter: 1.5,
  respawnMin: 0.4,
  respawnMax: 2.2,
} as const;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** 登记定时器：触发时先把自己从集合里摘掉，免得未决列表无上限增长 */
function scheduleTimer(
  timers: Set<ReturnType<typeof setTimeout>>,
  run: () => void,
  seconds: number,
): void {
  const timer = setTimeout(() => {
    timers.delete(timer);
    run();
  }, seconds * 1000);
  timers.add(timer);
}

let nextId = 0;

/** 一条新弹幕：落在指定轨道上，文案与速度各自随机 */
function createDanmu(top: number): Danmu {
  return {
    id: nextId++,
    text: DANMU_TEXTS[Math.floor(Math.random() * DANMU_TEXTS.length)],
    top,
    duration: randomBetween(RANGE.durationMin, RANGE.durationMax),
  };
}

export function DanMu() {
  const [items, setItems] = useState<Danmu[]>([]);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  /** 全部轨道的 top 值（px），挂载时按视口高划定 */
  const tracks = useRef<number[]>([]);
  /** 被在场弹幕占用的轨道 */
  const usedTracks = useRef(new Set<number>());

  // 只碰 ref 与 setState，引用恒定，可安全进 effect 依赖
  const spawn = useCallback(() => {
    const free = tracks.current.filter((top) => !usedTracks.current.has(top));
    const top = free[Math.floor(Math.random() * free.length)];
    usedTracks.current.add(top);
    setItems((prev) => [...prev, createDanmu(top)]);
  }, []);

  useEffect(() => {
    // 轨道区间沿用 RANGE 的百分比上下界，换算成 px 后按 25px 等分
    const layerHeight = window.innerHeight / 3;
    const minTop = (layerHeight * RANGE.topMin) / 100;
    const maxTop = (layerHeight * RANGE.topMax) / 100;
    const trackCount = Math.floor((maxTop - minTop) / TRACK_PITCH) + 1;
    tracks.current = Array.from(
      { length: trackCount },
      (_, index) => minTop + index * TRACK_PITCH,
    );

    // 视口矮、轨道少时取小值，保证每条弹幕都独占得起一条轨道
    const count = Math.min(
      RANGE.countMin + Math.floor(Math.random() * RANGE.countSpan),
      trackCount,
    );

    // 基准间隔按 index 递增再叠抖动：纯随机会让两条撞在同一时刻，等间隔又显得机械
    for (let index = 0; index < count; index++) {
      const seedDelay =
        (index / count) * RANGE.seedSweep + randomBetween(0, RANGE.seedJitter);
      scheduleTimer(timers.current, spawn, seedDelay);
    }

    const pendingTimers = timers.current;
    const used = usedTracks.current;
    return () => {
      pendingTimers.forEach(clearTimeout);
      pendingTimers.clear();
      used.clear();
      tracks.current = [];
      setItems([]);
    };
  }, [spawn]);

  /** 出屏即消失并归还轨道，随机间隙后再补一条新的 */
  function handleExited(danmu: Danmu) {
    usedTracks.current.delete(danmu.top);
    setItems((prev) => prev.filter((item) => item.id !== danmu.id));
    scheduleTimer(
      timers.current,
      spawn,
      randomBetween(RANGE.respawnMin, RANGE.respawnMax),
    );
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[-3] hidden h-1/3 overflow-hidden lg:block"
    >
      {items.map((danmu) => (
        <span
          key={danmu.id}
          onAnimationEnd={() => handleExited(danmu)}
          className="absolute left-0 whitespace-nowrap font-danmu text-[20px] leading-none text-white/45"
          style={{
            top: `${danmu.top}px`,
            animation: `danmu-drift ${danmu.duration}s linear forwards`,
            fontFamily:"ZCOOL KuaiLe",
          }}
        >
          {danmu.text}
        </span>
      ))}
    </div>
  );
}
