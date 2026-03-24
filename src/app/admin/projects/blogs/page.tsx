"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const VI_DATE = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  lpEarned: boolean;
  lpAwardedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  project: { id: string; orderNumber: string; customerName: string };
  author: { id: string; name: string } | null;
}

export default function ProjectBlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog-posts");
      const json = await res.json();
      setPosts(json.data ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const publish = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/blog-posts/${id}/publish`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`Đã publish & trao ⬡1 LP cho tác giả`);
      fetchPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi publish");
    }
  };

  const published = posts.filter(p => p.status === "published").length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">All Blog Posts</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            {posts.length} posts · {published} published
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-20" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải...</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">📝</p>
          <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Không có bài viết nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id}
              className="rounded-xl border p-4 flex items-start gap-4"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
              <span className="text-2xl shrink-0">{post.status === "published" ? "✓" : "○"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-semibold text-white truncate">{post.title}</p>
                  <span className={`text-[10px] rounded-full px-2 py-0.5 shrink-0 ${
                    post.status === "published" ? "bg-green-500/20 text-green-400" :
                    post.status === "archived" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>
                    {post.status}
                  </span>
                  {post.lpEarned && (
                    <span className="text-[10px] rounded-full px-2 py-0.5 shrink-0"
                      style={{ background: "rgba(167,139,250,0.15)", color: "#A78BFA" }}>
                      ⬡1 LP awarded
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <code className="text-[10px] rounded px-1.5 py-0.5"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(139,92,246,0.7)" }}>
                    /{post.slug}
                  </code>
                  {post.author && (
                    <span className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                      by {post.author.name}
                    </span>
                  )}
                  {post.project && (
                    <span className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                      {post.project.orderNumber} · {post.project.customerName}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                {post.publishedAt && (
                  <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                    {VI_DATE.format(new Date(post.publishedAt))}
                  </p>
                )}
                {post.status !== "published" && (
                  <button onClick={() => publish(post.id)}
                    className="mt-1 rounded-lg px-3 py-1 text-xs font-bold text-white"
                    style={{ background: "#10B981" }}>
                    Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
