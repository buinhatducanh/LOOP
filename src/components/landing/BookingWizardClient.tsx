"use client";

/**
 * Booking Wizard Client Component — Next.js / BE
 * Route: /{locale}/booking
 *
 * 3-step wizard:
 *   0 Services  1 Package + Add-ons  2 Contact + Payment
 *
 * Uses: DS/GRD/GLOW design tokens, motion/react, lucide-react, next-intl
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Globe, Code2, BarChart3, Target, Check, ArrowRight, ArrowLeft,
  Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye,
} from "lucide-react";
import type { PricingConfig } from "@/lib/types/booking";

// ── Types ────────────────────────────────────────────────────────────────────

interface WizardService {
  id: string; title: string; desc: string;
  basePrice: number; color: string; perMonth?: boolean;
}
interface WizardPackage {
  id: string; name: string;
  /** Reserved for future use — currently all custom web uses fixed basePrice (3,890,000₫). */
  multiplier: number;
  color: string;
  desc: string; features: string[]; lp: number; popular?: boolean;
}
interface WizardFeature {
  id: string; label: string; labelEn?: string; price: number;
  category: string; xpPoints?: number; tier?: string;
  categoryEn?: string; parentId?: string | null;
  /** true = bao gồm trong 3,890,000₫ → hiển thị "✓ Đã bao gồm" thay vì giá */
  includedInBase?: boolean;
}
interface WizardTalent {
  id: string; name: string; role: string; rank: string;
  rankColor: string; rankSymbol: string; img: string; specialty: string;
}
interface WizardExtra {
  id: string; label: string; price: number; color: string;
}
interface WizardHostingPlan {
  id: string; slug: string; name: string;
  monthlyPrice: number;
  basePrice: number;          // monthlyPrice × months (before discount)
  discountedPrice: number;     // after discountPct
  period: string;
  months: number;
  discountPct: number;
  features: string[];
  highlighted: boolean;
  color: string;
}
interface WizardDomainPrice {
  extension: string;
  registrationPrice: number;
  renewalPrice: number;
  period: string;
  periodVi: string;
  note: string;
  noteVi: string;
  isAvailable: boolean;
}
interface LpRateConfig {
  lpPerVnd: number; vndPerLp: number;
  maxDiscountPercent: number; lpEarnPerMillion: number;
}

// ── Fallback data (same as FE mock) ─────────────────────────────────────────

const FALLBACK_SERVICES: WizardService[] = [
  { id: "web", title: "Thiết kế & Phát triển Website", desc: "Landing page, corporate site, e-commerce — chuẩn React/Next.js, tốc độ cao.", color: DS.blue, basePrice: 1 },
  { id: "app", title: "Phát triển App & SaaS Platform", desc: "Mobile app (React Native), web app, nền tảng SaaS cho doanh nghiệp.", color: DS.purple, basePrice: 80_000_000 },
  { id: "dashboard", title: "Dashboard & Data Analytics", desc: "Real-time dashboard, báo cáo tự động, data visualization chuyên nghiệp.", color: DS.cyan, basePrice: 25_000_000 },
  { id: "seo", title: "SEO & Digital Marketing", desc: "Tăng trưởng organic, Google Ads, content strategy — gói tháng linh hoạt.", color: DS.green, basePrice: 8_000_000, perMonth: true },
];

const FALLBACK_PACKAGES: WizardPackage[] = [
  { id: "basic", name: "Cơ bản", multiplier: 1, color: DS.text3, desc: "Thiết kế chuẩn responsive, phù hợp website giới thiệu doanh nghiệp nhỏ", features: ["Giao diện chuẩn responsive", "Tối đa 5 trang", "SEO cơ bản", "Bảo hành 1 tháng", "Hỗ trợ qua email"], lp: 100 },
  { id: "business", name: "Doanh nghiệp", multiplier: 1, color: DS.blue, desc: "Thiết kế tùy chỉnh theo thương hiệu, tối ưu UX, doanh nghiệp vừa và lớn", features: ["Thiết kế tùy chỉnh", "Tối đa 15 trang", "SEO nâng cao", "Animation & Mega Menu", "Bảo hành 3 tháng", "Không giới hạn chỉnh sửa"], lp: 180, popular: true },
  { id: "experience", name: "Experience", multiplier: 1, color: DS.purple, desc: "Giao diện độc quyền NextJS, tối ưu tốc độ cao, thương hiệu cao cấp", features: ["Giao diện độc quyền NextJS (SSR/SSG)", "Không giới hạn trang", "SEO toàn diện", "Dedicated PM", "Bảo hành 6 tháng", "Support 24/7"], lp: 280 },
];

const FALLBACK_FEATURES: Record<string, WizardFeature[]> = {
  web: [
    { id: "cms", label: "Tích hợp CMS (Sanity/Contentful)", labelEn: "CMS Integration", price: 5_000_000, category: "Nâng cao", xpPoints: 50, tier: "add-on" },
    { id: "i18n", label: "Đa ngôn ngữ (i18n)", labelEn: "Multi-language (i18n)", price: 3_000_000, category: "Nâng cao", xpPoints: 30, tier: "add-on" },
    { id: "ecom", label: "E-commerce (giỏ hàng, thanh toán)", labelEn: "E-commerce", price: 12_000_000, category: "Nâng cao", xpPoints: 120, tier: "add-on" },
    { id: "blog", label: "Blog & Content module", labelEn: "Blog & Content", price: 2_500_000, category: "Nâng cao", xpPoints: 25, tier: "add-on" },
    { id: "analytics", label: "Analytics dashboard riêng", labelEn: "Analytics Dashboard", price: 4_000_000, category: "Nâng cao", xpPoints: 40, tier: "add-on" },
  ],
  app: [
    { id: "auth", label: "Auth & User management", labelEn: "Auth & User Management", price: 6_000_000, category: "Nâng cao", xpPoints: 60, tier: "add-on" },
    { id: "notification", label: "Push notification", labelEn: "Push Notifications", price: 3_500_000, category: "Nâng cao", xpPoints: 35, tier: "add-on" },
    { id: "payment", label: "Tích hợp thanh toán (VNPAY/Momo)", labelEn: "Payment Integration", price: 8_000_000, category: "Nâng cao", xpPoints: 80, tier: "add-on" },
    { id: "chat", label: "In-app chat & messaging", labelEn: "In-app Chat", price: 7_000_000, category: "Nâng cao", xpPoints: 70, tier: "add-on" },
    { id: "analytics", label: "Analytics & event tracking", labelEn: "Analytics & Events", price: 4_000_000, category: "Nâng cao", xpPoints: 40, tier: "add-on" },
  ],
  dashboard: [
    { id: "realtime", label: "Real-time data sync", labelEn: "Real-time Data Sync", price: 5_000_000, category: "Nâng cao", xpPoints: 50, tier: "add-on" },
    { id: "export", label: "Export PDF/Excel tự động", labelEn: "PDF/Excel Export", price: 3_000_000, category: "Nâng cao", xpPoints: 30, tier: "add-on" },
    { id: "alert", label: "Alert & notification system", labelEn: "Alert System", price: 4_000_000, category: "Nâng cao", xpPoints: 40, tier: "add-on" },
    { id: "api", label: "API & webhook integration", labelEn: "API & Webhooks", price: 6_000_000, category: "Nâng cao", xpPoints: 60, tier: "add-on" },
    { id: "ml", label: "ML predictions & insights", labelEn: "ML Predictions", price: 15_000_000, category: "Nâng cao", xpPoints: 150, tier: "add-on" },
  ],
  seo: [
    { id: "ads", label: "Quản lý Google Ads", labelEn: "Google Ads Management", price: 3_000_000, category: "Nâng cao", xpPoints: 30, tier: "add-on" },
    { id: "content", label: "Content marketing (4 bài/tháng)", labelEn: "Content Marketing", price: 4_000_000, category: "Nâng cao", xpPoints: 40, tier: "add-on" },
    { id: "social", label: "Social media management", labelEn: "Social Media", price: 2_500_000, category: "Nâng cao", xpPoints: 25, tier: "add-on" },
    { id: "audit", label: "Technical SEO audit monthly", labelEn: "SEO Audit", price: 2_000_000, category: "Nâng cao", xpPoints: 20, tier: "add-on" },
  ],
};

const _FALLBACK_TALENTS: WizardTalent[] = [
  { id: "akira", name: "Akira Sato", role: "Lead Full-stack Dev", rank: "DIAMOND", rankColor: "#818CF8", rankSymbol: "✦", img: "https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=80&h=80&crop=faces", specialty: "React, Node.js, AWS" },
  { id: "yuna", name: "Yuna Park", role: "UI/UX Design Lead", rank: "RUBY", rankColor: "#EF4444", rankSymbol: "♦", img: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=80&h=80&crop=faces", specialty: "Figma, Design Systems" },
  { id: "shin", name: "Shin Watanabe", role: "DevOps & Backend", rank: "DIAMOND", rankColor: "#818CF8", rankSymbol: "✦", img: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=80&h=80&crop=faces", specialty: "Docker, K8s, Rust" },
  { id: "mei", name: "Mei Lin", role: "Mobile & SEO Expert", rank: "RUBY", rankColor: "#EF4444", rankSymbol: "♦", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80&crop=faces", specialty: "React Native, SEO" },
];

const FALLBACK_EXTRAS: WizardExtra[] = [
  { id: "hosting", label: "Hosting & Domain 1 năm", price: 3_000_000, color: DS.blue },
  { id: "maintenance", label: "Bảo trì & cập nhật 1 năm", price: 5_000_000, color: DS.green },
  { id: "analytics-setup", label: "Setup Google Analytics 4", price: 1_500_000, color: DS.cyan },
  { id: "training", label: "Training & hướng dẫn sử dụng (3 buổi)", price: 2_000_000, color: DS.purple },
  { id: "priority", label: "Priority support 24/7 (6 tháng)", price: 4_500_000, color: DS.amber },
  { id: "seo-basic", label: "SEO cơ bản & submission", price: 1_200_000, color: DS.red },
];

const DEFAULT_LP_RATE: LpRateConfig = {
  lpPerVnd: 500, vndPerLp: 2, maxDiscountPercent: 20, lpEarnPerMillion: 50,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

const calcLpDiscount = (subtotal: number, lpToRedeem: number, lpBalance: number, rate: LpRateConfig) => {
  const lpCapped = Math.min(lpToRedeem, lpBalance);
  if (lpToRedeem > lpBalance) return { lpUsed: lpCapped, vndDiscount: 0 };
  const vndFromLp = Math.floor(lpCapped / rate.vndPerLp) * rate.vndPerLp * rate.lpPerVnd;
  const maxDiscount = subtotal * (rate.maxDiscountPercent / 100);
  const vndDiscount = Math.min(vndFromLp, maxDiscount);
  if (vndFromLp > maxDiscount) {
    const lpNeeded = Math.ceil((maxDiscount / rate.lpPerVnd) * rate.vndPerLp);
    return { lpUsed: lpNeeded, vndDiscount: maxDiscount };
  }
  return { lpUsed: lpCapped, vndDiscount };
};

// ── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, stepLabels }: { step: number; stepLabels: string[] }) {
  return (
    <div style={{ padding: "20px 0" }}>
      <div className="flex items-center justify-between max-w-3xl mx-auto px-4">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex flex-col items-center" style={{ flex: i < stepLabels.length - 1 ? 1 : "none" }}>
            <div className="flex items-center w-full">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  background: i < step ? GRD.primary : i === step ? `${DS.blue}30` : "rgba(255,255,255,0.06)",
                  border: i === step ? `2px solid ${DS.blue}` : i < step ? "none" : "1px solid rgba(255,255,255,0.12)",
                  boxShadow: i === step ? `0 0 16px ${DS.blue}80` : "none",
                }}
              >
                {i < step ? (
                  <Check size={13} style={{ color: "#fff" }} />
                ) : (
                  <span style={{ color: i === step ? DS.blue : DS.text5, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{i + 1}</span>
                )}
              </div>
              {i < stepLabels.length - 1 && (
                <div className="flex-1 h-0.5 mx-1" style={{ background: i < step ? GRD.primary : "rgba(255,255,255,0.06)" }} />
              )}
            </div>
            <div style={{ color: i === step ? DS.blue : i < step ? DS.text4 : DS.text5, fontSize: 9, fontFamily: DS.mono, marginTop: 6, letterSpacing: "0.08em", textAlign: "center", maxWidth: 72 }}>
              {label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Price Sidebar ────────────────────────────────────────────────────────────

function PriceSidebar({
  service, featureOptions, features, extras, extraOptions, lpDiscount, lpBalance, lpRate, vatRate,
  selectedHostingPlan, hostingPlans, domainPrices, domainName, domainPurchaseNow,
}: {
  service: WizardService | null;
  featureOptions: WizardFeature[]; features: string[];
  extraOptions: WizardExtra[]; extras: string[];
  lpDiscount: number; lpBalance: number; lpRate: LpRateConfig;
  /** VAT rate from pricing config (e.g. 0.10 = 10%). Used for grand total display. */
  vatRate?: number;
  selectedHostingPlan: string;
  hostingPlans: WizardHostingPlan[];
  domainPrices: WizardDomainPrice[];
  domainName: string;
  domainPurchaseNow: boolean;
}) {
  const basePrice = service?.basePrice ?? 0;
  // Only charge non-included features
  const featurePrices = featureOptions
    .filter(f => features.includes(f.id) && !f.includedInBase)
    .reduce((s, f) => s + f.price, 0);
  const extraPrices = extraOptions.filter(e => extras.includes(e.id)).reduce((s, e) => s + e.price, 0);
  const hosting = hostingPlans.find(h => h.slug === selectedHostingPlan);
  const hostingCost = hosting?.discountedPrice ?? 0;
  const domainCost = domainPurchaseNow && domainName
    ? (domainPrices.find(d => domainName.endsWith(d.extension))?.registrationPrice ?? 0)
    : 0;
  const subtotal = basePrice + featurePrices + extraPrices + hostingCost + domainCost;
  const lpApplied = calcLpDiscount(subtotal, lpDiscount, lpBalance, lpRate);
  const totalBeforeVat = subtotal - lpApplied.vndDiscount;
  // VAT is always set (defaults to 0.10 from API config or component state)
  const effectiveVatRate = vatRate ?? 0.10;
  const vatAmount = Math.round(totalBeforeVat * effectiveVatRate);
  const grandTotal = totalBeforeVat + vatAmount;
  const lpEarned = Math.floor(grandTotal / 1_000_000) * lpRate.lpEarnPerMillion;
  const VAT_PCT = (effectiveVatRate * 100).toFixed(0);

  return (
    <div className="rounded-2xl overflow-hidden sticky top-6">
      <div style={{ background: "rgba(15,23,42,0.9)", border: `1px solid ${DS.border}`, backdropFilter: "blur(20px)" }}>
        <div className="px-5 py-4" style={{ background: GRD.primary }}>
          <div style={{ color: "#fff", fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 2 }}>TỔNG GIÁ ƯỚC TÍNH</div>
          <div style={{ color: "#fff", fontFamily: DS.heading, fontSize: 28, fontWeight: 900 }}>
            {fmtVND(grandTotal)}
          </div>
          {service?.perMonth && <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: DS.mono }}>/tháng</div>}
        </div>

        <div className="p-5 space-y-3">
          {service && (
            <div className="flex justify-between">
              <span style={{ color: DS.text3, fontSize: 12 }}>{service.title.split("&")[0].trim()}</span>
              <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>{fmtVND(service.basePrice)}</span>
            </div>
          )}
          {featurePrices > 0 && (
            <div className="flex justify-between">
              <span style={{ color: DS.text3, fontSize: 12 }}>Tính năng thêm ({features.length})</span>
              <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(featurePrices)}</span>
            </div>
          )}
          {hostingCost > 0 && (
            <div className="flex justify-between">
              <span style={{ color: DS.text3, fontSize: 12 }}>{hosting?.name ?? "Hosting"}</span>
              <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(hostingCost)}</span>
            </div>
          )}
          {domainCost > 0 && (
            <div className="flex justify-between">
              <span style={{ color: DS.text3, fontSize: 12 }}>Domain {domainName}</span>
              <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(domainCost)}</span>
            </div>
          )}
          {extraPrices > 0 && (
            <div className="flex justify-between">
              <span style={{ color: DS.text3, fontSize: 12 }}>Dịch vụ bổ sung ({extras.length})</span>
              <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(extraPrices)}</span>
            </div>
          )}
          {subtotal > 0 && (
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${DS.border}` }}>
              <span style={{ color: DS.text3, fontSize: 12 }}>Tạm tính</span>
              <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>{fmtVND(subtotal)}</span>
            </div>
          )}
          {lpApplied.vndDiscount > 0 && (
            <div className="flex justify-between p-2 rounded-lg" style={{ background: "rgba(129,140,248,0.1)" }}>
              <span style={{ color: DS.purple, fontSize: 12 }}>◈ Giảm LP ({lpApplied.lpUsed.toLocaleString()} LP)</span>
              <span style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono }}>-{fmtVND(lpApplied.vndDiscount)}</span>
            </div>
          )}
          {totalBeforeVat > 0 && (
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${DS.border}` }}>
              <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>TỔNG CỘNG</span>
              <span style={{ color: DS.blue, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(grandTotal)}</span>
            </div>
          )}
          {effectiveVatRate > 0 && totalBeforeVat > 0 && (
            <div className="flex justify-between" style={{ marginTop: 4 }}>
              <span style={{ color: DS.text4, fontSize: 11 }}>(+ VAT {VAT_PCT}%)</span>
              <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>+{fmtVND(vatAmount)}</span>
            </div>
          )}
        </div>

        {lpEarned > 0 && (
          <div className="mx-5 mb-5 p-3 rounded-xl" style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)" }}>
            <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.12em", marginBottom: 4 }}>LP ĐIỂM THƯỞNG SẼ NHẬN</div>
            <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>+{lpEarned.toLocaleString()} LP</div>
            <div style={{ color: DS.text5, fontSize: 10, marginTop: 2 }}>Sau khi hoàn thành dự án</div>
          </div>
        )}

        {lpBalance > 0 && (
          <div className="mx-5 mb-5 p-3 rounded-xl" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
            <div style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono }}>Số dư LP của bạn</div>
            <div style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 16, fontWeight: 700 }}>{lpBalance.toLocaleString()} LP</div>
            <div style={{ color: DS.text5, fontSize: 10 }}>1,000 LP = 500,000 VNĐ (tối đa 20%)</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step Components ───────────────────────────────────────────────────────────

function StepService({ services, selected, onSelect }: { services: WizardService[]; selected: string; onSelect: (id: string) => void }) {
  const t = useTranslations("BookingPage");
  const icons: Record<string, React.ReactNode> = {
    web: <Globe size={22} />, app: <Code2 size={22} />,
    dashboard: <BarChart3 size={22} />, seo: <Target size={22} />,
  };
  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: "0.05em", marginBottom: 8 }}>{t("step0Title")}</h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>{t("step0Desc")}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(svc => (
          <motion.button
            key={svc.id}
            onClick={() => onSelect(svc.id)}
            className="text-left p-5 rounded-2xl transition-all"
            style={{
              background: selected === svc.id ? `${svc.color}12` : "rgba(15,23,42,0.6)",
              border: selected === svc.id ? `1.5px solid ${svc.color}60` : `1px solid ${DS.border}`,
              boxShadow: selected === svc.id ? `0 0 24px ${svc.color}20` : "none",
              cursor: "pointer",
            }}
            whileHover={{ scale: 1.015 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${svc.color}15`, border: `1px solid ${svc.color}30`, color: svc.color }}>
                {icons[svc.id] ?? <Sparkles size={22} />}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{svc.title}</div>
                <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>{svc.desc}</div>
                <div style={{ color: svc.color, fontSize: 12, fontFamily: DS.mono }}>Từ {fmtVND(svc.basePrice)}{svc.perMonth ? "/tháng" : ""}</div>
              </div>
              {selected === svc.id && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: svc.color }}>
                  <Check size={13} style={{ color: "#fff" }} />
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ── Add-on Service Modal ─────────────────────────────────────────────────────────

type AddonModalType = "hosting" | "domain" | "ga4" | "maintenance" | "training" | "priority" | null;

interface AddonModalState {
  type: AddonModalType;
  isOpen: boolean;
}

function AddonModalOverlay({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
          backdropFilter: "blur(8px)",
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          style={{
            background: "rgba(15,23,42,0.98)",
            border: `1px solid ${DS.border}`,
            borderRadius: 20,
            maxWidth: 640, width: "100%",
            maxHeight: "85vh",
            overflowY: "auto",
            boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(107,61,245,0.2)`,
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Modal title bar
function ModalHeader({ title, subtitle, color, onClose }: { title: string; subtitle?: string; color: string; onClose: () => void }) {
  return (
    <div style={{ padding: "24px 24px 0" }}>
      <div className="flex items-start justify-between">
        <div>
          <div style={{ color, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 6 }}>
            DỊCH VỤ BỔ SUNG
          </div>
          <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 20, fontWeight: 900, letterSpacing: "0.04em" }}>
            {title}
          </h3>
          {subtitle && <p style={{ color: DS.text3, fontSize: 13, marginTop: 4 }}>{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(255,255,255,0.06)", border: `1px solid ${DS.border}`,
            color: DS.text3, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Step 1: Feature Table + Add-on Selection (no packages) ─────────────────────

function StepAddons({
  featureOptions, selectedFeatures, onToggleFeature,
  extraOptions, selectedExtras, onToggleExtra,
  // Hosting
  hostingPlans, selectedHostingPlan, onSelectHostingPlan,
  // Domain
  domainPrices, domainName, onSetDomainName, domainPurchaseNow, onSetDomainPurchaseNow,
  // Modal state
  modal, setModal,
}: {
  featureOptions: WizardFeature[]; selectedFeatures: string[]; onToggleFeature: (id: string) => void;
  extraOptions: WizardExtra[]; selectedExtras: string[]; onToggleExtra: (id: string) => void;
  hostingPlans: WizardHostingPlan[];
  selectedHostingPlan: string; onSelectHostingPlan: (slug: string) => void;
  domainPrices: WizardDomainPrice[];
  domainName: string; onSetDomainName: (name: string) => void;
  domainPurchaseNow: boolean; onSetDomainPurchaseNow: (now: boolean) => void;
  modal: AddonModalState; setModal: (s: AddonModalState) => void;
}) {
  const t = useTranslations("BookingPage");

  // ── Feature table ────────────────────────────────────────────────────────────
  const grouped = featureOptions.reduce<Record<string, WizardFeature[]>>((acc, f) => {
    const cat = f.category || "Khác";
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(f);
    return acc;
  }, {});

  const renderFeatureRow = (opt: WizardFeature, isSelected: boolean) => (
    <motion.button
      key={opt.id}
      onClick={() => onToggleFeature(opt.id)}
      className="w-full text-left p-3 rounded-xl flex items-center gap-3"
      style={{
        background: isSelected ? "rgba(59,130,246,0.08)" : "rgba(15,23,42,0.4)",
        border: isSelected ? "1.5px solid rgba(59,130,246,0.3)" : `1px solid ${DS.border}`,
        cursor: "pointer",
      }}
      whileHover={{ scale: 1.003 }}
    >
      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: isSelected ? DS.blue : "rgba(255,255,255,0.05)", border: isSelected ? "none" : `1px solid ${DS.border}` }}>
        {isSelected && <Check size={11} style={{ color: "#fff" }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
        {opt.labelEn && <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginTop: 1 }}>{opt.labelEn}</div>}
      </div>
      {opt.includedInBase ? (
        <div className="px-2 py-1 rounded-md flex items-center gap-1 flex-shrink-0"
          style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)" }}>
          <Check size={10} style={{ color: DS.green }} />
          <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono, fontWeight: 600 }}>Đã bao gồm</span>
        </div>
      ) : (
        <div style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono, fontWeight: 700, flexShrink: 0 }}>
          +{fmtVND(opt.price)}
        </div>
      )}
    </motion.button>
  );

  // ── Add-on service card (opens popup) ───────────────────────────────────────
  const renderAddonCard = (
    type: AddonModalType,
    label: string,
    price: number,
    icon: React.ReactNode,
    color: string,
    description: string,
    isSelected: boolean,
  ) => (
    <motion.button
      key={type}
      onClick={() => setModal({ type, isOpen: true })}
      className="w-full text-left p-4 rounded-xl flex items-start gap-4"
      style={{
        background: isSelected ? `${color}0C` : "rgba(15,23,42,0.5)",
        border: isSelected ? `1.5px solid ${color}50` : `1px solid ${DS.border}`,
        cursor: "pointer",
      }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{label}</span>
          {isSelected && <Check size={14} style={{ color }} />}
        </div>
        <div style={{ color: DS.text3, fontSize: 12, marginBottom: 6 }}>{description}</div>
        {price > 0 && (
          <div style={{ color, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>
            +{fmtVND(price)}
          </div>
        )}
        {isSelected && (
          <div style={{ color: DS.green, fontSize: 11, marginTop: 4 }}>✓ Đã chọn — click để sửa</div>
        )}
      </div>
    </motion.button>
  );

  // ── Hosting popup content ─────────────────────────────────────────────────
  const hostingSelectedPlan = hostingPlans.find(h => h.slug === selectedHostingPlan);

  // ── Domain matching ────────────────────────────────────────────────────────
  const isValidDomain = domainName.length === 0 || domainName.includes(".");
  const matchedDomainExt = domainName.includes(".")
    ? domainPrices.find(d => domainName.endsWith(d.extension))
    : null;

  return (
    <div>
      {/* Header: base price */}
      <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.18)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 4 }}>
              WEBSITE TÙY CHỈNH
            </div>
            <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 28, fontWeight: 900 }}>
              {fmtVND(3_890_000)}
              <span style={{ color: DS.text4, fontSize: 13, fontFamily: DS.mono, fontWeight: 400, marginLeft: 8 }}>/ trọn gói</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Responsive", "SSL", "Trang chủ", "Giỏ hàng", "SEO"].map(item => (
              <span key={item} className="px-2 py-0.5 rounded-md text-xs"
                style={{ background: "rgba(34,197,94,0.12)", color: DS.green, border: "1px solid rgba(34,197,94,0.2)" }}>
                ✓ {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Add-on service cards ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <div style={{ width: 3, height: 16, background: DS.pink, borderRadius: 2 }} />
        <h4 style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.12em" }}>
          DỊCH VỤ BỔ SUNG (NHẤN ĐỂ CHỌN)
        </h4>
        <div className="flex-1 h-px" style={{ background: DS.border }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {extraOptions.map(ext => {
          const icons: Record<string, React.ReactNode> = {
            hosting: <Globe size={20} />,
            maintenance: <Shield size={20} />,
            "analytics-setup": <BarChart3 size={20} />,
            training: <Users size={20} />,
            priority: <Sparkles size={20} />,
            "seo-basic": <Target size={20} />,
          };
          const colors: Record<string, string> = {
            hosting: DS.purple,
            maintenance: DS.cyan,
            "analytics-setup": DS.amber,
            training: DS.green,
            priority: DS.pink,
            "seo-basic": DS.blue,
          };
          const descriptions: Record<string, string> = {
            hosting: "Hosting từ Free → Enterprise — chọn gói phù hợp nhu cầu",
            maintenance: "Bảo trì & cập nhật website 1 năm",
            "analytics-setup": "Setup Google Analytics 4 — theo dõi traffic & conversions",
            training: "Training 1-1 với đội ngũ LOOP (3 buổi)",
            priority: "Priority support 24/7 trong 6 tháng đầu",
            "seo-basic": "SEO cơ bản & Google submission",
          };
          return renderAddonCard(
            ext.id as AddonModalType,
            ext.label,
            ext.price,
            icons[ext.id] ?? <Zap size={20} />,
            colors[ext.id] ?? DS.purple,
            descriptions[ext.id] ?? ext.label,
            selectedExtras.includes(ext.id),
          );
        })}
      </div>

      {/* ── Feature table ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <div style={{ width: 3, height: 16, background: GRD.primary, borderRadius: 2 }} />
        <h4 style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.12em" }}>
          TÍNH NĂNG NÂNG CAO
        </h4>
        <div className="flex-1 h-px" style={{ background: DS.border }} />
      </div>

      {Object.entries(grouped).map(([cat, opts]) => (
        <div key={cat} style={{ marginBottom: 24 }}>
          <div className="flex items-center gap-2 mb-2">
            <div style={{ width: 2, height: 12, background: DS.blue, borderRadius: 1 }} />
            <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em" }}>
              {cat.toUpperCase()}
            </span>
          </div>
          <div className="space-y-2">
            {opts.map(opt => renderFeatureRow(opt, selectedFeatures.includes(opt.id)))}
          </div>
        </div>
      ))}

      {/* ── MODALS ──────────────────────────────────────────────────────── */}

      {/* HOSTING MODAL */}
      <AddonModalOverlay isOpen={modal.type === "hosting"} onClose={() => setModal({ type: null, isOpen: false })}>
        <ModalHeader
          title="Chọn gói Hosting"
          subtitle="Chọn gói hosting phù hợp nhu cầu website của bạn"
          color={DS.purple}
          onClose={() => setModal({ type: null, isOpen: false })}
        />
        <div style={{ padding: "20px 24px 24px" }}>
          <div className="space-y-3">
            {hostingPlans.map(plan => {
              const isSelected = selectedHostingPlan === plan.slug;
              const hasDiscount = plan.discountPct > 0;
              return (
                <motion.button
                  key={plan.slug}
                  onClick={() => {
                    onSelectHostingPlan(isSelected ? "" : plan.slug);
                    if (!isSelected) setModal({ type: null, isOpen: false });
                  }}
                  className="w-full text-left p-4 rounded-xl relative"
                  style={{
                    background: isSelected ? `${plan.color}0E` : "rgba(15,23,42,0.6)",
                    border: isSelected ? `1.5px solid ${plan.color}50` : `1px solid ${DS.border}`,
                    cursor: "pointer",
                  }}
                  whileHover={{ scale: 1.01 }}
                >
                  {plan.highlighted && (
                    <div className="absolute top-0 left-0 right-0 py-1 text-center rounded-t-xl"
                      style={{ background: GRD.primary, fontSize: 9, color: "#fff", fontFamily: DS.mono, letterSpacing: "0.1em" }}>
                      ★ PHỔ BIẾN NHẤT
                    </div>
                  )}
                  <div style={{ marginTop: plan.highlighted ? 16 : 0 }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span style={{ color: isSelected ? plan.color : DS.text2, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>
                          {plan.name.toUpperCase()}
                        </span>
                        {hasDiscount && (
                          <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(34,197,94,0.15)", color: DS.green, fontFamily: DS.mono }}>
                            -{plan.discountPct}%
                          </span>
                        )}
                      </div>
                      {isSelected && <Check size={14} style={{ color: plan.color }} />}
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900 }}>
                        {fmtVND(hasDiscount ? plan.discountedPrice : plan.basePrice)}
                      </span>
                      <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                        {plan.period}
                      </span>
                    </div>
                    {hasDiscount && (
                      <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, textDecoration: "line-through", marginBottom: 6 }}>
                        {fmtVND(plan.basePrice)}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {plan.features.map(f => (
                        <span key={f} className="px-2 py-0.5 rounded text-xs"
                          style={{ background: "rgba(255,255,255,0.04)", color: DS.text4 }}>
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.button>
              );
            })}
            {/* Skip */}
            <motion.button
              onClick={() => { onSelectHostingPlan(""); setModal({ type: null, isOpen: false }); }}
              className="w-full text-center py-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${DS.border}`, cursor: "pointer" }}
            >
              <span style={{ color: DS.text4, fontSize: 13 }}>Bỏ qua — tự chuẩn bị hosting</span>
            </motion.button>
          </div>
        </div>
      </AddonModalOverlay>

      {/* DOMAIN MODAL */}
      <AddonModalOverlay isOpen={modal.type === "domain"} onClose={() => setModal({ type: null, isOpen: false })}>
        <ModalHeader
          title="Đăng ký tên miền"
          subtitle="Chọn domain và thời điểm đăng ký"
          color={DS.cyan}
          onClose={() => setModal({ type: null, isOpen: false })}
        />
        <div style={{ padding: "20px 24px 24px" }}>
          {/* Domain input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>
              TÊN MIỀN BẠN MUỐN ĐĂNG KÝ
            </label>
            <div className="flex gap-2">
              <input
                value={domainName}
                onChange={e => onSetDomainName(e.target.value)}
                placeholder="ví dụ: mysite"
                style={{
                  flex: 1, background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
                  borderRadius: 10, padding: "12px 16px", color: DS.text, fontSize: 15,
                  outline: "none", fontFamily: DS.body,
                }}
              />
              <select
                value={domainName.includes(".") ? "." + domainName.split(".").pop() : ".com"}
                onChange={e => {
                  const base = domainName.includes(".") ? domainName.split(".")[0] : domainName;
                  onSetDomainName(base + e.target.value);
                }}
                style={{
                  background: "rgba(15,23,42,0.8)", border: `1px solid ${DS.border}`,
                  borderRadius: 10, padding: "12px 14px", color: DS.text,
                  fontSize: 14, fontFamily: DS.mono, outline: "none", cursor: "pointer",
                }}
              >
                {domainPrices.map(d => (
                  <option key={d.extension} value={d.extension} style={{ background: "#0F172A" }}>
                    {d.extension}
                  </option>
                ))}
              </select>
            </div>
            {matchedDomainExt && (
              <div className="mt-2 p-2 rounded-lg" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <span style={{ color: DS.green, fontSize: 12, fontFamily: DS.mono }}>
                  ✓ {matchedDomainExt.extension}: đăng ký {fmtVND(matchedDomainExt.registrationPrice)}/năm — gia hạn {fmtVND(matchedDomainExt.renewalPrice)}/năm
                </span>
                {matchedDomainExt.note && (
                  <div style={{ color: DS.amber, fontSize: 11, marginTop: 4 }}>{matchedDomainExt.note}</div>
                )}
              </div>
            )}
          </div>

          {/* Timing */}
          {matchedDomainExt && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, marginBottom: 10 }}>
                BẠN MUỐN ĐĂNG KÝ KHI NÀO?
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { val: true, title: "Đăng ký ngay", desc: "Domain được đăng ký trước khi bàn giao web — website hoạt động ngay.", color: DS.cyan },
                  { val: false, title: "Mua sau bàn giao", desc: "Tự chuẩn bị domain riêng — LOOP hỗ trợ kỹ thuật cấu hình miễn phí.", color: DS.purple },
                ].map(opt => (
                  <motion.button
                    key={String(opt.val)}
                    onClick={() => onSetDomainPurchaseNow(opt.val)}
                    className="w-full text-left p-4 rounded-xl"
                    style={{
                      background: domainPurchaseNow === opt.val ? `${opt.color}10` : "rgba(15,23,42,0.5)",
                      border: domainPurchaseNow === opt.val ? `1.5px solid ${opt.color}40` : `1px solid ${DS.border}`,
                      cursor: "pointer",
                    }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: domainPurchaseNow === opt.val ? opt.color : "transparent", border: domainPurchaseNow === opt.val ? "none" : `1.5px solid ${DS.text4}` }}>
                        {domainPurchaseNow === opt.val && <Check size={9} style={{ color: "#fff" }} />}
                      </div>
                      <span style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{opt.title}</span>
                    </div>
                    <div style={{ color: DS.text4, fontSize: 12, marginLeft: 24 }}>{opt.desc}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Domain price table */}
          <div>
            <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>
              BẢNG GIÁ TÊN MIỀN (inet.com ×1.25)
            </div>
            <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${DS.border}` }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(15,23,42,0.8)" }}>
                    {["ĐUÔI", "ĐĂNG KÝ", "GIA HẠN", "GHI CHÚ"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: h === "ĐUÔI" ? "left" : "right", color: DS.text4, fontSize: 10, fontFamily: DS.mono, borderBottom: `1px solid ${DS.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {domainPrices.map(d => (
                    <tr key={d.extension} style={{ borderBottom: `1px solid ${DS.border}` }}>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 13, fontWeight: 700 }}>{d.extension}</span>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        <span style={{ color: DS.text, fontFamily: DS.mono, fontSize: 12 }}>{fmtVND(d.registrationPrice)}</span>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        <span style={{ color: DS.text4, fontFamily: DS.mono, fontSize: 12 }}>{fmtVND(d.renewalPrice)}</span>
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ color: d.note ? DS.text4 : DS.text5, fontSize: 11 }}>{d.note || "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AddonModalOverlay>

      {/* GA4 / MAINTENANCE / TRAINING / PRIORITY modals */}
      <AddonModalOverlay isOpen={modal.type === "ga4"} onClose={() => setModal({ type: null, isOpen: false })}>
        <ModalHeader title="Google Analytics 4" subtitle="Setup GA4 chuyên nghiệp cho website của bạn" color={DS.amber}
          onClose={() => setModal({ type: null, isOpen: false })} />
        <div style={{ padding: "20px 24px 24px" }}>
          <div className="space-y-3 mb-6">
            {[
              { label: "Setup GA4 cơ bản", price: 1_500_000, desc: "Cài đặt GA4, Google Tag, pixel tracking cơ bản", color: DS.amber },
              { label: "Setup GA4 nâng cao", price: 3_000_000, desc: "Goals, funnels, ecommerce tracking, custom events, dashboard riêng", color: DS.purple },
            ].map(opt => {
              const isSelected = selectedExtras.includes("ga4-" + opt.label.slice(0, 5).replace(" ", "-").toLowerCase());
              return (
                <motion.button key={opt.label}
                  onClick={() => {
                    // Toggle selection — for simplicity, treat as single option
                    if (isSelected) {
                      onToggleExtra("analytics-setup");
                    } else {
                      onToggleExtra("analytics-setup");
                    }
                    setModal({ type: null, isOpen: false });
                  }}
                  className="w-full text-left p-4 rounded-xl"
                  style={{
                    background: isSelected ? `${opt.color}10` : "rgba(15,23,42,0.5)",
                    border: isSelected ? `1.5px solid ${opt.color}40` : `1px solid ${DS.border}`,
                    cursor: "pointer",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div style={{ color: DS.text, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{opt.label}</div>
                      <div style={{ color: DS.text4, fontSize: 12 }}>{opt.desc}</div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div style={{ color: opt.color, fontFamily: DS.mono, fontSize: 16, fontWeight: 900 }}>
                        +{fmtVND(opt.price)}
                      </div>
                      {isSelected && <Check size={14} style={{ color: opt.color, marginTop: 4 }} />}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
          <motion.button
            onClick={() => { onToggleExtra("analytics-setup"); setModal({ type: null, isOpen: false }); }}
            className="w-full py-3 rounded-xl text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${DS.border}`, cursor: "pointer" }}
          >
            <span style={{ color: DS.text4, fontSize: 13 }}>Bỏ qua</span>
          </motion.button>
        </div>
      </AddonModalOverlay>

      {/* Maintenance modal */}
      <AddonModalOverlay isOpen={modal.type === "maintenance"} onClose={() => setModal({ type: null, isOpen: false })}>
        <ModalHeader title="Bảo trì & Cập nhật 1 năm" subtitle="LOOP bảo trì website của bạn trong 12 tháng" color={DS.cyan}
          onClose={() => setModal({ type: null, isOpen: false })} />
        <div style={{ padding: "20px 24px 24px" }}>
          <div className="p-4 rounded-xl mb-6" style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} style={{ color: DS.cyan }} />
              <span style={{ color: DS.cyan, fontSize: 13, fontWeight: 700 }}>Bảo trì trọn gói 1 năm</span>
            </div>
            {["Cập nhật plugin, framework bảo mật", "Backup hàng tuần", "SSL certificate renewal", "Hỗ trợ kỹ thuật qua email", "Tối ưu tốc độ website", "Báo cáo hàng tháng"].map(item => (
              <div key={item} className="flex items-center gap-2 mb-2">
                <Check size={12} style={{ color: DS.green }} />
                <span style={{ color: DS.text3, fontSize: 13 }}>{item}</span>
              </div>
            ))}
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(20,184,166,0.2)" }}>
              <span style={{ color: DS.cyan, fontFamily: DS.heading, fontSize: 22, fontWeight: 900 }}>
                +{fmtVND(5_000_000)}/năm
              </span>
            </div>
          </div>
          <motion.button
            onClick={() => { onToggleExtra("maintenance"); setModal({ type: null, isOpen: false }); }}
            className="w-full py-3 rounded-xl text-center"
            style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)", cursor: "pointer" }}
          >
            <span style={{ color: DS.cyan, fontSize: 13, fontWeight: 700 }}>✓ Chọn Bảo trì 1 năm — {fmtVND(5_000_000)}</span>
          </motion.button>
          <motion.button
            onClick={() => setModal({ type: null, isOpen: false })}
            className="w-full py-3 rounded-xl text-center mt-2"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${DS.border}`, cursor: "pointer" }}
          >
            <span style={{ color: DS.text4, fontSize: 13 }}>Bỏ qua</span>
          </motion.button>
        </div>
      </AddonModalOverlay>

      {/* Training modal */}
      <AddonModalOverlay isOpen={modal.type === "training"} onClose={() => setModal({ type: null, isOpen: false })}>
        <ModalHeader title="Training & Hướng dẫn sử dụng" subtitle="3 buổi training 1-1 với đội ngũ LOOP" color={DS.green}
          onClose={() => setModal({ type: null, isOpen: false })} />
        <div style={{ padding: "20px 24px 24px" }}>
          <div className="space-y-2 mb-6">
            {[
              "Hướng dẫn quản trị CMS & nội dung",
              "Cách thêm/sửa/xóa sản phẩm, bài viết",
              "Quản lý đơn hàng & khách hàng",
              "Cách đọc báo cáo Google Analytics",
              "Backup & restore website",
            ].map(item => (
              <div key={item} className="flex items-center gap-2">
                <Check size={12} style={{ color: DS.green }} />
                <span style={{ color: DS.text3, fontSize: 13 }}>{item}</span>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <span style={{ color: DS.green, fontFamily: DS.heading, fontSize: 22, fontWeight: 900 }}>
              +{fmtVND(2_000_000)}/3 buổi
            </span>
            <div style={{ color: DS.text4, fontSize: 12, marginTop: 4 }}>Mỗi buổi 60–90 phút qua Google Meet</div>
          </div>
          <motion.button
            onClick={() => { onToggleExtra("training"); setModal({ type: null, isOpen: false }); }}
            className="w-full py-3 rounded-xl text-center"
            style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", cursor: "pointer" }}
          >
            <span style={{ color: DS.green, fontSize: 13, fontWeight: 700 }}>✓ Chọn Training — {fmtVND(2_000_000)}</span>
          </motion.button>
          <motion.button
            onClick={() => setModal({ type: null, isOpen: false })}
            className="w-full py-3 rounded-xl text-center mt-2"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${DS.border}`, cursor: "pointer" }}
          >
            <span style={{ color: DS.text4, fontSize: 13 }}>Bỏ qua</span>
          </motion.button>
        </div>
      </AddonModalOverlay>

      {/* Priority support modal */}
      <AddonModalOverlay isOpen={modal.type === "priority"} onClose={() => setModal({ type: null, isOpen: false })}>
        <ModalHeader title="Priority Support 24/7" subtitle="Hỗ trợ ưu tiên trong 6 tháng đầu" color={DS.pink}
          onClose={() => setModal({ type: null, isOpen: false })} />
        <div style={{ padding: "20px 24px 24px" }}>
          <div className="space-y-2 mb-6">
            {[
              "Phản hồi trong 2 giờ (thay vì 24h thông thường)",
              "Hỗ trợ qua Zalo, Phone, Email",
              "优先处理 Priority ticket trong queue",
              "Được assign PM riêng",
            ].map(item => (
              <div key={item} className="flex items-center gap-2">
                <Sparkles size={12} style={{ color: DS.pink }} />
                <span style={{ color: DS.text3, fontSize: 13 }}>{item}</span>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)" }}>
            <span style={{ color: DS.pink, fontFamily: DS.heading, fontSize: 22, fontWeight: 900 }}>
              +{fmtVND(4_500_000)}/6 tháng
            </span>
          </div>
          <motion.button
            onClick={() => { onToggleExtra("priority"); setModal({ type: null, isOpen: false }); }}
            className="w-full py-3 rounded-xl text-center"
            style={{ background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.3)", cursor: "pointer" }}
          >
            <span style={{ color: DS.pink, fontSize: 13, fontWeight: 700 }}>✓ Chọn Priority Support — {fmtVND(4_500_000)}</span>
          </motion.button>
          <motion.button
            onClick={() => setModal({ type: null, isOpen: false })}
            className="w-full py-3 rounded-xl text-center mt-2"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${DS.border}`, cursor: "pointer" }}
          >
            <span style={{ color: DS.text4, fontSize: 13 }}>Bỏ qua</span>
          </motion.button>
        </div>
      </AddonModalOverlay>
    </div>
  );
}

// ── Step 2: Hosting + Domain ─────────────────────────────────────────────────

function StepHostingDomain({
  hostingPlans,
  selectedHostingPlan, onSelectHostingPlan,
  domainPrices,
  domainName, onSetDomainName,
  domainPurchaseNow, onSetDomainPurchaseNow,
}: {
  hostingPlans: WizardHostingPlan[];
  selectedHostingPlan: string; onSelectHostingPlan: (slug: string) => void;
  domainPrices: WizardDomainPrice[];
  domainName: string; onSetDomainName: (name: string) => void;
  domainPurchaseNow: boolean; onSetDomainPurchaseNow: (now: boolean) => void;
}) {
  const t = useTranslations("BookingPage");

  // Validate domain name input
  const isValidDomain = domainName.length === 0 || domainName.includes(".");
  const matchedExtension = domainName.includes(".")
    ? domainPrices.find(d => domainName.endsWith(d.extension))
    : null;

  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: "0.05em", marginBottom: 8 }}>
        Hosting & Tên miền
      </h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 28 }}>
        Chọn gói hosting phù hợp và đăng ký tên miền cho website của bạn.
      </p>

      {/* ── Hosting Plans ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <div style={{ width: 3, height: 16, background: DS.purple, borderRadius: 2 }} />
        <h4 style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.12em" }}>
          CHỌN GÓI HOSTING
        </h4>
        <div className="flex-1 h-px" style={{ background: DS.border }} />
        <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>Không bắt buộc</span>
      </div>

      {/* Hosting plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-8">
        {hostingPlans.map(plan => {
          const isSelected = selectedHostingPlan === plan.slug;
          const monthlyDisplay = plan.monthlyPrice === 0
            ? "Miễn phí"
            : fmtVND(plan.monthlyPrice) + "/tháng";
          const hasDiscount = plan.discountPct > 0;
          const baseCost = plan.basePrice;
          return (
            <motion.button
              key={plan.slug}
              onClick={() => onSelectHostingPlan(isSelected ? "" : plan.slug)}
              className="text-left p-4 rounded-xl relative overflow-hidden"
              style={{
                background: isSelected ? `${plan.color}0E` : "rgba(15,23,42,0.5)",
                border: isSelected ? `1.5px solid ${plan.color}50` : `1px solid ${DS.border}`,
                boxShadow: isSelected ? `0 0 16px ${plan.color}18` : "none",
                cursor: "pointer",
              }}
              whileHover={{ scale: 1.02 }}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-0 right-0 py-1 text-center" style={{ background: GRD.primary, fontSize: 9, color: "#fff", fontFamily: DS.mono, letterSpacing: "0.1em" }}>
                  ★ PHỔ BIẾN NHẤT
                </div>
              )}
              <div style={{ marginTop: plan.highlighted ? 18 : 0 }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: isSelected ? plan.color : DS.text2, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>
                    {plan.name.toUpperCase()}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: plan.color }}>
                      <Check size={10} style={{ color: "#fff" }} />
                    </div>
                  )}
                </div>
                <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 18, fontWeight: 900, marginBottom: 2 }}>
                  {hasDiscount
                    ? fmtVND(plan.discountedPrice)
                    : fmtVND(baseCost)}
                </div>
                <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>
                  {monthlyDisplay} · {plan.period}
                  {hasDiscount && (
                    <span className="ml-1" style={{ color: DS.green }}>-{plan.discountPct}%</span>
                  )}
                </div>
                {hasDiscount && (
                  <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, textDecoration: "line-through", marginBottom: 6 }}>
                    {fmtVND(baseCost)}
                  </div>
                )}
                <div className="space-y-1">
                  {plan.features.slice(0, 4).map(f => (
                    <div key={f} className="flex items-start gap-1.5">
                      <Check size={10} style={{ color: DS.green, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: DS.text4, fontSize: 10, lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                  {plan.features.length > 4 && (
                    <div style={{ color: DS.text5, fontSize: 10 }}>+{plan.features.length - 4} tính năng khác</div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}

        {/* Skip / None option */}
        <motion.button
          onClick={() => onSelectHostingPlan("")}
          className="text-left p-4 rounded-xl flex items-center justify-center"
          style={{
            background: !selectedHostingPlan ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.4)",
            border: !selectedHostingPlan ? `1.5px solid ${DS.text4}60` : `1px solid ${DS.border}`,
            cursor: "pointer",
          }}
          whileHover={{ scale: 1.02 }}
        >
          <span style={{ color: DS.text4, fontSize: 13 }}>Bỏ qua — Tự chuẩn bị hosting</span>
        </motion.button>
      </div>

      {/* ── Domain Name ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <div style={{ width: 3, height: 16, background: DS.cyan, borderRadius: 2 }} />
        <h4 style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.12em" }}>
          ĐĂNG KÝ TÊN MIỀN
        </h4>
        <div className="flex-1 h-px" style={{ background: DS.border }} />
        <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>Tên miền bắt buộc cho website</span>
      </div>

      <div className="mb-4">
        <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>
          TÊN MIỀN BẠN MUỐN ĐĂNG KÝ
        </label>
        <div className="flex gap-3">
          <div style={{ flex: 1 }}>
            <input
              value={domainName}
              onChange={e => onSetDomainName(e.target.value)}
              placeholder="ví dụ: mysite"
              style={{
                width: "100%",
                background: "rgba(15,23,42,0.6)",
                border: domainName && !isValidDomain ? `1.5px solid ${DS.red}` : `1px solid ${DS.border}`,
                borderRadius: 10,
                padding: "12px 16px",
                color: DS.text,
                fontSize: 15,
                outline: "none",
                fontFamily: DS.body,
                boxSizing: "border-box",
              }}
            />
          </div>
          {/* Extension selector */}
          <select
            value={domainName.includes(".") ? "." + domainName.split(".").pop() : ".com"}
            onChange={e => {
              const base = domainName.includes(".") ? domainName.split(".")[0] : domainName;
              onSetDomainName(base + e.target.value);
            }}
            style={{
              background: "rgba(15,23,42,0.8)",
              border: `1px solid ${DS.border}`,
              borderRadius: 10,
              padding: "12px 14px",
              color: DS.text,
              fontSize: 14,
              fontFamily: DS.mono,
              outline: "none",
              cursor: "pointer",
            }}
          >
            {domainPrices.map(d => (
              <option key={d.extension} value={d.extension} style={{ background: "#0F172A" }}>
                {d.extension}
              </option>
            ))}
          </select>
        </div>

        {/* Domain price hint */}
        {matchedExtension && (
          <div className="mt-2 flex items-center gap-2">
            <Check size={11} style={{ color: DS.green }} />
            <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono }}>
              Đăng ký {matchedExtension.extension}: {fmtVND(matchedExtension.registrationPrice)}/{matchedExtension.periodVi}
            </span>
            <span style={{ color: DS.text5, fontSize: 10 }}>— Gia hạn: {fmtVND(matchedExtension.renewalPrice)}/năm</span>
          </div>
        )}
        {domainName && !matchedExtension && domainName.includes(".") && (
          <div className="mt-2 flex items-center gap-2">
            <span style={{ color: DS.amber, fontSize: 11 }}>⚠ Không tìm thấy giá cho {domainName.split(".").pop()}</span>
          </div>
        )}
        {domainName && matchedExtension?.note && (
          <div className="mt-1 px-3 py-2 rounded-lg" style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.2)" }}>
            <span style={{ color: DS.amber, fontSize: 11 }}>{matchedExtension.note}</span>
          </div>
        )}
      </div>

      {/* Purchase timing */}
      {domainName && matchedExtension && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.5)", border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, marginBottom: 12 }}>BẠN MUỐN ĐĂNG KÝ KHI NÀO?</div>
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              onClick={() => onSetDomainPurchaseNow(true)}
              className="flex-1 text-left p-4 rounded-xl"
              style={{
                background: domainPurchaseNow ? "rgba(59,130,246,0.1)" : "rgba(15,23,42,0.3)",
                border: domainPurchaseNow ? "1.5px solid rgba(59,130,246,0.4)" : `1px solid ${DS.border}`,
                cursor: "pointer",
              }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: domainPurchaseNow ? DS.blue : "transparent", border: domainPurchaseNow ? "none" : `1.5px solid ${DS.text4}` }}>
                  {domainPurchaseNow && <Check size={9} style={{ color: "#fff" }} />}
                </div>
                <span style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>Đăng ký ngay bây giờ</span>
              </div>
              <div style={{ color: DS.text4, fontSize: 11, marginLeft: 24 }}>
                Domain được đăng ký trước khi bàn giao web — website hoạt động ngay khi bàn giao.
              </div>
            </motion.button>
            <motion.button
              onClick={() => onSetDomainPurchaseNow(false)}
              className="flex-1 text-left p-4 rounded-xl"
              style={{
                background: !domainPurchaseNow ? "rgba(129,140,248,0.08)" : "rgba(15,23,42,0.3)",
                border: !domainPurchaseNow ? "1.5px solid rgba(129,140,248,0.3)" : `1px solid ${DS.border}`,
                cursor: "pointer",
              }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: !domainPurchaseNow ? DS.purple : "transparent", border: !domainPurchaseNow ? "none" : `1.5px solid ${DS.text4}` }}>
                  {!domainPurchaseNow && <Check size={9} style={{ color: "#fff" }} />}
                </div>
                <span style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>Mua sau khi bàn giao</span>
              </div>
              <div style={{ color: DS.text4, fontSize: 11, marginLeft: 24 }}>
                Bạn tự chuẩn bị domain riêng — LOOP hỗ trợ kỹ thuật cấu hình miễn phí.
              </div>
            </motion.button>
          </div>
        </div>
      )}

      {/* Domain price table */}
      {domainPrices.length > 0 && (
        <div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>
            BẢNG GIÁ TÊN MIỀN (tham khảo — inet.com ×1.25)
          </div>
          <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${DS.border}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(15,23,42,0.8)" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", borderBottom: `1px solid ${DS.border}` }}>ĐUÔI</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", borderBottom: `1px solid ${DS.border}` }}>ĐĂNG KÝ</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", borderBottom: `1px solid ${DS.border}` }}>GIA HẠN</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", borderBottom: `1px solid ${DS.border}` }}>GHI CHÚ</th>
                </tr>
              </thead>
              <tbody>
                {domainPrices.map(d => (
                  <tr key={d.extension} style={{ borderBottom: `1px solid ${DS.border}` }}>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 13, fontWeight: 700 }}>{d.extension}</span>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <span style={{ color: DS.text, fontFamily: DS.mono, fontSize: 12 }}>{fmtVND(d.registrationPrice)}</span>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <span style={{ color: DS.text4, fontFamily: DS.mono, fontSize: 12 }}>{fmtVND(d.renewalPrice)}</span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ color: d.note ? DS.text4 : DS.text5, fontSize: 11 }}>{d.note || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function _StepPackage({ packages, service, selected, onSelect }: { packages: WizardPackage[]; service: WizardService | null; selected: string; onSelect: (id: string) => void }) {
  const t = useTranslations("BookingPage");
  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: "0.05em", marginBottom: 8 }}>{t("step1Title")}</h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>{t("step1Desc")}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map(pkg => {
          const price = (service?.basePrice ?? 0) * pkg.multiplier;
          return (
            <motion.button
              key={pkg.id}
              onClick={() => onSelect(pkg.id)}
              className="text-left p-5 rounded-2xl relative overflow-hidden"
              style={{
                background: selected === pkg.id ? `${pkg.color}10` : "rgba(15,23,42,0.6)",
                border: selected === pkg.id ? `1.5px solid ${pkg.color}60` : pkg.popular ? "1px solid rgba(59,130,246,0.3)" : `1px solid ${DS.border}`,
                boxShadow: selected === pkg.id ? `0 0 24px ${pkg.color}15` : "none",
                cursor: "pointer",
              }}
              whileHover={{ scale: 1.015 }}
            >
              {pkg.popular && (
                <div className="absolute top-0 left-0 right-0 py-1 text-center" style={{ background: GRD.primary, fontSize: 9, color: "#fff", fontFamily: DS.mono, letterSpacing: "0.15em" }}>
                  ★ {t("popularMost")}
                </div>
              )}
              <div style={{ marginTop: pkg.popular ? 20 : 0 }}>
                <div style={{ color: pkg.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 8 }}>{pkg.name.toUpperCase()}</div>
                <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{fmtVND(price)}</div>
                {service?.perMonth && <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>/tháng</div>}
                <div style={{ color: DS.text3, fontSize: 12, marginBottom: 14 }}>{pkg.desc}</div>
                <div className="space-y-2">
                  {pkg.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <Check size={11} style={{ color: pkg.color, flexShrink: 0 }} />
                      <span style={{ color: DS.text3, fontSize: 11 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                  <span style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono }}>◈ +{pkg.lp} LP điểm thưởng/tháng</span>
                </div>
              </div>
              {selected === pkg.id && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: pkg.color }}>
                  <Check size={12} style={{ color: "#fff" }} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function _StepFeatures({ featureOptions, selected, onToggle }: { featureOptions: WizardFeature[]; selected: string[]; onToggle: (id: string) => void }) {
  const t = useTranslations("BookingPage");
  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: "0.05em", marginBottom: 8 }}>{t("step2Title")}</h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>{t("step2Desc")}</p>
      {featureOptions.length === 0 ? (
        <div style={{ color: DS.text3, fontSize: 14, padding: "24px 0" }}>{t("noFeatures")}</div>
      ) : (
        <div className="space-y-3">
          {featureOptions.map(opt => (
            <motion.button
              key={opt.id}
              onClick={() => onToggle(opt.id)}
              className="w-full text-left p-4 rounded-xl flex items-center gap-4"
              style={{
                background: selected.includes(opt.id) ? "rgba(59,130,246,0.1)" : "rgba(15,23,42,0.5)",
                border: selected.includes(opt.id) ? "1.5px solid rgba(59,130,246,0.4)" : `1px solid ${DS.border}`,
                cursor: "pointer",
              }}
              whileHover={{ scale: 1.005 }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: selected.includes(opt.id) ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)", color: selected.includes(opt.id) ? DS.blue : DS.text4 }}>
                {selected.includes(opt.id) ? <Check size={14} /> : <Plus size={12} />}
              </div>
              <div className="flex-1">
                <div style={{ color: DS.text, fontSize: 14, fontWeight: 600 }}>{opt.label}</div>
                {opt.labelEn && <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>{opt.labelEn}</div>}
              </div>
              <div style={{ color: DS.blue, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>
                +{fmtVND(opt.price)}
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

function _StepTalent({ talents, selected, onSelect }: { talents: WizardTalent[]; selected: string; onSelect: (id: string) => void }) {
  const t = useTranslations("BookingPage");
  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: "0.05em", marginBottom: 8 }}>{t("step3Title")}</h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>{t("step3Desc")}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {talents.map(tal => (
          <motion.button
            key={tal.id}
            onClick={() => onSelect(tal.id)}
            className="text-left p-5 rounded-2xl flex items-center gap-4"
            style={{
              background: selected === tal.id ? "rgba(59,130,246,0.1)" : "rgba(15,23,42,0.6)",
              border: selected === tal.id ? "1.5px solid rgba(59,130,246,0.4)" : `1px solid ${DS.border}`,
              cursor: "pointer",
            }}
            whileHover={{ scale: 1.015 }}
          >
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0" style={{ border: `2px solid ${tal.rankColor}50` }}>
              <img src={tal.img} alt={tal.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ color: DS.text, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{tal.name}</div>
              <div style={{ color: DS.text3, fontSize: 12, marginBottom: 4 }}>{tal.role}</div>
              <div className="flex items-center gap-2">
                <span style={{ color: tal.rankColor, fontSize: 12 }}>{tal.rankSymbol}</span>
                <span style={{ color: tal.rankColor, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>{tal.rank}</span>
              </div>
              <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 4 }}>{tal.specialty}</div>
            </div>
            {selected === tal.id && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: DS.blue }}>
                <Check size={12} style={{ color: "#fff" }} />
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function _StepSchedule({ startDate, setStartDate, duration, setDuration }: {
  startDate: string; setStartDate: (v: string) => void;
  duration: string; setDuration: (v: string) => void;
}) {
  const t = useTranslations("BookingPage");
  const durations = [
    { val: "2", label: "2 tuần" }, { val: "4", label: "1 tháng" },
    { val: "8", label: "2 tháng" }, { val: "12", label: "3 tháng" },
    { val: "24", label: "6 tháng" }, { val: "custom", label: t("custom") },
  ];

  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: "0.05em", marginBottom: 8 }}>{t("step4Title")}</h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>{t("step4Desc")}</p>
      <div className="space-y-6">
        <div>
          <label style={{ color: DS.text3, fontSize: 13, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 10 }}>{t("startDate")}</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{
              background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
              borderRadius: 12, padding: "12px 16px", color: DS.text, fontSize: 14,
              outline: "none", fontFamily: DS.body, width: "100%", maxWidth: 320, boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <label style={{ color: DS.text3, fontSize: 13, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 10 }}>{t("duration")}</label>
          <div className="flex flex-wrap gap-3">
            {durations.map(d => (
              <button
                key={d.val}
                onClick={() => setDuration(d.val)}
                style={{
                  padding: "10px 20px", borderRadius: 10, fontSize: 13, fontFamily: DS.mono, cursor: "pointer",
                  background: duration === d.val ? GRD.primary : "rgba(15,23,42,0.6)",
                  border: duration === d.val ? "none" : `1px solid ${DS.border}`,
                  color: duration === d.val ? "#fff" : DS.text3,
                  boxShadow: duration === d.val ? "0 0 16px rgba(59,130,246,0.3)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        {startDate && duration && duration !== "custom" && (
          <div className="p-4 rounded-xl" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} style={{ color: DS.blue }} />
              <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em" }}>TIMELINE DỰ KIẾN</span>
            </div>
            <div style={{ color: DS.text3, fontSize: 13 }}>
              {t("startLabel")}: <strong style={{ color: DS.text }}>{new Date(startDate).toLocaleDateString("vi-VN")}</strong>
              {" → "}
              {t("endLabel")}: <strong style={{ color: DS.green }}>
                {new Date(new Date(startDate).getTime() + parseInt(duration) * 7 * 24 * 60 * 60 * 1000).toLocaleDateString("vi-VN")}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function _StepExtras({ extraOptions, selected, onToggle }: { extraOptions: WizardExtra[]; selected: string[]; onToggle: (id: string) => void }) {
  const t = useTranslations("BookingPage");
  const icons: Record<string, React.ReactNode> = {
    hosting: <Globe size={16} />, maintenance: <Shield size={16} />,
    "analytics-setup": <BarChart3 size={16} />, training: <Users size={16} />,
    priority: <Sparkles size={16} />, "seo-basic": <Target size={16} />,
  };
  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: "0.05em", marginBottom: 8 }}>{t("step5Title")}</h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>{t("step5Desc")}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {extraOptions.map(ext => (
          <motion.button
            key={ext.id}
            onClick={() => onToggle(ext.id)}
            className="text-left p-4 rounded-xl flex items-center gap-3"
            style={{
              background: selected.includes(ext.id) ? `${ext.color}0C` : "rgba(15,23,42,0.5)",
              border: selected.includes(ext.id) ? `1.5px solid ${ext.color}50` : `1px solid ${DS.border}`,
              cursor: "pointer",
            }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${ext.color}15`, color: ext.color }}>
              {icons[ext.id] ?? <Layers size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{ext.label}</div>
              <div style={{ color: ext.color, fontSize: 12, fontFamily: DS.mono, marginTop: 2 }}>+{fmtVND(ext.price)}</div>
            </div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{
              background: selected.includes(ext.id) ? ext.color : "rgba(255,255,255,0.06)",
              border: selected.includes(ext.id) ? "none" : "1px solid rgba(255,255,255,0.1)",
            }}>
              {selected.includes(ext.id) ? <Check size={12} style={{ color: "#fff" }} /> : <Plus size={11} style={{ color: DS.text4 }} />}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function _StepReview({ service, pkg, talent, featureOptions, features, extraOptions, extras, startDate, duration }: {
  service: WizardService | null; pkg: WizardPackage | null; talent: WizardTalent | null;
  featureOptions: WizardFeature[]; features: string[];
  extraOptions: WizardExtra[]; extras: string[];
  startDate: string; duration: string;
}) {
  const t = useTranslations("BookingPage");
  const featureOpts = featureOptions.filter(f => features.includes(f.id));
  const extraOpts = extraOptions.filter(e => extras.includes(e.id));
  const rows = [
    { label: t("service"), value: service?.title ?? "—", color: service?.color },
    { label: t("package"), value: pkg?.name ?? "—", color: DS.blue },
    { label: t("pmLead"), value: talent?.name ?? "—", color: talent?.rankColor ?? DS.text3 },
    { label: t("startDate"), value: startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "—", color: DS.text },
    { label: t("duration"), value: duration === "custom" ? t("custom") : duration === "2" ? "2 tuần" : `${parseInt(duration) / 4} tháng`, color: DS.text },
  ];
  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: "0.05em", marginBottom: 8 }}>{t("step6Title")}</h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>{t("step6Desc")}</p>
      <div className="space-y-4">
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
          <div className="px-5 py-3" style={{ background: "rgba(59,130,246,0.08)", borderBottom: `1px solid ${DS.border}` }}>
            <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em" }}>{t("projectInfo").toUpperCase()}</span>
          </div>
          <div className="p-5 space-y-3">
            {rows.map(r => (
              <div key={r.label} className="flex justify-between">
                <span style={{ color: DS.text4, fontSize: 13 }}>{r.label}</span>
                <span style={{ color: r.color ?? DS.text, fontSize: 13, fontWeight: 600 }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
        {featureOpts.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
            <div className="px-5 py-3" style={{ background: "rgba(20,184,166,0.08)", borderBottom: `1px solid ${DS.border}` }}>
              <span style={{ color: DS.cyan, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em" }}>{t("extraFeatures").toUpperCase()} ({featureOpts.length})</span>
            </div>
            <div className="p-5 space-y-2">
              {featureOpts.map(f => (
                <div key={f.id} className="flex justify-between">
                  <span style={{ color: DS.text3, fontSize: 13 }}>{f.label}</span>
                  <span style={{ color: DS.cyan, fontSize: 13, fontFamily: DS.mono }}>+{fmtVND(f.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {extraOpts.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
            <div className="px-5 py-3" style={{ background: "rgba(129,140,248,0.08)", borderBottom: `1px solid ${DS.border}` }}>
              <span style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em" }}>{t("extraServices").toUpperCase()} ({extraOpts.length})</span>
            </div>
            <div className="p-5 space-y-2">
              {extraOpts.map(e => (
                <div key={e.id} className="flex justify-between">
                  <span style={{ color: DS.text3, fontSize: 13 }}>{e.label}</span>
                  <span style={{ color: DS.purple, fontSize: 13, fontFamily: DS.mono }}>+{fmtVND(e.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 3 — Contact + Payment (restructured from StepPayment) ─────────────────

function StepContact({
  vatRate,
  lpBalance, maxLpRedeem, lpDiscount, setLpDiscount,
  name, setName, email, setEmail, phone, setPhone, company, setCompany,
  startDate, setStartDate, duration, setDuration,
  talentNote, setTalentNote,
  paymentPlan, setPaymentPlan,
  service, features, extras,
  submitted, orderId, submitError, setSubmitError, onSubmit, submitLoading,
  onEditSelection,
}: {
  vatRate: number;
  lpBalance: number; maxLpRedeem: number; lpDiscount: number; setLpDiscount: (n: number) => void; lpRate: LpRateConfig;
  name: string; setName: (s: string) => void;
  email: string; setEmail: (s: string) => void;
  phone: string; setPhone: (s: string) => void;
  company: string; setCompany: (s: string) => void;
  startDate: string; setStartDate: (s: string) => void;
  duration: string; setDuration: (s: string) => void;
  talentNote: string; setTalentNote: (s: string) => void;
  paymentPlan: "50" | "100"; setPaymentPlan: (p: "50" | "100") => void;
  service: WizardService | null;
  features: WizardFeature[]; extras: WizardExtra[];
  submitted: boolean; orderId: string; submitError: string; setSubmitError: (s: string) => void;
  onSubmit: () => void; submitLoading: boolean;
  onEditSelection: () => void;
}) {
  const t = useTranslations("BookingPage");
  const payMethods = [
    { id: "bank", label: t("bankTransfer"), icon: "🏦" },
    { id: "vnpay", label: "VNPay QR", icon: "📱" },
    { id: "momo", label: "Momo", icon: "💜" },
  ];
  const [payMethod, setPayMethod] = useState("bank");

  const durations = [
    { val: "2", label: "2 tuần" }, { val: "4", label: "1 tháng" },
    { val: "8", label: "2 tháng" }, { val: "12", label: "3 tháng" },
    { val: "24", label: "6 tháng" }, { val: "custom", label: t("custom") },
  ];

  if (submitError) {
    return (
      <div className="text-center py-8">
        <div style={{ color: DS.red, fontSize: 13, marginBottom: 12, padding: "12px 16px", background: "rgba(239,68,68,0.1)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)" }}>
          {submitError}
        </div>
        <button onClick={() => setSubmitError("")} style={{ color: DS.text4, fontSize: 12, background: "none", border: "none", cursor: "pointer", fontFamily: DS.mono }}>
          {t("closeAndRetry")}
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <motion.div className="text-center py-12" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.4)" }}>
          <Check size={36} style={{ color: DS.green }} />
        </div>
        <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 24, fontWeight: 900, letterSpacing: "0.06em", marginBottom: 12 }}>
          {t("successTitle")}
        </h3>
        {orderId && (
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-xl" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)" }}>
            <span style={{ color: DS.text4, fontSize: 12 }}>{t("orderCode")}:</span>
            <span style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 14, fontWeight: 700 }}>{orderId}</span>
          </div>
        )}
        <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8, maxWidth: 400, margin: "0 auto 32px" }}>
          {t("successMessage")}
        </p>
        <div className="inline-block px-5 py-3 rounded-xl mb-6" style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.3)" }}>
          <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 4 }}>LP ĐIỂM THƯỞNG ĐĂNG KÝ</div>
          <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 24, fontWeight: 900 }}>+500 LP</div>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: "0.05em", marginBottom: 8 }}>{t("bookingContact")}</h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>{t("step7Desc")}</p>

      {/* Inline order summary */}
      <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em" }}>{t("orderSummary").toUpperCase()}</span>
          <button onClick={onEditSelection} style={{ background: "none", border: "none", cursor: "pointer", color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>
            {t("editSelection")} ←
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {service && (
            <span className="px-3 py-1 rounded-full text-xs font-mono" style={{ background: `${service.color}15`, color: service.color, border: `1px solid ${service.color}30` }}>
              {service.title}
            </span>
          )}
          {features.length > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-mono" style={{ background: "rgba(20,184,166,0.1)", color: DS.cyan, border: "1px solid rgba(20,184,166,0.2)" }}>
              +{features.length} tính năng
            </span>
          )}
          {extras.length > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-mono" style={{ background: "rgba(129,140,248,0.1)", color: DS.purple, border: "1px solid rgba(129,140,248,0.2)" }}>
              +{extras.length} dịch vụ
            </span>
          )}
        </div>
      </div>

      {/* Contact fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {[
          { label: t("fullName"), value: name, set: setName, placeholder: "Nguyễn Văn A" },
          { label: t("companyEmail"), value: email, set: setEmail, placeholder: "name@company.vn" },
          { label: t("phone"), value: phone, set: setPhone, placeholder: "0901 234 567" },
          { label: t("companyName"), value: company, set: setCompany, placeholder: t("companyPlaceholder") },
        ].map(f => (
          <div key={f.label}>
            <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>{f.label}</label>
            <input
              value={f.value}
              onChange={e => f.set(e.target.value)}
              placeholder={f.placeholder}
              style={{
                width: "100%", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
                borderRadius: 10, padding: "11px 14px", color: DS.text, fontSize: 14,
                outline: "none", fontFamily: DS.body, boxSizing: "border-box",
              }}
            />
          </div>
        ))}
      </div>

      {/* Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>{t("startDate")}</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{
              background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
              borderRadius: 10, padding: "11px 14px", color: DS.text, fontSize: 14,
              outline: "none", fontFamily: DS.body, width: "100%", boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>{t("duration")}</label>
          <div className="flex flex-wrap gap-2">
            {durations.map(d => (
              <button
                key={d.val}
                onClick={() => setDuration(d.val)}
                style={{
                  padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: DS.mono, cursor: "pointer",
                  background: duration === d.val ? GRD.primary : "rgba(15,23,42,0.6)",
                  border: duration === d.val ? "none" : `1px solid ${DS.border}`,
                  color: duration === d.val ? "#fff" : DS.text3,
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Talent note */}
      <div className="mb-5">
        <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>{t("talentNote")}</label>
        <textarea
          value={talentNote}
          onChange={e => setTalentNote(e.target.value)}
          placeholder={t("talentNotePlaceholder")}
          rows={2}
          style={{
            width: "100%", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
            borderRadius: 10, padding: "11px 14px", color: DS.text, fontSize: 14,
            outline: "none", fontFamily: DS.body, boxSizing: "border-box", resize: "vertical",
          }}
        />
      </div>

      {/* LP redemption */}
      {lpBalance > 0 && (
        <div className="mb-5 p-4 rounded-xl" style={{ background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.25)" }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 2 }}>◈ {t("useLpDiscount")}</div>
              <div style={{ color: DS.text4, fontSize: 11 }}>{t("balance")}: {lpBalance.toLocaleString()} LP · {t("maxUse")}: {maxLpRedeem.toLocaleString()} LP (20%)</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLpDiscount(Math.max(0, lpDiscount - 1000))} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1px solid ${DS.border}`, color: DS.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Minus size={12} />
            </button>
            <div style={{ color: DS.purple, fontFamily: DS.mono, fontSize: 15, fontWeight: 700, minWidth: 80, textAlign: "center" }}>
              {lpDiscount.toLocaleString()} LP
            </div>
            <button onClick={() => setLpDiscount(Math.min(maxLpRedeem, lpDiscount + 1000))} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1px solid ${DS.border}`, color: DS.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Payment Plan selector */}
      <div className="mb-6">
        <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 10 }}>{t("paymentPlan")}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentPlan("50")}
            style={{
              padding: "14px 16px", borderRadius: 12, fontSize: 13, cursor: "pointer", textAlign: "left",
              background: paymentPlan === "50" ? "rgba(59,130,246,0.12)" : "rgba(15,23,42,0.5)",
              border: paymentPlan === "50" ? "1.5px solid rgba(59,130,246,0.5)" : `1px solid ${DS.border}`,
              color: paymentPlan === "50" ? DS.text : DS.text3,
              display: "flex", flexDirection: "column", gap: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${paymentPlan === "50" ? DS.blue : DS.text4}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {paymentPlan === "50" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: DS.blue }} />}
              </div>
              <span style={{ fontFamily: DS.mono, fontWeight: 600 }}>{t("paymentPlan50")}</span>
            </div>
            <div style={{ color: paymentPlan === "50" ? DS.text3 : DS.text5, fontSize: 11, marginLeft: 24 }}>{t("paymentPlan50Desc")}</div>
          </button>
          <button
            onClick={() => setPaymentPlan("100")}
            style={{
              padding: "14px 16px", borderRadius: 12, fontSize: 13, cursor: "pointer", textAlign: "left",
              background: paymentPlan === "100" ? "rgba(34,197,94,0.12)" : "rgba(15,23,42,0.5)",
              border: paymentPlan === "100" ? "1.5px solid rgba(34,197,94,0.5)" : `1px solid ${DS.border}`,
              color: paymentPlan === "100" ? DS.text : DS.text3,
              display: "flex", flexDirection: "column", gap: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${paymentPlan === "100" ? DS.green : DS.text4}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {paymentPlan === "100" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: DS.green }} />}
              </div>
              <span style={{ fontFamily: DS.mono, fontWeight: 600 }}>{t("paymentPlan100")}</span>
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "rgba(34,197,94,0.15)", color: DS.green, fontFamily: DS.mono }}>−5%</span>
            </div>
            <div style={{ color: paymentPlan === "100" ? DS.text3 : DS.text5, fontSize: 11, marginLeft: 24 }}>{t("paymentPlan100Desc")}</div>
          </button>
        </div>
      </div>

      {/* Payment method */}
      <div className="mb-6">
        <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 10 }}>{t("depositPayment")}</label>
        <div className="flex gap-3 flex-wrap">
          {payMethods.map(m => (
            <button
              key={m.id}
              onClick={() => setPayMethod(m.id)}
              style={{
                padding: "10px 18px", borderRadius: 10, fontSize: 13, cursor: "pointer",
                background: payMethod === m.id ? "rgba(59,130,246,0.15)" : "rgba(15,23,42,0.5)",
                border: payMethod === m.id ? "1.5px solid rgba(59,130,246,0.5)" : `1px solid ${DS.border}`,
                color: payMethod === m.id ? DS.blue : DS.text3,
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!name || !email || !phone || submitLoading}
        style={{
          background: (name && email && phone && !submitLoading) ? GRD.primary : "rgba(255,255,255,0.1)",
          color: (name && email && phone && !submitLoading) ? "#fff" : DS.text4,
          fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 14, border: "none",
          cursor: (name && email && phone && !submitLoading) ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: (name && email && phone && !submitLoading) ? "0 0 30px rgba(129,140,248,0.4)" : "none",
          transition: "all 0.3s",
        }}
      >
        <Shield size={16} />
        {submitLoading ? t("submitting") : t("submitButton")}
        {!submitLoading && <ArrowRight size={15} />}
      </button>
      <div style={{ color: DS.text5, fontSize: 11, marginTop: 10 }}>* {paymentPlan === "100" ? "Thanh toán 100% ngay — giảm 5%." : t("depositNote")}</div>
    </div>
  );
}

// ── Step 8 — Payment ──────────────────────────────────────────────────────────

function _StepPayment({
  lpBalance, maxLpRedeem, lpDiscount, setLpDiscount, lpRate,
  name, setName, email, setEmail, phone, setPhone, company, setCompany,
  submitted, orderId, submitError, setSubmitError, onSubmit, submitLoading,
}: {
  lpBalance: number; maxLpRedeem: number; lpDiscount: number; setLpDiscount: (n: number) => void; lpRate: LpRateConfig;
  name: string; setName: (s: string) => void;
  email: string; setEmail: (s: string) => void;
  phone: string; setPhone: (s: string) => void;
  company: string; setCompany: (s: string) => void;
  submitted: boolean; orderId: string; submitError: string; setSubmitError: (s: string) => void;
  onSubmit: () => void; submitLoading: boolean;
}) {
  const t = useTranslations("BookingPage");
  const payMethods = [
    { id: "bank", label: t("bankTransfer"), icon: "🏦" },
    { id: "vnpay", label: "VNPay QR", icon: "📱" },
    { id: "momo", label: "Momo", icon: "💜" },
  ];
  const [payMethod, setPayMethod] = useState("bank");

  if (submitError) {
    return (
      <div className="text-center py-8">
        <div style={{ color: DS.red, fontSize: 13, marginBottom: 12, padding: "12px 16px", background: "rgba(239,68,68,0.1)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)" }}>
          {submitError}
        </div>
        <button onClick={() => setSubmitError("")} style={{ color: DS.text4, fontSize: 12, background: "none", border: "none", cursor: "pointer", fontFamily: DS.mono }}>
          {t("closeAndRetry")}
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <motion.div className="text-center py-12" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.4)" }}>
          <Check size={36} style={{ color: DS.green }} />
        </div>
        <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 24, fontWeight: 900, letterSpacing: "0.06em", marginBottom: 12 }}>
          {t("successTitle")}
        </h3>
        {orderId && (
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-xl" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)" }}>
            <span style={{ color: DS.text4, fontSize: 12 }}>{t("orderCode")}:</span>
            <span style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 14, fontWeight: 700 }}>{orderId}</span>
          </div>
        )}
        <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8, maxWidth: 400, margin: "0 auto 32px" }}>
          {t("successMessage")}
        </p>
        <div className="inline-block px-5 py-3 rounded-xl mb-6" style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.3)" }}>
          <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 4 }}>LP ĐIỂM THƯỞNG ĐĂNG KÝ</div>
          <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 24, fontWeight: 900 }}>+500 LP</div>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: "0.05em", marginBottom: 8 }}>{t("step7Title")}</h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>{t("step7Desc")}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[
          { label: t("fullName"), value: name, set: setName, placeholder: "Nguyễn Văn A" },
          { label: t("companyEmail"), value: email, set: setEmail, placeholder: "name@company.vn" },
          { label: t("phone"), value: phone, set: setPhone, placeholder: "0901 234 567" },
          { label: t("companyName"), value: company, set: setCompany, placeholder: t("companyPlaceholder") },
        ].map(f => (
          <div key={f.label}>
            <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>{f.label}</label>
            <input
              value={f.value}
              onChange={e => f.set(e.target.value)}
              placeholder={f.placeholder}
              style={{
                width: "100%", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
                borderRadius: 10, padding: "11px 14px", color: DS.text, fontSize: 14,
                outline: "none", fontFamily: DS.body, boxSizing: "border-box",
              }}
            />
          </div>
        ))}
      </div>

      {lpBalance > 0 && (
        <div className="mb-6 p-5 rounded-xl" style={{ background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.25)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 2 }}>◈ {t("useLpDiscount")}</div>
              <div style={{ color: DS.text4, fontSize: 11 }}>{t("balance")}: {lpBalance.toLocaleString()} LP · {t("maxUse")}: {maxLpRedeem.toLocaleString()} LP (20%)</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setLpDiscount(Math.max(0, lpDiscount - 1000))} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1px solid ${DS.border}`, color: DS.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Minus size={14} />
            </button>
            <div style={{ color: DS.purple, fontFamily: DS.mono, fontSize: 16, fontWeight: 700, minWidth: 80, textAlign: "center" }}>
              {lpDiscount.toLocaleString()} LP
            </div>
            <button onClick={() => setLpDiscount(Math.min(maxLpRedeem, lpDiscount + 1000))} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1px solid ${DS.border}`, color: DS.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 10 }}>{t("depositPayment")} (30%)</label>
        <div className="flex gap-3 flex-wrap">
          {payMethods.map(m => (
            <button
              key={m.id}
              onClick={() => setPayMethod(m.id)}
              style={{
                padding: "10px 18px", borderRadius: 10, fontSize: 13, cursor: "pointer",
                background: payMethod === m.id ? "rgba(59,130,246,0.15)" : "rgba(15,23,42,0.5)",
                border: payMethod === m.id ? "1.5px solid rgba(59,130,246,0.5)" : `1px solid ${DS.border}`,
                color: payMethod === m.id ? DS.blue : DS.text3,
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={!name || !email || !phone || submitLoading}
        style={{
          background: (name && email && phone && !submitLoading) ? GRD.primary : "rgba(255,255,255,0.1)",
          color: (name && email && phone && !submitLoading) ? "#fff" : DS.text4,
          fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 14, border: "none",
          cursor: (name && email && phone && !submitLoading) ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: (name && email && phone && !submitLoading) ? "0 0 30px rgba(129,140,248,0.4)" : "none",
          transition: "all 0.3s",
        }}
      >
        <Shield size={16} />
        {submitLoading ? t("submitting") : t("submitButton")}
        {!submitLoading && <ArrowRight size={15} />}
      </button>
      <div style={{ color: DS.text5, fontSize: 11, marginTop: 10 }}>* {t("depositNote")}</div>
    </div>
  );
}

// ── Main BookingWizardClient ────────────────────────────────────────────────

interface Props { locale: string }

export function BookingWizardClient({ locale }: Props) {
  const t = useTranslations("BookingPage");

  // ── Wizard state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [paymentPlan, setPaymentPlan] = useState<"50" | "100">("50");
  const searchParams = useSearchParams();
  const [serviceId, setServiceId] = useState(() => {
    // Pre-select service from ?service= URL param (e.g. from /services?tab=tabCustom)
    const s = searchParams.get("service");
    return s && FALLBACK_SERVICES.some((svc) => svc.id === s) ? s : "";
  });
  // Add-on modal state
  const [modal, setModal] = useState<AddonModalState>({ type: null, isOpen: false });
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [lpDiscount, setLpDiscount] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [talentNote, setTalentNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [newOrderId, setNewOrderId] = useState("");

  // ── Wizard config (from BE, with fallback) ─────────────────────────────
  const [services, setServices] = useState<WizardService[]>(FALLBACK_SERVICES);
  const [packages] = useState<WizardPackage[]>(FALLBACK_PACKAGES);
  const [featureOptions, setFeatureOptions] = useState<Record<string, WizardFeature[]>>(FALLBACK_FEATURES);
  const [extraOptions] = useState<WizardExtra[]>(FALLBACK_EXTRAS);
  const [hostingPlans, setHostingPlans] = useState<WizardHostingPlan[]>([]);
  const [domainPrices, setDomainPrices] = useState<WizardDomainPrice[]>([]);
  const [selectedHostingPlan, setSelectedHostingPlan] = useState<string>("");
  const [domainName, setDomainName] = useState("");
  const [domainPurchaseNow, setDomainPurchaseNow] = useState(true);
  const [lpRate, setLpRate] = useState<LpRateConfig>(DEFAULT_LP_RATE);
  const [vatRate, setVatRate] = useState(0.10);
  const [maxLpRedeem, setMaxLpRedeem] = useState(0);

  // LP balance — 0 for anonymous users (auth needed for real balance)
  const lpBalance = 0;

  // Filtered feature options for current service
  const currentFeatureOptions: WizardFeature[] = featureOptions[serviceId] ?? [];

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pricing/config?lang=${locale}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled || !json?.data) return;
        const cfg: PricingConfig = json.data;

        if (cfg.packages?.length) {
          const wSvcs: WizardService[] = cfg.packages.slice(0, 4).map((p, i) => ({
            id: p.slug || p.id,
            title: p.name,
            desc: p.desc || "",
            basePrice: p.price ?? 15_000_000,
            color: ["#3B82F6", "#818CF8", "#14B8A6", "#22C55E"][i] ?? "#3B82F6",
            perMonth: p.isSubscription,
          }));
          if (wSvcs.length > 0) setServices(wSvcs);
          // packages are static — no longer derived from API
        }

        if (cfg.features?.length) {
          const grouped: Record<string, WizardFeature[]> = {};
          for (const f of cfg.features) {
            const cat = f.category || "Nâng cao";
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat]!.push(f);
          }
          if (Object.keys(grouped).length) setFeatureOptions(grouped);
        }

        if (cfg.hostingPlans?.length) setHostingPlans(cfg.hostingPlans);
        if (cfg.domainPrices?.length) setDomainPrices(cfg.domainPrices);

        if (cfg.lpRate) setLpRate(cfg.lpRate);
        if (cfg.vatRate !== undefined) setVatRate(cfg.vatRate);
      })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, [locale]);

  // Auto-skip to Step 1 when serviceId is pre-selected from URL (?service=web)
  useEffect(() => {
    if (serviceId && step === 0) {
      setStep(1);
    }
  }, [serviceId]);

  // ── Derived values ────────────────────────────────────────────────────
  const service = services.find(s => s.id === serviceId) ?? null;

  // Filter: only count non-included features for price
  const extraFeaturePrice = currentFeatureOptions
    .filter(f => selectedFeatures.includes(f.id) && !f.includedInBase)
    .reduce((s, f) => s + f.price, 0);
  const currentExtraPrice = extraOptions.filter(e => selectedExtras.includes(e.id)).reduce((s, e) => s + e.price, 0);
  const currentBasePrice = service?.basePrice ?? 0;
  const selectedHosting = hostingPlans.find(h => h.slug === selectedHostingPlan);
  const hostingCost = selectedHosting?.discountedPrice ?? 0;
  const domainCost = domainPurchaseNow && domainName
    ? (domainPrices.find(d => domainName.endsWith(d.extension))?.registrationPrice ?? 0)
    : 0;
  const currentSubtotal = currentBasePrice + extraFeaturePrice + currentExtraPrice + hostingCost + domainCost;

  useEffect(() => {
    const maxDiscountVnd = currentSubtotal * (lpRate.maxDiscountPercent / 100);
    const lpNeededForMax = Math.floor(maxDiscountVnd / lpRate.lpPerVnd);
    const maxAllowed = Math.max(0, Math.min(lpBalance, lpNeededForMax));
    setMaxLpRedeem(maxAllowed);
    if (lpDiscount > maxAllowed) setLpDiscount(maxAllowed);
  }, [currentSubtotal, lpBalance, lpRate, lpDiscount]);

  const toggleFeature = (id: string) =>
    setSelectedFeatures(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  const toggleExtra = (id: string) =>
    setSelectedExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  const canNext = () => {
    if (step === 0) return !!serviceId;
    if (step === 1) return true;  // features are optional
    if (step === 2) return true;  // hosting/domain are optional
    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const svc = service;
    const featOpts = currentFeatureOptions;
    const basePrice = svc ? svc.basePrice : 0;
    // Only charge for non-included features
    const featPrices = featOpts
      .filter(f => selectedFeatures.includes(f.id) && !f.includedInBase)
      .reduce((s, f) => s + f.price, 0);
    const extraPricesTotal = extraOptions.filter(e => selectedExtras.includes(e.id)).reduce((s, e) => s + e.price, 0);
    const domainTotalCost = domainPurchaseNow && domainName
      ? (domainPrices.find(d => domainName.endsWith(d.extension))?.registrationPrice ?? 0)
      : 0;
    const hostingTotalCost = selectedHosting?.discountedPrice ?? 0;
    const subtotal = basePrice + featPrices + extraPricesTotal + hostingTotalCost + domainTotalCost;
    // Deduct LP discount from total (lpDiscount already capped at 20% in useEffect)
    const vndDiscount = Math.round(lpDiscount * lpRate.lpPerVnd);
    const total = Math.round((subtotal - vndDiscount) * (1 + vatRate));
    // Chỉ gửi features có phí thêm (non-includedInBase) trong selectedItems
    // Backend sẽ tính basePrice + featureTotal riêng để đảm bảo FE/BE đồng nhất
    const paidFeatureItems = featOpts
      .filter(f => selectedFeatures.includes(f.id) && !f.includedInBase)
      .map(f => ({
        featureId: f.id, featureName: f.label, variantId: "", variantName: "", price: f.price,
      }));
    const selectedItems = [
      { featureId: svc?.id ?? serviceId, featureName: svc?.title ?? "", variantId: "", variantName: "Custom", price: basePrice },
      ...paidFeatureItems,
      ...extraOptions.filter(e => selectedExtras.includes(e.id)).map(e => ({
        featureId: e.id, featureName: e.label, variantId: "", variantName: "", price: e.price,
      })),
    ];

    try {
      setSubmitLoading(true);
      setSubmitError("");
      const res = await fetch("/api/pricing/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerEmail: email,
          customerPhone: phone || undefined,
          companyName: company || undefined,
          selectedItems,
          totalAmount: total,
          lpUsed: lpDiscount,  // LP discount applied by customer
          paymentPlan,
          notes: `Dịch vụ: ${svc?.title ?? ""} | Tính năng: ${selectedFeatures.length} | Ghi chú đội ngũ: ${talentNote || "—"} | Bắt đầu: ${startDate || "—"} | Thời gian: ${duration || "—"}`,
          hostingPlanSlug: selectedHosting?.slug || undefined,
          domainName: domainName || undefined,
          domainPurchaseTime: domainPurchaseNow ? "now" : "after_handover",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "submission failed");
      // QuoteRequest has no orderNumber — use the created row's id as reference
      setNewOrderId(data?.data?.id ?? data?.data?.orderNumber ?? "");
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── i18n step labels ──────────────────────────────────────────────────
  const STEP_LABELS = [
    t("step0Short"),
    t("bookingPackage"),
    t("bookingContact"),
  ];

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ background: GRD.hero, padding: "40px 0 0" }}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)" }}>
            <Sparkles size={12} style={{ color: DS.blue }} />
            <span style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.22em" }}>{t("badge")}</span>
          </div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 42, fontWeight: 900, letterSpacing: "0.06em", background: GRD.heroText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>
            {t("heroTitle")}
          </h1>
          <p style={{ color: DS.text3, fontSize: 16, lineHeight: 1.8, marginBottom: 32 }}>{t("heroDesc")}</p>
        </div>
        <ProgressBar step={step} stepLabels={STEP_LABELS} />
      </section>

      {/* Wizard body */}
      <section style={{ padding: "32px 0 64px" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Step content */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {step === 0 && <StepService services={services} selected={serviceId} onSelect={setServiceId} />}
                  {step === 1 && (
                    <StepAddons
                      featureOptions={currentFeatureOptions}
                      selectedFeatures={selectedFeatures} onToggleFeature={toggleFeature}
                      extraOptions={extraOptions} selectedExtras={selectedExtras} onToggleExtra={toggleExtra}
                      hostingPlans={hostingPlans}
                      selectedHostingPlan={selectedHostingPlan}
                      onSelectHostingPlan={setSelectedHostingPlan}
                      domainPrices={domainPrices}
                      domainName={domainName}
                      onSetDomainName={setDomainName}
                      domainPurchaseNow={domainPurchaseNow}
                      onSetDomainPurchaseNow={setDomainPurchaseNow}
                      modal={modal}
                      setModal={setModal}
                    />
                  )}
                  {step === 2 && (
                    <StepContact
                      vatRate={vatRate}
                      lpBalance={lpBalance} maxLpRedeem={maxLpRedeem}
                      lpDiscount={lpDiscount} setLpDiscount={setLpDiscount} lpRate={lpRate}
                      name={name} setName={setName} email={email} setEmail={setEmail}
                      phone={phone} setPhone={setPhone} company={company} setCompany={setCompany}
                      startDate={startDate} setStartDate={setStartDate}
                      duration={duration} setDuration={setDuration}
                      talentNote={talentNote} setTalentNote={setTalentNote}
                      paymentPlan={paymentPlan} setPaymentPlan={setPaymentPlan}
                      service={service}
                      features={currentFeatureOptions.filter(f => selectedFeatures.includes(f.id))}
                      extras={extraOptions.filter(e => selectedExtras.includes(e.id))}
                      submitted={submitted} orderId={newOrderId}
                      submitError={submitError} setSubmitError={setSubmitError}
                      onSubmit={handleSubmit} submitLoading={submitLoading}
                      onEditSelection={() => setStep(1)}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              {!submitted && (
                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={() => setStep(s => Math.max(0, s - 1))}
                    disabled={step === 0}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 20px", borderRadius: 10, cursor: step === 0 ? "not-allowed" : "pointer",
                      background: step === 0 ? "transparent" : "rgba(15,23,42,0.6)",
                      border: `1px solid ${DS.border}`, color: step === 0 ? DS.text5 : DS.text3,
                      opacity: step === 0 ? 0.4 : 1,
                    }}
                  >
                    <ArrowLeft size={15} />
                    {t("back")}
                  </button>
                  <div className="flex items-center gap-2">
                    <div style={{ color: DS.text4, fontSize: 12 }}>{step + 1} / 3</div>
                    {step < 2 && (
                      <button
                        onClick={() => setStep(s => s + 1)}
                        disabled={!canNext()}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "10px 24px", borderRadius: 10, cursor: canNext() ? "pointer" : "not-allowed",
                          background: canNext() ? GRD.primary : "rgba(255,255,255,0.05)",
                          border: "none", color: canNext() ? "#fff" : DS.text4,
                          opacity: canNext() ? 1 : 0.5,
                          boxShadow: canNext() ? "0 0 20px rgba(59,130,246,0.3)" : "none",
                        }}
                      >
                        {t("next")}
                        <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Price sidebar */}
            {!submitted && (
              <div>
                <PriceSidebar
                  service={service}
                  featureOptions={currentFeatureOptions} features={selectedFeatures}
                  extraOptions={extraOptions} extras={selectedExtras}
                  lpDiscount={lpDiscount} lpBalance={lpBalance} lpRate={lpRate}
                  vatRate={vatRate}
                  selectedHostingPlan={selectedHostingPlan}
                  hostingPlans={hostingPlans}
                  domainPrices={domainPrices}
                  domainName={domainName}
                  domainPurchaseNow={domainPurchaseNow}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
