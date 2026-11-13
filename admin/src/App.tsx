import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { Layout } from "./components/Layout";
import { RequireAuth } from "./components/RequireAuth";
import { LoginPage } from "./pages/LoginPage";
import { PostEditPage } from "./pages/PostEditPage";
import { PostListPage } from "./pages/PostListPage";
import { TalkEditPage } from "./pages/TalkEditPage";
import { TalkListPage } from "./pages/TalkListPage";

export function App() {
  const navigate = useNavigate();

  // 任何管理接口返回 401 时，统一回到登录页。
  useEffect(() => {
    function handleUnauthorized() {
      navigate("/login", { replace: true });
    }

    window.addEventListener("admin:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("admin:unauthorized", handleUnauthorized);
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/posts" replace />} />
        <Route path="/posts" element={<PostListPage />} />
        <Route path="/posts/:id" element={<PostEditPage />} />
        <Route path="/talks" element={<TalkListPage />} />
        <Route path="/talks/:id" element={<TalkEditPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/posts" replace />} />
    </Routes>
  );
}
