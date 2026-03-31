"use client";

/**
 * Booking Wizard Client Component — Next.js / BE
 * Route: /{locale}/booking
 *
 * 8-step wizard mirroring the FE mock UX:
 *   0 Services  1 Packages  2 Features  3 PM/Talent
 *   4 Schedule 5 Extras    6 Review    7 Payment
 *
 * Uses: DS/GRD/GLOW design tokens, motion/react, lucide-react, next-intl
 */

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Globe, Code2, BarChart3, Target, Check, ArrowRight, ArrowLeft,
  Users, Calendar, Layers, Sparkles, Shield, X, Plus, Minus,
} from "lucide-react";
import type { PricingConfig } from "@/lib/types/booking";

// ── Types ────────────────────────────────────────────────────────────────────

interface WizardService {
  id: string; title: string; desc: string;
  basePrice: number; color: string; perMonth?: boolean;
}
interface WizardPackage {
  id: string; name: string; multiplier: number; color: string;
  desc: string; features: string[]; lp: number; popular?: boolean;
}
interface WizardFeature {
  id: string; label: string; labelEn?: string; price: number;
  category: string; xpPoints?: number; tier?: string;
  categoryEn?: string; parentId?: string | null;
}
interface WizardTalent {
  id: string; name: string; role: string; rank: string;
  rankColor: string; rankSymbol: string; img: string; specialty: string;
}
interface WizardExtra {
  id: string; label: string; price: number; color: string;
}
interface LpRateConfig {
  lpPerVnd: number; vndPerLp: number;
  maxDiscountPercent: number; lpEarnPerMillion: number;
}

// ── Fallback data (same as FE mock) ─────────────────────────────────────────

const FALLBACK_SERVICES: WizardService[] = [
  { id: "web", title: "Thiết kế & Phát triển Website", desc: "Landing page, corporate site, e-commerce — chuẩn React/Next.js, tốc độ cao.", color: "#3B82F6", basePrice: 15_000_000 },
  { id: "app", title: "Phát triển App & SaaS Platform", desc: "Mobile app (React Native), web app, nền tảng SaaS cho doanh nghiệp.", color: "#818CF8", basePrice: 80_000_000 },
  { id: "dashboard", title: "Dashboard & Data Analytics", desc: "Real-time dashboard, báo cáo tự động, data visualization chuyên nghiệp.", color: "#14B8A6", basePrice: 25_000_000 },
  { id: "seo", title: "SEO & Digital Marketing", desc: "Tăng trưởng organic, Google Ads, content strategy — gói tháng linh hoạt.", color: "#22C55E", basePrice: 8_000_000, perMonth: true },
];

const FALLBACK_PACKAGES: WizardPackage[] = [
  { id: "starter", name: "Starter", multiplier: 1, color: DS.text3, desc: "Phù hợp cá nhân, startup giai đoạn đầu", features: ["Thiết kế cơ bản", "Responsive design", "SEO cơ bản", "Bảo hành 3 tháng"], lp: 50 },
  { id: "business", name: "Business", multiplier: 2.2, color: DS.blue, desc: "Doanh nghiệp vừa, sản phẩm cần scale", features: ["Thiết kế độc quyền", "CMS tích hợp", "Analytics dashboard", "Bảo hành 6 tháng", "Không giới hạn sửa"], lp: 120, popular: true },
  { id: "enterprise", name: "Enterprise", multiplier: 3.8, color: DS.purple, desc: "Doanh nghiệp lớn, yêu cầu cao về tính năng", features: ["Tùy chỉnh hoàn toàn", "API & Integrations", "SLA 99.9%", "Dedicated PM", "Support 24/7", "Bảo hành 12 tháng"], lp: 250 },
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

const FALLBACK_TALENTS: WizardTalent[] = [
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
          <div key={label} className="flex flex-col items-center" style={{ flex: i < 7 ? 1 : "none" }}>
            <div className="flex items-center w-full">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  background: i < step ? GRD.primary : i === step ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
                  border: i === step ? "2px solid #3B82F6" : i < step ? "none" : "1px solid rgba(255,255,255,0.12)",
                  boxShadow: i === step ? "0 0 16px rgba(59,130,246,0.5)" : "none",
                }}
              >
                {i < step ? (
                  <Check size={13} style={{ color: "#fff" }} />
                ) : (
                  <span style={{ color: i === step ? DS.blue : DS.text5, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{i + 1}</span>
                )}
              </div>
              {i < 7 && (
                <div className="flex-1 h-0.5 mx-1" style={{ background: i < step ? GRD.primary : "rgba(255,255,255,0.06)" }} />
              )}
            </div>
            <div style={{ color: i === step ? DS.blue : i < step ? DS.text4 : DS.text5, fontSize: 9, fontFamily: DS.mono, marginTop: 6, letterSpacing: "0.08em", textAlign: "center", maxWidth: 56 }}>
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
  service, pkg, featureOptions, features, extras, extraOptions, lpDiscount, lpBalance, lpRate,
}: {
  service: WizardService | null; pkg: WizardPackage | null;
  featureOptions: WizardFeature[]; features: string[];
  extraOptions: WizardExtra[]; extras: string[];
  lpDiscount: number; lpBalance: number; lpRate: LpRateConfig;
}) {
  const basePrice = service ? service.basePrice * (pkg?.multiplier ?? 1) : 0;
  const featurePrices = featureOptions.filter(f => features.includes(f.id)).reduce((s, f) => s + f.price, 0);
  const extraPrices = extraOptions.filter(e => extras.includes(e.id)).reduce((s, e) => s + e.price, 0);
  const subtotal = basePrice + featurePrices + extraPrices;
  const lpApplied = calcLpDiscount(subtotal, lpDiscount, lpBalance, lpRate);
  const total = subtotal - lpApplied.vndDiscount;
  const lpEarned = Math.floor(total / 1_000_000) * lpRate.lpEarnPerMillion;

  return (
    <div className="rounded-2xl overflow-hidden sticky top-6">
      <div style={{ background: "rgba(15,23,42,0.9)", border: `1px solid ${DS.border}`, backdropFilter: "blur(20px)" }}>
        <div className="px-5 py-4" style={{ background: GRD.primary }}>
          <div style={{ color: "#fff", fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 2 }}>TỔNG GIÁ ƯỚC TÍNH</div>
          <div style={{ color: "#fff", fontFamily: DS.heading, fontSize: 28, fontWeight: 900 }}>
            {fmtVND(total)}
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
          {pkg && pkg.multiplier > 1 && (
            <div className="flex justify-between">
              <span style={{ color: DS.text3, fontSize: 12 }}>Gói {pkg.name}</span>
              <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>×{pkg.multiplier}</span>
            </div>
          )}
          {featurePrices > 0 && (
            <div className="flex justify-between">
              <span style={{ color: DS.text3, fontSize: 12 }}>Tính năng thêm ({features.length})</span>
              <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(featurePrices)}</span>
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
          {total > 0 && (
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${DS.border}` }}>
              <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>TỔNG CỘNG</span>
              <span style={{ color: DS.blue, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(total)}</span>
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

function StepPackage({ packages, service, selected, onSelect }: { packages: WizardPackage[]; service: WizardService | null; selected: string; onSelect: (id: string) => void }) {
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

function StepFeatures({ featureOptions, selected, onToggle }: { featureOptions: WizardFeature[]; selected: string[]; onToggle: (id: string) => void }) {
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

function StepTalent({ talents, selected, onSelect }: { talents: WizardTalent[]; selected: string; onSelect: (id: string) => void }) {
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

function StepSchedule({ startDate, setStartDate, duration, setDuration }: {
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

function StepExtras({ extraOptions, selected, onToggle }: { extraOptions: WizardExtra[]; selected: string[]; onToggle: (id: string) => void }) {
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

function StepReview({ service, pkg, talent, featureOptions, features, extraOptions, extras, startDate, duration }: {
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

// ── Step 8 — Payment ──────────────────────────────────────────────────────────

function StepPayment({
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
  const [serviceId, setServiceId] = useState("");
  const [pkgId, setPkgId] = useState("business");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [talentId, setTalentId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [lpDiscount, setLpDiscount] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [newOrderId, setNewOrderId] = useState("");

  // ── Wizard config (from BE, with fallback) ─────────────────────────────
  const [services, setServices] = useState<WizardService[]>(FALLBACK_SERVICES);
  const [packages, setPackages] = useState<WizardPackage[]>(FALLBACK_PACKAGES);
  const [featureOptions, setFeatureOptions] = useState<Record<string, WizardFeature[]>>(FALLBACK_FEATURES);
  const [talents] = useState<WizardTalent[]>(FALLBACK_TALENTS);
  const [extraOptions] = useState<WizardExtra[]>(FALLBACK_EXTRAS);
  const [lpRate, setLpRate] = useState<LpRateConfig>(DEFAULT_LP_RATE);
  const [maxLpRedeem, setMaxLpRedeem] = useState(0);

  // LP balance — 0 for anonymous users (auth needed for real balance)
  const lpBalance = 0;

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
          setPackages(cfg.packages.map((p, i) => ({
            id: p.id,
            name: p.name,
            multiplier: p.multiplier,
            color: p.popular ? DS.blue : i === 2 ? DS.purple : DS.text3,
            desc: p.desc || "",
            features: p.features ?? [],
            lp: p.slug && cfg.packageLps?.[p.slug] ? cfg.packageLps?.[p.slug]! : 50,
            popular: p.popular,
          })));
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

        if (cfg.lpRate) setLpRate(cfg.lpRate);
      })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, [locale]);

  // ── Derived values ────────────────────────────────────────────────────
  const service = services.find(s => s.id === serviceId) ?? null;
  const pkg = packages.find(p => p.id === pkgId) ?? null;
  const talent = talents.find(t => t.id === talentId) ?? null;
  const currentFeatureOptions: WizardFeature[] = featureOptions[serviceId] ?? [];

  const currentBasePrice = service ? service.basePrice * (pkg?.multiplier ?? 1) : 0;
  const currentFeaturePrice = currentFeatureOptions.filter(f => selectedFeatures.includes(f.id)).reduce((s, f) => s + f.price, 0);
  const currentExtraPrice = extraOptions.filter(e => selectedExtras.includes(e.id)).reduce((s, e) => s + e.price, 0);
  const currentSubtotal = currentBasePrice + currentFeaturePrice + currentExtraPrice;

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
    if (step === 1) return !!pkgId;
    if (step === 3) return !!talentId;
    if (step === 4) return !!startDate && !!duration;
    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const svc = service;
    const selectedPkg = pkg;
    const featOpts = currentFeatureOptions;
    const basePrice = svc ? svc.basePrice * (selectedPkg?.multiplier ?? 1) : 0;
    const featPrices = featOpts.filter(f => selectedFeatures.includes(f.id)).reduce((s, f) => s + f.price, 0);
    const extraPricesTotal = extraOptions.filter(e => selectedExtras.includes(e.id)).reduce((s, e) => s + e.price, 0);
    const total = Math.round((basePrice + featPrices + extraPricesTotal) * 1.1);
    const selectedItems = [
      { featureId: svc?.id ?? serviceId, featureName: svc?.title ?? "", variantId: selectedPkg?.id ?? "", variantName: selectedPkg?.name ?? "", price: basePrice },
      ...featOpts.filter(f => selectedFeatures.includes(f.id)).map(f => ({
        featureId: f.id, featureName: f.label, variantId: "", variantName: "", price: f.price,
      })),
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
          notes: `Dịch vụ: ${svc?.title ?? ""} | Gói: ${selectedPkg?.name ?? ""} | PM: ${talent?.name ?? ""} | Bắt đầu: ${startDate} | Thời gian: ${duration}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "submission failed");
      setNewOrderId(data?.data?.orderNumber ?? data?.orderNumber ?? "");
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── i18n step labels ──────────────────────────────────────────────────
  const STEP_LABELS = [
    t("step0Short"), t("step1Short"), t("step2Short"), t("step3Short"),
    t("step4Short"), t("step5Short"), t("step6Short"), t("step7Short"),
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
                  {step === 1 && <StepPackage packages={packages} service={service} selected={pkgId} onSelect={setPkgId} />}
                  {step === 2 && <StepFeatures featureOptions={currentFeatureOptions} selected={selectedFeatures} onToggle={toggleFeature} />}
                  {step === 3 && <StepTalent talents={talents} selected={talentId} onSelect={setTalentId} />}
                  {step === 4 && <StepSchedule startDate={startDate} setStartDate={setStartDate} duration={duration} setDuration={setDuration} />}
                  {step === 5 && <StepExtras extraOptions={extraOptions} selected={selectedExtras} onToggle={toggleExtra} />}
                  {step === 6 && (
                    <StepReview
                      service={service} pkg={pkg} talent={talent}
                      featureOptions={currentFeatureOptions} features={selectedFeatures}
                      extraOptions={extraOptions} extras={selectedExtras}
                      startDate={startDate} duration={duration}
                    />
                  )}
                  {step === 7 && (
                    <StepPayment
                      lpBalance={lpBalance} maxLpRedeem={maxLpRedeem}
                      lpDiscount={lpDiscount} setLpDiscount={setLpDiscount} lpRate={lpRate}
                      name={name} setName={setName} email={email} setEmail={setEmail}
                      phone={phone} setPhone={setPhone} company={company} setCompany={setCompany}
                      submitted={submitted} orderId={newOrderId}
                      submitError={submitError} setSubmitError={setSubmitError}
                      onSubmit={handleSubmit} submitLoading={submitLoading}
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
                    <div style={{ color: DS.text4, fontSize: 12 }}>{step + 1} / 8</div>
                    {step < 7 && (
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
                  service={service} pkg={pkg}
                  featureOptions={currentFeatureOptions} features={selectedFeatures}
                  extraOptions={extraOptions} extras={selectedExtras}
                  lpDiscount={lpDiscount} lpBalance={lpBalance} lpRate={lpRate}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
