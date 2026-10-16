import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import type { SiteConfig } from "@/lib/types";

interface NavbarProps {
  site: SiteConfig;
}

/**
 * 顶部导航。
 *
 * 导航项完全由后端返回的 `site.nav` 驱动，增删页面只需要改 site.json，
 * 这里一行都不用动。
 *
 * 注意：当前是服务端组件，因此没有「当前页高亮」。
 * 需要高亮时把它改成客户端组件并引入 usePathname 即可（见交接文档）。
 */
export function Navbar({ site }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="glass-panel-strong mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 rounded-full px-4 sm:px-5">
        {/* 站名 */}
        <SmartLink
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-full pr-2 transition-opacity hover:opacity-85"
        >
          <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-brand-300 to-brand-600 text-[13px] font-bold text-white shadow-[0_4px_14px_-4px_var(--color-brand-500)]">
            {site.name.slice(0, 1)}
          </span>
          <span className="text-sm font-semibold tracking-tight text-white/90">
            {site.name}
          </span>
        </SmartLink>

        {/* 导航项：数据驱动 */}
        <ul className="hidden items-center gap-1 md:flex">
          {site.nav.map((item) => (
            <li key={item.href}>
              <SmartLink
                href={item.href}
                className="rounded-full px-3.5 py-1.5 text-sm text-white/65 transition-colors duration-200 hover:bg-white/8 hover:text-white"
              >
                {item.label}
              </SmartLink>
            </li>
          ))}
        </ul>

        {/* 社交入口 */}
        <ul className="flex shrink-0 items-center gap-1">
          {site.socials.map((social) => (
            <li key={social.href}>
              <SmartLink
                href={social.href}
                aria-label={social.label}
                title={social.label}
                className="grid size-9 place-items-center rounded-full text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                <Icon name={social.icon} size={16} />
              </SmartLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}