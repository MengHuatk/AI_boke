import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { Layout } from "./components/Layout";
import { RequireAuth } from "./components/RequireAuth";
import { AlbumEditPage } from "./pages/AlbumEditPage";
import { AlbumListPage } from "./pages/AlbumListPage";
import { LinkEditPage } from "./pages/LinkEditPage";
import { LinkListPage } from "./pages/LinkListPage";
import { LoginPage } from "./pages/LoginPage";
import { MomentEditPage } from "./pages/MomentEditPage";
import { MomentListPage } from "./pages/MomentListPage";
import { MusicEditPage } from "./pages/MusicEditPage";
import { MusicListPage } from "./pages/MusicListPage";
import { PostEditPage } from "./pages/PostEditPage";
import { PostListPage } from "./pages/PostListPage";
import { ProjectEditPage } from "./pages/ProjectEditPage";
import { ProjectListPage } from "./pages/ProjectListPage";
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
        <Route path="/moments" element={<MomentListPage />} />
        <Route path="/moments/:id" element={<MomentEditPage />} />
        <Route path="/albums" element={<AlbumListPage />} />
        <Route path="/albums/:id" element={<AlbumEditPage />} />
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/projects/:id" element={<ProjectEditPage />} />
        <Route path="/links" element={<LinkListPage />} />
        <Route path="/links/:id" element={<LinkEditPage />} />
        <Route path="/music" element={<MusicListPage />} />
        <Route path="/music/:id" element={<MusicEditPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/posts" replace />} />
    </Routes>
  );
}
