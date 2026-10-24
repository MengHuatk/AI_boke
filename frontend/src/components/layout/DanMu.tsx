"use client";

/**
 * 全站字体弹幕层（仅电脑端，lg 以上显示）。
 *
 * 由 SiteShell 渲染，垫在萤火虫层（-z-4）之上、正文所有内容之下：用负 z-index（-3）实现，
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
  "吾名正邪，生来即是天邪鬼！",
  "优雅乃高贵之证。",
  "医生的存在就是为了拯救痛苦的生命。",
  "幻想基于真实，真实引领幻想。",
  "地狱的存在并不是为了给人以惩罚。地狱是为了让生者从最初就不要背负罪孽而存在的。",
  "试图从什么东西那里逃走的人就是犯下了罪孽的人。试图在哪里藏身的人就是承认了自身罪孽的人。然后，承认了自身罪孽的犯罪者，将会开始狡辩呢。",
  "最最可怕的毒，就是一点一点的侵蚀身体的毒，侵蚀精神的毒。",
  "所谓信仰，也就是对其物的存在心生敬意，为己身免于遭惩心怀畏惧，是令生命，精神，身体都得到升华的象征。",
  "真正的恐怖，存在于约定俗成的恐怖之外。",
  "忘记成佛的亡灵无法诞生出新的生命。不会死亡的人类无法知晓色彩鲜明的冥界。生生生生暗生始死死死死冥死终。",
  "真相用眼睛是看不见的，用耳朵是听不到的，真相是通过斩而得知的。师傅曾经这么告诉过我。所以，一切不斩就无法开始。剑会引导我发现真相。",
  "清流の清濁はその源にある",
  "泰山は土壌を譲らず",
  "以天制大地，以地除要枢",
  "纵使只有一线蛛丝，也可籍此找到极乐的境界。",
  "所谓历史，就是在寻常的时候让时间前进，在非同寻常的时候将时间的前进状态记录下来的东西。",
  "完美潇洒の女仆",
  "全人类の绯想天",
  "一辈子、和我一起组乐队吗?",
  "如果在感受悲伤前 能先收集泪水准备好的话 我心想不知道这样该有多好",
  "好想成为人",
  "我能做的就是拼命地去唱歌!因为我的歌是内心的呐喊!",
  "所以我才、不想组什么乐队的······",
  "需要 我需要爱音 不能少了爱音!",
  "让我们......让我们一起迷失吧",
  "一辈子都不会再分开!!",
  "迷失方向也无所谓,在迷茫中前进吧!!",
  "不过、只要好好努力避免重蹈覆辙不就好了吗?",
  "我没有逃避!!",
  "迷路啊······那么…要不要一起前进? 一起在迷失之中前进",
  "我们都等2小时56分31秒了耶",
  "我爱慕虚荣啦!",
  "我不会退出乐队的。所以Soyorin也别退出哦!",
  "有趣的女人",
  "无趣的女孩子",
  "我以为那里会一辈子都在。虽然现在没有了",
  "不过、她说过总会有人再创造新的栖身之处",
  "······为什么重要的话总是说不出口呢",
  "为什么要演奏春日影!?",
  "不是这样的、我是真的很珍视大家、很喜欢大家!",
  "不要误会了 我是来结束这一切的。",
  "谢谢你没有放开我",
  "其实我呢、从以前就不是很适应小灯写的歌词",
  "我想我大概、一辈子也忘不了CRYCHIC吧!",
  "这家伙根本什么也不懂!我要拉黑他",
  "我发誓 我愿意一辈子和灯在一起",
  "让我觉得这样的自己也能继续活下去",
  "吵死了、是大！成功啦!",
  "这些你全都知道、却一直在背叛她吗!!",
  "你这个人，满脑子都是你自己呢",
  "我从来没觉得组乐队开心过",
  "是又怎样？我说啊，用这种态度和人讲话……",
  "不过，为了下次不失败努力不就好了，就算失败一次，也要有重来的信心，不然人生这么长，怎么过得下去。",
  "因为春日影是一首好歌。",
  "你不仅表里不一，又满口谎言，而且挺坏心眼的不是吗？",
  "诶？！！！等……等等等，是一辈子喔？！每次说话都好沉重啊。",
  "是啊，这不是由我俩开始的乐队吗？",
  "拜托了（欧内盖）！要是没有祥酱你们的话，我（瓦塔西）……",
  "如果能累积这一个又一个的瞬间，也许就能变成一辈子。",
  "如果在感到悲伤之前，能先收集泪水准备好的话，我想这样该多好。我从以前，就觉得自己有点偏离这世界。为了不让自己偏离这世界，明明像大家一样交到了朋友，明明和大家在一起，却好像孤单一人。想成为真正的人。乐队……？如此耀眼，如此温柔，如此美丽，如此温暖，为什么只有自己流不出眼泪呢？是我太冷酷了吗？还是我身上少了什么东西呢？作为人类，像大家那样拥有的珍贵之物，我没有；像大家那样为之流泪的珍贵之物，我想要。真要说有的话，那就是……CRYCHIC了。",
   "等……等等，放开我；等……等等，别误会了，我是来结束一切的。",
   "“主唱太拼命了。”？这家伙根本什么也不懂，我要拉黑他！",
   "你这家伙，说这些认真的吗？之前为了乐队能够继续下去那么拼命,那些全部是骗人的吗？灯她，为了乐队继续那么烦恼、那么痛苦,这些你全部都知道，却一直在背叛她吗？",
   "从今往后我们就是乐队，是一起演奏音乐的命运共同体。",
   "“普通”和“理所当然”是什么呢？",
   "不过，不过，这一切的一切全都是我。畏畏缩缩哭哭啼啼的我，拥抱着所有一切的一切，稍微睡上一觉吧。痛痛啊痛痛啊快飞走吧，为了不让悲伤夺走一切，我会继续做自己的伙伴，在这遥遥的漫长路途中，就算稍微喘口气休息一下，相信也不会有人责怪我的。",
   "内心满是憔悴，眼神游动不止。我在这世上孤身一人，这不断凋零的春季中，每年都只感受到冰冷。在一片黑暗中，单向往前走着。",
   "照耀着无法哭泣的我，是光芒温柔地将我拥入怀中。在这阳光普照的世界，骄傲绽放的重要之人，知晓何谓温暖的春天。因为你我，而留下泪水。啊啊，多么地耀眼！啊啊，多么地美丽！穿过层层云朵，变得闪闪发光，内心的思绪满溢而出。脸颊回过神来，也正闪闪发光，热泪沾湿了我的脸庞。为什么你的手是如此地温暖？呐，拜托你，请你从此再也不要放手。",
   "置身十字路口正中央，混入熙来熙往的人群，唯独我漫无目的，有如漂流者一般。",
   "啊啊！那颗彷徨的星儿就是我啊，成为我自己！只有如此，我能做的只有如此。",
   "就算步伐多踉跄，我也是在挣扎着啊。",
   "啊啊！通透明亮的自由！若将一切重置清空，把宇宙当做云，将一切存入其中，干脆遗忘所有。今宵于影色下起舞，一无所知，亦无所求。不被任何法则束缚，只愿自由自在，肆意起舞。",
   "就算这场大雨就此停止，我也将永不忘怀向前行。那抬头仰望最初一滴雨滴的今天的我，透明的伞创造出的一人份的世界。",
   "你总是如此地努力，光是此刻站在这里，就已经是种战斗了。逃跑也无妨，就算看不见道路，就算迷失方向，也渴望持续奔驰，与你同行。",
   "我唱着，唱着连系起你我的手的诗。不希望将手松开，我们要永远在一起；我唱着，唱着让我们成为我们的诗，让我们在这里重新再出发吧！",
   "还真是高高在上呢。",
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
  countMin: 5,
  countSpan: 6,
  /** 轨道区间上下界，占本层高度的百分比 */
  topMin: 50,
  topMax: 84,
  durationMin: 10,
  durationMax: 29,
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
          className="absolute left-0 whitespace-nowrap font-danmu text-[20px] leading-none text-white/25"
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
