import type {
  AdminPostDetail,
  AdminPostSummary,
  AdminSession,
  AdminTalkDetail,
  AdminTalkSummary,
  PostStatus,
  PostWrite,
  TalkWrite,
  UploadResult,
} from "./types";

const API_BASE = "/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ErrorPayload {
  detail?: string | Array<{ msg?: string }>;
}

interface ContentListParams {
  status?: PostStatus;
  q?: string;
  limit?: number;
  offset?: number;
}

async function request<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = options;
  const init: RequestInit = {
    ...rest,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  };
  if (json !== undefined) {
    init.body = JSON.stringify(json);
  }

  const response = await fetch(`${API_BASE}${path}`, init);

  if (response.status === 401 && path !== "/admin/login") {
    window.dispatchEvent(new Event("admin:unauthorized"));
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorPayload | null;
    const detail = payload?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail) && detail[0]?.msg
          ? detail[0].msg
          : `请求失败 (${response.status})`;
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

function buildQuery(params: ContentListParams): string {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));
  return query.size > 0 ? `?${query}` : "";
}

// ---------------------------------------------------------------------------
// 登录状态
// ---------------------------------------------------------------------------

export function getSession(): Promise<AdminSession> {
  return request<AdminSession>("/admin/me");
}

export function login(password: string): Promise<AdminSession> {
  return request<AdminSession>("/admin/login", {
    method: "POST",
    json: { password },
  });
}

export function logout(): Promise<AdminSession> {
  return request<AdminSession>("/admin/logout", { method: "POST" });
}

// ---------------------------------------------------------------------------
// 文章
// ---------------------------------------------------------------------------

export function listPosts(params: ContentListParams = {}): Promise<AdminPostSummary[]> {
  return request<AdminPostSummary[]>(`/admin/posts${buildQuery(params)}`);
}

export function getPost(id: string): Promise<AdminPostDetail> {
  return request<AdminPostDetail>(`/admin/posts/${id}`);
}

export function createPost(data: PostWrite): Promise<AdminPostDetail> {
  return request<AdminPostDetail>("/admin/posts", { method: "POST", json: data });
}

export function updatePost(id: string, data: PostWrite): Promise<AdminPostDetail> {
  return request<AdminPostDetail>(`/admin/posts/${id}`, {
    method: "PUT",
    json: data,
  });
}

export function deletePost(id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/admin/posts/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// 杂谈
// ---------------------------------------------------------------------------

export function listTalks(params: ContentListParams = {}): Promise<AdminTalkSummary[]> {
  return request<AdminTalkSummary[]>(`/admin/talks${buildQuery(params)}`);
}

export function getTalk(id: string): Promise<AdminTalkDetail> {
  return request<AdminTalkDetail>(`/admin/talks/${id}`);
}

export function createTalk(data: TalkWrite): Promise<AdminTalkDetail> {
  return request<AdminTalkDetail>("/admin/talks", { method: "POST", json: data });
}

export function updateTalk(id: string, data: TalkWrite): Promise<AdminTalkDetail> {
  return request<AdminTalkDetail>(`/admin/talks/${id}`, {
    method: "PUT",
    json: data,
  });
}

export function deleteTalk(id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/admin/talks/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// 图片
// ---------------------------------------------------------------------------

export function uploadImage(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  return request<UploadResult>("/admin/uploads", { method: "POST", body: form });
}
