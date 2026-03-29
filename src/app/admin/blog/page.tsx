"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { qk } from "@/lib/query/provider";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { Plus, Edit2, Trash2, Search, RefreshCw, Calendar } from "lucide-react";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  status: string;
  publishedAt?: string;
  authorId?: string;
  createdAt: string;
};

function PostRow({ post }: { post: BlogPost }) {
  const qc = useQueryClient();

  const delete_ = useMutation({
    mutationFn: async () => {
      await adminApi.delete(`/api/admin/blog-posts/${post.id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminBlogPosts() }),
  });

  const STATUS_COLORS: Record<string, string> = {
    published: DS.green,
    draft: DS.amber,
    archived: DS.text4,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}
    >
      {/* Cover */}
      <div style={{ width: 64, height: 48, borderRadius: 8, overflow: "hidden", background: "#111827", flexShrink: 0 }}>
        {post.coverImage ? (
          <img src={post.coverImage} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: DS.text5, fontSize: "1.25rem", fontWeight: 700 }}>
            {post.title.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: DS.text, fontWeight: 600, fontSize: 14, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {post.title}
        </p>
        {post.excerpt && (
          <p style={{ color: DS.text4, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {post.excerpt}
          </p>
        )}
      </div>

      {/* Meta */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, alignItems: "flex-end" }}>
        <span style={{
          padding: "3px 10px", borderRadius: 9999,
          border: `1px solid ${STATUS_COLORS[post.status] ?? DS.border}`,
          background: `${STATUS_COLORS[post.status] ?? DS.border}15`,
          color: STATUS_COLORS[post.status] ?? DS.text4,
          fontSize: 10, fontFamily: DS.mono, fontWeight: 600,
        }}>
          {post.status ?? "draft"}
        </span>
        {post.publishedAt && (
          <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "flex", alignItems: "center", gap: 3 }}>
            <Calendar size={11} /> {new Date(post.publishedAt).toLocaleDateString("vi-VN")}
          </span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        <button style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.blue, display: "flex", alignItems: "center" }}>
          <Edit2 size={13} />
        </button>
        <button
          onClick={() => { if (confirm(`Xóa bài "${post.title}"?`)) delete_.mutate(); }}
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.red, display: "flex", alignItems: "center" }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

export default function BlogTabPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.adminBlogPosts({ page, limit: 20, search }),
    queryFn: async () => {
      const res = await adminApi.get<{ data: BlogPost[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        "/api/admin/blog-posts",
        { params: { page, limit: 20, ...(search ? { search } : {}) } }
      );
      return res;
    },
  });

  const posts = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 2 }}>Blog & Bài viết</h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{pagination?.total ?? 0} bài viết</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: qk.adminBlogPosts({ page }) })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Làm mới
          </button>
          <button
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
          >
            <Plus size={14} /> Viết bài mới
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
        <input
          type="text"
          placeholder="Tìm bài viết..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px 8px 36px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: DS.body }}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* List */}
      {!isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontSize: 14 }}>Chưa có bài viết nào</div>
          ) : (
            posts.map((p) => <PostRow key={p.id} post={p} />)
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${page === p ? DS.blue : DS.border}`, background: page === p ? "rgba(59,130,246,0.1)" : "transparent", color: page === p ? DS.blue : DS.text4, cursor: "pointer", fontSize: 13, fontFamily: DS.mono }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
