"use client";

/**
 * Admin Case Studies Tab
 * Full CRUD for case studies (Project where isCaseStudy=true)
 * Dark theme matching existing admin pages
 */
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Search,
  X, ChevronDown, RefreshCw, ExternalLink,
} from "lucide-react";
import { DS } from "@/lib/design-tokens";
import { ImageUpload } from "@/components/ui/ImageUpload";

type CaseStudy = Record<string, unknown>;

const INDUSTRIES = [
  { value: "", label: "Tất cả ngành" },
  { value: "fintech", label: "Fintech" },
  { value: "retail", label: "Bán lẻ" },
  { value: "manufacturing", label: "Sản xuất" },
  { value: "healthcare", label: "Y tế" },
  { value: "education", label: "Giáo dục" },
  { value: "logistics", label: "Logistics" },
  { value: "other", label: "Khác" },
];

const EMPTY_FORM = {
  title: "",
  titleEn: "",
  slug: "",
  description: "",
  descriptionEn: "",
  client: "",
  year: "",
  image: "",
  imagePublicId: "",
  industry: "",
  projectScope: "",
  teamSize: "",
  duration: "",
  challenge: "",
  solution: "",
  results: "",
  clientQuote: "",
  clientRole: "",
  roiMetric: "",
  primaryMetric: "",
  videoUrl: "",
  galleryImages: [] as string[],
  galleryPublicIds: [] as string[],
  isPublished: false,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/[đ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function AdminModal({
  isOpen,
  onClose,
  editItem,
}: {
  isOpen: boolean;
  onClose: () => void;
  editItem: CaseStudy | null;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const qc = useQueryClient();

  useEffect(() => {
    if (editItem) {
      setForm({
        title: (editItem.title as string) ?? "",
        titleEn: (editItem.titleEn as string) ?? "",
        slug: (editItem.slug as string) ?? "",
        description: (editItem.description as string) ?? "",
        descriptionEn: (editItem.descriptionEn as string) ?? "",
        client: (editItem.client as string) ?? "",
        year: String(editItem.year ?? ""),
        image: (editItem.image as string) ?? "",
        imagePublicId: (editItem.imagePublicId as string) ?? "",
        industry: (editItem.industry as string) ?? "",
        projectScope: (editItem.projectScope as string) ?? "",
        teamSize: String(editItem.teamSize ?? ""),
        duration: (editItem.duration as string) ?? "",
        challenge: (editItem.challenge as string) ?? "",
        solution: (editItem.solution as string) ?? "",
        results: (editItem.results as string) ?? "",
        clientQuote: (editItem.clientQuote as string) ?? "",
        clientRole: (editItem.clientRole as string) ?? "",
        roiMetric: (editItem.roiMetric as string) ?? "",
        primaryMetric: (editItem.primaryMetric as string) ?? "",
        videoUrl: (editItem.videoUrl as string) ?? "",
        galleryImages: Array.isArray(editItem.galleryImages)
          ? (editItem.galleryImages as string[])
          : [],
        galleryPublicIds: Array.isArray(editItem.galleryPublicIds)
          ? (editItem.galleryPublicIds as string[])
          : [],
        isPublished: Boolean(editItem.isPublished),
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editItem]);

  const createMut = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/admin/case-studies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-case-studies"] }); onClose(); },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/case-studies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-case-studies"] }); onClose(); },
  });

  const handleTitleChange = (value: string) => {
    const newForm = { ...form, title: value };
    if (!editItem || !form.slug) {
      newForm.slug = slugify(value);
    }
    setForm(newForm);
  };

  const handleSubmit = () => {
    const data: Record<string, unknown> = {
      title: form.title,
      titleEn: form.titleEn || null,
      slug: form.slug,
      description: form.description || null,
      descriptionEn: form.descriptionEn || null,
      client: form.client || null,
      year: form.year || null,
      image: form.image || null,
      imagePublicId: form.imagePublicId || null,
      industry: form.industry || null,
      projectScope: form.projectScope || null,
      teamSize: form.teamSize ? parseInt(form.teamSize, 10) : null,
      duration: form.duration || null,
      challenge: form.challenge || null,
      solution: form.solution || null,
      results: form.results || null,
      clientQuote: form.clientQuote || null,
      clientRole: form.clientRole || null,
      roiMetric: form.roiMetric || null,
      primaryMetric: form.primaryMetric || null,
      videoUrl: form.videoUrl || null,
      galleryImages: form.galleryImages.filter(Boolean),
      isPublished: form.isPublished,
      isCaseStudy: true,
    };

    if (editItem) {
      updateMut.mutate({ id: editItem.id as string, data });
    } else {
      createMut.mutate(data);
    }
  };

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: DS.text,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: DS.text3,
    marginBottom: 4,
    display: "block",
    fontWeight: 500,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0f172a",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 760,
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            position: "sticky",
            top: 0,
            background: "#0f172a",
            zIndex: 1,
          }}
        >
          <h2 style={{ fontFamily: DS.heading, fontSize: 16, fontWeight: 700, color: DS.text }}>
            {editItem ? "Sửa Case Study" : "Tạo Case Study"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: DS.text3,
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Tiêu đề (VI) *</label>
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="VD: Hệ thống thanh toán fintech cho VietBank"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Title EN */}
            <div>
              <label style={labelStyle}>Tiêu đề (EN)</label>
              <input style={inputStyle} value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="English title" />
            </div>
            {/* Slug */}
            <div>
              <label style={labelStyle}>Slug</label>
              <input style={inputStyle} value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="auto-generated" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Mô tả (VI)</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả ngắn gọn về dự án..." />
          </div>
          <div>
            <label style={labelStyle}>Mô tả (EN)</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} placeholder="English description..." />
          </div>

          {/* Client + Year */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Khách hàng</label>
              <input style={inputStyle} value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="VD: VietBank" />
            </div>
            <div>
              <label style={labelStyle}>Năm</label>
              <input style={inputStyle} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="VD: 2025" />
            </div>
          </div>

          {/* Image — Cloudinary upload */}
          <div>
            <ImageUpload
              label="ẢNH CHÍNH"
              value={form.image}
              publicId={form.imagePublicId}
              folder="loop-uploads/case-studies"
              aspectRatio="video"
              onChange={(url, publicId) => setForm({ ...form, image: url, imagePublicId: publicId ?? "" })}
            />
          </div>

          {/* Industry + Scope */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Ngành</label>
              <select style={inputStyle} value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}>
                <option value="">Chọn ngành...</option>
                {INDUSTRIES.filter((i) => i.value).map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Quy mô dự án</label>
              <input style={inputStyle} value={form.projectScope} onChange={(e) => setForm({ ...form, projectScope: e.target.value })} placeholder="VD: MVP, Full platform" />
            </div>
          </div>

          {/* Team size + Duration */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Team size (số người)</label>
              <input style={inputStyle} type="number" value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: e.target.value })} placeholder="VD: 5" />
            </div>
            <div>
              <label style={labelStyle}>Thời gian</label>
              <input style={inputStyle} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="VD: 3 tháng" />
            </div>
          </div>

          {/* Challenge */}
          <div>
            <label style={labelStyle}>Thách thức (Challenge)</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={form.challenge} onChange={(e) => setForm({ ...form, challenge: e.target.value })} placeholder="Mô tả thách thức kinh doanh của khách hàng..." />
          </div>

          {/* Solution */}
          <div>
            <label style={labelStyle}>Giải pháp (Solution)</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={form.solution} onChange={(e) => setForm({ ...form, solution: e.target.value })} placeholder="LOOP đã giải quyết như thế nào..." />
          </div>

          {/* Results */}
          <div>
            <label style={labelStyle}>Kết quả (Results)</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={form.results} onChange={(e) => setForm({ ...form, results: e.target.value })} placeholder="Kết quả đạt được sau khi triển khai..." />
          </div>

          {/* Client quote + role */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Khách hàng nói (Quote)</label>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} value={form.clientQuote} onChange={(e) => setForm({ ...form, clientQuote: e.target.value })} placeholder="Trích dẫn từ khách hàng..." />
            </div>
            <div>
              <label style={labelStyle}>Chức vụ (Role)</label>
              <input style={inputStyle} value={form.clientRole} onChange={(e) => setForm({ ...form, clientRole: e.target.value })} placeholder="VD: CEO, CTO" />
            </div>
          </div>

          {/* ROI + Primary metric */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>ROI Metric</label>
              <input style={inputStyle} value={form.roiMetric} onChange={(e) => setForm({ ...form, roiMetric: e.target.value })} placeholder="VD: 300% ROI in 6 months" />
            </div>
            <div>
              <label style={labelStyle}>Chỉ số chính</label>
              <input style={inputStyle} value={form.primaryMetric} onChange={(e) => setForm({ ...form, primaryMetric: e.target.value })} placeholder="VD: conversion_rate_up_45%" />
            </div>
          </div>

          {/* Video URL */}
          <div>
            <label style={labelStyle}>Video URL (YouTube/Vimeo embed)</label>
            <input style={inputStyle} value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://www.youtube.com/embed/..." />
          </div>

          {/* Gallery Images — multi Cloudinary upload */}
          <div>
            <label style={labelStyle}>Gallery Images</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginTop: 6 }}>
              {form.galleryImages.map((url, idx) => (
                <div key={idx} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: `1px solid ${DS.border}`, aspectRatio: "16/10" }}>
                  <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={async () => {
                      const pid = form.galleryPublicIds[idx];
                      if (pid) {
  try { const res = await fetch(`/api/admin/upload?publicId=${encodeURIComponent(pid)}`, { method: "DELETE" }); if (!res.ok) console.error(`[case-studies] Failed to delete gallery image publicId="${pid}", status=${res.status}`); } catch (err) { console.error("[case-studies] Gallery image delete error:", err instanceof Error ? err.message : String(err)); }
                      }
                      const newImages = form.galleryImages.filter((_, i) => i !== idx);
                      const newPids = form.galleryPublicIds.filter((_, i) => i !== idx);
                      setForm({ ...form, galleryImages: newImages, galleryPublicIds: newPids });
                    }}
                    style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 6, background: "rgba(239,68,68,0.85)", border: "none", color: "#fff", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {/* Add new image tile */}
              <ImageUpload
                value=""
                folder="loop-uploads/case-studies/gallery"
                aspectRatio="video"
                onChange={(url, publicId) => {
                  if (url) {
                    setForm({
                      ...form,
                      galleryImages: [...form.galleryImages, url],
                      galleryPublicIds: [...form.galleryPublicIds, publicId ?? ""],
                    });
                  }
                }}
              />
            </div>
          </div>

          {/* Published toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={() => setForm({ ...form, isPublished: !form.isPublished })}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: form.isPublished ? DS.pink : "rgba(255,255,255,0.1)",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#fff",
                  position: "absolute",
                  top: 3,
                  left: form.isPublished ? 23 : 3,
                  transition: "left 0.2s",
                }}
              />
            </button>
            <div>
              <p style={{ fontSize: 14, color: DS.text, fontWeight: 500 }}>
                {form.isPublished ? "Đã xuất bản" : "Bản nháp"}
              </p>
              <p style={{ fontSize: 12, color: DS.text3 }}>Hiển thị trên trang public khi bật</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: DS.text3,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={createMut.isPending || updateMut.isPending}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: DS.pink,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: createMut.isPending || updateMut.isPending ? "not-allowed" : "pointer",
              opacity: createMut.isPending || updateMut.isPending ? 0.6 : 1,
            }}
          >
            {createMut.isPending || updateMut.isPending ? "Đang lưu..." : editItem ? "Lưu thay đổi" : "Tạo mới"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  isOpen,
  onClose,
  item,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: CaseStudy | null;
}) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/case-studies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-case-studies"] }); onClose(); },
  });

  if (!isOpen || !item) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16, padding: 24, maxWidth: 400, width: "100%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontFamily: DS.heading, fontSize: 16, fontWeight: 700, color: DS.text, marginBottom: 8 }}>
          Xóa Case Study?
        </h3>
        <p style={{ fontSize: 14, color: DS.text3, marginBottom: 20 }}>
          Bạn có chắc muốn xóa <strong style={{ color: DS.text }}>{item.title as string}</strong>? Hành động này không thể hoàn tác.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: DS.text3, fontSize: 14, cursor: "pointer" }}>
            Hủy
          </button>
          <button
            onClick={() => mut.mutate(item.id as string)}
            disabled={mut.isPending}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#EF4444", color: "#fff", fontSize: 14, fontWeight: 600, cursor: mut.isPending ? "not-allowed" : "pointer", opacity: mut.isPending ? 0.6 : 1 }}
          >
            {mut.isPending ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCaseStudiesPage() {
  const [industryFilter, setIndustryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editItem, setEditItem] = useState<CaseStudy | null>(null);
  const [deleteItem, setDeleteItem] = useState<CaseStudy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const LIMIT = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-case-studies", industryFilter, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        page: String(page),
        ...(industryFilter ? { industry: industryFilter } : {}),
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      });
      const res = await fetch(`/api/admin/case-studies?${params}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const items: CaseStudy[] = Array.isArray(data?.data) ? data.data : [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  const filtered = search
    ? items.filter((item) =>
        [item.title, item.titleEn, item.client]
          .map((v) => (v as string ?? "").toLowerCase())
          .some((v) => v.includes(search.toLowerCase()))
      )
    : items;

  const togglePublish = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const res = await fetch(`/api/admin/case-studies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 22, fontWeight: 800, color: DS.text, marginBottom: 4 }}>
            Case Studies
          </h1>
          <p style={{ fontSize: 13, color: DS.text3 }}>
            {total} case study{total !== 1 ? "s" : ""} · {items.filter((i) => i.isPublished).length} đã xuất bản
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={() => refetch()}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: DS.text3,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
            }}
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => { setEditItem(null); setIsModalOpen(true); }}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: DS.pink,
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
            }}
          >
            <Plus size={14} />
            Thêm Case Study
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: DS.text3 }} />
          <input
            style={{
              width: "100%",
              padding: "8px 12px 8px 32px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: DS.text,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: DS.text,
            fontSize: 13,
            outline: "none",
            cursor: "pointer",
          }}
          value={industryFilter}
          onChange={(e) => { setIndustryFilter(e.target.value); setPage(1); }}
        >
          {INDUSTRIES.map((i) => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>
        <select
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: DS.text,
            fontSize: 13,
            outline: "none",
            cursor: "pointer",
          }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as "all" | "published" | "draft"); setPage(1); }}
        >
          <option value="all">Tất cả</option>
          <option value="published">Đã xuất bản</option>
          <option value="draft">Bản nháp</option>
        </select>
      </div>

      {/* Table */}
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["", "Tiêu đề", "Khách hàng", "Ngành", "Trạng thái", "Ngày tạo", "Thao tác"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontSize: 11,
                      color: DS.text3,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: DS.text3 }}>
                    Đang tải...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: DS.text3 }}>
                    Chưa có case study nào
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const industryColor: Record<string, string> = {
                    fintech: "#4F7DF3", retail: "#EC4899", manufacturing: "#E6C75F",
                    healthcare: "#22C55E", education: "#8B5CF6", logistics: "#62C5EB",
                    other: "#71717A",
                  };
                  const color = industryColor[(item.industry as string) ?? "other"] ?? "#71717A";
                  return (
                    <tr
                      key={item.id as string}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      {/* Thumbnail */}
                      <td style={{ padding: "10px 14px", width: 56 }}>
                        {item.image ? (
                          <img
                            src={item.image as string}
                            alt=""
                            style={{ width: 48, height: 36, borderRadius: 6, objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: 48, height: 36, borderRadius: 6, background: "rgba(255,255,255,0.05)" }} />
                        )}
                      </td>
                      {/* Title */}
                      <td style={{ padding: "10px 14px", maxWidth: 240 }}>
                        <p style={{ fontSize: 13, color: DS.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {(item.title as string) ?? "—"}
                        </p>
                        {!!item.slug && (
                          <p style={{ fontSize: 11, color: DS.text3 }}>/{String(item.slug)}</p>
                        )}
                      </td>
                      {/* Client */}
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: 13, color: DS.text3 }}>{(item.client as string) ?? "—"}</span>
                      </td>
                      {/* Industry */}
                      <td style={{ padding: "10px 14px" }}>
                        {item.industry ? (
                          <span style={{ fontSize: 11, color, background: `${color}18`, border: `1px solid ${color}35`, padding: "2px 8px", borderRadius: 9999, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {item.industry as string}
                          </span>
                        ) : (
                          <span style={{ fontSize: 13, color: DS.text3 }}>—</span>
                        )}
                      </td>
                      {/* Status */}
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          style={{
                            fontSize: 12,
                            color: item.isPublished ? "#22C55E" : DS.text3,
                            fontWeight: 500,
                          }}
                        >
                          {item.isPublished ? "● Đã xuất bản" : "○ Bản nháp"}
                        </span>
                      </td>
                      {/* Date */}
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 12, color: DS.text3 }}>
                          {item.createdAt
                            ? new Date(item.createdAt as string).toLocaleDateString("vi-VN")
                            : "—"}
                        </span>
                      </td>
                      {/* Actions */}
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            title="Toggle publish"
                            onClick={() =>
                              togglePublish.mutate({
                                id: item.id as string,
                                isPublished: !item.isPublished,
                              })
                            }
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: item.isPublished ? "#22C55E" : DS.text3, padding: 4 }}
                          >
                            {item.isPublished ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                          <button
                            title="Edit"
                            onClick={() => { setEditItem(item); setIsModalOpen(true); }}
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: DS.text3, padding: 4 }}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => setDeleteItem(item)}
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#EF4444", padding: 4 }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: DS.text3, fontSize: 13, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}
          >
            ←
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: page === p ? "none" : "1px solid rgba(255,255,255,0.1)",
                  background: page === p ? DS.pink : "transparent",
                  color: page === p ? "#fff" : DS.text3,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: DS.text3, fontSize: 13, cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}
          >
            →
          </button>
        </div>
      )}

      {/* Modals */}
      <AdminModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditItem(null); }} editItem={editItem} />
      <DeleteModal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} item={deleteItem} />
    </div>
  );
}
