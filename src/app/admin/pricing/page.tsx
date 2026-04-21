"use client";

/**
 * Pricing Admin Page — LOOP Solutions
 * Route: /admin/pricing
 * Wire: /api/admin/pricing/settings + features + infra-tiers + packages + addons + hosting-plans
 *
 * 5 tabs:
 *   1. Settings     — Base price, XP/LP rates, discount caps
 *   2. Features     — ServiceAttribute list + toggle + delete
 *   3. Infra Tiers  — InfrastructureTier list (read-only)
 *   4. Packages     — ServicePackage list + toggle (read-only create/edit)
 *   5. Add-ons      — AddonService list + toggle + delete
 */

import { AcknowledgmentsTab } from "./acknowledgments/AcknowledgmentsTab";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import {
  Settings, Layers, Server, Package as PackageIcon, PlusCircle,
  Save, Trash2, RefreshCw, Loader2, Edit2, X, Globe, CheckSquare, HardDrive,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────────

type PricingSetting = {
  key: string;
  value: string;
  group?: string;
  type?: string;
};

type Feature = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  nameEn?: string | null;
  nameJa?: string | null;
  nameKo?: string | null;
  nameZh?: string | null;
  description?: string | null;
  descriptionVi?: string | null;
  category: string;
  categoryVi: string;
  categoryEn?: string | null;
  price: number;
  isRequired: boolean;
  isActive: boolean;
  tier: string;
  sortOrder: number;
  xpPoints: number;
  parentId?: string | null;
  includedInBase: boolean;
  isUpgradeable: boolean;
  parent?: { id: string; name: string; nameVi: string } | null;
  children?: { id: string; name: string; nameVi: string; tier: string; isUpgradeable: boolean }[];
};

type InfraTier = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  monthlyCost: number;
  setupCost: number;
  description?: string;
};

type Package = {
  id: string;
  slug: string;
  title: string;
  type: string;
  price: number | null;
  priceText?: string;
  features: string[];
  isSubscription: boolean;
  sortOrder: number;
  isActive: boolean;
};

type Addon = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  type: string;
  price: number;
  billingPeriod?: string;
  isActive: boolean;
  sortOrder: number;
};


// ── Hosting Plan ────────────────────────────────────────────────────────────────

type HostingPlan = {
 id: string;
 slug: string;
 name: string;
 nameVi: string;
 monthlyPrice: number;
 months: number;
 discountPct: number;
 features: string[];
 featuresVi: string[];
 highlighted: boolean;
 color: string;
 sortOrder: number;
 isActive: boolean;
};

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
};

// ── Tab Config ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "settings",     label: "Cài đặt",          icon: <Settings size={14} /> },
  { key: "features",      label: "Tính năng",         icon: <Layers size={14} /> },
  { key: "infra-tiers",   label: "Hạ tầng",           icon: <Server size={14} /> },
  { key: "packages",     label: "Gói dịch vụ",        icon: <PackageIcon size={14} /> },
  { key: "addons",       label: "Dịch vụ thêm",       icon: <PlusCircle size={14} /> },
 { key: "hosting", label: "Hosting", icon: <HardDrive size={14} /> },
 { key: "domain-prices", label: "Tên miền", icon: <Globe size={14} /> },
 { key: "acknowledgments", label: "Acknowledgments", icon: <CheckSquare size={14} /> },
];

const fmtVND = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);

// ── Toggle component ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange, size = 20 }: { checked: boolean; onChange: (v: boolean) => void; size?: number }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: size, borderRadius: size / 2, border: "none", cursor: "pointer",
        background: checked ? DS.green : DS.border,
        transition: "background 0.2s",
        position: "relative", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: checked ? 18 : 2,
        width: size - 4, height: size - 4, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

// ── Tab 1: Settings ───────────────────────────────────────────────────────────

function SettingsTab() {
  const _t = useAdminTranslations();
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data, isLoading, isFetching } = useQuery<{ data: PricingSetting[] }>({
    queryKey: ["admin", "pricing", "settings"],
    queryFn: () => adminApi.get("/api/admin/pricing/settings"),
  });

  const saveMutation = useMutation({
    mutationFn: async (settings: { key: string; value: string }[]) => {
      await adminApi.put("/api/admin/pricing/settings", { settings });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "pricing", "settings"] }); setToast({ message: "Lưu thành công", type: "success" }); },
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : "Lưu thất bại", type: "error" }); },
  });

  const settings: PricingSetting[] = data?.data ?? [];
  const [local, setLocal] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});

  const settingsWithDefaults = [
    { key: "custom_web_base_price", label: "Giá nền tảng web (VND)", default: "3000000", step: 100000, min: 0 },
    { key: "xp_per_level",         label: "XP mỗi level",            default: "100",     step: 10,   min: 0 },
    { key: "lp_rate",              label: "Tỷ giá LP (1K LP = X VND)", default: "500",   step: 100,  min: 0 },
    { key: "vnd_per_lp",           label: "VND mỗi LP",              default: "1000",   step: 100,  min: 0 },
    { key: "max_discount_percent", label: "Giảm giá tối đa (%)",       default: "20",     step: 1,    min: 0, max: 100 },
    { key: "lp_earn_per_million",  label: "LP nhận/mỗi triệu VND",    default: "50",     step: 5,    min: 0 },
    { key: "max_lp_per_order",     label: "LP tối đa/đơn",            default: "200000", step: 10000, min: 0 },
  ];

  const getVal = (key: string, def: string) => {
    if (dirty[key]) return local[key];
    const found = settings.find(s => s.key === key);
    return found?.value ?? def;
  };

  const handleChange = (key: string, value: string) => {
    setLocal(prev => ({ ...prev, [key]: value }));
    setDirty(prev => ({ ...prev, [key]: true }));
  };

  const handleSave = async () => {
    const updates = settingsWithDefaults
      .filter(s => dirty[s.key])
      .map(s => ({ key: s.key, value: local[s.key] ?? getVal(s.key, s.default) }));
    if (updates.length === 0) return;
    await saveMutation.mutateAsync(updates);
    setDirty({});
  };

  const hasChanges = Object.values(dirty).some(Boolean);

  return (
    <>
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h3 style={{ fontFamily: DS.heading, fontSize: 16, fontWeight: 700, color: DS.text, margin: "0 0 4px" }}>
            Cấu hình giá & tỷ giá
          </h3>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            Các thông số dùng trong công thức báo giá & LP economy
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {(isFetching && !isLoading) && <RefreshCw size={14} style={{ color: DS.text4, animation: "spin 1s linear infinite" }} />}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 20px",
              background: hasChanges ? DS.blue : DS.bgCard2,
              color: hasChanges ? "#fff" : DS.text4,
              borderRadius: 10, border: "none", cursor: hasChanges ? "pointer" : "not-allowed",
              fontFamily: DS.mono, fontSize: 12, fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            {saveMutation.isPending ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
            Lưu thay đổi
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} style={{ color: DS.text4, animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {settingsWithDefaults.map(s => (
            <div key={s.key} style={{ background: DS.bgCard, border: `1px solid ${dirty[s.key] ? DS.blue : DS.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>{s.label}</label>
                {dirty[s.key] && <span style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono }}>đã chỉnh sửa</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={getVal(s.key, s.default)}
                  onChange={e => handleChange(s.key, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: DS.bg,
                    border: `1px solid ${dirty[s.key] ? DS.blue : DS.border}`,
                    borderRadius: 8,
                    color: DS.text,
                    fontFamily: DS.mono,
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 4 }}>
                Hiện tại: {fmtVND(Number(getVal(s.key, s.default)))} VND
              </div>
            </div>
          ))}
        </div>
      )}
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

// ── Feature Form Modal ──────────────────────────────────────────────────────────

function FeatureFormModal({
  feature, allFeatures,
  onClose, onSuccess,
}: {
  feature?: Feature | null;
  allFeatures: Feature[];
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
    categoryVi: feature?.categoryVi ?? "",
    categoryEn: feature?.categoryEn ?? "",
    price: feature?.price ?? 0,
    xpPoints: feature?.xpPoints ?? 0,
    tier: feature?.tier ?? "basic",
    parentId: feature?.parentId ?? "",
    includedInBase: feature?.includedInBase ?? false,
    isUpgradeable: feature?.isUpgradeable ?? false,
    isRequired: feature?.isRequired ?? false,
    sortOrder: feature?.sortOrder ?? 0,
    isActive: feature?.isActive ?? true,
  });

  const inpStyle: React.CSSProperties = {
    width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
    borderRadius: 8, padding: "9px 12px", color: DS.text, fontSize: 13,
    outline: "none", fontFamily: DS.body, boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = { color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 };
  const fieldGap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 2 };

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
        categoryEn: form.categoryEn || undefined,
        price: Number(form.price) || 0,
        xpPoints: Number(form.xpPoints) || 0,
        tier: form.tier,
        parentId: form.parentId || null,
        includedInBase: form.includedInBase,
        isUpgradeable: form.isUpgradeable,
        isRequired: form.isRequired,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (isEdit) {
        await adminApi.put(`/api/admin/service-attributes/${feature!.id}`, payload);
      } else {
        await adminApi.post("/api/admin/service-attributes", payload);
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
                {isEdit ? "Chỉnh sửa tính năng" : "Thêm tính năng mới"}
              </h3>
              <p style={{ color: DS.text4, fontSize: 11, margin: "4px 0 0" }}>
                {form.includedInBase ? "Tính năng cơ bản (included in base price)" : form.isUpgradeable ? "Tính năng nâng cấp (upgrade)" : "Tính năng bổ sung"}
              </p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={fieldGap}>
                <label style={labelStyle}>Tên (Tiếng Việt) *</label>
                <input style={inpStyle} value={form.nameVi} onChange={e => handleNameViChange(e.target.value)} placeholder="VD: Blog & Content" />
              </div>
              <div style={fieldGap}>
                <label style={labelStyle}>Slug *</label>
                <input style={inpStyle} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="VD: blog-content" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={fieldGap}>
                <label style={labelStyle}>Tên (English)</label>
                <input style={inpStyle} value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} placeholder="Blog & Content Module" />
              </div>
              <div style={fieldGap}>
                <label style={labelStyle}>Danh mục (Tiếng Việt) *</label>
                <input style={inpStyle} value={form.categoryVi} onChange={e => setForm(f => ({ ...f, categoryVi: e.target.value }))} placeholder="VD: Nội dung" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div style={fieldGap}>
                <label style={labelStyle}>Giá (VND)</label>
                <input type="number" style={inpStyle} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="500000" />
              </div>
              <div style={fieldGap}>
                <label style={labelStyle}>XP Points</label>
                <input type="number" style={inpStyle} value={form.xpPoints} onChange={e => setForm(f => ({ ...f, xpPoints: Number(e.target.value) }))} placeholder="50" />
              </div>
              <div style={fieldGap}>
                <label style={labelStyle}>Sort Order</label>
                <input type="number" style={inpStyle} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
              </div>
            </div>

            <div style={fieldGap}>
              <label style={labelStyle}>Parent Feature (nâng cấp từ)</label>
              <select style={{ ...inpStyle, cursor: "pointer" }} value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
                <option value="">— Không có (tính năng độc lập) —</option>
                {allFeatures.filter(f => !f.parentId && f.id !== feature?.id).map(f => (
                  <option key={f.id} value={f.id}>{f.nameVi || f.name} ({f.categoryVi || f.category})</option>
                ))}
              </select>
              {form.parentId && (
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={form.isUpgradeable} onChange={e => setForm(f => ({ ...f, isUpgradeable: e.target.checked }))} />
                    <span style={{ color: DS.pink, fontSize: 11, fontFamily: DS.mono }}>Đánh dấu là "Nâng cấp"</span>
                  </label>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={fieldGap}>
                <label style={labelStyle}>Tier</label>
                <select style={{ ...inpStyle, cursor: "pointer" }} value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}>
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="advanced">Advanced</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div style={fieldGap}>
                <label style={labelStyle}>Trạng thái</label>
                <select style={{ ...inpStyle, cursor: "pointer" }} value={String(form.isActive)} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === "true" }))}>
                  <option value="true">Hoạt động</option>
                  <option value="false">Tạm ngưng</option>
                </select>
              </div>
            </div>

            {/* Flags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "6px 12px", borderRadius: 8, background: form.includedInBase ? `${DS.green}15` : DS.bg, border: `1px solid ${form.includedInBase ? DS.green : DS.border}` }}>
                <input type="checkbox" checked={form.includedInBase} onChange={e => setForm(f => ({ ...f, includedInBase: e.target.checked }))} />
                <span style={{ color: form.includedInBase ? DS.green : DS.text3, fontSize: 12, fontFamily: DS.mono }}>
                  ✓ Included in Base (giá 0đ, luôn có)
                </span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "6px 12px", borderRadius: 8, background: form.isRequired ? `${DS.amber}15` : DS.bg, border: `1px solid ${form.isRequired ? DS.amber : DS.border}` }}>
                <input type="checkbox" checked={form.isRequired} onChange={e => setForm(f => ({ ...f, isRequired: e.target.checked }))} />
                <span style={{ color: form.isRequired ? DS.amber : DS.text3, fontSize: 12, fontFamily: DS.mono }}>
                  Bắt buộc
                </span>
              </label>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 8, padding: "8px 12px", color: DS.red, fontSize: 12 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>
                Hủy
              </button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", background: saving ? DS.text4 : DS.blue, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>
                {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm tính năng"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Tab 2: Features ────────────────────────────────────────────────────────────

function FeaturesTab() {
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data, isLoading } = useQuery<{ data: Feature[]; pagination: { total: number } }>({
    queryKey: ["admin", "pricing", "features"],
    queryFn: () => adminApi.get<{ data: Feature[]; pagination: { total: number } }>("/api/admin/service-attributes"),
  });

  const [editingFeature, setEditingFeature] = useState<Feature | null | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await adminApi.delete(`/api/admin/service-attributes/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pricing", "features"] }),
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : "Xóa thất bại", type: "error" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await adminApi.put(`/api/admin/service-attributes/${id}`, { isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pricing", "features"] }),
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : "Cập nhật thất bại", type: "error" }); },
  });

  const features: Feature[] = data?.data ?? [];
  const categories = [...new Set(features.map(f => f.categoryVi || f.category))];

  const filtered = features.filter(f => {
    const matchSearch = !search || (f.nameVi || f.name).toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || (f.categoryVi || f.category) === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <>
    <div>
      {editingFeature !== undefined && (
        <FeatureFormModal
          feature={editingFeature}
          allFeatures={features}
          onClose={() => setEditingFeature(undefined)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["admin", "pricing", "features"] }); setEditingFeature(undefined); }}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h3 style={{ fontFamily: DS.heading, fontSize: 16, fontWeight: 700, color: DS.text, margin: "0 0 4px" }}>
            Tính năng dịch vụ
          </h3>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {filtered.length} / {features.length} tính năng · {categories.length} danh mục
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 12px", color: DS.text, fontSize: 12, fontFamily: DS.mono, outline: "none" }}
          />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 12px", color: DS.text, fontSize: 12, fontFamily: DS.mono, outline: "none", cursor: "pointer" }}>
            <option value="">Tất cả danh mục</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setEditingFeature(null)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.blue, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 12, fontFamily: DS.mono, fontWeight: 600 }}>
            <PlusCircle size={13} /> Thêm tính năng
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} style={{ color: DS.text4, animation: "spin 1s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>Không có tính năng nào</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(f => (
            <div key={f.id} style={{
              background: DS.bgCard,
              border: `1px solid ${f.isActive ? DS.border : DS.red + "44"}`,
              borderRadius: 12, padding: "12px 16px",
              opacity: f.isActive ? 1 : 0.6,
              transition: "all 0.15s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                {/* Left: info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{f.nameVi || f.name}</span>
                    {f.nameEn && <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>/ {f.nameEn}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontFamily: DS.mono, color: DS.text4, background: DS.bg, borderRadius: 4, padding: "1px 6px" }}>{f.slug}</span>
                    <span style={{ fontSize: 10, fontFamily: DS.mono, color: DS.text4 }}>{f.categoryVi || f.category}</span>
                    <span style={{ fontSize: 10, fontFamily: DS.mono, color: DS.text4 }}>{f.tier}</span>
                    {f.includedInBase && (
                      <span style={{ fontSize: 9, fontFamily: DS.mono, color: DS.green, background: "rgba(34,197,94,0.12)", border: `1px solid rgba(34,197,94,0.25)`, borderRadius: 4, padding: "1px 6px" }}>✓ Base</span>
                    )}
                    {f.isUpgradeable && (
                      <span style={{ fontSize: 9, fontFamily: DS.mono, color: DS.pink, background: "rgba(236,72,153,0.12)", border: `1px solid rgba(236,72,153,0.25)`, borderRadius: 4, padding: "1px 6px" }}>↑ Upgrade</span>
                    )}
                    {f.parentId && f.parent && (
                      <span style={{ fontSize: 9, fontFamily: DS.mono, color: DS.amber, background: "rgba(245,158,11,0.1)", border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 4, padding: "1px 6px" }}>
                        ↑ từ: {f.parent.nameVi || f.parent.name}
                      </span>
                    )}
                    {f.isRequired && (
                      <span style={{ fontSize: 9, fontFamily: DS.mono, color: DS.amber, background: "rgba(245,158,11,0.1)", border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 4, padding: "1px 6px" }}>Bắt buộc</span>
                    )}
                  </div>
                </div>

                {/* Right: price + actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontFamily: DS.mono, fontWeight: 700, color: f.includedInBase ? DS.green : DS.blue }}>
                      {f.includedInBase ? "0đ" : `+${fmtVND(f.price)}`}
                    </div>
                    {f.xpPoints > 0 && (
                      <div style={{ fontSize: 10, fontFamily: DS.mono, color: DS.text4 }}>+{f.xpPoints} XP</div>
                    )}
                  </div>
                  <Toggle checked={f.isActive} onChange={() => toggleMutation.mutate({ id: f.id, isActive: !f.isActive })} />
                  <button onClick={() => setEditingFeature(f)}
                    style={{ color: DS.blue, background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 12, fontFamily: DS.mono }}>
                    Sửa
                  </button>
                  <button onClick={() => { if (confirm("Xóa tính năng này?")) deleteMutation.mutate(f.id); }}
                    style={{ color: DS.text4, background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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

// ── Tab 3: Infra Tiers ────────────────────────────────────────────────────────

function InfraTiersTab() {
  const _qc = useQueryClient();

  const { data, isLoading } = useQuery<{ data: InfraTier[]; pagination: { total: number } }>({
    queryKey: ["admin", "pricing", "infra-tiers"],
    queryFn: () => adminApi.get<{ data: InfraTier[]; pagination: { total: number } }>("/api/admin/pricing/infra-tiers"),
  });

  const tiers: InfraTier[] = data?.data ?? [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h3 style={{ fontFamily: DS.heading, fontSize: 16, fontWeight: 700, color: DS.text, margin: "0 0 4px" }}>
            Hạ tầng & Hosting
          </h3>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            Các gói hosting / infrastructure tier dùng trong báo giá
          </p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} style={{ color: DS.text4, animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tiers.map(t => (
            <div key={t.id} style={{
              background: DS.bgCard,
              border: `1px solid ${DS.border}`,
              borderRadius: 12, padding: "14px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ color: DS.text, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{t.nameVi || t.name}</div>
                <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>{t.slug}</div>
                {t.description && (
                  <div style={{ color: DS.text3, fontSize: 11, marginTop: 4 }}>{t.description}</div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: DS.blue, fontSize: 16, fontFamily: DS.mono, fontWeight: 700 }}>
                  {fmtVND(t.monthlyCost)}<span style={{ fontSize: 10, color: DS.text4, fontWeight: 400 }}> / tháng</span>
                </div>
                {t.setupCost > 0 && (
                  <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>
                    Setup: {fmtVND(t.setupCost)}
                  </div>
                )}
              </div>
            </div>
          ))}
          {tiers.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontFamily: DS.mono }}>
              Chưa có infrastructure tier nào
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab 4: Packages ────────────────────────────────────────────────────────────

function PackagesTab() {
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data, isLoading } = useQuery<{ data: Package[]; pagination: { total: number } }>({
    queryKey: ["admin", "pricing", "packages"],
    queryFn: () => adminApi.get<{ data: Package[]; pagination: { total: number } }>("/api/admin/pricing/packages"),
  });

  const packages: Package[] = data?.data ?? [];
  const typeLabels: Record<string, string> = {
    basic: "Basic", pro: "Pro", enterprise: "Enterprise", starter: "Starter",
  };

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await adminApi.put(`/api/admin/pricing/packages`, { id, isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pricing", "packages"] }),
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : "Cập nhật thất bại", type: "error" }); },
  });

  return (
    <>
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h3 style={{ fontFamily: DS.heading, fontSize: 16, fontWeight: 700, color: DS.text, margin: "0 0 4px" }}>
            Gói dịch vụ
          </h3>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {packages.length} gói · {packages.filter(p => p.isActive).length} đang hoạt động
          </p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} style={{ color: DS.text4, animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {packages.map(p => (
            <div key={p.id} style={{
              background: DS.bgCard,
              border: `1px solid ${p.isActive ? DS.border : DS.red + "44"}`,
              borderRadius: 14, padding: 18,
              opacity: p.isActive ? 1 : 0.6,
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, right: 0,
                width: 80, height: 80,
                background: p.type === "enterprise" ? GRD.gold : p.type === "pro" ? GRD.blue : GRD.purple,
                opacity: 0.05,
                borderRadius: "0 14px 0 80px",
              }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{p.title}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 10, fontFamily: DS.mono, color: DS.text4, background: DS.bg, borderRadius: 4, padding: "2px 8px" }}>
                      {typeLabels[p.type] ?? p.type}
                    </span>
                    {p.isSubscription && (
                      <span style={{ fontSize: 10, fontFamily: DS.mono, color: DS.cyan, background: "rgba(20,184,166,0.1)", borderRadius: 4, padding: "2px 8px" }}>
                        Subscription
                      </span>
                    )}
                  </div>
                </div>
                <Toggle checked={p.isActive} onChange={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })} />
              </div>
              {p.priceText ? (
                <div style={{ color: DS.blue, fontSize: 18, fontFamily: DS.mono, fontWeight: 700, marginBottom: 10 }}>
                  {p.priceText}
                </div>
              ) : p.price ? (
                <div style={{ color: DS.blue, fontSize: 18, fontFamily: DS.mono, fontWeight: 700, marginBottom: 10 }}>
                  {fmtVND(p.price)}<span style={{ fontSize: 11, color: DS.text4, fontWeight: 400 }}> VND</span>
                </div>
              ) : null}
              {p.features.length > 0 && (
                <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 4 }}>
                  {p.features.slice(0, 4).map((feat, i) => (
                    <li key={i} style={{ color: DS.text3, fontSize: 11 }}>{feat}</li>
                  ))}
                  {p.features.length > 4 && (
                    <li style={{ color: DS.text4, fontSize: 11 }}>+{p.features.length - 4} more</li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
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

// ── Tab 5: Add-ons ──────────────────────────────────────────────────────────────

function AddonsTab() {
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data, isLoading } = useQuery<{ data: Addon[]; pagination: { total: number } }>({
    queryKey: ["admin", "pricing", "addons"],
    queryFn: () => adminApi.get<{ data: Addon[]; pagination: { total: number } }>("/api/admin/pricing/addons"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await adminApi.delete(`/api/admin/pricing/addons?id=${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pricing", "addons"] }),
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : "Xóa thất bại", type: "error" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await adminApi.put(`/api/admin/pricing/addons`, { id, isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pricing", "addons"] }),
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : "Cập nhật thất bại", type: "error" }); },
  });

  const addons: Addon[] = data?.data ?? [];

  return (
    <>
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h3 style={{ fontFamily: DS.heading, fontSize: 16, fontWeight: 700, color: DS.text, margin: "0 0 4px" }}>
            Dịch vụ thêm
          </h3>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {addons.length} dịch vụ · Domain, SSL, Hosting upgrade, v.v.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} style={{ color: DS.text4, animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {addons.map(a => (
            <div key={a.id} style={{
              background: DS.bgCard,
              border: `1px solid ${a.isActive ? DS.border : DS.red + "44"}`,
              borderRadius: 10, padding: "12px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              opacity: a.isActive ? 1 : 0.6,
            }}>
              <div>
                <div style={{ color: DS.text, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{a.nameVi || a.name}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontFamily: DS.mono, color: DS.text4 }}>{a.slug}</span>
                  <span style={{ fontSize: 10, color: DS.text4, background: DS.bg, borderRadius: 4, padding: "1px 6px" }}>
                    {a.type === "one_time" ? "Một lần" : "Định kỳ"}
                  </span>
                  {a.billingPeriod && (
                    <span style={{ fontSize: 10, color: DS.text4 }}>{a.billingPeriod}</span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 14, fontFamily: DS.mono, color: DS.amber, fontWeight: 700 }}>
                  {fmtVND(a.price)} <span style={{ fontSize: 10, fontWeight: 400, color: DS.text4 }}>VND</span>
                </span>
                <Toggle checked={a.isActive} onChange={() => toggleMutation.mutate({ id: a.id, isActive: !a.isActive })} />
                <button
                  onClick={() => { if (confirm("Xóa dịch vụ này?")) deleteMutation.mutate(a.id); }}
                  style={{ color: DS.text4, background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
          {addons.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontFamily: DS.mono }}>
              Chưa có dịch vụ thêm nào
            </div>
          )}
        </div>
      )}
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


// ── Tab 6: Hosting Plans ───────────────────────────────────────────────────────

function HostingTab() {
 const qc = useQueryClient();
 const [showForm, setShowForm] = useState(false);
 const [editing, setEditing] = useState<HostingPlan | null>(null);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState('');

 const { data, isLoading } = useQuery<{ data: HostingPlan[] }>({
 queryKey: ['admin', 'pricing', 'hosting-plans'],
 queryFn: () => adminApi.get('/api/admin/pricing/hosting-plans'),
 });

 const plans: HostingPlan[] = data?.data ?? [];
 const [form, setForm] = useState({
 slug: '', name: '', nameVi: '',
 monthlyPrice: 0, months: 12, discountPct: 0,
 features: '', featuresVi: '',
 highlighted: false, color: '#3B82F6', sortOrder: 0, isActive: true,
 });

 const inpStyle: React.CSSProperties = {
 width: '100%', background: DS.bg, border: `1px solid ${DS.border}`,
 borderRadius: 8, padding: '9px 12px', color: DS.text, fontSize: 13,
 outline: 'none', fontFamily: DS.body, boxSizing: 'border-box',
 };
 const labelStyle: React.CSSProperties = { color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 4 };

 const openAdd = () => {
 setEditing(null);
 setForm({ slug: '', name: '', nameVi: '', monthlyPrice: 0, months: 12, discountPct: 0, features: '', featuresVi: '', highlighted: false, color: '#3B82F6', sortOrder: 0, isActive: true });
 setError('');
 setShowForm(true);
 };
 const openEdit = (p: HostingPlan) => {
 setEditing(p);
 setForm({
 slug: p.slug, name: p.name, nameVi: p.nameVi,
 monthlyPrice: p.monthlyPrice, months: p.months, discountPct: p.discountPct,
 features: (p.features || []).join(', '), featuresVi: (p.featuresVi || []).join(', '),
 highlighted: p.highlighted, color: p.color || '#3B82F6', sortOrder: p.sortOrder, isActive: p.isActive,
 });
 setError('');
 setShowForm(true);
 };

 const calcTotal = (monthly: number, mo: number, discount: number) => {
 if (discount > 0) return Math.round(monthly * mo * (1 - discount / 100));
 return monthly * mo;
 };

 const handleSave = async () => {
  setSaving(true); setError('');
 try {
 const payload = {
 slug: form.slug, name: form.name, nameVi: form.nameVi,
 monthlyPrice: Number(form.monthlyPrice) || 0,
 months: Number(form.months) || 12,
 discountPct: Number(form.discountPct) || 0,
 features: form.features.split(',').map((s: string) => s.trim()).filter(Boolean),
 featuresVi: form.featuresVi.split(',').map((s: string) => s.trim()).filter(Boolean),
 highlighted: form.highlighted,
 color: form.color,
 sortOrder: Number(form.sortOrder) || 0,
 isActive: form.isActive,
  };
 if (editing) await adminApi.put('/api/admin/pricing/hosting-plans', { ...payload, id: editing.id });
 else await adminApi.post('/api/admin/pricing/hosting-plans', payload);
 qc.invalidateQueries({ queryKey: ['admin', 'pricing', 'hosting-plans'] });
 setShowForm(false);
 } catch (err: unknown) {
 setError(err instanceof Error ? err.message : 'Lưu thất bại');
 } finally { setSaving(false); }
 };

 return (
 <div>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
 <div>
 <h3 style={{ fontFamily: DS.heading, fontSize: 16, fontWeight: 700, color: DS.text, margin: '0 0 4px' }}>Hosting Plans</h3>
 <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
 {plans.length} gói hosting · Giá/tháng dùng trong web purchase wizard
 </p>
 </div>
 <div style={{ display: 'flex', gap: 8 }}>
 <button onClick={() => qc.invalidateQueries({ queryKey: ['admin', 'pricing', 'hosting-plans'] })}
 style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: 'pointer', fontSize: 12, fontFamily: DS.mono }}>
 <RefreshCw size={13} /> Làm mới
 </button>
 <button onClick={openAdd}
 style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', background: DS.blue, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}>
 <PlusCircle size={13} /> Thêm gói hosting
 </button>
 </div>
 </div>

 {isLoading ? (
 <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
 <Loader2 size={24} style={{ color: DS.text4, animation: 'spin 1s linear infinite' }} />
  </div>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {plans.map(p => {
 const total = calcTotal(p.monthlyPrice, p.months, p.discountPct);
 return (
 <div key={p.id} style={{
 background: DS.bgCard,
 border: `1px solid ${p.highlighted ? (p.color || DS.blue) : DS.border}`,
 borderRadius: 12, padding: '16px 20px',
 display: 'flex', justifyContent: 'space-between', alignItems: 'center',
 opacity: p.isActive ? 1 : 0.5,
 }}>
 <div>
 <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
 <span style={{ color: DS.text, fontWeight: 600, fontSize: 14 }}>{p.nameVi || p.name}</span>
  {p.highlighted && (
 <span style={{ background: p.color || DS.blue, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontFamily: DS.mono }}>NỔI BẬT</span>
 )}
 <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>{p.slug}</span>
 </div>
 <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
 {p.monthlyPrice.toLocaleString('vi-VN')}đ/tháng × {p.months} tháng
 {p.discountPct > 0 && <span style={{ color: DS.green, marginLeft: 6 }}>−{p.discountPct}%</span>}
 </div>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
 <div style={{ textAlign: 'right' }}>
 <div style={{ color: DS.text, fontFamily: DS.mono, fontWeight: 700, fontSize: 16 }}>
 {total.toLocaleString('vi-VN')}đ
 </div>
 <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>
 = {p.monthlyPrice.toLocaleString('vi-VN')}đ × {p.months}
 </div>
 </div>
 <Toggle checked={p.isActive} onChange={() => adminApi.put('/api/admin/pricing/hosting-plans', { ...p, id: p.id }).then(() => qc.invalidateQueries({ queryKey: ['admin', 'pricing', 'hosting-plans'] }))} />
 <button onClick={() => openEdit(p)} style={{ color: DS.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: DS.mono }}>Sửa</button>
 <button onClick={() => { if (confirm('Xóa gói này?')) adminApi.delete(`/api/admin/pricing/hosting-plans?id=${p.id}`).then(() => qc.invalidateQueries({ queryKey: ['admin', 'pricing', 'hosting-plans'] })); }}
 style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}>
 <Trash2 size={13} />
  </button>
 </div>
 </div>
 );
 })}
 {plans.length === 0 && (
 <div style={{ textAlign: 'center', padding: '3rem', color: DS.text4, fontFamily: DS.mono }}>
  Chưa có gói hosting nào
 </div>
 )}
 </div>
 )}

 {showForm && (
 <AnimatePresence>
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 onClick={() => setShowForm(false)}
 style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
 <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
 onClick={e => e.stopPropagation()}
 style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
  <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, margin: 0 }}>{editing ? 'Sửa gói hosting' : 'Thêm gói hosting mới'}</h3>
 <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: DS.text4, cursor: 'pointer' }}><X size={18} /></button>
 </div>
 {error && <p style={{ color: DS.red, fontSize: 13, marginBottom: 12 }}>{error}</p>}
 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
 <div>
 <label style={labelStyle}>Tên (VN) *</label>
 <input style={inpStyle} value={form.nameVi} onChange={e => setForm(f => ({ ...f, nameVi: e.target.value, name: e.target.value }))} placeholder='VD: Gói Starter 2GB' />
 </div>
 <div>
 <label style={labelStyle}>Slug *</label>
 <input style={inpStyle} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder='VD: starter-2gb' />
 </div>
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
 <div>
 <label style={labelStyle}>Giá/tháng (VND)</label>
 <input style={inpStyle} type='number' value={form.monthlyPrice} onChange={e => setForm(f => ({ ...f, monthlyPrice: Number(e.target.value) }))} />
 </div>
 <div>
 <label style={labelStyle}>Số tháng reference</label>
 <input style={inpStyle} type='number' value={form.months} onChange={e => setForm(f => ({ ...f, months: Number(e.target.value) }))} />
 </div>
 <div>
 <label style={labelStyle}>Discount (%)</label>
 <input style={inpStyle} type='number' value={form.discountPct} onChange={e => setForm(f => ({ ...f, discountPct: Number(e.target.value) }))} />
 </div>
 </div>
 <div style={{ background: DS.bg, border: `1px solid ${DS.blue}44`, borderRadius: 10, padding: 12 }}>
 <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>Preview Calculator</div>
 <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
 {[6, 12, 24].map(mo => {
  const t = calcTotal(Number(form.monthlyPrice) || 0, mo, Number(form.discountPct) || 0);
 return (
 <div key={mo} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '6px 12px' }}>
 <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>{mo} tháng</div>
 <div style={{ color: DS.blue, fontFamily: DS.mono, fontWeight: 700, fontSize: 14 }}>{t.toLocaleString('vi-VN')}đ</div>
 </div>
 );
 })}
 </div>
 </div>
 <div>
  <label style={labelStyle}>Tính năng (EN, cách nhau dấu phẩy)</label>
 <input style={inpStyle} value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} placeholder='2GB SSD, Unlimited Bandwidth, Free SSL' />
 </div>
 <div>
 <label style={labelStyle}>Tính năng (VN, cách nhau dấu phẩy)</label>
 <input style={inpStyle} value={form.featuresVi} onChange={e => setForm(f => ({ ...f, featuresVi: e.target.value }))} placeholder='2GB SSD, Băng thông không giới hạn, SSL miễn phí' />
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
 <div>
 <label style={labelStyle}>Sort Order</label>
 <input style={inpStyle} type='number' value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
 </div>
 <div>
 <label style={labelStyle}>Màu sắc</label>
 <input style={{ ...inpStyle, padding: '4px 8px' }} type='color' value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
 <Toggle checked={form.highlighted} onChange={v => setForm(f => ({ ...f, highlighted: v }))} />
 <span style={{ color: DS.text3, fontSize: 12 }}>Nổi bật</span>
 </div>
 </div>
 </div>
 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
 <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', border: `1px solid ${DS.border}`, borderRadius: 10, background: 'transparent', color: DS.text3, cursor: 'pointer', fontFamily: DS.mono, fontSize: 13 }}>Hủy</button>
 <button onClick={handleSave} disabled={saving}
 style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: saving ? DS.text4 : DS.blue, color: '#fff', border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: DS.mono, fontSize: 13, fontWeight: 600 }}>
 {saving && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
 {saving ? 'Đang lưu...' : 'Lưu'}
 </button>
 </div>
 </motion.div>
 </motion.div>
 </AnimatePresence>
 )}
 </div>
 );
}


// ── Tab 7: Domain Prices ───────────────────────────────────────────────────────

function DomainPricesTab() {
 const qc = useQueryClient();
 const [showForm, setShowForm] = useState(false);
 const [editing, setEditing] = useState<DomainPrice | null>(null);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState('');

 const { data, isLoading } = useQuery<{ data: DomainPrice[] }>({
 queryKey: ['admin', 'pricing', 'domain-prices'],
 queryFn: () => adminApi.get('/api/admin/pricing/domain-prices'),
 });

 const prices: DomainPrice[] = data?.data ?? [];
 const [form, setForm] = useState({
 extension: '', registrationPrice: 0, renewalPrice: 0,
 period: '1', periodVi: '1 năm',
 note: '', noteVi: '', sortOrder: 0, isActive: true,
 });

 const inpStyle: React.CSSProperties = {
 width: '100%', background: DS.bg, border: `1px solid ${DS.border}`,
 borderRadius: 8, padding: '9px 12px', color: DS.text, fontSize: 13,
 outline: 'none', fontFamily: DS.body, boxSizing: 'border-box',
 };
 const labelStyle: React.CSSProperties = { color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 4 };

 const openAdd = () => {
 setEditing(null);
 setForm({ extension: '', registrationPrice: 0, renewalPrice: 0, period: '1', periodVi: '1 năm', note: '', noteVi: '', sortOrder: 0, isActive: true });
 setError('');
 setShowForm(true);
 };
 const openEdit = (p: DomainPrice) => {
 setEditing(p);
 setForm({ extension: p.extension, registrationPrice: p.registrationPrice, renewalPrice: p.renewalPrice, period: p.period, periodVi: p.periodVi || '1 năm', note: p.note || '', noteVi: p.noteVi || '', sortOrder: p.sortOrder, isActive: p.isActive });
 setError('');
 setShowForm(true);
 };

 return (
 <div>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
 <div>
 <h3 style={{ fontFamily: DS.heading, fontSize: 16, fontWeight: 700, color: DS.text, margin: '0 0 4px' }}>Giá tên miền</h3>
 <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
 {prices.length} extension · Giá đăng ký & gia hạn dùng trong domain search
 </p>
 </div>
 <button onClick={openAdd}
 style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', background: DS.blue, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}>
 <PlusCircle size={13} /> Thêm extension
 </button>
 </div>

 {isLoading ? (
 <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
 <Loader2 size={24} style={{ color: DS.text4, animation: 'spin 1s linear infinite' }} />
 </div>
 ) : (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
 {prices.map(p => (
 <div key={p.id} style={{
 background: DS.bgCard,
 border: `1px solid ${p.isActive ? DS.border : DS.red + '44'}`,
 borderRadius: 12, padding: 16,
 opacity: p.isActive ? 1 : 0.5,
 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
 <div>
 <span style={{ color: DS.text, fontWeight: 700, fontSize: 18, fontFamily: DS.mono }}>.{p.extension}</span>
 {p.note && <div style={{ color: DS.text4, fontSize: 10, marginTop: 2 }}>{p.noteVi || p.note}</div>}
 </div>
 <Toggle checked={p.isActive} onChange={() => adminApi.put('/api/admin/pricing/domain-prices', { ...p, id: p.id }).then(() => qc.invalidateQueries({ queryKey: ['admin', 'pricing', 'domain-prices'] }))} />
 </div>
 <div style={{ display: 'flex', gap: 12 }}>
 <div>
 <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>Đăng ký</div>
 <div style={{ color: DS.green, fontFamily: DS.mono, fontWeight: 700, fontSize: 14 }}>{p.registrationPrice.toLocaleString('vi-VN')}đ</div>
 </div>
 <div>
 <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>Gia hạn</div>
 <div style={{ color: DS.text3, fontFamily: DS.mono, fontWeight: 600, fontSize: 14 }}>{p.renewalPrice.toLocaleString('vi-VN')}đ</div>
 </div>
 </div>
 <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
 <button onClick={() => openEdit(p)} style={{ flex: 1, padding: '5px', border: `1px solid ${DS.border}`, borderRadius: 6, background: 'transparent', color: DS.blue, cursor: 'pointer', fontSize: 11, fontFamily: DS.mono }}>Sửa</button>
 <button onClick={() => { if (confirm('Xóa extension này?')) adminApi.delete(`/api/admin/pricing/domain-prices?id=${p.id}`).then(() => qc.invalidateQueries({ queryKey: ['admin', 'pricing', 'domain-prices'] })); }}
 style={{ padding: '5px 8px', border: `1px solid ${DS.border}`, borderRadius: 6, background: 'transparent', color: DS.text4, cursor: 'pointer' }}>
 <Trash2 size={11} />
 </button>
 </div>
  </div>
 ))}
 {prices.length === 0 && (
 <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: DS.text4, fontFamily: DS.mono }}>
 Chưa có giá domain nào
 </div>
 )}
 </div>
 )}

 {showForm && (
 <AnimatePresence>
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
  onClick={() => setShowForm(false)}
 style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
 <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
 onClick={e => e.stopPropagation()}
 style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 480 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
 <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, margin: 0 }}>{editing ? 'Sửa giá domain' : 'Thêm extension mới'}</h3>
 <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: DS.text4, cursor: 'pointer' }}><X size={18} /></button>
 </div>
 {error && <p style={{ color: DS.red, fontSize: 13, marginBottom: 12 }}>{error}</p>}
 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
 <div>
 <label style={labelStyle}>Extension *</label>
 <input style={inpStyle} value={form.extension} onChange={e => setForm(f => ({ ...f, extension: e.target.value }))} placeholder='VD: vn, com, com.vn' />
 </div>
 <div>
 <label style={labelStyle}>Sort Order</label>
 <input style={inpStyle} type='number' value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
 </div>
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
 <div>
 <label style={labelStyle}>Giá đăng ký (VND)</label>
 <input style={inpStyle} type='number' value={form.registrationPrice} onChange={e => setForm(f => ({ ...f, registrationPrice: Number(e.target.value) }))} />
 </div>
 <div>
 <label style={labelStyle}>Giá gia hạn (VND)</label>
 <input style={inpStyle} type='number' value={form.renewalPrice} onChange={e => setForm(f => ({ ...f, renewalPrice: Number(e.target.value) }))} />
 </div>
 </div>
 <div>
  <label style={labelStyle}>Ghi chú (VN)</label>
 <input style={inpStyle} value={form.noteVi} onChange={e => setForm(f => ({ ...f, noteVi: e.target.value }))} placeholder='VD: Yêu cầu giấy tờ' />
 </div>
 </div>
 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
 <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', border: `1px solid ${DS.border}`, borderRadius: 10, background: 'transparent', color: DS.text3, cursor: 'pointer', fontFamily: DS.mono, fontSize: 13 }}>Hủy</button>
 <button onClick={async () => {
 setSaving(true); setError('');
 try {
 const payload = { extension: form.extension, registrationPrice: form.registrationPrice, renewalPrice: form.renewalPrice, period: form.period, periodVi: form.periodVi, note: form.note, noteVi: form.noteVi, sortOrder: form.sortOrder, isActive: form.isActive };
 if (editing) await adminApi.put('/api/admin/pricing/domain-prices', { ...payload, id: editing.id });
 else await adminApi.post('/api/admin/pricing/domain-prices', payload);
 qc.invalidateQueries({ queryKey: ['admin', 'pricing', 'domain-prices'] });
 setShowForm(false);
 } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Lưu thất bại'); setSaving(false); return; }
 setSaving(false);
 }} disabled={saving}
  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: saving ? DS.text4 : DS.blue, color: '#fff', border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: DS.mono, fontSize: 13, fontWeight: 600 }}>
 {saving && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
 {saving ? 'Đang lưu...' : 'Lưu'}
 </button>
 </div>
 </motion.div>
 </motion.div>
 </AnimatePresence>
 )}
 </div>
 );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const _t = useAdminTranslations();
  const [tab, setTab] = useState("settings");

  const tabs = TABS;

  return (
    <div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
        input:focus { border-color: ${DS.blue} !important; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
          Quản trị báo giá
        </h2>
        <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
          Cấu hình giá nền tảng, tính năng, hạ tầng, gói dịch vụ & dịch vụ thêm
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 4, marginBottom: "1.5rem",
        background: DS.bgCard, borderRadius: 12, padding: 4,
        border: `1px solid ${DS.border}`,
        overflowX: "auto",
      }}>
        {tabs.map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px",
              borderRadius: 8, border: "none", cursor: "pointer",
              background: tab === tb.key ? DS.blue : "transparent",
              color: tab === tb.key ? "#fff" : DS.text3,
              fontFamily: DS.mono, fontSize: 12, fontWeight: tab === tb.key ? 600 : 400,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {tb.icon}
            {tb.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {tab === "settings"     && <SettingsTab />}
          {tab === "features"     && <FeaturesTab />}
          {tab === "infra-tiers"  && <InfraTiersTab />}
          {tab === "packages"    && <PackagesTab />}
          {tab === "addons"       && <AddonsTab />}
 {tab === "acknowledgments" && <AcknowledgmentsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
