"use client";

/**
 * Custom Features Admin Page — LOOP Solutions
 * Route: /admin/custom-features
 * CRUD for ServiceAttribute with tier = "custom" (custom web features)
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

type CustomFeature = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  nameEn?: string | null;
  description?: string | null;
  descriptionVi?: string | null;
  category: string;
  categoryVi: string;
  price: number;
  isRequired: boolean;
  includedInBase: boolean;
  isUpgradeable: boolean;
  sortOrder: number;
  isActive: boolean;
  xpPoints: number;
};

function CustomFeatureFormModal({
  feature,
  onClose,
  onSuccess,
}: {
  feature?: CustomFeature | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = Boolean(feature?.id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nameVi: feature?.nameVi ?? "",
    nameEn: feature?.nameEn ?? "",
    slug: feature?.slug ?? "",
    categoryVi: feature?.categoryVi ?? "Tùy chỉnh",
    descriptionVi: feature?.descriptionVi ?? "",
    price: feature?.price ?? 0,
    xpPoints: feature?.xpPoints ?? 0,
    isRequired: feature?.isRequired ?? false,
    includedInBase: feature?.includedInBase ?? false,
    isUpgradeable: feature?.isUpgradeable ?? false,
    sortOrder: feature?.sortOrder ?? 0,
    isActive: feature?.isActive ?? true,
  });

  const inpStyle: React.CSSProperties = {
    width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
    borderRadius: 8, padding: "9px 12px", color: DS.text, fontSize: 13,
    outline: "none", fontFamily: DS.body, boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = { color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameVi.trim()) return setError("Tên tính năng (VN) bắt buộc");
    if (!form.slug.trim()) return setError("Slug bắt buộc");
    setSaving(true); setError("");
    try {
      const payload = {
        name: form.nameVi,
        nameVi: form.nameVi,
        nameEn: form.nameEn || undefined,
        slug: form.slug,
        category: form.categoryVi,
        categoryVi: form.categoryVi,
        descriptionVi: form.descriptionVi || undefined,
        price: Number(form.price) || 0,
        xpPoints: Number(form.xpPoints) || 0,
        tier: "custom",
        includedInBase: form.includedInBase,
        isUpgradeable: form.isUpgradeable,
        isRequired: form.isRequired,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (isEdit) {
        await adminApi.put(`/api/admin/custom-features/${feature!.id}`, payload);
      } else {
        await adminApi.post("/api/admin/custom-features", payload);
      }
      onSuccess(); onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally { setSaving(false); }
  };

  // Auto-generate slug from nameVi
  const handleNameViChange = (val: string) => {
    setForm(f => ({
      ...f,
      nameVi: val,
      slug: f.slug || val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, margin: 0 }}>
                {isEdit ? "Chỉnh sửa tính năng" : "Thêm tính năng tùy chỉnh"}
              </h3>
              <p style={{ color: DS.pink, fontSize: 11, margin: "4px 0 0", fontFamily: DS.mono }}>
                tier: custom · Dùng cho gói "Theo Yêu Cầu"
              </p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
          </div>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12, marginBottom: 16 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <label style={labelStyle}>Tên (VN) *</label>
                <input style={inpStyle} value={form.nameVi} onChange={e => handleNameViChange(e.target.value)} placeholder="VD: Code tùy chỉnh" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <label style={labelStyle}>Tên (EN)</label>
                <input style={inpStyle} value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} placeholder="VD: Custom Development" />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <label style={labelStyle}>Slug *</label>
              <input style={inpStyle} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="VD: custom-code" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <label style={labelStyle}>Danh mục</label>
                <input style={inpStyle} value={form.categoryVi} onChange={e => setForm(f => ({ ...f, categoryVi: e.target.value }))} placeholder="VD: Tùy chỉnh" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <label style={labelStyle}>Giá (VND)</label>
                <input style={inpStyle} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="0 = Miễn phí" />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <label style={labelStyle}>Mô tả</label>
              <textarea style={{ ...inpStyle, minHeight: 80, resize: "vertical" as const }} value={form.descriptionVi} onChange={e => setForm(f => ({ ...f, descriptionVi: e.target.value }))} placeholder="Mô tả tính năng..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <label style={labelStyle}>Sort Order</label>
                <input style={inpStyle} type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <label style={labelStyle}>XP Points</label>
                <input style={inpStyle} type="number" value={form.xpPoints} onChange={e => setForm(f => ({ ...f, xpPoints: Number(e.target.value) }))} />
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 16 }}>
              {[
                { key: "includedInBase", label: "Bao gồm trong base price" },
                { key: "isUpgradeable", label: "Là tính năng nâng cấp" },
                { key: "isRequired", label: "Bắt buộc chọn" },
                { key: "isActive", label: "Kích hoạt" },
              ].map(opt => (
                <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(form[opt.key as keyof typeof form])}
                    onChange={e => setForm(f => ({ ...f, [opt.key]: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: DS.pink }}
                  />
                  <span style={{ color: DS.text2, fontSize: 12 }}>{opt.label}</span>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button type="button" onClick={onClose} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${DS.border}`, borderRadius: 8, color: DS.text2, cursor: "pointer", fontSize: 13 }}>
                Hủy
              </button>
              <button type="submit" disabled={saving} style={{ padding: "8px 20px", background: saving ? "rgba(236,72,153,0.5)" : DS.pink, border: "none", borderRadius: 8, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
                {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm tính năng"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function CustomFeaturesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingFeature, setEditingFeature] = useState<CustomFeature | null>(null);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<CustomFeature | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "custom-features"],
    queryFn: async () => {
      const res = (await adminApi.get("/api/admin/custom-features")) as { data: CustomFeature[] };
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.delete(`/api/admin/custom-features/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "custom-features"] });
      setConfirmDelete(null);
    },
    onError: (err: unknown) => {
      alert(err instanceof Error ? err.message : "Xóa thất bại");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await adminApi.put(`/api/admin/custom-features/${id}`, { isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "custom-features"] }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Cập nhật thất bại"); },
  });

  const features = (data ?? []).filter(f =>
    (showInactive || f.isActive) &&
    (!search || f.nameVi.toLowerCase().includes(search.toLowerCase()) || f.nameEn?.toLowerCase().includes(search.toLowerCase()) || f.slug.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: "0 24px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ color: DS.text, fontWeight: 700, fontSize: 20, margin: 0 }}>Tính năng tùy chỉnh</h2>
          <p style={{ color: DS.text4, fontSize: 12, margin: "4px 0 0" }}>CRUD cho ServiceAttribute tier="custom" · Dùng trong gói "Theo Yêu Cầu"</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => refetch()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "transparent", border: `1px solid ${DS.border}`, borderRadius: 8, color: DS.text2, cursor: "pointer", fontSize: 12 }}>
            Refresh
          </button>
          <button
            onClick={() => { setEditingFeature(null); setShowForm(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: DS.pink, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            <Plus size={14} />
            Thêm tính năng
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
          <input
            style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px 8px 32px", color: DS.text, fontSize: 13, fontFamily: DS.body, boxSizing: "border-box" as const }}
            placeholder="Tìm kiếm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: DS.text2, fontSize: 12 }}>
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ accentColor: DS.pink }} />
          Hiện đã ẩn
        </label>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Tổng", value: data?.length ?? 0, color: DS.pink },
          { label: "Đang hoạt động", value: data?.filter(f => f.isActive).length ?? 0, color: "#22C55E" },
          { label: "Bắt buộc", value: data?.filter(f => f.isRequired).length ?? 0, color: DS.cosmicPurple },
          { label: "Miễn phí", value: data?.filter(f => f.price === 0).length ?? 0, color: DS.cosmicCyan },
        ].map(stat => (
          <div key={stat.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ color: stat.color, fontWeight: 700, fontSize: 20, fontFamily: DS.mono }}>{stat.value}</span>
            <span style={{ color: DS.text4, fontSize: 11 }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.pink}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : features.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>
            Chưa có tính năng tùy chỉnh nào. Nhấn "Thêm tính năng" để tạo.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                  {["Tên (VN)", "Tên (EN)", "Slug", "Danh mục", "Giá", "XP", "Bắt buộc", "Base", "Nâng cấp", "Trạng thái", "Thao tác"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map(f => (
                  <tr key={f.id} style={{ borderBottom: `1px solid ${DS.border}`, opacity: f.isActive ? 1 : 0.5 }}>
                    <td style={{ padding: "12px 16px", color: DS.text, fontSize: 13, fontWeight: 600 }}>{f.nameVi}</td>
                    <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{f.nameEn ?? "—"}</td>
                    <td style={{ padding: "12px 16px", color: DS.pink, fontSize: 11, fontFamily: DS.mono }}>{f.slug}</td>
                    <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{f.categoryVi}</td>
                    <td style={{ padding: "12px 16px", fontFamily: DS.mono, fontSize: 12, color: f.price === 0 ? DS.cosmicCyan : DS.gold }}>
                      {f.price === 0 ? "Miễn phí" : fmtVND(f.price)}
                    </td>
                    <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{f.xpPoints}</td>
                    <td style={{ padding: "12px 16px" }}>{f.isRequired && <span style={{ color: DS.cosmicPurple, fontSize: 14 }}>✓</span>}</td>
                    <td style={{ padding: "12px 16px" }}>{f.includedInBase && <span style={{ color: "#22C55E", fontSize: 14 }}>✓</span>}</td>
                    <td style={{ padding: "12px 16px" }}>{f.isUpgradeable && <span style={{ color: DS.cosmicBlue, fontSize: 14 }}>↗</span>}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => toggleMutation.mutate({ id: f.id, isActive: !f.isActive })}
                        style={{
                          background: f.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                          color: f.isActive ? "#22C55E" : "#EF4444",
                          border: `1px solid ${f.isActive ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                          borderRadius: 9999, padding: "2px 10px", fontSize: 10, fontFamily: DS.mono, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        {f.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td style={{ padding: "12px 16px", display: "flex", gap: 6 }}>
                      <button
                        onClick={() => { setEditingFeature(f); setShowForm(true); }}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, color: DS.blue, cursor: "pointer", fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}
                      >
                        <Pencil size={11} />
                        Sửa
                      </button>
                      <button
                        onClick={() => setConfirmDelete(f)}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#EF4444", cursor: "pointer", fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}
                      >
                        <Trash2 size={11} />
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <CustomFeatureFormModal
            feature={editingFeature ?? null}
            onClose={() => { setShowForm(false); setEditingFeature(null); }}
            onSuccess={() => qc.invalidateQueries({ queryKey: ["admin", "custom-features"] })}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmDelete(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, background: "rgba(239,68,68,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={20} color="#EF4444" />
                </div>
                <div>
                  <h3 style={{ color: DS.text, fontWeight: 700, margin: 0 }}>Xóa tính năng</h3>
                  <p style={{ color: DS.text4, fontSize: 12, margin: "4px 0 0" }}>Hành động này không thể hoàn tác</p>
                </div>
              </div>
              <p style={{ color: DS.text2, fontSize: 13, marginBottom: 20 }}>
                Xóa <strong style={{ color: DS.text }}>{confirmDelete.nameVi}</strong> ({confirmDelete.slug})?
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setConfirmDelete(null)} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${DS.border}`, borderRadius: 8, color: DS.text2, cursor: "pointer", fontSize: 13 }}>Hủy</button>
                <button
                  onClick={() => deleteMutation.mutate(confirmDelete.id)}
                  style={{ padding: "8px 16px", background: "#EF4444", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  Xóa
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
