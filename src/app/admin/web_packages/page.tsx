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

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
 Plus, Edit3, Save, X, Search, ToggleRight, ToggleLeft,
 CheckCircle2, ArrowUpDown, Package, DollarSign, CalendarClock,
 PlusCircle, RefreshCw, Globe, Server, CheckCircle,
 AlertCircle, Clock, ExternalLink, RotateCcw, ShieldCheck, Rocket,
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

/** CustomerWebsite record shape from API */
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

// ── SECTION 2: Customer Websites Management ────────────────────────────────────

/** Format date string to DD/MM/YYYY or relative */
function formatDate(dateStr: string | null): string {
 if (!dateStr) return "—";
 const d = new Date(dateStr);
 return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Get days until expiry */
function daysUntil(dateStr: string | null): number | null {
 if (!dateStr) return null;
 const now = new Date();
 const target = new Date(dateStr);
 const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
 return diff;
}

/** Status badge colors */
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

/** Confirm Domain Modal */
function ConfirmDomainModal({
 website,
 onClose,
 onConfirm,
}: {
 website: CustomerWebsite;
 onClose: () => void;
 onConfirm: (data: { registeredAt: string; domainExpiresAt: string; hostingExpiresAt: string }) => void;
}) {
 const now = new Date();
 const defaultDomainExpiry = new Date(now);
 defaultDomainExpiry.setMonth(defaultDomainExpiry.getMonth() + (website.domainTermMonths || 12));
 const defaultHostingExpiry = new Date(now);
 defaultHostingExpiry.setMonth(defaultHostingExpiry.getMonth() + (website.hostingTermMonths || 12));

 const [registeredAt, setRegisteredAt] = useState(now.toISOString().split("T")[0]);
 const [domainExpiresAt, setDomainExpiresAt] = useState(defaultDomainExpiry.toISOString().split("T")[0]);
 const [hostingExpiresAt, setHostingExpiresAt] = useState(defaultHostingExpiry.toISOString().split("T")[0]);

 const inputStyle: React.CSSProperties = {
 width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`,
 borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13, outline: "none",
 };

 return (
 <motion.div
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 onClick={onClose}
 style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.92)", backdropFilter: "blur(12px)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
 >
 <motion.div
 initial={{ scale: 0.95 }} animate={{ scale: 1 }}
 onClick={e => e.stopPropagation()}
 style={{ background: DS.bgCard, border: `1px solid ${DS.green}40`, borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
 >
 <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${DS.border}`, background: `${DS.green}08`, flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
 <div>
 <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>── XÁC NHẬN ĐĂNG KÝ DOMAIN</div>
 <div style={{ color: DS.green, fontSize: 14, fontWeight: 700, marginTop: 2 }}>{website.domain}</div>
 </div>
 <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
 </div>
 <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
 {/* Domain info summary */}
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0.75rem", background: DS.bgCard2, borderRadius: 10, border: `1px solid ${DS.border}` }}>
 <div>
 <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>TÊN MIỀN</div>
 <div style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{website.domain}</div>
 </div>
 <div>
 <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>TLD</div>
 <div style={{ color: DS.text, fontSize: 13 }}>{website.domainTld || "—"}</div>
 </div>
 <div>
 <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>TERM</div>
 <div style={{ color: DS.text, fontSize: 13 }}>{website.domainTermMonths} tháng</div>
 </div>
 <div>
 <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>CHI PHÍ</div>
 <div style={{ color: DS.green, fontSize: 13, fontWeight: 600 }}>{(website.domainCost || 0).toLocaleString("vi-VN")} VNĐ</div>
 </div>
 </div>

 <div>
 <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 6 }}>NGÀY ĐĂNG KÝ THỰC TẾ</label>
 <input type="date" value={registeredAt} onChange={e => setRegisteredAt(e.target.value)} style={inputStyle} />
 </div>
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
 <div>
 <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 6 }}>HẾT HẠN DOMAIN</label>
 <input type="date" value={domainExpiresAt} onChange={e => setDomainExpiresAt(e.target.value)} style={inputStyle} />
 </div>
 <div>
 <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 6 }}>HẾT HẠN HOSTING</label>
 <input type="date" value={hostingExpiresAt} onChange={e => setHostingExpiresAt(e.target.value)} style={inputStyle} />
 </div>
 </div>
 <div style={{ padding: "0.75rem", borderRadius: 10, background: `${DS.green}08`, border: `1px solid ${DS.green}20` }}>
 <div style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono }}>Sau khi xác nhận:</div>
 <ul style={{ color: DS.text4, fontSize: 11, margin: "4px 0 0 16px", padding: 0 }}>
 <li>Domain sẽ được đánh dấu là đã đăng ký thực tế</li>
 <li>Notification sẽ được gửi cho khách hàng</li>
 <li>Website sẽ chuyển sang trạng thái chờ cấu hình Vercel</li>
 </ul>
 </div>
 </div>
 <div style={{ display: "flex", gap: 12, padding: "1.25rem 1.5rem", borderTop: `1px solid ${DS.border}`, flexShrink: 0 }}>
 <button onClick={onClose} style={{ flex: 1, background: "none", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px", color: DS.text3, cursor: "pointer", fontSize: 13 }}>Hủy</button>
 <button onClick={() => onConfirm({ registeredAt, domainExpiresAt, hostingExpiresAt })}
 style={{ flex: 2, background: DS.green, color: "#fff", border: "none", borderRadius: 10, padding: "10px", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
 <ShieldCheck size={14} /> Xác nhận domain
 </button>
 </div>
 </motion.div>
 </motion.div>
 );
}

/** Configure Done Modal */
function ConfigureDoneModal({
 website,
 onClose,
 onConfirm,
}: {
 website: CustomerWebsite;
 onClose: () => void;
 onConfirm: (data: { vercelProjectUrl?: string }) => void;
}) {
 const [vercelUrl, setVercelUrl] = useState(website.vercelProjectUrl || "");
 const inputStyle: React.CSSProperties = {
 width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`,
 borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13, outline: "none",
 };

 return (
 <motion.div
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 onClick={onClose}
 style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.92)", backdropFilter: "blur(12px)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
 >
 <motion.div
 initial={{ scale: 0.95 }} animate={{ scale: 1 }}
 onClick={e => e.stopPropagation()}
 style={{ background: DS.bgCard, border: `1px solid ${DS.blue}40`, borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
 >
 <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${DS.border}`, background: `${DS.blue}08`, flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
 <div>
 <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>── HOÀN TẤT CẤU HÌNH</div>
 <div style={{ color: DS.blue, fontSize: 14, fontWeight: 700, marginTop: 2 }}>{website.domain || website.name}</div>
 </div>
 <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
 </div>
 <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
 <div>
 <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 6 }}>VERCEL PROJECT URL (TÙY CHỌN)</label>
 <input value={vercelUrl} onChange={e => setVercelUrl(e.target.value)} placeholder="https://your-site.vercel.app" style={inputStyle} />
 </div>
 <div style={{ padding: "0.75rem", borderRadius: 10, background: `${DS.blue}08`, border: `1px solid ${DS.blue}20` }}>
 <div style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono }}>Sau khi hoàn tất:</div>
 <ul style={{ color: DS.text4, fontSize: 11, margin: "4px 0 0 16px", padding: 0 }}>
 <li>Website được đánh dấu là đã cấu hình xong</li>
 <li>Khách hàng nhận notification thông báo</li>
 </ul>
 </div>
 </div>
 <div style={{ display: "flex", gap: 12, padding: "1.25rem 1.5rem", borderTop: `1px solid ${DS.border}`, flexShrink: 0 }}>
 <button onClick={onClose} style={{ flex: 1, background: "none", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px", color: DS.text3, cursor: "pointer", fontSize: 13 }}>Hủy</button>
 <button onClick={() => onConfirm({ vercelProjectUrl: vercelUrl || undefined })}
 style={{ flex: 2, background: DS.blue, color: "#fff", border: "none", borderRadius: 10, padding: "10px", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
 <CheckCircle size={14} /> Hoàn tất cấu hình
 </button>
 </div>
 </motion.div>
 </motion.div>
 );
}

/** Customer Websites Section */
function CustomerWebsitesSection() {
 const qc = useQueryClient();
 const [search, setSearch] = useState("");
 const [filterStatus, setFilterStatus] = useState<string>("all");
 const [confirmSite, setConfirmSite] = useState<CustomerWebsite | null>(null);
 const [configureSite, setConfigureSite] = useState<CustomerWebsite | null>(null);
 const [page, setPage] = useState(1);

 // Fetch customer websites
 const { data: listRes, isLoading, isFetching, refetch } = useQuery({
 queryKey: ["admin", "customer-websites", filterStatus, page],
 queryFn: async () => {
 const params = new URLSearchParams({ page: String(page), limit: "20" });
 if (filterStatus !== "all") params.set("configStatus", filterStatus);
 const res = await adminApi.get<{ data: CustomerWebsite[]; pagination: { total: number; page: number; totalPages: number } }>(`/api/admin/customer-websites?${params}`);
 return res;
 },
 });

 const websites: CustomerWebsite[] = listRes?.data ?? [];
 const pagination = listRes?.pagination;

 // Toggle auto-renew mutations
 const toggleDomainRenew = useMutation({
 mutationFn: async ({ id, auto }: { id: string; auto: boolean }) => {
 return adminApi.patch(`/api/admin/customer-websites/${id}`, { autoRenewDomain: auto });
 },
 onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "customer-websites"] }),
 });

 const toggleHostingRenew = useMutation({
 mutationFn: async ({ id, auto }: { id: string; auto: boolean }) => {
 return adminApi.patch(`/api/admin/customer-websites/${id}`, { autoRenewHosting: auto });
 },
 onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "customer-websites"] }),
 });

 // Confirm domain mutation
 const confirmMutation = useMutation({
 mutationFn: async ({ id, data }: { id: string; data: { registeredAt: string; domainExpiresAt: string; hostingExpiresAt: string } }) => {
 return adminApi.patch(`/api/admin/customer-websites/${id}`, {
 registeredAt: data.registeredAt,
 domainExpiresAt: data.domainExpiresAt,
 hostingExpiresAt: data.hostingExpiresAt,
 configStatus: "configured",
 });
 },
 onSuccess: () => {
 qc.invalidateQueries({ queryKey: ["admin", "customer-websites"] });
 setConfirmSite(null);
 },
 });

 // Configure done mutation
 const configureMutation = useMutation({
 mutationFn: async ({ id, data }: { id: string; data: { vercelProjectUrl?: string } }) => {
 return adminApi.patch(`/api/admin/customer-websites/${id}`, {
 configStatus: "delivered",
 ...(data.vercelProjectUrl && { vercelProjectUrl: data.vercelProjectUrl }),
 });
 },
 onSuccess: () => {
 qc.invalidateQueries({ queryKey: ["admin", "customer-websites"] });
 setConfigureSite(null);
 },
 });


 // Deploy mutation
 const [deployingId, setDeployingId] = useState<string | null>(null);
 const deployMutation = useMutation({
 mutationFn: async ({ id }: { id: string }) => {
 return adminApi.post(`/api/admin/customer-websites/${id}/deploy`);
 },
 onSuccess: (data) => {
 qc.invalidateQueries({ queryKey: ["admin", "customer-websites"] });
 const url = (data as { data?: { deploymentUrl?: string } })?.data?.deploymentUrl;
 if (url) window.open(url, '_blank');
 },
 onError: (err: Error) => {
 alert('Deploy that bai: ' + err.message);
 },
 });

 // Cancel mutation
 const cancelMutation = useMutation({
 mutationFn: async (id: string) => {
 return adminApi.patch(`/api/admin/customer-websites/${id}`, { status: "cancelled" });
 },
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

 // KPI
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
 {/* KPI cards */}
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
 {[
 { label: "Tổng website", value: websites.length, color: DS.blue, icon: <Globe size={18} /> },
 { label: "Chờ duyệt", value: pendingCount, color: DS.amber, icon: <Clock size={18} /> },
 { label: "Sắp hết domain", value: expiringDomains, color: DS.red, icon: <AlertCircle size={18} /> },
 { label: "Sắp hết hosting", value: expiringHosting, color: "#F59E0B", icon: <Server size={18} /> },
 { label: "Tổng chi phí", value: totalCost >= 1_000_000 ? `${(totalCost / 1_000_000).toFixed(0)}M` : totalCost.toLocaleString("vi-VN"), color: DS.green, icon: <DollarSign size={18} /> },
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

 {/* Toolbar */}
 <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
 <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 12, background: DS.bgCard, border: `1px solid ${DS.border}` }}>
 <Search size={13} style={{ color: DS.text5 }} />
 <input value={search} onChange={e => setSearch(e.target.value)}
 placeholder="Tìm domain, tên, khách hàng..."
 style={{ background: "none", border: "none", outline: "none", color: DS.text3, fontSize: 13, flex: 1 }} />
 </div>
 <div style={{ display: "flex", gap: 6, padding: "8px 12px", borderRadius: 12, background: DS.bgCard, border: `1px solid ${DS.border}` }}>
 {(["all", "pending_config", "configured", "delivered"] as const).map(f => (
 <button key={f} onClick={() => { setFilterStatus(f); setPage(1); }}
 style={{ padding: "4px 12px", borderRadius: 20, fontSize: 10, fontFamily: DS.mono, cursor: "pointer",
 border: `1px solid ${filterStatus === f ? DS.blue : "transparent"}`,
 background: filterStatus === f ? "rgba(59,130,246,0.12)" : "none",
 color: filterStatus === f ? DS.blue : DS.text5 }}>
 {f === "all" ? "Tất cả" : f === "pending_config" ? "Chờ duyệt" : f === "configured" ? "Đã cấu hình" : "Đã bàn giao"}
 </button>
 ))}
 </div>
 <button onClick={() => refetch()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}>
 <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
 </button>
 </div>

 {/* Table */}
 <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, overflow: "hidden" }}>
 {/* Header */}
 <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 120px 100px 100px 120px 120px", gap: 12, padding: "10px 16px", borderBottom: `1px solid ${DS.border}`, background: DS.bgCard2 }}>
 {["WEBSITE", "DOMAIN / KHÁCH HÀNG", "HOSTING", "EXPIRY", "STATUS", "AUTO-RENEW", "ACTIONS"].map(h => (
 <div key={h} style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em" }}>{h}</div>
  ))}
 </div>

 {isLoading ? (
 <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
 <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
 </div>
 ) : filtered.length === 0 ? (
 <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>
 <Globe size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
 <div>Không tìm thấy website nào</div>
 </div>
 ) : (
 <div>
 {filtered.map(site => {
 const domainDays = daysUntil(site.domainExpiresAt);
 const hostingDays = daysUntil(site.hostingExpiresAt);
 const domainUrgent = domainDays !== null && domainDays <= 7;
 const hostingUrgent = hostingDays !== null && hostingDays <= 7;
 const csColor = CONFIG_STATUS_COLORS[site.configStatus] || DS.text4;
 const stColor = STATUS_COLORS[site.status] || DS.text4;

 return (
 <div key={site.id} style={{ display: "grid", gridTemplateColumns: "180px 1fr 120px 100px 100px 120px 120px", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${DS.border}30`, alignItems: "center" }}>
 {/* Website name */}
 <div>
 <div style={{ color: DS.text, fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{site.name}</div>
 {site.domain && <div style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono }}><Globe size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />{site.domain}</div>}
 </div>

 {/* Customer */}
 <div>
 <div style={{ color: DS.text3, fontSize: 12 }}>{site.customerName || "—"}</div>
 <div style={{ color: DS.text5, fontSize: 10 }}>{site.customerEmail || "—"}</div>
  <div style={{ color: DS.text5, fontSize: 10 }}>{site.customerPhone || "—"}</div>
 </div>

 {/* Hosting */}
 <div>
 <div style={{ color: DS.text3, fontSize: 11 }}>{site.hostingPlan?.name || site.hostingPlan?.nameVi || "—"}</div>
 <div style={{ color: DS.text5, fontSize: 10 }}>
 {site.hostingTermMonths} tháng · {(site.hostingCost || 0).toLocaleString("vi-VN")}đ
 </div>
 </div>

  {/* Expiry */}
 <div>
 {domainDays !== null && (
 <div style={{ color: domainUrgent ? DS.red : DS.text3, fontSize: 11, fontWeight: domainUrgent ? 700 : 400 }}>
 <Clock size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />
 Domain: {domainDays}d
 </div>
 )}
 {hostingDays !== null && (
 <div style={{ color: hostingUrgent ? DS.red : DS.text3, fontSize: 11, fontWeight: hostingUrgent ? 700 : 400 }}>
 <Server size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />
 Hosting: {hostingDays}d
 </div>
 )}
 {domainDays === null && hostingDays === null && <span style={{ color: DS.text5, fontSize: 11 }}>—</span>}
 </div>

 {/* Status */}
 <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
 <span style={{ fontSize: 10, fontFamily: DS.mono, background: `${csColor}15`, border: `1px solid ${csColor}40`, color: csColor, padding: "2px 8px", borderRadius: 6, display: "inline-block" }}>
 {CONFIG_STATUS_LABELS[site.configStatus] || site.configStatus}
 </span>
 <span style={{ fontSize: 10, fontFamily: DS.mono, background: `${stColor}15`, border: `1px solid ${stColor}40`, color: stColor, padding: "2px 8px", borderRadius: 6, display: "inline-block" }}>
 {site.status}
 </span>
 </div>

 {/* Auto-renew */}
 <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
 <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>Domain</span>
 <button
 onClick={() => toggleDomainRenew.mutate({ id: site.id, auto: !site.autoRenewDomain })}
 style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
 >
 {site.autoRenewDomain
 ? <ToggleRight size={20} style={{ color: DS.green }} />
 : <ToggleLeft size={20} style={{ color: DS.text5 }} />}
 </button>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
 <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>Hosting</span>
 <button
 onClick={() => toggleHostingRenew.mutate({ id: site.id, auto: !site.autoRenewHosting })}
 style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
 >
 {site.autoRenewHosting
 ? <ToggleRight size={20} style={{ color: DS.green }} />
 : <ToggleLeft size={20} style={{ color: DS.text5 }} />}
 </button>
 </div>
 </div>

 {/* Actions */}
 <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
 {site.configStatus === "pending_config" && (
 <button
 onClick={() => setConfirmSite(site)}
 style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, background: `${DS.green}15`, border: `1px solid ${DS.green}40`, color: DS.green, cursor: "pointer", fontSize: 10, fontFamily: DS.mono }}
 >
 <ShieldCheck size={10} /> Xác nhận
 </button>
 )}
 {site.configStatus === "configured" && (
 <button
 onClick={() => setConfigureSite(site)}
  style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, background: `${DS.blue}15`, border: `1px solid ${DS.blue}40`, color: DS.blue, cursor: "pointer", fontSize: 10, fontFamily: DS.mono }}
 >
 <CheckCircle size={10} /> Cấu hình xong
 </button>
 )}
 {site.vercelProjectUrl && (
 <a href={site.vercelProjectUrl} target="_blank" rel="noopener noreferrer"
 style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, background: `${DS.purple}15`, border: `1px solid ${DS.purple}40`, color: DS.purple, cursor: "pointer", fontSize: 10, fontFamily: DS.mono, textDecoration: "none" }}>
 <ExternalLink size={10} /> Vercel
 </a>
 )}
 {site.vercelProjectUrl && (
 <button
 onClick={() => {
 setDeployingId(site.id);
 deployMutation.mutate({ id: site.id });
 }}
 disabled={deployingId === site.id || deployMutation.isPending}
 style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, background: `${DS.pink}15`, border: `1px solid ${DS.pink}40`, color: DS.pink, cursor: deployingId === site.id ? "not-allowed" : "pointer", fontSize: 10, fontFamily: DS.mono }}
 >
 <Rocket size={10} /> {deployingId === site.id ? "..." : "Deploy"}
 </button>
 )}
 {site.status !== "cancelled" && site.configStatus !== "delivered" && (
 <button
 onClick={() => {
 if (confirm("Hủy website này?")) cancelMutation.mutate(site.id);
 }}
 style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, background: `${DS.red}10`, border: `1px solid ${DS.red}30`, color: DS.red, cursor: "pointer", fontSize: 10, fontFamily: DS.mono }}
 >
 <RotateCcw size={10} /> Hủy
  </button>
 )}
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
 <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
 style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${DS.border}`, background: DS.bgCard, color: page === 1 ? DS.text5 : DS.text3, cursor: page === 1 ? "default" : "pointer", fontSize: 12, fontFamily: DS.mono }}>
 ← Trước
 </button>
 <span style={{ padding: "6px 14px", color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>
 {page} / {pagination.totalPages}
 </span>
 <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages}
 style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${DS.border}`, background: DS.bgCard, color: page === pagination.totalPages ? DS.text5 : DS.text3, cursor: page === pagination.totalPages ? "default" : "pointer", fontSize: 12, fontFamily: DS.mono }}>
 Sau →
 </button>
 </div>
 )}

 {/* Modals */}
 <AnimatePresence>
 {confirmSite && (
 <ConfirmDomainModal
 website={confirmSite}
 onClose={() => setConfirmSite(null)}
 onConfirm={data => confirmMutation.mutate({ id: confirmSite.id, data })}
 />
 )}
 {configureSite && (
 <ConfigureDoneModal
 website={configureSite}
 onClose={() => setConfigureSite(null)}
 onConfirm={data => configureMutation.mutate({ id: configureSite.id, data })}
 />
 )}
 </AnimatePresence>
 </>
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
 const [activeSection, setActiveSection] = useState<"packages" | "websites">("packages");

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
 Web Packages
 </h2>
 <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
 {activeSection === "packages"
 ? `${allPackages.length} gói · ${activeCount} đang hoạt động`
 : "Quản lý website khách hàng"}
 </p>
 </div>
 <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
 {/* Section tabs */}
 <div style={{ display: "flex", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: 3, gap: 2 }}>
 <button
 onClick={() => setActiveSection("packages")}
 style={{
 padding: "5px 14px", borderRadius: 8, border: "none", cursor: "pointer",
 fontSize: 12, fontFamily: DS.mono, fontWeight: 600,
 background: activeSection === "packages" ? GRD.primary : "transparent",
 color: activeSection === "packages" ? "#fff" : DS.text4,
 transition: "all 0.2s",
 }}
 >
 <Package size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
 Gói Web
 </button>
 <button
 onClick={() => setActiveSection("websites")}
 style={{
 padding: "5px 14px", borderRadius: 8, border: "none", cursor: "pointer",
 fontSize: 12, fontFamily: DS.mono, fontWeight: 600,
 background: activeSection === "websites" ? GRD.primary : "transparent",
 color: activeSection === "websites" ? "#fff" : DS.text4,
 transition: "all 0.2s",
 }}
 >
 <Globe size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
 Websites
 </button>
 </div>

 {/* Packages-only actions */}
 {activeSection === "packages" && (
 <>
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
 </>
 )}
 </div>
 </div>

 {/* ── SECTION 1: Gói Web Templates ─────────────────────────────── */}
 {activeSection === "packages" && (
 <>
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
 </>
 )}

 {/* ── SECTION 2: Customer Websites ─────────────────────────────── */}
 {activeSection === "websites" && (
 <CustomerWebsitesSection />
 )}

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
