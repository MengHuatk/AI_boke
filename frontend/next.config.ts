import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // 说明：脚手架默认开启了实验性的 cacheComponents（严格缓存组件模型）。
  // 初版内容全部来自本地 FastAPI，读取开销极低，开启后反而要求每个异步数据
  // 访问都包一层 Suspense / "use cache"，对后续接手的人心智负担偏重，故暂时关闭。
  // 需要时打开下面这行，并在数据层加 "use cache" + cacheLife 即可。
  // cacheComponents: true,
};

export default nextConfig;