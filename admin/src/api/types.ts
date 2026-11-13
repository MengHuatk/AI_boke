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

// ---------------------------------------------------------------------------
// 照片集 / 项目 / 友链
// ---------------------------------------------------------------------------

export interface PhotoItem {
  id: string;
  src: string;
  alt: string;
  title: string;
  width: number;
  height: number;
}

export interface PhotoItemWrite {
  src: string;
  alt: string;
  title: string;
  width: number;
  height: number;
}

export interface PhotoAlbumWrite {
  slug: string;
  title: string;
  description: string;
  created_at: string;
  status: PostStatus;
  photos: PhotoItemWrite[];
}

export interface AdminPhotoAlbumSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  created_at: string;
  status: PostStatus;
  sort_order: number;
  photo_count: number;
  cover: string | null;
  updated_at: string;
}

export interface AdminPhotoAlbumDetail extends AdminPhotoAlbumSummary {
  photos: PhotoItem[];
}

export interface ProjectWrite {
  title: string;
  readme_title: string;
  tech_stack: string[];
  repo_url: string;
  emoji: string;
  status: PostStatus;
}

export interface AdminProjectSummary {
  id: string;
  title: string;
  readme_title: string;
  tech_stack: string[];
  repo_url: string;
  emoji: string;
  status: PostStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AdminProjectDetail extends AdminProjectSummary {}

export interface FriendLinkWrite {
  name: string;
  avatar: string;
  bio: string;
  href: string;
  status: PostStatus;
}

export interface AdminFriendLinkSummary {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  href: string;
  status: PostStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AdminFriendLinkDetail extends AdminFriendLinkSummary {}

export interface MusicLyricLine {
  /** 该行开始演唱的时间点（秒） */
  time: number;
  text: string;
}

export interface MusicTrackWrite {
  title: string;
  artist: string;
  /** 总时长（秒） */
  duration: number;
  cover: string;
  audio_url: string | null;
  lyrics: MusicLyricLine[];
  status: PostStatus;
}

export interface AdminMusicTrackSummary {
  id: string;
  title: string;
  artist: string;
  duration: number;
  cover: string;
  audio_url: string | null;
  lyric_count: number;
  status: PostStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AdminMusicTrackDetail extends AdminMusicTrackSummary {
  lyrics: MusicLyricLine[];
}

export interface MomentImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface MomentLocation {
  province: string;
  city: string;
  district: string;
}

export interface MomentWrite {
  content: string;
  images: MomentImage[];
  location: MomentLocation;
  status: PostStatus;
  published_at: string | null;
}

export interface AdminMomentSummary {
  id: string;
  content: string;
  images: MomentImage[];
  location: MomentLocation;
  status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminMomentDetail extends AdminMomentSummary {}

export interface AdminSession {
  authenticated: boolean;
}

export interface UploadResult {
  url: string;
  width: number;
  height: number;
}

export interface AudioUploadResult {
  url: string;
}
