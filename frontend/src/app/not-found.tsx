import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";

/**
 * 404 页。
 *
 * 初版只做了首页，导航里的「文章 / 标签 / 关于」暂时都会落到这里。
 * 等对应路由建好后，这个页面自然只在真正的 404 时出现。
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <GlassCard padding="lg" className="max-w-md text-center">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-gradient-to-br from-brand-400/30 to-brand-600/20 text-brand-200">
          <Icon name="layers" size={24} />
        </div>

        <h1 className="mb-2 text-xl font-semibold text-white/90">
          这个页面还在装修
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-white/50">
          当前是初版，只完成了首页。
          其余页面会按同样的毛玻璃风格逐步补齐。
        </p>

        <div className="flex justify-center gap-2.5">
          <GlassButton href="/" variant="primary">
            回到首页
            <Icon name="arrowRight" size={15} />
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}