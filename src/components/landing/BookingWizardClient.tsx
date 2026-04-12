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
import { FeatureToggleTable } from "./FeatureToggleTable";
import {
  Globe, Code2, BarChart3, Target, Check, ArrowRight, ArrowLeft,
  Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye, Server,
} from "lucide-react";
import type { PricingConfig } from "@/lib/types/booking";

// ── Types ────────────────────────────────────────────────────────────────────

interface WizardService {
  id: string; title: string; desc: string;
  basePrice: number; color: string; perMonth?: boolean;
}
interface WizardPackage {
  id: string;
  slug?: string;
  name: string;
  /** deprecated — use .price instead */
  multiplier: number;
  color: string;
  desc: string; features: string[]; lp: number; popular?: boolean;
  /** Real price from DB */
  price?: number | null;
  priceText?: string;
  isSubscription?: boolean;
  billingPeriod?: string | null;
  type?: string;
  /** Market anchor price for strikethrough display */
  marketPrice?: number;
  /** Saving vs market price % */
  savingPct?: number;
}
interface WizardFeature {
  id: string; label: string; labelEn?: string; price: number;
  category: string; xpPoints?: number; tier?: string;
  categoryEn?: string; parentId?: string | null;
  /** true = bao gồm trong gói đã chọn → hiển thị "✓ Đã bao gồm" */
  includedInBase?: boolean;
  /** true = đây là phiên bản nâng cấp từ parent feature */
  isUpgradeable?: boolean;
  /** Plain-language Vietnamese description — non-tech customers */
  description: string;
  /** Short benefit (1 line) */
  benefit?: string;
}
interface WizardTalent {
  id: string; name: string; role: string; rank: string;
  rankColor: string; rankSymbol: string; img: string; specialty: string;
}
interface WizardExtra {
  id: string;
  slug?: string;
  label: string;
  price: number;
  desc?: string;
  icon?: string | null;
  type?: string;
  billingPeriod?: string | null;
  color?: string;
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

// ── Fallback constants (website-only, used when API fails) ────────────────────────

/** Base price — chỉ dùng trong fallback. Giá thực tế từ DB → SiteSetting */
const WEB_BASE_PRICE = 3_890_000;

/**
 * Website-only package fallback — hiển thị khi API /pricing/config fail.
 * Giá, nội dung, mô tả, khuyến mãi: SỬA TẠI DB → ServicePackage table + SiteSetting "website_pricing_config"
 * Admin truy cập: Admin → Settings → Site Settings
 */
const WEBSITE_PACKAGES_FALLBACK: WizardPackage[] = [
  {
    id: "basic", slug: "basic", name: "Cơ bản",
    multiplier: 1, color: DS.text3,
    desc: "Thiết kế chuẩn responsive, phù hợp website giới thiệu doanh nghiệp nhỏ",
    features: ["Giao diện chuẩn responsive", "Tối đa 5 trang", "SEO cơ bản", "Bảo hành 1 tháng", "Hỗ trợ qua email"],
    lp: 100,
    price: WEB_BASE_PRICE,
    marketPrice: 5_500_000,
    savingPct: 29,
  },
  {
    id: "business", slug: "business", name: "Doanh nghiệp",
    multiplier: 1, color: DS.blue,
    desc: "Thiết kế tùy chỉnh theo thương hiệu, tối ưu UX, doanh nghiệp vừa và lớn",
    features: ["Thiết kế tùy chỉnh theo brand", "Tối đa 15 trang", "SEO nâng cao", "Animation & Mega Menu", "Bảo hành 3 tháng", "Không giới hạn chỉnh sửa"],
    lp: 180, popular: true,
    price: 5_890_000,
    marketPrice: 8_900_000,
    savingPct: 34,
  },
  {
    id: "experience", slug: "experience", name: "Experience",
    multiplier: 1, color: DS.purple,
    desc: "Giao diện độc quyền NextJS, tối ưu tốc độ cao, thương hiệu cao cấp",
    features: ["Giao diện độc quyền NextJS", "Không giới hạn trang", "SEO toàn diện", "Dedicated PM riêng", "Bảo hành 6 tháng", "Support 24/7"],
    lp: 280,
    price: 6_890_000,
    marketPrice: 12_000_000,
    savingPct: 43,
  },
];

/** Website service — single service, only for page title/favicon. */
const WEBSITE_SERVICE: WizardService = {
  id: "web", title: "Thiết kế & Phát triển Website",
  desc: "Landing page, corporate site, e-commerce — chuẩn React/Next.js, tốc độ cao.",
  color: DS.blue, basePrice: WEB_BASE_PRICE,
};

/** Feature fallback — nếu API fail, chỉ hiện web features.
 * Mỗi feature có description cho khách hàng non-tech. */
const WEBSITE_FEATURES_FALLBACK: WizardFeature[] = [
  {
    id: "cms", label: "Tích hợp CMS", price: 5_000_000, category: "Nâng cao", xpPoints: 50, tier: "add-on",
    description: "CMS (Hệ thống Quản trị Nội dung) cho phép bạn tự thêm/sửa/xóa nội dung website mà không cần biết code. Bạn có thể tự viết bài, thay hình ảnh, cập nhật giá sản phẩm — tất cả chỉ cần vài click chuột. Không cần thuê dev mỗi khi cần chỉnh sửa nhỏ.",
    benefit: "Tự quản lý website không cần biết code",
  },
  {
    id: "i18n", label: "Đa ngôn ngữ (i18n)", price: 3_000_000, category: "Nâng cao", xpPoints: 30, tier: "add-on",
    description: "Website hiển thị đồng thời nhiều ngôn ngữ (Tiếng Việt, Tiếng Anh, Nhật, Hàn...). Khách hàng nước ngoài có thể đọc website bằng ngôn ngữ của họ. Người dùng tự chuyển ngôn ngữ bằng nút trên giao diện.",
    benefit: "Tiếp cận khách hàng quốc tế",
  },
  {
    id: "ecom", label: "E-commerce (Giỏ hàng & Thanh toán)", price: 12_000_000, category: "Nâng cao", xpPoints: 120, tier: "add-on",
    description: "Biến website thành cửa hàng online — khách có thể xem sản phẩm, cho vào giỏ, thanh toán trực tiếp bằng VNPay, MoMo, ZaloPay hoặc chuyển khoản. Tích hợp quản lý đơn hàng, kho hàng, mã giảm giá. Phù hợp bán hàng online, boutique, shop nhỏ.",
    benefit: "Bán hàng online ngay trên website",
  },
  {
    id: "blog", label: "Blog & Content Module", price: 2_500_000, category: "Nội dung", xpPoints: 25, tier: "add-on",
    description: "Trang tin tức riêng biệt trên website — bạn có thể viết bài chia sẻ, tin khuyến mãi, hướng dẫn sản phẩm. Mỗi bài viết đều được tối ưu SEO để khách hàng tìm thấy bạn trên Google. Không cần biết code để viết và đăng bài.",
    benefit: "Chia sẻ nội dung, thu hút khách tìm kiếm Google",
  },
  {
    id: "analytics", label: "Analytics Dashboard", price: 4_000_000, category: "Analytics", xpPoints: 40, tier: "add-on",
    description: "Bảng điều khiển thống kê riêng — xem lượt truy cập, khách đến từ đâu, trang nào được xem nhiều nhất, khách ở lại bao lâu. Dữ liệu được cập nhật real-time, giúp bạn hiểu hành vi khách hàng và đưa ra quyết định kinh doanh tốt hơn.",
    benefit: "Hiểu khách hàng qua dữ liệu thực tế",
  },
];

/** Extras fallback — nếu API fail. */
const WEBSITE_EXTRAS_FALLBACK: WizardExtra[] = [
  { id: "hosting",        label: "Hosting 1 năm",             price: 3_000_000, desc: "Hosting từ Starter → Enterprise — chọn gói phù hợp",    color: DS.purple },
  { id: "domain",         label: "Tên miền",                   price: 0,          desc: "Đăng ký .com .vn .com.vn — tra cứu & chọn TLD phù hợp", color: DS.cyan   },
  { id: "maintenance",    label: "Bảo trì & cập nhật 1 năm",   price: 5_000_000, desc: "Cập nhật plugin, backup hàng tuần",                        color: DS.green  },
  { id: "analytics-setup", label: "Setup Google Analytics 4",   price: 1_500_000, desc: "Track traffic & conversions",                               color: DS.amber  },
  { id: "training",      label: "Training đội ngũ",             price: 2_000_000, desc: "Training 1-1 với đội ngũ LOOP (3 buổi)",                   color: DS.teal   },
  { id: "priority",      label: "Priority Support",            price: 3_000_000, desc: "Priority support 24/7 trong 6 tháng đầu",                 color: DS.pink   },
  { id: "seo-basic",     label: "SEO cơ bản",                  price: 2_000_000, desc: "SEO foundation & Google submission",                          color: DS.gold   },
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
  service, selectedPackage,
  featureOptions, features, extras, extraOptions, lpDiscount, lpBalance, lpRate, vatRate,
  selectedHostingPlan, hostingPlans, domainPrices, domainName, domainPurchaseNow,
}: {
  service: WizardService | null;
  selectedPackage: WizardPackage | undefined;
  featureOptions: WizardFeature[]; features: string[];
  extraOptions: WizardExtra[]; extras: string[];
  lpDiscount: number; lpBalance: number; lpRate: LpRateConfig;
  vatRate?: number;
  selectedHostingPlan: string;
  hostingPlans: WizardHostingPlan[];
  domainPrices: WizardDomainPrice[];
  domainName: string;
  domainPurchaseNow: boolean;
}) {
  const [showBreakdown, setShowBreakdown] = useState(true);

  const PACKAGE_PRICES: Record<string, number> = {
    basic: WEB_BASE_PRICE,
    business: 5_890_000,
    experience: 6_890_000,
  };
  const basePrice = selectedPackage
    ? (selectedPackage.price ?? PACKAGE_PRICES[selectedPackage.id] ?? WEB_BASE_PRICE)
    : 0;
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
  const effectiveVatRate = vatRate ?? 0.10;
  const vatAmount = Math.round(totalBeforeVat * effectiveVatRate);
  const grandTotal = totalBeforeVat + vatAmount;
  const lpEarned = Math.floor(grandTotal / 1_000_000) * lpRate.lpEarnPerMillion;
  const VAT_PCT = (effectiveVatRate * 100).toFixed(0);
  const pkgColor = selectedPackage?.color ?? DS.blue;

  const hasAddons = featurePrices > 0 || extraPrices > 0 || hostingCost > 0 || domainCost > 0;

  // Max LP usable
  const maxLpDiscount = Math.round(subtotal * (lpRate.maxDiscountPercent / 100));
  const maxLpUsed = Math.min(lpBalance, Math.round(maxLpDiscount / lpRate.vndPerLp) * 1000);

  // ── Empty state teaser ───────────────────────────────────────────────────────
  if (!selectedPackage) {
    return (
      <div className="rounded-2xl sticky top-6">
        <div style={{
          background: "rgba(15,23,42,0.85)",
          border: `1px solid rgba(236,72,153,0.12)`,
          backdropFilter: "blur(20px)",
          borderRadius: 16,
          padding: 28,
        }}>
          {/* Glow accent */}
          <div style={{
            position: "absolute", top: -40, right: -40,
            width: 120, height: 120, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ color: DS.pink, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em", marginBottom: 10 }}>
            BÁO GIÁ ƯỚC TÍNH
          </div>
          <div style={{ color: DS.text2, fontFamily: DS.heading, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Chọn gói Website
          </div>
          <p style={{ color: DS.text4, fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
            Chọn một gói bên dưới để xem báo giá chi tiết, bao gồm LP thưởng và VAT.
          </p>

          {/* Mini price hints */}
          <div className="space-y-2">
            {[
              { name: "Cơ bản", price: WEB_BASE_PRICE, color: DS.text3 },
              { name: "Doanh nghiệp", price: 5_890_000, color: DS.blue },
              { name: "Experience", price: 6_890_000, color: DS.purple },
            ].map(p => (
              <div key={p.name}
                className="flex items-center justify-between p-2.5 rounded-xl"
                style={{ background: `${p.color}08`, border: `1px solid ${p.color}18` }}
              >
                <span style={{ color: DS.text3, fontSize: 12 }}>{p.name}</span>
                <span style={{ color: p.color, fontSize: 13, fontFamily: DS.mono, fontWeight: 600 }}>{fmtVND(p.price)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3 rounded-xl text-center" style={{ background: `${DS.pink}08`, border: `1px solid ${DS.pink}18` }}>
            <span style={{ color: DS.pink, fontSize: 11, fontFamily: DS.mono }}>
              ◈ Nhận 50–280 LP khi hoàn thành
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Main sidebar ────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl sticky top-6">
      <div style={{
        background: "rgba(10,15,30,0.92)",
        border: `1px solid ${pkgColor}30`,
        backdropFilter: "blur(24px)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: `0 0 40px ${pkgColor}12, 0 8px 32px rgba(0,0,0,0.5)`,
      }}>
        {/* ── Hero total ── */}
        <div style={{
          background: `linear-gradient(135deg, ${pkgColor}18 0%, rgba(15,23,42,0.95) 100%)`,
          borderBottom: `1px solid ${pkgColor}20`,
          padding: "24px 22px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Background glow */}
          <div style={{
            position: "absolute", top: -30, right: -30,
            width: 140, height: 140, borderRadius: "50%",
            background: `radial-gradient(circle, ${pkgColor}15 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          <div className="relative">
            <div style={{ color: pkgColor, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em", marginBottom: 4 }}>
              TỔNG GIÁ ƯỚC TÍNH
            </div>
            <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 34, fontWeight: 900, lineHeight: 1.1, marginBottom: 4 }}>
              {fmtVND(grandTotal)}
            </div>
            {service?.perMonth && (
              <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>/tháng</div>
            )}
          </div>
        </div>

        {/* ── Selected package card ── */}
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div
            className="p-3 rounded-xl"
            style={{
              background: `${pkgColor}0C`,
              border: `1px solid ${pkgColor}25`,
              boxShadow: `0 0 20px ${pkgColor}0A`,
            }}
          >
            {/* Color accent bar */}
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ background: pkgColor, boxShadow: `0 0 8px ${pkgColor}60` }} />
              <div>
                <div style={{ color: pkgColor, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.18em", marginBottom: 3 }}>
                  GÓI ĐÃ CHỌN
                </div>
                <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, fontFamily: DS.heading }}>
                  {selectedPackage.name}
                </div>
                {selectedPackage.marketPrice && selectedPackage.marketPrice > basePrice && (
                  <div style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>
                    ◈ Tiết kiệm {selectedPackage.savingPct ?? 0}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Breakdown toggle ── */}
        {hasAddons && (
          <div className="px-5 py-3" style={{ borderBottom: `1px solid ${DS.border}` }}>
            <button
              onClick={() => setShowBreakdown(v => !v)}
              className="w-full flex items-center justify-between"
            >
              <span style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>CHI TIẾT BÁO GIÁ</span>
              <span style={{
                color: DS.text4, fontSize: 16, transition: "transform 0.2s",
                transform: showBreakdown ? "rotate(180deg)" : "rotate(0deg)",
              }}>▾</span>
            </button>

            <AnimatePresence initial={false}>
              {showBreakdown && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="pt-3 space-y-2">
                    {featurePrices > 0 && (
                      <LineItem label={`Tính năng thêm (${features.length})`} value={featurePrices} color={DS.blue} />
                    )}
                    {extraPrices > 0 && (
                      <LineItem label={`Dịch vụ bổ sung (${extras.length})`} value={extraPrices} color={DS.cyan} />
                    )}
                    {hostingCost > 0 && (
                      <LineItem label={hosting?.name ?? "Hosting"} value={hostingCost} color={DS.amber} />
                    )}
                    {domainCost > 0 && (
                      <LineItem label={`Domain ${domainName}`} value={domainCost} color={DS.teal} />
                    )}
                    {subtotal > 0 && (
                      <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${DS.border}` }}>
                        <span style={{ color: DS.text3, fontSize: 12 }}>Tạm tính</span>
                        <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>{fmtVND(subtotal)}</span>
                      </div>
                    )}
                    {lpApplied.vndDiscount > 0 && (
                      <div
                        className="flex justify-between p-2 rounded-lg"
                        style={{ background: `${DS.purple}10`, border: `1px solid ${DS.purple}20` }}
                      >
                        <span style={{ color: DS.purple, fontSize: 12 }}>
                          ◈ Giảm LP ({lpApplied.lpUsed.toLocaleString()} LP)
                        </span>
                        <span style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono }}>
                          −{fmtVND(lpApplied.vndDiscount)}
                        </span>
                      </div>
                    )}
                    {effectiveVatRate > 0 && (
                      <div className="flex justify-between">
                        <span style={{ color: DS.text4, fontSize: 11 }}>(+ VAT {VAT_PCT}%)</span>
                        <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>+{fmtVND(vatAmount)}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── LP earned ── */}
        {lpEarned > 0 && (
          <div className="mx-4 mt-3 mb-3 p-4 rounded-xl" style={{
            background: `linear-gradient(135deg, ${DS.purple}12 0%, ${DS.pink}08 100%)`,
            border: `1px solid ${DS.purple}25`,
          }}>
            <div className="flex items-center gap-3">
              {/* Star icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${DS.purple}20` }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={DS.purple} stroke="none">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
              </div>
              <div>
                <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.12em", marginBottom: 2 }}>
                  LP THƯỞNG KHI HOÀN THÀNH
                </div>
                <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>
                  +{lpEarned.toLocaleString()} <span style={{ fontSize: 12, fontFamily: DS.mono, fontWeight: 400 }}>LP</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LP balance ── */}
        {lpBalance > 0 && (
          <div className="mx-4 mb-4 p-3 rounded-xl" style={{
            background: `${DS.blue}08`,
            border: `1px solid ${DS.blue}20`,
          }}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono }}>Số dư LP của bạn</span>
              <span style={{ color: DS.blue, fontSize: 14, fontFamily: DS.mono, fontWeight: 700 }}>{lpBalance.toLocaleString()} LP</span>
            </div>
            {/* Max LP usage bar */}
            <div style={{ height: 4, background: `${DS.blue}15`, borderRadius: 2, marginBottom: 6 }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, (maxLpUsed / lpBalance) * 100)}%`,
                  background: GRD.primary,
                  borderRadius: 2,
                }}
              />
            </div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
              Tối đa dùng: {maxLpUsed.toLocaleString()} LP → giảm {fmtVND(Math.round(maxLpUsed * lpRate.vndPerLp / 1000) * 1000)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helper: line item ──────────────────────────────────────────────────────────
function LineItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span style={{ color: DS.text3, fontSize: 12 }}>{label}</span>
      </div>
      <span style={{ color, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(value)}</span>
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
  // Package (for base price display)
  selectedPackage,
  basePrice,
}: {
  featureOptions: WizardFeature[]; selectedFeatures: string[]; onToggleFeature: (id: string) => void;
  extraOptions: WizardExtra[]; selectedExtras: string[]; onToggleExtra: (id: string) => void;
  hostingPlans: WizardHostingPlan[];
  selectedHostingPlan: string; onSelectHostingPlan: (slug: string) => void;
  domainPrices: WizardDomainPrice[];
  domainName: string; onSetDomainName: (name: string) => void;
  domainPurchaseNow: boolean; onSetDomainPurchaseNow: (now: boolean) => void;
  modal: AddonModalState; setModal: (s: AddonModalState) => void;
  selectedPackage?: WizardPackage;
  basePrice: number;
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
      {/* Header: selected package base price + quick summary */}
      <div className="mb-6 p-4 rounded-2xl" style={{
        background: selectedPackage
          ? `${selectedPackage.color}08`
          : "rgba(59,130,246,0.07)",
        border: selectedPackage
          ? `1px solid ${selectedPackage.color}25`
          : "1px solid rgba(59,130,246,0.18)",
      }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            {/* Selected package badge */}
            <div className="flex items-center gap-3 mb-3">
              {selectedPackage && (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold"
                  style={{
                    background: `${selectedPackage.color}20`,
                    color: selectedPackage.color,
                    border: `1px solid ${selectedPackage.color}40`,
                    letterSpacing: "0.1em",
                  }}>
                  {selectedPackage.name.toUpperCase()}
                </span>
              )}
              <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                WEBSITE TÙY CHỈNH
              </div>
            </div>

            {/* Base price prominently displayed — always visible */}
            <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 30, fontWeight: 900 }}>
              {fmtVND(basePrice)}
              <span style={{ color: DS.text4, fontSize: 13, fontFamily: DS.mono, fontWeight: 400, marginLeft: 8 }}>
                / trọn gói
              </span>
            </div>
          </div>

          {/* Included features badges — value stacking */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Responsive", color: DS.green },
              { label: "SSL", color: DS.green },
              { label: "SEO cơ bản", color: DS.green },
              { label: "Next.js", color: DS.blue },
              { label: "React", color: DS.blue },
            ].map(item => (
              <span key={item.label} className="px-2.5 py-1 rounded-lg text-xs font-mono"
                style={{
                  background: `${item.color}12`,
                  color: item.color,
                  border: `1px solid ${item.color}25`,
                }}>
                ✓ {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Add-on service cards (positioned ABOVE features — per spec) ─── */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div style={{ width: 3, height: 16, background: DS.pink, borderRadius: 2 }} />
          <h4 style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.12em" }}>
            DỊCH VỤ BỔ SUNG
          </h4>
          <div className="flex-1 h-px" style={{ background: DS.border }} />
          <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>Tùy chọn — click để thêm</span>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {extraOptions.map(ext => {
          const icons: Record<string, React.ReactNode> = {
            hosting: <Server size={20} />,
            domain: <Globe size={20} />,
            maintenance: <Shield size={20} />,
            "analytics-setup": <BarChart3 size={20} />,
            training: <Users size={20} />,
            priority: <Sparkles size={20} />,
            "seo-basic": <Target size={20} />,
          };
          const colors: Record<string, string> = {
            hosting: DS.purple,
            domain: DS.cyan,
            maintenance: DS.green,
            "analytics-setup": DS.amber,
            training: DS.teal,
            priority: DS.pink,
            "seo-basic": DS.gold,
          };
          const descriptions: Record<string, string> = {
            hosting: "Hosting từ Starter → Enterprise — chọn gói phù hợp nhu cầu",
            domain: "Đăng ký .com .vn .com.vn — tra cứu & chọn TLD phù hợp",
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
      </div>

      {/* ── Feature table (below add-ons — second priority in UI) ───────────── */}
      <div className="flex items-center gap-3 mb-4 mt-8">
        <div style={{ width: 3, height: 16, background: GRD.primary, borderRadius: 2 }} />
        <h4 style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.12em" }}>
          TÍNH NĂNG NÂNG CAO
        </h4>
        <div className="flex-1 h-px" style={{ background: DS.border }} />
        <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>Chọn thêm để tăng giá trị website</span>
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

// ── Step 1: Package Selection + Feature Toggle Table ───────────────────────────────────

/**
 * Phần 1: Chọn gói (3 cards đơn giản)
 * Phần 2: Khi chọn gói → FeatureToggleTable hiện bên dưới với
 *   - Included features: disabled (không bỏ được = giá không đổi)
 *   - Extra features: tích thêm → giá tăng
 *   - Mỗi feature có mô tả non-tech cho khách hàng
 */
function StepPackage({
  packages, service, selected, onSelect,
  featureOptions, selectedFeatures, onToggleFeature,
}: {
  packages: WizardPackage[];
  service: WizardService | null;
  selected: string;
  onSelect: (id: string) => void;
  featureOptions: WizardFeature[];
  selectedFeatures: string[];
  onToggleFeature: (id: string) => void;
}) {
  const FALLBACK_PRICE: Record<string, number> = {
    basic: WEB_BASE_PRICE, business: 5_890_000, experience: 6_890_000,
  };
  const FALLBACK_MARKET: Record<string, number> = {
    basic: 5_500_000, business: 8_900_000, experience: 12_000_000,
  };
  const pkgKey = (pkg: WizardPackage) => pkg.slug ?? pkg.id;
  const getPrice = (pkg: WizardPackage) =>
    pkg.price ?? FALLBACK_PRICE[pkgKey(pkg)] ?? WEB_BASE_PRICE;
  const getMarket = (pkg: WizardPackage) =>
    pkg.marketPrice ?? FALLBACK_MARKET[pkgKey(pkg)] ?? getPrice(pkg);

  // Features bao gồm trong gói đã chọn (cascade: mỗi gói thừa hưởng từ gói trước)
  const selectedPkg = packages.find(p => p.id === selected || p.slug === selected);
  const selectedPkgIdx = packages.findIndex(p => p.id === selected || p.slug === selected);
  const getAllFeatures = (pkg: WizardPackage) => {
    const idx = packages.findIndex(p => p.id === pkg.id || p.slug === pkg.slug);
    if (idx < 0) return pkg.features ?? [];
    let all: string[] = [];
    for (let i = 0; i <= idx; i++) {
      const p = packages[i]!;
      all = [...new Set([...all, ...(p.features ?? [])])];
    }
    return all;
  };
  // Maps feature IDs included in the selected package
  // pkg.features = feature NAME strings → match against featureOptions labels → get IDs
  const includedFeatureIds: string[] = selectedPkg
    ? featureOptions
        .filter(f => getAllFeatures(selectedPkg).includes(f.label))
        .map(f => f.id)
    : [];

  const handleToggle = (featureId: string) => {
    // Cannot deselect features that are included in the base package (price unchanged)
    if (includedFeatureIds.includes(featureId)) return;
    onToggleFeature(featureId);
  };

  const popularPkg = packages.find(p => p.popular);
  const getColor = (pkg: WizardPackage) => {
    const isPopular = pkg.popular || pkg.id === popularPkg?.id || pkg.slug === popularPkg?.slug;
    return pkg.color || (isPopular ? DS.blue : DS.text3);
  };

  return (
    <div>
      {/* ── Section header ── */}
      <div
        className="mb-6 p-6 rounded-2xl relative overflow-hidden"
        style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(236,72,153,0.15)" }}
      >
        <div style={{ position: "absolute", top: -80, right: -80, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div style={{ color: DS.pink, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.22em", marginBottom: 8 }}>
              WEBSITE TÙY CHỈNH
            </div>
            <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 30, fontWeight: 900, letterSpacing: "0.03em", marginBottom: 8 }}>
              Chọn gói Website phù hợp
            </h3>
            <p style={{ color: DS.text3, fontSize: 14, lineHeight: 1.7, maxWidth: 520 }}>
              Chọn gói, sau đó tùy chỉnh tính năng bên dưới — bỏ những thứ bạn không cần, thêm những thứ bạn cần. Mỗi tính năng đều có giải thích dễ hiểu.
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)" }}>
              {[["👨‍💻", "#6B3DF5"], ["👩‍🎨", "#EC4899"], ["👨‍💼", "#4F7DF3"]].map(([e, c], i) => (
                <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: c, border: "1.5px solid rgba(15,23,42,0.8)" }}>{e}</div>
              ))}
              <span style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>50+ dự án thực tế</span>
            </div>
            <div className="px-4 py-2 rounded-xl" style={{ background: "rgba(236,72,153,0.06)", border: "1px solid rgba(236,72,153,0.15)" }}>
              <span style={{ color: DS.pink, fontSize: 12, fontFamily: DS.mono }}>🔥 Còn 3 slot tháng này</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Step 1A: 3 Package cards (compact horizontal) ── */}
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {packages.map(pkg => {
          const price = getPrice(pkg);
          const market = getMarket(pkg);
          const saving = market - price;
          const savingPct = saving > 0 ? Math.round((saving / market) * 100) : 0;
          const color = getColor(pkg);
          const isSelected = selected === pkg.id || pkg.slug === selected;
          const isPopular = pkg.popular || pkg.id === popularPkg?.id || pkg.slug === popularPkg?.slug;

          return (
            <motion.button
              key={pkg.id}
              onClick={() => onSelect(pkg.id)}
              className="text-left relative overflow-hidden"
              style={{
                background: isSelected ? `${color}0C` : "rgba(15,23,42,0.7)",
                border: isSelected ? `2px solid ${color}60` : `1px solid ${DS.border}`,
                borderRadius: 16,
                padding: "18px 16px",
                cursor: "pointer",
                boxShadow: isSelected ? `0 0 24px ${color}18` : "none",
                transition: "all 0.2s",
              }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Popular / Selected badge */}
              {isPopular && !isSelected && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "2px", textAlign: "center", background: GRD.primary, fontSize: 8, color: "#fff", fontFamily: DS.mono, letterSpacing: "0.1em" }}>
                  ★ PHỔ BIẾN
                </div>
              )}
              {isSelected && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "2px", textAlign: "center", background: color, fontSize: 8, color: "#fff", fontFamily: DS.mono, letterSpacing: "0.1em" }}>
                  ✓ ĐÃ CHỌN
                </div>
              )}

              <div style={{ marginTop: isPopular || isSelected ? 14 : 0 }}>
                <div style={{ color, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.18em", marginBottom: 6 }}>
                  {pkg.name.toUpperCase()}
                </div>
                {saving > 0 && (
                  <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, textDecoration: "line-through", lineHeight: 1, marginBottom: 2 }}>
                    {fmtVND(market)}
                  </div>
                )}
                <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 28, fontWeight: 900, lineHeight: 1.1, marginBottom: 4 }}>
                  {fmtVND(price)}
                </div>
                {saving > 0 && (
                  <div className="inline-block mb-3 px-1.5 py-0.5 rounded text-[9px] font-bold"
                    style={{ background: "rgba(34,197,94,0.12)", color: DS.green, fontFamily: DS.mono }}>
                    −{savingPct}%
                  </div>
                )}
                <div style={{ color: DS.text3, fontSize: 11, lineHeight: 1.5, marginTop: 6 }}>{pkg.desc}</div>
                {pkg.features.length > 0 && (
                  <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
                    {pkg.features.slice(0, 3).map((feat, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "center", gap: 4, color: DS.text4, fontSize: 10, lineHeight: 1.4 }}>
                        <Check size={9} style={{ color: DS.green, flexShrink: 0 }} />
                        {feat}
                      </li>
                    ))}
                    {pkg.features.length > 3 && (
                      <li style={{ color: DS.text5, fontSize: 10 }}>+{pkg.features.length - 3} tính năng khác</li>
                    )}
                  </ul>
                )}
                <div style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, marginTop: 8 }}>
                  ◈ +{pkg.lp.toLocaleString()} LP
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── Step 1B: Feature Toggle Table (only when package selected) ── */}
      {selectedPkg && featureOptions.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <FeatureToggleTable
            allFeatures={featureOptions}
            selectedIds={selectedFeatures}
            includedIds={includedFeatureIds}
            onToggle={handleToggle}
            packageName={selectedPkg.name}
            packageColor={getColor(selectedPkg)}
          />
        </div>
      )}

      {/* ── Trust strip ── */}
      <div className="mt-5 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {[
          { icon: "🛡", text: "Bảo hành 1–6 tháng", color: DS.green },
          { icon: "📱", text: "Responsive mọi thiết bị", color: DS.blue },
          { icon: "🔒", text: "SSL miễn phí trọn đời", color: DS.purple },
          { icon: "⚡", text: "Code sạch, dễ mở rộng", color: DS.cyan },
        ].map(item => (
          <div key={item.text} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: `${item.color}15`, color: item.color }}>{item.icon}</div>
            <span style={{ color: DS.text3, fontSize: 12, lineHeight: 1.4 }}>{item.text}</span>
          </div>
        ))}
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
    hosting: <Server size={16} />, domain: <Globe size={16} />,
    maintenance: <Shield size={16} />, "analytics-setup": <BarChart3 size={16} />,
    training: <Users size={16} />, priority: <Sparkles size={16} />, "seo-basic": <Target size={16} />,
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

// ── Step Domain — Domain name picker with availability check ──────────────────

interface DomainCheckResult {
  available: boolean;
  invalid?: boolean;
  reserved?: boolean;
  blocked?: boolean;
  suggestions?: string[];
}

function StepDomain({
  domainName, setDomainName,
  domainPurchaseNow, setDomainPurchaseNow,
  domainPrices,
}: {
  domainName: string;
  setDomainName: (s: string) => void;
  domainPurchaseNow: boolean;
  setDomainPurchaseNow: (b: boolean) => void;
  domainPrices: WizardDomainPrice[];
}) {
  const t = useTranslations("BookingPage");

  // Parse existing selection: split into base + extension
  const initialExt = (() => {
    const found = domainPrices.find(d => domainName.toLowerCase().endsWith(d.extension));
    return found?.extension ?? domainPrices[0]?.extension ?? ".com";
  })();
  const initialBase = domainName && initialExt && domainName.toLowerCase().endsWith(initialExt)
    ? domainName.slice(0, -initialExt.length)
    : "";

  const [query, setQuery] = useState(initialBase);
  const [ext, setExt] = useState(initialExt);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<DomainCheckResult | null>(null);

  const fullDomain = query ? `${query}${ext}` : "";

  // Debounced availability check
  useEffect(() => {
    if (!query || query.length < 2) {
      setCheckResult(null);
      setChecking(false);
      return;
    }
    const dom = `${query}${ext}`.toLowerCase();
    setChecking(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/pricing/domain-check?domain=${encodeURIComponent(dom)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        setCheckResult((data?.data as DomainCheckResult) ?? null);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setCheckResult(null);
        }
      } finally {
        setChecking(false);
      }
    }, 450);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, ext]);

  const selectedPrice = domainPrices.find(d => d.extension === ext);
  const isConfirmed = domainPurchaseNow && domainName === fullDomain && fullDomain !== "";

  const confirmDomain = () => {
    if (checkResult?.available) {
      setDomainName(fullDomain);
      setDomainPurchaseNow(true);
    }
  };

  const skipDomain = () => {
    setDomainName("");
    setDomainPurchaseNow(false);
  };

  const pickSuggestion = (s: string) => {
    const m = s.match(/^([^.]+)(\..+)$/);
    if (m && m[1] && m[2]) {
      setQuery(m[1]);
      setExt(m[2]);
    }
  };

  const statusColor = checking
    ? DS.text4
    : checkResult?.available
      ? DS.green
      : checkResult
        ? DS.red
        : DS.text4;

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${DS.cyan}15` }}>
            <Globe size={18} style={{ color: DS.cyan }} />
          </div>
          <div>
            <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: "0.04em" }}>
              {t("domainStepTitle")}
            </h3>
            <p style={{ color: DS.text3, fontSize: 13, marginTop: 2 }}>{t("domainStepDesc")}</p>
          </div>
        </div>
      </div>

      {/* Search row */}
      <div className="mb-4 p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}` }}>
        <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.12em", display: "block", marginBottom: 8 }}>
          {t("domainInputLabel").toUpperCase()}
        </label>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={query}
            onChange={(e) =>
              setQuery(e.target.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            placeholder={t("domainQueryPlaceholder")}
            style={{
              flex: "1 1 200px",
              background: "rgba(10,15,30,0.7)",
              border: `1px solid ${DS.border}`,
              borderRadius: 10,
              padding: "11px 14px",
              color: DS.text,
              fontSize: 14,
              outline: "none",
              fontFamily: DS.mono,
            }}
          />
          <select
            value={ext}
            onChange={(e) => setExt(e.target.value)}
            style={{
              background: "rgba(10,15,30,0.7)",
              border: `1px solid ${DS.border}`,
              borderRadius: 10,
              padding: "11px 14px",
              color: DS.text,
              fontSize: 14,
              outline: "none",
              fontFamily: DS.mono,
              minWidth: 120,
            }}
          >
            {domainPrices.map((d) => (
              <option key={d.extension} value={d.extension}>{d.extension}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        {query && query.length >= 2 && (
          <div
            className="mt-3 p-3 rounded-lg flex items-center justify-between gap-3 flex-wrap"
            style={{
              background: checking
                ? "rgba(255,255,255,0.03)"
                : checkResult?.available
                  ? "rgba(34,197,94,0.08)"
                  : "rgba(239,68,68,0.08)",
              border: `1px solid ${checking ? DS.border : checkResult?.available ? `${DS.green}40` : `${DS.red}40`}`,
            }}
          >
            <div>
              <div style={{ color: DS.text, fontSize: 14, fontFamily: DS.mono, fontWeight: 700 }}>
                {fullDomain}
              </div>
              <div style={{ color: statusColor, fontSize: 12, fontFamily: DS.mono, marginTop: 2 }}>
                {checking
                  ? t("domainChecking")
                  : !checkResult
                    ? ""
                    : checkResult.invalid
                      ? `✗ ${t("domainInvalid")}`
                      : checkResult.reserved
                        ? `✗ ${t("domainReserved")}`
                        : checkResult.blocked
                          ? `✗ ${t("domainBlocked")}`
                          : checkResult.available
                            ? `✓ ${t("domainAvailable")}`
                            : `✗ ${t("domainTaken")}`}
              </div>
            </div>
            {checkResult?.available && selectedPrice && (
              <div style={{ color: DS.cyan, fontSize: 14, fontFamily: DS.mono, fontWeight: 700 }}>
                {fmtVND(selectedPrice.registrationPrice)}
              </div>
            )}
          </div>
        )}

        {/* Suggestions */}
        {!checking && checkResult && !checkResult.available && (checkResult.suggestions?.length ?? 0) > 0 && (
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>
              {t("domainSuggestions")}:
            </div>
            <div className="flex flex-wrap gap-2">
              {(checkResult.suggestions ?? []).map((s) => (
                <button
                  key={s}
                  onClick={() => pickSuggestion(s)}
                  style={{
                    background: `${DS.cyan}10`,
                    border: `1px solid ${DS.cyan}30`,
                    color: DS.cyan,
                    fontSize: 11,
                    fontFamily: DS.mono,
                    padding: "4px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Price table */}
      {domainPrices.length > 0 && (
        <div className="mb-5">
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.12em", marginBottom: 8 }}>
            {t("domainPriceList").toUpperCase()}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 8 }}>
            {domainPrices.map((d) => (
              <button
                key={d.extension}
                onClick={() => setExt(d.extension)}
                style={{
                  background: ext === d.extension ? `${DS.cyan}12` : "rgba(15,23,42,0.5)",
                  border: ext === d.extension ? `1.5px solid ${DS.cyan}50` : `1px solid ${DS.border}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ color: ext === d.extension ? DS.cyan : DS.text2, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>
                  {d.extension}
                </div>
                <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>
                  {fmtVND(d.registrationPrice)} / {d.periodVi}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={confirmDomain}
          disabled={!checkResult?.available || checking}
          style={{
            background: checkResult?.available && !checking ? GRD.primary : "rgba(255,255,255,0.05)",
            color: checkResult?.available && !checking ? "#fff" : DS.text4,
            fontSize: 13,
            fontWeight: 700,
            padding: "11px 20px",
            borderRadius: 10,
            border: "none",
            cursor: checkResult?.available && !checking ? "pointer" : "not-allowed",
            fontFamily: DS.mono,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Check size={14} />
          {isConfirmed ? t("domainSelected") : t("domainConfirm")}
        </button>
        <button
          onClick={skipDomain}
          style={{
            background: !domainPurchaseNow && !domainName ? `${DS.text4}15` : "rgba(15,23,42,0.6)",
            color: !domainPurchaseNow && !domainName ? DS.text2 : DS.text3,
            fontSize: 13,
            padding: "11px 20px",
            borderRadius: 10,
            border: `1px solid ${!domainPurchaseNow && !domainName ? `${DS.text3}40` : DS.border}`,
            cursor: "pointer",
            fontFamily: DS.mono,
          }}
        >
          {t("domainSkip")}
        </button>
      </div>

      {/* Current selection pill */}
      {(isConfirmed || (!domainPurchaseNow && !domainName)) && (
        <div className="mt-4 p-3 rounded-lg" style={{ background: `${DS.cyan}08`, border: `1px solid ${DS.cyan}20` }}>
          <span style={{ color: DS.cyan, fontSize: 12, fontFamily: DS.mono }}>
            {isConfirmed ? `◈ ${t("domainSelectedStatus")}: ${domainName}` : `◈ ${t("domainSkipStatus")}`}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Step 3 — Contact + Payment ─────────────────────────────────────────────────

type ContactStepMode = "contact" | "payment" | "review";

function StepContact({
  vatRate,
  lpBalance, maxLpRedeem, lpDiscount, setLpDiscount, lpRate,
  name, setName, email, setEmail, phone, setPhone, company, setCompany,
  startDate, setStartDate, duration, setDuration,
  talentNote, setTalentNote,
  paymentPlan, setPaymentPlan,
  service, features, extras,
  submitted, orderId, submitError, setSubmitError, onSubmit, submitLoading,
  onEditSelection,
  selectedPackage,
  featureOptions, selectedFeatures,
  extraOptions, selectedExtras,
  selectedHostingPlan, hostingPlans,
  domainPrices, domainName, domainPurchaseNow,
  mode = "review",
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
  selectedPackage?: WizardPackage;
  featureOptions?: WizardFeature[]; selectedFeatures?: string[];
  extraOptions?: WizardExtra[]; selectedExtras?: string[];
  selectedHostingPlan?: string; hostingPlans?: WizardHostingPlan[];
  domainPrices?: WizardDomainPrice[]; domainName?: string; domainPurchaseNow?: boolean;
  mode?: ContactStepMode;
}) {
  const showContact = mode === "contact" || mode === "review";
  const showPayment = mode === "payment" || mode === "review";
  const showSubmit = mode === "review";
  const showSidebar = mode === "review";
  const showOrderTags = mode === "review";
  const t = useTranslations("BookingPage");
  const [payMethod, setPayMethod] = useState("bank");

  const payMethods = [
    { id: "bank", label: t("bankTransfer"), color: "#2563EB" },
    { id: "vnpay", label: "VNPay QR", color: "#DC2626" },
    { id: "momo", label: "Momo", color: "#A855F7" },
  ];

  const durations = [
    { val: "2", label: "2 tuần" }, { val: "4", label: "1 tháng" },
    { val: "8", label: "2 tháng" }, { val: "12", label: "3 tháng" },
    { val: "24", label: "6 tháng" }, { val: "custom", label: t("custom") },
  ];

  // ── Billing calc ──────────────────────────────────────────────────────────
  const PACKAGE_PRICES: Record<string, number> = {
    basic: WEB_BASE_PRICE, business: 5_890_000, experience: 6_890_000,
  };
  const basePrice = selectedPackage
    ? (selectedPackage.price ?? PACKAGE_PRICES[selectedPackage.id] ?? WEB_BASE_PRICE)
    : 0;
  const featurePrices = (featureOptions ?? []).filter(f => (selectedFeatures ?? []).includes(f.id) && !f.includedInBase).reduce((s, f) => s + f.price, 0);
  const extraPrices = (extraOptions ?? []).filter(e => (selectedExtras ?? []).includes(e.id)).reduce((s, e) => s + e.price, 0);
  const hosting = (hostingPlans ?? []).find(h => h.slug === selectedHostingPlan);
  const hostingCost = hosting?.discountedPrice ?? 0;
  const domainCost = domainPurchaseNow && domainName
    ? ((domainPrices ?? []).find(d => domainName.endsWith(d.extension))?.registrationPrice ?? 0)
    : 0;
  const subtotal = basePrice + featurePrices + extraPrices + hostingCost + domainCost;
  const lpApplied = calcLpDiscount(subtotal, lpDiscount, lpBalance, lpRate);
  const totalBeforeVat = subtotal - lpApplied.vndDiscount;
  const effectiveVatRate = vatRate ?? 0.10;
  const vatAmount = Math.round(totalBeforeVat * effectiveVatRate);
  const grandTotal = totalBeforeVat + vatAmount;
  const depositPct = paymentPlan === "100" ? 0.95 : 0.50;
  const depositAmount = Math.round(grandTotal * depositPct);
  const lpEarned = Math.floor(grandTotal / 1_000_000) * lpRate.lpEarnPerMillion;
  const pkgColor = selectedPackage?.color ?? DS.pink;
  const VAT_PCT = (effectiveVatRate * 100).toFixed(0);

  // ── Error ───────────────────────────────────────────────────────────────
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

  // ── Success ─────────────────────────────────────────────────────────────
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
          <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 24, fontWeight: 900 }}>+{lpEarned.toLocaleString()} LP</div>
        </div>
      </motion.div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="mb-6 p-5 rounded-2xl" style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(236,72,153,0.15)" }}>
        <div style={{ color: DS.pink, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.22em", marginBottom: 8 }}>XÁC NHẬN ĐƠN HÀNG</div>
        <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 26, fontWeight: 900, letterSpacing: "0.04em", marginBottom: 6 }}>Thông tin thanh toán</h3>
        <p style={{ color: DS.text3, fontSize: 14, lineHeight: 1.7 }}>Điền thông tin để nhận báo giá chi tiết và đặt cọc bắt đầu dự án.</p>
      </div>

      {/* Single-column form layout */}

        {/* ── Left: form ── */}
        <div>
          {showOrderTags && (
          <div className="mb-5 p-4 rounded-xl flex items-center justify-between flex-wrap gap-3"
            style={{ background: "rgba(15,23,42,0.7)", border: `1px solid ${DS.border}` }}>
            <div className="flex flex-wrap gap-2">
              {service && (
                <span className="px-3 py-1.5 rounded-lg text-xs" style={{ background: `${service.color}15`, color: service.color, border: `1px solid ${service.color}30`, fontFamily: DS.mono, fontWeight: 600 }}>
                  {service.title}
                </span>
              )}
              {selectedPackage && (
                <span className="px-3 py-1.5 rounded-lg text-xs" style={{ background: `${pkgColor}15`, color: pkgColor, border: `1px solid ${pkgColor}30`, fontFamily: DS.mono, fontWeight: 600 }}>
                  {selectedPackage.name}
                </span>
              )}
              {(selectedFeatures?.length ?? 0) > 0 && (
                <span className="px-3 py-1.5 rounded-lg text-xs" style={{ background: `${DS.cyan}12`, color: DS.cyan, border: `1px solid ${DS.cyan}30`, fontFamily: DS.mono }}>
                  +{selectedFeatures?.length} tính năng
                </span>
              )}
              {(selectedExtras?.length ?? 0) > 0 && (
                <span className="px-3 py-1.5 rounded-lg text-xs" style={{ background: `${DS.purple}12`, color: DS.purple, border: `1px solid ${DS.purple}30`, fontFamily: DS.mono }}>
                  +{selectedExtras?.length} dịch vụ
                </span>
              )}
            </div>
            <button onClick={onEditSelection}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ color: DS.blue, background: `${DS.blue}10`, border: `1px solid ${DS.blue}30`, fontFamily: DS.mono, cursor: "pointer" }}>
              ← Sửa lựa chọn
            </button>
          </div>
          )}

          {showContact && (<>
          {/* Section: Contact */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${DS.pink}15` }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DS.pink} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <h4 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 16, fontWeight: 700, letterSpacing: "0.04em" }}>Thông tin liên hệ</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Họ và tên", value: name, set: setName, placeholder: "Nguyễn Văn A" },
                { label: "Email công ty", value: email, set: setEmail, placeholder: "name@company.vn" },
                { label: "Số điện thoại", value: phone, set: setPhone, placeholder: "0901 234 567" },
                { label: "Tên công ty", value: company, set: setCompany, placeholder: "Công ty ABC" },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                    style={{ width: "100%", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "11px 14px", color: DS.text, fontSize: 14, outline: "none", fontFamily: DS.body, boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Section: Schedule */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${DS.blue}15` }}>
                <Calendar size={14} style={{ color: DS.blue }} />
              </div>
              <h4 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 16, fontWeight: 700, letterSpacing: "0.04em" }}>Lịch trình</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>Ngày bắt đầu</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  style={{ width: "100%", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "11px 14px", color: DS.text, fontSize: 14, outline: "none", fontFamily: DS.body, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>Thời gian thực hiện</label>
                <div className="flex flex-wrap gap-2">
                  {durations.map(d => (
                    <button key={d.val} onClick={() => setDuration(d.val)}
                      style={{ padding: "7px 12px", borderRadius: 8, fontSize: 11, fontFamily: DS.mono, cursor: "pointer",
                        background: duration === d.val ? GRD.primary : "rgba(15,23,42,0.6)",
                        border: duration === d.val ? "none" : `1px solid ${DS.border}`,
                        color: duration === d.val ? "#fff" : DS.text3 }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${DS.purple}15` }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DS.purple} strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <h4 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 16, fontWeight: 700, letterSpacing: "0.04em" }}>Ghi chú thêm</h4>
            </div>
            <textarea value={talentNote} onChange={e => setTalentNote(e.target.value)}
              placeholder="Yêu cầu đặc biệt, thông tin bổ sung..."
              rows={3}
              style={{ width: "100%", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "11px 14px", color: DS.text, fontSize: 14, outline: "none", fontFamily: DS.body, boxSizing: "border-box", resize: "vertical" }} />
          </div>
          </>)}

          {showPayment && (
          /* Section: Payment */
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${DS.green}15` }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DS.green} strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <h4 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 16, fontWeight: 700, letterSpacing: "0.04em" }}>Phương thức thanh toán</h4>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button onClick={() => setPaymentPlan("50")}
                style={{ padding: "14px 16px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                  background: paymentPlan === "50" ? `${DS.blue}12` : "rgba(15,23,42,0.5)",
                  border: paymentPlan === "50" ? `1.5px solid ${DS.blue}60` : `1px solid ${DS.border}`,
                  color: paymentPlan === "50" ? DS.text : DS.text3 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${paymentPlan === "50" ? DS.blue : DS.text4}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {paymentPlan === "50" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: DS.blue }} />}
                  </div>
                  <span style={{ fontFamily: DS.mono, fontWeight: 700, fontSize: 13 }}>{t("paymentPlan50")}</span>
                </div>
                <div style={{ color: DS.text4, fontSize: 11, marginLeft: 24, lineHeight: 1.5 }}>{t("paymentPlan50Desc")}</div>
              </button>
              <button onClick={() => setPaymentPlan("100")}
                style={{ padding: "14px 16px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                  background: paymentPlan === "100" ? `${DS.green}12` : "rgba(15,23,42,0.5)",
                  border: paymentPlan === "100" ? `1.5px solid ${DS.green}60` : `1px solid ${DS.border}`,
                  color: paymentPlan === "100" ? DS.text : DS.text3 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${paymentPlan === "100" ? DS.green : DS.text4}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {paymentPlan === "100" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: DS.green }} />}
                  </div>
                  <span style={{ fontFamily: DS.mono, fontWeight: 700, fontSize: 13 }}>{t("paymentPlan100")}</span>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: `${DS.green}15`, color: DS.green, fontFamily: DS.mono }}>−5%</span>
                </div>
                <div style={{ color: DS.text4, fontSize: 11, marginLeft: 24, lineHeight: 1.5 }}>{t("paymentPlan100Desc")}</div>
              </button>
            </div>

            {/* Payment method */}
            <div className="mb-4">
              <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Hình thức chuyển khoản</label>
              <div className="flex gap-3 flex-wrap">
                {payMethods.map(m => (
                  <button key={m.id} onClick={() => setPayMethod(m.id)}
                    style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, cursor: "pointer",
                      background: payMethod === m.id ? `${m.color}15` : "rgba(15,23,42,0.5)",
                      border: payMethod === m.id ? `1.5px solid ${m.color}60` : `1px solid ${DS.border}`,
                      color: payMethod === m.id ? m.color : DS.text3,
                      display: "flex", alignItems: "center", gap: 8, fontFamily: DS.mono }}>
                    <span style={{ fontSize: 16 }}>{m.id === "bank" ? "🏦" : m.id === "vnpay" ? "📱" : "💜"}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* LP redemption */}
            {lpBalance > 0 && (
              <div className="mb-4 p-4 rounded-xl" style={{ background: `${DS.purple}08`, border: `1px solid ${DS.purple}20` }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 2 }}>◈ Sử dụng LP giảm giá</div>
                    <div style={{ color: DS.text4, fontSize: 10 }}>Số dư: {lpBalance.toLocaleString()} LP · Tối đa dùng: {maxLpRedeem.toLocaleString()} LP (20%)</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setLpDiscount(Math.max(0, lpDiscount - 1000))}
                    style={{ width: 28, height: 28, borderRadius: 7, background: `${DS.purple}15`, border: `1px solid ${DS.purple}30`, color: DS.purple, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Minus size={12} />
                  </button>
                  <div style={{ color: DS.purple, fontFamily: DS.mono, fontSize: 15, fontWeight: 700, minWidth: 80, textAlign: "center" }}>
                    {lpDiscount.toLocaleString()} LP
                  </div>
                  <button onClick={() => setLpDiscount(Math.min(maxLpRedeem, lpDiscount + 1000))}
                    style={{ width: 28, height: 28, borderRadius: 7, background: `${DS.purple}15`, border: `1px solid ${DS.purple}30`, color: DS.purple, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
          )}

          {showSubmit && (<>
          {/* Submit */}
          <button onClick={onSubmit} disabled={!name || !email || !phone || submitLoading}
            style={{
              background: (name && email && phone && !submitLoading) ? GRD.primary : "rgba(255,255,255,0.05)",
              color: (name && email && phone && !submitLoading) ? "#fff" : DS.text4,
              fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 14, border: "none",
              cursor: (name && email && phone && !submitLoading) ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: 10, justifyContent: "center",
              boxShadow: (name && email && phone && !submitLoading) ? "0 0 30px rgba(129,140,248,0.4)" : "none",
              transition: "all 0.3s", width: "100%",
            }}>
            <Shield size={16} />
            {submitLoading ? t("submitting") : t("submitButton")}
            {!submitLoading && <ArrowRight size={15} />}
          </button>
          <div style={{ color: DS.text5, fontSize: 11, marginTop: 10, textAlign: "center" }}>
            {paymentPlan === "100" ? "Thanh toán 100% ngay — giảm 5%." : t("depositNote")}
          </div>
          </>)}
        </div>

        {showSidebar && (
        /* ── Right: billing summary (sticky) ── */
        <div>
          <div style={{
            background: "rgba(10,15,30,0.95)",
            border: `1px solid ${pkgColor}30`,
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: `0 0 40px ${pkgColor}10, 0 8px 32px rgba(0,0,0,0.5)`,
            position: "sticky",
            top: 24,
          }}>
            {/* Hero header */}
            <div style={{
              background: `linear-gradient(135deg, ${pkgColor}15 0%, rgba(15,23,42,0.95) 100%)`,
              borderBottom: `1px solid ${pkgColor}20`,
              padding: "20px 20px 16px",
            }}>
              <div style={{ color: pkgColor, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em", marginBottom: 4 }}>HÓA ĐƠN DỰ KIẾN</div>
              <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>
                {fmtVND(grandTotal)}
              </div>
              {effectiveVatRate > 0 && (
                <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>(đã bao gồm VAT {VAT_PCT}%)</div>
              )}
            </div>

            {/* Line items */}
            <div className="p-5 space-y-3">
              {selectedPackage && (
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: `${pkgColor}08`, border: `1px solid ${pkgColor}20` }}>
                  <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ background: pkgColor, marginTop: 2 }} />
                  <div>
                    <div style={{ color: pkgColor, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 2 }}>GÓI {selectedPackage.name.toUpperCase()}</div>
                    <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{selectedPackage.name}</div>
                    {selectedPackage.marketPrice && selectedPackage.marketPrice > basePrice && (
                      <div style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>◈ Tiết kiệm {selectedPackage.savingPct ?? 0}%</div>
                    )}
                  </div>
                  <div style={{ color: DS.text, fontSize: 13, fontFamily: DS.mono, fontWeight: 600, marginLeft: "auto", flexShrink: 0 }}>
                    {fmtVND(basePrice)}
                  </div>
                </div>
              )}
              {featurePrices > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: DS.blue }} />
                    <span style={{ color: DS.text3, fontSize: 12 }}>Tính năng thêm ({selectedFeatures?.length ?? 0})</span>
                  </div>
                  <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(featurePrices)}</span>
                </div>
              )}
              {extraPrices > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: DS.purple }} />
                    <span style={{ color: DS.text3, fontSize: 12 }}>Dịch vụ bổ sung ({selectedExtras?.length ?? 0})</span>
                  </div>
                  <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(extraPrices)}</span>
                </div>
              )}
              {hostingCost > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: DS.amber }} />
                    <span style={{ color: DS.text3, fontSize: 12 }}>{hosting?.name}</span>
                  </div>
                  <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(hostingCost)}</span>
                </div>
              )}
              {domainCost > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: DS.teal }} />
                    <span style={{ color: DS.text3, fontSize: 12 }}>Domain {domainName}</span>
                  </div>
                  <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(domainCost)}</span>
                </div>
              )}
              {subtotal > 0 && (
                <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${DS.border}` }}>
                  <span style={{ color: DS.text3, fontSize: 12 }}>Tạm tính</span>
                  <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono, fontWeight: 600 }}>{fmtVND(subtotal)}</span>
                </div>
              )}
              {lpApplied.vndDiscount > 0 && (
                <div className="flex justify-between items-center p-2 rounded-lg" style={{ background: `${DS.purple}10`, border: `1px solid ${DS.purple}20` }}>
                  <span style={{ color: DS.purple, fontSize: 12 }}>◈ Giảm LP ({lpApplied.lpUsed.toLocaleString()} LP)</span>
                  <span style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono }}>−{fmtVND(lpApplied.vndDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${DS.border}` }}>
                <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>Thành tiền</span>
                <span style={{ color: pkgColor, fontSize: 15, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(grandTotal)}</span>
              </div>
            </div>

            {/* Deposit */}
            <div style={{ margin: "0 20px 20px", padding: "14px 16px", borderRadius: 14, background: `linear-gradient(135deg, ${pkgColor}12 0%, rgba(15,23,42,0.8) 100%)`, border: `1px solid ${pkgColor}25` }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div style={{ color: DS.text, fontSize: 11, fontFamily: DS.mono, fontWeight: 700, marginBottom: 2 }}>
                    {paymentPlan === "100" ? "Thanh toán ngay" : "Đặt cọc"}
                  </div>
                  <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>
                    {paymentPlan === "100" ? "Giảm 5% giá trị" : `${Math.round(Number(paymentPlan) / 2)}% giá trị hợp đồng`}
                  </div>
                </div>
                <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900 }}>
                  {fmtVND(depositAmount)}
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: `${pkgColor}20`, marginBottom: 10 }}>
                <div style={{ height: "100%", width: `${(depositPct * 100)}%`, background: GRD.primary, borderRadius: 2 }} />
              </div>
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                {paymentPlan === "100" ? "Phần còn lại: 0đ" : `Phần còn lại: ${fmtVND(grandTotal - depositAmount)}`}
              </div>
            </div>

            {/* LP earned */}
            {lpEarned > 0 && (
              <div style={{ margin: "0 20px 20px", padding: "12px 14px", borderRadius: 12, background: `linear-gradient(135deg, ${DS.purple}12 0%, ${DS.pink}06 100%)`, border: `1px solid ${DS.purple}25` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${DS.purple}20` }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={DS.purple} stroke="none">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: DS.purple, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 2 }}>LP THƯỞNG KHI HOÀN THÀNH</div>
                    <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 18, fontWeight: 700 }}>
                      +{lpEarned.toLocaleString()} <span style={{ fontSize: 10, fontFamily: DS.mono, fontWeight: 400 }}>LP</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
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
  // Package selection (website-only — packages are the primary selection)
  const [selectedPackage, setSelectedPackage] = useState<string>("business"); // default to decoy
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

  // ── Wizard config (from BE) ─────────────────────────────────────────────────────
  // Packages, features, addons, hosting, domain → loaded from /api/pricing/config
  const [packages, setPackages] = useState<WizardPackage[]>(WEBSITE_PACKAGES_FALLBACK);
  const [featureOptions, setFeatureOptions] = useState<Record<string, WizardFeature[]>>({
    web: WEBSITE_FEATURES_FALLBACK,
  });
  const [extraOptions, setExtraOptions] = useState<WizardExtra[]>(WEBSITE_EXTRAS_FALLBACK);
  const [hostingPlans, setHostingPlans] = useState<WizardHostingPlan[]>([]);
  const [domainPrices, setDomainPrices] = useState<WizardDomainPrice[]>([]);
  const [selectedHostingPlan, setSelectedHostingPlan] = useState<string>("");
  const [domainName, setDomainName] = useState("");
  const [domainPurchaseNow, setDomainPurchaseNow] = useState(true);
  const [lpRate, setLpRate] = useState<LpRateConfig>(DEFAULT_LP_RATE);
  const [vatRate, setVatRate] = useState(0.10);
  const [maxLpRedeem, setMaxLpRedeem] = useState(0);

  // LP balance — fetched from /api/pricing/config?email= when customer enters email
  const [lpBalance, setLpBalance] = useState(0);

  // Filtered feature options — always "web" since website-only
  const currentFeatureOptions: WizardFeature[] = featureOptions["web"] ?? [];

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pricing/config?lang=${locale}${email ? `&email=${encodeURIComponent(email)}` : ""}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled || !json?.data) return;
        const cfg: PricingConfig = json.data;

        // ── Packages: chỉ lấy type="web" (loại bỏ app/dashboard/SEO) ──
        if (cfg.packages?.length) {
          const webPkgs = cfg.packages.filter((p: WizardPackage) =>
            !p.type || p.type === "web" || p.type === "custom_web"
          );
          // Merge popular flag từ DB (hoặc hardcode "business" là popular mặc định)
          const withPopular = webPkgs.map((p: WizardPackage) => ({
            ...p,
            popular: p.popular ?? (p.slug === "business"),
          }));
          if (withPopular.length > 0) setPackages(withPopular);
        }

        // ── Features: nhóm theo category ──
        if (cfg.features?.length) {
          const grouped: Record<string, WizardFeature[]> = {};
          for (const f of cfg.features) {
            const cat = f.category || "Nâng cao";
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat]!.push(f);
          }
          if (Object.keys(grouped).length) setFeatureOptions(grouped);
        }

        // ── Addons ──
        if (cfg.addons?.length) setExtraOptions(cfg.addons);

        // ── Hosting + Domain ──
        if (cfg.hostingPlans?.length) setHostingPlans(cfg.hostingPlans);
        if (cfg.domainPrices?.length) setDomainPrices(cfg.domainPrices);

        // ── Rates ──
        if (cfg.lpRate) setLpRate(cfg.lpRate);
        if (cfg.vatRate !== undefined) setVatRate(cfg.vatRate);

        // ── Customer LP balance (if email provided) ──
        if (email && cfg.customerLp) {
          setLpBalance(cfg.customerLp.balance ?? 0);
        }
      })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, [locale, email]);

  // ── Derived values ────────────────────────────────────────────────────
  const service = WEBSITE_SERVICE;
  const selectedPkg = packages.find(p => p.id === selectedPackage);

  // Base price: use pkg.price from DB, fallback WEB_BASE_PRICE
  const currentBasePrice = selectedPkg
    ? (selectedPkg.price ?? selectedPkg.marketPrice ?? WEB_BASE_PRICE)
    : 0;

  // Filter: only count non-included features for price
  const extraFeaturePrice = currentFeatureOptions
    .filter(f => selectedFeatures.includes(f.id) && !f.includedInBase)
    .reduce((s, f) => s + f.price, 0);
  const currentExtraPrice = extraOptions.filter(e => selectedExtras.includes(e.id)).reduce((s, e) => s + e.price, 0);
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

  // 6-step flow:
  // 0 = Package + Features
  // 1 = Domain
  // 2 = Hosting + Add-ons
  // 3 = Contact info
  // 4 = Payment
  // 5 = Review + Submit
  const TOTAL_STEPS = 6;
  const canNext = () => {
    if (step === 0) return !!selectedPackage;          // package required
    if (step === 1) return true;                        // domain optional
    if (step === 2) return true;                        // hosting + addons optional
    if (step === 3) return !!name && !!email && !!phone; // contact required
    if (step === 4) return true;                        // payment defaults valid
    return true;                                        // review
  };
  const goNext = () => { if (canNext() && step < TOTAL_STEPS - 1) setStep(step + 1); };
  const goBack = () => { if (step > 0) setStep(step - 1); };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const svc = service;
    const pkg = packages.find(p => p.id === selectedPackage);
    const featOpts = currentFeatureOptions;
    // Base price = WEB_BASE_PRICE × package multiplier (all = 1 for now)
    // Fixed package prices — not derived from multiplier
    const PACKAGE_PRICES_SUBMIT: Record<string, number> = {
      basic: WEB_BASE_PRICE,
      business: 5_890_000,
      experience: 6_890_000,
    };
    const basePrice = pkg ? (PACKAGE_PRICES_SUBMIT[pkg.id] ?? WEB_BASE_PRICE) : WEB_BASE_PRICE;
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
    const paidFeatureItems = featOpts
      .filter(f => selectedFeatures.includes(f.id) && !f.includedInBase)
      .map(f => ({
        featureId: f.id, featureName: f.label, variantId: "", variantName: "", price: f.price,
      }));
    const selectedItems = [
      {
        featureId: pkg?.id ?? selectedPackage,
        featureName: `${svc?.title ?? "Website"} — ${pkg?.name ?? "Basic"}`,
        variantId: "",
        variantName: "Custom",
        price: basePrice,
      },
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

  // ── i18n step labels (6-step wizard) ──────────────────────────────────
  const STEP_LABELS = [
    t("bookingPackage"),  // Step 0: Package + Features
    t("bookingDomain"),   // Step 1: Domain
    t("bookingHosting"),  // Step 2: Hosting + Add-ons
    t("bookingContact"),  // Step 3: Contact info
    t("bookingPayment"),  // Step 4: Payment
    t("bookingReview"),   // Step 5: Review + Submit
  ];

  // ── All-in-one layout: single column ─────────────────────────────────────────

  // Compute prices for the top summary bar
  const featTotalForDisplay = currentFeatureOptions
    .filter(f => selectedFeatures.includes(f.id) && !f.includedInBase)
    .reduce((s, f) => s + f.price, 0);
  const extraTotalForDisplay = extraOptions.filter(e => selectedExtras.includes(e.id)).reduce((s, e) => s + e.price, 0);
  const hostingTotal = selectedHosting?.discountedPrice ?? 0;
  const domainTotal = domainPurchaseNow && domainName
    ? (domainPrices.find(d => domainName.endsWith(d.extension))?.registrationPrice ?? 0) : 0;
  const subtotalForDisplay = currentBasePrice + featTotalForDisplay + extraTotalForDisplay + hostingTotal + domainTotal;
  const lpDisc = calcLpDiscount(subtotalForDisplay, lpDiscount, lpBalance, lpRate);
  const vatAmt = Math.round((subtotalForDisplay - lpDisc.vndDiscount) * vatRate);
  const grandForDisplay = subtotalForDisplay - lpDisc.vndDiscount + vatAmt;
  const lpEarnedDisplay = Math.floor(grandForDisplay / 1_000_000) * lpRate.lpEarnPerMillion;
  const pkgColor = selectedPkg?.color ?? DS.blue;

  // ── Inline package selector ──────────────────────────────────────────────────
  const getPkgPrice = (pkg: WizardPackage) => pkg.price ?? pkg.marketPrice ?? WEB_BASE_PRICE;

  const pkgCards = packages.map(pkg => {
    const price = getPkgPrice(pkg);
    const market = pkg.marketPrice ?? price;
    const saving = market - price;
    const savingPct = saving > 0 ? Math.round((saving / market) * 100) : 0;
    const isSelected = selectedPackage === pkg.id;
    const color = pkg.color || DS.blue;
    return { pkg, price, market, saving, savingPct, isSelected, color };
  });

  // ── Feature categorisation (for FeatureToggleTable includedIds) ─────────────────
  const baseFeatures = currentFeatureOptions.filter(f => f.includedInBase);

  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* Hero — compact */}
      <section style={{ background: GRD.hero, padding: "28px 0 0" }}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)" }}>
            <Sparkles size={10} style={{ color: DS.blue }} />
            <span style={{ color: DS.blue, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.22em" }}>{t("badge")}</span>
          </div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 34, fontWeight: 900, letterSpacing: "0.06em", background: GRD.heroText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>
            {t("heroTitle")}
          </h1>
          <p style={{ color: DS.text3, fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{t("heroDesc")}</p>
        </div>
        <ProgressBar step={step} stepLabels={STEP_LABELS} />
      </section>

      {/* ── Main content: single column ───────────────────────────────────────── */}
      <section style={{ padding: "24px 0 64px" }}>
        <div className="max-w-5xl mx-auto px-6">

          {/* ── SECTION 1: Price summary bar (always visible) ── */}
          <div style={{
            background: "rgba(10,15,30,0.92)",
            border: `1px solid ${pkgColor}30`,
            borderRadius: 20,
            padding: "20px 24px",
            marginBottom: 28,
            position: "relative",
            overflow: "hidden",
            boxShadow: `0 0 40px ${pkgColor}10`,
          }}>
            {/* Glow */}
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${pkgColor}12 0%, transparent 70%)`, pointerEvents: "none" }} />

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Left: package badge + total */}
              <div>
                <div style={{ color: pkgColor, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.2em", marginBottom: 4 }}>
                  {selectedPkg ? "GÓI ĐÃ CHỌN" : "CHỌN GÓI WEBSITE"}
                </div>
                {selectedPkg ? (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                    <span style={{ color: DS.text, fontFamily: DS.heading, fontSize: 32, fontWeight: 900 }}>{fmtVND(grandForDisplay)}</span>
                    <span style={{ color: pkgColor, fontSize: 13, fontFamily: DS.mono }}>{selectedPkg.name}</span>
                    {selectedPkg.savingPct && selectedPkg.savingPct > 0 && (
                      <span style={{ background: "rgba(34,197,94,0.12)", color: DS.green, fontSize: 11, fontFamily: DS.mono, padding: "2px 8px", borderRadius: 6 }}>−{selectedPkg.savingPct}%</span>
                    )}
                  </div>
                ) : (
                  <div style={{ color: DS.text4, fontSize: 15 }}>Chọn gói bên dưới để xem báo giá</div>
                )}
              </div>

              {/* Right: price breakdown chips */}
              {selectedPkg && (
                <div className="flex flex-wrap gap-2">
                  {currentBasePrice > 0 && (
                    <div style={{ background: `${pkgColor}10`, border: `1px solid ${pkgColor}25`, borderRadius: 8, padding: "4px 12px" }}>
                      <span style={{ color: pkgColor, fontSize: 12, fontFamily: DS.mono }}>Gói: {fmtVND(currentBasePrice)}</span>
                    </div>
                  )}
                  {featTotalForDisplay > 0 && (
                    <div style={{ background: `${DS.blue}10`, border: `1px solid ${DS.blue}25`, borderRadius: 8, padding: "4px 12px" }}>
                      <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>+Tính năng: {fmtVND(featTotalForDisplay)}</span>
                    </div>
                  )}
                  {extraTotalForDisplay > 0 && (
                    <div style={{ background: `${DS.purple}10`, border: `1px solid ${DS.purple}25`, borderRadius: 8, padding: "4px 12px" }}>
                      <span style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono }}>+Dịch vụ: {fmtVND(extraTotalForDisplay)}</span>
                    </div>
                  )}
                  {hostingTotal > 0 && (
                    <div style={{ background: `${DS.amber}10`, border: `1px solid ${DS.amber}25`, borderRadius: 8, padding: "4px 12px" }}>
                      <span style={{ color: DS.amber, fontSize: 12, fontFamily: DS.mono }}>+Hosting: {fmtVND(hostingTotal)}</span>
                    </div>
                  )}
                  {domainTotal > 0 && (
                    <div style={{ background: `${DS.cyan}10`, border: `1px solid ${DS.cyan}25`, borderRadius: 8, padding: "4px 12px" }}>
                      <span style={{ color: DS.cyan, fontSize: 12, fontFamily: DS.mono }}>+Domain: {fmtVND(domainTotal)}</span>
                    </div>
                  )}
                  {vatAmt > 0 && (
                    <div style={{ background: "rgba(148,163,184,0.08)", border: `1px solid rgba(148,163,184,0.2)`, borderRadius: 8, padding: "4px 12px" }}>
                      <span style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>+VAT: {fmtVND(vatAmt)}</span>
                    </div>
                  )}
                  {lpDisc.vndDiscount > 0 && (
                    <div style={{ background: `${DS.purple}10`, border: `1px solid ${DS.purple}30`, borderRadius: 8, padding: "4px 12px" }}>
                      <span style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono }}>−LP: {fmtVND(lpDisc.vndDiscount)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* LP earned */}
            {lpEarnedDisplay > 0 && (
              <div className="relative mt-4 flex items-center gap-3" style={{ padding: "10px 14px", background: `linear-gradient(135deg, ${DS.purple}10, ${DS.pink}05)`, borderRadius: 12, border: `1px solid ${DS.purple}20` }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={DS.purple} stroke="none">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
                <span style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono }}>
                  Nhận <strong>+{lpEarnedDisplay.toLocaleString()} LP</strong> khi hoàn thành dự án
                </span>
              </div>
            )}
          </div>

          {/* ── STEP 0: Package cards ── */}
          {step === 0 && (
          <div style={{ marginBottom: 32 }}>
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 3, height: 16, background: DS.pink, borderRadius: 2 }} />
              <h3 style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.14em" }}>
                CHỌN GÓI WEBSITE
              </h3>
              <div style={{ flex: 1, height: 1, background: DS.border }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              {pkgCards.map(({ pkg, price, market, saving, savingPct, isSelected, color }) => (
                <motion.button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className="text-left"
                  style={{
                    background: isSelected ? `${color}0C` : "rgba(15,23,42,0.6)",
                    border: isSelected ? `2px solid ${color}60` : `1px solid ${DS.border}`,
                    borderRadius: 16,
                    padding: "20px 18px",
                    cursor: "pointer",
                    boxShadow: isSelected ? `0 0 24px ${color}18` : "none",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.2s",
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  {pkg.popular && !isSelected && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "3px", textAlign: "center", background: GRD.primary, fontSize: 8, color: "#fff", fontFamily: DS.mono, letterSpacing: "0.1em" }}>
                      ★ PHỔ BIẾN
                    </div>
                  )}
                  {isSelected && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "3px", textAlign: "center", background: color, fontSize: 8, color: "#fff", fontFamily: DS.mono, letterSpacing: "0.1em" }}>
                      ✓ ĐÃ CHỌN
                    </div>
                  )}
                  <div style={{ marginTop: pkg.popular || isSelected ? 16 : 0 }}>
                    <div style={{ color: color, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.18em", marginBottom: 6 }}>
                      {pkg.name.toUpperCase()}
                    </div>
                    {saving > 0 && (
                      <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, textDecoration: "line-through", marginBottom: 2 }}>
                        {fmtVND(market)}
                      </div>
                    )}
                    <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 26, fontWeight: 900, lineHeight: 1.1, marginBottom: 4 }}>
                      {fmtVND(price)}
                    </div>
                    {saving > 0 && (
                      <div style={{ display: "inline-block", background: "rgba(34,197,94,0.12)", color: DS.green, fontSize: 9, fontFamily: DS.mono, padding: "1px 6px", borderRadius: 4, marginBottom: 6 }}>
                        −{savingPct}%
                      </div>
                    )}
                    <div style={{ color: DS.text3, fontSize: 11, lineHeight: 1.5, marginTop: 8 }}>{pkg.desc}</div>
                    {pkg.features.length > 0 && (
                      <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
                        {pkg.features.slice(0, 3).map((feat, i) => (
                          <li key={i} style={{ display: "flex", alignItems: "center", gap: 5, color: DS.text3, fontSize: 10, lineHeight: 1.4 }}>
                            <Check size={9} style={{ color: DS.green, flexShrink: 0 }} />
                            {feat}
                          </li>
                        ))}
                        {pkg.features.length > 3 && (
                          <li style={{ color: DS.text4, fontSize: 10 }}>+{pkg.features.length - 3} tính năng khác</li>
                        )}
                      </ul>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
          )}

          {/* ── STEP 0: Feature Toggle Table ── */}
          {step === 0 && selectedPackage && currentFeatureOptions.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <FeatureToggleTable
                allFeatures={currentFeatureOptions}
                selectedIds={selectedFeatures}
                includedIds={baseFeatures.map(f => f.id)}
                onToggle={toggleFeature}
                packageName={selectedPkg?.name}
                packageColor={pkgColor}
              />
            </div>
          )}

          {/* ── STEP 1: Domain (with availability check) ── */}
          {step === 1 && selectedPackage && (
            <div style={{ marginBottom: 32 }}>
              <StepDomain
                domainName={domainName}
                setDomainName={setDomainName}
                domainPurchaseNow={domainPurchaseNow}
                setDomainPurchaseNow={setDomainPurchaseNow}
                domainPrices={domainPrices}
              />
            </div>
          )}

          {/* ── STEP 2: Hosting ── */}
          {step === 2 && selectedPackage && hostingPlans.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="flex items-center gap-3 mb-4">
                <div style={{ width: 3, height: 16, background: DS.purple, borderRadius: 2 }} />
                <h3 style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.14em" }}>
                  HOSTING
                </h3>
                <div style={{ flex: 1, height: 1, background: DS.border }} />
                <button
                  onClick={() => setModal({ type: "hosting", isOpen: true })}
                  style={{ background: "none", border: `1px solid ${DS.pink}40`, cursor: "pointer", color: DS.pink, fontSize: 11, fontFamily: DS.mono, padding: "2px 6px", borderRadius: 4 }}
                >
                  So sánh →
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {hostingPlans.map(plan => {
                  const isSelected = selectedExtras.includes("hosting") && selectedHostingPlan === plan.slug;
                  const hasDiscount = plan.discountPct > 0;
                  return (
                    <motion.button key={plan.slug} onClick={() => {
                      if (isSelected) { setSelectedHostingPlan(""); }
                      else { setSelectedHostingPlan(plan.slug); if (!selectedExtras.includes("hosting")) toggleExtra("hosting"); setModal({ type: "hosting", isOpen: true }); }
                    }}
                      className="text-left p-4 rounded-xl relative"
                      style={{
                        background: isSelected ? `${plan.color}0C` : "rgba(15,23,42,0.5)",
                        border: isSelected ? `1.5px solid ${plan.color}50` : `1px solid ${DS.border}`,
                        cursor: "pointer",
                      }}
                      whileHover={{ scale: 1.02 }}
                    >
                      {plan.highlighted && (
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "2px", textAlign: "center", background: GRD.primary, fontSize: 8, color: "#fff", fontFamily: DS.mono, borderRadius: "10px 10px 0 0" }}>
                          ★ PHỔ BIẾN NHẤT
                        </div>
                      )}
                      <div style={{ marginTop: plan.highlighted ? 14 : 0 }}>
                        <div style={{ color: isSelected ? plan.color : DS.text2, fontSize: 12, fontFamily: DS.mono, fontWeight: 700, marginBottom: 4 }}>
                          {plan.name.toUpperCase()}
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 2 }}>
                          <span style={{ color: DS.text, fontFamily: DS.heading, fontSize: 17, fontWeight: 900 }}>
                            {fmtVND(plan.discountedPrice)}
                          </span>
                          {hasDiscount && (
                            <span className="px-1 py-0.5 rounded text-xs" style={{ background: `${DS.green}15`, color: DS.green, fontFamily: DS.mono }}>
                              -{plan.discountPct}%
                            </span>
                          )}
                        </div>
                        {plan.monthlyPrice > 0 && (
                          <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>
                            ~{fmtVND(plan.monthlyPrice)}/tháng · {plan.period}
                          </div>
                        )}
                        {hasDiscount && (
                          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, textDecoration: "line-through" }}>
                            {fmtVND(plan.basePrice)}
                          </div>
                        )}
                        {isSelected && <Check size={12} style={{ color: plan.color, marginTop: 4 }} />}
                      </div>
                    </motion.button>
                  );
                })}
                <motion.button onClick={() => { setSelectedHostingPlan(""); if (selectedExtras.includes("hosting")) toggleExtra("hosting"); }}
                  className="text-center flex items-center justify-center"
                  style={{
                    background: !selectedExtras.includes("hosting") ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.4)",
                    border: !selectedExtras.includes("hosting") ? `1.5px solid ${DS.text4}60` : `1px solid ${DS.border}`,
                    borderRadius: 12, cursor: "pointer",
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  <span style={{ color: DS.text4, fontSize: 12 }}>Tự chuẩn bị</span>
                </motion.button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Add-on services ── */}
          {step === 2 && selectedPackage && extraOptions.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div className="flex items-center gap-3 mb-4">
                <div style={{ width: 3, height: 16, background: DS.amber, borderRadius: 2 }} />
                <h3 style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.14em" }}>
                  DỊCH VỤ BỔ SUNG
                </h3>
                <div style={{ flex: 1, height: 1, background: DS.border }} />
                <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>Tùy chọn</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {extraOptions.map(ext => {
                  const isSelected = selectedExtras.includes(ext.id);
                  const color = ext.color || DS.amber;
                  return (
                    <motion.button key={ext.id} onClick={() => toggleExtra(ext.id)}
                      className="w-full text-left p-3 rounded-xl flex items-start gap-3"
                      style={{
                        background: isSelected ? `${color}0C` : "rgba(15,23,42,0.4)",
                        border: isSelected ? `1.5px solid ${color}50` : `1px solid ${DS.border}`,
                        cursor: "pointer",
                      }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}15`, color }}>
                        {ext.id === "hosting" ? <Server size={16} /> :
                         ext.id === "domain" ? <Globe size={16} /> :
                         ext.id === "maintenance" ? <Shield size={16} /> :
                         ext.id === "analytics-setup" ? <BarChart3 size={16} /> :
                         ext.id === "training" ? <Users size={16} /> :
                         ext.id === "priority" ? <Sparkles size={16} /> :
                         ext.id === "seo-basic" ? <Target size={16} /> :
                         <Layers size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div style={{ color: DS.text, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{ext.label}</div>
                        {ext.price > 0 && (
                          <div style={{ color, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>
                            +{fmtVND(ext.price)}
                          </div>
                        )}
                        {isSelected && <Check size={12} style={{ color, marginTop: 2 }} />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEPS 3 / 4 / 5: Contact / Payment / Review ── */}
          {(step === 3 || step === 4 || step === 5) && (
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
              onEditSelection={() => setStep(0)}
              selectedPackage={selectedPkg}
              featureOptions={currentFeatureOptions}
              selectedFeatures={selectedFeatures}
              extraOptions={extraOptions}
              selectedExtras={selectedExtras}
              selectedHostingPlan={selectedHostingPlan}
              hostingPlans={hostingPlans}
              domainPrices={domainPrices}
              domainName={domainName}
              domainPurchaseNow={domainPurchaseNow}
              mode={step === 3 ? "contact" : step === 4 ? "payment" : "review"}
            />
          )}

          {/* ── Back / Next navigation (hide on success) ── */}
          {!submitted && !submitError && (
            <div
              className="flex items-center justify-between gap-4 mt-8 pt-6"
              style={{ borderTop: `1px solid ${DS.border}` }}
            >
              <button
                onClick={goBack}
                disabled={step === 0}
                style={{
                  padding: "12px 22px", borderRadius: 12, fontSize: 13,
                  fontFamily: DS.mono, fontWeight: 600, letterSpacing: "0.04em",
                  background: step === 0 ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.7)",
                  border: `1px solid ${step === 0 ? DS.border : DS.text4}`,
                  color: step === 0 ? DS.text5 : DS.text2,
                  cursor: step === 0 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <ArrowLeft size={15} />
                {t("wizardBack")}
              </button>

              <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.12em" }}>
                {step + 1} / {TOTAL_STEPS} · {STEP_LABELS[step]}
              </div>

              {step < TOTAL_STEPS - 1 ? (
                <button
                  onClick={goNext}
                  disabled={!canNext()}
                  style={{
                    padding: "12px 24px", borderRadius: 12, fontSize: 13,
                    fontFamily: DS.mono, fontWeight: 700, letterSpacing: "0.04em",
                    background: canNext() ? GRD.primary : "rgba(255,255,255,0.05)",
                    border: "none",
                    color: canNext() ? "#fff" : DS.text5,
                    cursor: canNext() ? "pointer" : "not-allowed",
                    boxShadow: canNext() ? "0 0 22px rgba(236,72,153,0.32)" : "none",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  {t("wizardNext")}
                  <ArrowRight size={15} />
                </button>
              ) : (
                <div style={{ width: 120 }} />
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
