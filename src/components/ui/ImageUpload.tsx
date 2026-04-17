"use client";

import { useRef, useState } from "react";
import { DS } from "@/lib/design-tokens";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string, publicId?: string) => void;
  label?: string;
  folder?: string;
  aspectRatio?: "square" | "video" | "auto";
  /** Render a small thumbnail preview only (no upload UI), e.g. in list rows */
  previewOnly?: boolean;
  /** URL to show as the current image when previewOnly=true */
  currentImage?: string;
  /**
   * Parent passes its own isPending state — when true, clicks are blocked
   * and the replace/remove buttons show disabled style.
   */
  disabled?: boolean;
  /** Current publicId — used to auto-delete old image when replacing */
  publicId?: string;
}

const ASPECT = {
  square: "aspect-square",
  video: "aspect-video",
  auto: "",
};

async function deleteCloudinaryImage(publicId: string, retry = 1): Promise<void> {
 try {
 const res = await fetch(`/api/admin/upload?publicId=${encodeURIComponent(publicId)}`, {
 method: "DELETE",
 });
 if (!res.ok) {
 const json = await res.json().catch(() => ({}));
 console.error(`[ImageUpload] Failed to delete Cloudinary image publicId="${publicId}", status=${res.status}:`, json?.error ?? "unknown error");
 }
 } catch (err) {
 const msg = err instanceof Error ? err.message : String(err);
 if (retry > 0) {
 await new Promise((r) => setTimeout(r, 1000));
 return deleteCloudinaryImage(publicId, retry - 1);
 }
 console.error(`[ImageUpload] Failed to delete Cloudinary image publicId="${publicId}" after retry:`, msg);
 }
}

export function ImageUpload({
  value,
  onChange,
  label,
  folder = "loop-uploads",
  aspectRatio = "square",
  previewOnly = false,
  currentImage,
  disabled = false,
  publicId,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  /** Local blob preview — shown immediately after file pick, before Cloudinary upload finishes */
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const displayUrl = localPreview || value || currentImage;

  const upload = async (file: File) => {
    setLoading(true);
    setError(null);
    const blobUrl = URL.createObjectURL(file);
    setLocalPreview(blobUrl); // show local preview immediately
    try {
      // Auto-delete old image if we have its publicId
      if (publicId) {
        await deleteCloudinaryImage(publicId);
      }

      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Upload failed");
      // ok() wraps result in { data } — extract the upload result from it
      const uploadData = json?.data ?? json;
      const newUrl = (uploadData.url ?? uploadData.secure_url) as string;
      const newPublicId = uploadData.publicId as string | undefined;
      onChange(newUrl, newPublicId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setLocalPreview(null); // clear preview on error
    } finally {
      URL.revokeObjectURL(blobUrl);
      setLoading(false);
    }
  };

  const onFileChange = (file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large (max 10MB)");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setError("Invalid file type");
      return;
    }
    upload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileChange(file);
  };

  const handleRemove = async () => {
    // Delete from Cloudinary if we have publicId
    if (publicId) {
      await deleteCloudinaryImage(publicId);
    }
    onChange("", undefined);
    setLocalPreview(null);
  };

  if (previewOnly) {
    return (
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: 48, height: 48, borderRadius: 8, overflow: "hidden",
          cursor: "pointer", border: `1px solid ${DS.border}`,
          background: DS.bgCard,
        }}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Camera size={14} color={DS.text4} />
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={e => onFileChange(e.target.files?.[0] ?? null)} />
      </div>
    );
  }

  return (
    <div>
      {label && (
        <label style={{ display: "block", color: DS.text3, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", marginBottom: 6 }}>
          {label}
        </label>
      )}

      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => onFileChange(e.target.files?.[0] ?? null)} />

      {displayUrl ? (
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${DS.border}` }}>
          <img src={displayUrl} alt="Preview"
            className={aspectRatio !== "auto" ? ASPECT[aspectRatio] : ""}
            style={{ width: "100%", objectFit: "cover", display: "block", maxHeight: 280 }} />
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
            {/* Replace button */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading || disabled}
              style={{
                padding: "5px 10px", borderRadius: 7, fontSize: 11,
                background: "rgba(0,0,0,0.7)", border: "none", color: "#fff",
                cursor: loading || disabled ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "..." : "Thay đổi"}
            </button>
            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading || disabled}
              style={{
                padding: "5px 10px", borderRadius: 7, fontSize: 11,
                background: "rgba(239,68,68,0.8)", border: "none", color: "#fff",
                cursor: loading || disabled ? "not-allowed" : "pointer",
              }}
            >
              ✕
            </button>
          </div>
          {loading && (
            <div style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ color: "#fff", fontSize: 12 }}>Đang tải lên...</div>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !loading && !disabled && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); if (!disabled) setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
          style={{
            borderRadius: 12,
            border: `2px dashed ${isDragOver ? DS.blue : DS.border}`,
            background: isDragOver ? "rgba(59,130,246,0.05)" : "rgba(15,23,42,0.3)",
            transition: "all 0.15s",
            cursor: loading || disabled ? "not-allowed" : "pointer",
            padding: "40px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: isDragOver ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${isDragOver ? "rgba(59,130,246,0.3)" : DS.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
            }}>
              {loading ? (
                <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: DS.blue, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={DS.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
            </div>
          </div>
          <div style={{ color: DS.text2, fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            {loading ? "Đang tải lên Cloudinary..." : "Click hoặc kéo thả ảnh vào đây"}
          </div>
          <div style={{ color: DS.text4, fontSize: 11 }}>
            JPEG, PNG, WebP, GIF, SVG · Tối đa 10MB
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 6, color: DS.red, fontSize: 11 }}>
          ⚠ {error}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/** Inline icon helper — avoids importing lucide for just one icon */
function Camera({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
