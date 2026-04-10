"use client";

/**
 * Addon Services Admin Page — LOOP Solutions
 * Route: /admin/addon_services
 * CRUD for AddonService: slug, name, nameVi, description, descriptionVi,
 * icon, type, price, billingPeriod, lpCost, sortOrder, isActive.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Plus, Edit3, X, ToggleRight, ToggleLeft,
  Layers, Search,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type AddonService = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  description: string | null;
  descriptionVi: string | null;
  icon: string | null;
  type: string;
  price: number;
  billingPeriod: string | null;
  lpCost: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
};

type FormData = {
  slug: string;
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  icon: string;
  type: string;
  price: number;
  billingPeriod: string | null;
  lpCost: number | null;
  sortOrder: number;
  isActive: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(n) + "₫";

const TYPES = [
  { value: "hosting", label: "Hosting" },
  { value: "domain", label: "Tên miền" },
  { value: "maintenance", label: "Bảo trì" },
  { value: "analytics", label: "Analytics" },
  { value: "training", label: "Training" },
  { value: "priority", label: "Hỗ trợ ưu tiên" },
  { value: "seo", label: "SEO" },
  { value: "other", label: "Khác" },
];

const ICONS = [
  { value: "Server", label: "Server (Hosting)" },
  { value: "Globe", label: "Globe (Domain)" },
  { value: "Shield", label: "Shield (Security)" },
  { value: "BarChart3", label: "BarChart (Analytics)" },
  { value: "Users", label: "Users (Training)" },
  { value: "Sparkles", label: "Sparkles (Priority)" },
  { value: "Target", label: "Target (SEO)" },
  { value: "Layers", label: "Layers (Other)" },
];

const defaultForm: FormData = {
  slug: "",
  name: "",
  nameVi: "",
  description: "",
  descriptionVi: "",
  icon: "Layers",
  type: "other",
  price: 0,
  billingPeriod: null,
  lpCost: null,
  sortOrder: 0,
  isActive: true,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddonServicesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showActive, setShowActive] = useState<boolean | null>(null);
  const [modal, setModal] = useState<{ open: boolean; edit?: AddonService }>({ open: false });
  const [form, setForm] = useState<FormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Fetch paginated list
  const { data, isLoading } = useQuery({
    queryKey: ["addon-services"],
    queryFn: () => adminApi.get<{ data: AddonService[] }>("/addon-services?limit=100").then(r => r.data ?? []),
  });

  const items = (data ?? []).filter(a => {
    const term = search.toLowerCase();
    if (search && !a.name.toLowerCase().includes(term) && !a.nameVi.toLowerCase().includes(term) && !a.slug.toLowerCase().includes(term)) return false;
    if (typeFilter && a.type !== typeFilter) return false;
    if (showActive === true && !a.isActive) return false;
    if (showActive === false && a.isActive) return false;
    return true;
  });

  // Create / Update
  const save = useMutation({
    mutationFn: (payload: FormData) =>
      modal.edit
        ? adminApi.put(`/addon-services/${modal.edit.id}`, payload)
        : adminApi.post("/addon-services", payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["addon-services"] }); closeModal(); },
  });

  // Toggle active
  const toggle = useMutation({
    mutationFn: (item: AddonService) =>
      adminApi.put(`/addon-services/${item.id}`, { ...item, isActive: !item.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addon-services"] }),
  });

  const openCreate = () => { setForm(defaultForm); setErrors({}); setModal({ open: true }); };
  const openEdit = (a: AddonService) => {
    setForm({
      slug: a.slug,
      name: a.name ?? "",
      nameVi: a.nameVi ?? "",
      description: a.description ?? "",
      descriptionVi: a.descriptionVi ?? "",
      icon: a.icon ?? "Layers",
      type: a.type,
      price: a.price,
      billingPeriod: a.billingPeriod ?? null,
      lpCost: a.lpCost ?? null,
      sortOrder: a.sortOrder,
      isActive: a.isActive,
    });
    setErrors({});
    setModal({ open: true, edit: a });
  };
  const closeModal = () => setModal({ open: false });

  const generateSlug = () => {
    const s = (form.nameVi || form.name || "").toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setForm(f => ({ ...f, slug: s }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim() && !form.nameVi.trim()) e.nameVi = "Cần nhập tên tiếng Việt hoặc EN";
    if (!form.type) e.type = "Cần chọn loại dịch vụ";
    if (form.price < 0) e.price = "Giá không hợp lệ";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    save.mutate(form);
  };

  const typeColor: Record<string, string> = {
    hosting: DS.purple,
    domain: DS.cyan,
    maintenance: DS.green,
    analytics: DS.amber,
    training: DS.teal,
    priority: DS.pink,
    seo: DS.gold,
    other: DS.text4,
  };

  return (
    <div style={{ padding: "1.5rem", minHeight: "100vh", background: DS.bgCosmic }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900 }}>
            Dịch Vụ Bổ Sung
          </h1>
          <p style={{ color: DS.text4, fontSize: 13, marginTop: 4 }}>
            Quản lý dịch vụ bổ sung hiển thị trong booking wizard (hosting, bảo trì, SEO...)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm"
          style={{ background: GRD.primary, color: "#fff" }}
        >
          <Plus size={16} />
          Thêm dịch vụ
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative" style={{ flex: 1, minWidth: 200 }}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: DS.text4 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên, slug..."
            style={{
              width: "100%", paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
              background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
              borderRadius: 10, color: DS.text, fontSize: 14,
            }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
            borderRadius: 10, color: DS.text3, fontSize: 13,
          }}
        >
          <option value="">Tất cả loại</option>
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <div className="flex gap-1">
          {([null, true, false] as const).map(s => (
            <button key={String(s)} onClick={() => setShowActive(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: showActive === s ? DS.pink : "rgba(255,255,255,0.04)",
                color: showActive === s ? "#fff" : DS.text4,
                border: `1px solid ${showActive === s ? DS.pink : DS.border}`,
              }}>
              {s === null ? "Tất cả" : s ? "Đang bật" : "Đã tắt"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${DS.border}`, background: DS.bgCard }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              {["Tên dịch vụ", "Loại", "Giá", "Billing", "LP Cost", "Slug", "Thứ tự", "TT", "HĐ"].map((h, i) => (
                <th key={h} style={{
                  padding: "12px 16px", color: DS.text4, fontSize: 11, fontFamily: DS.mono,
                  letterSpacing: "0.1em", textAlign: "left",
                  width: i === 0 ? undefined : "auto",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} style={{ padding: 32, textAlign: "center", color: DS.text4 }}>Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 32, textAlign: "center", color: DS.text4 }}>Chưa có dữ liệu</td></tr>
            ) : items.map(a => (
              <tr key={a.id} style={{ borderTop: `1px solid ${DS.border}` }}>
                <td style={{ padding: "14px 16px" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${typeColor[a.type] ?? DS.purple}15`, color: typeColor[a.type] ?? DS.purple }}>
                      <Layers size={15} />
                    </div>
                    <div>
                      <div style={{ color: DS.text, fontWeight: 600, fontSize: 13 }}>{a.nameVi || a.name}</div>
                      <div style={{ color: DS.text4, fontSize: 11 }}>{a.name && a.name !== a.nameVi ? a.name : ""}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ background: `${typeColor[a.type] ?? DS.text4}15`, color: typeColor[a.type] ?? DS.text4 }}>
                    {TYPES.find(t => t.value === a.type)?.label ?? a.type}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ color: a.price > 0 ? DS.text : DS.text4, fontFamily: DS.mono, fontSize: 13 }}>
                    {a.price > 0 ? fmtVND(a.price) : "Miễn phí"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ color: DS.text4, fontSize: 12 }}>{a.billingPeriod ?? "—"}</span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ color: a.lpCost ? DS.gold : DS.text4, fontFamily: DS.mono, fontSize: 12 }}>
                    {a.lpCost ? `${a.lpCost.toLocaleString()} LP` : "—"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ color: DS.text4, fontFamily: DS.mono, fontSize: 11 }}>{a.slug}</span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ color: DS.text4, fontFamily: DS.mono, fontSize: 12 }}>{a.sortOrder}</span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <button onClick={() => toggle.mutate(a)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    {a.isActive
                      ? <ToggleRight size={22} style={{ color: DS.green }} />
                      : <ToggleLeft size={22} style={{ color: DS.text4 }} />}
                  </button>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(a)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6 }}
                      className="hover:bg-white/10 transition-colors">
                      <Edit3 size={15} style={{ color: DS.pink }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal.open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center",
              justifyContent: "center", padding: "1rem",
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
            }}
            onClick={e => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: "100%", maxWidth: 560, background: DS.bgCard,
                borderRadius: 20, border: `1px solid ${DS.border}`, overflow: "hidden",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${DS.border}` }}>
                <div>
                  <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 16, fontWeight: 900 }}>
                    {modal.edit ? "Sửa dịch vụ" : "Thêm dịch vụ bổ sung"}
                  </h2>
                  <p style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>
                    {modal.edit ? `Chỉnh sửa: ${modal.edit.nameVi || modal.edit.name}` : "Tạo dịch vụ mới cho booking wizard"}
                  </p>
                </div>
                <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <X size={18} style={{ color: DS.text4 }} />
                </button>
              </div>

              {/* Form */}
              <div className="px-6 py-5 space-y-4">
                {/* Type */}
                <div>
                  <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                    Loại dịch vụ <span style={{ color: DS.pink }}>*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TYPES.map(t => (
                      <button key={t.value} type="button"
                        onClick={() => setForm(f => ({ ...f, type: t.value }))}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{
                          background: form.type === t.value ? `${typeColor[t.value] ?? DS.purple}20` : "rgba(255,255,255,0.04)",
                          color: form.type === t.value ? (typeColor[t.value] ?? DS.purple) : DS.text4,
                          border: `1px solid ${form.type === t.value ? (typeColor[t.value] ?? DS.purple) : DS.border}`,
                          cursor: "pointer",
                        }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  {errors.type && <p style={{ color: DS.red, fontSize: 11, marginTop: 4 }}>{errors.type}</p>}
                </div>

                {/* Name VI */}
                <div>
                  <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                    Tên tiếng Việt <span style={{ color: DS.pink }}>*</span>
                  </label>
                  <input
                    value={form.nameVi}
                    onChange={e => setForm(f => ({ ...f, nameVi: e.target.value }))}
                    placeholder="VD: Hosting 1 năm, Bảo trì website..."
                    style={{
                      width: "100%", padding: "10px 14px",
                      background: "rgba(15,23,42,0.6)", border: `1px solid ${errors.nameVi ? DS.red : DS.border}`,
                      borderRadius: 10, color: DS.text, fontSize: 14,
                    }}
                  />
                  {errors.nameVi && <p style={{ color: DS.red, fontSize: 11, marginTop: 4 }}>{errors.nameVi}</p>}
                </div>

                {/* Name EN */}
                <div>
                  <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                    Tên tiếng Anh
                  </label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="VD: 1-Year Hosting, Website Maintenance..."
                    style={{
                      width: "100%", padding: "10px 14px",
                      background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
                      borderRadius: 10, color: DS.text, fontSize: 14,
                    }}
                  />
                </div>

                {/* Slug + icon row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em" }}>
                        Slug
                      </label>
                      <button type="button" onClick={generateSlug}
                        style={{ background: "none", border: "none", color: DS.pink, fontSize: 11, cursor: "pointer", padding: 0 }}>
                        Auto
                      </button>
                    </div>
                    <input
                      value={form.slug}
                      onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                      placeholder="hosting-1-nam"
                      style={{
                        width: "100%", padding: "10px 14px",
                        background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
                        borderRadius: 10, color: DS.text, fontSize: 14,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Icon (lucide)
                    </label>
                    <select
                      value={form.icon ?? "Layers"}
                      onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                      style={{
                        width: "100%", padding: "10px 14px",
                        background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
                        borderRadius: 10, color: DS.text, fontSize: 14,
                      }}
                    >
                      {ICONS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Mô tả (VI)
                    </label>
                    <input
                      value={form.descriptionVi ?? ""}
                      onChange={e => setForm(f => ({ ...f, descriptionVi: e.target.value }))}
                      placeholder="Mô tả ngắn bằng tiếng Việt"
                      style={{
                        width: "100%", padding: "10px 14px",
                        background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
                        borderRadius: 10, color: DS.text, fontSize: 14,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Mô tả (EN)
                    </label>
                    <input
                      value={form.description ?? ""}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Short description in English"
                      style={{
                        width: "100%", padding: "10px 14px",
                        background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
                        borderRadius: 10, color: DS.text, fontSize: 14,
                      }}
                    />
                  </div>
                </div>

                {/* Price + billing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Giá (VNĐ) <span style={{ color: DS.pink }}>*</span>
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                      placeholder="0"
                      style={{
                        width: "100%", padding: "10px 14px",
                        background: "rgba(15,23,42,0.6)", border: `1px solid ${errors.price ? DS.red : DS.border}`,
                        borderRadius: 10, color: DS.text, fontSize: 14,
                      }}
                    />
                    {errors.price && <p style={{ color: DS.red, fontSize: 11, marginTop: 4 }}>{errors.price}</p>}
                  </div>
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Billing period
                    </label>
                    <input
                      value={form.billingPeriod ?? ""}
                      onChange={e => setForm(f => ({ ...f, billingPeriod: e.target.value || null }))}
                      placeholder="VD: 1 năm, hàng tháng"
                      style={{
                        width: "100%", padding: "10px 14px",
                        background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
                        borderRadius: 10, color: DS.text, fontSize: 14,
                      }}
                    />
                  </div>
                </div>

                {/* LP Cost + sort */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      LP Cost (tùy chọn)
                    </label>
                    <input
                      type="number"
                      value={form.lpCost ?? ""}
                      onChange={e => setForm(f => ({ ...f, lpCost: e.target.value ? Number(e.target.value) : null }))}
                      placeholder="LP cost cho nhân viên đổi — để trống nếu không cho LP"
                      style={{
                        width: "100%", padding: "10px 14px",
                        background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
                        borderRadius: 10, color: DS.text, fontSize: 14,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Thứ tự hiển thị
                    </label>
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                      style={{
                        width: "100%", padding: "10px 14px",
                        background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
                        borderRadius: 10, color: DS.text, fontSize: 14,
                      }}
                    />
                  </div>
                </div>

                {/* Active */}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    {form.isActive
                      ? <ToggleRight size={22} style={{ color: DS.green }} />
                      : <ToggleLeft size={22} style={{ color: DS.text4 }} />}
                  </button>
                  <span style={{ color: DS.text3, fontSize: 13 }}>
                    {form.isActive ? "Đang bật — hiển thị trong booking wizard" : "Đã tắt — ẩn khỏi booking wizard"}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${DS.border}` }}>
                <button onClick={closeModal}
                  style={{
                    padding: "10px 20px", borderRadius: 10, border: `1px solid ${DS.border}`,
                    background: "rgba(255,255,255,0.04)", color: DS.text3, fontSize: 14, cursor: "pointer",
                  }}>
                  Hủy
                </button>
                <button onClick={handleSave} disabled={save.isPending}
                  style={{
                    padding: "10px 24px", borderRadius: 10, border: "none",
                    background: GRD.primary, color: "#fff", fontSize: 14, fontWeight: 600,
                    cursor: save.isPending ? "not-allowed" : "pointer",
                    opacity: save.isPending ? 0.6 : 1,
                  }}>
                  {save.isPending ? "Đang lưu..." : (modal.edit ? "Lưu thay đổi" : "Tạo mới")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
