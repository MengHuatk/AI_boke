import { Icon } from "@/components/ui/Icon";
import { SmartLink } from "@/components/ui/SmartLink";
import type { SiteConfig } from "@/lib/types";

interface FooterProps {
  site: SiteConfig;
}

/**
 * 页脚。文案与链接同样来自后端 site.json。
 */
export function Footer({ site }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="px-4 pb-6 pt-10 sm:px-6">
      <div className="glass-panel mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 rounded-glass px-6 py-5 sm:flex-row">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <span className="text-sm font-medium text-white/80">{site.name}</span>
          <span className="text-xs text-white/40">{site.description}</span>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
          <ul className="flex items-center gap-1">
            {site.socials.map((social) => (
              <li key={social.href}>
                <SmartLink
                  href={social.href}
                  aria-label={social.label}
                  title={social.label}
                  className="grid size-8 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Icon name={social.icon} size={15} />
                </SmartLink>
              </li>
            ))}
          </ul>

          <p className="text-xs text-white/35">
            © {year} {site.author} · 保留所有权利
          </p>
        </div>
      </div>
    </footer>
  );
}