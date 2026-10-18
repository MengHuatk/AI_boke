"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { CircleNav } from "@/components/layout/CircleNav";
import { SmartLink } from "@/components/ui/SmartLink";
import { cn } from "@/lib/format";
import type { NavItem, SiteConfig } from "@/lib/types";

interface NavbarProps {
  site: SiteConfig;
}

/** 当前路由判断：根路径精确匹配，其余路径匹配它自己及其子路径 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * 单个导航项。桌面端与移动端下拉共用这一段，区别只在排版类名。
 *
 * 选中态：文字用 neon-500，文字正下方 6px 处放一个同色圆点。
 * 未选中：hover 时文字转 neon-600。
 */
function NavLink({
  item,
  active,
  className,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <SmartLink
      href={item.href}
      onClick={onClick}
      className={cn(
        "transition-colors duration-200",
        active
          ? "font-medium text-neon-500"
          : "text-white/65 hover:text-neon-600",
        className
      )}
    >
      <span className="relative">
        {item.label}
        {active && (
          <span className="absolute left-1/2 top-full mt-1.5 size-[5px] -translate-x-1/2 rounded-full bg-neon-500" />
        )}
      </span>
    </SmartLink>
  );
}

/**
 * 顶部导航：通栏铺满视口宽度，内容由内层 banner 约束到与首页主区等宽。
 *
 * 导航项来自后端 `site.nav`，增删页面只需要改 site.json。
 * 因为是客户端组件（需要读 usePathname 做当前页高亮），站点配置由
 * SiteShell 作为 props 传进来，这里不再自己发请求。
 *
 * 桌面端（md+）是顶部横条导航；移动端不渲染顶栏，只保留贴在右侧的
 * 圆形左轮导航（CircleNav）作为唯一入口。
 */
/** 滚动收起阈值：超过这个距离导航栏滑出隐藏，回到它之上则重新拉出 */
const HIDE_SCROLL_Y = 50;

export function Navbar({ site }: NavbarProps) {
  const pathname = usePathname();
  const [scrolledPast, setScrolledPast] = useState(false);

  // 跟随滚动位置切换导航栏显隐状态
  useEffect(() => {
    const onScroll = () => setScrolledPast(window.scrollY > HIDE_SCROLL_Y);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 hidden transition-transform duration-300 ease-out md:block",
          scrolledPast && "-translate-y-full"
        )}
      >
        <nav className="glass-panel-nav flex h-18 items-center">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            {/* 站名 */}
            <SmartLink
              href="/"
              className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-85"
            >
              <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-brand-300 to-brand-600 text-[13px] font-bold text-white shadow-[0_4px_14px_-4px_var(--color-brand-500)]">
                {site.name.slice(0, 1)}
              </span>
              <span className="text-sm font-semibold tracking-tight text-white/90">
                {site.name}
              </span>
            </SmartLink>

            {/* 导航项：数据驱动（header 本身已是 md+ 才渲染） */}
            <ul className="flex items-center gap-1">
              {site.nav.map((item) => (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    active={isActive(pathname, item.href)}
                    className="block px-3 py-2 text-sm"
                  />
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* 移动端：右侧贴边的圆形左轮导航 */}
      <CircleNav site={site} pathname={pathname} />
    </>
  );
}
