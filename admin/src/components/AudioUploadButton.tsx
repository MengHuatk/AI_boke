import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { uploadAudio } from "../api/client";
import type { AudioUploadResult } from "../api/types";

interface AudioUploadButtonProps {
  label: string;
  onUploaded: (result: AudioUploadResult) => void;
}

/** 选音频 → 上传 → 把 URL 交回表单。 */
export function AudioUploadButton({
  label,
  onUploaded,
}: AudioUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: uploadAudio,
    onSuccess: (result) => {
      setError("");
      onUploaded(result);
    },
    onError: (cause) => {
      setError(cause instanceof Error ? cause.message : "上传失败");
    },
  });

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        className="btn btn-ghost px-3 py-1.5 text-xs"
        onClick={() => inputRef.current?.click()}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "上传中…" : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.m4a,.aac,.wav,.ogg,.flac,audio/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) mutation.mutate(file);
          event.target.value = "";
        }}
      />
      {error && <span className="text-xs text-rose-300">{error}</span>}
    </div>
  );
}
