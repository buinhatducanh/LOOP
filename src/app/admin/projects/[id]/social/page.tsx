"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectHeader } from "@/components/admin/shared/project-header";

interface Props { params: Promise<{ id: string }>; }

interface SocialPost {
  id: string; projectId: string; platform: string; content: string;
  mediaUrls: string[]; scheduledAt: string | null; publishedAt: string | null;
  status: string; postUrl: string | null;
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877F2", tiktok: "#000", instagram: "#E4405F",
  zalo: "#0068FF",
};
const PLATFORM_ICONS: Record<string, string> = {
  facebook: "📘", tiktok: "🎵", instagram: "📷", zalo: "💬",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "rgba(100,116,139,0.2)", scheduled: "rgba(59,130,246,0.2)",
  published: "rgba(16,185,129,0.2)", failed: "rgba(239,68,68,0.2)",
};
const STATUS_TEXT: Record<string, string> = {
  draft: "#94a3b8", scheduled: "#60a5fa", published: "#10B981", failed: "#EF4444",
};

const VI_DATE = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
});

export default function SocialPage({ params: paramsPromise }: Props) {
  const [projectId, setProjectId] = useState("");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("facebook");
  const [form, setForm] = useState({ content: "", scheduledAt: "", postUrl: "" });

  useEffect(() => { paramsPromise.then(p => setProjectId(p.id)); }, [paramsPromise]);

  const fetchPosts = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/social-posts?projectId=${projectId}`);
      const json = await res.json();
      setPosts(json.data ?? []);
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const createPost = async () => {
    if (!projectId) return;
    await fetch("/api/admin/social-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        platform: selectedPlatform,
        content: form.content,
        scheduledAt: form.scheduledAt || null,
      }),
    });
    setCreateOpen(false);
    setForm({ content: "", scheduledAt: "", postUrl: "" });
    fetchPosts();
  };

  const publishNow = async (id: string) => {
    setPublishing(id);
    try {
      await fetch(`/api/admin/social-posts/${id}/publish`, { method: "POST" });
      fetchPosts();
    } finally { setPublishing(null); }
  };

  const platforms = ["facebook", "tiktok", "instagram", "zalo"] as const;
  const statusCounts = platforms.reduce((acc, p) => {
    acc[p] = posts.filter(post => post.platform === p && post.status === "published").length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6">
      <ProjectHeader projectId={projectId} className="mb-6" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Social Posts</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            Lên lịch & quản lý bài đăng mạng xã hội
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="rounded-lg px-4 py-2 text-sm font-bold text-white"
          style={{ background: "#6366F1" }}>
          + Tạo bài đăng
        </button>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {platforms.map(p => (
          <button key={p} onClick={() => setSelectedPlatform(p)}
            className="rounded-xl border p-4 text-center transition-all"
            style={{
              background: selectedPlatform === p ? `${PLATFORM_COLORS[p]}15` : "rgba(255,255,255,0.02)",
              borderColor: selectedPlatform === p ? `${PLATFORM_COLORS[p]}40` : "rgba(255,255,255,0.08)",
            }}>
            <p className="text-2xl mb-1">{PLATFORM_ICONS[p]}</p>
            <p className="text-xs font-medium capitalize" style={{ color: PLATFORM_COLORS[p] }}>{p}</p>
            <p className="text-lg font-black text-white mt-1">{statusCounts[p] ?? 0}</p>
            <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>published</p>
          </button>
        ))}
      </div>

      {/* Posts list */}
      {loading ? (
        <p className="text-center py-20" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải...</p>
      ) : posts.filter(p => p.platform === selectedPlatform).length === 0 ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">{PLATFORM_ICONS[selectedPlatform]}</p>
          <p className="text-sm mb-4" style={{ color: "rgba(209,213,219,0.3)" }}>Chưa có bài đăng nào</p>
          <button onClick={() => setCreateOpen(true)}
            className="rounded-lg px-4 py-2 text-sm font-bold text-white"
            style={{ background: PLATFORM_COLORS[selectedPlatform] }}>
            + Tạo bài đăng đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.filter(p => p.platform === selectedPlatform).map(post => (
            <div key={post.id}
              className="rounded-xl border p-4"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{PLATFORM_ICONS[post.platform]}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded"
                    style={{ background: STATUS_COLORS[post.status], color: STATUS_TEXT[post.status] }}>
                    {post.status === "scheduled" ? "Đã lên lịch" :
                     post.status === "published" ? "Đã đăng" :
                     post.status === "failed" ? "Thất bại" : "Nháp"}
                  </span>
                  {post.scheduledAt && (
                    <span className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                      {VI_DATE.format(new Date(post.scheduledAt))}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {post.postUrl && (
                    <a href={post.postUrl} target="_blank" rel="noopener noreferrer"
                      className="rounded-lg border px-3 py-1 text-xs text-white border-white/10 hover:bg-white/5 transition-colors">
                      ↗ Xem
                    </a>
                  )}
                  {post.status !== "published" && (
                    <button
                      onClick={() => publishNow(post.id)}
                      disabled={publishing === post.id}
                      className="rounded-lg px-3 py-1 text-xs font-bold text-white disabled:opacity-40"
                      style={{ background: PLATFORM_COLORS[post.platform] }}>
                      {publishing === post.id ? "..." : "▶ Đăng ngay"}
                    </button>
                  )}
                </div>
              </div>
              {post.content && (
                <p className="text-sm text-white">{post.content}</p>
              )}
              {post.mediaUrls.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {post.mediaUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="text-xs underline truncate max-w-[200px]"
                      style={{ color: "rgba(139,92,246,0.7)" }}>
                      📎 Media {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl border p-6 w-full max-w-lg"
            style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}>
            <h2 className="text-lg font-bold text-white mb-4">
              {PLATFORM_ICONS[selectedPlatform]} Tạo bài đăng {selectedPlatform}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Nội dung</label>
                <textarea value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={5} placeholder="Viết nội dung bài đăng..."
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Lên lịch (tùy chọn)</label>
                <input type="datetime-local" value={form.scheduledAt}
                  onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={createPost} className="flex-1 rounded-lg py-2 text-sm font-bold text-white"
                style={{ background: PLATFORM_COLORS[selectedPlatform] }}>
                {form.scheduledAt ? "📅 Lên lịch" : "💾 Lưu nháp"}
              </button>
              <button onClick={() => setCreateOpen(false)}
                className="rounded-lg border px-4 py-2 text-sm text-gray-400 border-white/10">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
