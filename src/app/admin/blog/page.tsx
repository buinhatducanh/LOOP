"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import {
  Plus, Edit2, Trash2, Search, RefreshCw, Calendar, X, AlertTriangle,
  ChevronDown, ChevronRight, Link, ExternalLink, Video, Globe, BookOpen,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { RichTextEditor } from "@/components/admin/blog/RichTextEditor";
import { BlogDetailClient } from "@/components/landing/BlogDetailClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderOption = { id: string; orderNumber: string; customerName: string };
type MemberOption = { id: string; name: string };

type BlogTagOption = { id: string; key: string; name: string; nameEn?: string; color: string };
type BlogPostTagEntry = { id: string; tagId: string; tag: BlogTagOption };

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
  projectId?: string;
  createdAt: string;
  seoTitle?: string;
  seoDesc?: string;
  videoUrl?: string;
  canonicalUrl?: string;
  backlinks?: string;
  titleEn?: string; titleJa?: string; titleKo?: string; titleZh?: string;
  contentEn?: string; contentJa?: string; contentKo?: string; contentZh?: string;
  excerptEn?: string; excerptJa?: string; excerptKo?: string; excerptZh?: string;
  tags?: BlogPostTagEntry[];
};

type BacklinkEntry = { url: string; label: string };

type PostFormData = {
  projectId: string;
  authorId: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  content: string;
  status: string;
  seoTitle: string;
  seoDesc: string;
  videoUrl: string;
  canonicalUrl: string;
  backlinks: BacklinkEntry[];
  tagIds: string[];
  // i18n
  titleEn: string; titleJa: string; titleKo: string; titleZh: string;
  contentEn: string; contentJa: string; contentKo: string; contentZh: string;
  excerptEn: string; excerptJa: string; excerptKo: string; excerptZh: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  published: { label: "published", color: DS.green, bg: "rgba(34,197,94,0.1)" },
  draft:     { label: "draft",     color: DS.amber, bg: "rgba(245,158,11,0.1)" },
  archived:  { label: "archived",  color: DS.text4, bg: "rgba(148,163,184,0.1)" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function countWords(text: string): number {
  if (!text?.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function readingTime(words: number): string {
  const mins = Math.ceil(words / 200);
  return mins < 1 ? "< 1 phút" : `${mins} phút`;
}

const LOCALES = [
  { key: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { key: "en", label: "English",     flag: "🇺🇸" },
  { key: "ja", label: "日本語",     flag: "🇯🇵" },
  { key: "ko", label: "한국어",     flag: "🇰🇷" },
  { key: "zh", label: "中文",        flag: "🇨🇳" },
] as const;

const inp = {
  width: "100%",
  background: DS.bg,
  border: `1px solid ${DS.border}`,
  borderRadius: 10,
  padding: "9px 12px",
  color: DS.text,
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box" as const,
  fontFamily: DS.body,
};

const labelStyle: React.CSSProperties = {
  color: DS.text4,
  fontSize: 11,
  fontFamily: DS.mono,
  letterSpacing: "0.08em",
  display: "block",
  marginBottom: 4,
};

const sectionDivider: React.CSSProperties = {
  height: 1,
  background: DS.border,
  margin: "16px 0",
};

// ─── Collapsible Section ──────────────────────────────────────────────────────

function Section({
  title, icon, children, defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", background: open ? "rgba(59,130,246,0.06)" : DS.bgCard,
          border: "none", cursor: "pointer", color: DS.text2, fontSize: 13,
          fontFamily: DS.mono, fontWeight: 600,
        }}
      >
        {open ? <ChevronDown size={14} color={DS.blue} /> : <ChevronRight size={14} color={DS.blue} />}
        {icon}
        <span style={{ flex: 1, textAlign: "left" }}>{title}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <div
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {children}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── I18n Tabs ────────────────────────────────────────────────────────────────

type LocaleKey = (typeof LOCALES)[number]["key"];

function LocaleTabs({
  active, onChange, children,
}: {
  active: LocaleKey;
  onChange: (k: LocaleKey) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
        {LOCALES.map(loc => (
          <button
            key={loc.key}
            type="button"
            onClick={() => onChange(loc.key)}
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              border: `1px solid ${active === loc.key ? DS.blue : DS.border}`,
              background: active === loc.key ? "rgba(59,130,246,0.1)" : "transparent",
              color: active === loc.key ? DS.blue : DS.text4,
              fontSize: 12,
              fontFamily: DS.mono,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>{loc.flag}</span>
            <span>{loc.key.toUpperCase()}</span>
          </button>
        ))}
      </div>
      {/* Content */}
      {children}
    </div>
  );
}

// ─── Backlink Editor ─────────────────────────────────────────────────────────

function BacklinkEditor({
  value, onChange,
}: {
  value: BacklinkEntry[];
  onChange: (v: BacklinkEntry[]) => void;
}) {
  const addLink = () => onChange([...value, { url: "", label: "" }]);
  const removeLink = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const updateLink = (i: number, field: keyof BacklinkEntry, val: string) => {
    const updated = value.map((l, idx) => idx === i ? { ...l, [field]: val } : l);
    onChange(updated);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {value.map((link, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            style={{ ...inp, flex: 1 }}
            placeholder="https://example.com"
            value={link.url}
            onChange={e => updateLink(i, "url", e.target.value)}
          />
          <input
            style={{ ...inp, flex: 1 }}
            placeholder="Tên liên kết"
            value={link.label}
            onChange={e => updateLink(i, "label", e.target.value)}
          />
          <button
            type="button"
            onClick={() => removeLink(i)}
            style={{ background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: DS.red }}
          >
            <X size={13} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addLink}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", background: "rgba(59,130,246,0.06)",
          border: `1px dashed ${DS.border}`, borderRadius: 8, cursor: "pointer",
          color: DS.blue, fontSize: 12, fontFamily: DS.mono, alignSelf: "flex-start",
        }}
      >
        <Plus size={12} /> Thêm liên kết
      </button>
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

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
  const isEdit = !!post?.id;

  // Load options
  const { data: ordersData } = useQuery({
    queryKey: ["admin", "blog", "orders"],
    queryFn: async () => {
      const res = await adminApi.get<{ data: OrderOption[] }>("/api/admin/orders", { params: { limit: 100 } });
      return res.data ?? [];
    },
  });

  const { data: membersData } = useQuery({
    queryKey: ["admin", "blog", "members"],
    queryFn: async () => {
      const res = await adminApi.get<{ data: { id: string; name: string }[] }>("/api/admin/team", { params: { limit: 100 } });
      return res.data ?? [];
    },
  });

  const { data: tagsData } = useQuery({
    queryKey: ["admin", "blog-tags"],
    queryFn: async () => {
      const res = await adminApi.get<{ data: BlogTagOption[] }>("/api/admin/blog-tags", { params: { limit: 100 } });
      return res.data ?? [];
    },
  });

  const parseBacklinks = (raw?: string): BacklinkEntry[] => {
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  };

  const [form, setForm] = useState<PostFormData>({
    projectId: post?.projectId ?? "",
    authorId: post?.authorId ?? "",
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    coverImage: post?.coverImage ?? "",
    content: post?.content ?? "",
    status: post?.status ?? "draft",
    seoTitle: post?.seoTitle ?? "",
    seoDesc: post?.seoDesc ?? "",
    videoUrl: post?.videoUrl ?? "",
    canonicalUrl: post?.canonicalUrl ?? "",
    backlinks: parseBacklinks(post?.backlinks),
    titleEn: post?.titleEn ?? "",
    titleJa: post?.titleJa ?? "",
    titleKo: post?.titleKo ?? "",
    titleZh: post?.titleZh ?? "",
    contentEn: post?.contentEn ?? "",
    contentJa: post?.contentJa ?? "",
    contentKo: post?.contentKo ?? "",
    contentZh: post?.contentZh ?? "",
    excerptEn: post?.excerptEn ?? "",
    excerptJa: post?.excerptJa ?? "",
    excerptKo: post?.excerptKo ?? "",
    excerptZh: post?.excerptZh ?? "",
    tagIds: post?.tags?.map((t: BlogPostTagEntry) => t.tagId) ?? [],
  });

  const [activeLocale, setActiveLocale] = useState<LocaleKey>("en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  const words = countWords(form.content);
  const readTime = readingTime(words);

  const setTitle = (v: string) => {
    setForm(f => ({ ...f, title: v, slug: f.slug || toSlug(v) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError(t("blog.errTitleRequired"));
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        ...(form.slug.trim() ? { slug: form.slug.trim() } : {}), // auto-generated from title if empty
        excerpt: form.excerpt.trim() || undefined,
        coverImage: form.coverImage.trim() || undefined,
        content: form.content.trim() || undefined,
        status: form.status,
        seoTitle: form.seoTitle.trim() || undefined,
        seoDesc: form.seoDesc.trim() || undefined,
        videoUrl: form.videoUrl.trim() || undefined,
        canonicalUrl: form.canonicalUrl.trim() || undefined,
        backlinks: JSON.stringify(form.backlinks.filter(b => b.url.trim())),
        // i18n
        titleEn: form.titleEn.trim() || undefined,
        titleJa: form.titleJa.trim() || undefined,
        titleKo: form.titleKo.trim() || undefined,
        titleZh: form.titleZh.trim() || undefined,
        contentEn: form.contentEn.trim() || undefined,
        contentJa: form.contentJa.trim() || undefined,
        contentKo: form.contentKo.trim() || undefined,
        contentZh: form.contentZh.trim() || undefined,
        excerptEn: form.excerptEn.trim() || undefined,
        excerptJa: form.excerptJa.trim() || undefined,
        excerptKo: form.excerptKo.trim() || undefined,
        excerptZh: form.excerptZh.trim() || undefined,
        tagIds: form.tagIds,
      };
      if (form.projectId) payload.projectId = form.projectId;
      if (form.authorId) payload.authorId = form.authorId;

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

  const contentText = form[`content${activeLocale === "vi" ? "" : activeLocale.charAt(0).toUpperCase() + activeLocale.slice(1)}` as keyof PostFormData] as string ?? "";
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 60,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "16px 16px 0",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: DS.bgCard,
          border: `1px solid ${DS.border}`,
          borderRadius: 20,
          padding: 0,
          width: "100%",
          maxWidth: 1550,
          marginBottom: 24,
          flexShrink: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 64px)",
        }}
      >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: `1px solid ${DS.border}`, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(10px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 16 }}>
                {isEdit ? t("blog.formEditTitle") : t("blog.formCreateTitle")}
              </h3>
              <div style={{ height: 16, width: 1, background: DS.border }} />
              <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                {form.title || "—"} {isEdit && `· /${form.slug}`}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 11, color: DS.text5, fontFamily: DS.mono, display: "flex", gap: 12 }}>
                <span>{words.toLocaleString()} words</span>
                <span>{readTime}</span>
              </div>
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: DS.text3, cursor: "pointer", width: 28, height: 28, borderRadius: 6, display: "grid", placeItems: "center" }}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(400px, 600px) 1fr", flex: 1, overflow: "hidden" }}>
            {/* Left: Editor */}
            <div style={{ overflowY: "auto", padding: 24, borderRight: `1px solid ${DS.border}`, background: "#0b0f1a" }}>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {/* ── 1. Gán dự án & tác giả ── */}
                <Section title={t("blog.formAssignment") ?? "Gán dự án & tác giả"} icon={<span style={{ fontSize: 13 }}>🎯</span>} defaultOpen={!isEdit}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={labelStyle}>{t("blog.formProject") ?? "DỰ ÁN (ORDER)"}</label>
                      <select
                        value={form.projectId}
                        onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                        style={{ ...inp, cursor: "pointer" }}
                      >
                        <option value="">— Chọn dự án —</option>
                        {ordersData?.map(o => (
                          <option key={o.id} value={o.id}>
                            {o.orderNumber} · {o.customerName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>{t("blog.formAuthorSelect") ?? "TÁC GIẢ"}</label>
                      <select
                        value={form.authorId}
                        onChange={e => setForm(f => ({ ...f, authorId: e.target.value }))}
                        style={{ ...inp, cursor: "pointer" }}
                      >
                        <option value="">— Chọn tác giả —</option>
                        {membersData?.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </Section>

                {/* ── 2. Thông tin cơ bản ── */}
                <Section title={t("blog.formBasicInfo") ?? "Thông tin cơ bản"} icon={<span style={{ fontSize: 13 }}>📝</span>} defaultOpen>
                  <div>
                    <label style={labelStyle}>{t("blog.formTitle")} *</label>
                    <input style={inp} value={form.title} onChange={e => setTitle(e.target.value)} placeholder={t("blog.formTitlePlaceholder") ?? "Nhập tiêu đề bài viết"} required />
                  </div>
                  <div>
                    <label style={labelStyle}>{t("blog.formSlug")}</label>
                    <input style={inp} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="slug-bai-viet" />
                  </div>
                  <div>
                    <label style={labelStyle}>{t("blog.formDescription")}</label>
                    <textarea style={{ ...inp, resize: "vertical", minHeight: 64 }} value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder={t("blog.formDescPlaceholder") ?? "Mô tả tóm tắt..."} />
                  </div>
                </Section>

                {/* ── 3. Ảnh & Video ── */}
                <Section title={t("blog.formMedia") ?? "Hình ảnh & Video"} icon={<Video size={14} color={DS.purple} />}>
                  <div>
                    <label style={labelStyle}>{t("blog.formThumbnail")}</label>
                    <ImageUpload
                      value={form.coverImage}
                      onChange={url => setForm(f => ({ ...f, coverImage: url }))}
                      folder="loop-blog"
                      aspectRatio="video"
                      label=""
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>{t("blog.formVideoUrl") ?? "VIDEO (YouTube / Vimeo URL)"}</label>
                    <input
                      style={inp}
                      value={form.videoUrl}
                      onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                </Section>

                {/* ── Tags ── */}
                <Section title={`${t("blog.formTags") ?? "Tags"} (${form.tagIds.length})`} icon={<span style={{ fontSize: 13 }}>🏷️</span>}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(tagsData ?? []).map(tag => {
                      const active = form.tagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => setForm(f => ({
                            ...f,
                            tagIds: active
                              ? f.tagIds.filter(id => id !== tag.id)
                              : [...f.tagIds, tag.id],
                          }))}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 9999,
                            border: `1px solid ${active ? tag.color : DS.border}`,
                            background: active ? `${tag.color}22` : "transparent",
                            color: active ? tag.color : DS.text4,
                            fontSize: 12,
                            fontFamily: DS.mono,
                            cursor: "pointer",
                          }}
                        >
                          {tag.nameEn ?? tag.name}
                        </button>
                      );
                    })}
                  </div>
                </Section>

                {/* ── 4. Nội dung (Tiptap WYSIWYG) ── */}
                <Section title={t("blog.formContent") ?? "Nội dung bài viết"} icon={<BookOpen size={14} color={DS.teal} />} defaultOpen>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12, borderBottom: `1px solid ${DS.border}`, paddingBottom: 8 }}>
                    {(["vi", "en", "ja", "ko", "zh"] as const).map(l => (
                      <button
                        key={l} type="button"
                        onClick={() => setActiveLocale(l)}
                        style={{
                          padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                          border: activeLocale === l ? `1px solid ${DS.blue}` : `1px solid ${DS.border}`,
                          background: activeLocale === l ? `${DS.blue}15` : "transparent",
                          color: activeLocale === l ? DS.blue : DS.text4,
                        }}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <RichTextEditor
                    value={contentText}
                    onChange={v => setForm(f => ({
                      ...f,
                      [`content${activeLocale === "vi" ? "" : activeLocale.charAt(0).toUpperCase() + activeLocale.slice(1)}`]: v
                    }))}
                  />
                </Section>

                {/* ── 5. SEO ── */}
                <Section title={t("blog.formSeoSection") ?? "Cấu hình SEO"} icon={<Globe size={14} color={DS.blue} />}>
                  <div>
                    <label style={labelStyle}>{t("blog.formSeoTitle") ?? "META TITLE (SEO)"}</label>
                    <input style={inp} value={form.seoTitle} onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))} placeholder="Title for Google..." />
                  </div>
                  <div>
                    <label style={labelStyle}>{t("blog.formSeoDesc") ?? "META DESCRIPTION (SEO)"}</label>
                    <textarea style={{ ...inp, resize: "vertical", minHeight: 64 }} value={form.seoDesc} onChange={e => setForm(f => ({ ...f, seoDesc: e.target.value }))} placeholder="Description for Google..." />
                  </div>
                  <div>
                    <label style={labelStyle}>{t("blog.formCanonical") ?? "CANONICAL URL"}</label>
                    <input style={inp} value={form.canonicalUrl} onChange={e => setForm(f => ({ ...f, canonicalUrl: e.target.value }))} placeholder="https://..." />
                  </div>
                </Section>

                {/* ── 6. External Links ── */}
                <Section title={t("blog.formBacklinks") ?? "Liên kết ngoài"} icon={<Link size={14} color={DS.pink} />}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {form.backlinks.map((b, i) => (
                      <div key={i} style={{ display: "flex", gap: 6 }}>
                        <input style={{ ...inp, flex: 1 }} value={b.label} onChange={e => setForm(f => {
                          const nb = [...f.backlinks];
                          nb[i].label = e.target.value;
                          return { ...f, backlinks: nb };
                        })} placeholder="Nhãn (VD: Nguồn tham khảo)" />
                        <input style={{ ...inp, flex: 2 }} value={b.url} onChange={e => setForm(f => {
                          const nb = [...f.backlinks];
                          nb[i].url = e.target.value;
                          return { ...f, backlinks: nb };
                        })} placeholder="https://..." />
                        <button type="button" onClick={() => setForm(f => ({ ...f, backlinks: f.backlinks.filter((_, idx) => idx !== i) }))} style={{ background: "none", border: "none", color: DS.red, cursor: "pointer" }}><X size={14} /></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setForm(f => ({ ...f, backlinks: [...f.backlinks, { url: "", label: "" }] }))} style={{ alignSelf: "flex-start", background: "none", border: `1px dashed ${DS.border}`, color: DS.blue, fontSize: 12, padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}>+ Thêm link</button>
                  </div>
                </Section>

                {error && <p style={{ color: DS.red, fontSize: 13, marginTop: 10 }}>{error}</p>}

                {/* Form Actions Footer (Internal) */}
                <div style={{ display: "flex", gap: 12, marginTop: 20, paddingTop: 20, borderTop: `1px solid ${DS.border}` }}>
                  <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${DS.border}`, color: DS.text, cursor: "pointer", fontWeight: 600 }}>{t("blog.formBtnCancel")}</button>
                  <button type="submit" disabled={saving} style={{ flex: 2, padding: "10px", borderRadius: 10, background: GRD.primary, border: "none", color: "#fff", cursor: "pointer", fontWeight: 700, boxShadow: "0 4px 15px rgba(59,130,246,0.3)" }}>
                    {saving ? t("blog.formBtnSaving") : isEdit ? t("blog.formBtnSave") : t("blog.formBtnCreate")}
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Preview */}
            <div style={{ overflowY: "auto", background: "#020617", padding: "40px 0" }}>
              <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
                <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 10px #22c55e" }} />
                  <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 700, letterSpacing: "0.1em" }}>LIVE PREVIEW</span>
                </div>
                <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${DS.border}`, background: DS.bg }}>
                  <BlogDetailClient
                    locale={activeLocale}
                    post={{
                      title: (form[`title${activeLocale === "vi" ? "" : activeLocale.charAt(0).toUpperCase() + activeLocale.slice(1)}` as keyof PostFormData] as string) || form.title || "Tiêu đề bài viết",
                      excerpt: (form[`excerpt${activeLocale === "vi" ? "" : activeLocale.charAt(0).toUpperCase() + activeLocale.slice(1)}` as keyof PostFormData] as string) || form.excerpt,
                      content: (form[`content${activeLocale === "vi" ? "" : activeLocale.charAt(0).toUpperCase() + activeLocale.slice(1)}` as keyof PostFormData] as string) || form.content,
                      coverImage: form.coverImage,
                      publishedAt: new Date().toISOString(),
                    }}
                    authorName={membersData?.find(m => m.id === form.authorId)?.name ?? "Tác giả"}
                    related={[]}
                    tNav={{ home: "Home", blog: "Blog" }}
                    videoUrl={form.videoUrl}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

// ─── Locale Fields per tab ────────────────────────────────────────────────────

function LocaleFields({
  locale, form, setForm, labelStyle, inp,
}: {
  locale: LocaleKey;
  form: PostFormData;
  setForm: (f: PostFormData | ((prev: PostFormData) => PostFormData)) => void;
  labelStyle: React.CSSProperties;
  inp: React.CSSProperties;
}) {
  const set = (field: keyof PostFormData, val: string) =>
    setForm(f => ({ ...f, [field]: val }));

  const titleKey = `title${locale === "vi" ? "" : locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof PostFormData;
  const excerptKey = `excerpt${locale === "vi" ? "" : locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof PostFormData;
  const contentKey = `content${locale === "vi" ? "" : locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof PostFormData;

  const titleVal = (form[titleKey] as string) ?? "";
  const excerptVal = (form[excerptKey] as string) ?? "";
  const contentVal = (form[contentKey] as string) ?? "";

  const localeInfo = LOCALES.find(l => l.key === locale)!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {locale === "vi" ? (
        <p style={{ color: DS.text4, fontSize: 12, margin: 0, fontStyle: "italic" }}>
          Tiếng Việt là ngôn ngữ mặc định — đã điền ở tab "Thông tin cơ bản". Chuyển sang EN / JA / KO / ZH để nhập nội dung bản địa.
        </p>
      ) : (
        <>
          <div style={{ padding: "6px 10px", background: "rgba(59,130,246,0.06)", borderRadius: 8, border: `1px solid rgba(59,130,246,0.2)`, display: "flex", alignItems: "center", gap: 6 }}>
            <span>{localeInfo.flag}</span>
            <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>{localeInfo.label}</span>
            <span style={{ color: DS.text4, fontSize: 11 }}>— Điền song song với nội dung tiếng Việt</span>
          </div>
          <div>
            <label style={labelStyle}>TIÊU ĐỀ ({locale.toUpperCase()})</label>
            <input style={inp} value={titleVal} onChange={e => set(titleKey, e.target.value)} placeholder={`Tiêu đề bài viết (${localeInfo.label})`} />
          </div>
          <div>
            <label style={labelStyle}>MÔ TẢ NGẮN ({locale.toUpperCase()})</label>
            <textarea style={{ ...inp, resize: "vertical", minHeight: 56 }} value={excerptVal} onChange={e => set(excerptKey, e.target.value)} placeholder={`Mô tả ngắn (${localeInfo.label})`} />
          </div>
          <div>
            <label style={labelStyle}>NỘI DUNG ({locale.toUpperCase()})</label>
            <RichTextEditor
              value={contentVal}
              onChange={html => set(contentKey, html)}
              placeholder={`Nội dung bài viết (${localeInfo.label})`}
              minHeight={200}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Post Row ─────────────────────────────────────────────────────────────────

function PostRow({ post, onEdit, t }: { post: BlogPost; onEdit: (post: BlogPost) => void; t: ReturnType<typeof useAdminTranslations>["t"] }) {
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const delete_ = useMutation({
    mutationFn: async () => {
      await adminApi.delete(`/api/admin/blog-posts/${post.id}`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "blog"] }); setToast({ message: "Xóa thành công", type: "success" }); },
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : "Xóa thất bại", type: "error" }); },
  });

  const sc = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;

  return (
    <>
    <div
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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {post.titleEn && <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono }}>🇺🇸 EN</span>}
          {post.titleJa && <span style={{ color: DS.red, fontSize: 11, fontFamily: DS.mono }}>🇯🇵 JA</span>}
          {post.titleKo && <span style={{ color: DS.teal, fontSize: 11, fontFamily: DS.mono }}>🇰🇷 KO</span>}
          {post.titleZh && <span style={{ color: DS.amber, fontSize: 11, fontFamily: DS.mono }}>🇨🇳 ZH</span>}
          {post.videoUrl && <span style={{ color: DS.cosmicPurple, fontSize: 11, fontFamily: DS.mono }}>🎬</span>}
          {post.seoTitle && <span style={{ color: DS.cosmicMagenta, fontSize: 11, fontFamily: DS.mono }}>🔍 SEO</span>}
          {post.excerpt && (
            <span style={{ color: DS.text4, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {post.excerpt}
            </span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, alignItems: "flex-end" }}>
        <span style={{ padding: "3px 10px", borderRadius: 9999, border: `1px solid ${sc.color}`, background: sc.bg, color: sc.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 600 }}>
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
        <button onClick={() => onEdit(post)} style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.blue, display: "flex", alignItems: "center" }}>
          <Edit2 size={13} />
        </button>
        <button onClick={() => { if (confirm(t("blog.confirmDelete"))) delete_.mutate(); }} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.red, display: "flex", alignItems: "center" }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
    {toast && (
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: "#0F172A", border: `1px solid ${toast.type === "success" ? "#22C55E" : "#CC3344"}50`, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxWidth: 320 }}>
        <span style={{ color: toast.type === "success" ? "#22C55E" : "#CC3344", fontSize: 16 }}>{toast.type === "success" ? "✓" : "✗"}</span>
        <span style={{ color: "#fff", fontSize: 13 }}>{toast.message}</span>
        <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94A3B8" }}><X size={14} /></button>
      </div>
    )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BlogTabPage() {
  const { t } = useAdminTranslations();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editPost, setEditPost] = useState<BlogPost | null>(null);

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
    <div style={{ padding: "2rem", minHeight: "100vh", background: DS.bgCosmic ?? "var(--figma-bg-cosmic, #09090b)" }}>
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
          onChange={e => { setSearch(e.target.value); setPage(1); }}
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
            posts.map(p => <PostRow key={p.id} post={p} onEdit={setEditPost} t={t} />)
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${page === p ? DS.blue : DS.border}`, background: page === p ? "rgba(59,130,246,0.1)" : "transparent", color: page === p ? DS.blue : DS.text4, cursor: "pointer", fontSize: 13, fontFamily: DS.mono }}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {editPost && (
          <BlogPostEditModal
            key={editPost.id || "new"}
            post={editPost}
            onClose={() => setEditPost(null)}
            onSuccess={() => qc.invalidateQueries({ queryKey: ["admin", "blog"] })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
