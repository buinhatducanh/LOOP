"use client";

/**
 * Web Packages Admin Page — LOOP Solutions
 * Route: /admin/web_packages
 * FIX #1 (2026-04-06): Wires local state → React Query mutations → API
 *   - AddPackageModal → POST /api/admin/packages/web-packages
 *   - EditModal     → PUT  /api/admin/packages/web-packages/[id]
 *   - Toggle active  → PUT  /api/admin/packages/web-packages/[id]
 *   - Delete         → DEL  /api/admin/packages/web-packages/[id]
 *   - Falls back to local INIT_PACKAGES only when API returns empty
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import {
  Plus, Edit3, Save, X, Search, ToggleRight, ToggleLeft,
  CheckCircle2, ArrowUpDown, Package, DollarSign, CalendarClock,
  PlusCircle, RefreshCw,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

/** API shape (Prisma PricingWebPackage) */
type ApiPackage = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  tagline: string;
  taglineVi: string;
  price: number;
  currency: string;
  period: string;
  periodVi: string;
  highlighted: boolean;
  cta: string;
  ctaVi: string;
  color: string;
  pages: number;
  pagesVi: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  [key: string]: unknown;
};

/** UI shape used throughout the component */
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
  trialDays: number;
  trialPrice: number;
  fullPrice: number;
  price: number;
  activateTime: string;
  lp: number;
  badge: string;
  badgeColor: string;
  features: string[];
  demoFeatures: string[];
  highlighted: boolean;
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
  trialRequests: number;
  revenue: number;
};

// ── Default init data (fallback when API empty) ────────────────────────────────

const INIT_PACKAGES: WebPackage[] = [
  { id: "nha-hang", slug: "website-nha-hang", name: "Website Nhà hàng", nameVi: "Website Nhà hàng", industry: "Website Nhà hàng", icon: "🍽️", color: "#EF4444", tagline: "Đặt bàn · Giao hàng · Quản lý", taglineVi: "Đặt bàn · Giao hàng · Quản lý", description: "", category: "ăn uống", trialDays: 7, trialPrice: 0, fullPrice: 8_800_000, price: 8_800_000, activateTime: "2 giờ", highlighted: false, cta: "Chọn gói", ctaVi: "Chọn gói", pages: 8, pagesVi: 8, sortOrder: 1, isActive: true, createdAt: "", badge: "HOT", badgeColor: "#EF4444", currency: "VND", period: "one-time", periodVi: "Một lần", features: ["Website demo đẹp", "Menu online", "Đặt bàn trực tuyến", "Giao hàng tích hợp", "Quản lý đơn hàng", "Hỗ trợ SEO cơ bản", "Giao diện mobile", "Báo cáo doanh thu"], demoFeatures: ["Đặt bàn", "Menu online", "Giao hàng"], lp: 500, orderCount: 14, trialRequests: 38, revenue: 123_200_000 },
  { id: "spa-salon", slug: "website-spa-salon", name: "Website Tiệm tóc/Spa", nameVi: "Website Tiệm tóc/Spa", industry: "Website Tiệm tóc/Spa", icon: "💇", color: "#EC4899", tagline: "Đặt lịch · Tích điểm · Nhắc nhắc", taglineVi: "Đặt lịch · Tích điểm · Nhắc nhắc", description: "", category: "sức khỏe", trialDays: 5, trialPrice: 0, fullPrice: 6_600_000, price: 6_600_000, activateTime: "2 giờ", highlighted: false, cta: "Chọn gói", ctaVi: "Chọn gói", pages: 8, pagesVi: 8, sortOrder: 2, isActive: true, createdAt: "", badge: "SALE", badgeColor: "#F59E0B", currency: "VND", period: "one-time", periodVi: "Một lần", features: ["Website spa mẫu", "Đặt lịch online", "Hệ thống tích điểm", "Nhắc lịch tự động", "Quản lý khách hàng", "Tích hợp Google Maps", "Giao diện di động", "Bảng giá dịch vụ"], demoFeatures: ["Đặt lịch", "Tích điểm", "Nhắc lịch"], lp: 350, orderCount: 11, trialRequests: 29, revenue: 72_600_000 },
  { id: "khach-san", slug: "website-khach-san", name: "Website Khách sạn", nameVi: "Website Khách sạn", industry: "Website Khách sạn", icon: "🏨", color: "#3B82F6", tagline: "Booking trực tuyến · Quản lý phòng", taglineVi: "Booking trực tuyến · Quản lý phòng", description: "", category: "lưu trú", trialDays: 7, trialPrice: 0, fullPrice: 15_000_000, price: 15_000_000, activateTime: "4 giờ", highlighted: false, cta: "Chọn gói", ctaVi: "Chọn gói", pages: 8, pagesVi: 8, sortOrder: 3, isActive: true, createdAt: "", badge: "", badgeColor: "#3B82F6", currency: "VND", period: "one-time", periodVi: "Một lần", features: ["Giao diện sang trọng", "Booking trực tuyến", "Quản lý phòng trống", "Thanh toán tích hợp", "Đánh giá khách hàng", "Hỗ trợ đa ngôn ngữ", "Tích hợp OTA", "Báo cáo chi tiết"], demoFeatures: ["Booking", "Quản lý phòng", "Thanh toán"], lp: 800, orderCount: 6, trialRequests: 18, revenue: 90_000_000 },
  { id: "cuahang", slug: "website-cua-hang", name: "Website Cửa hàng", nameVi: "Website Cửa hàng", industry: "Website Cửa hàng", icon: "🏪", color: "#22C55E", tagline: "Bán hàng · Kho · Giao hàng", taglineVi: "Bán hàng · Kho · Giao hàng", description: "", category: "mua sắm", trialDays: 5, trialPrice: 0, fullPrice: 9_900_000, price: 9_900_000, activateTime: "2 giờ", highlighted: false, cta: "Chọn gói", ctaVi: "Chọn gói", pages: 8, pagesVi: 8, sortOrder: 4, isActive: true, createdAt: "", badge: "NEW", badgeColor: "#22C55E", currency: "VND", period: "one-time", periodVi: "Một lần", features: ["Website bán hàng", "Quản lý kho", "Tích hợp vận chuyển", "Mã giảm giá", "Đánh giá sản phẩm", "So sánh giá", "Giao diện mobile", "Hỗ trợ đa cửa hàng"], demoFeatures: ["Bán hàng", "Kho hàng", "Vận chuyển"], lp: 500, orderCount: 9, trialRequests: 26, revenue: 89_100_000 },
  { id: "coffe", slug: "website-quan-ca-phe", name: "Website Quán Cà phê", nameVi: "Website Quán Cà phê", industry: "Website Quán Cà phê", icon: "☕", color: "#92400E", tagline: "Đặt món · Tích hợp giao hàng", taglineVi: "Đặt món · Tích hợp giao hàng", description: "", category: "ăn uống", trialDays: 7, trialPrice: 0, fullPrice: 7_700_000, price: 7_700_000, activateTime: "2 giờ", highlighted: false, cta: "Chọn gói", ctaVi: "Chọn gói", pages: 8, pagesVi: 8, sortOrder: 5, isActive: true, createdAt: "", badge: "", badgeColor: "#92400E", currency: "VND", period: "one-time", periodVi: "Một lần", features: ["Website quán cà phê", "Đặt món online", "Giao hàng tích hợp", "Hệ thống tích điểm", "Thanh toán online", "Menu động", "Blog ẩm thực", "Hỗ trợ đa ngôn ngữ"], demoFeatures: ["Đặt món", "Tích điểm", "Giao hàng"], lp: 400, orderCount: 7, trialRequests: 20, revenue: 53_900_000 },
  { id: "phongkham", slug: "website-phong-kham", name: "Website Phòng khám", nameVi: "Website Phòng khám", industry: "Website Phòng khám", icon: "🏥", color: "#14B8A6", tagline: "Đặt lịch khám · Hồ sơ bệnh nhân", taglineVi: "Đặt lịch khám · Hồ sơ bệnh nhân", description: "", category: "sức khỏe", trialDays: 7, trialPrice: 0, fullPrice: 12_000_000, price: 12_000_000, activateTime: "4 giờ", highlighted: false, cta: "Chọn gói", ctaVi: "Chọn gói", pages: 8, pagesVi: 8, sortOrder: 6, isActive: true, createdAt: "", badge: "", badgeColor: "#14B8A6", currency: "VND", period: "one-time", periodVi: "Một lần", features: ["Đặt lịch khám online", "Hồ sơ bệnh nhân", "Kê đơn điện tử", "Thanh toán bảo hiểm", "Nhắc lịch tái khám", "Báo cáo thống kê", "Tư vấn trực tuyến", "Hỗ trợ đa ngôn ngữ"], demoFeatures: ["Đặt lịch", "Hồ sơ", "Kê đơn"], lp: 600, orderCount: 4, trialRequests: 12, revenue: 48_000_000 },
  { id: "bds", slug: "website-bat-dong-san", name: "Website Bất động sản", nameVi: "Website Bất động sản", industry: "Website Bất động sản", icon: "🏠", color: "#8B5CF6", tagline: "Dự án · Môi giới · Listing", taglineVi: "Dự án · Môi giới · Listing", description: "", category: "bất động sản", trialDays: 5, trialPrice: 0, fullPrice: 22_000_000, price: 22_000_000, activateTime: "6 giờ", highlighted: false, cta: "Chọn gói", ctaVi: "Chọn gói", pages: 8, pagesVi: 8, sortOrder: 7, isActive: false, createdAt: "", badge: "", badgeColor: "#8B5CF6", currency: "VND", period: "one-time", periodVi: "Một lần", features: ["Website bất động sản", "Dự án 3D", "Listing sản phẩm", "Tìm kiếm nâng cao", "Bản đồ tích hợp", "Virtual tour 360°", "Môi giới CRM", "Báo cáo hiệu quả"], demoFeatures: ["Listing", "Bản đồ", "Virtual tour"], lp: 1200, orderCount: 2, trialRequests: 7, revenue: 44_000_000 },
];

const CATEGORIES = ["ăn uống", "sức khỏe", "lưu trú", "mua sắm", "giáo dục", "bất động sản"];
const COLORS = ["#3B82F6", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444", "#14B8A6", "#EC4899", "#C084FC", "#06B6D4", "#D97706"];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert API shape to UI shape */
function toUIPackage(p: ApiPackage): WebPackage {
  return {
    id: p.id,
    slug: p.slug ?? p.id,
    name: p.name ?? p.nameVi ?? "",
    nameVi: p.nameVi ?? p.name ?? "",
    industry: p.nameVi ?? p.name ?? "",
    icon: String((p as Record<string, unknown>).icon ?? "🌐"),
    color: p.color ?? "#3B82F6",
    tagline: p.tagline ?? p.taglineVi ?? "",
    taglineVi: p.taglineVi ?? p.tagline ?? "",
    description: String((p as Record<string, unknown>).description ?? ""),
    category: String((p as Record<string, unknown>).category ?? "ăn uống"),
    trialDays: Number((p as Record<string, unknown>).trialDays ?? 7),
    trialPrice: Number((p as Record<string, unknown>).trialPrice ?? 0),
    fullPrice: p.price ?? 0,
    price: p.price ?? 0,
    activateTime: String((p as Record<string, unknown>).activateTime ?? "2 giờ"),
    lp: Number((p as Record<string, unknown>).lp ?? 500),
    badge: String((p as Record<string, unknown>).badge ?? ""),
    badgeColor: String((p as Record<string, unknown>).badgeColor ?? p.color ?? "#3B82F6"),
    features: (Array.isArray((p as Record<string, unknown>).features) ? (p as Record<string, unknown>).features : []) as string[],
    demoFeatures: (Array.isArray((p as Record<string, unknown>).demoFeatures) ? (p as Record<string, unknown>).demoFeatures : []) as string[],
    highlighted: p.highlighted ?? false,
    cta: p.cta ?? "Chọn gói",
    ctaVi: p.ctaVi ?? p.cta ?? "Chọn gói",
    pages: p.pages ?? 0,
    pagesVi: p.pagesVi ?? p.pages ?? 0,
    sortOrder: p.sortOrder ?? 0,
    isActive: p.isActive ?? true,
    createdAt: p.createdAt ?? "",
    currency: p.currency ?? "VND",
    period: p.period ?? "one-time",
    periodVi: p.periodVi ?? "Một lần",
    orderCount: Number((p as Record<string, unknown>).orderCount ?? 0),
    trialRequests: Number((p as Record<string, unknown>).trialRequests ?? 0),
    revenue: Number((p as Record<string, unknown>).revenue ?? 0),
  };
}

/** Convert UI form data → API payload */
function formToApiPayload(form: Partial<WebPackage>): Record<string, unknown> {
  const slug = form.slug ?? (form.industry ?? form.name ?? "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return {
    slug,
    name: form.industry ?? form.name ?? "",
    nameVi: form.industry ?? form.name ?? "",
    tagline: form.tagline ?? "",
    taglineVi: form.tagline ?? "",
    price: form.fullPrice ?? form.price ?? 0,
    currency: "VND",
    period: "one-time",
    periodVi: "Một lần",
    highlighted: false,
    cta: "Chọn gói",
    ctaVi: "Chọn gói",
    color: form.color ?? "#3B82F6",
    pages: 8,
    pagesVi: 8,
    sortOrder: form.sortOrder ?? 0,
    isActive: form.isActive ?? true,
  };
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
  pkg,
  onClose,
  onSave,
}: {
  pkg: WebPackage;
  onClose: () => void;
  onSave: (updated: Partial<WebPackage>) => void;
}) {
  const [form, setForm] = useState({
    industry: pkg.industry || pkg.name || "",
    tagline: pkg.tagline || "",
    trialDays: pkg.trialDays,
    fullPrice: pkg.fullPrice || pkg.price || 0,
    activateTime: pkg.activateTime || "2 giờ",
    lp: pkg.lp,
    badge: pkg.badge ?? "",
    features: (pkg.features || []).join("\n"),
    demoFeatures: (pkg.demoFeatures || []).join("\n"),
  });

  const handleSave = () => {
    onSave({
      industry: form.industry,
      tagline: form.tagline,
      trialDays: Number(form.trialDays),
      fullPrice: Number(form.fullPrice),
      price: Number(form.fullPrice),
      activateTime: form.activateTime,
      lp: Number(form.lp),
      badge: form.badge || undefined,
      badgeColor: pkg.badgeColor ?? pkg.color,
      features: form.features.split("\n").filter(Boolean),
      demoFeatures: form.demoFeatures.split("\n").filter(Boolean),
    });
    onClose();
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 6, letterSpacing: "0.1em" }}>{label}</label>
      {children}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`,
    borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.92)", backdropFilter: "blur(12px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: DS.bgCard, border: `1px solid ${pkg.color}35`, borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${DS.border}`, background: `${pkg.color}08`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>{pkg.icon}</span>
              <div>
                <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>── CHỈNH SỬA GÓI WEB</div>
                <div style={{ color: pkg.color, fontSize: 15, fontWeight: 700 }}>{pkg.industry || pkg.name}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="TÊN GÓI WEB">
              <input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="BADGE (HOT, PREMIUM...)">
              <input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="Để trống nếu không có" style={inputStyle} />
            </Field>
          </div>
          <Field label="TAGLINE">
            <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} style={inputStyle} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="NGÀY DÙNG THỬ">
              <input type="number" min={1} max={30} value={form.trialDays}
                onChange={e => setForm(f => ({ ...f, trialDays: Number(e.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="GIÁ FULL (VNĐ)">
              <input type="number" value={form.fullPrice}
                onChange={e => setForm(f => ({ ...f, fullPrice: Number(e.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="LP THƯỞNG">
              <input type="number" value={form.lp}
                onChange={e => setForm(f => ({ ...f, lp: Number(e.target.value) }))} style={inputStyle} />
            </Field>
          </div>
          <Field label="TÍNH NĂNG ĐẦY ĐỦ (mỗi dòng 1 tính năng)">
            <textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
              rows={5} style={{ ...inputStyle, resize: "vertical", fontFamily: DS.mono, fontSize: 12 }} />
          </Field>
          <Field label="TÍNH NĂNG DEMO (hiển thị trên card, tối đa 3)">
            <textarea value={form.demoFeatures} onChange={e => setForm(f => ({ ...f, demoFeatures: e.target.value }))}
              rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: DS.mono, fontSize: 12 }} />
          </Field>
          <div style={{ padding: "1rem", borderRadius: 12, background: `${pkg.color}08`, border: `1px solid ${pkg.color}25` }}>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 8 }}>XEM TRƯỚC</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 24 }}>{pkg.icon}</span>
              <div>
                <div style={{ color: pkg.color, fontSize: 13, fontWeight: 700 }}>{form.industry}</div>
                <div style={{ color: DS.text5, fontSize: 11 }}>{form.tagline}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono }}>FREE {form.trialDays}N</div>
                <div style={{ color: pkg.color, fontSize: 15, fontWeight: 800 }}>{Number(form.fullPrice).toLocaleString("vi-VN")} VNĐ</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, padding: "1.25rem 1.5rem", borderTop: `1px solid ${DS.border}`, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, background: "none", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px", color: DS.text3, cursor: "pointer", fontSize: 13 }}>
            Hủy
          </button>
          <button onClick={handleSave}
            style={{ flex: 2, background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Save size={14} /> Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Add Package Modal ─────────────────────────────────────────────────────────

function AddPackageModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (pkg: Partial<WebPackage>) => void;
}) {
  const [form, setForm] = useState({
    industry: "",
    icon: "🌐",
    tagline: "",
    category: "ăn uống",
    trialDays: 5,
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
      trialDays: form.trialDays,
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
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`,
    borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13, outline: "none",
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.92)", backdropFilter: "blur(12px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}
        style={{ background: DS.bgCard, border: `1px solid ${DS.blue}35`, borderRadius: 16, width: "100%", maxWidth: 580, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${DS.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>── THÊM GÓI WEB MỚI</div>
              <div style={{ color: DS.blue, fontSize: 15, fontWeight: 700, marginTop: 2 }}>Tạo loại website mới</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <Field label="TÊN GÓI WEB">
              <input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                placeholder="Website Nhà hàng" style={inputStyle} />
            </Field>
            <Field label="ICON (EMOJI)">
              <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="🍽️" style={{ ...inputStyle, fontSize: 20, textAlign: "center" }} />
            </Field>
          </div>
          <Field label="MÀU SẮC CHÍNH">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: `3px solid ${form.color === c ? "#fff" : "transparent"}`, cursor: "pointer", boxShadow: form.color === c ? `0 0 8px ${c}` : "none" }} />
              ))}
            </div>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="DANH MỤC">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ ...inputStyle, cursor: "pointer" }}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="BADGE (TÙY CHỌN)">
              <input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                placeholder="HOT, NEW..." style={inputStyle} />
            </Field>
          </div>
          <Field label="TAGLINE">
            <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
              placeholder="Tính năng 1 · Tính năng 2 · Tính năng 3" style={inputStyle} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="NGÀY DÙNG THỬ">
              <input type="number" min={1} max={30} value={form.trialDays}
                onChange={e => setForm(f => ({ ...f, trialDays: Number(e.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="GIÁ FULL (VNĐ)">
              <input type="number" value={form.fullPrice}
                onChange={e => setForm(f => ({ ...f, fullPrice: Number(e.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="LP THƯỞNG">
              <input type="number" value={form.lp}
                onChange={e => setForm(f => ({ ...f, lp: Number(e.target.value) }))} style={inputStyle} />
            </Field>
          </div>
          <Field label="TÍNH NĂNG (mỗi dòng 1 tính năng)">
            <textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
              rows={3} placeholder={"Báo giá Website\nNhận báo giá online\nQuản lý khách hàng..."}
              style={{ ...inputStyle, resize: "vertical", fontFamily: DS.mono, fontSize: 12 }} />
          </Field>
          <Field label="TÍNH NĂNG DEMO (tối đa 3 dòng, hiển thị trên card)">
            <textarea value={form.demoFeatures} onChange={e => setForm(f => ({ ...f, demoFeatures: e.target.value }))}
              rows={2} placeholder={"Nhận báo giá\nQuản lý\nBáo cáo"}
              style={{ ...inputStyle, resize: "none", fontFamily: DS.mono, fontSize: 12 }} />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 12, padding: "1.25rem 1.5rem", borderTop: `1px solid ${DS.border}`, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, background: "none", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px", color: DS.text3, cursor: "pointer", fontSize: 13 }}>
            Hủy
          </button>
          <button onClick={handleAdd} disabled={!form.industry.trim()}
            style={{ flex: 2, background: form.industry.trim() ? GRD.primary : DS.bgCard2, color: form.industry.trim() ? "#fff" : DS.text5, border: "none", borderRadius: 10, padding: "10px", cursor: form.industry.trim() ? "pointer" : "default", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Plus size={14} /> Thêm gói web
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Package Row ──────────────────────────────────────────────────────────────

function PackageRow({
  pkg,
  onEdit,
  onToggle,
}: {
  pkg: WebPackage;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ border: `1px solid ${pkg.isActive ? DS.border : DS.border + "50"}`, borderRadius: 16, overflow: "hidden", opacity: pkg.isActive ? 1 : 0.55 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "1rem", background: DS.bgCard2 }}>
        <div style={{ minWidth: 200, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>{pkg.icon}</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: pkg.isActive ? DS.text : DS.text4, fontSize: 13, fontWeight: 700 }}>{pkg.industry || pkg.name}</span>
              {pkg.badge && (
                <span style={{ color: pkg.badgeColor ?? pkg.color, fontSize: 8, fontFamily: DS.mono, background: `${pkg.badgeColor ?? pkg.color}15`, border: `1px solid ${pkg.badgeColor ?? pkg.color}30`, padding: "1px 6px", borderRadius: 6 }}>{pkg.badge}</span>
              )}
            </div>
            <div style={{ color: DS.text5, fontSize: 10 }}>{pkg.category}</div>
          </div>
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>FREE/{pkg.trialDays}N</div>
            <div style={{ color: DS.text5, fontSize: 9 }}>{pkg.trialRequests} yêu cầu</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: pkg.color, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{(pkg.fullPrice || pkg.price || 0).toLocaleString("vi-VN")}</div>
            <div style={{ color: DS.text5, fontSize: 9 }}>VNĐ / gói full</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{pkg.orderCount}</div>
            <div style={{ color: DS.text5, fontSize: 9 }}>Đơn đã mua</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: DS.amber, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
              {pkg.revenue >= 1_000_000 ? `${(pkg.revenue / 1_000_000).toFixed(0)}M` : pkg.revenue.toLocaleString("vi-VN")}
            </div>
            <div style={{ color: DS.text5, fontSize: 9 }}>Doanh thu VNĐ</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button onClick={onToggle}
            style={{ background: "none", border: "none", cursor: "pointer", color: pkg.isActive ? DS.green : DS.text5, display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: DS.mono }}>
            {pkg.isActive ? <ToggleRight size={22} style={{ color: DS.green }} /> : <ToggleLeft size={22} />}
          </button>
          <button onClick={onEdit}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: `${pkg.color}12`, border: `1px solid ${pkg.color}30`, color: pkg.color, cursor: "pointer", fontSize: 11, fontFamily: DS.mono }}>
            <Edit3 size={12} /> Sửa
          </button>
          <button onClick={() => setExpanded(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: DS.text5, padding: 4 }}>
            {expanded ? <X size={15} /> : <PlusCircle size={15} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "1rem", background: DS.bgCard, borderTop: `1px solid ${DS.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 32px" }}>
                {(pkg.features || []).map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle2 size={10} style={{ color: pkg.color, flexShrink: 0 }} />
                    <span style={{ color: DS.text4, fontSize: 11 }}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${DS.border}` }}>
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>DEMO: </span>
                {(pkg.demoFeatures || []).map(f => (
                  <span key={f} style={{ color: pkg.color, fontSize: 10, fontFamily: DS.mono, background: `${pkg.color}10`, border: `1px solid ${pkg.color}25`, padding: "2px 8px", borderRadius: 5 }}>{f}</span>
                ))}
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginLeft: "auto" }}>
                  Kích hoạt: {pkg.activateTime} · LP thưởng: {(pkg.lp || 0).toLocaleString()} LP
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function WebPackagesPage() {
  const qc = useQueryClient();
  const [editPkg, setEditPkg] = useState<WebPackage | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"revenue" | "orders" | "price" | "trial">("revenue");

  // Fetch packages from API
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "web-packages"],
    queryFn: async () => {
      const res = await adminApi.get<{ data: ApiPackage[] }>("/api/admin/packages/web-packages");
      return res;
    },
  });

  // Convert API data to UI shape; fall back to INIT_PACKAGES if API empty
  const allPackages = useMemo<WebPackage[]>(() => {
    const apiList = data?.data;
    if (apiList && apiList.length > 0) {
      return apiList.map(toUIPackage);
    }
    return INIT_PACKAGES;
  }, [data]);

  // ── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (formData: Partial<WebPackage>) => {
      const payload = formToApiPayload(formData);
      const res = await adminApi.post<{ data: ApiPackage }>("/api/admin/packages/web-packages", payload);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "web-packages"] }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Tạo thất bại"); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: formData }: { id: string; data: Partial<WebPackage> }) => {
      const payload = formToApiPayload(formData);
      const res = await adminApi.put<{ data: ApiPackage }>(`/api/admin/packages/web-packages/${id}`, payload);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "web-packages"] }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Cập nhật thất bại"); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await adminApi.put<{ data: ApiPackage }>(`/api/admin/packages/web-packages/${id}`, { isActive });
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "web-packages"] }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Cập nhật thất bại"); },
  });

  const _deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.delete(`/api/admin/packages/web-packages/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "web-packages"] }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Xóa thất bại"); },
  });

  // ── Filtered & sorted list ───────────────────────────────────────────────

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
    else if (sortBy === "trial") sorted.sort((a, b) => (b.trialRequests ?? 0) - (a.trialRequests ?? 0));
    return sorted;
  }, [allPackages, filterActive, search, sortBy]);

  const totalRevenue = allPackages.reduce((s, p) => s + (p.revenue ?? 0), 0);
  const totalOrders = allPackages.reduce((s, p) => s + (p.orderCount ?? 0), 0);
  const totalTrials = allPackages.reduce((s, p) => s + (p.trialRequests ?? 0), 0);
  const activeCount = allPackages.filter(p => p.isActive).length;

  // SVG chart
  const maxRevenue = Math.max(...allPackages.map(p => p.revenue ?? 0), 1);
  const BAR_W = 24;
  const CHART_H = 48;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Gói Web Doanh Nghiệp
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {allPackages.length} gói · {activeCount} đang hoạt động
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "web-packages"] })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Làm mới
          </button>
          <button onClick={() => setShowAdd(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono, boxShadow: "0 0 16px rgba(129,140,248,0.3)" }}>
            <Plus size={13} /> Thêm gói web
          </button>
        </div>
      </div>

      {/* KPI overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Tổng doanh thu", value: totalRevenue >= 1_000_000 ? `${(totalRevenue / 1_000_000).toFixed(0)}M VNĐ` : totalRevenue.toLocaleString("vi-VN"), color: DS.green, icon: <DollarSign size={18} /> },
          { label: "Đơn hàng đã bán", value: totalOrders, color: DS.blue, icon: <Package size={18} /> },
          { label: "Yêu cầu dùng thử", value: totalTrials, color: DS.amber, icon: <CalendarClock size={18} /> },
          { label: "Gói đang active", value: `${activeCount}/${allPackages.length}`, color: DS.purple, icon: <ToggleRight size={18} /> },
        ].map(s => (
          <div key={s.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}15`, border: `1px solid ${s.color}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.mono, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue distribution SVG chart */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 16 }}>── DOANH THU THEO GÓI WEB</div>
        <div style={{ overflowX: "auto" }}>
          <svg width={Math.max(allPackages.length * (BAR_W + 12) + 40, 400)} height={CHART_H + 36} style={{ display: "block", minWidth: 400 }}>
            {allPackages.map((p, i) => {
              const barH = Math.max(((p.revenue ?? 0) / maxRevenue) * CHART_H, 2);
              const x = i * (BAR_W + 12) + 20;
              const y = CHART_H - barH;
              return (
                <g key={p.id}>
                  <rect x={x} y={y} width={BAR_W} height={barH} rx={4}
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
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 12, background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <Search size={13} style={{ color: DS.text5 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm gói web theo tên, danh mục..."
              style={{ background: "none", border: "none", outline: "none", color: DS.text3, fontSize: 13, flex: 1 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 12, background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <ArrowUpDown size={12} style={{ color: DS.text5 }} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
              style={{ background: "none", border: "none", outline: "none", color: DS.text4, fontSize: 12, fontFamily: DS.mono, cursor: "pointer" }}>
              <option value="revenue">Doanh thu</option>
              <option value="orders">Đơn hàng</option>
              <option value="trial">Dùng thử</option>
              <option value="price">Giá</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {(["all", "active", "inactive"] as const).map(f => (
            <button key={f} onClick={() => setFilterActive(f)}
              style={{ padding: "4px 12px", borderRadius: 20, fontSize: 10, fontFamily: DS.mono, cursor: "pointer", border: `1px solid ${filterActive === f ? DS.blue : DS.border}`, background: filterActive === f ? "rgba(59,130,246,0.12)" : "none", color: filterActive === f ? DS.blue : DS.text5 }}>
              {f === "all" ? `TẤT CẢ (${allPackages.length})` : f === "active" ? `ACTIVE (${activeCount})` : `ẨN (${allPackages.length - activeCount})`}
            </button>
          ))}
          <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginLeft: "auto" }}>
            {filtered.length} / {allPackages.length} gói web
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 120px", gap: 16, padding: "0 1rem", marginBottom: 8 }}>
        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em" }}>TÊN GÓI WEB</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em" }}>
          <span style={{ textAlign: "center" }}>DÙNG THỬ / YÊU CẦU</span>
          <span style={{ textAlign: "center" }}>GIÁ FULL</span>
          <span style={{ textAlign: "center" }}>ĐƠN ĐÃ BÁN</span>
          <span style={{ textAlign: "center" }}>DOANH THU</span>
        </div>
        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em", textAlign: "right" }}>THAO TÁC</div>
      </div>

      {/* Package list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <AnimatePresence>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12 }}>
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
                  onEdit={() => setEditPkg(pkg)}
                  onToggle={() => toggleMutation.mutate({ id: pkg.id, isActive: !pkg.isActive })}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editPkg && (
          <EditModal
            pkg={editPkg}
            onClose={() => setEditPkg(null)}
            onSave={(data) => {
              updateMutation.mutate({ id: editPkg.id, data });
              setEditPkg(null);
            }}
          />
        )}
        {showAdd && (
          <AddPackageModal
            onClose={() => setShowAdd(false)}
            onAdd={(formData) => {
              createMutation.mutate(formData);
              setShowAdd(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
