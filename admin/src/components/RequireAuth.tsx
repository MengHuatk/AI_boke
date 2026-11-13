import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { getSession } from "../api/client";

/** 先问后端“我登录了吗”，未登录直接送回登录页。 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const session = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    retry: false,
  });

  if (session.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-white/40">
        正在验证登录状态…
      </div>
    );
  }

  if (!session.data?.authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
