import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createMusicTrack,
  deleteMusicTrack,
  updateMusicTrack,
} from "../api/client";
import type {
  AdminMusicTrackDetail,
  MusicLyricLine,
  MusicTrackWrite,
  PostStatus,
} from "../api/types";
import { previewAssetUrl } from "../lib/format";
import { AudioUploadButton } from "./AudioUploadButton";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field } from "./Field";
import { ImageUploadButton } from "./ImageUploadButton";
import { StatusBadge } from "./StatusBadge";

const LRC_TIME = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

/** LRC 文本 → 时间轴数组；没有时间标签或空文本的行会被忽略。 */
function parseLrc(value: string): MusicLyricLine[] {
  const result: MusicLyricLine[] = [];

  for (const raw of value.split(/\r?\n/)) {
    const tags = [...raw.matchAll(LRC_TIME)];
    if (tags.length === 0) continue;

    const text = raw.replace(LRC_TIME, "").trim();
    if (!text) continue;

    for (const tag of tags) {
      const minutes = Number(tag[1]);
      const seconds = Number(tag[2]);
      const fraction = tag[3] ? Number(`0.${tag[3].padEnd(3, "0")}`) : 0;
      result.push({ time: minutes * 60 + seconds + fraction, text });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

/** 时间轴数组 → LRC 文本；保留三位小数，避免后台保存一次就丢精度。 */
function formatLrc(lines: MusicLyricLine[]): string {
  return lines
    .map(({ time, text }) => {
      const minutes = Math.floor(time / 60);
      const seconds = time - minutes * 60;
      const stamp = seconds.toFixed(3).padStart(6, "0");
      return `[${String(minutes).padStart(2, "0")}:${stamp}]${text}`;
    })
    .join("\n");
}

interface MusicFormProps {
  initial: AdminMusicTrackDetail | null;
}

export function MusicForm({ initial }: MusicFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [artist, setArtist] = useState(initial?.artist ?? "");
  const [duration, setDuration] = useState(
    initial ? String(initial.duration) : "",
  );
  const [cover, setCover] = useState(initial?.cover ?? "");
  const [audioUrl, setAudioUrl] = useState(initial?.audio_url ?? "");
  const [lyricsText, setLyricsText] = useState(
    formatLrc(initial?.lyrics ?? []),
  );
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? "draft");

  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (nextStatus: PostStatus) => {
      const payload: MusicTrackWrite = {
        title: title.trim(),
        artist: artist.trim(),
        duration: Number(duration),
        cover: cover.trim(),
        audio_url: audioUrl.trim() || null,
        lyrics: parseLrc(lyricsText),
        status: nextStatus,
      };

      return initial
        ? updateMusicTrack(initial.id, payload)
        : createMusicTrack(payload);
    },
    onSuccess: (result) => {
      setStatus(result.status);
      setLyricsText(formatLrc(result.lyrics));
      setMessage("已保存");
      queryClient.invalidateQueries({ queryKey: ["admin-music"] });
      queryClient.invalidateQueries({ queryKey: ["admin-music-track", result.id] });

      if (!initial) {
        navigate(`/music/${result.id}`, { replace: true });
      }
    },
    onError: (cause) => {
      setMessage("");
      setFormError(cause instanceof Error ? cause.message : "保存失败");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!initial) throw new Error("曲目尚未保存");
      return deleteMusicTrack(initial.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-music"] });
      navigate("/music", { replace: true });
    },
    onError: (cause) => {
      setConfirmDelete(false);
      setFormError(cause instanceof Error ? cause.message : "删除失败");
    },
  });

  const busy = saveMutation.isPending || deleteMutation.isPending;
  const lyricCount = parseLrc(lyricsText).length;

  function save(nextStatus: PostStatus) {
    setMessage("");
    setFormError("");

    if (!title.trim()) {
      setFormError("歌名不能为空");
      return;
    }
    if (!artist.trim()) {
      setFormError("歌手不能为空");
      return;
    }
    if (!Number.isFinite(Number(duration)) || Number(duration) <= 0) {
      setFormError("时长必须是大于 0 的秒数");
      return;
    }
    if (!cover.trim()) {
      setFormError("请上传封面或填写封面地址");
      return;
    }
    if (lyricsText.trim() && lyricCount === 0) {
      setFormError("歌词里没有识别到时间标签，格式应为 [mm:ss.xx]歌词");
      return;
    }

    saveMutation.mutate(nextStatus);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/35">
            {initial ? "编辑曲目" : "新建曲目"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white/90">
            {title.trim() || "未命名曲目"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/music")}
          >
            返回列表
          </button>
        </div>
      </header>

      {formError && (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {formError}
        </p>
      )}
      {message && (
        <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="glass-panel rounded-2xl p-6">
            <div className="flex flex-col gap-4">
              <input
                aria-label="歌名"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-lg font-medium text-white/90 outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-brand-400 focus:bg-white/[0.07]"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="歌名"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="歌手" hint="显示在歌名下方">
                  <input
                    className="field"
                    value={artist}
                    onChange={(event) => setArtist(event.target.value)}
                    placeholder="MyGO!!!!!"
                  />
                </Field>

                <Field label="时长（秒）" hint="播放器进度条的总长度">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="field"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    placeholder="256.67"
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white/85">歌词</h2>
                <p className="mt-1 text-xs text-white/35">
                  直接粘贴 LRC 文本，格式 [mm:ss.xx]歌词；当前识别 {lyricCount} 行。
                </p>
              </div>
            </div>

            <textarea
              className="field mt-4 min-h-[360px] resize-y font-mono text-xs leading-6"
              value={lyricsText}
              onChange={(event) => setLyricsText(event.target.value)}
              placeholder={"[00:15.153]悴んだ心 ふるえる眼差し\n[00:19.036]世界で 僕は ひとりぼっちだった"}
            />
          </section>
        </div>

        <aside className="flex flex-col gap-6 xl:sticky xl:top-24 xl:self-start">
          <section className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white/85">发布</h2>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => save(status)}
                disabled={busy}
              >
                {saveMutation.isPending ? "保存中…" : "保存"}
              </button>

              {status === "published" ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => save("draft")}
                  disabled={busy}
                >
                  转为草稿
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => save("published")}
                  disabled={busy}
                >
                  发布
                </button>
              )}

              {initial && (
                <button
                  type="button"
                  className="btn btn-danger mt-2"
                  onClick={() => setConfirmDelete(true)}
                  disabled={busy}
                >
                  删除曲目
                </button>
              )}
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white/85">封面</h2>
            <div className="mt-4 flex flex-col gap-3">
              {cover ? (
                <div className="relative overflow-hidden rounded-xl border border-white/10">
                  <img
                    src={previewAssetUrl(cover)}
                    alt="封面预览"
                    className="aspect-square w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white/80 transition hover:bg-black/80"
                    onClick={() => setCover("")}
                  >
                    移除
                  </button>
                </div>
              ) : (
                <div className="grid aspect-square place-items-center rounded-xl border border-dashed border-white/10 text-xs text-white/30">
                  暂无封面
                </div>
              )}
              <ImageUploadButton
                label="上传封面"
                onUploaded={(result) => setCover(result.url)}
              />
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white/85">音频</h2>
            <div className="mt-4 flex flex-col gap-3">
              <Field
                label="音频地址"
                hint="站内路径或 http(s) 直链；留空时用计时器模拟进度"
              >
                <input
                  className="field"
                  value={audioUrl}
                  onChange={(event) => setAudioUrl(event.target.value)}
                  placeholder="/audio/song.mp3"
                />
              </Field>

              <AudioUploadButton
                label="上传音频"
                onUploaded={(result) => setAudioUrl(result.url)}
              />

              {audioUrl && (
                <audio
                  controls
                  preload="none"
                  src={previewAssetUrl(audioUrl)}
                  className="w-full"
                />
              )}
            </div>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="删除这首曲目？"
        description="曲目、歌词和后台记录会一起删除，公开音乐页会立即不再显示。"
        pending={deleteMutation.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
