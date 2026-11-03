"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * 服务端渲染阶段没有 layout 阶段，退回 useEffect，避免 React 警告。
 * 客户端仍然使用 useLayoutEffect，保证 FLIP 的「读旧位置 → 改 DOM →
 * 读新位置 → 立即补间」在浏览器绘制前完成。
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

interface UseTalkFlipOptions {
  /** 标签切换或搜索应用后递增，驱动一次 FLIP */
  signal: number;
}

/**
 * 杂谈卡片的 FLIP 过渡。
 *
 * 每次渲染后记录当前卡片的 rect 与 DOM 节点；signal 变化时：
 * - 保留项：从旧 rect 补间到新 rect，按新 DOM 序 18ms 错峰；
 * - 淘汰项：把旧节点克隆到 body 上的 ghost 层，向下 40px 淡出；
 * - 新增项：从下方 40px 淡入。
 *
 * 调用方只在标签切换、搜索应用等需要重排的时机递增 signal；
 * 单纯的输入变化不会触发动画。
 */
export function useTalkFlip<T extends HTMLElement>({
  signal,
}: UseTalkFlipOptions) {
  const containerRef = useRef<T>(null);
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const prevNodesRef = useRef<Map<string, HTMLElement>>(new Map());
  const signalRef = useRef(signal);
  const animationsRef = useRef<Animation[]>([]);
  const ghostLayerRef = useRef<HTMLDivElement | null>(null);

  function cancelAnimations() {
    animationsRef.current.forEach((animation) => animation.cancel());
    animationsRef.current = [];
    ghostLayerRef.current?.remove();
    ghostLayerRef.current = null;
  }

  function animateCards(
    prevRects: Map<string, DOMRect>,
    prevNodes: Map<string, HTMLElement>,
    nextRects: Map<string, DOMRect>,
    nextNodes: Map<string, HTMLElement>,
  ) {
    const layer = document.createElement("div");
    layer.setAttribute("aria-hidden", "true");
    Object.assign(layer.style, {
      position: "fixed",
      inset: "0",
      zIndex: "40",
      pointerEvents: "none",
      overflow: "visible",
    });
    document.body.appendChild(layer);
    ghostLayerRef.current = layer;

    const orderById = new Map<string, number>();
    let fallbackOrder = 0;
    nextNodes.forEach((node, id) => {
      // 行优先的视觉序号由 TalkWall 写在 data-talk-order 上；
      // 没有时退回 DOM 顺序。
      const order = Number(node.dataset.talkOrder);
      orderById.set(id, Number.isFinite(order) ? order : fallbackOrder);
      fallbackOrder += 1;
    });

    function track(animation: Animation) {
      animationsRef.current.push(animation);
      animation.finished
        .then(() => animation.cancel())
        .catch(() => {});
    }

    // 保留项：旧位置 → 新位置
    nextRects.forEach((nextRect, id) => {
      const prevRect = prevRects.get(id);
      const node = nextNodes.get(id);
      if (!prevRect || !node) return;

      const dx = prevRect.left - nextRect.left;
      const dy = prevRect.top - nextRect.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

      const animation = node.animate(
        [
          { transform: `translate3d(${dx}px, ${dy}px, 0)` },
          { transform: "none" },
        ],
        {
          duration: 420,
          delay: (orderById.get(id) ?? 0) * 18,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        },
      );
      track(animation);
    });

    // 淘汰项：在旧位置克隆一张卡，向下淡出
    const ghostAnimations: Animation[] = [];
    prevRects.forEach((prevRect, id) => {
      if (nextRects.has(id)) return;

      const oldNode = prevNodes.get(id);
      if (!oldNode) return;

      const ghost = oldNode.cloneNode(true) as HTMLElement;
      ghost.removeAttribute("data-talk-id");
      ghost.classList.remove("view-fade", "view-rise");
      ghost
        .querySelectorAll(".view-fade, .view-rise")
        .forEach((element) =>
          element.classList.remove("view-fade", "view-rise"),
        );
      Object.assign(ghost.style, {
        position: "fixed",
        left: `${prevRect.left}px`,
        top: `${prevRect.top}px`,
        width: `${prevRect.width}px`,
        height: `${prevRect.height}px`,
        margin: "0",
        pointerEvents: "none",
        transformOrigin: "top left",
      });
      layer.appendChild(ghost);

      const animation = ghost.animate(
        [
          { transform: "translate3d(0, 0, 0)", opacity: 1 },
          { transform: "translate3d(0, 40px, 0)", opacity: 0 },
        ],
        {
          duration: 320,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        },
      );
      ghostAnimations.push(animation);
      track(animation);
      animation.finished
        .then(() => ghost.remove())
        .catch(() => {});
    });

    if (ghostAnimations.length === 0) {
      layer.remove();
      if (ghostLayerRef.current === layer) ghostLayerRef.current = null;
    } else {
      Promise.allSettled(
        ghostAnimations.map((animation) => animation.finished),
      ).then(() => {
        layer.remove();
        if (ghostLayerRef.current === layer) ghostLayerRef.current = null;
      });
    }

    // 新增项：从下方浮现
    nextRects.forEach((_, id) => {
      if (prevRects.has(id)) return;

      const node = nextNodes.get(id);
      if (!node) return;

      const animation = node.animate(
        [
          { opacity: 0, transform: "translate3d(0, 40px, 0)" },
          { opacity: 1, transform: "none" },
        ],
        {
          duration: 420,
          delay: (orderById.get(id) ?? 0) * 18,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        },
      );
      track(animation);
    });
  }

  // 不传依赖数组：每次渲染后都要重新记录 rect，供下一次标签切换使用。
  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const shouldAnimate = signalRef.current !== signal;
    signalRef.current = signal;

    // 先收掉上一轮补间再测量：否则运行中的 transform 会混进 rect，
    // 快速连点标签时会把「目标位置」算歪。
    if (shouldAnimate) {
      cancelAnimations();
    }

    const nextNodes = new Map<string, HTMLElement>();
    const nextRects = new Map<string, DOMRect>();

    container
      .querySelectorAll<HTMLElement>("[data-talk-id]")
      .forEach((node) => {
        const id = node.dataset.talkId;
        if (!id) return;

        nextNodes.set(id, node);
        nextRects.set(id, node.getBoundingClientRect());
      });

    if (
      shouldAnimate &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      animateCards(
        prevRectsRef.current,
        prevNodesRef.current,
        nextRects,
        nextNodes,
      );
    }

    prevRectsRef.current = nextRects;
    prevNodesRef.current = nextNodes;
  });

  // 组件卸载时收掉还在跑的补间和 ghost，避免固定层留在 body 上。
  useEffect(() => {
    return () => {
      animationsRef.current.forEach((animation) => animation.cancel());
      animationsRef.current = [];
      ghostLayerRef.current?.remove();
      ghostLayerRef.current = null;
    };
  }, []);

  return containerRef;
}
