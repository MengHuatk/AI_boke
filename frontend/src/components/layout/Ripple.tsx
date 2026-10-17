"use client";

/**
 * 全站点击涟漪层。
 *
 * 由 SiteShell 渲染一次，监听 window 上的冒泡 click：鼠标在页面任意位置单击（抬起）
 * 那一刻记录坐标，叠出一枚涟漪，跑完动画后自行摘掉。
 *
 * 层级用正 z-index（60）而不是像其他装饰层那样走负值：涟漪要盖在正文、导航之上
 * 才看得见；pointer-events-none 保证它只被看、不被点，不挡任何交互。
 *
 * 一枚涟漪是两层 span，共用同一个锚点：
 *   - 外层尺寸 0，只负责把原点钉在点击坐标上（left/top 即 clientX/clientY，
 *     容器是 fixed inset-0，视口坐标系天然对齐，不需要减 offset）；
 *   - 内层两个兄弟各自用负 left/top 把自己中心对到锚点上，互不影响；
 *   - 实心圆 10px（background 填充）+ 空心圆 25px（border 描边），半径差留出可见间隙，
 *     空心圆把实心圆包在里面，两者圆心重合。
 *
 * 两个圆共用一条关键帧 ripple-out：同 0.8s、同 ease-out、同起止缩放，
 * 从 scale(0.3) 涨到各自的 1 倍尺寸，同时 opacity 1 → 0，于是"由小变大"和
 * "慢慢透明消失"是同一段过程。缩放是相对各自尺寸的，所以外圈绝对位移更大，
 * 视觉上就是圈在外面扩散。
 *
 * 动画结束只挂在空心圆上：实心圆的 animationend 会冒泡到锚点外层但够不着兄弟节点，
 * 挂在这儿每枚涟漪恰好触发一次移除，不会重复 setState。
 *
 * 连续点击不做去抖、不互相顶替：多枚涟漪在同一层里各自独立播放、各自到期消失。
 *
 * 关键帧写在组件内的 <style> 里，不散到全局 CSS：本组件自带全部样式，
 * 改动只落在这一个文件。
 */

import { useEffect, useState, type CSSProperties } from "react";

interface Ripple {
  /** 自增 id，仅作列表 key */
  id: number;
  /** 点击位置，视口坐标 px */
  x: number;
  y: number;
}

const COLOR = "122 138 255";
const CORE_SIZE = 60;
const RING_SIZE = 125;
const RING_BORDER = 3;

let nextId = 0;

const CSS = `
@keyframes ripple-out {
  from {
    transform: scale(0.3);
    opacity: 1;
  }
  to {
    transform: scale(1);
    opacity: 0;
  }
}
`;

export function Ripple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      setRipples((prev) => [...prev, { id: nextId++, x: event.clientX, y: event.clientY }]);
    }

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  function dismiss(id: number) {
    setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    >
      <style>{CSS}</style>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          style={{ position: "absolute", left: ripple.x, top: ripple.y }}
        >
          <span
            style={
              {
                position: "absolute",
                width: `${CORE_SIZE}px`,
                height: `${CORE_SIZE}px`,
                left: `${-CORE_SIZE / 2}px`,
                top: `${-CORE_SIZE / 2}px`,
                borderRadius: "9999px",
                background: `rgb(${COLOR} / 0.15)`,
                animation: "ripple-out 0.8s ease-out forwards",
              } as CSSProperties
            }
          />
          <span
            onAnimationEnd={() => dismiss(ripple.id)}
            style={
              {
                position: "absolute",
                width: `${RING_SIZE}px`,
                height: `${RING_SIZE}px`,
                left: `${-RING_SIZE / 2}px`,
                top: `${-RING_SIZE / 2}px`,
                borderRadius: "9999px",
                border: `${RING_BORDER}px solid rgb(${COLOR} / 0.65)`,
                animation: "ripple-out 0.8s ease-out forwards",
              } as CSSProperties
            }
          />
        </span>
      ))}
    </div>
  );
}
