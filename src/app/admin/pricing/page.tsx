"use client";

/**
 * Pricing Admin Page — LOOP Solutions
 * Route: /admin/pricing
 * Wire: /api/admin/pricing/settings + features + infra-tiers + packages + addons
 *
 * 5 tabs:
 *   1. Settings     — Base price, XP/LP rates, discount caps
 *   2. Features     — ServiceAttribute list + toggle + delete
 *   3. Infra Tiers  — InfrastructureTier list (read-only)
 *   4. Packages     — ServicePackage list + toggle (read-only create/edit)
 *   5. Add-ons      — AddonService list + toggle + delete
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import {
  Settings, Layers, Server, Package as PackageIcon, PlusCircle,
  Save, Trash2, RefreshCw, Loader2,
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
  category: string;
  categoryVi: string;
  price: number;
  isRequired: boolean;
  isActive: boolean;
  tier: string;
  sortOrder: number;
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

// ── Tab Config ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "settings",     label: "Cài đặt",          icon: <Settings size={14} /> },
  { key: "features",      label: "Tính năng",         icon: <Layers size={14} /> },
  { key: "infra-tiers",   label: "Hạ tầng",           icon: <Server size={14} /> },
  { key: "packages",     label: "Gói dịch vụ",        icon: <PackageIcon size={14} /> },
  { key: "addons",       label: "Dịch vụ thêm",       icon: <PlusCircle size={14} /> },
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
  const _qc = useQueryClient();

  const { data, isLoading, isFetching } = useQuery<{ data: PricingSetting[] }>({
    queryKey: ["admin", "pricing", "settings"],
    queryFn: () => adminApi.get("/api/admin/pricing/settings"),
  });

  const saveMutation = useMutation({
    mutationFn: async (settings: { key: string; value: string }[]) => {
      await adminApi.put("/api/admin/pricing/settings", { settings });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pricing", "settings"] }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Lưu thất bại"); },
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
  );
}

// ── Tab 2: Features ────────────────────────────────────────────────────────────

function FeaturesTab() {
  const _qc = useQueryClient();

  const { data, isLoading } = useQuery<{ data: Feature[]; pagination: { total: number } }>({
    queryKey: ["admin", "pricing", "features"],
    queryFn: () => adminApi.get<{ data: Feature[]; pagination: { total: number } }>("/api/admin/pricing/features"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await adminApi.delete(`/api/admin/pricing/features?id=${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pricing", "features"] }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Xóa thất bại"); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await adminApi.put(`/api/admin/pricing/features`, { id, isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pricing", "features"] }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Cập nhật thất bại"); },
  });

  const features: Feature[] = data?.data ?? [];

  const categories = [...new Set(features.map(f => f.categoryVi || f.category))];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h3 style={{ fontFamily: DS.heading, fontSize: 16, fontWeight: 700, color: DS.text, margin: "0 0 4px" }}>
            Tính năng dịch vụ
          </h3>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {data?.pagination?.total ?? 0} tính năng · {categories.length} danh mục
          </p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} style={{ color: DS.text4, animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {features.map(f => (
            <div key={f.id} style={{
              background: DS.bgCard,
              border: `1px solid ${f.isActive ? DS.border : DS.red + "44"}`,
              borderRadius: 12, padding: 14,
              opacity: f.isActive ? 1 : 0.6,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: DS.text, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{f.nameVi || f.name}</div>
                  <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>{f.slug}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {f.isRequired && (
                    <span style={{ fontSize: 9, fontFamily: DS.mono, color: DS.amber, background: "rgba(245,158,11,0.1)", borderRadius: 4, padding: "2px 6px" }}>Bắt buộc</span>
                  )}
                  <Toggle checked={f.isActive} onChange={() => toggleMutation.mutate({ id: f.id, isActive: !f.isActive })} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 10, color: DS.text4 }}>Danh mục: </span>
                  <span style={{ fontSize: 10, fontFamily: DS.mono, color: DS.text3 }}>{f.categoryVi || f.category}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontFamily: DS.mono, color: DS.blue, fontWeight: 600 }}>
                    +{fmtVND(f.price)}
                  </span>
                  <button
                    onClick={() => { if (confirm("Xóa tính năng này?")) deleteMutation.mutate(f.id); }}
                    style={{ color: DS.text4, background: "none", border: "none", cursor: "pointer", padding: 4 }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
  const _qc = useQueryClient();

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
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Cập nhật thất bại"); },
  });

  return (
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
  );
}

// ── Tab 5: Add-ons ──────────────────────────────────────────────────────────────

function AddonsTab() {
  const _qc = useQueryClient();

  const { data, isLoading } = useQuery<{ data: Addon[]; pagination: { total: number } }>({
    queryKey: ["admin", "pricing", "addons"],
    queryFn: () => adminApi.get<{ data: Addon[]; pagination: { total: number } }>("/api/admin/pricing/addons"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await adminApi.delete(`/api/admin/pricing/addons?id=${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pricing", "addons"] }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Xóa thất bại"); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await adminApi.put(`/api/admin/pricing/addons`, { id, isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pricing", "addons"] }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Cập nhật thất bại"); },
  });

  const addons: Addon[] = data?.data ?? [];

  return (
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
