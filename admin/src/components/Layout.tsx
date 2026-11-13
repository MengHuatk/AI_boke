import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { logout } from "../api/client";

const publicSiteUrl =
  import.meta.env.VITE_PUBLIC_SITE_URL ?? "http://localhost:3000";

function navClass({ isActive }: { isActive: boolean }) {
  return [
    "rounded-lg px-3 py-1.5 text-sm transition",
    isActive
      ? "bg-white/10 text-white"
      : "text-white/50 hover:bg-white/5 hover:text-white/85",
  ].join(" ");
}

export function Layout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: ["session"] });
      navigate("/login", { replace: true });
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-brand-500/20 text-brand-200 ring-1 ring-brand-400/30">
              ✦
            </span>
            <span className="hidden text-sm font-semibold tracking-wide text-white/90 sm:inline">
              玻璃博客 · 后台
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink to="/posts" className={navClass}>
              文章
            </NavLink>
            <NavLink to="/talks" className={navClass}>
              杂谈
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <a
              href={publicSiteUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden text-xs text-white/45 transition hover:text-white/80 sm:inline"
            >
              查看站点 ↗
            </a>
            <button
              type="button"
              className="btn btn-ghost px-3 py-1.5 text-xs"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
