"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES = 5 * 1024 * 1024;

type ProfilePhotoFieldProps = {
  disabled?: boolean;
  onChange: (file: File | null) => void;
};

export function ProfilePhotoField({ disabled, onChange }: ProfilePhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function clearPreview() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }

  function handleFile(file: File | null) {
    clearPreview();
    if (!file) {
      onChange(null);
      return;
    }
    if (!ACCEPT.split(",").includes(file.type) || file.size > MAX_BYTES) return;
    setPreview(URL.createObjectURL(file));
    onChange(file);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-300">Profile photo</p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] transition-colors",
            "hover:border-amber-400/35 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
            disabled && "pointer-events-none opacity-50",
          )}
          aria-label="Upload profile photo"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-5 w-5 text-slate-500" />
          )}
        </button>

        {preview ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              handleFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-500 transition-colors hover:border-white/20 hover:text-slate-300"
            aria-label="Remove photo"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        name="avatar"
        accept={ACCEPT}
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
