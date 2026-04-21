"use client";

/**
 * Domain Prices Admin Page — LOOP Solutions
 * Route: /admin/domain_prices
 * CRUD for PricingDomainPrice: extension, registrationPrice, renewalPrice,
 * period, note, sortOrder, isActive.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Plus, Edit3, X, ToggleRight, ToggleLeft,
  Globe, Search, Trash2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type DomainPrice = {
  id: string;
  extension: string;
  registrationPrice: number;
  renewalPrice: number;
  period: string;
  periodVi: string;
  note: string | null;
  noteVi: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
};

type FormData = {
  extension: string;
  registrationPrice: number;
  renewalPrice: number;
  period: string;
  periodVi: string;
  note: string;
  noteVi: string;
  sortOrder: number;
  isActive: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(n) + "₫";

// Unified period options: 1 year, 2 years, 3 years (tên miền tối thiểu 1 năm)
const PERIOD_OPTIONS: Array<{ value: string; labelEn: string; labelVi: string }> = [
  { value: "1 year",  labelEn: "1 year",  labelVi: "1 năm" },
  { value: "2 years", labelEn: "2 years", labelVi: "2 năm" },
  { value: "3 years", labelEn: "3 years", labelVi: "3 năm" },
];

const defaultForm: FormData = {
  extension: "",
  registrationPrice: 0,
  renewalPrice: 0,
  period: "1 year",
  periodVi: "1 năm",
  note: "",
  noteVi: "",
  sortOrder: 0,
  isActive: true,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DomainPricesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showActive, setShowActive] = useState<boolean | null>(null);
  const [modal, setModal] = useState<{ open: boolean; edit?: DomainPrice }>({ open: false });
  const [form, setForm] = useState<FormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Fetch
  const { data, isLoading } = useQuery({
    queryKey: ["domain-prices"],
    queryFn: () => adminApi.get<{ data: DomainPrice[] }>("/api/admin/pricing/domain-prices").then(r => r.data ?? []),
  });

  const items = (data ?? []).filter(d => {
    if (search && !d.extension.toLowerCase().includes(search.toLowerCase())) return false;
    if (showActive === true && !d.isActive) return false;
    if (showActive === false && d.isActive) return false;
    return true;
  });

  // Create / Update
  const save = useMutation({
    mutationFn: (payload: FormData) =>
      modal.edit
        ? adminApi.put(`/api/admin/pricing/domain-prices/${modal.edit.id}`, payload)
        : adminApi.post("/api/admin/pricing/domain-prices", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["domain-prices"] });
      closeModal();
      setToast({ message: modal.edit ? "Cập nhật thành công" : "Tạo mới thành công", type: "success" });
    },
    onError: (err: Error) => setToast({ message: "Lỗi: " + err.message, type: "error" }),
  });

  // Toggle active
  const toggle = useMutation({
    mutationFn: (item: DomainPrice) =>
      adminApi.put(`/api/admin/pricing/domain-prices/${item.id}`, { ...item, isActive: !item.isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["domain-prices"] }); setToast({ message: "Cập nhật trạng thái thành công", type: "success" }); },
    onError: (err: Error) => setToast({ message: "Lỗi: " + err.message, type: "error" }),
  });

  // Delete
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/admin/pricing/domain-prices/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["domain-prices"] }); setToast({ message: "Xóa thành công", type: "success" }); },
    onError: (err: Error) => setToast({ message: "Lỗi: " + err.message, type: "error" }),
  });

  const openCreate = () => { setForm(defaultForm); setErrors({}); setModal({ open: true }); };
  const openEdit = (d: DomainPrice) => {
    setForm({
      extension: d.extension,
      registrationPrice: d.registrationPrice,
      renewalPrice: d.renewalPrice,
      period: d.period,
      periodVi: d.periodVi,
      note: d.note ?? "",
      noteVi: d.noteVi ?? "",
      sortOrder: d.sortOrder,
      isActive: d.isActive,
    });
    setErrors({});
    setModal({ open: true, edit: d });
  };
  const closeModal = () => setModal({ open: false });

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.extension.trim()) e.extension = "Không được trống";
    if (form.registrationPrice < 0) e.registrationPrice = "Giá không hợp lệ";
    if (form.renewalPrice < 0) e.renewalPrice = "Giá không hợp lệ";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    save.mutate(form);
  };

  return (
    <div style={{ padding: "1.5rem", minHeight: "100vh", background: DS.bgCosmic }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900 }}>
            Giá Tên Miền
          </h1>
          <p style={{ color: DS.text4, fontSize: 13, marginTop: 4 }}>
            Quản lý giá đăng ký & gia hạn tên miền theo TLD
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm"
          style={{ background: GRD.primary, color: "#fff" }}
        >
          <Plus size={16} />
          Thêm TLD
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: DS.text4 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm .vn, .com..."
            style={{
              width: "100%", paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
              background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
              borderRadius: 10, color: DS.text, fontSize: 14,
            }}
          />
        </div>
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
              {["TLD", "Giá đăng ký", "Giá gia hạn", "Thời hạn", "Ghi chú", "Thứ tự", "Trạng thái", "Hành động"].map(h => (
                <th key={h} style={{ padding: "12px 16px", color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", textAlign: "left" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${DS.border}` }}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}>
                      <div style={{
                        height: 16, borderRadius: 6,
                        background: "rgba(255,255,255,0.04)",
                        animation: "pulse 1.5s infinite",
                        width: j === 0 ? 60 : j === 3 ? 80 : j === 7 ? 32 : "100%",
                        maxWidth: j === 3 ? 80 : undefined,
                      }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: DS.text4 }}>Chưa có dữ liệu</td></tr>
            ) : items.map(d => (
              <tr key={d.id} style={{ borderTop: `1px solid ${DS.border}` }}>
                <td style={{ padding: "14px 16px" }}>
                  <div className="flex items-center gap-2">
                    <Globe size={16} style={{ color: DS.cyan }} />
                    <span style={{ color: DS.text, fontFamily: DS.mono, fontWeight: 700, fontSize: 14 }}>
                      {d.extension}
                    </span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ color: DS.text, fontFamily: DS.mono, fontSize: 13 }}>
                    {fmtVND(d.registrationPrice)}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ color: DS.text4, fontFamily: DS.mono, fontSize: 13 }}>
                    {fmtVND(d.renewalPrice)}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ color: DS.text3, fontSize: 13 }}>{d.periodVi}</span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ color: DS.text4, fontSize: 12, maxWidth: 160, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.noteVi ?? d.note ?? "—"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ color: DS.text4, fontFamily: DS.mono, fontSize: 12 }}>{d.sortOrder}</span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <button onClick={() => toggle.mutate(d)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    {d.isActive
                      ? <ToggleRight size={22} style={{ color: DS.green }} />
                      : <ToggleLeft size={22} style={{ color: DS.text4 }} />}
                  </button>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(d)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6 }}
                      className="hover:bg-white/10 transition-colors">
                      <Edit3 size={15} style={{ color: DS.pink }} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Xóa ${d.extension}?`)) remove.mutate(d.id); }}
                      disabled={remove.isPending}
                      style={{ background: "none", border: "none", cursor: remove.isPending ? "not-allowed" : "pointer", padding: 4, borderRadius: 6, opacity: remove.isPending ? 0.5 : 1 }}
                      className="hover:bg-white/10 transition-colors"
                    >
                      <Trash2 size={15} style={{ color: DS.red }} />
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
            style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={e => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ width: "100%", maxWidth: 520, background: DS.bgCard, borderRadius: 20, border: `1px solid ${DS.border}`, overflow: "hidden" }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${DS.border}` }}>
                <div>
                  <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 16, fontWeight: 900 }}>
                    {modal.edit ? "Sửa TLD" : "Thêm TLD mới"}
                  </h2>
                  <p style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>
                    {modal.edit ? `Chỉnh sửa ${modal.edit.extension}` : "Thêm đuôi tên miền mới"}
                  </p>
                </div>
                <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <X size={18} style={{ color: DS.text4 }} />
                </button>
              </div>

              {/* Form */}
              <div className="px-6 py-5 space-y-4">
                {/* Extension */}
                <div>
                  <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                    TLD (đuôi) <span style={{ color: DS.pink }}>*</span>
                  </label>
                  <input
                    value={form.extension}
                    onChange={e => setForm(f => ({ ...f, extension: e.target.value }))}
                    placeholder=".vn, .com, .com.vn..."
                    style={{
                      width: "100%", padding: "10px 14px",
                      background: "rgba(15,23,42,0.6)", border: `1px solid ${errors.extension ? DS.red : DS.border}`,
                      borderRadius: 10, color: DS.text, fontSize: 14,
                    }}
                  />
                  {errors.extension && <p style={{ color: DS.red, fontSize: 11, marginTop: 4 }}>{errors.extension}</p>}
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Giá đăng ký (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={form.registrationPrice}
                      onChange={e => setForm(f => ({ ...f, registrationPrice: Number(e.target.value) }))}
                      style={{
                        width: "100%", padding: "10px 14px",
                        background: "rgba(15,23,42,0.6)", border: `1px solid ${errors.registrationPrice ? DS.red : DS.border}`,
                        borderRadius: 10, color: DS.text, fontSize: 14,
                      }}
                    />
                    {errors.registrationPrice && <p style={{ color: DS.red, fontSize: 11, marginTop: 4 }}>{errors.registrationPrice}</p>}
                  </div>
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Giá gia hạn (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={form.renewalPrice}
                      onChange={e => setForm(f => ({ ...f, renewalPrice: Number(e.target.value) }))}
                      style={{
                        width: "100%", padding: "10px 14px",
                        background: "rgba(15,23,42,0.6)", border: `1px solid ${errors.renewalPrice ? DS.red : DS.border}`,
                        borderRadius: 10, color: DS.text, fontSize: 14,
                      }}
                    />
                    {errors.renewalPrice && <p style={{ color: DS.red, fontSize: 11, marginTop: 4 }}>{errors.renewalPrice}</p>}
                  </div>
                </div>

                {/* Period */}
                <div>
                  <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                    Thời hạn <span style={{ color: DS.pink }}>*</span>
                  </label>
                  <select
                    value={form.period}
                    onChange={e => {
                      const opt = PERIOD_OPTIONS.find(o => o.value === e.target.value);
                      setForm(f => ({ ...f, period: e.target.value, periodVi: opt?.labelVi ?? f.periodVi }));
                    }}
                    style={{
                      width: "100%", padding: "10px 14px",
                      background: "rgba(15,23,42,0.9)", border: `1px solid ${DS.border}`,
                      borderRadius: 10, color: DS.text, fontSize: 14,
                    }}
                  >
                    {PERIOD_OPTIONS.map(o => (
                      <option key={o.value} value={o.value} style={{ background: DS.bgCard }}>
                        {o.labelVi} ({o.labelEn})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Ghi chú (EN)
                    </label>
                    <input
                      value={form.note}
                      onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                      placeholder="Optional note"
                      style={{
                        width: "100%", padding: "10px 14px",
                        background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
                        borderRadius: 10, color: DS.text, fontSize: 14,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Ghi chú (VI)
                    </label>
                    <input
                      value={form.noteVi}
                      onChange={e => setForm(f => ({ ...f, noteVi: e.target.value }))}
                      placeholder="Ghi chú tùy chọn"
                      style={{
                        width: "100%", padding: "10px 14px",
                        background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
                        borderRadius: 10, color: DS.text, fontSize: 14,
                      }}
                    />
                  </div>
                </div>

                {/* Sort order */}
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

                {/* Active */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    {form.isActive
                      ? <ToggleRight size={22} style={{ color: DS.green }} />
                      : <ToggleLeft size={22} style={{ color: DS.text4 }} />}
                  </button>
                  <span style={{ color: DS.text3, fontSize: 13 }}>
                    {form.isActive ? "Đang bật" : "Đã tắt"}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${DS.border}` }}>
                <button onClick={closeModal}
                  style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${DS.border}`, background: "rgba(255,255,255,0.04)", color: DS.text3, fontSize: 14, cursor: "pointer" }}>
                  Hủy
                </button>
                <button onClick={handleSave}
                  disabled={save.isPending}
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

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
          borderRadius: 12, background: DS.bgCard,
          border: `1px solid ${toast.type === "success" ? DS.green : DS.red}50`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          maxWidth: 320,
        }}>
          <span style={{ color: toast.type === "success" ? DS.green : DS.red, fontSize: 16 }}>{toast.type === "success" ? "✓" : "✗"}</span>
          <span style={{ color: DS.text, fontSize: 13 }}>{toast.message}</span>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: DS.text4 }}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
