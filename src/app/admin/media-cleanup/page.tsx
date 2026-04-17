"use client";

/**
 * Admin Media Cleanup Page
 * Displays all Cloudinary images, highlights orphans (not referenced in DB),
 * and allows selective or bulk deletion to reclaim storage.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trash2, RefreshCw, Search, CheckSquare, Square, Image as ImageIcon,
  AlertTriangle, HardDrive, X, Filter,
} from "lucide-react";
import { DS } from "@/lib/design-tokens";

type MediaResource = {
  publicId: string;
  url: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  createdAt: string;
  isUsed: boolean;
};

type MediaResponse = {
  resources: MediaResource[];
  nextCursor: string | null;
  totalInPage: number;
  orphanCount: number;
  usedCount: number;
  totalDbPublicIds: number;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function MediaCleanupPage() {
  const [folder, setFolder] = useState("loop-uploads");
  const [cursor, setCursor] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "orphan" | "used">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery<{ data: MediaResponse }>({
    queryKey: ["admin-media", folder, cursor],
    queryFn: async () => {
      const params = new URLSearchParams({ folder });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/admin/media?${params}`);
      if (!res.ok) throw new Error("Failed to load media");
      return res.json();
    },
  });

  const media = data?.data;
  const resources = media?.resources ?? [];

  // Filter + search
  const filtered = resources
    .filter((r) => {
      if (filterMode === "orphan") return !r.isUsed;
      if (filterMode === "used") return r.isUsed;
      return true;
    })
    .filter((r) =>
      search ? r.publicId.toLowerCase().includes(search.toLowerCase()) : true
    );

  const orphanCount = media?.orphanCount ?? 0;
  const usedCount = media?.usedCount ?? 0;
  const totalOrphanBytes = resources.filter((r) => !r.isUsed).reduce((sum, r) => sum + r.bytes, 0);

  // Bulk delete mutation
  const deleteMut = useMutation({
    mutationFn: async (publicIds: string[]) => {
      const res = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicIds }),
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["admin-media"] });
    },
  });

  const toggleSelect = (publicId: string) => {
    const next = new Set(selected);
    if (next.has(publicId)) next.delete(publicId);
    else next.add(publicId);
    setSelected(next);
  };

  const selectAllOrphans = () => {
    const orphans = resources.filter((r) => !r.isUsed).map((r) => r.publicId);
    setSelected(new Set(orphans));
  };

  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    if (!confirm(`Xóa ${selected.size} ảnh từ Cloudinary? Hành động này không thể hoàn tác.`)) return;
    deleteMut.mutate(Array.from(selected));
  };

  // Stats card component
  function Stat({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: React.ReactNode }) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px", borderRadius: 12,
        background: `${color}08`,
        border: `1px solid ${color}22`,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color}18`, border: `1px solid ${color}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontFamily: DS.heading, fontSize: 18, fontWeight: 700, color }}>{value}</div>
          <div style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text3, marginTop: 1 }}>{label}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 22, fontWeight: 800, color: DS.text, marginBottom: 4 }}>
            Media Cleanup
          </h1>
          <p style={{ fontSize: 13, color: DS.text3 }}>
            Quản lý ảnh Cloudinary · Xóa ảnh orphan để tiết kiệm dung lượng
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            style={{
              padding: "8px 14px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent", color: DS.text3,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13,
            }}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Quét lại
          </button>
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleteMut.isPending}
              style={{
                padding: "8px 16px", borderRadius: 8,
                border: "none", background: "#EF4444", color: "#fff",
                fontWeight: 600, cursor: "pointer", display: "flex",
                alignItems: "center", gap: 6, fontSize: 13,
                opacity: deleteMut.isPending ? 0.6 : 1,
              }}
            >
              <Trash2 size={14} />
              {deleteMut.isPending ? "Đang xóa..." : `Xóa ${selected.size} ảnh`}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Stat label="Tổng ảnh" value={resources.length} color={DS.blue} icon={<ImageIcon size={16} color={DS.blue} />} />
        <Stat label="Đang sử dụng" value={usedCount} color="#22C55E" icon={<CheckSquare size={16} color="#22C55E" />} />
        <Stat label="Orphan (không dùng)" value={orphanCount} color="#F59E0B" icon={<AlertTriangle size={16} color="#F59E0B" />} />
        <Stat label="Dung lượng orphan" value={formatBytes(totalOrphanBytes)} color="#EF4444" icon={<HardDrive size={16} color="#EF4444" />} />
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: DS.text3 }} />
          <input
            style={{
              width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)", color: DS.text,
              fontSize: 13, outline: "none", boxSizing: "border-box",
            }}
            placeholder="Tìm theo public ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Folder input */}
        <input
          style={{
            padding: "8px 12px", borderRadius: 8, width: 200,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)", color: DS.text,
            fontSize: 13, outline: "none",
          }}
          placeholder="Folder..."
          value={folder}
          onChange={(e) => { setFolder(e.target.value); setCursor(null); }}
        />

        {/* Filter buttons */}
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 3, border: "1px solid rgba(255,255,255,0.06)" }}>
          {(["all", "orphan", "used"] as const).map((mode) => {
            const active = filterMode === mode;
            const labels = { all: "Tất cả", orphan: "Orphan", used: "Đang dùng" };
            const colors = { all: DS.text, orphan: "#F59E0B", used: "#22C55E" };
            return (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                style={{
                  padding: "6px 14px", borderRadius: 6, fontSize: 12,
                  border: active ? `1px solid ${colors[mode]}44` : "1px solid transparent",
                  background: active ? `${colors[mode]}15` : "transparent",
                  color: active ? colors[mode] : DS.text3,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {labels[mode]}
                {mode === "orphan" && orphanCount > 0 && (
                  <span style={{
                    marginLeft: 6, padding: "1px 6px", borderRadius: 9999,
                    background: "#F59E0B22", color: "#F59E0B",
                    fontSize: 10, fontWeight: 700,
                  }}>
                    {orphanCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Select all orphans */}
        {orphanCount > 0 && (
          <button
            onClick={selectAllOrphans}
            style={{
              padding: "6px 14px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent", color: DS.text3,
              cursor: "pointer", fontSize: 12,
            }}
          >
            Chọn tất cả orphan ({orphanCount})
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ padding: 60, textAlign: "center", color: DS.text3 }}>Đang quét Cloudinary...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: DS.text3 }}>
          {resources.length === 0 ? "Không tìm thấy ảnh nào trong folder này" : "Không có ảnh nào khớp bộ lọc"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {filtered.map((r) => {
            const isSelected = selected.has(r.publicId);
            return (
              <div
                key={r.publicId}
                style={{
                  borderRadius: 12, overflow: "hidden",
                  border: `1px solid ${isSelected ? DS.blue + "66" : r.isUsed ? "rgba(255,255,255,0.06)" : "#F59E0B33"}`,
                  background: isSelected ? `${DS.blue}08` : "rgba(255,255,255,0.02)",
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                {/* Select checkbox */}
                <button
                  onClick={() => toggleSelect(r.publicId)}
                  style={{
                    position: "absolute", top: 6, left: 6, zIndex: 2,
                    width: 24, height: 24, borderRadius: 6,
                    background: isSelected ? DS.blue : "rgba(0,0,0,0.5)",
                    border: isSelected ? "none" : "1px solid rgba(255,255,255,0.3)",
                    cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                </button>

                {/* Status badge */}
                <div style={{
                  position: "absolute", top: 6, right: 6, zIndex: 2,
                  padding: "2px 8px", borderRadius: 9999,
                  background: r.isUsed ? "rgba(34,197,94,0.8)" : "rgba(245,158,11,0.8)",
                  fontSize: 9, fontWeight: 700, color: "#fff",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  {r.isUsed ? "Đang dùng" : "Orphan"}
                </div>

                {/* Image */}
                <div
                  style={{ aspectRatio: "16/10", cursor: "pointer", overflow: "hidden" }}
                  onClick={() => setPreviewUrl(r.url)}
                >
                  <img
                    src={r.url}
                    alt=""
                    style={{
                      width: "100%", height: "100%", objectFit: "cover", display: "block",
                      opacity: r.isUsed ? 1 : 0.7,
                    }}
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div style={{ padding: "8px 10px" }}>
                  <div style={{
                    fontFamily: DS.mono, fontSize: 9, color: DS.text3,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    marginBottom: 4,
                  }}>
                    {r.publicId.split("/").pop()}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text4 }}>
                      {formatBytes(r.bytes)} · {r.width}×{r.height}
                    </span>
                    <span style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text4 }}>
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {media?.nextCursor && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => setCursor(media.nextCursor)}
            style={{
              padding: "10px 24px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)", color: DS.text2,
              cursor: "pointer", fontSize: 13, fontWeight: 500,
            }}
          >
            Tải thêm →
          </button>
        </div>
      )}

      {/* Image preview modal */}
      {previewUrl && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, cursor: "pointer",
          }}
          onClick={() => setPreviewUrl(null)}
        >
          <button
            onClick={() => setPreviewUrl(null)}
            style={{
              position: "absolute", top: 16, right: 16,
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.1)", border: "none",
              color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              maxWidth: "90vw", maxHeight: "85vh",
              borderRadius: 12, objectFit: "contain",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}
