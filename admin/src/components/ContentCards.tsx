import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import type {
  AdminFriendLinkSummary,
  AdminMomentSummary,
  AdminMusicTrackSummary,
  AdminPhotoAlbumSummary,
  AdminPostSummary,
  AdminProjectSummary,
  AdminTalkSummary,
} from "../api/types";
import {
  formatDateTime,
  formatDuration,
  previewAssetUrl,
} from "../lib/format";
import { StatusBadge } from "./StatusBadge";

interface ContentCardProps {
  to: string;
  onDelete: () => void;
  media: ReactNode;
  title: string;
  description?: string;
  meta?: ReactNode;
  tags?: ReactNode;
}

/** 后台卡片外壳：上方预览、下方信息与操作，和公开站卡片保持同一套毛玻璃语言。 */
function ContentCard({
  to,
  onDelete,
  media,
  title,
  description,
  meta,
  tags,
}: ContentCardProps) {
  return (
    <li className="glass-panel group flex flex-col overflow-hidden rounded-glass">
      <Link to={to} className="flex min-h-0 flex-1 flex-col">
        {media}

        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-sm font-medium leading-5 text-white/85 transition-colors group-hover:text-white">
            {title}
          </h3>
          {description && (
            <p className="line-clamp-2 text-xs leading-5 text-white/40">
              {description}
            </p>
          )}
          {tags && <div className="mt-auto flex flex-wrap gap-1.5 pt-1">{tags}</div>}
          {meta && (
            <div className="text-[10px] leading-4 text-white/30">{meta}</div>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-2 border-t border-white/10 px-4 py-2">
        <Link to={to} className="btn btn-ghost px-3 py-1 text-xs">
          编辑
        </Link>
        <button
          type="button"
          className="btn btn-danger px-3 py-1 text-xs"
          onClick={onDelete}
        >
          删除
        </button>
      </div>
    </li>
  );
}

function Cover({
  src,
  alt,
  children,
}: {
  src: string | null;
  alt: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-white/5">
      {src ? (
        <img
          src={previewAssetUrl(src)}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="grid h-full place-items-center text-2xl text-white/15">
          ▧
        </div>
      )}
      {children}
    </div>
  );
}

function TagChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-brand-500/15 px-1.5 py-0.5 text-[10px] leading-none text-brand-200">
      #{label}
    </span>
  );
}

export function PostAdminCard({
  post,
  onDelete,
}: {
  post: AdminPostSummary;
  onDelete: () => void;
}) {
  return (
    <ContentCard
      to={`/posts/${post.id}`}
      onDelete={onDelete}
      media={
        <Cover src={post.cover} alt={post.title}>
          <span className="absolute left-2 top-2">
            <StatusBadge status={post.status} />
          </span>
          {post.featured && (
            <span className="absolute right-2 top-2 rounded-full bg-brand-500/80 px-2 py-0.5 text-[10px] text-white">
              精选
            </span>
          )}
        </Cover>
      }
      title={post.title}
      description={post.excerpt}
      meta={`/posts/${post.slug} · ${formatDateTime(post.updated_at)} 更新`}
      tags={post.tags.map((tag) => (
        <TagChip key={tag} label={tag} />
      ))}
    />
  );
}

export function TalkAdminCard({
  talk,
  onDelete,
}: {
  talk: AdminTalkSummary;
  onDelete: () => void;
}) {
  return (
    <ContentCard
      to={`/talks/${talk.id}`}
      onDelete={onDelete}
      media={
        <Cover src={talk.cover} alt={talk.title}>
          <span className="absolute left-2 top-2">
            <StatusBadge status={talk.status} />
          </span>
          {talk.mood && (
            <span className="absolute right-2 top-2 rounded-md border border-white/20 bg-black/35 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur">
              {talk.mood}
            </span>
          )}
        </Cover>
      }
      title={talk.title}
      description={talk.excerpt}
      meta={`/talks/${talk.slug} · ${formatDateTime(talk.updated_at)} 更新`}
      tags={talk.tags.map((tag) => (
        <TagChip key={tag} label={tag} />
      ))}
    />
  );
}

export function AlbumAdminCard({
  album,
  onDelete,
}: {
  album: AdminPhotoAlbumSummary;
  onDelete: () => void;
}) {
  return (
    <ContentCard
      to={`/albums/${album.id}`}
      onDelete={onDelete}
      media={
        <Cover src={album.cover} alt={album.title}>
          <span className="absolute left-2 top-2">
            <StatusBadge status={album.status} />
          </span>
          <span className="absolute bottom-2 right-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] text-white/80">
            {album.photo_count} 张
          </span>
        </Cover>
      }
      title={album.title}
      description={album.description}
      meta={`${album.created_at} · ${formatDateTime(album.updated_at)} 更新`}
    />
  );
}

export function ProjectAdminCard({
  project,
  onDelete,
}: {
  project: AdminProjectSummary;
  onDelete: () => void;
}) {
  return (
    <ContentCard
      to={`/projects/${project.id}`}
      onDelete={onDelete}
      media={
        <div className="flex h-24 shrink-0 items-center gap-3 bg-white/5 px-4">
          <span aria-hidden="true" className="text-3xl leading-none">
            {project.emoji || "✨"}
          </span>
          <span className="min-w-0 flex-1 truncate text-[11px] text-white/30">
            {project.repo_url}
          </span>
          <StatusBadge status={project.status} />
        </div>
      }
      title={project.title}
      description={project.readme_title}
      meta={`${formatDateTime(project.updated_at)} 更新`}
      tags={project.tech_stack.map((tag) => (
        <TagChip key={tag} label={tag} />
      ))}
    />
  );
}

export function LinkAdminCard({
  link,
  onDelete,
}: {
  link: AdminFriendLinkSummary;
  onDelete: () => void;
}) {
  return (
    <ContentCard
      to={`/links/${link.id}`}
      onDelete={onDelete}
      media={
        <div className="flex h-24 shrink-0 items-center gap-3 bg-white/5 px-4">
          <img
            src={previewAssetUrl(link.avatar)}
            alt=""
            loading="lazy"
            className="size-14 shrink-0 rounded-full object-cover ring-1 ring-white/15"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] tracking-[0.16em] text-brand-300">ONLINE</p>
            <p className="mt-1 truncate text-[11px] text-white/35">{link.href}</p>
          </div>
          <StatusBadge status={link.status} />
        </div>
      }
      title={link.name}
      description={link.bio}
      meta={`${formatDateTime(link.updated_at)} 更新`}
    />
  );
}

export function MusicAdminCard({
  track,
  onDelete,
}: {
  track: AdminMusicTrackSummary;
  onDelete: () => void;
}) {
  return (
    <ContentCard
      to={`/music/${track.id}`}
      onDelete={onDelete}
      media={
        <Cover src={track.cover} alt={track.title}>
          <span className="absolute left-2 top-2">
            <StatusBadge status={track.status} />
          </span>
          <span className="absolute bottom-2 right-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] tabular-nums text-white/80">
            {formatDuration(track.duration)}
          </span>
        </Cover>
      }
      title={track.title}
      description={track.artist}
      meta={`${track.lyric_count} 行歌词 · ${
        track.audio_url ? "有音频" : "无音频"
      } · ${formatDateTime(track.updated_at)} 更新`}
    />
  );
}

export function MomentAdminCard({
  moment,
  onDelete,
}: {
  moment: AdminMomentSummary;
  onDelete: () => void;
}) {
  const location = [
    moment.location.province,
    moment.location.city,
    moment.location.district,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ContentCard
      to={`/moments/${moment.id}`}
      onDelete={onDelete}
      media={
        <Cover src={moment.images[0]?.src ?? null} alt="">
          <span className="absolute left-2 top-2">
            <StatusBadge status={moment.status} />
          </span>
          {moment.images.length > 0 && (
            <span className="absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] tabular-nums text-white/80">
              {moment.images.length} 张
            </span>
          )}
        </Cover>
      }
      title={moment.content}
      description={location || "未标注位置"}
      meta={`${
        moment.published_at
          ? formatDateTime(moment.published_at)
          : "未设置发布时间"
      } · ${formatDateTime(moment.updated_at)} 更新`}
    />
  );
}
