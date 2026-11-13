import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { uploadImage } from "../api/client";
import type { UploadResult } from "../api/types";

interface ImageUploadButtonProps {
  label: string;
  onUploaded: (result: UploadResult) => void;
}

/** 选图 → 上传 → 把 URL 交回调用方。封面和正文插图共用。 */
export function ImageUploadButton({
  label,
  onUploaded,
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: uploadImage,
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
        accept="image/jpeg,image/png,image/webp,image/gif"
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
