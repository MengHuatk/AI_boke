import type { NextConfig } from "next";

// 后端地址与公开站调用接口用的 NEXT_PUBLIC_API_BASE_URL 保持一致。
// 上传图片以 /uploads/... 相对路径入库，由这里的 rewrite 代理到 FastAPI：
// 浏览器和 next/image 都只看到本站同源地址，不受 Next 16 对
// 本机/内网 IP 的图片优化限制。
const apiUrl = new URL(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1",
);

const nextConfig: NextConfig = {
  // next dev 会往 frontend/AGENTS.md 追加要求读取 node_modules 的规则块，
  // 与文件里既有的读取边界冲突；关闭自动生成，文件由项目维护。
  agentRules: false,

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${apiUrl.origin}/uploads/:path*`,
      },
    ];
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