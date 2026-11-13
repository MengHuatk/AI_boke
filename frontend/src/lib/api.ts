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
import { fallbackHome, fallbackPostDetail } from "@/lib/fallback";
import { TALKS } from "@/lib/talks-fixtures";
import type {
  AnonChatReply,
  AnonChatTurn,
  DataResult,
  HomePayload,
  PostDetail,
  PostSummary,
  SiteConfig,
  SiteStats,
  TagStat,
  Talk,
  TalkDetail,
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

export function fetchTalks(params: {
  tag?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<Talk[]> {
  const query = new URLSearchParams();
  if (params.tag) query.set("tag", params.tag);
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));

  const suffix = query.size > 0 ? `?${query}` : "";
  return request<Talk[]>(`/talks${suffix}`);
}

export function fetchTalk(slug: string): Promise<TalkDetail> {
  return request<TalkDetail>(`/talks/${encodeURIComponent(slug)}`);
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

/** 单篇文章正文。后端不可用或 slug 不存在时退回示例文章。 */
export async function getPost(slug: string): Promise<DataResult<PostDetail>> {
  return withFallback(() => fetchPost(slug), fallbackPostDetail, "文章详情");
}

/** 关于页时间轴用的最近文章。后端不可用时退回示例文章列表。 */
export async function getRecentPosts(limit = 20): Promise<DataResult<PostSummary[]>> {
  return withFallback(
    () => fetchPosts({ limit }),
    fallbackHome.featured_posts,
    "文章列表",
  );
}

/** 杂谈列表。后端不可用时退回本地 fixture，保证页面始终有内容。 */
export async function getTalks(): Promise<DataResult<Talk[]>> {
  return withFallback(fetchTalks, TALKS, "杂谈列表");
}

/**
 * 杂谈详情。
 *
 * 404 视为“这篇确实不存在”，交给页面走 notFound；
 * 网络错误才退回同 slug 的 fixture，避免后端没启动时整页崩掉。
 */
export async function getTalk(
  slug: string,
): Promise<DataResult<TalkDetail | null>> {
  try {
    return { data: await fetchTalk(slug), source: "api" };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { data: null, source: "api" };
    }

    console.warn(
      `[api] 杂谈详情获取失败，已回退到本地示例数据。` +
        `请确认后端已启动（${apiConfig.baseUrl}）。`,
      error,
    );
    return {
      data: TALKS.find((talk) => talk.slug === slug) ?? null,
      source: "fallback",
    };
  }
}

// ---------------------------------------------------------------------------
// 看板娘 AI 对话
// ---------------------------------------------------------------------------

/**
 * 发送一轮对话。
 *
 * 聊天失败必须让用户看见，不能像内容读取那样退回示例数据，
 * 否则会出现「示例回答冒充 AI」的情况，所以这里不做 fallback。
 */
export async function sendAnonChat(
  message: string,
  history: AnonChatTurn[] = [],
): Promise<AnonChatReply> {
  const url = `${apiConfig.baseUrl}/chat`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ message, history }),
      signal: AbortSignal.timeout(apiConfig.chatTimeoutMs),
      cache: "no-store",
    });
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new ApiError(`请求失败: ${url}（${reason}）`, undefined, url);
  }

  if (!response.ok) {
    throw new ApiError(`接口返回 ${response.status}: ${url}`, response.status, url);
  }

  return (await response.json()) as AnonChatReply;
}