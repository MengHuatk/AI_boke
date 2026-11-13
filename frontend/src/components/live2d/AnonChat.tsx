"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { Icon } from "@/components/ui/Icon";
import { ApiError, sendAnonChat } from "@/lib/api";
import { ANON_CUE_EVENT, type MusicCue } from "@/lib/music-cues";
import type { AnonChatTurn, AnonEmotion } from "@/lib/types";

import { replyTiming } from "./emotions";
import { MOTION_GROUPS } from "./motions";

interface AnonChatProps {
  /** 模型是否已加载完成，未完成时不能发送 */
  ready: boolean;
  /** 回答或音乐台词到达时切表情，durationMs 与气泡总时长一致 */
  onSpeak: (emotion: AnonEmotion, durationMs: number, motion?: string) => void;
  /** 隐藏整个看板娘 */
  onHide: () => void;
}

/**
 * 看板娘对话按钮、输入框和头顶气泡。
 *
 * 组件只负责聊天交互；模型和表情由 Live2DAnon 持有，通过 onSpeak 回调触发。
 * 气泡放在父级 relative 容器里，用 --model-center 对齐人物中心。
 */
export function AnonChat({ ready, onSpeak, onHide }: AnonChatProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [history, setHistory] = useState<AnonChatTurn[]>([]);
  const [bubble, setBubble] = useState<{ text: string } | null>(null);
  const [visibleChars, setVisibleChars] = useState(0);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // 逐字显示结束后继续停留，直到 totalMs 才收气泡；表情用同一个 totalMs
  useEffect(() => {
    if (!bubble) return;

    const chars = [...bubble.text];
    const timing = replyTiming(bubble.text);
    const steps = Math.max(1, Math.round(timing.revealMs / 25));
    const step = Math.max(1, Math.ceil(chars.length / steps));

    const reveal = window.setInterval(() => {
      setVisibleChars((count) => {
        const next = Math.min(chars.length, count + step);
        if (next >= chars.length) window.clearInterval(reveal);
        return next;
      });
    }, 25);

    const hide = window.setTimeout(() => setBubble(null), timing.totalMs);

    return () => {
      window.clearInterval(reveal);
      window.clearTimeout(hide);
    };
  }, [bubble]);

  // 音乐台词事件：用户正在提问或正在看回答时让位，跳过这一条，不排队
  useEffect(() => {
    const handleCue = (event: Event) => {
      const cue = (event as CustomEvent<MusicCue>).detail;
      if (pending || bubble) return;

      const timing = replyTiming(cue.text);
      setVisibleChars(0);
      setBubble({ text: cue.text });
      onSpeak(cue.emotion, timing.totalMs, cue.motion);
    };

    window.addEventListener(ANON_CUE_EVENT, handleCue);
    return () => window.removeEventListener(ANON_CUE_EVENT, handleCue);
  }, [pending, bubble, onSpeak]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = text.trim();
    if (!message || pending || !ready) return;

    setPending(true);

    try {
      const reply = await sendAnonChat(message, history);
      if (!aliveRef.current) return;

      const timing = replyTiming(reply.reply);
      setText("");
      setHistory((prev) => {
        const next: AnonChatTurn[] = [
          ...prev,
          { role: "user", content: message },
          { role: "assistant", content: reply.reply },
        ];
        return next.slice(-6);
      });
      setVisibleChars(0);
      setBubble({ text: reply.reply });
      setOpen(false);
      onSpeak(
        reply.emotion,
        timing.totalMs,
        MOTION_GROUPS[reply.motion] ?? undefined,
      );
    } catch (error) {
      if (!aliveRef.current) return;

      console.error("[AnonChat]", error);
      const failure =
        error instanceof ApiError && error.status === 429
          ? "说太快啦，等我喘口气…"
          : error instanceof ApiError && error.status === 503
            ? "AI 还没配置好…"
            : "我这边好像断线了…";
      const timing = replyTiming(failure);

      setVisibleChars(0);
      setBubble({ text: failure });
      onSpeak("sad", timing.totalMs);
    } finally {
      if (aliveRef.current) setPending(false);
    }
  };

  return (
    <>
      <div className="pointer-events-auto absolute right-2 -bottom-[18px] z-[3] flex flex-col items-center gap-2">
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "关闭对话输入框" : "和 anon 聊天"}
          onClick={() => setOpen((value) => !value)}
          className="floating-control grid size-11 place-items-center rounded-full transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
        >
          <Icon name="comment" size={20} />
        </button>

        <button
          type="button"
          aria-label="隐藏看板娘"
          onClick={onHide}
          className="floating-control grid size-11 place-items-center rounded-full transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
        >
          <Icon name="close" size={20} />
        </button>

        {open && (
          <form
            onSubmit={handleSubmit}
            className="glass-panel pointer-events-auto absolute right-[50px] bottom-[40px] z-[3] mb-2 flex w-[300px] max-w-[calc(100vw-24px)] items-center gap-2 rounded-2xl p-2"
          >
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={200}
              disabled={pending}
              autoFocus
              autoComplete="off"
              aria-label="对 anon 说"
              placeholder={
                !ready
                  ? "看板娘还没准备好…"
                  : pending
                    ? "思考中…"
                    : "和 anon 说点什么…"
              }
              className="glass-panel-subtle h-10 min-w-0 flex-1 rounded-xl px-3 font-xiaowei text-[15px] text-white/85 outline-none placeholder:text-white/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={pending || !ready || !text.trim()}
              aria-label={pending ? "发送中" : "发送"}
              className="keep-light grid size-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:opacity-40"
            >
              {pending ? "…" : <Icon name="arrowRight" size={16} />}
            </button>
          </form>
        )}
      </div>

      {bubble && (
        <>
          <div
            aria-hidden="true"
            style={{
              left: "min(var(--model-center, 50%), calc(100% - min(170px, 50vw - 12px) - 12px))",
              bottom: "calc(100% - var(--model-top, 0px) - 70px)",
            }}
            className="anon-bubble pointer-events-auto absolute z-[2] w-[340px] max-w-[calc(100vw-24px)] -translate-x-1/2 rounded-[18px] border-2 border-[#1f2430] bg-white px-4 py-3 font-yahei text-[12px] leading-relaxed text-[#1f2430] shadow-[4px_4px_0_rgb(31_36_48/0.18)]"
          >
            <p className="max-h-[120px] overflow-y-auto whitespace-pre-wrap break-words">
              {[...bubble.text].slice(0, visibleChars).join("")}
            </p>
            <span className="anon-bubble-tail absolute -bottom-[7px] left-1/2 size-3 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-[#1f2430] bg-white" />
          </div>

          <p className="sr-only" role="status" aria-live="polite">
            {bubble.text}
          </p>
        </>
      )}
    </>
  );
}
