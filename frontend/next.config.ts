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