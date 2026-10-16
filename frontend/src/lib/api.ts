/**
 * 后端接口封装。
 *
 * 设计约定：
 * - 所有对后端的调用都必须经过这里，组件里不出现裸 fetch；
 * - 每个读取函数都返回 DataResult<T>，附带 source 标记，
 *   调用方可以据此提示「当前展示的是示例数据」；
 * - 后端不可用时降级到 fallback.ts，而不是抛错导致整页崩溃；
 * - 新增接口时照着 fetchHome / getHomeData 的模式加一对函数即可。
 */

import { apiConfig, uiConfig } from "@/lib/config";
import { fallbackHome } from "@/lib/fallback";
import type {
  DataResult,
  HomePayload,
  PostDetail,
  PostSummary,
  SiteConfig,
  SiteStats,
  TagStat,
} from "@/lib/types";

/** 接口调用失败（网络错误、超时、非 2xx）时抛出 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly url?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** 统一的请求执行器：拼地址、超时、状态码检查、JSON 解析 */
async function request<T>(path: string): Promise<T> {
  const url = `${apiConfig.baseUrl}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(apiConfig.timeoutMs),
      next: { revalidate: apiConfig.revalidate },
    });
  } catch (cause) {
    // 网络不可达、连接被拒或超时。把原因带上，方便区分「后端没起」和「后端太慢」
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new ApiError(`请求失败: ${url}（${reason}）`, undefined, url);
  }

  if (!response.ok) {
    throw new ApiError(`接口返回 ${response.status}: ${url}`, response.status, url);
  }

  return (await response.json()) as T;
}

/** 包一层降级逻辑，任何异常都退回到 fallback 并打印一次警告 */
async function withFallback<T>(loader: () => Promise<T>, fallback: T, label: string): Promise<DataResult<T>> {
  try {
    return { data: await loader(), source: "api" };
  } catch (error) {
    console.warn(
      `[api] ${label} 获取失败，已回退到本地示例数据。` +
        `请确认后端已启动（${apiConfig.baseUrl}）。`,
      error,
    );
    return { data: fallback, source: "fallback" };
  }
}

// ---------------------------------------------------------------------------
// 原始接口
// ---------------------------------------------------------------------------

export function fetchHome(featuredLimit = uiConfig.homeFeaturedLimit): Promise<HomePayload> {
  return request<HomePayload>(`/home?featured_limit=${featuredLimit}`);
}

export function fetchSite(): Promise<SiteConfig> {
  return request<SiteConfig>("/site");
}

export function fetchPosts(params: {
  tag?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<PostSummary[]> {
  const query = new URLSearchParams();
  if (params.tag) query.set("tag", params.tag);
  if (params.featured !== undefined) query.set("featured", String(params.featured));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));

  const suffix = query.size > 0 ? `?${query}` : "";
  return request<PostSummary[]>(`/posts${suffix}`);
}

export function fetchPost(slug: string): Promise<PostDetail> {
  return request<PostDetail>(`/posts/${encodeURIComponent(slug)}`);
}

export function fetchTags(): Promise<TagStat[]> {
  return request<TagStat[]>("/tags");
}

export function fetchStats(): Promise<SiteStats> {
  return request<SiteStats>("/stats");
}

// ---------------------------------------------------------------------------
// 带降级的读取（页面直接调用这一层）
// ---------------------------------------------------------------------------

/** 首页首屏数据。后端不可用时返回示例数据。 */
export async function getHomeData(): Promise<DataResult<HomePayload>> {
  return withFallback(fetchHome, fallbackHome, "首页数据");
}

/** 站点配置。导航栏与页脚依赖它，因此同样需要降级。 */
export async function getSite(): Promise<DataResult<SiteConfig>> {
  return withFallback(fetchSite, fallbackHome.site, "站点配置");
}