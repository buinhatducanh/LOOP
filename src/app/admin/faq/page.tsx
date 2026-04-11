"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import {
  Plus, Edit2, Trash2, Search, X, ChevronDown, ChevronRight,
  CheckCircle2, AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FaqRecord = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  questionEn?: string | null;
  questionJa?: string | null;
  questionKo?: string | null;
  questionZh?: string | null;
  answerEn?: string | null;
  answerJa?: string | null;
  answerKo?: string | null;
  answerZh?: string | null;
};

type FaqFormData = {
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
  questionEn: string; answerEn: string;
  questionJa: string; answerJa: string;
  questionKo: string; answerKo: string;
  questionZh: string; answerZh: string;
};

const CATEGORIES = [
  { key: "general",   label: "Chung" },
  { key: "services",  label: "Dịch vụ" },
  { key: "technical", label: "Kỹ thuật" },
  { key: "payment",   label: "Thanh toán" },
  { key: "lp",        label: "Hệ thống LP" },
  { key: "academy",   label: "Học viện" },
];

const CAT_STYLE: Record<string, { color: string; bg: string }> = {
  general:   { color: DS.text2,               bg: "rgba(148,163,184,0.1)" },
  services:  { color: DS.cosmicPurple,          bg: "rgba(107,61,245,0.12)" },
  technical: { color: DS.cosmicBlue,            bg: "rgba(79,125,243,0.12)" },
  payment:   { color: "#14B8A6",                bg: "rgba(20,184,166,0.1)" },
  lp:        { color: DS.pink,                  bg: "rgba(236,72,153,0.1)" },
  academy:   { color: "#F59E0B",               bg: "rgba(245,158,11,0.1)" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────────

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
          padding: "10px 14px",
          background: open ? "rgba(107,61,245,0.06)" : DS.bgCard,
          border: "none", cursor: "pointer", color: DS.text2, fontSize: 13,
          fontFamily: DS.mono, fontWeight: 600,
        }}
      >
        {open
          ? <ChevronDown size={14} color={DS.cosmicPurple} />
          : <ChevronRight size={14} color={DS.cosmicPurple} />
        }
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
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────

function FaqEditModal({
  faq,
  onClose,
  onSuccess,
}: {
  faq: FaqRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!faq;

  const [form, setForm] = useState<FaqFormData>({
    question: faq?.question ?? "",
    answer: faq?.answer ?? "",
    category: faq?.category ?? "general",
    sortOrder: faq?.sortOrder ?? 0,
    isActive: faq?.isActive ?? true,
    questionEn: faq?.questionEn ?? "",
    answerEn: faq?.answerEn ?? "",
    questionJa: faq?.questionJa ?? "",
    answerJa: faq?.answerJa ?? "",
    questionKo: faq?.questionKo ?? "",
    answerKo: faq?.answerKo ?? "",
    questionZh: faq?.questionZh ?? "",
    answerZh: faq?.answerZh ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof FaqFormData>(k: K, v: FaqFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim()) return setError("Câu hỏi không được để trống");
    if (!form.answer.trim()) return setError("Câu trả lời không được để trống");
    setSaving(true);
    setError("");

    try {
      if (isEdit) {
        await adminApi.put(`/api/admin/faq/${faq.id}`, form);
      } else {
        await adminApi.post("/api/admin/faq", form);
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
          width: "100%",
          maxWidth: 720,
          maxHeight: "90vh",
          overflowY: "auto",
          background: DS.bgCard2,
          border: `1px solid ${DS.border}`,
          borderRadius: 16,
          padding: "24px 28px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ color: DS.text, fontSize: 18, fontWeight: 700, margin: 0 }}>
              {isEdit ? "Sửa FAQ" : "Tạo FAQ mới"}
            </h2>
            <p style={{ color: DS.text4, fontSize: 12, marginTop: 3 }}>
              {isEdit ? "Cập nhật câu hỏi và câu trả lời" : "Thêm câu hỏi mới vào danh sách FAQ"}
            </p>
          </div>
          <button type="button" onClick={onClose}
            style={{ background: "transparent", border: "none", color: DS.text4, cursor: "pointer", padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Category + SortOrder row */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>DANH MỤC</label>
              <select
                value={form.category}
                onChange={e => set("category", e.target.value)}
                style={{ ...inp, cursor: "pointer" }}
              >
                {CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div style={{ width: 120 }}>
              <label style={labelStyle}>THỨ TỰ</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={e => set("sortOrder", parseInt(e.target.value, 10) || 0)}
                style={inp}
              />
            </div>
            <div style={{ width: 120 }}>
              <label style={labelStyle}>TRẠNG THÁI</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, height: "100%", paddingTop: 8 }}>
                <button
                  type="button"
                  onClick={() => set("isActive", !form.isActive)}
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: form.isActive ? DS.green : DS.border,
                    border: "none", cursor: "pointer",
                    position: "relative", transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: "#fff",
                    position: "absolute", top: 2,
                    left: form.isActive ? 22 : 2,
                    transition: "left 0.2s",
                  }} />
                </button>
                <span style={{ color: DS.text3, fontSize: 12 }}>
                  {form.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Vietnamese question + answer */}
          <Section title="🇻🇳 Tiếng Việt" icon={<span>🇻🇳</span>} defaultOpen>
            <div>
              <label style={labelStyle}>CÂU HỎI (VI) *</label>
              <input
                style={inp}
                value={form.question}
                onChange={e => set("question", e.target.value)}
                placeholder="Nhập câu hỏi bằng tiếng Việt"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>CÂU TRẢ LỜI (VI) *</label>
              <textarea
                style={{ ...inp, minHeight: 120, resize: "vertical" }}
                value={form.answer}
                onChange={e => set("answer", e.target.value)}
                placeholder="Nhập câu trả lời bằng tiếng Việt (hỗ trợ HTML)"
                required
              />
            </div>
          </Section>

          {/* English translation */}
          <Section title="🇺🇸 English Translation" icon={<span>🇺🇸</span>}>
            <div>
              <label style={labelStyle}>QUESTION (EN)</label>
              <input
                style={inp}
                value={form.questionEn}
                onChange={e => set("questionEn", e.target.value)}
                placeholder="English question (optional)"
              />
            </div>
            <div>
              <label style={labelStyle}>ANSWER (EN)</label>
              <textarea
                style={{ ...inp, minHeight: 120, resize: "vertical" }}
                value={form.answerEn}
                onChange={e => set("answerEn", e.target.value)}
                placeholder="English answer — supports HTML"
              />
            </div>
          </Section>

          {/* Japanese translation */}
          <Section title="🇯🇵 日本語 Translation" icon={<span>🇯🇵</span>}>
            <div>
              <label style={labelStyle}>QUESTION (JA)</label>
              <input
                style={inp}
                value={form.questionJa}
                onChange={e => set("questionJa", e.target.value)}
                placeholder="日本語の質問 (optional)"
              />
            </div>
            <div>
              <label style={labelStyle}>ANSWER (JA)</label>
              <textarea
                style={{ ...inp, minHeight: 120, resize: "vertical" }}
                value={form.answerJa}
                onChange={e => set("answerJa", e.target.value)}
                placeholder="日本語の回答 — HTML対応"
              />
            </div>
          </Section>

          {/* Korean translation */}
          <Section title="🇰🇷 한국어 Translation" icon={<span>🇰🇷</span>}>
            <div>
              <label style={labelStyle}>QUESTION (KO)</label>
              <input
                style={inp}
                value={form.questionKo}
                onChange={e => set("questionKo", e.target.value)}
                placeholder="한국어 질문 (optional)"
              />
            </div>
            <div>
              <label style={labelStyle}>ANSWER (KO)</label>
              <textarea
                style={{ ...inp, minHeight: 120, resize: "vertical" }}
                value={form.answerKo}
                onChange={e => set("answerKo", e.target.value)}
                placeholder="한국어 답변 — HTML 지원"
              />
            </div>
          </Section>

          {/* Chinese translation */}
          <Section title="🇨🇳 中文 Translation" icon={<span>🇨🇳</span>}>
            <div>
              <label style={labelStyle}>QUESTION (ZH)</label>
              <input
                style={inp}
                value={form.questionZh}
                onChange={e => set("questionZh", e.target.value)}
                placeholder="中文问题 (optional)"
              />
            </div>
            <div>
              <label style={labelStyle}>ANSWER (ZH)</label>
              <textarea
                style={{ ...inp, minHeight: 120, resize: "vertical" }}
                value={form.answerZh}
                onChange={e => set("answerZh", e.target.value)}
                placeholder="中文回答 — 支持HTML"
              />
            </div>
          </Section>

          {/* Error */}
          {error && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8,
              color: DS.red,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" onClick={onClose}
              style={{
                padding: "9px 20px", borderRadius: 10,
                background: "transparent",
                border: `1px solid ${DS.border}`,
                color: DS.text3, fontSize: 13, cursor: "pointer",
              }}>
              Hủy
            </button>
            <button type="submit" disabled={saving}
              style={{
                padding: "9px 24px", borderRadius: 10,
                background: GRD.primary,
                border: "none",
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
                opacity: saving ? 0.6 : 1,
              }}>
              {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo FAQ"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm ──────────────────────────────────────────────────────────

function DeleteConfirmModal({
  faq,
  onClose,
  onConfirm,
}: {
  faq: FaqRecord;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.delete(`/api/admin/faq/${faq.id}`);
      onConfirm();
    } finally {
      setDeleting(false);
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: DS.bgCard2,
          border: `1px solid rgba(239,68,68,0.3)`,
          borderRadius: 16,
          padding: "28px 32px",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "rgba(239,68,68,0.1)",
          border: `1px solid rgba(239,68,68,0.2)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <Trash2 size={22} style={{ color: DS.red }} />
        </div>
        <h3 style={{ color: DS.text, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          Xóa FAQ?
        </h3>
        <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
          Bạn có chắc muốn xóa câu hỏi này? Hành động này không thể hoàn tác.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onClose}
            style={{
              padding: "9px 20px", borderRadius: 10,
              background: "transparent", border: `1px solid ${DS.border}`,
              color: DS.text3, fontSize: 13, cursor: "pointer",
            }}>
            Hủy
          </button>
          <button onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: "9px 20px", borderRadius: 10,
              background: "rgba(239,68,68,0.15)", border: `1px solid rgba(239,68,68,0.3)`,
              color: DS.red, fontSize: 13, fontWeight: 600, cursor: "pointer",
              opacity: deleting ? 0.6 : 1,
            }}>
            {deleting ? "Đang xóa..." : "Xóa FAQ"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function FaqAdminPage() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [editFaq, setEditFaq] = useState<FaqRecord | null>(null);
  const [deleteFaq, setDeleteFaq] = useState<FaqRecord | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "faq"],
    queryFn: async () => {
      const res = await adminApi.get<{ data: FaqRecord[] }>("/api/admin/faq", {
        params: { limit: 100 },
      });
      return res.data ?? [];
    },
  });

  const filtered = (data ?? []).filter((f) => {
    const matchSearch =
      !search ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.questionEn?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || f.category === filterCategory;
    return matchSearch && matchCat;
  });

  const handleSuccess = () => {
    setEditFaq(null);
    setShowCreate(false);
    setDeleteFaq(null);
    queryClient.invalidateQueries({ queryKey: ["admin", "faq"] });
  };

  return (
    <div style={{ padding: "28px 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ color: DS.text, fontSize: 22, fontWeight: 800, margin: 0 }}>
              FAQ — Câu hỏi thường gặp
            </h1>
            <p style={{ color: DS.text4, fontSize: 12, marginTop: 4 }}>
              Quản lý danh sách câu hỏi & câu trả lời cho trang FAQ công khai
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
            Tạo FAQ
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <Search size={15} style={{
              position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)", color: DS.text4,
            }} />
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                ...inp, paddingLeft: 38,
              }}
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            style={{ ...inp, width: 180, cursor: "pointer" }}
          >
            <option value="all">Tất cả danh mục</option>
            {CATEGORIES.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div style={{
          background: DS.bgCard,
          border: `1px solid ${DS.border}`,
          borderRadius: 14,
          overflow: "hidden",
        }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: DS.text4, fontSize: 13 }}>
              Đang tải...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: DS.text4, fontSize: 13 }}>
              Không có FAQ nào
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                  {["#", "Câu hỏi", "Danh mục", "Thứ tự", "Trạng thái", "Ngày tạo", "Thao tác"].map(h => (
                    <th key={h}
                      style={{
                        padding: "10px 16px",
                        color: DS.text4, fontSize: 11,
                        fontFamily: DS.mono, letterSpacing: "0.08em",
                        textAlign: "left", fontWeight: 600,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((faq) => {
                  const catStyle = CAT_STYLE[faq.category] ?? CAT_STYLE.general;
                  return (
                    <tr
                      key={faq.id}
                      style={{ borderBottom: `1px solid ${DS.border}20` }}
                    >
                      <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
                        {faq.sortOrder}
                      </td>
                      <td style={{ padding: "12px 16px", maxWidth: 320 }}>
                        <p style={{
                          color: DS.text,
                          fontSize: 13,
                          fontWeight: 500,
                          lineHeight: 1.5,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}>
                          {faq.question}
                        </p>
                        {faq.questionEn && (
                          <p style={{ color: DS.text4, fontSize: 11, marginTop: 2, fontStyle: "italic" }}>
                            EN: {faq.questionEn}
                          </p>
                        )}
                        {/* Language badges */}
                        <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 9999, background: "rgba(220,38,38,0.15)", color: "#EF4444", border: "1px solid rgba(220,38,38,0.3)", fontWeight: 600 }}>VI</span>
                          {faq.questionEn && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 9999, background: "rgba(59,130,246,0.15)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.3)", fontWeight: 600 }}>EN</span>}
                          {faq.questionJa && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 9999, background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", fontWeight: 600 }}>JA</span>}
                          {faq.questionKo && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 9999, background: "rgba(34,197,94,0.15)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)", fontWeight: 600 }}>KO</span>}
                          {faq.questionZh && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 9999, background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)", fontWeight: 600 }}>ZH</span>}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: 9999,
                          background: catStyle.bg,
                          color: catStyle.color,
                          fontSize: 11,
                          fontWeight: 600,
                          border: `1px solid ${catStyle.color}30`,
                        }}>
                          {CATEGORIES.find(c => c.key === faq.category)?.label ?? faq.category}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>
                        {faq.sortOrder}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {faq.isActive
                            ? <CheckCircle2 size={14} style={{ color: DS.green }} />
                            : <AlertCircle size={14} style={{ color: DS.text4 }} />
                          }
                          <span style={{
                            color: faq.isActive ? DS.green : DS.text4,
                            fontSize: 12,
                          }}>
                            {faq.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12 }}>
                        {new Date(faq.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => setEditFaq(faq)}
                            style={{
                              padding: "6px 10px", borderRadius: 8,
                              background: "rgba(107,61,245,0.08)",
                              border: `1px solid rgba(107,61,245,0.2)`,
                              color: DS.cosmicPurple, cursor: "pointer",
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteFaq(faq)}
                            style={{
                              padding: "6px 10px", borderRadius: 8,
                              background: "rgba(239,68,68,0.08)",
                              border: `1px solid rgba(239,68,68,0.2)`,
                              color: DS.red, cursor: "pointer",
                            }}
                          >
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

        {/* Stats row */}
        <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
          <div style={{
            padding: "12px 18px",
            background: DS.bgCard,
            border: `1px solid ${DS.border}`,
            borderRadius: 10,
            color: DS.text4,
            fontSize: 12,
          }}>
            <span style={{ fontFamily: DS.mono }}>{data?.length ?? 0}</span> FAQ trong hệ thống
          </div>
          <div style={{
            padding: "12px 18px",
            background: DS.bgCard,
            border: `1px solid ${DS.border}`,
            borderRadius: 10,
            color: DS.green,
            fontSize: 12,
          }}>
            <span style={{ fontFamily: DS.mono }}>{(data ?? []).filter(f => f.isActive).length}</span> Active
          </div>
        </div>

        {/* Modals */}
        {showCreate && (
          <FaqEditModal faq={null} onClose={() => setShowCreate(false)} onSuccess={handleSuccess} />
        )}
        {editFaq && (
          <FaqEditModal faq={editFaq} onClose={() => setEditFaq(null)} onSuccess={handleSuccess} />
        )}
        {deleteFaq && (
          <DeleteConfirmModal faq={deleteFaq} onClose={() => setDeleteFaq(null)} onConfirm={handleSuccess} />
        )}
      </div>
  );
}
