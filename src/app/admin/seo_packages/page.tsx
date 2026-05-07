"use client";

/**
 * SEO Packages Admin Page — LOOP Solutions
 * Route: /admin/seo_packages
 * Manages SEO pricing tiers via /api/admin/seo-tiers
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Plus, Edit3, X, Trash2, Loader2, RefreshCw,
  ToggleRight, ToggleLeft, Search, Zap, Layers,
} from "lucide-react";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

type SeoTier = {
  id: string;
  serviceKey: string;
  level: number;
  name: string;
  nameEn?: string | null;
  nameVi?: string | null;
  shortDesc?: string | null;
  shortDescEn?: string | null;
  basePrice: number;
  marketPrice?: number | null;
  lpReward: number;
  sortOrder: number;
  isActive: boolean;
};

const TIER_COLORS: Record<number, string> = {
  0: "#22C55E",
  1: "#94A3B8",
  2: "#4F7DF3",
  3: "#F59E0B",
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
    >
      {checked
        ? <ToggleRight size={22} style={{ color: DS.green }} />
        : <ToggleLeft size={22} style={{ color: DS.text4 }} />}
    </button>
  );
}

export default function SeoPackagesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showActive, setShowActive] = useState<boolean | null>(null);
  const [modal, setModal] = useState<{ open: boolean; edit?: SeoTier }>({ open: false });
  const [form, setForm] = useState<{
    level: number; nameVi: string; nameEn: string; shortDesc: string; shortDescEn: string;
    basePrice: string; marketPrice: string; lpReward: string; sortOrder: number; isActive: boolean;
  }>({
    level: 1, nameVi: "", nameEn: "", shortDesc: "", shortDescEn: "",
    basePrice: "900000", marketPrice: "1200000", lpReward: "50", sortOrder: 1, isActive: true,
  });
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery<{ data: SeoTier[] }>({
    queryKey: ["admin", "seo-tiers"],
    queryFn: () => adminApi.get("/api/admin/seo-tiers"),
  });

  const items = (data?.data ?? []).filter(t => {
    if (search) {
      const s = search.toLowerCase();
      if (!(t.name?.toLowerCase().includes(s) || t.nameVi?.toLowerCase().includes(s))) return false;
    }
    if (showActive === true && !t.isActive) return false;
    if (showActive === false && t.isActive) return false;
    return true;
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form & { id?: string }) => {
      // Map form.nameVi → API name field; convert string price fields to numbers
      const { nameVi, basePrice, marketPrice, lpReward, ...rest } = payload;
      const apiPayload = {
        ...rest,
        name: nameVi,
        basePrice: Number(basePrice) || 0,
        marketPrice: Number(marketPrice) || 0,
        lpReward: Number(lpReward) || 0,
      };

      if (modal.edit) {
        await adminApi.put(`/api/admin/seo-tiers/${modal.edit.id}`, apiPayload);
      } else {
        await adminApi.post("/api/admin/seo-tiers", apiPayload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "seo-tiers"] });
      setModal({ open: false });
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (t: SeoTier) => {
      await adminApi.put(`/api/admin/seo-tiers/${t.id}`, { ...t, isActive: !t.isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "seo-tiers"] }),
    onError: (err: unknown) => setError(err instanceof Error ? err.message : "Cập nhật trạng thái thất bại"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.delete(`/api/admin/seo-tiers/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "seo-tiers"] });
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : "Xóa thất bại"),
  });

  const openCreate = () => {
    setForm({ level: 1, nameVi: "", nameEn: "", shortDesc: "", shortDescEn: "", basePrice: "900000", marketPrice: "1200000", lpReward: "50", sortOrder: 1, isActive: true });
    setError("");
    setModal({ open: true });
  };

  const openEdit = (t: SeoTier) => {
    setForm({
      level: t.level, nameVi: t.nameVi ?? t.name ?? "", nameEn: t.nameEn ?? "", shortDesc: t.shortDesc ?? "", shortDescEn: t.shortDescEn ?? "",
      basePrice: String(t.basePrice), marketPrice: String(t.marketPrice ?? 0), lpReward: String(t.lpReward), sortOrder: t.sortOrder, isActive: t.isActive,
    });
    setError("");
    setModal({ open: true, edit: t });
  };

  const handleSave = () => {
    if (!form.nameVi.trim()) { setError("Tên gói là bắt buộc"); return; }
    if (Number(form.basePrice) < 0) { setError("Giá không được âm"); return; }
    saveMutation.mutate(form);
  };

  const inpStyle: React.CSSProperties = {
    width: "100%", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
    borderRadius: 10, padding: "10px 14px", color: DS.text, fontSize: 14, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ padding: "1.5rem", minHeight: "100vh", background: DS.bgCosmic }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900 }}>
            Quản lý Gói SEO
          </h1>
          <p style={{ color: DS.text4, fontSize: 13, marginTop: 4 }}>
            CRUD gói SEO: Cơ bản, Nâng cao, Chuyên nghiệp
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              qc.invalidateQueries({ queryKey: ["admin", "seo-tiers"] });
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm group whitespace-nowrap"
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, color: DS.text3 }}
          >
            <RefreshCw size={14} className="group-active:rotate-180 transition-transform duration-500" /> Làm mới
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap"
            style={{ background: GRD.primary, color: "#fff" }}
          >
            <Plus size={16} /> Thêm gói SEO
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: DS.text4 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm gói SEO..."
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
      <div style={{ borderRadius: 16, overflowX: "auto", border: `1px solid ${DS.border}`, background: DS.bgCard }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              {["Level", "Tên gói", "Giá tháng", "Giá thị trường", "LP thưởng", "Thứ tự", "Trạng thái", "Hành động"].map(h => (
                <th key={h} style={{ padding: "12px 16px", color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", textAlign: "left", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: DS.text4 }}>Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: DS.text4 }}>Chưa có dữ liệu</td></tr>
            ) : items.map(t => (
              <tr key={t.id} style={{ borderTop: `1px solid ${DS.border}` }}>
                <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                  <span style={{
                    background: `${TIER_COLORS[t.level] ?? DS.blue}22`,
                    color: TIER_COLORS[t.level] ?? DS.blue,
                    border: `1px solid ${TIER_COLORS[t.level] ?? DS.blue}44`,
                    borderRadius: 6, padding: "2px 10px", fontSize: 12, fontFamily: DS.mono, fontWeight: 700,
                  }}>
                    Lv.{t.level}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                  <div>
                    <div style={{ color: DS.text, fontWeight: 600, fontSize: 14 }}>{t.nameVi || t.name}</div>
                    {t.shortDesc && <div style={{ color: DS.text4, fontSize: 11 }}>{t.shortDesc}</div>}
                  </div>
                </td>
                <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                  <span style={{ color: DS.green, fontFamily: DS.mono, fontWeight: 700, fontSize: 13 }}>
                    {fmtVND(t.basePrice)}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                  <span style={{ color: DS.text4, fontFamily: DS.mono, fontSize: 12 }}>
                    {(t.marketPrice !== null && t.marketPrice !== undefined) ? fmtVND(t.marketPrice) : "—"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                  <span style={{ color: DS.amber, fontFamily: DS.mono, fontSize: 13 }}>
                    {(t.lpReward !== null && t.lpReward !== undefined) ? `${t.lpReward} LP` : "—"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                  <span style={{ color: DS.text4, fontFamily: DS.mono, fontSize: 12 }}>{t.sortOrder}</span>
                </td>
                <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                  <Toggle checked={t.isActive} onChange={() => toggleMutation.mutate(t)} />
                </td>
                <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(t)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6 }}
                      className="hover:bg-white/10 transition-colors">
                      <Edit3 size={15} style={{ color: DS.pink }} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Xóa gói "${t.nameVi || t.name}"?`)) deleteMutation.mutate(t.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6 }}
                      className="hover:bg-white/10 transition-colors"
                    >
                      <Trash2 size={15} style={{ color: DS.text4 }} />
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
            onClick={e => e.target === e.currentTarget && setModal({ open: false })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ width: "100%", maxWidth: 560, background: DS.bgCard, borderRadius: 20, border: `1px solid ${DS.border}`, overflow: "hidden" }}
            >
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${DS.border}` }}>
                <div>
                  <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 16, fontWeight: 900 }}>
                    {modal.edit ? `Sửa gói SEO — ${modal.edit.name}` : "Thêm gói SEO mới"}
                  </h2>
                  <p style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>
                    {modal.edit ? `Chỉnh sửa gói SEO level ${modal.edit.level}` : "Thêm gói SEO mới vào hệ thống"}
                  </p>
                </div>
                <button onClick={() => setModal({ open: false })} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <X size={18} style={{ color: DS.text4 }} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Level *
                    </label>
                    <input type="number" min={0} max={10}
                      value={form.level}
                      onChange={e => setForm(f => ({ ...f, level: Number(e.target.value) }))}
                      style={inpStyle} />
                  </div>
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Thứ tự
                    </label>
                    <input type="number" min={-99}
                      value={form.sortOrder}
                      onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                      style={inpStyle} />
                  </div>
                </div>

                <div>
                  <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                    Tên gói (VI) <span style={{ color: DS.pink }}>*</span>
                  </label>
                  <input value={form.nameVi}
                    onChange={e => setForm(f => ({ ...f, nameVi: e.target.value }))}
                    placeholder="VD: SEO Cơ Bản"
                    style={inpStyle} />
                </div>

                <div>
                  <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                    Tên gói (EN)
                  </label>
                  <input value={form.nameEn}
                    onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))}
                    placeholder="Basic SEO"
                    style={inpStyle} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Giá / tháng (VNĐ) <span style={{ color: DS.pink }}>*</span>
                    </label>
                    <input type="text"
                      value={form.basePrice}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9-]/g, "");
                        setForm(f => ({ ...f, basePrice: val }));
                      }}
                      style={inpStyle} />
                  </div>
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Giá thị trường (VNĐ)
                    </label>
                    <input type="text"
                      value={form.marketPrice}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9-]/g, "");
                        setForm(f => ({ ...f, marketPrice: val }));
                      }}
                      style={inpStyle} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      LP thưởng
                    </label>
                    <input type="text"
                      value={form.lpReward}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9-]/g, "");
                        setForm(f => ({ ...f, lpReward: val }));
                      }}
                      style={inpStyle} />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      {form.isActive
                        ? <ToggleRight size={22} style={{ color: DS.green }} />
                        : <ToggleLeft size={22} style={{ color: DS.text4 }} />}
                    </button>
                    <span style={{ color: DS.text3, fontSize: 13 }}>
                      {form.isActive ? "Đang bật" : "Đã tắt"}
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                    Mô tả ngắn (VI)
                  </label>
                  <input value={form.shortDesc}
                    onChange={e => setForm(f => ({ ...f, shortDesc: e.target.value }))}
                    placeholder="Mô tả ngắn về gói SEO này"
                    style={inpStyle} />
                </div>

                <div>
                  <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                    Mô tả ngắn (EN)
                  </label>
                  <input value={form.shortDescEn}
                    onChange={e => setForm(f => ({ ...f, shortDescEn: e.target.value }))}
                    placeholder="Short description"
                    style={inpStyle} />
                </div>

                {error && <p style={{ color: DS.red, fontSize: 13 }}>{error}</p>}
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${DS.border}` }}>
                <button onClick={() => setModal({ open: false })}
                  style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${DS.border}`, background: "rgba(255,255,255,0.04)", color: DS.text3, fontSize: 14, cursor: "pointer" }}>
                  Hủy
                </button>
                <button onClick={handleSave}
                  disabled={saveMutation.isPending}
                  style={{
                    padding: "10px 24px", borderRadius: 10, border: "none",
                    background: saveMutation.isPending ? DS.text4 : GRD.primary, color: "#fff", fontSize: 14, fontWeight: 600,
                    cursor: saveMutation.isPending ? "not-allowed" : "pointer",
                    opacity: saveMutation.isPending ? 0.6 : 1,
                  }}>
                  {saveMutation.isPending ? "Đang lưu..." : (modal.edit ? "Lưu thay đổi" : "Tạo mới")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
