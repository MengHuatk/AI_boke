export type PostStatus = "draft" | "published";

export interface AdminPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover: string | null;
  tags: string[];
  status: PostStatus;
  featured: boolean;
  reading_minutes: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPostDetail extends AdminPostSummary {
  body: string;
}

export interface AdminTalkSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover: string | null;
  tags: string[];
  mood: string;
  status: PostStatus;
  reading_minutes: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminTalkDetail extends AdminTalkSummary {
  body: string;
}

export interface PostWrite {
  slug: string;
  title: string;
  excerpt: string;
  cover: string | null;
  body: string;
  tags: string[];
  status: PostStatus;
  featured: boolean;
  published_at: string | null;
}

export interface TalkWrite {
  slug: string;
  title: string;
  excerpt: string;
  cover: string | null;
  body: string;
  tags: string[];
  mood: string;
  status: PostStatus;
  published_at: string | null;
}

export interface AdminSession {
  authenticated: boolean;
}

export interface UploadResult {
  url: string;
  width: number;
  height: number;
}
