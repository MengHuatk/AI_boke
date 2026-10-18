"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import { cn } from "@/lib/format";
import type { SiteConfig } from "@/lib/types";

interface CircleNavProps {
  site: SiteConfig;
  pathname: string;
}

/** 圆盘外框直径（px） */
const DRUM = 350;
/** 路由圆点直径（px） */
const ITEM = 60;
/** 路由圆点的轨道半径（距圆盘中心，px） */
const ORBIT = 120;
/** 拖拽降速系数：指针转过 1°，圆盘只转 0.5°，做出“慢速”手感 */
const DRAG_FACTOR = 0.5;
/** 松手后每帧的速度衰减倍率 */
const FRICTION = 0.95;
/** 超过这个拖动累计角度（°）就不再当作点击 */
const CLICK_SLOP = 4;

/** 与 Navbar 桌面端一致的当前路由判定：根路径精确匹配，其余匹配自身及子路径 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * 移动端圆形左轮导航（仅 md 以下渲染）。
 *
 * 收起时是贴右侧、垂直居中的半椭圆触发钮（#5C57FF，三个白点竖排）；
 * 点击后触发钮滑出视口，视口中央弹出 500px 圆盘（#161678）+ 半透明遮罩：
 * - 路由项是 60px 圆点（#344378，选中 #5C57FF 加微光），绕中心等距排列；
 * - 中心是 50px 取消钮（#5C57FF，X 图标），hover 变红并自转 90°，
 *   外面套 70px（#00008F）和 80px（#5266BF）两层静止环，不跟随旋转；
 * - 拖圆盘可让路由项跟着转（角度乘 DRAG_FACTOR 降速），松手惯性衰减。
 *
 * 性能约定：开合用 state；旋转角度存在 ref 里、经 --spin 直写 DOM，
 * 拖拽与惯性全程零 re-render。
 */
export function CircleNav({ site, pathname }: CircleNavProps) {
  const [open, setOpen] = useState(false);
  /** 入场过渡开关：挂载后下一帧置 true，让 scale/rotate 有过渡可跑 */
  const [entered, setEntered] = useState(false);
  /** 出场动画播放中：圆盘保留在 DOM 里播“缩小 + 反转 180°”，结束后才卸载 */
  const [exiting, setExiting] = useState(false);

  // 切了路由就走正常出场流程：渲染期调整 state（React 官方的派生 state 写法）
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (open) {
      setOpen(false);
      setExiting(true);
    }
  }

  /** 旋转层 DOM，--spin 就写在它身上 */
  const layerRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef(0);
  const velocityRef = useRef(0);
  const rafRef = useRef(0);
  const centerRef = useRef({ x: 0, y: 0 });
  const lastAngleRef = useRef(0);
  const draggingRef = useRef(false);
  const capturedRef = useRef(false);
  const draggedDistRef = useRef(0);

  // 入场：open 后的下一帧把 entered 置 true，transition 才有起点
  useEffect(() => {
    if (!open || entered) return;
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open, entered]);

  // 卸载时停掉可能还在跑的惯性循环
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const close = () => {
    if (!open) return;
    setOpen(false);
    setExiting(true);
  };

  /** 出场动画播完（transform 过渡结束）才真正卸载并复位，供下次干净地入场 */
  const onDrumTransitionEnd = (e: React.TransitionEvent) => {
    if (!exiting || e.propertyName !== "transform") return;
    setExiting(false);
    setEntered(false);
    spinRef.current = 0;
    velocityRef.current = 0;
  };

  const applySpin = useCallback(() => {
    layerRef.current?.style.setProperty("--spin", `${spinRef.current}deg`);
  }, []);

  // 窄视口下把圆盘整体缩到装得下；只在圆盘挂载期间读 window，首屏（SSR/水合）不碰
  const fit =
    open || exiting
      ? Math.min(
          1,
          (window.innerWidth * 0.94) / DRUM,
          (window.innerHeight * 0.94) / DRUM
        )
      : 1;

  const pointerAngle = (e: React.PointerEvent) => {
    const { x, y } = centerRef.current;
    return (Math.atan2(e.clientY - y, e.clientX - x) * 180) / Math.PI;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = layerRef.current!.getBoundingClientRect();
    centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    lastAngleRef.current = pointerAngle(e);
    draggingRef.current = true;
    capturedRef.current = false;
    draggedDistRef.current = 0;
    velocityRef.current = 0;
    cancelAnimationFrame(rafRef.current);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const angle = pointerAngle(e);
    let delta = angle - lastAngleRef.current;
    if (delta > 180) delta -= 360;
    else if (delta < -180) delta += 360;
    lastAngleRef.current = angle;

    spinRef.current += delta * DRAG_FACTOR;
    velocityRef.current = delta * DRAG_FACTOR;
    draggedDistRef.current += Math.abs(delta);

    // 确认是拖动后才捕获指针，避免吞掉圆点上的普通点击
    if (!capturedRef.current && draggedDistRef.current > CLICK_SLOP) {
      e.currentTarget.setPointerCapture(e.pointerId);
      capturedRef.current = true;
    }
    applySpin();
  };

  const onPointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    // 松手惯性：速度逐帧衰减，直到可忽略
    const coast = () => {
      velocityRef.current *= FRICTION;
      spinRef.current += velocityRef.current;
      applySpin();
      if (Math.abs(velocityRef.current) > 0.02) {
        rafRef.current = requestAnimationFrame(coast);
      }
    };
    rafRef.current = requestAnimationFrame(coast);
  };

  /** 刚发生过拖动就把这次 click 掐掉，防止拖完松手误触发跳转 */
  const onClickCapture = (e: React.MouseEvent) => {
    if (draggedDistRef.current > CLICK_SLOP) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const nav = site.nav;

  return (
    <div className="md:hidden">
      {/* 触发钮：贴右侧、垂直居中的半椭圆，三个白点竖排偏左 */}
      <button
        type="button"
        aria-label="打开导航"
        onClick={() => {
          // 出场动画期间禁用，等圆盘彻底消失才能重新打开
          if (!exiting) setOpen(true);
        }}
        className={cn(
          "fixed right-0 top-1/2 z-40 flex h-[100px] w-[50px] -translate-y-1/2 items-center rounded-l-[43px] bg-[#5C57FF] shadow-[0_4px_18px_-4px_#5C57FF] transition-transform duration-300 ease-out border-1 border-r-0 border-[#8688B5]",
          open && "translate-x-full"
        )}
      >
        <span className="ml-[19px] flex flex-col gap-1.5">
          <span className="size-[6px] rounded-full bg-white" />
          <span className="size-[6px] rounded-full bg-white" />
          <span className="size-[6px] rounded-full bg-white" />
        </span>
      </button>

      {(open || exiting) && (
        <div
          className={cn(
            "fixed inset-0 z-[60] grid place-items-center",
            exiting && "pointer-events-none"
          )}
        >
          {/* 半透明遮罩：点击等同取消 */}
          <div
            className={cn(
              "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
              entered && !exiting ? "opacity-100" : "opacity-0"
            )}
            onClick={close}
          />

          {/* 圆盘本体：入场 缩小+正转180° → 复原；出场 复原 → 缩小+反转180°+淡出 */}
          <div
            className={cn(
              "relative transition-[transform,opacity] duration-300 ease-out",
              exiting ? "opacity-0" : "opacity-100"
            )}
            style={{
              width: DRUM,
              height: DRUM,
              transform: exiting
                ? `scale(${fit * 0.6}) rotate(-180deg)`
                : entered
                  ? `scale(${fit}) rotate(0deg)`
                  : `scale(${fit * 0.6}) rotate(180deg)`,
            }}
            onClickCapture={onClickCapture}
            onTransitionEnd={onDrumTransitionEnd}
          >
            {/* 500px 外框 */}
            <div className="absolute inset-0 rounded-full bg-[#262C30A0] shadow-[inset_0_0_60px_rgba(0,0,0,0.45)] border-1 border-[#50636B]" />

            {/* 旋转层：只转这一层，路由圆点挂在上面跟转 */}
            <div
              ref={layerRef}
              className="absolute inset-0 touch-none select-none"
              style={{ transform: "rotate(var(--spin, 0deg))" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {nav.map((item, i) => {
                const angle = (360 / nav.length) * i;
                const active = isActive(pathname, item.href);
                return (
                  <div
                    key={item.href}
                    className="absolute inset-0"
                    style={{ transform: `rotate(${angle}deg)` }}
                  >
                    <SmartLink
                      href={item.href}
                      className={cn(
                        "absolute left-1/2 grid place-items-center rounded-full px-1 text-center text-xs leading-tight transition-colors duration-200",
                        active
                          ? "bg-[#5C57FF] text-white shadow-[0_0_14px_rgba(92,87,255,0.75)]"
                          : "bg-[#272730] text-white/85 border-1 border-[#404052]"
                      )}
                      style={{
                        width: ITEM,
                        height: ITEM,
                        top: DRUM / 2 - ORBIT - ITEM / 2,
                        // 抵消所在辐条的静态角 + 层的实时角，让文字始终正向
                        transform: `translateX(-50%) rotate(calc(${-angle}deg - var(--spin, 0deg)))`,
                      }}
                    >
                      {item.label}
                    </SmartLink>
                  </div>
                );
              })}
            </div>

            {/* 中心取消钮：80/70 两层静止环 + 50px 按钮，hover 变红自转 90° */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="grid size-[78px] place-items-center rounded-full bg-[#5F6B94]">
                <div className="grid size-[70px] place-items-center rounded-full bg-[#3C3C4D]">
                  <button
                    type="button"
                    aria-label="关闭导航"
                    onClick={() => setOpen(false)}
                    className="grid size-[50px] place-items-center rounded-full bg-[#5C57FF] text-white transition-all duration-300 hover:rotate-90 hover:bg-red-500"
                  >
                    <Icon name="close" size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
