"use client";

/**
 * Infrastructure Admin Page — LOOP Solutions
 * Route: /admin/infrastructure
 * Manages InfrastructureTiers via /api/admin/pricing/infra-tiers
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Plus, Edit3, X, Trash2, Loader2, RefreshCw,
  ToggleRight, ToggleLeft, Search, Server,
} from "lucide-react";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

type InfraTier = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  monthlyCost: number;
  setupCost: number;
  description?: string | null;
  isActive?: boolean;
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

export default function InfrastructurePage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; edit?: InfraTier }>({ open: false });
  const [form, setForm] = useState({
    slug: "", name: "", nameVi: "",
    monthlyCost: 0, setupCost: 0, description: "",
    isActive: true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery<{ data: InfraTier[] }>({
    queryKey: ["admin", "pricing", "infra-tiers"],
    queryFn: () => adminApi.get("/api/admin/pricing/infra-tiers"),
  });

  const items = (data?.data ?? []).filter(t => {
    if (search) {
      const s = search.toLowerCase();
      return (t.name?.toLowerCase().includes(s) || t.nameVi?.toLowerCase().includes(s) || t.slug?.toLowerCase().includes(s));
    }
    return true;
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form & { id?: string }) => {
      if (modal.edit) {
        await adminApi.put("/api/admin/pricing/infra-tiers", { ...payload, id: modal.edit.id });
      } else {
        await adminApi.post("/api/admin/pricing/infra-tiers", { ...payload, isActive: true });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "pricing", "infra-tiers"] });
      setModal({ open: false });
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
      setSaving(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.delete(`/api/admin/pricing/infra-tiers?id=${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pricing", "infra-tiers"] }),
    onError: (err: unknown) => setError(err instanceof Error ? err.message : "Xóa thất bại"),
  });

  const openCreate = () => {
    setForm({ slug: "", name: "", nameVi: "", monthlyCost: 0, setupCost: 0, description: "", isActive: true });
    setError("");
    setModal({ open: true });
  };

  const openEdit = (t: InfraTier) => {
    setForm({
      slug: t.slug, name: t.name ?? "", nameVi: t.nameVi ?? "",
      monthlyCost: t.monthlyCost, setupCost: t.setupCost, description: t.description ?? "",
      isActive: t.isActive ?? true,
    });
    setError("");
    setModal({ open: true, edit: t });
  };

  const handleSave = () => {
    if (!form.nameVi.trim()) { setError("Tên tiếng Việt là bắt buộc"); return; }
    if (!form.slug.trim()) { setError("Slug là bắt buộc"); return; }
    if (form.monthlyCost < 0) { setError("Chi phí phải >= 0"); return; }
    setSaving(true);
    saveMutation.mutate(form);
  };

  const inpStyle: React.CSSProperties = {
    width: "100%", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
    borderRadius: 10, padding: "10px 14px", color: DS.text, fontSize: 14, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ padding: "1.5rem", minHeight: "100vh", background: DS.bgCosmic }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900 }}>
            Quản lý Hạ tầng
          </h1>
          <p style={{ color: DS.text4, fontSize: 13, marginTop: 4 }}>
            CRUD gói hạ tầng (Hosting/VPS/DevOps) dùng trong báo giá
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "pricing", "infra-tiers"] })}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, color: DS.text3 }}
          >
            <RefreshCw size={14} /> Làm mới
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: GRD.primary, color: "#fff" }}
          >
            <Plus size={16} /> Thêm gói hạ tầng
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: DS.text4 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm gói hạ tầng..."
            style={{
              width: "100%", paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
              background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
              borderRadius: 10, color: DS.text, fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} style={{ color: DS.text4, animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map(t => (
            <div key={t.id} style={{
              background: DS.bgCard,
              border: `1px solid ${DS.border}`,
              borderRadius: 16, padding: "20px 24px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                  <Server size={16} style={{ color: DS.blue }} />
                  <span style={{ color: DS.text, fontWeight: 700, fontSize: 15 }}>{t.nameVi || t.name}</span>
                  <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, background: DS.bg, borderRadius: 4, padding: "1px 8px" }}>
                    {t.slug}
                  </span>
                </div>
                {t.description && (
                  <p style={{ color: DS.text3, fontSize: 12, margin: 0 }}>{t.description}</p>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: DS.blue, fontSize: 18, fontFamily: DS.mono, fontWeight: 700 }}>
                    {fmtVND(t.monthlyCost)}
                    <span style={{ fontSize: 11, color: DS.text4, fontWeight: 400 }}> / tháng</span>
                  </div>
                  {t.setupCost > 0 && (
                    <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>
                      Setup: {fmtVND(t.setupCost)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(t)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8 }}
                    className="hover:bg-white/10 transition-colors">
                    <Edit3 size={15} style={{ color: DS.pink }} />
                  </button>
                  <button onClick={() => { if (confirm(`Xóa gói "${t.nameVi || t.name}"?`)) deleteMutation.mutate(t.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8 }}>
                    <Trash2 size={15} style={{ color: DS.text4 }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontFamily: DS.mono }}>
              Chưa có gói hạ tầng nào
            </div>
          )}
        </div>
      )}

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
              style={{ width: "100%", maxWidth: 520, background: DS.bgCard, borderRadius: 20, border: `1px solid ${DS.border}`, overflow: "hidden" }}
            >
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${DS.border}` }}>
                <div>
                  <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 16, fontWeight: 900 }}>
                    {modal.edit ? `Sửa gói hạ tầng` : "Thêm gói hạ tầng mới"}
                  </h2>
                  <p style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>
                    Quản lý gói hosting/VPS dùng trong wizard báo giá
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
                      Tên (VI) <span style={{ color: DS.pink }}>*</span>
                    </label>
                    <input value={form.nameVi}
                      onChange={e => setForm(f => ({ ...f, nameVi: e.target.value, name: e.target.value }))}
                      placeholder="VD: VPS Starter 2GB"
                      style={inpStyle} />
                  </div>
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Slug <span style={{ color: DS.pink }}>*</span>
                    </label>
                    <input value={form.slug}
                      onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                      placeholder="vps-starter-2gb"
                      style={inpStyle} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Chi phí / tháng (VNĐ)
                    </label>
                    <input type="number" min={0}
                      value={form.monthlyCost}
                      onChange={e => setForm(f => ({ ...f, monthlyCost: Number(e.target.value) }))}
                      style={inpStyle} />
                  </div>
                  <div>
                    <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                      Chi phí setup (VNĐ)
                    </label>
                    <input type="number" min={0}
                      value={form.setupCost}
                      onChange={e => setForm(f => ({ ...f, setupCost: Number(e.target.value) }))}
                      style={inpStyle} />
                  </div>
                </div>

                <div>
                  <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                    Mô tả
                  </label>
                  <input value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Mô tả chi tiết về gói hạ tầng này"
                    style={inpStyle} />
                </div>

                <div className="flex items-center gap-3">
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

                {error && <p style={{ color: DS.red, fontSize: 13 }}>{error}</p>}
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${DS.border}` }}>
                <button onClick={() => setModal({ open: false })}
                  style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${DS.border}`, background: "rgba(255,255,255,0.04)", color: DS.text3, fontSize: 14, cursor: "pointer" }}>
                  Hủy
                </button>
                <button onClick={handleSave}
                  disabled={saving || saveMutation.isPending}
                  style={{
                    padding: "10px 24px", borderRadius: 10, border: "none",
                    background: saving ? DS.text4 : GRD.primary, color: "#fff", fontSize: 14, fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                  }}>
                  {saving ? "Đang lưu..." : (modal.edit ? "Lưu thay đổi" : "Tạo mới")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
