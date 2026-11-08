import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/format";

const MODES = [
  { icon: "sun", label: "浅色" },
  { icon: "moon", label: "深色" },
  { icon: "monitor", label: "跟随" },
] as const;

/**
 * 主题切换占位卡（桌面 220×218）。
 *
 * 只负责把「主题模式」这件事画出来，不接任何实际切换逻辑：
 * 上半是左暗右亮的预览窗，昼夜球在两侧之间缓慢往返；
 * 下半是三枚静态模式胶囊，当前站点是深色，所以高亮「深色」。
 */
export function ThemeModeCard() {
  return (
    <div
      role="group"
      aria-label="主题模式切换（即将上线）"
      className="relative flex h-[218px] w-full flex-col overflow-hidden rounded-glass glass-panel p-4 sm:w-[220px] sm:shrink-0"
    >
      <div className="flex items-center justify-between">
        <span className="font-xiaowei text-[14px] tracking-[0.14em] text-white/70">
          THEME
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] leading-none text-white/40">
          即将上线
        </span>
      </div>

      <div
        aria-hidden="true"
        className="relative mt-3 h-[92px] overflow-hidden rounded-[14px] border border-white/10 bg-[#070b14]"
      >
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#f5eee0] to-[#ddd0ba]" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
        <div
          className="theme-orb absolute top-1/2 left-1/2 size-11 rounded-full shadow-[0_0_30px_rgba(255,160,120,0.5)]"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #fff6d8, #ffb86b 42%, #ff7ab6 70%, #5d4cc2)",
          }}
        />
      </div>

      <div className="mt-auto grid grid-cols-3 gap-1.5">
        {MODES.map((mode, index) => (
          <span
            key={mode.label}
            className={cn(
              "flex h-8 items-center justify-center gap-1 rounded-[8px] border text-[10px] leading-none",
              index === 1
                ? "border-brand-400/40 bg-brand-500/15 text-brand-200"
                : "border-white/10 bg-white/5 text-white/45",
            )}
          >
            <Icon name={mode.icon} size={12} />
            {mode.label}
          </span>
        ))}
      </div>
    </div>
  );
}
