import type { NextConfig } from "next";

// 上传图片由 FastAPI 提供，与公开站不同源；next/image 需要显式放行该源。
// 地址与公开站调用后端用的 NEXT_PUBLIC_API_BASE_URL 保持一致。
const apiUrl = new URL(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1",
);

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol === "https:" ? "https" : "http",
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: "/uploads/**",
      },
    ],
  },

  // 开发模式左下角的路由徽标（Next 内置的 Dev Tools 指示器）挪到右下角，
  // 免得压住页脚。它只存在于 dev，构建产物里没有；保留它是因为它还标出
  // 每条路由是静态还是动态。要彻底不显示就改成 devIndicators: false。
  devIndicators: {
    position: "bottom-right",
  },

  // 说明：脚手架默认开启了实验性的 cacheComponents（严格缓存组件模型）。
  // 初版内容全部来自本地 FastAPI，读取开销极低，开启后反而要求每个异步数据
  // 访问都包一层 Suspense / "use cache"，对后续接手的人心智负担偏重，故暂时关闭。
  // 需要时打开下面这行，并在数据层加 "use cache" + cacheLife 即可。
  // cacheComponents: true,
};

export default nextConfig;