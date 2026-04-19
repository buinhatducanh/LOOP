"use client";

/**
 * SEOPackagesTab — Admin SEO Management
 * Route: /admin/services → "Gói SEO" tab
 *
 * Manages:
 * 1. SEO Tier Config — CRUD paid tiers with monthly prices
 * 2. Free Tier (Khởi động) — toggle + features
 * 3. Feature Matrix — which features belong to which tiers
 */

import { useState, useEffect, useCallback } from "react";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Plus, Edit2, Trash2, RefreshCw, X, Check, Save,
  ChevronDown, ChevronUp, Layers, Target, Gift,
  ToggleLeft, ToggleRight, DollarSign, Eye, EyeOff,
} from "lucide-react";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

// ── Types ──────────────────────────────────────────────────────────────────────

type SeOTier = {
  id: string;
  serviceKey: string;
  level: number;
  name: string;
  nameEn?: string;
  nameVi?: string;
  shortDesc?: string;
  shortDescEn?: string;
  basePrice: number;
  marketPrice?: number;
  lpReward: number;
  sortOrder: number;
  isActive: boolean;
};

type SeoFeature = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  nameEn?: string;
  category: string;
  categoryVi: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
  includedTiers?: string; // JSON string
  serviceKey?: string;
  videoUrl?: string;
};

type SeoMatrix = Record<string, number[]>; // { [featureId]: [tierLevels] }

type FreeTierConfig = {
  isActive: boolean;
  label: string;
  shortDesc: string;
  articles: number;
  features: string[];
};

type MatrixResponse = {
  matrix: SeoMatrix;
  freeTier: FreeTierConfig;
  features: SeoFeature[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_COLORS: Record<number, string> = {
  0: "#22C55E", // Free
  1: "#94A3B8", // Cơ bản
  2: "#4F7DF3", // Nâng cao
  3: "#F59E0B", // Chuyên nghiệp
};

const SEO_CATEGORY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  "Tối ưu On-page": { color: "#E6C75F", bg: "rgba(230,199,95,0.08)", border: "rgba(230,199,95,0.25)" },
  "Tối ưu Off-page": { color: "#62C5EB", bg: "rgba(98,197,235,0.08)", border: "rgba(98,197,235,0.25)" },
  "Nghiên cứu từ khóa": { color: "#EC4899", bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.25)" },
  "Phân tích kỹ thuật": { color: "#4F7DF3", bg: "rgba(79,125,243,0.08)", border: "rgba(79,125,243,0.25)" },
  "Báo cáo": { color: "#8B5CF6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)" },
  "Khác": { color: "#94A3B8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)" },
};

// ── Tier Modal ───────────────────────────────────────────────────────────────

function TierModal({
  tier,
  onClose,
  onSaved,
}: {
  tier?: SeOTier | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!tier;

  const [form, setForm] = useState({
    level: tier?.level ?? 1,
    name: tier?.name ?? "",
    nameEn: tier?.nameEn ?? "",
    shortDesc: tier?.shortDesc ?? "",
    shortDescEn: tier?.shortDescEn ?? "",
    basePrice: tier?.basePrice ?? 900_000,
    marketPrice: tier?.marketPrice ?? 1_200_000,
    lpReward: tier?.lpReward ?? 50,
    sortOrder: tier?.sortOrder ?? tier?.level ?? 1,
    isActive: tier?.isActive ?? true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim()) { setError("Tên gói là bắt buộc"); return; }
    if (form.basePrice <= 0) { setError("Giá phải lớn hơn 0"); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await adminApi.put(`/api/admin/seo-tiers/${tier.id}`, form);
      } else {
        await adminApi.post("/api/admin/seo-tiers", form);
      }
      qc.invalidateQueries({ queryKey: ["admin", "seo-tiers"] });
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
    borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}
        style={{ background: DS.bgCard3, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 560 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: DS.text, fontWeight: 800, fontSize: 18 }}>
            {isEdit ? `Sửa gói SEO — ${tier.name}` : "Thêm gói SEO mới"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", color: DS.red, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>LEVEL *</label>
            <input type="number" min={1} max={10} value={form.level}
              onChange={e => setForm(f => ({ ...f, level: Number(e.target.value) }))} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>THỨ TỰ</label>
            <input type="number" min={0} value={form.sortOrder}
              onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>TÊN GÓI (VI) *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="VD: SEO Cơ Bản" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>TÊN (EN)</label>
          <input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))}
            placeholder="Basic SEO" style={inputStyle} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>GIÁ / THÁNG (VNĐ) *</label>
            <input type="number" min={0} value={form.basePrice}
              onChange={e => setForm(f => ({ ...f, basePrice: Number(e.target.value) }))} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>GIÁ GỐC (VNĐ)</label>
            <input type="number" min={0} value={form.marketPrice ?? 0}
              onChange={e => setForm(f => ({ ...f, marketPrice: Number(e.target.value) }))} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>MÔ TẢ NGẮN</label>
          <input value={form.shortDesc} onChange={e => setForm(f => ({ ...f, shortDesc: e.target.value }))}
            placeholder="5 bài/tháng · 1 từ khóa focus" style={inputStyle} />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
          <button
            onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
            style={{
              padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
              background: form.isActive ? `${DS.green}15` : `${DS.red}15`,
              border: `1px solid ${form.isActive ? `${DS.green}40` : `${DS.red}40`}`,
              color: form.isActive ? DS.green : DS.red,
            }}
          >
            {form.isActive ? "✓ Hoạt động" : "✗ Tắt"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={save} disabled={saving}
            style={{ flex: 1, padding: "10px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo gói"}
          </button>
          <button onClick={onClose}
            style={{ padding: "10px 16px", background: "transparent", border: `1px solid ${DS.border}`, color: DS.text3, borderRadius: 10, cursor: "pointer", fontSize: 13 }}>
            Hủy
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Free Tier Config ────────────────────────────────────────────────────────────

function FreeTierSection({ freeTier, onSave }: { freeTier: FreeTierConfig; onSave: (f: FreeTierConfig) => void }) {
  const [form, setForm] = useState<FreeTierConfig>(freeTier);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: `${DS.green}08`, border: `1px solid ${DS.green}20`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Gift size={18} style={{ color: DS.green }} />
        <div>
          <h4 style={{ color: DS.green, fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Gói Khởi động — Miễn phí</h4>
          <p style={{ color: DS.text4, fontSize: 11 }}>Được tặng kèm khi mua website. Khách hàng không cần trả thêm phí.</p>
        </div>
        <button
          onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
          style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          {form.isActive
            ? <ToggleRight size={28} style={{ color: DS.green }} />
            : <ToggleLeft size={28} style={{ color: DS.text5 }} />}
        </button>
      </div>

      {form.isActive && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>TÊN GÓI</label>
            <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none" }} />
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>SỐ BÀI VIẾT</label>
            <input type="number" min={1} value={form.articles}
              onChange={e => setForm(f => ({ ...f, articles: Number(e.target.value) }))}
              style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none" }} />
          </div>
        </div>
      )}

      {form.isActive && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>MÔ TẢ NGẮN</label>
          <input value={form.shortDesc} onChange={e => setForm(f => ({ ...f, shortDesc: e.target.value }))}
            placeholder="5 bài viết chuẩn SEO · Từ khóa thương hiệu · Xác minh Google"
            style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none" }} />
        </div>
      )}

      {form.isActive && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>TÍNH NĂNG (mỗi dòng 1)</label>
          <textarea value={(form.features || []).join("\n")}
            onChange={e => setForm(f => ({ ...f, features: e.target.value.split("\n").filter(Boolean) }))}
            rows={4}
            style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 12, outline: "none", resize: "vertical", fontFamily: DS.mono }} />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={save} disabled={saving || !form.isActive}
          style={{ padding: "8px 20px", background: saved ? DS.green : GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Đang lưu..." : saved ? "✓ Đã lưu!" : "Lưu cấu hình"}
        </button>
        {!form.isActive && (
          <span style={{ color: DS.text4, fontSize: 12 }}>Gói miễn phí đang tắt — khách hàng sẽ không thấy</span>
        )}
      </div>
    </div>
  );
}

// ── Feature Matrix ────────────────────────────────────────────────────────────

function FeatureMatrixSection({
  features,
  tiers,
  matrix,
  onToggle,
  onSave,
  saving,
}: {
  features: SeoFeature[];
  tiers: SeOTier[];
  matrix: SeoMatrix;
  onToggle: (featureId: string, tierLevel: number) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const toggleCat = (cat: string) => {
    const next = new Set(expandedCats);
    if (next.has(cat)) next.delete(cat); else next.add(cat);
    setExpandedCats(next);
  };

  // Group by category
  const byCategory: Record<string, SeoFeature[]> = {};
  for (const f of features) {
    const cat = f.categoryVi || "Khác";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(f);
  }
  const cats = Object.keys(byCategory).sort();

  // Also show free tier column (tier level 0)
  const allTiers: { level: number; name: string; color: string }[] = [
    { level: 0, name: "Miễn phí", color: TIER_COLORS[0] },
    ...tiers.map(t => ({ level: t.level, name: t.name, color: TIER_COLORS[t.level] ?? "#94A3B8" })),
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h4 style={{ color: DS.text, fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Ma trận tính năng</h4>
          <p style={{ color: DS.text4, fontSize: 11 }}>Tick vào ô để gán tính năng cho gói tương ứng</p>
        </div>
        <button onClick={onSave} disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: saving ? DS.bgCard2 : GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12, opacity: saving ? 0.6 : 1 }}>
          <Save size={13} /> {saving ? "Đang lưu..." : "Lưu ma trận"}
        </button>
      </div>

      <div style={{ overflowX: "auto", border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr style={{ background: DS.bg }}>
              <th style={{ padding: "10px 14px", textAlign: "left", borderBottom: `1px solid ${DS.border}`, position: "sticky", top: 0, background: DS.bg, zIndex: 2 }}>
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>TÍNH NĂNG</span>
              </th>
              {allTiers.map(t => (
                <th key={t.level} style={{ padding: "10px 8px", textAlign: "center", borderBottom: `1px solid ${DS.border}`, minWidth: 90, position: "sticky", top: 0, background: DS.bg, zIndex: 2 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />
                    <span style={{ color: t.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>{t.name.toUpperCase()}</span>
                    {t.level > 0 && "basePrice" in t && (
                      <span style={{ color: DS.text4, fontSize: 9 }}>{fmtVND((t as unknown as { basePrice: number }).basePrice)}/th</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cats.map(cat => {
              const catStyle = SEO_CATEGORY_STYLES[cat] ?? SEO_CATEGORY_STYLES["Khác"];
              const isOpen = expandedCats.has(cat) || expandedCats.size === 0;

              return (
                <>
                  <tr key={cat} onClick={() => toggleCat(cat)}
                    style={{ cursor: "pointer", background: `${catStyle.bg}20`, borderTop: `2px solid ${catStyle.border}40` }}>
                    <td colSpan={allTiers.length + 1} style={{ padding: "8px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Layers size={13} style={{ color: catStyle.color }} />
                        <span style={{ color: catStyle.color, fontSize: 12, fontWeight: 700, fontFamily: DS.mono, letterSpacing: "0.05em" }}>{cat.toUpperCase()}</span>
                        <span style={{ background: catStyle.bg, border: `1px solid ${catStyle.border}`, color: catStyle.color, fontSize: 10, fontFamily: DS.mono, padding: "1px 6px", borderRadius: 4 }}>
                          {byCategory[cat].length}
                        </span>
                        <span style={{ marginLeft: "auto", color: DS.text4 }}>
                          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {isOpen && byCategory[cat].map(f => {
                    const tiersIncluded = matrix[f.id] ?? [];
                    return (
                      <tr key={f.id} style={{ borderBottom: `1px solid ${DS.border}22` }}>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ color: DS.text, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{f.nameVi}</p>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ color: catStyle.color, fontSize: 10, fontFamily: DS.mono }}>{cat}</span>
                                {f.price > 0 && <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>+{fmtVND(f.price)}</span>}
                                {f.videoUrl && <span style={{ color: "#8B5CF6", fontSize: 10, fontFamily: DS.mono }}>📹</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        {allTiers.map(t => {
                          const checked = tiersIncluded.includes(t.level);
                          return (
                            <td key={t.level} style={{ textAlign: "center", padding: "6px 4px" }}>
                              <button
                                onClick={() => onToggle(f.id, t.level)}
                                style={{
                                  width: 28, height: 28, borderRadius: 6,
                                  border: `1.5px solid ${checked ? `${t.color}60` : DS.border}`,
                                  background: checked ? `${t.color}15` : "transparent",
                                  cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  transition: "all 0.15s",
                                }}
                              >
                                {checked
                                  ? <Check size={13} style={{ color: t.color }} strokeWidth={3} />
                                  : <span style={{ color: DS.text5, fontSize: 14 }}>—</span>}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function SEOPackagesTab() {
  const qc = useQueryClient();

  // ── Fetch SEO tiers ──────────────────────────────────────────────────────
  const { data: tiersData, isLoading: tiersLoading, refetch: refetchTiers } = useQuery({
    queryKey: ["admin", "seo-tiers"],
    queryFn: async () => {
      const res = await adminApi.get<{ data: SeOTier[] }>("/api/admin/seo-tiers");
      return res;
    },
  });
  const tiers = (tiersData?.data ?? []).sort((a, b) => a.level - b.level);

  // ── Fetch SEO features ────────────────────────────────────────────────────
  const { data: featuresData, isLoading: featuresLoading, refetch: refetchFeatures } = useQuery({
    queryKey: ["admin", "seo-features"],
    queryFn: async () => {
      const res = await adminApi.get<{ data: SeoFeature[] }>("/api/admin/pricing/features", {
        params: { isActive: undefined },
      });
      // Filter to SEO features
      return (res.data ?? []).filter(f => f.serviceKey === "seo" || !f.serviceKey);
    },
  });
  const features = (featuresData ?? []).sort((a, b) => a.sortOrder - b.sortOrder);

  // ── Fetch matrix ──────────────────────────────────────────────────────────
  const { data: matrixData, isLoading: matrixLoading, refetch: refetchMatrix } = useQuery({
    queryKey: ["admin", "seo-matrix"],
    queryFn: async () => {
      const res = await adminApi.get<MatrixResponse>("/api/admin/seo-feature-matrix");
      return res;
    },
  });
  const savedMatrix: SeoMatrix = matrixData?.matrix ?? {};
  const savedFreeTier: FreeTierConfig = matrixData?.freeTier ?? {
    isActive: true,
    label: "Khởi động — Miễn phí",
    shortDesc: "5 bài viết chuẩn SEO · Từ khóa thương hiệu · Xác minh Google Search Console",
    articles: 5,
    features: [
      "5 bài viết chuẩn SEO",
      "Từ khóa thương hiệu lên search",
      "Xác minh Google Search Console",
      "SSL tăng hiệu quả SEO",
    ],
  };

  // ── Local matrix state ────────────────────────────────────────────────────
  const [matrix, setMatrix] = useState<SeoMatrix>({});
  const [freeTier, setFreeTier] = useState<FreeTierConfig>(savedFreeTier);

  // Sync local state when server data arrives
  useEffect(() => {
    setMatrix(savedMatrix);
  }, [JSON.stringify(savedMatrix)]);

  useEffect(() => {
    setFreeTier(savedFreeTier);
  }, [JSON.stringify(savedFreeTier)]);

  // ── Matrix toggle ──────────────────────────────────────────────────────────
  const toggleCell = (featureId: string, tierLevel: number) => {
    setMatrix(prev => {
      const current = prev[featureId] ?? [];
      const exists = current.includes(tierLevel);
      return {
        ...prev,
        [featureId]: exists
          ? current.filter(t => t !== tierLevel)
          : [...current, tierLevel].sort((a, b) => a - b),
      };
    });
  };

  // ── Save matrix + free tier ────────────────────────────────────────────────
  const saveMatrix = useMutation({
    mutationFn: async () => {
      await adminApi.post("/api/admin/seo-feature-matrix", {
        matrix,
        freeTier,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "seo-matrix"] });
    },
  });

  // ── Tier CRUD mutations ────────────────────────────────────────────────────
  const deleteTier = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.delete(`/api/admin/seo-tiers/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "seo-tiers"] });
    },
  });

  // ── UI state ──────────────────────────────────────────────────────────────
  const [editTier, setEditTier] = useState<SeOTier | null | undefined>(undefined);
  const [showCreateTier, setShowCreateTier] = useState(false);
  const [showMatrix, setShowMatrix] = useState(true);
  const isLoading = tiersLoading || matrixLoading;

  const hasTiers = tiers.length > 0;
  const hasFeatures = features.length > 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 4 }}>
            🔍 Gói SEO
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
            {hasTiers ? `${tiers.length} gói đang hoạt động` : "Chưa có gói SEO"} ·{" "}
            {hasFeatures ? `${features.length} tính năng` : "Chưa có tính năng"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { refetchTiers(); refetchMatrix(); refetchFeatures(); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} /> Làm mới
          </button>
          <button
            onClick={() => setShowCreateTier(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
          >
            <Plus size={14} /> Thêm gói SEO
          </button>
        </div>
      </div>

      {/* ── Tier Cards ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <Target size={16} style={{ color: DS.amber }} />
          Cấu hình gói SEO ({tiers.length} gói)
        </h3>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
            <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.amber}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : !hasTiers ? (
          <div style={{ textAlign: "center", padding: "2rem", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, color: DS.text4 }}>
            <p style={{ fontSize: 14, marginBottom: 8 }}>Chưa có gói SEO nào</p>
            <p style={{ fontSize: 12, fontFamily: DS.mono }}>Nhấn "Thêm gói SEO" để tạo gói đầu tiên</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(tiers.length, 4)}, 1fr)`, gap: 12 }}>
            {tiers.map(tier => {
              const color = TIER_COLORS[tier.level] ?? "#94A3B8";
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: tier.isActive ? `${color}08` : DS.bgCard2,
                    border: `1px solid ${tier.isActive ? `${color}30` : DS.border}`,
                    borderRadius: 14, padding: 16, opacity: tier.isActive ? 1 : 0.6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                      <span style={{ color, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>LEVEL {tier.level}</span>
                    </div>
                    {!tier.isActive && <span style={{ color: DS.red, fontSize: 10, fontFamily: DS.mono }}>TẮT</span>}
                  </div>
                  <h4 style={{ color: DS.text, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{tier.name}</h4>
                  <p style={{ color: DS.text4, fontSize: 10, marginBottom: 8, lineHeight: 1.4 }}>{tier.shortDesc}</p>
                  <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: DS.heading, marginBottom: 2 }}>
                    {fmtVND(tier.basePrice)}
                    <span style={{ color: DS.text4, fontSize: 11, fontWeight: 400 }}>/tháng</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    <button onClick={() => setEditTier(tier)}
                      style={{ flex: 1, padding: "6px", background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 8, cursor: "pointer", color, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <Edit2 size={11} /> Sửa
                    </button>
                    <button onClick={() => { if (confirm(`Xóa gói "${tier.name}"?`)) deleteTier.mutate(tier.id); }}
                      style={{ padding: "6px 8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, cursor: "pointer", color: DS.red, display: "flex", alignItems: "center" }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Free Tier Config ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <Gift size={16} style={{ color: DS.green }} />
          Gói Khởi động (Miễn phí — Tặng kèm website)
        </h3>
        <FreeTierSection
          freeTier={freeTier}
          onSave={setFreeTier}
        />
      </div>

      {/* ── Feature Matrix ────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Layers size={16} style={{ color: DS.purple }} />
          <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 14 }}>Ma trận tính năng</h3>
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: DS.text4, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: DS.mono }}
          >
            {showMatrix ? <EyeOff size={13} /> : <Eye size={13} />}
            {showMatrix ? "Ẩn" : "Hiện"}
          </button>
        </div>

        {!hasFeatures ? (
          <div style={{ textAlign: "center", padding: "2rem", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, color: DS.text4 }}>
            <p style={{ fontSize: 14, marginBottom: 8 }}>Chưa có tính năng SEO nào</p>
            <p style={{ fontSize: 12, fontFamily: DS.mono }}>Vào tab "Tính Năng SEO" để thêm tính năng trước</p>
          </div>
        ) : showMatrix ? (
          <FeatureMatrixSection
            features={features}
            tiers={tiers}
            matrix={matrix}
            onToggle={toggleCell}
            onSave={() => saveMatrix.mutate()}
            saving={saveMatrix.isPending}
          />
        ) : null}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateTier && (
          <TierModal
            tier={null}
            onClose={() => setShowCreateTier(false)}
            onSaved={() => setShowCreateTier(false)}
          />
        )}
        {editTier !== undefined && (
          <TierModal
            tier={editTier ?? null}
            onClose={() => setEditTier(undefined)}
            onSaved={() => setEditTier(undefined)}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
