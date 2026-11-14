import { readFile } from "node:fs/promises";
import path from "node:path";

/** 允许对外提供的主题，白名单防止把 public 目录当静态服务器用 */
const THEMES = new Set(["glass-night", "glass-day"]);

/**
 * 向 giscus 提供站点主题 CSS。
 *
 * giscus 在 giscus.app 的 iframe 里用 <link crossorigin="anonymous"> 加载
 * 主题，跨域请求必须带 CORS 头；public/ 下的静态文件没有这层头，浏览器
 * 会拒绝，所以由这里读文件并补上。地址由 GiscusComments 用当前站点
 * origin 拼出，改完 CSS 刷新即生效。
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ theme: string }> },
) {
  const { theme } = await params;
  if (!THEMES.has(theme)) {
    return new Response("Not Found", { status: 404 });
  }

  const css = await readFile(
    path.join(process.cwd(), "public", "giscus", `${theme}.css`),
    "utf8",
  );

  return new Response(css, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60",
    },
  });
}
