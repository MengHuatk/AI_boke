import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { isExternalHref } from "@/lib/format";

interface SmartLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children: ReactNode;
}

/**
 * 统一链接出口。
 *
 * 导航项、社交链接这些 href 都来自后端数据，可能是站内路径，
 * 也可能是 https / mailto。这里自动选择正确的渲染方式：
 * - 站内路径  → next/link（带预取）
 * - http(s)  → <a target="_blank" rel="noreferrer noopener">
 * - mailto/tel → <a>（不加 target，交给系统处理）
 *
 * 组件里一律用 SmartLink，不要直接写 <a> 或 <Link>。
 */
export function SmartLink({ href, children, ...rest }: SmartLinkProps) {
  if (!isExternalHref(href)) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }

  const isProtocolHandler = /^(mailto|tel):/.test(href);

  return (
    <a
      href={href}
      {...(isProtocolHandler
        ? {}
        : { target: "_blank", rel: "noreferrer noopener" })}
      {...rest}
    >
      {children}
    </a>
  );
}