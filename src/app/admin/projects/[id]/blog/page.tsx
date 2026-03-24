"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectHeader } from "@/components/admin/shared/project-header";
import { BlogPostEditor } from "@/components/admin/editors/blog-post-editor";
import { toast } from "sonner";

interface Props { params: Promise<{ id: string }>; }

interface BlogPost {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  seoTitle: string | null;
  seoDesc: string | null;
  status: string;
  lpEarned: boolean;
  lpAwardedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  project: { id: string; orderNumber: string; customerName: string };
  author: { id: string; name: string } | null;
}

interface TeamMember { id: string; name: string; role: string; }

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  published: "bg-green-500/20 text-green-400 border-green-500/30",
  archived: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export default function BlogPage({ params: paramsPromise }: Props) {
  const [projectId, setProjectId] = useState("");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", slug: "", content: "", excerpt: "",
    seoTitle: "", seoDesc: "", authorId: "",
  });

  useEffect(() => { paramsPromise.then(p => setProjectId(p.id)); }, [paramsPromise]);

  const fetchPosts = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog-posts?projectId=${projectId}`);
      const json = await res.json();
      setPosts(json.data ?? []);
    } finally { setLoading(false); }
  }, [projectId]);

  const fetchMembers = useCallback(async () => {
    const res = await fetch("/api/admin/team-members");
    const json = await res.json();
    setMembers(json.data ?? []);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const createPost = async () => {
    if (!form.title || !form.slug || !form.authorId) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/blog-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, projectId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Đã tạo bài viết");
      setCreateOpen(false);
      setForm({ title: "", slug: "", content: "", excerpt: "", seoTitle: "", seoDesc: "", authorId: "" });
      fetchPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi tạo bài viết");
    } finally { setSaving(false); }
  };

  const publish = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/blog-posts/${id}/publish`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`Đã publish & trao ⬡1 LP`);
      fetchPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi publish");
    }
  };

  const published = posts.filter(p => p.status === "published").length;
  const drafts = posts.filter(p => p.status === "draft").length;

  return (
    <div className="p-6">
      <ProjectHeader projectId={projectId} className="mb-6" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Blog Posts</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            Quản lý bài viết SEO & LP rewards
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="rounded-lg px-4 py-2 text-sm font-bold text-white"
          style={{ background: "#6366F1" }}>
          + Viết bài mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {([
          { label: "Tổng bài", value: posts.length, color: "#94a3b8" },
          { label: "Đã đăng", value: published, color: "#10B981" },
          { label: "Nháp", value: drafts, color: "#F59E0B" },
        ] as const).map(s => (
          <div key={s.label} className="rounded-xl border p-4 text-center"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Posts list */}
      {loading ? (
        <p className="text-center py-20" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải...</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">📝</p>
          <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Chưa có bài viết nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id}
              className="rounded-xl border p-4 flex items-start gap-4"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="text-center shrink-0">
                <p className="text-xl font-black" style={{ color: post.status === "published" ? "#10B981" : "#64748b" }}>
                  {post.status === "published" ? "✓" : "○"}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-semibold text-white truncate">{post.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border shrink-0 ${STATUS_COLORS[post.status]}`}>
                    {post.status === "published" ? "Published" : post.status === "archived" ? "Archived" : "Draft"}
                  </span>
                  {post.lpEarned && (
                    <span className="text-[10px] rounded px-1.5 py-0.5 shrink-0"
                      style={{ background: "rgba(167,139,250,0.15)", color: "#A78BFA" }}>
                      ⬡1 LP awarded
                    </span>
                  )}
                </div>
                {post.excerpt && (
                  <p className="text-xs truncate mb-1" style={{ color: "rgba(209,213,219,0.5)" }}>{post.excerpt}</p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  {post.author && (
                    <span className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                      by {post.author.name}
                    </span>
                  )}
                  <code className="text-[10px] rounded px-1.5 py-0.5"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(139,92,246,0.7)" }}>
                    /{post.slug}
                  </code>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {post.status !== "published" && (
                  <button onClick={() => publish(post.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                    style={{ background: "#10B981" }}>
                    ✓ Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl border p-6 w-full max-w-2xl my-8"
            style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}>
            <h2 className="text-lg font-bold text-white mb-4">📝 Viết bài Blog mới</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Tiêu đề *</label>
                  <input value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Slug (URL) *</label>
                  <input value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="my-blog-post"
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white font-mono"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Nội dung</label>
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <BlogPostEditor
                    value={form.content}
                    onChange={v => setForm(f => ({ ...f, content: v }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Mô tả ngắn (excerpt)</label>
                <input value={form.excerpt}
                  onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>SEO Title</label>
                  <input value={form.seoTitle}
                    onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>SEO Description</label>
                  <input value={form.seoDesc}
                    onChange={e => setForm(f => ({ ...f, seoDesc: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Tác giả *</label>
                <select value={form.authorId}
                  onChange={e => setForm(f => ({ ...f, authorId: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                  <option value="">— Chọn thành viên —</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={createPost} disabled={saving || !form.title || !form.slug || !form.authorId}
                className="flex-1 rounded-lg py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "#6366F1" }}>
                {saving ? "Đang lưu..." : "Tạo bài nháp"}
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
