"use client";

import { useState, useEffect, useCallback } from "react";

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877F2", tiktok: "#fff", instagram: "#E4405F", zalo: "#0068FF",
};
const PLATFORM_ICONS: Record<string, string> = {
  facebook: "📘", tiktok: "🎵", instagram: "📷", zalo: "💬",
};

interface SocialPost {
  id: string; projectId: string; platform: string; content: string;
  status: string; scheduledAt: string | null; publishedAt: string | null;
  project?: { id: string; orderNumber: string; customerName: string };
}

export default function ProjectSocialPostsPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/social-posts");
      const json = await res.json();
      setPosts(json.data ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const publishNow = async (id: string) => {
    await fetch(`/api/admin/social-posts/${id}/publish`, { method: "POST" });
    fetchPosts();
  };

  const byPlatform = ["facebook", "tiktok", "instagram", "zalo"] as const;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">All Social Posts</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            {posts.length} posts · {posts.filter(p => p.status === "published").length} published
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-20" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải...</p>
      ) : (
        <div className="space-y-6">
          {byPlatform.map(platform => {
            const platformPosts = posts.filter(p => p.platform === platform);
            if (platformPosts.length === 0) return null;
            return (
              <div key={platform}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{PLATFORM_ICONS[platform]}</span>
                  <span className="text-sm font-semibold capitalize" style={{ color: PLATFORM_COLORS[platform] }}>
                    {platform}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <span className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
                    {platformPosts.length} posts
                  </span>
                </div>
                <div className="space-y-2">
                  {platformPosts.map(post => (
                    <div key={post.id}
                      className="rounded-xl border p-4"
                      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          {post.content && (
                            <p className="text-sm text-white mb-1 line-clamp-2">{post.content}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] rounded-full px-2 py-0.5 ${
                              post.status === "published" ? "bg-green-500/20 text-green-400" :
                              post.status === "scheduled" ? "bg-blue-500/20 text-blue-400" :
                              "bg-gray-500/20 text-gray-400"
                            }`}>
                              {post.status}
                            </span>
                            <span className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                              {post.project?.orderNumber} · {post.project?.customerName}
                            </span>
                          </div>
                        </div>
                        {post.status !== "published" && (
                          <button onClick={() => publishNow(post.id)}
                            className="rounded-lg px-3 py-1 text-xs font-bold text-white shrink-0"
                            style={{ background: PLATFORM_COLORS[platform] }}>
                            ▶ Publish
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {posts.length === 0 && (
            <div className="text-center py-20 rounded-xl border"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-4xl mb-3">📱</p>
              <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Không có bài đăng nào</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
