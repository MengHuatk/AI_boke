import type {
  AdminFriendLinkDetail,
  AdminFriendLinkSummary,
  AdminMomentDetail,
  AdminMomentSummary,
  AdminMusicTrackDetail,
  AdminMusicTrackSummary,
  AdminPhotoAlbumDetail,
  AdminPhotoAlbumSummary,
  AdminPostDetail,
  AdminPostSummary,
  AdminProjectDetail,
  AdminProjectSummary,
  AdminSession,
  AdminTalkDetail,
  AdminTalkSummary,
  AudioUploadResult,
  FriendLinkWrite,
  MomentWrite,
  MusicTrackWrite,
  PhotoAlbumWrite,
  PostStatus,
  PostWrite,
  ProjectWrite,
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
// 照片集
// ---------------------------------------------------------------------------

export function listAlbums(
  params: ContentListParams = {},
): Promise<AdminPhotoAlbumSummary[]> {
  return request<AdminPhotoAlbumSummary[]>(`/admin/albums${buildQuery(params)}`);
}

export function getAlbum(id: string): Promise<AdminPhotoAlbumDetail> {
  return request<AdminPhotoAlbumDetail>(`/admin/albums/${id}`);
}

export function createAlbum(data: PhotoAlbumWrite): Promise<AdminPhotoAlbumDetail> {
  return request<AdminPhotoAlbumDetail>("/admin/albums", {
    method: "POST",
    json: data,
  });
}

export function updateAlbum(
  id: string,
  data: PhotoAlbumWrite,
): Promise<AdminPhotoAlbumDetail> {
  return request<AdminPhotoAlbumDetail>(`/admin/albums/${id}`, {
    method: "PUT",
    json: data,
  });
}

export function deleteAlbum(id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/admin/albums/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// 项目
// ---------------------------------------------------------------------------

export function listProjects(
  params: ContentListParams = {},
): Promise<AdminProjectSummary[]> {
  return request<AdminProjectSummary[]>(`/admin/projects${buildQuery(params)}`);
}

export function getProject(id: string): Promise<AdminProjectDetail> {
  return request<AdminProjectDetail>(`/admin/projects/${id}`);
}

export function createProject(data: ProjectWrite): Promise<AdminProjectDetail> {
  return request<AdminProjectDetail>("/admin/projects", {
    method: "POST",
    json: data,
  });
}

export function updateProject(
  id: string,
  data: ProjectWrite,
): Promise<AdminProjectDetail> {
  return request<AdminProjectDetail>(`/admin/projects/${id}`, {
    method: "PUT",
    json: data,
  });
}

export function deleteProject(id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/admin/projects/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// 友链
// ---------------------------------------------------------------------------

export function listLinks(
  params: ContentListParams = {},
): Promise<AdminFriendLinkSummary[]> {
  return request<AdminFriendLinkSummary[]>(`/admin/links${buildQuery(params)}`);
}

export function getLink(id: string): Promise<AdminFriendLinkDetail> {
  return request<AdminFriendLinkDetail>(`/admin/links/${id}`);
}

export function createLink(data: FriendLinkWrite): Promise<AdminFriendLinkDetail> {
  return request<AdminFriendLinkDetail>("/admin/links", {
    method: "POST",
    json: data,
  });
}

export function updateLink(
  id: string,
  data: FriendLinkWrite,
): Promise<AdminFriendLinkDetail> {
  return request<AdminFriendLinkDetail>(`/admin/links/${id}`, {
    method: "PUT",
    json: data,
  });
}

export function deleteLink(id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/admin/links/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// 音乐
// ---------------------------------------------------------------------------

export function listMusicTracks(
  params: ContentListParams = {},
): Promise<AdminMusicTrackSummary[]> {
  return request<AdminMusicTrackSummary[]>(
    `/admin/music${buildQuery(params)}`,
  );
}

export function getMusicTrack(id: string): Promise<AdminMusicTrackDetail> {
  return request<AdminMusicTrackDetail>(`/admin/music/${id}`);
}

export function createMusicTrack(
  data: MusicTrackWrite,
): Promise<AdminMusicTrackDetail> {
  return request<AdminMusicTrackDetail>("/admin/music", {
    method: "POST",
    json: data,
  });
}

export function updateMusicTrack(
  id: string,
  data: MusicTrackWrite,
): Promise<AdminMusicTrackDetail> {
  return request<AdminMusicTrackDetail>(`/admin/music/${id}`, {
    method: "PUT",
    json: data,
  });
}

export function deleteMusicTrack(id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/admin/music/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// 生活动态
// ---------------------------------------------------------------------------

export function listMoments(
  params: ContentListParams = {},
): Promise<AdminMomentSummary[]> {
  return request<AdminMomentSummary[]>(`/admin/moments${buildQuery(params)}`);
}

export function getMoment(id: string): Promise<AdminMomentDetail> {
  return request<AdminMomentDetail>(`/admin/moments/${id}`);
}

export function createMoment(data: MomentWrite): Promise<AdminMomentDetail> {
  return request<AdminMomentDetail>("/admin/moments", {
    method: "POST",
    json: data,
  });
}

export function updateMoment(
  id: string,
  data: MomentWrite,
): Promise<AdminMomentDetail> {
  return request<AdminMomentDetail>(`/admin/moments/${id}`, {
    method: "PUT",
    json: data,
  });
}

export function deleteMoment(id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/admin/moments/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// 图片与音频
// ---------------------------------------------------------------------------

export function uploadImage(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  return request<UploadResult>("/admin/uploads", { method: "POST", body: form });
}

export function uploadAudio(file: File): Promise<AudioUploadResult> {
  const form = new FormData();
  form.append("file", file);
  return request<AudioUploadResult>("/admin/uploads/audio", {
    method: "POST",
    body: form,
  });
}
