"use client";

/**
 * PricingTab — Admin tab for managing Service Tiers
 * /admin/services → "Bảng Giá" tab
 * Manages: 4 services × 3 tiers (Basic/Business/Experience)
 */

import { useState, useMemo } from "react";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { qk } from "@/lib/query/provider";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { Plus, Edit2, Trash2, RefreshCw, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type ServiceTier = {
  id: string;
  serviceKey: string;
  level: number;
  name: string;
  nameEn?: string;
  shortDesc?: string;
  shortDescEn?: string;
  basePrice: number;
  marketPrice?: number;
  lpReward: number;
  sortOrder: number;
  isActive: boolean;
};

const SERVICE_KEYS = ["web", "app", "dashboard", "seo"] as const;
const TIER_LEVELS = [1, 2, 3] as const;
const TIER_LABELS: Record<number, string> = { 1: "Cơ Bản", 2: "Doanh Nghiệp", 3: "Chuyên Nghiệp" };
const TIER_COLORS: Record<string, string> = {
  web: "#3B82F6",
  app: "#8B5CF6",
  dashboard: "#EC4899",
  seo: "#F59E0B",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

// ── Tier Row ───────────────────────────────────────────────────────────────────

function TierRow({ tier, onEdit, onDelete }: { tier: ServiceTier; onEdit: (t: ServiceTier) => void; onDelete: (t: ServiceTier) => void }) {
  const _t = useAdminTranslations(); // t used for future admin translation keys
  const qc = useQueryClient();
  const color = TIER_COLORS[tier.serviceKey] ?? DS.blue;

  const toggleActive = useMutation({
    mutationFn: async () => {
      await adminApi.put<{ data: ServiceTier }>(`/api/admin/service-tiers/${tier.id}`, { isActive: !tier.isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminServiceTiers() }),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: DS.bgCard,
        border: `1px solid ${tier.isActive ? color + "30" : DS.border}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: tier.isActive ? 1 : 0.55,
      }}
    >
      {/* Level badge */}
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}15`,
        border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
          {tier.level === 1 ? "B" : tier.level === 2 ? "B2" : "E"}
        </span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
          <p style={{ color: DS.text, fontWeight: 700, fontSize: 14 }}>
            {tier.name}
          </p>
          {tier.nameEn && (
            <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>/ {tier.nameEn}</p>
          )}
        </div>
        {tier.shortDesc && (
          <p style={{ color: DS.text4, fontSize: 11, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {tier.shortDesc}
          </p>
        )}
      </div>

      {/* Price */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ color: color, fontFamily: DS.mono, fontSize: 14, fontWeight: 700 }}>{fmtVND(tier.basePrice)}</p>
        {tier.marketPrice && tier.marketPrice > tier.basePrice && (
          <p style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, textDecoration: "line-through" }}>
            {fmtVND(tier.marketPrice)}
          </p>
        )}
      </div>

      {/* LP */}
      <div style={{
        background: DS.bg, border: `1px solid ${DS.border}`,
        borderRadius: 8, padding: "4px 10px", textAlign: "center", flexShrink: 0,
      }}>
        <p style={{ color: DS.purple, fontSize: 12, fontWeight: 700 }}>◈ {tier.lpReward}</p>
        <p style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono }}>LP</p>
      </div>

      {/* Active toggle */}
      <button
        onClick={() => toggleActive.mutate()}
        disabled={toggleActive.isPending}
        style={{
          padding: "4px 10px", borderRadius: 9999,
          border: `1px solid ${tier.isActive ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
          background: tier.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          color: tier.isActive ? DS.green : DS.red,
          fontSize: 11, fontFamily: DS.mono, cursor: "pointer", fontWeight: 600, flexShrink: 0,
        }}
      >
        {tier.isActive ? "Active" : "Inactive"}
      </button>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onEdit(tier)}
          style={{
            background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 8,
            padding: "5px 10px", cursor: "pointer", color, display: "flex", alignItems: "center",
          }}
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={() => onDelete(tier)}
          style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8,
            padding: "5px 10px", cursor: "pointer", color: DS.red, display: "flex", alignItems: "center",
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Edit/Create Modal ─────────────────────────────────────────────────────────

function TierModal({ tier, serviceKey, defaultLevel, onClose, onSaved }: {
  tier?: ServiceTier | null;
  serviceKey?: string;
  defaultLevel?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  useAdminTranslations(); // i18n ready

  const [svcKey, setSvcKey] = useState(tier?.serviceKey ?? serviceKey ?? "web");
  const [level, setLevel] = useState(tier?.level ?? defaultLevel ?? 1);
  const [name, setName] = useState(tier?.name ?? "");
  const [nameEn, setNameEn] = useState(tier?.nameEn ?? "");
  const [shortDesc, setShortDesc] = useState(tier?.shortDesc ?? "");
  const [shortDescEn, setShortDescEn] = useState(tier?.shortDescEn ?? "");
  const [basePrice, setBasePrice] = useState(tier?.basePrice?.toString() ?? "");
  const [marketPrice, setMarketPrice] = useState(tier?.marketPrice?.toString() ?? "");
  const [lpReward, setLpReward] = useState(tier?.lpReward?.toString() ?? "50");
  const [sortOrder, setSortOrder] = useState(tier?.sortOrder?.toString() ?? "1");

  const isEdit = !!tier;

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        serviceKey: svcKey,
        level,
        name,
        nameEn: nameEn || undefined,
        shortDesc: shortDesc || undefined,
        shortDescEn: shortDescEn || undefined,
        basePrice: parseInt(basePrice) || 0,
        marketPrice: marketPrice ? parseInt(marketPrice) : undefined,
        lpReward: parseInt(lpReward) || 50,
        sortOrder: parseInt(sortOrder) || level,
        isActive: true,
      };
      if (isEdit) {
        await adminApi.put(`/api/admin/service-tiers/${tier.id}`, payload);
      } else {
        await adminApi.post("/api/admin/service-tiers", payload);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.adminServiceTiers() }); onSaved(); },
    onError: (err) => { alert(err instanceof Error ? err.message : "Lưu thất bại"); },
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
    borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: DS.body,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: DS.bgCard3,
          border: `1px solid ${DS.border}`,
          borderRadius: 16,
          padding: 24,
          width: "100%",
          maxWidth: 600,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: DS.text, fontWeight: 800, fontSize: 18, fontFamily: DS.heading }}>
            {isEdit ? "Sửa Gói Dịch Vụ" : "Tạo Gói Dịch Vụ"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Service + Level */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
              DỊCH VỤ *
            </label>
            <select value={svcKey} onChange={e => setSvcKey(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {SERVICE_KEYS.map(k => (
                <option key={k} value={k}>
                  {k === "web" ? "🌐 Website" : k === "app" ? "📱 App/SaaS" : k === "dashboard" ? "📊 Dashboard" : "🔍 SEO"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
              CẤP ĐỘ *
            </label>
            <select value={level} onChange={e => { setLevel(parseInt(e.target.value)); setSortOrder(e.target.value); }} style={{ ...inputStyle, cursor: "pointer" }}>
              {TIER_LEVELS.map(l => (
                <option key={l} value={l}>{TIER_LABELS[l]} (Level {l})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Name VI + EN */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
              TÊN GÓI (TIẾNG VIỆT) *
            </label>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Cơ Bản" />
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
              TÊN GÓI (ENGLISH)
            </label>
            <input value={nameEn} onChange={e => setNameEn(e.target.value)} style={inputStyle} placeholder="Basic" />
          </div>
        </div>

        {/* Short desc VI + EN */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
            MÔ TẢ NGẮN (TIẾNG VIỆT)
          </label>
          <textarea value={shortDesc} onChange={e => setShortDesc(e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} placeholder="Phù hợp khởi nghiệp..." />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
            SHORT DESCRIPTION (ENGLISH)
          </label>
          <textarea value={shortDescEn} onChange={e => setShortDescEn(e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} placeholder="Perfect for startups..." />
        </div>

        {/* Price + Market Price */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
              GIÁ GỐC (VNĐ) *
            </label>
            <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} style={inputStyle} placeholder="3890000" />
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
              GIÁ THỊ TRƯỜNG (VNĐ)
            </label>
            <input type="number" value={marketPrice} onChange={e => setMarketPrice(e.target.value)} style={inputStyle} placeholder="5500000" />
          </div>
        </div>

        {/* LP + Sort */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
              LP THƯỞNG
            </label>
            <input type="number" value={lpReward} onChange={e => setLpReward(e.target.value)} style={inputStyle} placeholder="50" />
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
              SORT ORDER
            </label>
            <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => save.mutate()}
            disabled={!name || !basePrice || save.isPending}
            style={{
              flex: 1, padding: "10px", background: GRD.primary, color: "#fff",
              border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
              opacity: (!name || !basePrice || save.isPending) ? 0.6 : 1,
            }}
          >
            {save.isPending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo gói"}
          </button>
          <button onClick={onClose} style={{
            padding: "10px 16px", background: "transparent", border: `1px solid ${DS.border}`,
            color: DS.text3, borderRadius: 10, cursor: "pointer", fontSize: 13,
          }}>
            Hủy
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────────

function DeleteModal({ tier, onClose, onDeleted }: { tier: ServiceTier; onClose: () => void; onDeleted: () => void }) {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: async () => {
      await adminApi.delete(`/api/admin/service-tiers/${tier.id}`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.adminServiceTiers() }); onDeleted(); },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: DS.bgCard3, border: `1px solid rgba(239,68,68,0.3)`,
          borderRadius: 16, padding: 24, width: "100%", maxWidth: 400,
        }}
      >
        <h3 style={{ color: DS.red, fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
          Xóa Gói Dịch Vụ?
        </h3>
        <p style={{ color: DS.text3, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
          Bạn đang xóa gói <strong style={{ color: DS.text }}>{tier.name}</strong> ({tier.serviceKey} — Level {tier.level}). Hành động này không thể hoàn tác.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => del.mutate()}
            disabled={del.isPending}
            style={{
              flex: 1, padding: "10px", background: "rgba(239,68,68,0.15)", color: DS.red,
              border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, cursor: "pointer", fontWeight: 700,
            }}
          >
            {del.isPending ? "Đang xóa..." : "Xóa"}
          </button>
          <button onClick={onClose} style={{
            padding: "10px 16px", background: "transparent", border: `1px solid ${DS.border}`,
            color: DS.text3, borderRadius: 10, cursor: "pointer",
          }}>
            Hủy
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── PricingTab Root ────────────────────────────────────────────────────────────

export function PricingTab() {
  useAdminTranslations(); // i18n ready — add t() calls as admin translation keys are added
  const qc = useQueryClient();

  // Service key filter — group by service
  const [activeServiceKey, setActiveServiceKey] = useState<string>("web");
  const [editTier, setEditTier] = useState<ServiceTier | null | undefined>(undefined);
  const [deleteTier, setDeleteTier] = useState<ServiceTier | null>(null);
  const [showCreateForService, setShowCreateForService] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.adminServiceTiers(),
    queryFn: async () => {
      const res = await adminApi.get<{ data: ServiceTier[] }>("/api/admin/service-tiers");
      return res;
    },
  });

  const allTiers = data?.data ?? [];

  // Group tiers by serviceKey
  const tiersByService = useMemo(() => {
    const map: Record<string, ServiceTier[]> = {};
    for (const key of SERVICE_KEYS) {
      map[key] = allTiers.filter(t => t.serviceKey === key).sort((a, b) => a.level - b.level);
    }
    return map;
  }, [allTiers]);

  const activeTiers = tiersByService[activeServiceKey] ?? [];

  // Stats
  const totalActive = allTiers.filter(t => t.isActive).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 2 }}>
            Cấu Hình Bảng Giá
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
            {totalActive} gói đang hoạt động · 4 dịch vụ × 3 cấp (Basic / Business / Experience)
          </p>
        </div>
        <button
          onClick={() => setShowCreateForService(activeServiceKey)}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
            background: GRD.primary, color: "#fff", border: "none",
            borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
          }}
        >
          <Plus size={14} /> Thêm Gói Mới
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
        {SERVICE_KEYS.map(key => {
          const tiers = tiersByService[key] ?? [];
          const active = tiers.filter(t => t.isActive).length;
          const color = TIER_COLORS[key];
          const label = key === "web" ? "Website" : key === "app" ? "App/SaaS" : key === "dashboard" ? "Dashboard" : "SEO";
          const icons: Record<string, string> = { web: "🌐", app: "📱", dashboard: "📊", seo: "🔍" };
          return (
            <button
              key={key}
              onClick={() => setActiveServiceKey(key)}
              style={{
                padding: "12px 14px", borderRadius: 12,
                background: activeServiceKey === key ? `${color}15` : DS.bgCard,
                border: `1px solid ${activeServiceKey === key ? color + "40" : DS.border}`,
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span>{icons[key]}</span>
                <span style={{ color: DS.text, fontWeight: 700, fontSize: 13 }}>{label}</span>
              </div>
              <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                {active}/{tiers.length} gói active
              </div>
            </button>
          );
        })}
      </div>

      {/* Active service tiers */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 15 }}>
            {activeServiceKey === "web" ? "🌐 Website" : activeServiceKey === "app" ? "📱 App/SaaS" : activeServiceKey === "dashboard" ? "📊 Dashboard" : "🔍 SEO"}
            {" — Bảng Giá"}
          </h3>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: qk.adminServiceTiers() })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, color: DS.text3, cursor: "pointer", fontSize: 11, fontFamily: DS.mono }}
          >
            <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Tier level header */}
        <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 80px 80px 80px auto", gap: 12, padding: "4px 16px", marginBottom: 4 }}>
          {["#", "GÓI", "GIÁ", "GIÁ THỊ TRƯỜNG", "LP", "TRẠNG THÁI"].map(h => (
            <span key={h} style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>{h}</span>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${TIER_COLORS[activeServiceKey]}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}

        {/* Tier list */}
        {!isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {activeTiers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontSize: 14 }}>
                Chưa có gói nào cho dịch vụ này
              </div>
            ) : (
              activeTiers.map(tier => (
                <TierRow key={tier.id} tier={tier} onEdit={setEditTier} onDelete={setDeleteTier} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Marketing hint */}
      <div style={{
        marginTop: 16, padding: "14px 16px", borderRadius: 12,
        background: `${DS.pink}08`, border: `1px solid ${DS.pink}20`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>💡</span>
        <div>
          <p style={{ color: DS.text2, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
            Mẹo: Khi tạo gói mới cho dịch vụ đã có đủ 3 cấp, hệ thống sẽ tự động hiển thị trên trang /booking.
          </p>
          <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
            PricingTab này điều khiển trực tiếp nội dung trang Bảng Giá công khai. Thay đổi có hiệu lực ngay.
          </p>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editTier !== undefined && (
          <TierModal
            tier={editTier}
            onClose={() => setEditTier(undefined)}
            onSaved={() => setEditTier(undefined)}
          />
        )}
        {deleteTier && (
          <DeleteModal
            tier={deleteTier}
            onClose={() => setDeleteTier(null)}
            onDeleted={() => setDeleteTier(null)}
          />
        )}
        {showCreateForService && (
          <TierModal
            serviceKey={showCreateForService}
            defaultLevel={(tiersByService[showCreateForService]?.length ?? 0) + 1}
            onClose={() => setShowCreateForService(null)}
            onSaved={() => setShowCreateForService(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
