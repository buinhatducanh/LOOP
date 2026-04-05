"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { Plus, Edit2, Trash2, Search, RefreshCw, Calendar, X, AlertTriangle } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  content?: string;
  status: string;
  publishedAt?: string;
  authorId?: string;
  createdAt: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  published: { label: "published", color: DS.green, bg: "rgba(34,197,94,0.1)" },
  draft:     { label: "draft",     color: DS.amber, bg: "rgba(245,158,11,0.1)" },
  archived:  { label: "archived",  color: DS.text4, bg: "rgba(148,163,184,0.1)" },
};

type PostFormData = {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  content: string;
  status: string;
};

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẫ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function BlogPostEditModal({
  post,
  onClose,
  onSuccess,
}: {
  post: BlogPost | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useAdminTranslations();
  const isEdit = !!post;
  const [form, setForm] = useState<PostFormData>({
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    coverImage: post?.coverImage ?? "",
    content: post?.content ?? "",
    status: post?.status ?? "draft",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setTitle = (v: string) => {
    setForm(f => ({ ...f, title: v, slug: f.slug || toSlug(v) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError(t("blog.errTitleRequired"));
    if (!form.slug.trim()) return setError(t("blog.errSlugRequired"));
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim() || undefined,
        coverImage: form.coverImage.trim() || undefined,
        content: form.content.trim() || undefined,
        status: form.status,
      };
      if (isEdit) {
        await adminApi.put(`/api/admin/blog-posts/${post!.id}`, payload);
      } else {
        await adminApi.post("/api/admin/blog-posts", payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("blog.errSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const inp = {
    width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
    borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13,
    outline: "none", boxSizing: "border-box" as const, fontFamily: DS.body,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18 }}>{isEdit ? t("blog.formEditTitle") : t("blog.formCreateTitle")}</h3>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>{t("blog.formTitle")}</label>
              <input style={inp} value={form.title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tiêu đề bài viết" required />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>{t("blog.formSlug")}</label>
              <input style={inp} value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="slug-bai-viet" required />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>{t("blog.formDescription")}</label>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 64 }} value={form.excerpt} onChange={(e) => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Mô tả tóm tắt bài viết..." />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>{t("blog.formThumbnail")}</label>
              <ImageUpload
                value={form.coverImage}
                onChange={url => setForm(f => ({ ...f, coverImage: url }))}
                folder="loop-blog"
                aspectRatio="video"
                label=""
              />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>{t("blog.formContent")}</label>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 140 }} value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Nội dung bài viết..." />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>{t("blog.formStatus")}</label>
              <select
                value={form.status}
                onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                style={{ ...inp, cursor: "pointer" }}
              >
                <option value="draft">{t("blog.statusDraft")}</option>
                <option value="published">{t("blog.statusPublished")}</option>
                <option value="archived">{t("blog.statusArchived")}</option>
              </select>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12 }}>
                <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />{error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>
                {t("blog.formBtnCancel")}
              </button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", background: saving ? DS.text4 : GRD.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>
                {saving ? t("blog.formBtnSaving") : isEdit ? t("blog.formBtnSave") : t("blog.formBtnPublish")}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PostRow({ post, onEdit, t }: { post: BlogPost; onEdit: (post: BlogPost) => void; t: ReturnType<typeof useAdminTranslations>["t"] }) {
  const qc = useQueryClient();

  const delete_ = useMutation({
    mutationFn: async () => {
      await adminApi.delete(`/api/admin/blog-posts/${post.id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "blog"] }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : t("common.delete") + " failed"); },
  });

  const scRaw = STATUS_CONFIG[post.status] ?? { label: post.status, color: DS.text4, bg: "transparent" };
  const sc = { ...scRaw, label: t(`blog.status${post.status.charAt(0).toUpperCase() + post.status.slice(1)}` as `blog.status${string}`) };

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
          border: `1px solid ${sc.color}`,
          background: sc.bg,
          color: sc.color,
          fontSize: 10, fontFamily: DS.mono, fontWeight: 600,
        }}>
          {sc.label}
        </span>
        {post.publishedAt && (
          <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "flex", alignItems: "center", gap: 3 }}>
            <Calendar size={11} /> {new Date(post.publishedAt).toLocaleDateString("vi-VN")}
          </span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        <button
          onClick={() => onEdit(post)}
          style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.blue, display: "flex", alignItems: "center" }}
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={() => { if (confirm(t("blog.confirmDelete"))) delete_.mutate(); }}
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.red, display: "flex", alignItems: "center" }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

export default function BlogTabPage() {
  const { t } = useAdminTranslations();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editPost, setEditPost] = useState<BlogPost | null>(null);

  const statusLabel = (key: string) => t(`blog.status${key.charAt(0).toUpperCase() + key.slice(1)}` as `blog.status${string}`);

  // Render-time translated status labels
  const translatedStatuses = {
    published: { ...STATUS_CONFIG.published, label: statusLabel("published") },
    draft:     { ...STATUS_CONFIG.draft,     label: statusLabel("draft") },
    archived:  { ...STATUS_CONFIG.archived,  label: statusLabel("archived") },
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "blog", { page, limit: 20, search }],
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
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 2 }}>{t("blog.title")}</h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{t("blog.titleCount", { n: pagination?.total ?? 0 })}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "blog"] })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> {t("blog.refreshBtn")}
          </button>
          <button
            onClick={() => setEditPost({} as BlogPost)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
          >
            <Plus size={14} /> {t("blog.addBtn")}
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
        <input
          type="text"
          placeholder={t("blog.searchPlaceholder")}
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
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontSize: 14 }}>{t("blog.emptyState")}</div>
          ) : (
            posts.map((p) => <PostRow key={p.id} post={p} onEdit={setEditPost} t={t} />)
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

      {/* Edit/Create modal */}
      <BlogPostEditModal
        post={editPost}
        onClose={() => setEditPost(null)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["admin", "blog"] })}
      />
    </div>
  );
}
