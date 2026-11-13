"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Icon } from "@/components/ui/Icon";
import type { AnonEmotion } from "@/lib/types";

import { AnonChat } from "./AnonChat";
import { EMOTION_EXPRESSIONS } from "./emotions";
import { MusicCueBridge } from "./MusicCueBridge";
import {
  DEFAULT_OUTFIT_ID,
  LIVE2D_OUTFITS,
  outfitModelPath,
} from "./outfits";

import type { Application } from "pixi.js";
import type { Live2DModel } from "pixi-live2d-display/cubism4";

/** 开关和当前服装都走 localStorage，和雨幕设置同一套前缀 */
const ENABLED_KEY = "glass-notes-live2d-enabled";
const OUTFIT_KEY = "glass-notes-live2d-outfit";
const CORE_URL = "/live2D/core/live2dcubismcore.min.js";

/**
 * 这套模型没有标准的 Idle 组，只能手动轮播 mtn_idle01_C。
 * 动作本身是 5.967 秒、Loop: false，所以用略长一点的定时器重播。
 */
const IDLE_MOTION = "mtn_idle01_C";
const IDLE_INTERVAL = 6000;

/** 桌面端默认显示，移动端默认隐藏 */
const DESKTOP_QUERY = "(min-width: 1024px)";
const MAX_DPR = 1.5;

type LoadStatus = "idle" | "loading" | "ready" | "error";

let corePromise: Promise<void> | null = null;

/**
 * Cubism Core 是官方闭源运行时，只加载一次。
 * 失败时清掉缓存，允许用户关掉再打开时重试。
 */
function loadCubismCore(): Promise<void> {
  if ("Live2DCubismCore" in window) return Promise.resolve();

  if (!corePromise) {
    corePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CORE_URL;
      script.async = true;
      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener(
        "error",
        () => {
          corePromise = null;
          reject(new Error("Cubism Core 加载失败"));
        },
        { once: true },
      );
      document.head.appendChild(script);
    });
  }

  return corePromise;
}

/**
 * 把模型缩放到容器内，并钉在容器右下角。
 * 同时把模型在容器里的水平中心写进 CSS 变量，供下方服装切换组对齐。
 */
function fitModel(
  model: Live2DModel,
  width: number,
  height: number,
  wrapper: HTMLDivElement | null,
) {
  const scale = Math.min(
    width / model.internalModel.width,
    height / model.internalModel.height,
  );

  model.anchor.set(1, 1);
  model.scale.set(scale);
  model.position.set(width, height);

  // anchor 在右侧，模型左边缘是 width - modelWidth，中心在 width - modelWidth / 2
  const modelWidth = model.internalModel.width * scale;
  const modelTop = height - model.internalModel.height * scale;
  wrapper?.style.setProperty(
    "--model-center",
    `${width - modelWidth / 2}px`,
  );
  wrapper?.style.setProperty("--model-top", `${modelTop}px`);
}

/** localStorage 里的看板娘偏好；用外部 store 读取，避免在 effect 里同步 setState */
interface Live2DPrefs {
  enabled: boolean;
  outfitId: string;
}

const SERVER_PREFS: Live2DPrefs = {
  enabled: false,
  outfitId: DEFAULT_OUTFIT_ID,
};

let prefs: Live2DPrefs | null = null;
const prefListeners = new Set<() => void>();

function getPrefs(): Live2DPrefs {
  if (!prefs) {
    const storedEnabled = window.localStorage.getItem(ENABLED_KEY);
    const storedOutfit = window.localStorage.getItem(OUTFIT_KEY);

    prefs = {
      enabled:
        storedEnabled === null
          ? window.matchMedia(DESKTOP_QUERY).matches
          : storedEnabled === "true",
      outfitId:
        LIVE2D_OUTFITS.find((item) => item.id === storedOutfit)?.id ??
        DEFAULT_OUTFIT_ID,
    };
  }

  return prefs;
}

function getServerPrefs(): Live2DPrefs {
  return SERVER_PREFS;
}

function subscribePrefs(listener: () => void) {
  prefListeners.add(listener);
  return () => {
    prefListeners.delete(listener);
  };
}

function updatePrefs(patch: Partial<Live2DPrefs>) {
  const next = { ...getPrefs(), ...patch };
  prefs = next;
  window.localStorage.setItem(ENABLED_KEY, String(next.enabled));
  window.localStorage.setItem(OUTFIT_KEY, next.outfitId);
  prefListeners.forEach((listener) => listener());
}

/**
 * 右下角 anon 看板娘。
 *
 * 桌面端默认显示、移动端默认隐藏，开关和当前服装写入 localStorage。
 * canvas 本身不接收指针事件，视线跟随通过 window 上的 pointermove
 * 换算坐标后调用 model.focus，因此不会挡住页面上的链接和按钮。
 *
 * 服装切换只替换模型，不重建 Pixi 应用；切换期间按钮禁用，
 * 避免连续点击产生并发的模型加载。
 */
export function Live2DAnon() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const modelRef = useRef<Live2DModel | null>(null);
  const loadTokenRef = useRef(0);
  const loadOutfitRef = useRef<(index: number) => Promise<void>>(
    async () => {},
  );
  const outfitIndexRef = useRef(0);
  const expressionTimerRef = useRef<number | null>(null);
  const activeEmotionRef = useRef<AnonEmotion | null>(null);
  const expressionEndAtRef = useRef(0);

  const prefs = useSyncExternalStore(
    subscribePrefs,
    getPrefs,
    getServerPrefs,
  );
  const enabled = prefs.enabled;
  const outfitIndex = Math.max(
    0,
    LIVE2D_OUTFITS.findIndex((item) => item.id === prefs.outfitId),
  );
  const [status, setStatus] = useState<LoadStatus>("idle");

  const outfit = LIVE2D_OUTFITS[outfitIndex];

  /**
   * 清掉当前表情和计时器。
   * expression() 不传参会随机换一个表情，复位只能走 resetExpression。
   */
  const clearEmotion = () => {
    if (expressionTimerRef.current !== null) {
      window.clearTimeout(expressionTimerRef.current);
      expressionTimerRef.current = null;
    }

    activeEmotionRef.current = null;
    expressionEndAtRef.current = 0;
    modelRef.current?.internalModel.motionManager.expressionManager?.resetExpression();
  };

  /** 回答或音乐台词到达时切到对应表情，持续时间和气泡一致 */
  const speak = (
    emotion: AnonEmotion,
    durationMs: number,
    motion?: string,
  ) => {
    clearEmotion();

    // 音乐台词可以额外带一个动作；动作名必须存在于当前模型
    if (motion) void modelRef.current?.motion(motion);

    const expression = EMOTION_EXPRESSIONS[emotion];
    if (!expression) return;

    activeEmotionRef.current = emotion;
    expressionEndAtRef.current = Date.now() + durationMs;
    void modelRef.current?.expression(expression);

    expressionTimerRef.current = window.setTimeout(() => {
      activeEmotionRef.current = null;
      expressionEndAtRef.current = 0;
      expressionTimerRef.current = null;
      modelRef.current?.internalModel.motionManager.expressionManager?.resetExpression();
    }, durationMs);
  };

  useEffect(() => {
    outfitIndexRef.current = outfitIndex;
  }, [outfitIndex]);

  // 初始化 / 销毁 Pixi 应用
  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let idleTimer: number | null = null;

    const handlePointerMove = (event: PointerEvent) => {
      const model = modelRef.current;
      const container = containerRef.current;
      if (!model || !container) return;

      const rect = container.getBoundingClientRect();
      model.focus(event.clientX - rect.left, event.clientY - rect.top);
    };

    const handleVisibility = () => {
      if (!appRef.current) return;
      if (document.hidden) appRef.current.ticker.stop();
      else appRef.current.ticker.start();
    };

    const handleResize = () => {
      const app = appRef.current;
      const model = modelRef.current;
      const container = containerRef.current;
      if (!app || !model || !container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      app.renderer.resize(width, height);
      fitModel(model, width, height, wrapperRef.current);
    };

    const init = async () => {
      try {
        setStatus("loading");
        await loadCubismCore();

        const PIXI = await import("pixi.js");
        const { Live2DModel: LoadedLive2DModel } = await import(
          "pixi-live2d-display/cubism4"
        );
        if (disposed) return;

        // 插件通过全局 window.PIXI.Ticker 自动更新模型
        (window as Window & { PIXI?: typeof PIXI }).PIXI = PIXI;
        LoadedLive2DModel.registerTicker(PIXI.Ticker);

        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) return;

        const app = new PIXI.Application({
          width,
          height,
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, MAX_DPR),
        });
        const view = app.view as HTMLCanvasElement;
        view.style.pointerEvents = "none";
        container.appendChild(view);
        appRef.current = app;
        if (document.hidden) app.ticker.stop();

        const loadOutfit = async (index: number) => {
          if (disposed) return;

          const token = ++loadTokenRef.current;
          setStatus("loading");

          if (idleTimer !== null) {
            window.clearInterval(idleTimer);
            idleTimer = null;
          }

          const previous = modelRef.current;
          if (previous) {
            app.stage.removeChild(previous);
            previous.destroy();
            modelRef.current = null;
          }

          try {
            const next = LIVE2D_OUTFITS[index];
            const model = await LoadedLive2DModel.from(
              outfitModelPath(next),
              { autoInteract: false },
            );

            if (disposed || token !== loadTokenRef.current) {
              model.destroy();
              return;
            }

            fitModel(
              model,
              container.clientWidth,
              container.clientHeight,
              wrapperRef.current,
            );
            app.stage.addChild(model);
            modelRef.current = model;

            // 换装时如果回答还没结束，把同一个表情接到新模型上
            const activeEmotion = activeEmotionRef.current;
            if (activeEmotion && Date.now() < expressionEndAtRef.current) {
              const expression = EMOTION_EXPRESSIONS[activeEmotion];
              if (expression) void model.expression(expression);
            }

            void model.motion(IDLE_MOTION);
            idleTimer = window.setInterval(() => {
              if (modelRef.current === model) void model.motion(IDLE_MOTION);
            }, IDLE_INTERVAL);

            setStatus("ready");
          } catch (error) {
            if (disposed) return;
            console.error("[Live2DAnon]", error);
            setStatus("error");
          }
        };

        loadOutfitRef.current = loadOutfit;
        await loadOutfit(outfitIndexRef.current);
      } catch (error) {
        if (disposed) return;
        console.error("[Live2DAnon]", error);
        setStatus("error");
      }
    };

    void init();

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      disposed = true;
      loadTokenRef.current += 1;
      loadOutfitRef.current = async () => {};

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (idleTimer !== null) window.clearInterval(idleTimer);

      if (expressionTimerRef.current !== null) {
        window.clearTimeout(expressionTimerRef.current);
        expressionTimerRef.current = null;
      }
      activeEmotionRef.current = null;
      expressionEndAtRef.current = 0;

      if (modelRef.current) {
        const model = modelRef.current;
        model.parent?.removeChild(model);
        model.destroy();
        modelRef.current = null;
      }

      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [enabled]);

  // 切服装时只替换模型，不重建 Pixi 应用
  useEffect(() => {
    if (!enabled) return;
    void loadOutfitRef.current(outfitIndex);
  }, [enabled, outfitIndex]);

  const switchOutfit = (delta: number) => {
    const nextIndex =
      (outfitIndex + delta + LIVE2D_OUTFITS.length) % LIVE2D_OUTFITS.length;
    updatePrefs({ outfitId: LIVE2D_OUTFITS[nextIndex].id });
  };

  const label =
    status === "loading"
      ? "加载中…"
      : status === "error"
        ? "加载失败"
        : outfit.name;

  // 切换组宽 238px（36 + 8 + 150 + 8 + 36），119 是半宽；
  // 131 = 119 + 12px 右边距，极窄屏时保证右箭头不出屏。
  const switchLeft =
    "min(var(--model-center, 50%), calc(100% - 131px))";

  const showButton = (
    <button
      type="button"
      aria-label="显示看板娘"
      onClick={() => updatePrefs({ enabled: true })}
      className="floating-control pointer-events-auto fixed right-5 bottom-24 z-[71] grid size-11 place-items-center rounded-full transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
    >
      <Icon name="sparkle" size={20} />
    </button>
  );

  // 底部留白 82px = 底边 16px + 切换组 36px + 模型间距 30px；
  // 模型高度保持原样，整体下移，不为右上角播放器额外收缩。
  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none fixed right-0 bottom-0 z-[70] w-[70vw] max-w-[520px] pb-[82px]"
    >
      {enabled ? (
        <div className="relative">
          <div
            ref={containerRef}
            aria-hidden="true"
            className="pointer-events-none h-[calc(100vh-250px)] max-h-[720px] w-full"
          />
          <AnonChat
            ready={status === "ready"}
            onSpeak={speak}
            onHide={() => updatePrefs({ enabled: false })}
          />
          <MusicCueBridge enabled={status === "ready"} />
        </div>
      ) : (
        showButton
      )}

      {enabled && (
        <div
          className="pointer-events-auto absolute bottom-4 z-[1] flex -translate-x-1/2 items-center gap-2"
          style={{ left: switchLeft }}
        >
          <button
            type="button"
            aria-label="上一套服装"
            disabled={status === "loading"}
            onClick={() => switchOutfit(-1)}
            className="floating-control grid size-9 place-items-center rounded-full transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:opacity-40"
          >
            <Icon name="prev" size={16} />
          </button>

          <span className="glass-panel inline-flex h-9 w-[150px] items-center justify-center rounded-full px-3 text-center text-[11px] whitespace-nowrap text-white/80">
            {label}
          </span>

          <button
            type="button"
            aria-label="下一套服装"
            disabled={status === "loading"}
            onClick={() => switchOutfit(1)}
            className="floating-control grid size-9 place-items-center rounded-full transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:opacity-40"
          >
            <Icon name="next" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
