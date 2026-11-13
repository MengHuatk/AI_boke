import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  // 构建产物由 FastAPI 挂在 /admin/ 下；开发时 Vite 自己跑在根路径。
  base: command === "build" ? "/admin/" : "/",
  plugins: [react(), tailwindcss()],
  build: {
    // 直接输出到后端静态目录，部署时不需要再复制文件。
    outDir: "../backend/app/static/admin",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      // 开发时把接口与图片请求转给 FastAPI，浏览器看到的是同源请求，
      // 会话 Cookie 不需要额外处理跨域。
      "/api": "http://127.0.0.1:8000",
      "/uploads": "http://127.0.0.1:8000",
    },
  },
}));
