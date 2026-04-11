"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import {
  Plus, Edit2, Trash2, Search, X, ChevronDown, ChevronRight,
  CheckCircle2, AlertCircle, Info, Eye, EyeOff,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionRecord = {
  id: string;
  sectionType: string;
  locale: string;
  badge: string | null;
  title: string | null;
  titleHighlight: string | null;
  subtitle: string | null;
  description: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  cta2Text: string | null;
  cta2Link: string | null;
  stats: unknown;
  story: unknown;
  timeline: unknown;
  values: unknown;
  teamPreview: unknown;
  ctaSectionTitle: string | null;
  ctaSectionSub: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type SectionFormData = {
  sectionType: string;
  locale: string;
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  cta2Text: string;
  cta2Link: string;
  stats: string;
  story: string;
  timeline: string;
  values: string;
  teamPreview: string;
  ctaSectionTitle: string;
  ctaSectionSub: string;
  isActive: boolean;
  sortOrder: number;
};

const SECTION_TYPES = [
  { key: "hero",         label: "Hero (Badge + Title + CTA)" },
  { key: "stats",        label: "Stats (Số liệu thống kê)" },
  { key: "story",        label: "Story (Câu chuyện LOOP)" },
  { key: "timeline",     label: "Timeline (Hành trình phát triển)" },
  { key: "values",       label: "Values (Giá trị cốt lõi)" },
  { key: "team_preview", label: "Team Preview (Đội ngũ preview)" },
  { key: "cta",          label: "CTA (Kêu gọi hành động cuối)" },
];

const LOCALE_OPTIONS = [
  { key: "vi", label: "🇻🇳 Tiếng Việt" },
  { key: "en", label: "🇺🇸 English" },
  { key: "ja", label: "🇯🇵 日本語" },
  { key: "ko", label: "🇰🇷 한국어" },
  { key: "zh", label: "🇨🇳 中文" },
];

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  hero:         { color: DS.pink,               bg: "rgba(236,72,153,0.1)" },
  stats:        { color: DS.cosmicCyan,         bg: "rgba(98,197,235,0.1)" },
  story:        { color: DS.cosmicPurple,       bg: "rgba(107,61,245,0.1)" },
  timeline:     { color: DS.gold,               bg: "rgba(230,199,95,0.1)" },
  values:       { color: DS.cosmicBlue,         bg: "rgba(79,125,243,0.1)" },
  team_preview: { color: DS.rose,               bg: "rgba(215,126,142,0.1)" },
  cta:          { color: DS.teal,              bg: "rgba(110,177,168,0.1)" },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: "100%",
  background: DS.bg,
  border: `1px solid ${DS.border}`,
  borderRadius: 10,
  padding: "9px 12px",
  color: DS.text,
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
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

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px",
          background: open ? "rgba(107,61,245,0.06)" : DS.bgCard,
          border: "none", cursor: "pointer", color: DS.text2, fontSize: 13,
          fontFamily: DS.mono, fontWeight: 600,
        }}
      >
        {open ? <ChevronDown size={14} color={DS.cosmicPurple} /> : <ChevronRight size={14} color={DS.cosmicPurple} />}
        {icon}
        <span style={{ flex: 1, textAlign: "left" }}>{title}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────

function SectionEditModal({
  section,
  onClose,
  onSuccess,
}: {
  section: SectionRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!section;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<SectionFormData>({
    sectionType: section?.sectionType ?? "hero",
    locale: section?.locale ?? "vi",
    badge: section?.badge ?? "",
    title: section?.title ?? "",
    titleHighlight: section?.titleHighlight ?? "",
    subtitle: section?.subtitle ?? "",
    description: section?.description ?? "",
    ctaText: section?.ctaText ?? "",
    ctaLink: section?.ctaLink ?? "",
    cta2Text: section?.cta2Text ?? "",
    cta2Link: section?.cta2Link ?? "",
    stats: section?.stats ? JSON.stringify(section.stats, null, 2) : "[]",
    story: section?.story ? JSON.stringify(section.story, null, 2) : "[]",
    timeline: section?.timeline ? JSON.stringify(section.timeline, null, 2) : "[]",
    values: section?.values ? JSON.stringify(section.values, null, 2) : "[]",
    teamPreview: section?.teamPreview ? JSON.stringify(section.teamPreview, null, 2) : "[]",
    ctaSectionTitle: section?.ctaSectionTitle ?? "",
    ctaSectionSub: section?.ctaSectionSub ?? "",
    isActive: section?.isActive ?? true,
    sortOrder: section?.sortOrder ?? 0,
  });

  const set = <K extends keyof SectionFormData>(k: K, v: SectionFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload: Record<string, unknown> = {
        sectionType: form.sectionType,
        locale: form.locale,
        badge: form.badge || null,
        title: form.title || null,
        titleHighlight: form.titleHighlight || null,
        subtitle: form.subtitle || null,
        description: form.description || null,
        ctaText: form.ctaText || null,
        ctaLink: form.ctaLink || null,
        cta2Text: form.cta2Text || null,
        cta2Link: form.cta2Link || null,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      };

      // Parse JSON fields
      const jsonFields = ["stats", "story", "timeline", "values", "teamPreview"] as const;
      for (const f of jsonFields) {
        try { payload[f] = JSON.parse(form[f] || "[]"); }
        catch { setError(`${f} không đúng định dạng JSON`); setSaving(false); return; }
      }

      if (form.ctaSectionTitle) payload.ctaSectionTitle = form.ctaSectionTitle;
      if (form.ctaSectionSub) payload.ctaSectionSub = form.ctaSectionSub;

      if (isEdit) {
        await adminApi.put(`/api/admin/about-sections/${section.id}`, payload);
      } else {
        await adminApi.post("/api/admin/about-sections", payload);
      }
      onSuccess();
    } catch {
      setError("Đã xảy ra lỗi khi lưu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: "100%", maxWidth: 720, maxHeight: "90vh", overflowY: "auto",
          background: DS.bgCard2, border: `1px solid ${DS.border}`,
          borderRadius: 16, padding: "24px 28px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ color: DS.text, fontSize: 18, fontWeight: 700, margin: 0 }}>
              {isEdit ? "Sửa Section" : "Tạo Section mới"}
            </h2>
            <p style={{ color: DS.text4, fontSize: 12, marginTop: 3 }}>
              Quản lý nội dung trang Về chúng tôi
            </p>
          </div>
          <button type="button" onClick={onClose}
            style={{ background: "transparent", border: "none", color: DS.text4, cursor: "pointer", padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Type + Locale + Sort */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>SECTION TYPE</label>
              <select value={form.sectionType} onChange={e => set("sectionType", e.target.value)}
                style={{ ...inp, cursor: "pointer" }}>
                {SECTION_TYPES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>NGÔN NGỮ</label>
              <select value={form.locale} onChange={e => set("locale", e.target.value)}
                style={{ ...inp, cursor: "pointer" }}>
                {LOCALE_OPTIONS.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
              </select>
            </div>
            <div style={{ width: 80 }}>
              <label style={labelStyle}>THỨ TỰ</label>
              <input type="number" value={form.sortOrder}
                onChange={e => set("sortOrder", parseInt(e.target.value, 10) || 0)} style={inp} />
            </div>
            <div style={{ width: 100 }}>
              <label style={labelStyle}>TRẠNG THÁI</label>
              <div style={{ display: "flex", alignItems: "center", gap: 6, height: "100%", paddingTop: 8 }}>
                <button type="button" onClick={() => set("isActive", !form.isActive)}
                  style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: form.isActive ? DS.green : DS.border,
                    border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s",
                  }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: "#fff",
                    position: "absolute", top: 2,
                    left: form.isActive ? 20 : 2, transition: "left 0.2s",
                  }} />
                </button>
                <span style={{ color: DS.text3, fontSize: 11 }}>{form.isActive ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </div>

          {/* Text fields */}
          <Section title="📝 Nội dung văn bản" icon={<span>📝</span>}>
            <div>
              <label style={labelStyle}>BADGE (e.g. "VỀ CHÚNG TÔI")</label>
              <input style={inp} value={form.badge} onChange={e => set("badge", e.target.value)}
                placeholder="Badge hiển thị trên hero" />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>TITLE</label>
                <input style={inp} value={form.title} onChange={e => set("title", e.target.value)}
                  placeholder="Tiêu đề chính" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>TITLE HIGHLIGHT</label>
                <input style={inp} value={form.titleHighlight} onChange={e => set("titleHighlight", e.target.value)}
                  placeholder="Phần tô đậm trong title" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>SUBTITLE</label>
              <input style={inp} value={form.subtitle} onChange={e => set("subtitle", e.target.value)}
                placeholder="Phụ đề" />
            </div>
            <div>
              <label style={labelStyle}>DESCRIPTION</label>
              <textarea style={{ ...inp, minHeight: 100, resize: "vertical" }}
                value={form.description} onChange={e => set("description", e.target.value)}
                placeholder="Mô tả dài" />
            </div>
          </Section>

          {/* CTA */}
          <Section title="🔗 Nút CTA" icon={<span>🔗</span>}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>CTA TEXT</label>
                <input style={inp} value={form.ctaText} onChange={e => set("ctaText", e.target.value)}
                  placeholder="Liên hệ ngay" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>CTA LINK</label>
                <input style={inp} value={form.ctaLink} onChange={e => set("ctaLink", e.target.value)}
                  placeholder="/contact" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>CTA 2 TEXT</label>
                <input style={inp} value={form.cta2Text} onChange={e => set("cta2Text", e.target.value)}
                  placeholder="Xem thêm" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>CTA 2 LINK</label>
                <input style={inp} value={form.cta2Link} onChange={e => set("cta2Link", e.target.value)}
                  placeholder="/case-studies" />
              </div>
            </div>
          </Section>

          {/* JSON fields */}
          <Section title="📊 Stats JSON (array of {value, label, icon, color})" icon={<span>📊</span>}>
            <textarea style={{ ...inp, minHeight: 120, fontFamily: DS.mono, fontSize: 12 }}
              value={form.stats} onChange={e => set("stats", e.target.value)}
              placeholder='[{"value":"50+","label":"Dự án","icon":"TrendingUp","color":"#62C5EB"}]' />
          </Section>

          <Section title="📖 Story JSON (array of paragraphs)" icon={<span>📖</span>}>
            <textarea style={{ ...inp, minHeight: 80, fontFamily: DS.mono, fontSize: 12 }}
              value={form.story} onChange={e => set("story", e.target.value)}
              placeholder='["Paragraph 1","Paragraph 2"]' />
          </Section>

          <Section title="⏱ Timeline JSON (array of {year, title, description})" icon={<span>⏱</span>}>
            <textarea style={{ ...inp, minHeight: 120, fontFamily: DS.mono, fontSize: 12 }}
              value={form.timeline} onChange={e => set("timeline", e.target.value)}
              placeholder='[{"year":"2024","title":"Khởi đầu","description":"..."}]' />
          </Section>

          <Section title="💎 Values JSON (array of {icon, title, description, color})" icon={<span>💎</span>}>
            <textarea style={{ ...inp, minHeight: 120, fontFamily: DS.mono, fontSize: 12 }}
              value={form.values} onChange={e => set("values", e.target.value)}
              placeholder='[{"icon":"Target","title":"Sứ mệnh","description":"...","color":"#62C5EB"}]' />
          </Section>

          <Section title="👥 Team Preview JSON (array of {name, role, department, avatar, deptColor})" icon={<span>👥</span>}>
            <textarea style={{ ...inp, minHeight: 120, fontFamily: DS.mono, fontSize: 12 }}
              value={form.teamPreview} onChange={e => set("teamPreview", e.target.value)}
              placeholder='[{"name":"CEO","role":"Chief Executive Officer","department":"Management","deptColor":"#E6C75F"}]' />
          </Section>

          {/* CTA section */}
          <Section title="🎯 CTA cuối trang" icon={<span>🎯</span>}>
            <div>
              <label style={labelStyle}>CTA SECTION TITLE</label>
              <input style={inp} value={form.ctaSectionTitle}
                onChange={e => set("ctaSectionTitle", e.target.value)} placeholder="Sẵn sàng nâng cấp?" />
            </div>
            <div>
              <label style={labelStyle}>CTA SECTION SUBTITLE</label>
              <textarea style={{ ...inp, minHeight: 80 }}
                value={form.ctaSectionSub} onChange={e => set("ctaSectionSub", e.target.value)}
                placeholder="Mô tả phụ CTA" />
            </div>
          </Section>

          {/* Error */}
          {error && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8, color: DS.red, fontSize: 13,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" onClick={onClose}
              style={{ padding: "9px 20px", borderRadius: 10, background: "transparent",
                border: `1px solid ${DS.border}`, color: DS.text3, fontSize: 13, cursor: "pointer" }}>
              Hủy
            </button>
            <button type="submit" disabled={saving}
              style={{
                padding: "9px 24px", borderRadius: 10, background: GRD.primary, border: "none",
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8, opacity: saving ? 0.6 : 1,
              }}>
              {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo Section"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirmModal({ section, onClose, onConfirm }: {
  section: SectionRecord; onClose: () => void; onConfirm: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.delete(`/api/admin/about-sections/${section.id}`);
      onConfirm();
    } finally { setDeleting(false); }
  };
  const tc = TYPE_COLORS[section.sectionType] ?? TYPE_COLORS.cta;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{
          background: DS.bgCard2, border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 16, padding: "28px 32px", maxWidth: 400, width: "100%", textAlign: "center",
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
        }}>
          <Trash2 size={22} style={{ color: DS.red }} />
        </div>
        <h3 style={{ color: DS.text, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          Xóa Section?
        </h3>
        <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>
          Section <strong style={{ color: tc.color }}>{section.sectionType}</strong> — {section.title ?? "(no title)"}
        </p>
        <p style={{ color: DS.text4, fontSize: 12, marginBottom: 24 }}>
          Hành động này không thể hoàn tác.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onClose}
            style={{ padding: "9px 20px", borderRadius: 10, background: "transparent",
              border: `1px solid ${DS.border}`, color: DS.text3, fontSize: 13, cursor: "pointer" }}>
            Hủy
          </button>
          <button onClick={handleDelete} disabled={deleting}
            style={{ padding: "9px 20px", borderRadius: 10,
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              color: DS.red, fontSize: 13, fontWeight: 600, cursor: "pointer",
              opacity: deleting ? 0.6 : 1 }}>
            {deleting ? "Đang xóa..." : "Xóa Section"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AboutAdminPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterLocale, setFilterLocale] = useState("all");
  const [editSection, setEditSection] = useState<SectionRecord | null>(null);
  const [deleteSection, setDeleteSection] = useState<SectionRecord | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "about-sections"],
    queryFn: async () => {
      const res = await adminApi.get<{ data: SectionRecord[] }>("/api/admin/about-sections", {
        params: { limit: 100 },
      });
      return res.data ?? [];
    },
  });

  const filtered = (data ?? []).filter((s) => {
    const matchSearch = !search
      || s.title?.toLowerCase().includes(search.toLowerCase())
      || s.sectionType.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || s.sectionType === filterType;
    const matchLocale = filterLocale === "all" || s.locale === filterLocale;
    return matchSearch && matchType && matchLocale;
  });

  const handleSuccess = () => {
    setEditSection(null);
    setShowCreate(false);
    setDeleteSection(null);
    queryClient.invalidateQueries({ queryKey: ["admin", "about-sections"] });
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: DS.text, fontSize: 22, fontWeight: 800, margin: 0 }}>
            Về chúng tôi — CMS
          </h1>
          <p style={{ color: DS.text4, fontSize: 12, marginTop: 4 }}>
            Quản lý nội dung trang About Us — mỗi section riêng biệt
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 18px", borderRadius: 10,
            background: GRD.primary, border: "none",
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          <Plus size={15} />
          Tạo Section
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
          <input type="text" placeholder="Tìm kiếm section..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, paddingLeft: 38 }} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ ...inp, width: 220, cursor: "pointer" }}>
          <option value="all">Tất cả loại</option>
          {SECTION_TYPES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select value={filterLocale} onChange={e => setFilterLocale(e.target.value)}
          style={{ ...inp, width: 180, cursor: "pointer" }}>
          <option value="all">Tất cả ngôn ngữ</option>
          {LOCALE_OPTIONS.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: DS.bgCard, border: `1px solid ${DS.border}`,
        borderRadius: 14, overflow: "hidden",
      }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: DS.text4, fontSize: 13 }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: DS.text4, fontSize: 13 }}>
            Chưa có section nào. Nhấn "Tạo Section" để thêm mới.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                {["#", "Loại", "Ngôn ngữ", "Tiêu đề", "Thứ tự", "Trạng thái", "Ngày tạo", "Thao tác"].map(h => (
                  <th key={h} style={{
                    padding: "10px 16px", color: DS.text4, fontSize: 11,
                    fontFamily: DS.mono, letterSpacing: "0.08em", textAlign: "left", fontWeight: 600,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((section) => {
                const tc = TYPE_COLORS[section.sectionType] ?? TYPE_COLORS.cta;
                const localeLabel = LOCALE_OPTIONS.find(l => l.key === section.locale)?.label ?? section.locale;
                return (
                  <tr key={section.id} style={{ borderBottom: `1px solid ${DS.border}20` }}>
                    <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
                      {section.sortOrder}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: 9999,
                        background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 600,
                        border: `1px solid ${tc.color}30`,
                      }}>
                        {section.sectionType}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>
                      {localeLabel}
                    </td>
                    <td style={{ padding: "12px 16px", maxWidth: 260 }}>
                      <p style={{ color: DS.text, fontSize: 13, fontWeight: 500, overflow: "hidden",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {section.title ?? section.subtitle ?? section.description ?? "(no content)"}
                      </p>
                      {section.badge && (
                        <p style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>
                          Badge: {section.badge}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>
                      {section.sortOrder}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {section.isActive
                          ? <CheckCircle2 size={14} style={{ color: DS.green }} />
                          : <AlertCircle size={14} style={{ color: DS.text4 }} />
                        }
                        <span style={{ color: section.isActive ? DS.green : DS.text4, fontSize: 12 }}>
                          {section.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12 }}>
                      {new Date(section.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setEditSection(section)}
                          style={{
                            padding: "6px 10px", borderRadius: 8,
                            background: "rgba(107,61,245,0.08)",
                            border: "1px solid rgba(107,61,245,0.2)",
                            color: DS.cosmicPurple, cursor: "pointer",
                          }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setDeleteSection(section)}
                          style={{
                            padding: "6px 10px", borderRadius: 8,
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            color: DS.red, cursor: "pointer",
                          }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
        <div style={{
          padding: "12px 18px", background: DS.bgCard, border: `1px solid ${DS.border}`,
          borderRadius: 10, color: DS.text4, fontSize: 12,
        }}>
          <span style={{ fontFamily: DS.mono }}>{data?.length ?? 0}</span> Sections trong hệ thống
        </div>
        <div style={{
          padding: "12px 18px", background: DS.bgCard, border: `1px solid ${DS.border}`,
          borderRadius: 10, color: DS.green, fontSize: 12,
        }}>
          <span style={{ fontFamily: DS.mono }}>{(data ?? []).filter((s: SectionRecord) => s.isActive).length}</span> Active
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <SectionEditModal section={null} onClose={() => setShowCreate(false)} onSuccess={handleSuccess} />
      )}
      {editSection && (
        <SectionEditModal section={editSection} onClose={() => setEditSection(null)} onSuccess={handleSuccess} />
      )}
      {deleteSection && (
        <DeleteConfirmModal section={deleteSection} onClose={() => setDeleteSection(null)} onConfirm={handleSuccess} />
      )}
    </div>
  );
}
