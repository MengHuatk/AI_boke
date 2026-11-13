import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { getSession, login } from "../api/client";

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const session = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      queryClient.setQueryData(["session"], result);
      navigate("/posts", { replace: true });
    },
    onError: (cause) => {
      setError(cause instanceof Error ? cause.message : "登录失败");
    },
  });

  if (session.data?.authenticated) {
    return <Navigate to="/posts" replace />;
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="glass-panel-strong w-full max-w-sm rounded-3xl p-8">
        <div className="grid size-12 place-items-center rounded-2xl bg-brand-500/20 text-2xl text-brand-200 ring-1 ring-brand-400/30">
          ✦
        </div>
        <h1 className="mt-5 text-xl font-semibold text-white/90">管理后台</h1>
        <p className="mt-1 text-sm text-white/40">
          内容写入接口只对管理员开放。
        </p>

        <form
          className="mt-6 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            loginMutation.mutate(password);
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-white/50">密码</span>
            <input
              type="password"
              className="field"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="输入管理员密码"
              autoFocus
            />
          </label>

          {error && <p className="text-xs text-rose-300">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary mt-2"
            disabled={loginMutation.isPending || !password}
          >
            {loginMutation.isPending ? "登录中…" : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
