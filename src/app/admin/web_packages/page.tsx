"use client";

/**
 * Web Packages Admin Page — LOOP Solutions
 * Route: /admin/web_packages
 *
 * Tab 1: Gói Web (PricingWebPackage templates) — CRUD web package templates
 * Tab 2: Websites (CustomerWebsite) — Manage customer website purchases
 * - Domain + hosting purchase approvals
 * - Vercel deployment info
 * - Expiry tracking
 * - Auto-renew management
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { DrawerShell as SlideDrawer } from "@/components/admin/DrawerShell";
import {
  Plus, Edit3, Save, X, Search, ToggleRight, ToggleLeft,
  CheckCircle2, ArrowUpDown, Package, DollarSign,
  PlusCircle, RefreshCw, Globe, Server, CheckCircle,
  AlertCircle, Clock, ExternalLink, RotateCcw, ShieldCheck, Rocket,
  Loader2, List, ChevronRight, ChevronDown, Trash2, ChevronLeft,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ApiPackage = {
  id: string;
  slug: string;
  title: string;
  titleVi?: string;
  shortDesc: string;
  shortDescVi?: string;
  tagline?: string;
  taglineVi?: string;
  price?: number;
  priceText?: string;
  features: string[];
  color?: string;
  pages?: string;
  pagesVi?: string;
  marketPrice?: number;
  isPopular?: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  name?: string;
  nameVi?: string;
  shortDesc2?: string;
  activateTime?: string;
  lp?: number;
  cta?: string;
  ctaVi?: string;
  orderCount?: number;
  revenue?: number;
  [key: string]: unknown;
};

type WebPackage = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  industry: string;
  icon: string;
  color: string;
  tagline: string;
  taglineVi: string;
  description: string;
  category: string;
  fullPrice: number;
  price: number;
  activateTime: string;
  lp: number;
  badge: string;
  badgeColor: string;
  features: string[];
  demoFeatures: string[];
  isPopular?: boolean;
  highlighted?: boolean;
  cta: string;
  ctaVi: string;
  pages: number;
  pagesVi: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  currency: string;
  period: string;
  periodVi: string;
  orderCount: number;
  revenue: number;
};

type CustomerWebsite = {
  id: string;
  orderId: string | null;
  packageId: string | null;
  domain: string | null;
  name: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  status: string;
  configStatus: string;
  registeredAt: string | null;
  domainTermMonths: number;
  domainCost: number;
  domainTld: string | null;
  hostingPlanId: string | null;
  hostingTermMonths: number;
  hostingCost: number;
  hostingPlan: { id: string; name: string; nameVi: string; slug: string } | null;
  vercelProjectId: string | null;
  vercelProjectUrl: string | null;
  autoRenewDomain: boolean;
  autoRenewHosting: boolean;
  domainExpiresAt: string | null;
  hostingExpiresAt: string | null;
  createdAt: string;
  ekycName: string | null;
};

// ── Default init data ─────────────────────────────────────────────────────────

const INIT_PACKAGES: WebPackage[] = [
  { id: "landing", slug: "landing", name: "Landing Page", nameVi: "Landing Page", industry: "Landing Page", icon: "🌐", color: "#6EB1A8", tagline: "Chiến dịch Marketing, giới thiệu cá nhân, offline", taglineVi: "Chiến dịch Marketing, giới thiệu cá nhân, offline", description: "", category: "website", fullPrice: 2500000, price: 1890000, activateTime: "2 giờ", lp: 0, badge: "", badgeColor: "#6EB1A8", currency: "VND", period: "one-time", periodVi: "Một lần", features: ["Giao diện Hiện đại, Responsive", "Tối ưu Trải nghiệm UI/UX", "Hỗ trợ chỉnh sửa sau bàn giao", "Trang giới thiệu SP/Dịch vụ", "Admin quản lý bài viết", "Form thu thập dữ liệu KH", "Quản lý tệp KH cơ bản", "Tối ưu SEO On-page"], demoFeatures: [], isPopular: false, cta: "Chọn gói", ctaVi: "Chọn gói", pages: 8, pagesVi: 8, sortOrder: 1, isActive: true, createdAt: "", orderCount: 0, revenue: 0 },
  { id: "ban-hang", slug: "ban-hang", name: "Bán Hàng Cơ Bản", nameVi: "Bán Hàng Cơ Bản", industry: "Bán Hàng Cơ Bản", icon: "🌐", color: "#3B82F6", tagline: "Shop online nhỏ & vừa, bắt đầu chuyển đổi số", taglineVi: "Shop online nhỏ & vừa, bắt đầu chuyển đổi số", description: "", category: "website", fullPrice: 5500000, price: 3890000, activateTime: "2 giờ", lp: 0, badge: "PHỔ BIẾN", badgeColor: "#3B82F6", currency: "VND", period: "one-time", periodVi: "Một lần", features: ["Bao gồm mọi tính năng Landing Page", "Danh mục & Chi tiết sản phẩm", "Chức năng Giỏ hàng thông minh", "Thống kê đơn hàng & Doanh thu", "Tài khoản Admin & Khách hàng", "Tặng 5 trang nội dung miễn phí"], demoFeatures: [], highlighted: true, cta: "Chọn gói", ctaVi: "Chọn gói", pages: 8, pagesVi: 8, sortOrder: 2, isActive: true, createdAt: "", orderCount: 0, revenue: 0 },
  { id: "doanh-nghiep", slug: "doanh-nghiep", name: "Quản Trị Doanh Nghiệp", nameVi: "Quản Trị Doanh Nghiệp", industry: "Quản Trị Doanh Nghiệp", icon: "🌐", color: "#8B5CF6", tagline: "Doanh nghiệp vừa và lớn, quản lý phức tạp", taglineVi: "Doanh nghiệp vừa và lớn, quản lý phức tạp", description: "", category: "website", fullPrice: 8900000, price: 5890000, activateTime: "2 giờ", lp: 0, badge: "", badgeColor: "#8B5CF6", currency: "VND", period: "one-time", periodVi: "Một lần", features: ["Bao gồm mọi tính năng Bán Hàng", "Giỏ hàng đa dịch vụ/sản phẩm", "SP nâng cao (size, màu, thuộc tính)", "Hệ thống Mã giảm giá/Flash sale", "Tích điểm & Đổi quà thành viên", "Bộ lọc & Tìm kiếm AI thông minh", "Quản lý Kho hàng & Nhà cung cấp"], demoFeatures: [], isPopular: false, cta: "Chọn gói", ctaVi: "Chọn gói", pages: 8, pagesVi: 8, sortOrder: 3, isActive: true, createdAt: "", orderCount: 0, revenue: 0 },
  { id: "yeu-cau", slug: "yeu-cau", name: "Theo Yêu Cầu", nameVi: "Theo Yêu Cầu", industry: "Theo Yêu Cầu", icon: "🌐", color: "#EC4899", tagline: "Startups, platform, logic đặc thù riêng", taglineVi: "Startups, platform, logic đặc thù riêng", description: "", category: "website", fullPrice: 12000000, price: 7890000, activateTime: "2 giờ", lp: 0, badge: "", badgeColor: "#EC4899", currency: "VND", period: "one-time", periodVi: "Một lần", features: ["Bao gồm mọi tính năng Doanh Nghiệp", "UI/UX Độc quyền (Không mẫu)", "Tùy chỉnh chức năng Core System", "Tích hợp Cổng thanh toán/Vận chuyển", "API kết nối bên thứ 3 (Zalo, App...)", "Bảo mật đa lớp & Tối ưu Speed cực hạn"], demoFeatures: [], isPopular: false, cta: "Chọn gói", ctaVi: "Chọn gói", pages: 8, pagesVi: 8, sortOrder: 4, isActive: true, createdAt: "", orderCount: 0, revenue: 0 },
];

const CATEGORIES = ["ăn uống", "sức khỏe", "lưu trú", "mua sắm", "giáo dục", "bất động sản"];
const COLORS = ["#3B82F6", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444", "#14B8A6", "#EC4899", "#C084FC", "#06B6D4", "#D97706"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toUIPackage(p: ApiPackage): WebPackage {
  return {
    id: p.id,
    slug: p.slug ?? p.id,
    name: p.name ?? p.nameVi ?? "",
    nameVi: p.nameVi ?? p.name ?? "",
    industry: p.title ?? p.name ?? "",
    icon: "🌐",
    color: p.color ?? "#3B82F6",
    tagline: p.tagline ?? p.taglineVi ?? "",
    taglineVi: p.taglineVi ?? p.tagline ?? "",
    description: p.shortDesc ?? "",
    category: "website",
    fullPrice: p.price ?? 0,
    price: (p as Record<string, unknown>).marketPrice as number ?? p.price ?? 0,
    activateTime: String((p as Record<string, unknown>).activateTime ?? "2 giờ"),
    lp: Number((p as Record<string, unknown>).lp ?? 500),
    badge: (p.isPopular ?? false) ? "PHỔ BIẾN" : "",
    badgeColor: p.color ?? "#3B82F6",
    features: p.features ?? [],
    demoFeatures: [],
    highlighted: p.isPopular ?? false,
    cta: p.cta ?? "Chọn gói",
    ctaVi: p.ctaVi ?? p.cta ?? "Chọn gói",
    pages: Number(p.pages ?? 0),
    pagesVi: Number(p.pagesVi ?? p.pages ?? 0),
    sortOrder: p.sortOrder ?? 0,
    isActive: p.isActive ?? true,
    createdAt: p.createdAt ?? "",
    currency: "VND",
    period: "one-time",
    periodVi: "Một lần",
    orderCount: Number((p as Record<string, unknown>).orderCount ?? 0),
    revenue: Number((p as Record<string, unknown>).revenue ?? 0),
  };
}

function formToApiPayload(form: Partial<WebPackage>): Record<string, unknown> {
  const slug = form.slug ?? (form.industry ?? form.name ?? "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return {
    slug,
    name: form.industry ?? form.name ?? "",
    nameVi: form.industry ?? form.name ?? "",
    tagline: form.tagline ?? "",
    taglineVi: form.tagline ?? "",
    price: form.price ?? 0,
    marketPrice: form.fullPrice ?? form.price ?? 0,
    currency: "VND",
    period: "one-time",
    periodVi: "Một lần",
    isPopular: false,
    cta: "Chọn gói",
    ctaVi: "Chọn gói",
    color: form.color ?? "#3B82F6",
    pages: 8,
    pagesVi: 8,
    sortOrder: form.sortOrder ?? 0,
    isActive: form.isActive ?? true,
  };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const CONFIG_STATUS_COLORS: Record<string, string> = {
  pending_config: "#F59E0B",
  configured: "#22C55E",
  delivered: "#3B82F6",
  cancelled: "#EF4444",
};
const CONFIG_STATUS_LABELS: Record<string, string> = {
  pending_config: "Chờ duyệt",
  configured: "Đã cấu hình",
  delivered: "Đã bàn giao",
  cancelled: "Đã hủy",
};
const STATUS_COLORS: Record<string, string> = {
  active: "#22C55E",
  inactive: "#6B7280",
  cancelled: "#EF4444",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: DS.bgCard2,
  border: `1px solid ${DS.border}`,
  borderRadius: 10,
  padding: "9px 12px",
  color: DS.text,
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        color: DS.text5, fontSize: 10, fontFamily: DS.mono,
        display: "block", marginBottom: 6, letterSpacing: "0.1em",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Drawer Shell ────────────────────────────────────────────────────────────────

function DrawerShell({
  children,
  title,
  subtitle,
  accentColor = DS.blue,
  isOpen,
  onClose,
  footer,
  loading = false,
  maxWidth = 560,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  accentColor?: string;
  isOpen: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
  loading?: boolean;
  maxWidth?: number;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99990, display: "flex", justifyContent: "flex-end" }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
              width: "100%", maxWidth,
              background: DS.bg,
              borderLeft: `1px solid ${DS.border}`,
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              zIndex: 99991,
              boxShadow: "-10px 0 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${DS.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: DS.bgCard,
              flexShrink: 0,
            }}>
              <div>
                <div style={{
                  color: accentColor,
                  fontSize: 10,
                  fontFamily: DS.mono,
                  letterSpacing: "0.12em",
                  marginBottom: 2,
                }}>
                  {title}
                </div>
                {subtitle && (
                  <div style={{ color: DS.text3, fontSize: 14, fontFamily: DS.heading }}>
                    {subtitle}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  color: DS.text3,
                  cursor: "pointer",
                  padding: 8,
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "50%",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Loading overlay */}
            {loading && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 10,
                background: "rgba(2,6,23,0.7)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                borderRadius: 0,
              }}>
                <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: accentColor }} />
                <div style={{ color: DS.text3, fontFamily: DS.mono, fontSize: 11, marginTop: 12 }}>
                  Đang lưu...
                </div>
              </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div style={{
                padding: "16px 24px",
                borderTop: `1px solid ${DS.border}`,
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                background: DS.bgCard,
                flexShrink: 0,
              }}>
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Drawer: Edit Package ──────────────────────────────────────────────────────

function EditPackageDrawer({
  pkg,
  isOpen,
  onClose,
  onSave,
  isMutating,
  featureNameMap,
}: {
  pkg: WebPackage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<WebPackage>) => void;
  isMutating: boolean;
  featureNameMap?: Map<string, string>;
}) {
  const [form, setForm] = useState({
    industry: "",
    tagline: "",
    fullPrice: 0,
    activateTime: "2 giờ",
    lp: 500,
    badge: "",
    features: "",
    demoFeatures: "",
  });

  useEffect(() => {
    if (pkg) {
      // Resolve CUIDs to readable feature names for display
      const resolvedFeatures = (pkg.features || []).map(f => {
        if (featureNameMap?.has(f)) return featureNameMap.get(f)!;
        // If it looks like a CUID, show truncated + warning
        if (f.length > 16) return `[${f.slice(0, 8)}…]`;
        return f;
      }).join("\n");
      setForm({
        industry: pkg.industry || pkg.name || "",
        tagline: pkg.tagline || "",
        fullPrice: pkg.fullPrice || pkg.price || 0,
        activateTime: pkg.activateTime || "2 giờ",
        lp: pkg.lp,
        badge: pkg.badge ?? "",
        features: resolvedFeatures,
        demoFeatures: (pkg.demoFeatures || []).join("\n"),
      });
    }
  }, [pkg, featureNameMap]);

  const handleSave = () => {
    if (!pkg) return;
    onSave({
      industry: form.industry,
      tagline: form.tagline,
      fullPrice: Number(form.fullPrice),
      price: Number(form.fullPrice),
      activateTime: form.activateTime,
      lp: Number(form.lp),
      badge: form.badge || undefined,
      badgeColor: pkg.badgeColor ?? pkg.color,
      features: form.features.split("\n").filter(Boolean),
      demoFeatures: form.demoFeatures.split("\n").filter(Boolean),
    });
  };

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      title={`── CHỈNH SỬA GÓI WEB`}
      subtitle={pkg?.industry || pkg?.name}
      accentColor={pkg?.color ?? DS.blue}
      loading={isMutating}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isMutating}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: `1px solid ${DS.border}`,
              background: "transparent",
              color: DS.text3,
              fontFamily: DS.heading,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isMutating || !form.industry.trim()}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: DS.blue,
              color: "#fff",
              fontFamily: DS.heading,
              fontSize: 13,
              fontWeight: 700,
              cursor: isMutating || !form.industry.trim() ? "not-allowed" : "pointer",
              opacity: isMutating ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {isMutating && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            Lưu thay đổi
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="TÊN GÓI WEB">
            <input
              value={form.industry}
              onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
              style={inputStyle}
              placeholder="Website Nhà hàng"
            />
          </Field>
          <Field label="BADGE (HOT, PREMIUM...)">
            <input
              value={form.badge}
              onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
              placeholder="Để trống nếu không có"
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="TAGLINE">
          <input
            value={form.tagline}
            onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
            style={inputStyle}
            placeholder="Mô tả ngắn gói web"
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="GIÁ FULL (VNĐ)">
            <input
              type="number"
              value={form.fullPrice}
              onChange={e => setForm(f => ({ ...f, fullPrice: Number(e.target.value) }))}
              style={inputStyle}
            />
          </Field>
          <Field label="LP THƯỞNG">
            <input
              type="number"
              value={form.lp}
              onChange={e => setForm(f => ({ ...f, lp: Number(e.target.value) }))}
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="TÍNH NĂNG ĐẦY ĐỦ (mỗi dòng 1 tính năng)">
          <textarea
            value={form.features}
            onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
            rows={5}
            style={{ ...inputStyle, resize: "vertical", fontFamily: DS.mono, fontSize: 12 }}
          />
        </Field>

        <Field label="TÍNH NĂNG DEMO (hiển thị trên card, tối đa 3 dòng)">
          <textarea
            value={form.demoFeatures}
            onChange={e => setForm(f => ({ ...f, demoFeatures: e.target.value }))}
            rows={2}
            style={{ ...inputStyle, resize: "none", fontFamily: DS.mono, fontSize: 12 }}
          />
        </Field>

        {/* Preview */}
        {pkg && (
          <div style={{
            padding: "1rem",
            borderRadius: 12,
            background: `${pkg.color}08`,
            border: `1px solid ${pkg.color}25`,
          }}>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 8 }}>XEM TRƯỚC</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 24 }}>{pkg.icon}</span>
              <div>
                <div style={{ color: pkg.color, fontSize: 13, fontWeight: 700 }}>{form.industry || pkg.industry || pkg.name}</div>
                <div style={{ color: DS.text5, fontSize: 11 }}>{form.tagline || pkg.tagline}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono }}>{pkg.pages || 8} trang</div>
                <div style={{ color: pkg.color, fontSize: 15, fontWeight: 800 }}>
                  {Number(form.fullPrice).toLocaleString("vi-VN")} VNĐ
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DrawerShell>
  );
}

// ── Drawer: Tier Feature Management ────────────────────────────────────────

type FeatureGroupWithFeatures = {
  id: string;
  groupName: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  features: Array<{
    id: string;
    featureName: string;
    category: string;
    sortOrder: number;
    includedTiers: number[];
  }>;
};

function TierFeatureDrawer({
  isOpen,
  tierLevel,
  groups,
  onSave,
  onClose,
  isMutating,
}: {
  isOpen: boolean;
  tierLevel: number;
  groups: FeatureGroupWithFeatures[];
  onSave: (changes: Array<{ featureId: string; includedTiers: number[] }>) => Promise<void>;
  onClose: () => void;
  isMutating?: boolean;
}) {
  // Local pending state: featureId → boolean (pending included state)
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [activeGroupId, setActiveGroupId] = useState<string>("");
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Reset all local state when drawer opens
  useEffect(() => {
    if (isOpen) {
      setPending({});
      setActiveGroupId(groups[0]?.id ?? "");
      setShowConfirmClose(false);
      setSaveError(null);
    }
  }, [isOpen, groups]);

  const tierName = WEB_TIERS.find(t => t.level === tierLevel)?.name ?? `Tier ${tierLevel}`;
  const tierColor = WEB_TIERS.find(t => t.level === tierLevel)?.color ?? DS.pink;
  const activeGroup = groups.find(g => g.id === activeGroupId);

  // Count of features changed in this tier
  const pendingCount = Object.keys(pending).length;

  // Effective included state: pending takes precedence, then original
  const effectiveIncluded = (feature: { id: string; includedTiers: number[] }) => {
    if (feature.id in pending) return pending[feature.id];
    return feature.includedTiers.includes(tierLevel);
  };

  const handleToggle = (featureId: string, included: boolean) => {
    setPending(prev => {
      if (prev[featureId] === included) {
        // Clicking the same value as pending → revert
        const next = { ...prev };
        delete next[featureId];
        return next;
      }
      return { ...prev, [featureId]: included };
    });
  };

  const handleSave = async () => {
    setSaveError(null);
    const changes = Object.entries(pending).map(([featureId, included]) => {
      const feature = groups.flatMap(g => g.features).find(f => f.id === featureId)!;
      const originalTiers = feature.includedTiers;
      const newTiers = included
        ? [...new Set([...originalTiers, tierLevel])].sort()
        : originalTiers.filter(t => t !== tierLevel);
      return { featureId, includedTiers: newTiers };
    });
    try {
      await onSave(changes);
      setPending({});
    } catch {
      setSaveError("Lưu thất bại. Vui lòng thử lại.");
    }
  };

  const handleClose = () => {
    if (pendingCount > 0) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleRevert = () => {
    setPending({});
    setShowConfirmClose(false);
  };

  return (
    <>
      {showConfirmClose && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: DS.bgCard, border: `1px solid ${DS.border}`,
            borderRadius: 16, padding: "24px 32px",
            maxWidth: 380, width: "100%", textAlign: "center",
          }}>
            <div style={{ color: DS.pink, fontSize: 28, marginBottom: 12 }}>
              <AlertCircle size={36} style={{ color: DS.pink }} />
            </div>
            <div style={{ color: DS.text, fontSize: 15, fontFamily: DS.heading, fontWeight: 700, marginBottom: 8 }}>
              Thay đổi chưa được lưu
            </div>
            <div style={{ color: DS.text3, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
              Bạn có <strong>{pendingCount}</strong> thay đổi chưa lưu. Hành động nào?
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => { setShowConfirmClose(false); onClose(); }}
                style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${DS.border}`, background: "transparent", color: DS.text3, fontFamily: DS.heading, fontSize: 13, cursor: "pointer" }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleRevert}
                style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: `${DS.pink}20`, color: DS.pink, fontFamily: DS.heading, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Bỏ thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      <DrawerShell
        isOpen={isOpen}
        onClose={handleClose}
        title={`── QUẢN LÝ TÍNH NĂNG`}
        subtitle={tierName}
        accentColor={tierColor}
        loading={isMutating}
        footer={
          <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
            {saveError && (
              <div style={{ flex: 1, color: DS.red, fontSize: 12, fontFamily: DS.mono }}>
                {saveError}
              </div>
            )}
            <button
              onClick={handleClose}
              disabled={isMutating}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: `1px solid ${DS.border}`,
                background: "transparent",
                color: DS.text3,
                fontFamily: DS.heading,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Hủy
            </button>
            <button
              onClick={handleRevert}
              disabled={isMutating || pendingCount === 0}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: `1px solid ${DS.border}`,
                background: "transparent",
                color: pendingCount > 0 ? DS.amber : DS.text5,
                fontFamily: DS.heading,
                fontSize: 13,
                cursor: pendingCount > 0 ? "pointer" : "not-allowed",
                opacity: pendingCount > 0 ? 1 : 0.5,
              }}
            >
              Hoàn tác
            </button>
            <button
              onClick={handleSave}
              disabled={isMutating || pendingCount === 0}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                background: pendingCount > 0 ? tierColor : `${tierColor}40`,
                color: "#fff",
                fontFamily: DS.heading,
                fontSize: 13,
                fontWeight: 700,
                cursor: pendingCount > 0 ? "pointer" : "not-allowed",
                opacity: isMutating ? 0.7 : 1,
                minWidth: 160,
              }}
            >
              {isMutating ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  Đang lưu...
                </span>
              ) : pendingCount > 0 ? (
                `Lưu ${pendingCount} thay đổi`
              ) : (
                "Không có thay đổi"
              )}
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", height: "100%", gap: 0 }}>
          {/* Sidebar: group list */}
          <div style={{
            width: 180,
            borderRight: `1px solid ${DS.border}`,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            paddingRight: 8,
            flexShrink: 0,
          }}>
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, padding: "8px 8px 4px", letterSpacing: 1 }}>
              NHÓM TÍNH NĂNG
            </div>
            {groups.map(g => {
              const isActive = g.id === activeGroupId;
              const totalFeatures = g.features.length;
              const inThisTier = g.features.filter(f => effectiveIncluded(f)).length;
              const changed = g.features.filter(f => f.id in pending).length;
              return (
                <button
                  key={g.id}
                  onClick={() => setActiveGroupId(g.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    background: isActive ? `${tierColor}18` : "transparent",
                    borderLeft: `3px solid ${isActive ? tierColor : "transparent"}`,
                    textAlign: "left",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = DS.bgCard3;
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  <div>
                    <div style={{
                      color: isActive ? tierColor : changed > 0 ? DS.amber : DS.text3,
                      fontSize: 11,
                      fontWeight: isActive ? 700 : 500,
                      fontFamily: DS.heading,
                    }}>
                      {g.groupName}
                    </div>
                    <div style={{ color: changed > 0 ? DS.amber : DS.text5, fontSize: 9, fontFamily: DS.mono, marginTop: 2 }}>
                      {changed > 0 ? `● ${changed} thay đổi` : `${inThisTier}/${totalFeatures}`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Content: feature list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 8px 8px",
              position: "sticky",
              top: 0,
              background: DS.bg,
              zIndex: 1,
            }}>
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: 1 }}>
                {activeGroup?.groupName ?? "TÍNH NĂNG"}
              </div>
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>
                {activeGroup?.features.length ?? 0} tính năng
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {activeGroup?.features.map(f => {
                const isIncluded = effectiveIncluded(f);
                const isPending = f.id in pending;
                return (
                  <div
                    key={f.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: `1px solid ${isPending ? DS.amber + "60" : isIncluded ? tierColor + "30" : DS.border}`,
                      background: isIncluded ? `${tierColor}08` : "transparent",
                      transition: "all 0.12s",
                    }}
                  >
                    <button
                      onClick={() => handleToggle(f.id, !isIncluded)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        border: `2px solid ${isIncluded ? tierColor : DS.text5}`,
                        background: isIncluded ? tierColor : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        transition: "all 0.12s",
                      }}
                    >
                      {isIncluded && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: isIncluded ? DS.text : DS.text3,
                        fontSize: 12,
                        fontFamily: DS.heading,
                        fontWeight: isIncluded ? 600 : 400,
                      }}>
                        {f.featureName}
                      </div>
                    </div>

                    {/* Tier chips */}
                    <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                      {[1, 2, 3, 4].map(t => (
                        <span
                          key={t}
                          style={{
                            fontSize: 8,
                            fontFamily: DS.mono,
                            fontWeight: 700,
                            padding: "1px 4px",
                            borderRadius: 4,
                            background: f.includedTiers.includes(t) ? `${WEB_TIERS.find(wt => wt.level === t)?.color ?? DS.text5}20` : `${DS.text5}10`,
                            color: f.includedTiers.includes(t) ? (WEB_TIERS.find(wt => wt.level === t)?.color ?? DS.text5) : DS.text5,
                            border: `1px solid ${f.includedTiers.includes(t) ? `${WEB_TIERS.find(wt => wt.level === t)?.color ?? DS.text5}40` : "transparent"}`,
                          }}
                        >
                          T{t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DrawerShell>
    </>
  );
}

// ── Drawer: Add Package ───────────────────────────────────────────────────────

function AddPackageDrawer({
  isOpen,
  onClose,
  onAdd,
  isMutating,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: Partial<WebPackage>) => void;
  isMutating: boolean;
}) {
  const [form, setForm] = useState({
    industry: "",
    icon: "🌐",
    tagline: "",
    category: "ăn uống",
    fullPrice: 9_900_000,
    lp: 500,
    badge: "",
    color: "#3B82F6",
    features: "",
    demoFeatures: "",
  });

  const handleAdd = () => {
    if (!form.industry.trim()) return;
    onAdd({
      industry: form.industry,
      icon: form.icon,
      tagline: form.tagline,
      category: form.category,
      fullPrice: form.fullPrice,
      price: form.fullPrice,
      lp: form.lp,
      badge: form.badge || undefined,
      badgeColor: form.color,
      color: form.color,
      features: form.features.split("\n").filter(Boolean),
      demoFeatures: form.demoFeatures.split("\n").filter(Boolean),
      isActive: true,
    });
  };

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      title="── THÊM GÓI WEB MỚI"
      subtitle="Tạo loại website mới"
      accentColor={DS.blue}
      loading={isMutating}
      maxWidth={520}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isMutating}
            style={{
              flex: 1,
              padding: "10px 20px",
              borderRadius: 8,
              border: `1px solid ${DS.border}`,
              background: "transparent",
              color: DS.text3,
              fontFamily: DS.heading,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleAdd}
            disabled={isMutating || !form.industry.trim()}
            style={{
              flex: 2,
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: GRD.primary,
              color: "#fff",
              fontFamily: DS.heading,
              fontSize: 13,
              fontWeight: 700,
              cursor: isMutating || !form.industry.trim() ? "not-allowed" : "pointer",
              opacity: isMutating ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isMutating && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            Thêm gói web
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <Field label="TÊN GÓI WEB">
            <input
              value={form.industry}
              onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
              placeholder="Website Nhà hàng"
              style={inputStyle}
            />
          </Field>
          <Field label="ICON (EMOJI)">
            <input
              value={form.icon}
              onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              placeholder="🍽️"
              style={{ ...inputStyle, fontSize: 20, textAlign: "center" }}
            />
          </Field>
        </div>

        <Field label="MÀU SẮC CHÍNH">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setForm(f => ({ ...f, color: c }))}
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: c,
                  border: `3px solid ${form.color === c ? "#fff" : "transparent"}`,
                  cursor: "pointer",
                  boxShadow: form.color === c ? `0 0 8px ${c}` : "none",
                }}
              />
            ))}
          </div>
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="DANH MỤC">
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="BADGE (TÙY CHỌN)">
            <input
              value={form.badge}
              onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
              placeholder="HOT, NEW..."
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="TAGLINE">
          <input
            value={form.tagline}
            onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
            placeholder="Tính năng 1 · Tính năng 2 · Tính năng 3"
            style={inputStyle}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="GIÁ FULL (VNĐ)">
            <input
              type="number"
              value={form.fullPrice}
              onChange={e => setForm(f => ({ ...f, fullPrice: Number(e.target.value) }))}
              style={inputStyle}
            />
          </Field>
          <Field label="LP THƯỞNG">
            <input
              type="number"
              value={form.lp}
              onChange={e => setForm(f => ({ ...f, lp: Number(e.target.value) }))}
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="TÍNH NĂNG (mỗi dòng 1 tính năng)">
          <textarea
            value={form.features}
            onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
            rows={3}
            placeholder={"Giao diện Responsive\nTối ưu SEO\nAdmin quản lý..."}
            style={{ ...inputStyle, resize: "vertical", fontFamily: DS.mono, fontSize: 12 }}
          />
        </Field>

        <Field label="TÍNH NĂNG DEMO (tối đa 3 dòng, hiển thị trên card)">
          <textarea
            value={form.demoFeatures}
            onChange={e => setForm(f => ({ ...f, demoFeatures: e.target.value }))}
            rows={2}
            placeholder={"Nhận báo giá\nQuản lý\nBáo cáo"}
            style={{ ...inputStyle, resize: "none", fontFamily: DS.mono, fontSize: 12 }}
          />
        </Field>
      </div>
    </DrawerShell>
  );
}

// ── Drawer: Confirm Domain ─────────────────────────────────────────────────────

function ConfirmDomainDrawer({
  website,
  isOpen,
  onClose,
  onConfirm,
  isMutating,
}: {
  website: CustomerWebsite | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { registeredAt: string; domainExpiresAt: string; hostingExpiresAt: string }) => void;
  isMutating: boolean;
}) {
  const now = new Date();
  const defaultDomainExpiry = new Date(now);
  defaultDomainExpiry.setMonth(defaultDomainExpiry.getMonth() + (website?.domainTermMonths || 12));
  const defaultHostingExpiry = new Date(now);
  defaultHostingExpiry.setMonth(defaultHostingExpiry.getMonth() + (website?.hostingTermMonths || 12));

  const [registeredAt, setRegisteredAt] = useState(now.toISOString().split("T")[0]);
  const [domainExpiresAt, setDomainExpiresAt] = useState(defaultDomainExpiry.toISOString().split("T")[0]);
  const [hostingExpiresAt, setHostingExpiresAt] = useState(defaultHostingExpiry.toISOString().split("T")[0]);

  useEffect(() => {
    if (website) {
      const now2 = new Date();
      setRegisteredAt(now2.toISOString().split("T")[0]);
      const d1 = new Date(now2);
      d1.setMonth(d1.getMonth() + (website.domainTermMonths || 12));
      const d2 = new Date(now2);
      d2.setMonth(d2.getMonth() + (website.hostingTermMonths || 12));
      setDomainExpiresAt(d1.toISOString().split("T")[0]);
      setHostingExpiresAt(d2.toISOString().split("T")[0]);
    }
  }, [website]);

  const handleConfirm = () => {
    if (!website) return;
    onConfirm({ registeredAt, domainExpiresAt, hostingExpiresAt });
  };

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      title="── XÁC NHẬN ĐĂNG KÝ DOMAIN"
      subtitle={website?.domain ?? undefined}
      accentColor={DS.green}
      loading={isMutating}
      maxWidth={480}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isMutating}
            style={{
              flex: 1,
              padding: "10px 20px",
              borderRadius: 8,
              border: `1px solid ${DS.border}`,
              background: "transparent",
              color: DS.text3,
              fontFamily: DS.heading,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={isMutating}
            style={{
              flex: 2,
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: DS.green,
              color: "#fff",
              fontFamily: DS.heading,
              fontSize: 13,
              fontWeight: 700,
              cursor: isMutating ? "not-allowed" : "pointer",
              opacity: isMutating ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isMutating && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            <ShieldCheck size={14} />
            Xác nhận domain
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Domain info */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: "0.75rem",
          background: DS.bgCard2,
          borderRadius: 10,
          border: `1px solid ${DS.border}`,
        }}>
          <div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>TÊN MIỀN</div>
            <div style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{website?.domain || "—"}</div>
          </div>
          <div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>TLD</div>
            <div style={{ color: DS.text, fontSize: 13 }}>{website?.domainTld || "—"}</div>
          </div>
          <div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>TERM</div>
            <div style={{ color: DS.text, fontSize: 13 }}>{website?.domainTermMonths || 12} tháng</div>
          </div>
          <div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>CHI PHÍ</div>
            <div style={{ color: DS.green, fontSize: 13, fontWeight: 600 }}>
              {(website?.domainCost || 0).toLocaleString("vi-VN")} VNĐ
            </div>
          </div>
        </div>

        <Field label="NGÀY ĐĂNG KÝ THỰC TẾ">
          <input
            type="date"
            value={registeredAt}
            onChange={e => setRegisteredAt(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="HẾT HẠN DOMAIN">
            <input
              type="date"
              value={domainExpiresAt}
              onChange={e => setDomainExpiresAt(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="HẾT HẠN HOSTING">
            <input
              type="date"
              value={hostingExpiresAt}
              onChange={e => setHostingExpiresAt(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        <div style={{
          padding: "0.75rem",
          borderRadius: 10,
          background: `${DS.green}08`,
          border: `1px solid ${DS.green}20`,
        }}>
          <div style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono }}>Sau khi xác nhận:</div>
          <ul style={{ color: DS.text4, fontSize: 11, margin: "4px 0 0 16px", padding: 0 }}>
            <li>Domain được đánh dấu là đã đăng ký thực tế</li>
            <li>Notification gửi cho khách hàng</li>
            <li>Website chuyển sang trạng thái chờ cấu hình Vercel</li>
          </ul>
        </div>
      </div>
    </DrawerShell>
  );
}

// ── Drawer: Configure Done ─────────────────────────────────────────────────────

function ConfigureDoneDrawer({
  website,
  isOpen,
  onClose,
  onConfirm,
  isMutating,
}: {
  website: CustomerWebsite | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { vercelProjectUrl?: string }) => void;
  isMutating: boolean;
}) {
  const [vercelUrl, setVercelUrl] = useState("");

  useEffect(() => {
    setVercelUrl(website?.vercelProjectUrl || "");
  }, [website]);

  const handleConfirm = () => {
    if (!website) return;
    onConfirm({ vercelProjectUrl: vercelUrl || undefined });
  };

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      title="── HOÀN TẤT CẤU HÌNH"
      subtitle={website?.domain || website?.name}
      accentColor={DS.blue}
      loading={isMutating}
      maxWidth={480}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isMutating}
            style={{
              flex: 1,
              padding: "10px 20px",
              borderRadius: 8,
              border: `1px solid ${DS.border}`,
              background: "transparent",
              color: DS.text3,
              fontFamily: DS.heading,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={isMutating}
            style={{
              flex: 2,
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: DS.blue,
              color: "#fff",
              fontFamily: DS.heading,
              fontSize: 13,
              fontWeight: 700,
              cursor: isMutating ? "not-allowed" : "pointer",
              opacity: isMutating ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isMutating && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            <CheckCircle size={14} />
            Hoàn tất cấu hình
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="VERCEL PROJECT URL (TÙY CHỌN)">
          <input
            value={vercelUrl}
            onChange={e => setVercelUrl(e.target.value)}
            placeholder="https://your-site.vercel.app"
            style={inputStyle}
          />
        </Field>

        <div style={{
          padding: "0.75rem",
          borderRadius: 10,
          background: `${DS.blue}08`,
          border: `1px solid ${DS.blue}20`,
        }}>
          <div style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono }}>Sau khi hoàn tất:</div>
          <ul style={{ color: DS.text4, fontSize: 11, margin: "4px 0 0 16px", padding: 0 }}>
            <li>Website được đánh dấu là đã cấu hình xong</li>
            <li>Khách hàng nhận notification thông báo</li>
          </ul>
        </div>
      </div>
    </DrawerShell>
  );
}

// ── Package Row ────────────────────────────────────────────────────────────────

const WEB_TIERS = [
  { level: 1, name: "Landing Page", shortName: "Tier 1", color: "#6EB1A8" },
  { level: 2, name: "Bán Hàng Cơ Bản", shortName: "Tier 2", color: "#3B82F6" },
  { level: 3, name: "Quản Trị Doanh Nghiệp", shortName: "Tier 3", color: "#8B5CF6" },
  { level: 4, name: "Theo Yêu Cầu", shortName: "Tier 4", color: "#EC4899" },
];

function InlineField({
  label,
  value,
  editing,
  saving,
  onStartEdit,
  onSave,
  onCancel,
  inputType = "text",
  inputValue,
  onInputChange,
  placeholder,
}: {
  label: string;
  value: string | number;
  editing: boolean;
  saving: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  inputType?: "text" | "number";
  inputValue?: string | number;
  onInputChange?: (v: string) => void;
  placeholder?: string;
}) {
  if (editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {inputType === "number" ? (
          <input
            type="number"
            value={inputValue}
            onChange={e => onInputChange?.(e.target.value)}
            disabled={saving}
            autoFocus
            style={{
              width: 110,
              padding: "3px 8px",
              borderRadius: 6,
              border: `1px solid ${DS.pink}60`,
              background: `${DS.pink}10`,
              color: DS.text,
              fontSize: 12,
              fontFamily: DS.mono,
              outline: "none",
            }}
          />
        ) : (
          <input
            type="text"
            value={inputValue}
            onChange={e => onInputChange?.(e.target.value)}
            disabled={saving}
            autoFocus
            onKeyDown={e => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") onCancel();
            }}
            style={{
              maxWidth: inputValue && String(inputValue).length > 20 ? 240 : 160,
              padding: "3px 8px",
              borderRadius: 6,
              border: `1px solid ${DS.pink}60`,
              background: `${DS.pink}10`,
              color: DS.text,
              fontSize: 12,
              fontFamily: DS.heading,
              outline: "none",
            }}
          />
        )}
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            padding: "3px 6px",
            borderRadius: 6,
            border: "none",
            background: DS.pink,
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: 3,
            fontFamily: DS.mono,
          }}
        >
          {saving ? <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={9} />}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          style={{
            padding: "3px 6px",
            borderRadius: 6,
            border: `1px solid ${DS.border}`,
            background: "transparent",
            color: DS.text4,
            fontSize: 10,
            cursor: "pointer",
            fontFamily: DS.mono,
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onStartEdit}
      title={`Nhấn để sửa ${label}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        cursor: "text",
        borderRadius: 4,
        padding: "1px 3px",
        transition: "background 0.12s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = `${DS.bgCard3}`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      <span style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono, opacity: 0.6 }}>{label}: </span>
      <span style={{ color: DS.text3, fontSize: 12, fontFamily: DS.heading, fontWeight: 600 }}>{value || "—"}</span>
      <Edit3 size={9} style={{ color: DS.text5, opacity: 0.5, flexShrink: 0 }} />
    </div>
  );
}

function NotificationToast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 16px",
      borderRadius: 12,
      background: DS.bgCard,
      border: `1px solid ${type === "success" ? DS.green : DS.red}50`,
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${type === "success" ? DS.green : DS.red}20`,
      maxWidth: 320,
      animation: "slideInRight 0.2s ease",
    }}>
      {type === "success"
        ? <CheckCircle size={16} style={{ color: DS.green, flexShrink: 0 }} />
        : <AlertCircle size={16} style={{ color: DS.red, flexShrink: 0 }} />
      }
      <span style={{ color: DS.text, fontSize: 13, fontFamily: DS.heading, fontWeight: 600 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          marginLeft: "auto",
          background: "none",
          border: "none",
          color: DS.text5,
          cursor: "pointer",
          padding: "0 0 0 4px",
          fontSize: 16,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

function PackageRow({
  pkg,
  onToggle,
  onUpdate,
  featureNameMap,
  tierCounts,
  onManageTier,
}: {
  pkg: WebPackage;
  onToggle: () => void;
  onUpdate: (field: string, value: unknown) => void;
  featureNameMap?: Map<string, string>;
  tierCounts?: Record<number, number>;
  onManageTier: (tierLevel: number, tierName: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  const startEdit = (field: string, currentValue: string | number) => {
    setEditingField(field);
    setEditValue(String(currentValue ?? ""));
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editingField) return;
    const field = editingField;
    const value = editValue.trim();
    setEditingField(null);
    setSaving(true);

    try {
      await onUpdate(field, field === "fullPrice" || field === "lp" ? Number(value) : value);
      setToast({ message: "Đã lưu thành công", type: "success" });
    } catch (e) {
      setToast({ message: "Lưu thất bại: " + (e instanceof Error ? e.message : "Lỗi không xác định"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {toast && (
        <NotificationToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={{
        border: `1px solid ${pkg.isActive ? DS.border : DS.border + "50"}`,
        borderRadius: 16,
        overflow: "hidden",
        opacity: pkg.isActive ? 1 : 0.55,
        transition: "all 0.2s",
      }}>
        {/* Row header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "14px 16px",
          background: DS.bgCard2,
        }}>
          {/* Color swatch */}
          <div style={{
            width: 4,
            height: 40,
            borderRadius: 4,
            background: pkg.color,
            flexShrink: 0,
            boxShadow: `0 0 10px ${pkg.color}40`,
          }} />

          {/* Package info — editable */}
          <div style={{ minWidth: 180, flexShrink: 0 }}>
            <InlineField
              label="Tên"
              value={pkg.industry || pkg.name}
              editing={editingField === "industry"}
              saving={saving}
              onStartEdit={() => startEdit("industry", pkg.industry || pkg.name)}
              onSave={saveEdit}
              onCancel={cancelEdit}
              inputValue={editValue}
              onInputChange={setEditValue}
              placeholder="Tên gói web"
            />
            <InlineField
              label="Tagline"
              value={pkg.tagline || pkg.taglineVi}
              editing={editingField === "tagline"}
              saving={saving}
              onStartEdit={() => startEdit("tagline", pkg.tagline || pkg.taglineVi)}
              onSave={saveEdit}
              onCancel={cancelEdit}
              inputValue={editValue}
              onInputChange={setEditValue}
              placeholder="Mô tả ngắn"
            />
          </div>

          {/* Price */}
          <div style={{ minWidth: 120, flexShrink: 0 }}>
            <InlineField
              label="Giá"
              value={pkg.fullPrice ? `${(pkg.fullPrice || pkg.price || 0).toLocaleString("vi-VN")}đ` : "—"}
              editing={editingField === "fullPrice"}
              saving={saving}
              onStartEdit={() => startEdit("fullPrice", pkg.fullPrice || pkg.price || 0)}
              onSave={saveEdit}
              onCancel={cancelEdit}
              inputType="number"
              inputValue={editValue}
              onInputChange={setEditValue}
              placeholder="Giá VNĐ"
            />
            <InlineField
              label="LP"
              value={pkg.lp ? `${pkg.lp.toLocaleString()} LP` : "0 LP"}
              editing={editingField === "lp"}
              saving={saving}
              onStartEdit={() => startEdit("lp", pkg.lp || 0)}
              onSave={saveEdit}
              onCancel={cancelEdit}
              inputType="number"
              inputValue={editValue}
              onInputChange={setEditValue}
              placeholder="LP thưởng"
            />
          </div>

          {/* Color + Badge */}
          <div style={{ minWidth: 100, flexShrink: 0 }}>
            <InlineField
              label="Badge"
              value={pkg.badge || "—"}
              editing={editingField === "badge"}
              saving={saving}
              onStartEdit={() => startEdit("badge", pkg.badge || "")}
              onSave={saveEdit}
              onCancel={cancelEdit}
              inputValue={editValue}
              onInputChange={setEditValue}
              placeholder="HOT, PHỔ BIẾN..."
            />
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "1px 3px" }}>
              <span style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono, opacity: 0.6 }}>Màu: </span>
              <div style={{ display: "flex", gap: 3 }}>
                {COLORS.map(c => (
                  <div
                    key={c}
                    onClick={async () => {
                      setEditValue(c);
                      try {
                        await onUpdate("color", c);
                        setToast({ message: "Đã lưu màu", type: "success" });
                      } catch {
                        setToast({ message: "Lưu màu thất bại", type: "error" });
                      }
                    }}
                    title={c}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: c,
                      cursor: "pointer",
                      border: pkg.color === c ? `2px solid #fff` : "2px solid transparent",
                      boxShadow: pkg.color === c ? `0 0 6px ${c}` : "none",
                      transition: "all 0.12s",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tier buttons */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {WEB_TIERS.map(t => (
              <button
                key={t.level}
                onClick={() => onManageTier(t.level, t.name)}
                title={`Quản lý tính năng ${t.name}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  padding: "7px 4px",
                  borderRadius: 10,
                  border: `1px solid ${pkg.color}30`,
                  background: `${pkg.color}08`,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = `${pkg.color}18`;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `${pkg.color}50`;
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = `${pkg.color}08`;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `${pkg.color}30`;
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }}
              >
                <div style={{ color: pkg.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
                  {tierCounts?.[t.level] ?? 0}
                </div>
                <div style={{ color: DS.text4, fontSize: 8, fontFamily: DS.mono, textAlign: "center", lineHeight: 1.2 }}>
                  {t.shortName}
                </div>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <button
              onClick={onToggle}
              title={pkg.isActive ? "Tắt" : "Bật"}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: pkg.isActive ? DS.green : DS.text5,
                display: "flex",
                alignItems: "center",
                padding: 4,
              }}
            >
              {pkg.isActive
                ? <ToggleRight size={22} style={{ color: DS.green }} />
                : <ToggleLeft size={22} />}
            </button>
            <button
              onClick={() => setExpanded(v => !v)}
              title={expanded ? "Thu gọn" : "Xem tính năng"}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: DS.text5,
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              {expanded ? <X size={15} /> : <PlusCircle size={15} />}
            </button>
          </div>
        </div>

        {/* Expanded */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ padding: "12px 16px", background: DS.bgCard, borderTop: `1px solid ${DS.border}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 32px" }}>
                  {(pkg.features || []).map((f, i) => {
                    const displayName = featureNameMap?.has(f) ? featureNameMap.get(f)! : (f.length > 16 ? `[${f.slice(0, 8)}…]` : f);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle2 size={10} style={{ color: pkg.color, flexShrink: 0 }} />
                        <span style={{ color: DS.text4, fontSize: 11 }}>{displayName}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: `1px solid ${DS.border}`,
                }}>
                  <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>DEMO: </span>
                  {(pkg.demoFeatures || []).map(f => (
                    <span
                      key={f}
                      style={{
                        color: pkg.color,
                        fontSize: 10,
                        fontFamily: DS.mono,
                        background: `${pkg.color}10`,
                        border: `1px solid ${pkg.color}25`,
                        padding: "2px 8px",
                        borderRadius: 5,
                      }}
                    >
                      {f}
                    </span>
                  ))}
                  <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginLeft: "auto" }}>
                    Kích hoạt: {pkg.activateTime} · LP: {(pkg.lp || 0).toLocaleString()} LP
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// ── Customer Websites Section ──────────────────────────────────────────────────

function CustomerWebsitesSection({
  onConfirmDomain,
  onConfigureDone,
  onConfirmDomainMutating,
  onConfigureDoneMutating,
  onToast,
}: {
  onConfirmDomain: (website: CustomerWebsite) => void;
  onConfigureDone: (website: CustomerWebsite) => void;
  onConfirmDomainMutating: boolean;
  onConfigureDoneMutating: boolean;
  onToast: (message: string, type: "success" | "error") => void;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [deployingId, setDeployingId] = useState<string | null>(null);

  const { data: listRes, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "customer-websites", filterStatus, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filterStatus !== "all") params.set("configStatus", filterStatus);
      const res = await adminApi.get<{
        data: CustomerWebsite[];
        pagination: { total: number; page: number; totalPages: number };
      }>(`/api/admin/customer-websites?${params}`);
      return res;
    },
  });

  const websites: CustomerWebsite[] = listRes?.data ?? [];
  const pagination = listRes?.pagination;

  const toggleDomainRenew = useMutation({
    mutationFn: async ({ id, auto }: { id: string; auto: boolean }) =>
      adminApi.patch(`/api/admin/customer-websites/${id}`, { autoRenewDomain: auto }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "customer-websites"] }),
  });

  const toggleHostingRenew = useMutation({
    mutationFn: async ({ id, auto }: { id: string; auto: boolean }) =>
      adminApi.patch(`/api/admin/customer-websites/${id}`, { autoRenewHosting: auto }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "customer-websites"] }),
  });

  const deployMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) =>
      adminApi.post(`/api/admin/customer-websites/${id}/deploy`),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin", "customer-websites"] });
      const url = (data as { data?: { deploymentUrl?: string } })?.data?.deploymentUrl;
      if (url) window.open(url, "_blank");
    },
    onError: (err: Error) => { onToast("Deploy thất bại: " + err.message, "error"); },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) =>
      adminApi.patch(`/api/admin/customer-websites/${id}`, { status: "cancelled" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "customer-websites"] }),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return websites;
    const q = search.toLowerCase();
    return websites.filter(w =>
      (w.domain || "").toLowerCase().includes(q) ||
      (w.name || "").toLowerCase().includes(q) ||
      (w.customerName || "").toLowerCase().includes(q) ||
      (w.customerEmail || "").toLowerCase().includes(q)
    );
  }, [websites, search]);

  const pendingCount = websites.filter(w => w.configStatus === "pending_config").length;
  const totalCost = websites.reduce((s, w) => s + (w.domainCost || 0) + (w.hostingCost || 0), 0);
  const expiringDomains = websites.filter(w => {
    const d = daysUntil(w.domainExpiresAt);
    return d !== null && d <= 30 && d > 0;
  }).length;
  const expiringHosting = websites.filter(w => {
    const d = daysUntil(w.hostingExpiresAt);
    return d !== null && d <= 30 && d > 0;
  }).length;

  return (
    <>
      {/* KPI */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}>
        {[
          { label: "Tổng website", value: websites.length, color: DS.blue, icon: <Globe size={18} /> },
          { label: "Chờ duyệt", value: pendingCount, color: DS.amber, icon: <Clock size={18} /> },
          { label: "Sắp hết domain", value: expiringDomains, color: DS.red, icon: <AlertCircle size={18} /> },
          { label: "Sắp hết hosting", value: expiringHosting, color: "#F59E0B", icon: <Server size={18} /> },
          {
            label: "Tổng chi phí",
            value: totalCost >= 1_000_000
              ? `${(totalCost / 1_000_000).toFixed(0)}M`
              : totalCost.toLocaleString("vi-VN"),
            color: DS.green, icon: <DollarSign size={18} />,
          },
        ].map(s => (
          <div
            key={s.label}
            style={{
              background: DS.bgCard,
              border: `1px solid ${DS.border}`,
              borderRadius: 16,
              padding: "1rem",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `${s.color}15`,
              border: `1px solid ${s.color}25`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.mono, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: "1rem",
      }}>
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 12,
          background: DS.bgCard,
          border: `1px solid ${DS.border}`,
        }}>
          <Search size={13} style={{ color: DS.text5 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm domain, tên, khách hàng..."
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: DS.text3,
              fontSize: 13,
              flex: 1,
            }}
          />
        </div>
        <div style={{
          display: "flex",
          gap: 6,
          padding: "8px 12px",
          borderRadius: 12,
          background: DS.bgCard,
          border: `1px solid ${DS.border}`,
        }}>
          {(["all", "pending_config", "configured", "delivered"] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilterStatus(f); setPage(1); }}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 10,
                fontFamily: DS.mono,
                cursor: "pointer",
                border: `1px solid ${filterStatus === f ? DS.blue : "transparent"}`,
                background: filterStatus === f ? "rgba(59,130,246,0.12)" : "none",
                color: filterStatus === f ? DS.blue : DS.text5,
              }}
            >
              {f === "all" ? "Tất cả"
                : f === "pending_config" ? "Chờ duyệt"
                  : f === "configured" ? "Đã cấu hình"
                    : "Đã bàn giao"}
            </button>
          ))}
        </div>
        <button
          onClick={() => refetch()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            background: DS.bgCard,
            border: `1px solid ${DS.border}`,
            borderRadius: 10,
            color: DS.text3,
            cursor: "pointer",
            fontSize: 12,
            fontFamily: DS.mono,
          }}
        >
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: DS.bgCard,
        border: `1px solid ${DS.border}`,
        borderRadius: 12,
        overflow: "visible",
      }}>
        {/* Sticky header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "180px 1fr 110px 100px 90px 130px",
          gap: 12,
          padding: "10px 16px",
          borderBottom: `1px solid ${DS.border}`,
          background: DS.bgCard2,
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}>
          {["WEBSITE", "KHÁCH HÀNG", "HOSTING", "EXPIRY", "STATUS", "HÀNH ĐỘNG"].map(h => (
            <div key={h} style={{
              color: DS.text5,
              fontSize: 9,
              fontFamily: DS.mono,
              letterSpacing: "0.12em",
            }}>
              {h}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: DS.blue }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>
            <Globe size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <div>Không tìm thấy website nào</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto", maxHeight: "calc(100vh - 520px)", overflowY: "auto" }}>
            {filtered.map(site => {
              const domainDays = daysUntil(site.domainExpiresAt);
              const hostingDays = daysUntil(site.hostingExpiresAt);
              const domainUrgent = domainDays !== null && domainDays <= 7;
              const hostingUrgent = hostingDays !== null && hostingDays <= 7;
              const csColor = CONFIG_STATUS_COLORS[site.configStatus] || DS.text4;
              const stColor = STATUS_COLORS[site.status] || DS.text4;
              const isDeploying = deployingId === site.id;

              return (
                <div
                  key={site.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "180px 1fr 110px 100px 90px 130px",
                    gap: 12,
                    padding: "12px 16px",
                    borderBottom: `1px solid ${DS.border}30`,
                    alignItems: "center",
                  }}
                >
                  {/* Website */}
                  <div>
                    <div style={{
                      color: DS.text,
                      fontSize: 12,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {site.name}
                    </div>
                    {site.domain && (
                      <div style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono }}>
                        <Globe size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />
                        {site.domain}
                      </div>
                    )}
                  </div>

                  {/* Customer */}
                  <div>
                    <div style={{ color: DS.text3, fontSize: 12 }}>{site.customerName || "—"}</div>
                    <div style={{ color: DS.text5, fontSize: 10 }}>{site.customerEmail || "—"}</div>
                  </div>

                  {/* Hosting */}
                  <div>
                    <div style={{ color: DS.text3, fontSize: 11 }}>
                      {site.hostingPlan?.name || site.hostingPlan?.nameVi || "—"}
                    </div>
                    <div style={{ color: DS.text5, fontSize: 10 }}>
                      {site.hostingTermMonths} tháng · {(site.hostingCost || 0).toLocaleString("vi-VN")}đ
                    </div>
                  </div>

                  {/* Expiry */}
                  <div>
                    {domainDays !== null && (
                      <div style={{
                        color: domainUrgent ? DS.red : DS.text3,
                        fontSize: 11,
                        fontWeight: domainUrgent ? 700 : 400,
                      }}>
                        <Clock size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />
                        Domain: {domainDays}d
                      </div>
                    )}
                    {hostingDays !== null && (
                      <div style={{
                        color: hostingUrgent ? DS.red : DS.text3,
                        fontSize: 11,
                        fontWeight: hostingUrgent ? 700 : 400,
                      }}>
                        <Server size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />
                        Host: {hostingDays}d
                      </div>
                    )}
                    {domainDays === null && hostingDays === null && (
                      <span style={{ color: DS.text5, fontSize: 11 }}>—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{
                      fontSize: 9,
                      fontFamily: DS.mono,
                      background: `${csColor}15`,
                      border: `1px solid ${csColor}40`,
                      color: csColor,
                      padding: "2px 6px",
                      borderRadius: 6,
                      display: "inline-block",
                    }}>
                      {CONFIG_STATUS_LABELS[site.configStatus] || site.configStatus}
                    </span>
                    <span style={{
                      fontSize: 9,
                      fontFamily: DS.mono,
                      background: `${stColor}15`,
                      border: `1px solid ${stColor}40`,
                      color: stColor,
                      padding: "2px 6px",
                      borderRadius: 6,
                      display: "inline-block",
                    }}>
                      {site.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {site.configStatus === "pending_config" && (
                      <button
                        onClick={() => onConfirmDomain(site)}
                        disabled={onConfirmDomainMutating}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: `${DS.green}15`,
                          border: `1px solid ${DS.green}40`,
                          color: DS.green,
                          cursor: onConfirmDomainMutating ? "not-allowed" : "pointer",
                          fontSize: 10,
                          fontFamily: DS.mono,
                          opacity: onConfirmDomainMutating ? 0.6 : 1,
                        }}
                      >
                        <ShieldCheck size={10} /> Xác nhận
                      </button>
                    )}
                    {site.configStatus === "configured" && (
                      <button
                        onClick={() => onConfigureDone(site)}
                        disabled={onConfigureDoneMutating}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: `${DS.blue}15`,
                          border: `1px solid ${DS.blue}40`,
                          color: DS.blue,
                          cursor: onConfigureDoneMutating ? "not-allowed" : "pointer",
                          fontSize: 10,
                          fontFamily: DS.mono,
                          opacity: onConfigureDoneMutating ? 0.6 : 1,
                        }}
                      >
                        <CheckCircle size={10} /> Cấu hình xong
                      </button>
                    )}
                    {site.vercelProjectUrl && (
                      <a
                        href={site.vercelProjectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: `${DS.purple}15`,
                          border: `1px solid ${DS.purple}40`,
                          color: DS.purple,
                          fontSize: 10,
                          fontFamily: DS.mono,
                          textDecoration: "none",
                        }}
                      >
                        <ExternalLink size={10} /> Vercel
                      </a>
                    )}
                    {site.vercelProjectUrl && (
                      <button
                        onClick={() => {
                          setDeployingId(site.id);
                          deployMutation.mutate({ id: site.id });
                        }}
                        disabled={isDeploying || deployMutation.isPending}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: `${DS.pink}15`,
                          border: `1px solid ${DS.pink}40`,
                          color: DS.pink,
                          cursor: isDeploying ? "not-allowed" : "pointer",
                          fontSize: 10,
                          fontFamily: DS.mono,
                          opacity: isDeploying ? 0.6 : 1,
                        }}
                      >
                        <Rocket size={10} />
                        {isDeploying ? "..." : "Deploy"}
                      </button>
                    )}
                    {site.status !== "cancelled" && site.configStatus !== "delivered" && (
                      <button
                        onClick={() => {
                          if (confirm("Hủy website này?")) cancelMutation.mutate(site.id);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: `${DS.red}10`,
                          border: `1px solid ${DS.red}30`,
                          color: DS.red,
                          cursor: "pointer",
                          fontSize: 10,
                          fontFamily: DS.mono,
                        }}
                      >
                        <RotateCcw size={10} /> Hủy
                      </button>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 2, width: "100%", marginTop: 2 }}>
                      <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>Domain</span>
                      <button
                        onClick={() => toggleDomainRenew.mutate({ id: site.id, auto: !site.autoRenewDomain })}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                      >
                        {site.autoRenewDomain
                          ? <ToggleRight size={18} style={{ color: DS.green }} />
                          : <ToggleLeft size={18} style={{ color: DS.text5 }} />}
                      </button>
                      <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, marginLeft: 6 }}>Host</span>
                      <button
                        onClick={() => toggleHostingRenew.mutate({ id: site.id, auto: !site.autoRenewHosting })}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                      >
                        {site.autoRenewHosting
                          ? <ToggleRight size={18} style={{ color: DS.green }} />
                          : <ToggleLeft size={18} style={{ color: DS.text5 }} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: "1rem" }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: `1px solid ${DS.border}`,
              background: DS.bgCard,
              color: page === 1 ? DS.text5 : DS.text3,
              cursor: page === 1 ? "default" : "pointer",
              fontSize: 12,
              fontFamily: DS.mono,
            }}
          >
            ← Trước
          </button>
          <span style={{ padding: "6px 14px", color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page === pagination.totalPages}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: `1px solid ${DS.border}`,
              background: DS.bgCard,
              color: page === pagination.totalPages ? DS.text5 : DS.text3,
              cursor: page === pagination.totalPages ? "default" : "pointer",
              fontSize: 12,
              fontFamily: DS.mono,
            }}
          >
            Sau →
          </button>
        </div>
      )}
    </>
  );
}


// ── ServiceAttributeTab ──────────────────────────────────────────────────────
function ServiceAttributeTab({ onToast }: { onToast: (message: string, type: "success" | "error") => void }) {
  const qc = useQueryClient();
  const [activeLocale, setActiveLocale] = useState<"vi" | "en" | "ja" | "ko" | "zh">("vi");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");
  const [editAttr, setEditAttr] = useState<ServiceAttr | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  type ServiceAttr = {
    id: string; slug: string;
    name: string; nameVi: string; nameEn?: string | null; nameJa?: string | null; nameKo?: string | null; nameZh?: string | null;
    description?: string | null; descriptionVi?: string | null;
    category: string; categoryVi: string; categoryEn?: string | null; categoryJa?: string | null; categoryKo?: string | null; categoryZh?: string | null;
    icon?: string | null; price: number; isRequired: boolean; sortOrder: number; isActive: boolean;
    tier: string; xpPoints: number; includedInBase: boolean; isUpgradeable: boolean;
    serviceKey?: string | null; videoUrl?: string | null;
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "pricing-features", filterService, filterCategory, filterActive],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", "200");
      if (filterActive === "active") params.set("isActive", "true");
      else if (filterActive === "inactive") params.set("isActive", "false");
      if (filterCategory) params.set("category", filterCategory);
      if (filterService) params.set("serviceKey", filterService);
      const res = await adminApi.get<{ data: ServiceAttr[] }>(`/api/admin/pricing/features?${params}`);
      return res;
    },
  });

  const allAttrs = data?.data ?? [];
  const filtered = useMemo(() => {
    if (!search.trim()) return allAttrs;
    const q = search.toLowerCase();
    return allAttrs.filter(a =>
      a.nameVi.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q) || a.categoryVi.toLowerCase().includes(q)
    );
  }, [allAttrs, search]);

  const categories = useMemo(() =>
    [...new Set(allAttrs.map(a => a.categoryVi))].sort(), [allAttrs]);

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.put("/api/admin/pricing/features", { id, isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pricing-features"] }),
  });

  const toggleRequired = useMutation({
    mutationFn: ({ id, isRequired }: { id: string; isRequired: boolean }) =>
      adminApi.put("/api/admin/pricing/features", { id, isRequired }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pricing-features"] }),
  });

  const deleteAttr = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/admin/pricing/features?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pricing-features"] }),
    onError: (err: Error) => onToast("Xóa thất bại: " + err.message, "error"),
  });

  const SERVICE_OPTIONS = [
    { value: "", label: "Tất cả" },
    { value: "web", label: "Web" },
    { value: "app", label: "App" },
    { value: "dashboard", label: "Dashboard" },
    { value: "seo", label: "SEO" },
    { value: "null", label: "Chung (Shared)" },
  ];
  const TIER_OPTIONS = ["basic", "standard", "premium"];
  const LOCALE_LABELS = { vi: "VI", en: "EN", ja: "JA", ko: "KO", zh: "ZH" } as const;
  const LOCALE_FIELDS: Record<keyof typeof LOCALE_LABELS, { name: keyof ServiceAttr; category: keyof ServiceAttr }> = {
    vi: { name: "nameVi", category: "categoryVi" },
    en: { name: "nameEn", category: "categoryEn" },
    ja: { name: "nameJa", category: "categoryJa" },
    ko: { name: "nameKo", category: "categoryKo" },
    zh: { name: "nameZh", category: "categoryZh" },
  };

  const FormFields = ({ form, onChange }: { form: Partial<ServiceAttr>; onChange: (k: keyof ServiceAttr, v: unknown) => void }) => {
    const set = onChange;

    const LocaleInput = ({ label, field }: { label: string; field: keyof ServiceAttr }) => (
      <div>
        <label style={{ fontSize: 11, color: DS.text4, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{label}</label>
        <input value={String(form[field] ?? "")} onChange={e => set(field, e.target.value)}
          style={inputStyle} placeholder={label} />
      </div>
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Slug */}
        <div>
          <label style={labelStyle}>Slug *</label>
          <input value={form.slug ?? ""} onChange={e => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            style={inputStyle} placeholder="feature-slug" />
        </div>

        {/* Name fields per locale */}
        <div>
          <label style={labelStyle}>Tên tính năng</label>
          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
            {(Object.keys(LOCALE_LABELS) as Array<keyof typeof LOCALE_LABELS>).map(l => (
              <button key={l} onClick={() => setActiveLocale(l)}
                style={{
                  padding: "2px 8px", borderRadius: 4, border: "none", cursor: "pointer",
                  fontSize: 10, fontFamily: DS.mono, fontWeight: 600,
                  background: activeLocale === l ? DS.pink : DS.bgCard,
                  color: activeLocale === l ? "#fff" : DS.text4,
                }}>
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>
          <LocaleInput label="Tên (VI)" field="nameVi" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            <LocaleInput label="Name (EN)" field="nameEn" />
            <LocaleInput label="名前 (JA)" field="nameJa" />
            <LocaleInput label="이름 (KO)" field="nameKo" />
            <LocaleInput label="名称 (ZH)" field="nameZh" />
          </div>
        </div>

        {/* Category fields per locale */}
        <div>
          <label style={labelStyle}>Danh mục</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <LocaleInput label="Danh mục (VI) *" field="categoryVi" />
            <LocaleInput label="Category (EN)" field="categoryEn" />
            <LocaleInput label="カテゴリ (JA)" field="categoryJa" />
            <LocaleInput label="카테고리 (KO)" field="categoryKo" />
            <LocaleInput label="类别 (ZH)" field="categoryZh" />
          </div>
        </div>

        {/* Pricing + Tier */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Giá (VNĐ)</label>
            <input type="number" value={form.price ?? 0} onChange={e => set("price", Number(e.target.value))}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>XP Points</label>
            <input type="number" value={form.xpPoints ?? 0} onChange={e => set("xpPoints", Number(e.target.value))}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Sort Order</label>
            <input type="number" value={form.sortOrder ?? 0} onChange={e => set("sortOrder", Number(e.target.value))}
              style={inputStyle} />
          </div>
        </div>

        {/* Service Key + Tier */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Dịch vụ</label>
            <select value={form.serviceKey ?? ""} onChange={e => set("serviceKey", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}>
              {SERVICE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tier</label>
            <select value={form.tier ?? "basic"} onChange={e => set("tier", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}>
              {TIER_OPTIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Icon + Video URL */}
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Icon (emoji)</label>
            <input value={form.icon ?? ""} onChange={e => set("icon", e.target.value)}
              style={inputStyle} placeholder="🔧" />
          </div>
          <div>
            <label style={labelStyle}>Video URL</label>
            <input value={form.videoUrl ?? ""} onChange={e => set("videoUrl", e.target.value)}
              style={inputStyle} placeholder="https://youtube.com/..." />
          </div>
        </div>

        {/* Booleans */}
        <div>
          <label style={labelStyle}>Trạng thái</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { key: "isActive", label: "Hoạt động", color: DS.green },
              { key: "isRequired", label: "Bắt buộc", color: DS.amber },
              { key: "includedInBase", label: "Trong giá gốc", color: DS.blue },
              { key: "isUpgradeable", label: "Có thể nâng cấp", color: DS.purple },
            ].map(toggle => (
              <button key={toggle.key}
                onClick={() => set(toggle.key as keyof ServiceAttr, !form[toggle.key as keyof ServiceAttr])}
                style={{
                  padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                  fontSize: 11, fontFamily: DS.mono, fontWeight: 600,
                  background: form[toggle.key as keyof ServiceAttr] ? toggle.color : DS.bgCard,
                  color: form[toggle.key as keyof ServiceAttr] ? "#fff" : DS.text4,
                  border: form[toggle.key as keyof ServiceAttr] ? "none" : `1px solid ${DS.border}`,
                  transition: "all 0.15s",
                }}>
                {toggle.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Mô tả</label>
          <textarea value={form.descriptionVi ?? ""} onChange={e => set("descriptionVi", e.target.value)}
            style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} placeholder="Mô tả tính năng..." />
        </div>
      </div>
    );
  };

  const [addForm, setAddForm] = useState<Partial<ServiceAttr> | null>(null);
  const [editForm, setEditForm] = useState<Partial<ServiceAttr> | null>(null);

  const createMutation = useMutation({
    mutationFn: async (formData: Partial<ServiceAttr>) => {
      const payload = {
        slug: formData.slug,
        nameVi: formData.nameVi,
        nameEn: formData.nameEn || null,
        nameJa: formData.nameJa || null,
        nameKo: formData.nameKo || null,
        nameZh: formData.nameZh || null,
        category: formData.category || formData.categoryVi,
        categoryVi: formData.categoryVi,
        categoryEn: formData.categoryEn || null,
        categoryJa: formData.categoryJa || null,
        categoryKo: formData.categoryKo || null,
        categoryZh: formData.categoryZh || null,
        description: formData.description || null,
        descriptionVi: formData.descriptionVi || null,
        icon: formData.icon || null,
        price: formData.price ?? 0,
        sortOrder: formData.sortOrder ?? 0,
        tier: formData.tier ?? "basic",
        xpPoints: formData.xpPoints ?? 0,
        serviceKey: formData.serviceKey || null,
        videoUrl: formData.videoUrl || null,
        isRequired: formData.isRequired ?? false,
        isActive: formData.isActive ?? true,
        includedInBase: formData.includedInBase ?? false,
        isUpgradeable: formData.isUpgradeable ?? false,
      };
      return adminApi.post("/api/admin/pricing/features", payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "pricing-features"] }); setShowAdd(false); setAddForm(null); },
    onError: (err: Error) => onToast("Tạo thất bại: " + err.message, "error"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceAttr> }) => {
      const payload: Record<string, unknown> = { id };
      (["slug", "nameVi", "nameEn", "nameJa", "nameKo", "nameZh", "category", "categoryVi", "categoryEn", "categoryJa", "categoryKo", "categoryZh",
        "description", "descriptionVi", "icon", "price", "sortOrder", "tier", "xpPoints", "isRequired", "isActive", "includedInBase", "isUpgradeable"] as const).forEach(k => {
          if (data[k] !== undefined) payload[k] = data[k];
        });
      if (data.serviceKey !== undefined) payload.serviceKey = data.serviceKey || null;
      if (data.videoUrl !== undefined) payload.videoUrl = data.videoUrl || null;
      return adminApi.put("/api/admin/pricing/features", payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "pricing-features"] }); setEditAttr(null); setEditForm(null); },
    onError: (err: Error) => onToast("Cập nhật thất bại: " + err.message, "error"),
  });

  const labelStyle = { fontSize: 11, color: DS.text4, fontFamily: DS.mono, display: "block", marginBottom: 4 };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "7px 10px", background: DS.bgCard3, border: `1px solid ${DS.border}`,
    borderRadius: 8, color: DS.text, fontSize: 13, fontFamily: DS.mono, outline: "none",
    boxSizing: "border-box",
  };

  const attrCount = allAttrs.length;
  const activeCount = allAttrs.filter(a => a.isActive).length;
  const basicCount = allAttrs.filter(a => a.tier === "basic").length;
  const stdCount = allAttrs.filter(a => a.tier === "standard").length;
  const premCount = allAttrs.filter(a => a.tier === "premium").length;

  const SERVICE_LABEL: Record<string, string> = { web: "Web", app: "App", dashboard: "Dashboard", seo: "SEO", "": "Chung" };
  const TIER_COLOR: Record<string, string> = { basic: DS.text5, standard: DS.blue, premium: DS.gold };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        {/* Stats */}
        <div style={{ display: "flex", gap: 8, marginRight: "auto" }}>
          {[
            { label: "Tổng", value: attrCount, color: DS.text },
            { label: "Hoạt động", value: activeCount, color: DS.green },
            { label: "Basic", value: basicCount, color: TIER_COLOR.basic },
            { label: "Standard", value: stdCount, color: TIER_COLOR.standard },
            { label: "Premium", value: premCount, color: TIER_COLOR.premium },
          ].map(s => (
            <div key={s.label} style={{
              padding: "6px 12px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8,
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: DS.heading }}>{s.value}</div>
              <div style={{ fontSize: 9, color: DS.text4, fontFamily: DS.mono }}>{s.label}</div>
            </div>
          ))}
        </div>

        <button onClick={() => { setAddForm({ isActive: true, isRequired: false, includedInBase: false, isUpgradeable: false, tier: "basic", price: 0, sortOrder: 0, xpPoints: 0, serviceKey: "", icon: "", videoUrl: "", nameVi: "", slug: "" }); setShowAdd(true); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}>
          <Plus size={13} />Thêm thuộc tính
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 200 }} placeholder="Tìm kiếm..." />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          style={{ ...inputStyle, width: 160, cursor: "pointer" }}>
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterService} onChange={e => setFilterService(e.target.value)}
          style={{ ...inputStyle, width: 130, cursor: "pointer" }}>
          {SERVICE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div style={{ display: "flex", gap: 4 }}>
          {(["all", "active", "inactive"] as const).map(f => (
            <button key={f} onClick={() => setFilterActive(f)}
              style={{
                padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontFamily: DS.mono, fontWeight: 600,
                background: filterActive === f ? DS.pink : DS.bgCard, color: filterActive === f ? "#fff" : DS.text4
              }}>
              {f === "all" ? "Tất cả" : f === "active" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
        <button onClick={() => qc.invalidateQueries({ queryKey: ["admin", "pricing-features"] })}
          style={{ padding: "6px 12px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, color: DS.text3, cursor: "pointer", fontSize: 11, fontFamily: DS.mono }}>
          <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Table */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: DS.mono, fontSize: 12 }}>
            <thead>
              <tr style={{ background: DS.bgCard3 }}>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Icon</th>
                <th style={{ ...thStyle, textAlign: "left", minWidth: 180 }}>Tên</th>
                <th style={thStyle}>Danh mục</th>
                <th style={thStyle}>Dịch vụ</th>
                <th style={thStyle}>Tier</th>
                <th style={thStyle}>Giá</th>
                <th style={thStyle}>XP</th>
                <th style={thStyle}>Req.</th>
                <th style={thStyle}>Base</th>
                <th style={thStyle}>Slug</th>
                <th style={thStyle}>Active</th>
                <th style={thStyle}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={12} style={{ textAlign: "center", padding: 40, color: DS.text4 }}>Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={12} style={{ textAlign: "center", padding: 40, color: DS.text4 }}>Không có thuộc tính nào</td></tr>
              ) : filtered
                .filter(a => {
                  if (filterService === "null") return !a.serviceKey;
                  if (filterService) return a.serviceKey === filterService;
                  return true;
                })
                .map((attr, i) => (
                  <tr key={attr.id} style={{ borderTop: `1px solid ${DS.border}` }}>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={{ ...tdStyle, fontSize: 16, textAlign: "center" }}>{attr.icon || "—"}</td>
                    <td style={{ ...tdStyle, textAlign: "left" }}>
                      <div style={{ fontWeight: 600, color: DS.text }}>{attr.nameVi}</div>
                      {attr.nameEn && <div style={{ fontSize: 10, color: DS.text4 }}>{attr.nameEn}</div>}
                    </td>
                    <td style={{ ...tdStyle, color: DS.text3 }}>{attr.categoryVi}</td>
                    <td style={{ ...tdStyle, color: SERVICE_LABEL[attr.serviceKey ?? ""] === "Chung" ? DS.text5 : DS.text3 }}>
                      {SERVICE_LABEL[attr.serviceKey ?? ""]}
                    </td>
                    <td style={{ ...tdStyle, color: TIER_COLOR[attr.tier] ?? DS.text4, fontWeight: 600 }}>
                      {attr.tier}
                    </td>
                    <td style={{ ...tdStyle, color: attr.price > 0 ? DS.green : DS.text4 }}>
                      {attr.price > 0 ? attr.price.toLocaleString() : "—"}
                    </td>
                    <td style={{ ...tdStyle, color: attr.xpPoints > 0 ? DS.gold : DS.text4 }}>
                      {attr.xpPoints > 0 ? `+${attr.xpPoints}` : "—"}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <ToggleCell
                        value={attr.isRequired}
                        onToggle={v => toggleRequired.mutate({ id: attr.id, isRequired: v })}
                        color={DS.amber}
                        loading={toggleRequired.isPending}
                      />
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <ToggleCell
                        value={attr.includedInBase}
                        onToggle={v => updateMutation.mutate({ id: attr.id, data: { includedInBase: v } })}
                        color={DS.blue}
                        loading={updateMutation.isPending}
                      />
                    </td>
                    <td style={{ ...tdStyle, fontSize: 10, color: DS.text5, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {attr.slug}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <ToggleCell
                        value={attr.isActive}
                        onToggle={v => toggleActive.mutate({ id: attr.id, isActive: v })}
                        color={DS.green}
                        loading={toggleActive.isPending}
                      />
                    </td>
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                        <button onClick={() => {
                          setEditAttr(attr);
                          setEditForm({
                            slug: attr.slug, nameVi: attr.nameVi, nameEn: attr.nameEn ?? undefined,
                            nameJa: attr.nameJa ?? undefined, nameKo: attr.nameKo ?? undefined, nameZh: attr.nameZh ?? undefined,
                            categoryVi: attr.categoryVi, categoryEn: attr.categoryEn ?? undefined,
                            categoryJa: attr.categoryJa ?? undefined, categoryKo: attr.categoryKo ?? undefined, categoryZh: attr.categoryZh ?? undefined,
                            description: attr.description ?? undefined, descriptionVi: attr.descriptionVi ?? undefined,
                            icon: attr.icon ?? undefined, price: attr.price, sortOrder: attr.sortOrder,
                            tier: attr.tier, xpPoints: attr.xpPoints,
                            serviceKey: attr.serviceKey ?? undefined,
                            videoUrl: attr.videoUrl ?? undefined,
                            isRequired: attr.isRequired, isActive: attr.isActive,
                            includedInBase: attr.includedInBase, isUpgradeable: attr.isUpgradeable,
                          });
                        }}
                          style={actionBtnStyle}><Edit3 size={12} /></button>
                        <button onClick={() => {
                          if (confirm(`Xóa "${attr.nameVi}"?`)) deleteAttr.mutate(attr.id);
                        }}
                          style={{ ...actionBtnStyle, color: DS.red }}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Drawer */}
      {showAdd && addForm !== null && (
        <SlideDrawer title="Thêm thuộc tính" onClose={() => { setShowAdd(false); setAddForm(null); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FormFields form={addForm!} onChange={(k, v) => setAddForm(f => ({ ...f, [k]: v }))} />
            <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: `1px solid ${DS.border}` }}>
              <button onClick={() => { setShowAdd(false); setAddForm(null); }}
                style={{ flex: 1, padding: "10px", background: DS.bgCard3, border: `1px solid ${DS.border}`, borderRadius: 8, color: DS.text3, cursor: "pointer", fontFamily: DS.mono, fontSize: 13 }}>
                Hủy
              </button>
              <button onClick={() => {
                if (!addForm!.nameVi?.trim()) { onToast("Tên (VI) là bắt buộc", "error"); return; }
                if (!addForm!.slug?.trim()) { onToast("Slug là bắt buộc", "error"); return; }
                if (!addForm!.categoryVi?.trim()) { onToast("Danh mục (VI) là bắt buộc", "error"); return; }
                createMutation.mutate(addForm!);
              }}
                disabled={createMutation.isPending}
                style={{ flex: 1, padding: "10px", background: GRD.primary, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontFamily: DS.mono, fontSize: 13, fontWeight: 600 }}>
                {createMutation.isPending ? "Đang tạo..." : "Tạo mới"}
              </button>
            </div>
          </div>
        </SlideDrawer>
      )}

      {/* Edit Drawer */}
      {editAttr && editForm !== null && (
        <SlideDrawer title={`Sửa: ${editAttr.nameVi}`} onClose={() => { setEditAttr(null); setEditForm(null); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FormFields form={editForm} onChange={(k, v) => setEditForm(f => ({ ...f, [k]: v }))} />
            <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: `1px solid ${DS.border}` }}>
              <button onClick={() => { setEditAttr(null); setEditForm(null); }}
                style={{ flex: 1, padding: "10px", background: DS.bgCard3, border: `1px solid ${DS.border}`, borderRadius: 8, color: DS.text3, cursor: "pointer", fontFamily: DS.mono, fontSize: 13 }}>
                Hủy
              </button>
              <button onClick={() => {
                if (!editForm!.nameVi?.trim()) { onToast("Tên (VI) là bắt buộc", "error"); return; }
                updateMutation.mutate({ id: editAttr.id, data: editForm! });
              }}
                disabled={updateMutation.isPending}
                style={{ flex: 1, padding: "10px", background: GRD.primary, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontFamily: DS.mono, fontSize: 13, fontWeight: 600 }}>
                {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </SlideDrawer>
      )}
    </div>
  );
}

const ToggleCell = ({ value, onToggle, color, loading }: { value: boolean; onToggle: (v: boolean) => void; color: string; loading: boolean }) => (
  <button onClick={() => !loading && onToggle(!value)} disabled={loading}
    style={{
      padding: "2px 6px", borderRadius: 4, border: "none", cursor: loading ? "default" : "pointer",
      fontSize: 10, fontFamily: DS.mono, fontWeight: 700,
      background: value ? color : DS.bgCard3,
      color: value ? "#fff" : DS.text5,
      opacity: loading ? 0.6 : 1,
    }}>
    {value ? "✓" : "—"}
  </button>
);

const thStyle: React.CSSProperties = { padding: "10px 8px", textAlign: "center", color: DS.text5, fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", borderBottom: `1px solid ${DS.border}` };
const tdStyle: React.CSSProperties = { padding: "10px 8px", textAlign: "center", color: DS.text3, fontSize: 12 };
const actionBtnStyle: React.CSSProperties = { padding: "4px 6px", background: DS.bgCard3, border: `1px solid ${DS.border}`, borderRadius: 6, cursor: "pointer", color: DS.text3, display: "flex", alignItems: "center" };

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WebPackagesPage() {
  const qc = useQueryClient();

  // Drawer state
  const [editPkg, setEditPkg] = useState<WebPackage | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmSite, setConfirmSite] = useState<CustomerWebsite | null>(null);
  const [configureSite, setConfigureSite] = useState<CustomerWebsite | null>(null);

  // Tier feature drawer state
  const [tierDrawerPkg, setTierDrawerPkg] = useState<WebPackage | null>(null);
  const [tierDrawerLevel, setTierDrawerLevel] = useState<number>(1);

  // Filters
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"revenue" | "orders" | "price">("revenue");
  const [activeSection, setActiveSection] = useState<"packages" | "websites" | "attributes">("packages");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Fetch packages
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "web-packages"],
    queryFn: async () => {
      const res = await adminApi.get<{ data: ApiPackage[] }>("/api/admin/packages/web-packages");
      return res;
    },
  });

  // Fetch FeatureGroups with enriched features + includedTiers
  const { data: featureGroupsRes } = useQuery({
    queryKey: ["admin", "feature-groups"],
    queryFn: async () => {
      const res = await adminApi.get<{ data: FeatureGroupWithFeatures[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>("/api/admin/feature-groups?limit=100");
      return res;
    },
  });

  // Build feature name lookup map (CUID → featureName)
  const featureNameMap = useMemo(() => {
    const map = new Map<string, string>();
    const groups = featureGroupsRes?.data ?? [];
    for (const g of groups) {
      for (const f of (g as unknown as { features?: Array<{ id: string; featureName: string }> }).features ?? []) {
        map.set(f.id, f.featureName);
      }
    }
    return map;
  }, [featureGroupsRes]);

  // Build tier → feature count map from FeatureGroup data
  const tierCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const groups = featureGroupsRes?.data ?? [];
    for (const g of groups) {
      const features = (g as unknown as { features?: Array<{ id: string; includedTiers: unknown }> }).features ?? [];
      for (const f of features) {
        const tiers = ((f as unknown as { includedTiers: number[] }).includedTiers ?? []) as number[];
        for (const t of tiers) {
          if (t >= 1 && t <= 4) counts[t] = (counts[t] ?? 0) + 1;
        }
      }
    }
    return counts;
  }, [featureGroupsRes]);

  // Toggle feature tier mutation
  const toggleFeatureTier = useMutation({
    mutationFn: async ({ featureId, tierLevel, included, includedTiers }: { featureId: string; tierLevel: number; included: boolean; includedTiers: number[] }) => {
      await adminApi.post("/api/admin/features/toggle-tier", { featureId, tierLevel, included, includedTiers });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "feature-groups"] });
    },
    onError: (err: Error) => setToast({ message: "Cập nhật thất bại: " + err.message, type: "error" }),
  });

  const allPackages = useMemo<WebPackage[]>(() => {
    const apiList = data?.data;
    if (apiList && apiList.length > 0) return apiList.map(toUIPackage);
    return INIT_PACKAGES;
  }, [data]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (formData: Partial<WebPackage>) => {
      const payload = formToApiPayload(formData);
      return adminApi.post<{ data: ApiPackage }>("/api/admin/packages/web-packages", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "web-packages"] });
      setShowAdd(false);
    },
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : "Tạo thất bại", type: "error" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: formData }: { id: string; data: Partial<WebPackage> }) => {
      const payload = formToApiPayload(formData);
      return adminApi.patch<{ data: ApiPackage }>(`/api/admin/packages/web-packages/${id}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "web-packages"] });
      setEditPkg(null);
    },
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : "Cập nhật thất bại", type: "error" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.patch<{ data: ApiPackage }>(`/api/admin/packages/web-packages/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "web-packages"] }),
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : "Cập nhật thất bại", type: "error" }); },
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ id, data: d }: { id: string; data: { registeredAt: string; domainExpiresAt: string; hostingExpiresAt: string } }) =>
      adminApi.patch(`/api/admin/customer-websites/${id}`, {
        registeredAt: d.registeredAt,
        domainExpiresAt: d.domainExpiresAt,
        hostingExpiresAt: d.hostingExpiresAt,
        configStatus: "configured",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "customer-websites"] });
      setConfirmSite(null);
    },
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : "Xác nhận thất bại", type: "error" }); },
  });

  const configureMutation = useMutation({
    mutationFn: async ({ id, data: d }: { id: string; data: { vercelProjectUrl?: string } }) =>
      adminApi.patch(`/api/admin/customer-websites/${id}`, {
        configStatus: "delivered",
        ...(d.vercelProjectUrl && { vercelProjectUrl: d.vercelProjectUrl }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "customer-websites"] });
      setConfigureSite(null);
    },
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : "Cấu hình thất bại", type: "error" }); },
  });

  // Filtered & sorted list
  const filtered = useMemo(() => {
    let list = allPackages;
    if (filterActive === "active") list = list.filter(p => p.isActive);
    if (filterActive === "inactive") list = list.filter(p => !p.isActive);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.industry || p.name || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sortBy === "revenue") sorted.sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0));
    else if (sortBy === "orders") sorted.sort((a, b) => (b.orderCount ?? 0) - (a.orderCount ?? 0));
    else if (sortBy === "price") sorted.sort((a, b) => (b.fullPrice || b.price || 0) - (a.fullPrice || a.price || 0));
    return sorted;
  }, [allPackages, filterActive, search, sortBy]);

  const totalRevenue = allPackages.reduce((s, p) => s + (p.revenue ?? 0), 0);
  const totalOrders = allPackages.reduce((s, p) => s + (p.orderCount ?? 0), 0);
  const activeCount = allPackages.filter(p => p.isActive).length;

  // SVG chart
  const maxRevenue = Math.max(...allPackages.map(p => p.revenue ?? 0), 1);
  const BAR_W = 24;
  const CHART_H = 48;

  const isMutatingPackage = createMutation.isPending || updateMutation.isPending;
  const isMutatingConfirm = confirmMutation.isPending;
  const isMutatingConfigure = configureMutation.isPending;

  return (
    <div style={{ padding: "24px", minHeight: "100vh", backgroundColor: DS.bg }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        .web-table-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .web-table-scroll::-webkit-scrollbar-track { background: transparent; }
        .web-table-scroll::-webkit-scrollbar-thumb { background: ${DS.border}; border-radius: 3px; }
        .web-table-scroll::-webkit-scrollbar-thumb:hover { background: ${DS.text4}; }
      `}</style>

      {/* Header */}
      <div style={{
        background: DS.bgCard,
        border: `1px solid ${DS.border}`,
        borderRadius: 20,
        padding: "20px 24px",
        marginBottom: "1.5rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Cosmic accent line */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: GRD.primary,
          borderRadius: "20px 20px 0 0",
        }} />

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}>
          {/* Left: Title + stats */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Icon */}
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: `${DS.pink}15`,
              border: `1px solid ${DS.pink}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 20px ${DS.pink}15`,
              flexShrink: 0,
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={DS.pink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>

            <div>
              <h2 style={{
                fontFamily: DS.heading,
                fontSize: 22,
                fontWeight: 800,
                margin: "0 0 4px",
                background: `linear-gradient(135deg, ${DS.text} 0%, ${DS.cosmicPurple} 50%, ${DS.pink} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Quản lý Web Packages
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {activeSection === "packages" && (
                  <>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 8px",
                      borderRadius: 20,
                      background: `${DS.green}15`,
                      border: `1px solid ${DS.green}30`,
                      fontSize: 10,
                      fontFamily: DS.mono,
                      color: DS.green,
                      fontWeight: 600,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: DS.green, display: "inline-block" }} />
                      {activeCount} đang hoạt động
                    </span>
                    <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                      ·
                    </span>
                    <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>
                      {allPackages.length} gói tổng
                    </span>
                  </>
                )}
                {activeSection === "websites" && (
                  <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                    Quản lý website khách hàng
                  </span>
                )}
                {activeSection === "attributes" && (
                  <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                    Cấu hình thuộc tính & tính năng
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Tabs + Actions */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Section tabs */}
            <div style={{
              display: "flex",
              background: `${DS.bg}50`,
              border: `1px solid ${DS.border}`,
              borderRadius: 14,
              padding: 4,
              gap: 2,
            }}>
              {[
                { key: "packages", label: "Gói Web", icon: <Package size={13} />, count: allPackages.length },
                { key: "websites", label: "Websites", icon: <Globe size={13} />, count: null },
                { key: "attributes", label: "Thuộc tính", icon: <DollarSign size={13} />, count: null },
              ].map(tab => {
                const isActive = activeSection === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveSection(tab.key as typeof activeSection)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 10,
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      fontFamily: DS.mono,
                      fontWeight: 600,
                      background: isActive
                        ? `linear-gradient(135deg, ${DS.cosmicPurple}22, ${DS.pink}22)`
                        : "transparent",
                      borderBottom: isActive ? `2px solid ${DS.pink}` : "2px solid transparent",
                      color: isActive ? DS.text : DS.text4,
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = `${DS.bgCard}80`;
                        (e.currentTarget as HTMLButtonElement).style.color = DS.text3;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        (e.currentTarget as HTMLButtonElement).style.color = DS.text4;
                      }
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.count !== null && (
                      <span style={{
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        background: isActive ? DS.pink : `${DS.text5}20`,
                        color: isActive ? "#fff" : DS.text4,
                        fontSize: 9,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 4px",
                      }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Packages-only actions */}
            {activeSection === "packages" && (
              <>
                <button
                  onClick={() => qc.invalidateQueries({ queryKey: ["admin", "web-packages"] })}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    background: "transparent",
                    border: `1px solid ${DS.border}`,
                    borderRadius: 12,
                    color: DS.text3,
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: DS.mono,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = DS.bgCard;
                    (e.currentTarget as HTMLButtonElement).style.borderColor = DS.text5;
                    (e.currentTarget as HTMLButtonElement).style.color = DS.text;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = DS.border;
                    (e.currentTarget as HTMLButtonElement).style.color = DS.text3;
                  }}
                >
                  <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
                  Làm mới
                </button>
                <button
                  onClick={() => setShowAdd(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 18px",
                    background: GRD.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: DS.mono,
                    boxShadow: `0 4px 15px ${DS.pink}40`,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 20px ${DS.pink}60`;
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 15px ${DS.pink}40`;
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                >
                  <Plus size={13} />
                  Thêm gói web
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 1: Gói Web Templates ── */}
      {activeSection === "packages" && (
        <>
          {/* KPI */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}>
            {[
              {
                label: "Tổng doanh thu",
                value: totalRevenue >= 1_000_000
                  ? `${(totalRevenue / 1_000_000).toFixed(0)}M VNĐ`
                  : totalRevenue.toLocaleString("vi-VN"),
                color: DS.green,
                icon: <DollarSign size={18} />,
              },
              { label: "Đơn hàng đã bán", value: totalOrders, color: DS.blue, icon: <Package size={18} /> },
              { label: "Gói đang active", value: `${activeCount}/${allPackages.length}`, color: DS.purple, icon: <ToggleRight size={18} /> },
            ].map(s => (
              <div key={s.label} style={{
                background: DS.bgCard,
                border: `1px solid ${DS.border}`,
                borderRadius: 16,
                padding: "1rem",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: `${s.color}15`,
                  border: `1px solid ${s.color}25`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <div style={{ color: s.color, fontFamily: DS.mono, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
                <div style={{ color: DS.text3, fontSize: 12, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          <div style={{
            background: DS.bgCard,
            border: `1px solid ${DS.border}`,
            borderRadius: 16,
            padding: "1.25rem",
            marginBottom: "1.5rem",
          }}>
            <div style={{
              color: DS.text3,
              fontSize: 11,
              fontFamily: DS.mono,
              letterSpacing: "0.15em",
              marginBottom: 16,
            }}>
              ── DOANH THU THEO GÓI WEB
            </div>
            <div style={{ overflowX: "auto" }}>
              <svg
                width={Math.max(allPackages.length * (BAR_W + 12) + 40, 400)}
                height={CHART_H + 36}
                style={{ display: "block", minWidth: 400 }}
              >
                {allPackages.map((p, i) => {
                  const barH = Math.max(((p.revenue ?? 0) / maxRevenue) * CHART_H, 2);
                  const x = i * (BAR_W + 12) + 20;
                  const y = CHART_H - barH;
                  return (
                    <g key={p.id}>
                      <rect
                        x={x} y={y} width={BAR_W} height={barH} rx={4}
                        fill={p.isActive ? p.color : DS.border}
                        opacity={p.isActive ? 0.85 : 0.4}
                      />
                      <foreignObject x={x + BAR_W / 2 - 9} y={CHART_H + 4} width={18} height={18}>
                        <span style={{ fontSize: 14, lineHeight: 1 }}>{p.icon}</span>
                      </foreignObject>
                      {(p.revenue ?? 0) > 0 && (
                        <text x={x + BAR_W / 2} y={y - 3} textAnchor="middle" style={{ fontSize: 8, fill: p.color, fontFamily: "monospace" }}>
                          {((p.revenue ?? 0) / 1_000_000).toFixed(0)}M
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Toolbar */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 12,
                background: DS.bgCard,
                border: `1px solid ${DS.border}`,
              }}>
                <Search size={13} style={{ color: DS.text5 }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm gói web theo tên, danh mục..."
                  style={{
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: DS.text3,
                    fontSize: 13,
                    flex: 1,
                  }}
                />
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 12,
                background: DS.bgCard,
                border: `1px solid ${DS.border}`,
              }}>
                <ArrowUpDown size={12} style={{ color: DS.text5 }} />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  style={{
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: DS.text4,
                    fontSize: 12,
                    fontFamily: DS.mono,
                    cursor: "pointer",
                  }}
                >
                  <option value="revenue">Doanh thu</option>
                  <option value="orders">Đơn hàng</option>
                  <option value="price">Giá</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {(["all", "active", "inactive"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterActive(f)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 10,
                    fontFamily: DS.mono,
                    cursor: "pointer",
                    border: `1px solid ${filterActive === f ? DS.blue : DS.border}`,
                    background: filterActive === f ? "rgba(59,130,246,0.12)" : "none",
                    color: filterActive === f ? DS.blue : DS.text5,
                  }}
                >
                  {f === "all" ? `TẤT CẢ (${allPackages.length})`
                    : f === "active" ? `ACTIVE (${activeCount})`
                      : `ẨN (${allPackages.length - activeCount})`}
                </button>
              ))}
              <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginLeft: "auto" }}>
                {filtered.length} / {allPackages.length} gói web
              </span>
            </div>
          </div>

          {/* Column headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr 120px",
            gap: 16,
            padding: "0 1rem",
            marginBottom: 8,
          }}>
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em" }}>
              TÊN GÓI WEB
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              color: DS.text5,
              fontSize: 9,
              fontFamily: DS.mono,
              letterSpacing: "0.12em",
            }}>
              <span style={{ textAlign: "center" }}>GIÁ FULL</span>
              <span style={{ textAlign: "center" }}>ĐƠN ĐÃ BÁN</span>
              <span style={{ textAlign: "center" }}>DOANH THU</span>
              <span style={{ textAlign: "center" }}>LP THƯỞNG</span>
            </div>
            <div style={{
              color: DS.text5,
              fontSize: 9,
              fontFamily: DS.mono,
              letterSpacing: "0.12em",
              textAlign: "right",
            }}>
              THAO TÁC
            </div>
          </div>

          {/* Package list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <AnimatePresence>
              {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                  <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: DS.blue }} />
                </div>
              ) : filtered.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "3rem",
                  color: DS.text4,
                  background: DS.bgCard,
                  border: `1px solid ${DS.border}`,
                  borderRadius: 12,
                }}>
                  <Package size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <div style={{ fontSize: 14 }}>Không tìm thấy gói web</div>
                </div>
              ) : (
                filtered.map((pkg, i) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <PackageRow
                      pkg={pkg}
                      onToggle={() => toggleMutation.mutate({ id: pkg.id, isActive: !pkg.isActive })}
                      onUpdate={async (field: string, value: unknown) => {
                        await adminApi.patch(`/api/admin/packages/web-packages/${pkg.id}`, { [field]: value });
                      }}
                      featureNameMap={featureNameMap}
                      tierCounts={tierCounts}
                      onManageTier={(level) => {
                        setTierDrawerPkg(pkg);
                        setTierDrawerLevel(level);
                      }}
                    />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* ── SECTION 2: Customer Websites ── */}
      {activeSection === "websites" && (
        <CustomerWebsitesSection
          onConfirmDomain={setConfirmSite}
          onConfigureDone={setConfigureSite}
          onConfirmDomainMutating={isMutatingConfirm}
          onConfigureDoneMutating={isMutatingConfigure}
          onToast={(msg, type) => setToast({ message: msg, type })}
        />
      )}

      {/* ── SECTION 3: Service Attributes ── */}
      {activeSection === "attributes" && <ServiceAttributeTab onToast={(msg, type) => setToast({ message: msg, type })} />}

      {/* ── Drawers ── */}
      <EditPackageDrawer
        isOpen={!!editPkg}
        pkg={editPkg}
        onClose={() => setEditPkg(null)}
        onSave={(data) => {
          if (editPkg) updateMutation.mutate({ id: editPkg.id, data });
        }}
        isMutating={updateMutation.isPending}
        featureNameMap={featureNameMap}
      />

      <TierFeatureDrawer
        isOpen={!!tierDrawerPkg}
        tierLevel={tierDrawerLevel}
        groups={featureGroupsRes?.data as unknown as FeatureGroupWithFeatures[] ?? []}
        onSave={async (changes) => {
          for (const { featureId, includedTiers } of changes) {
            await toggleFeatureTier.mutateAsync({ featureId, tierLevel: tierDrawerLevel, included: includedTiers.includes(tierDrawerLevel), includedTiers });
          }
        }}
        onClose={() => setTierDrawerPkg(null)}
        isMutating={toggleFeatureTier.isPending}
      />

      <AddPackageDrawer
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={(data) => createMutation.mutate(data)}
        isMutating={createMutation.isPending}
      />

      <ConfirmDomainDrawer
        isOpen={!!confirmSite}
        website={confirmSite}
        onClose={() => setConfirmSite(null)}
        onConfirm={(data) => {
          if (confirmSite) confirmMutation.mutate({ id: confirmSite.id, data });
        }}
        isMutating={confirmMutation.isPending}
      />

      <ConfigureDoneDrawer
        isOpen={!!configureSite}
        website={configureSite}
        onClose={() => setConfigureSite(null)}
        onConfirm={(data) => {
          if (configureSite) configureMutation.mutate({ id: configureSite.id, data });
        }}
        isMutating={configureMutation.isPending}
      />

      {toast && (
        <NotificationToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
