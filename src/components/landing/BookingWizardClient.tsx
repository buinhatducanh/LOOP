"use client";

/**
 * Booking Wizard Client Component — Next.js / BE
 * Route: /{locale}/booking
 *
 * 5-step wizard:
 *   0 Package+Features  1 Domain  2 Hosting+Add-ons  3 Contact  4 Payment+Submit
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
// ── Main BookingWizardClient ────────────────────────────────────────────────

interface Props { locale: string }

export function BookingWizardClient({ locale }: Props) {
  const t = useTranslations("BookingPage");

  // ── Wizard state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [paymentPlan, setPaymentPlan] = useState<"50" | "100">("50");
  // Package selection (website-only — packages are the primary selection)
  const [selectedPackage, setSelectedPackage] = useState<string>("business"); // default to decoy

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

  const canNext = () => {
    if (step === 0) return !!selectedPackage;      // must select a package
    if (step === 1) return true;                    // domain is optional
    if (step === 2) return true;                    // hosting + addons optional
    if (step === 3) return !!(name && email && phone); // contact info required
    if (step === 4) return true;
    return true;
  };

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

  // ── i18n step labels ──────────────────────────────────────────────────
  const STEP_LABELS = [
    t("bookingPackage"),  // Step 0: Package + Features
    t("bookingDomain"),   // Step 1: Domain
    t("bookingHosting"),  // Step 2: Hosting + Add-ons
    t("bookingContact"),  // Step 3: Contact info
    t("bookingPayment"),  // Step 4: Payment + Submit
  ];

  // ── Step-based wizard layout ─────────────────────────────────────────

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
 const selColor = DS.green;
    return { pkg, price, market, saving, savingPct, isSelected, color, selColor };
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
            boxShadow: `0 0 40px ${DS.green}12`,
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

          {/* ══════════════════════════════════════════════════════════════
              STEP-BASED CONTENT
              ══════════════════════════════════════════════════════════════ */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >

           {/* ── STEP 0: Package + Features ──────────────────────────── */}
 {step === 0 && (
 <div>

 {/* ── Section header ── */}
 <div style={{ marginBottom: 28 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
 <div style={{ width: 4, height: 20, background: GRD.primary, borderRadius: 2 }} />
 <h3 style={{ color: DS.text, fontSize: 16, fontFamily: DS.heading, fontWeight: 700, letterSpacing: "0.06em" }}>
 CHỌN GÓI WEBSITE
 </h3>
 <div style={{ flex: 1, height: 1, background: DS.border, maxWidth: 120 }} />
 </div>
 <p style={{ color: DS.text4, fontSize: 13, marginLeft: 16 }}>
 Chọn gói phù hợp với nhu cầu của bạn.{" "}
 <span style={{ color: DS.pink }}>Không phí ẩn, không giới hạn.</span>
 </p>
 </div>

 {/* ── Package cards: grid desktop / horizontal scroll mobile ── */}
 <div style={{ marginBottom: 28 }}>
 <style>{`
 @media (max-width: 767px) {
 .pkg-scroll { scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; overflow-x: auto; padding-bottom: 12px; }
 .pkg-card { scroll-snap-align: center; }
 .pkg-card:first-child { scroll-snap-align: start; }
 .pkg-card:last-child { scroll-snap-align: end; }
 }
 `}</style>

 <div
 style={{
 display: "grid",
 gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
 gap: 16,
 }}
 className="pkg-scroll"
 >
 {pkgCards.map(({ pkg, price, market, saving, savingPct, isSelected, color, selColor }) => {
 const isPopular = pkg.popular && !isSelected;
 return (
 <motion.button
 key={pkg.id}
 onClick={() => setSelectedPackage(pkg.id)}
 className="pkg-card text-left"
 style={{
 background: isSelected
 ? `linear-gradient(160deg, ${selColor}16 0%, rgba(10,15,30,0.95) 70%)`
  : "rgba(15,23,42,0.7)",
 border: isSelected
 ? `2px solid ${selColor}`
 : `1px solid ${DS.border}`,
 borderRadius: 20,
 cursor: "pointer",
 position: "relative",
 overflow: "hidden",
 transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
 boxShadow: isSelected
 ? `0 0 40px ${selColor}30, 0 8px 32px rgba(0,0,0,0.4)`
 : "0 4px 16px rgba(0,0,0,0.2)",
 padding: 0,
 }}
 whileHover={{ scale: 1.03, y: -4 }}
 whileTap={{ scale: 0.97 }}
 >
 {/* Top accent strip — accent only when selected */}
 <div style={{
 height: 5,
 background: isSelected
 ? `linear-gradient(90deg, ${selColor}, ${selColor}80)`
 : "rgba(255,255,255,0.07)",
 borderRadius: "20px 20px 0 0",
 transition: "background 0.3s",
 }} />

 {/* Badge */}
 <div style={{ padding: "12px 20px 0", minHeight: isPopular || isSelected ? 34 : 10 }}>
 {isPopular && (
 <div style={{
 display: "inline-block",
 background: "rgba(255,255,255,0.07)",
 color: DS.text3,
 border: "1px solid rgba(255,255,255,0.12)",
 fontSize: 9,
 fontFamily: DS.mono,
 letterSpacing: "0.12em",
 padding: "3px 10px",
 borderRadius: 20,
 marginBottom: 4,
 }}>
 ★ PHỔ BIẾN NHẤT
 </div>
 )}
 {isSelected && (
 <div style={{
 display: "inline-flex",
 alignItems: "center",
 gap: 5,
 background: selColor,
 color: "#fff",
 fontSize: 9,
 fontFamily: DS.mono,
 letterSpacing: "0.12em",
 padding: "3px 10px",
 borderRadius: 20,
 marginBottom: 4,
 }}>
 <Check size={9} style={{ strokeWidth: 3 }} />
 ĐANG CHỌN
 </div>
 )}
 </div>

 {/* Card body */}
 <div style={{ padding: "8px 20px 24px" }}>
 {/* Package name — neutral when unselected */}
 <div style={{
 color: isSelected ? selColor : DS.text4,
 fontSize: 10,
 fontFamily: DS.mono,
 letterSpacing: "0.2em",
 marginBottom: 6,
 transition: "color 0.2s",
 }}>
 {pkg.name.toUpperCase()}
 </div>

 {/* Price */}
 <div style={{ marginBottom: 8 }}>
 {saving > 0 && (
 <div style={{
 color: DS.text5, fontSize: 11, fontFamily: DS.mono,
 textDecoration: "line-through", marginBottom: 2,
 }}>
 {fmtVND(market)}
 </div>
 )}
 <div style={{
 color: DS.text,
 fontFamily: DS.heading,
 fontSize: 30,
  fontWeight: 900,
 lineHeight: 1,
 marginBottom: 2,
 }}>
 {fmtVND(price)}
 </div>
 <div style={{ color: DS.text4, fontSize: 10 }}>
 {pkg.billingPeriod || "một lần"}
 </div>
 </div>

 {/* Saving badge */}
 {saving > 0 && (
 <div style={{
 display: "inline-block",
 background: "rgba(34,197,94,0.12)",
 border: "1px solid rgba(34,197,94,0.3)",
 color: DS.green,
 fontSize: 9,
 fontFamily: DS.mono,
 padding: "2px 8px",
 borderRadius: 8,
 marginBottom: 14,
 }}>
 −{savingPct}% · Tiết kiệm {fmtVND(saving)}
 </div>
 )}

 {/* Description */}
 <p style={{
 color: DS.text3,
 fontSize: 11,
 lineHeight: 1.55,
 marginBottom: 14,
 }}>
 {pkg.desc}
 </p>

 {/* Feature list */}
 {pkg.features.length > 0 && (
 <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
 {pkg.features.slice(0, 4).map((feat, i) => (
 <li key={i} style={{
 display: "flex", alignItems: "flex-start", gap: 7,
 color: DS.text3, fontSize: 11, lineHeight: 1.4,
 }}>
 <Check size={12} style={{ color: DS.green, flexShrink: 0, marginTop: 1 }} />
 {feat}
 </li>
 ))}
 {pkg.features.length > 4 && (
 <li style={{ color: DS.text4, fontSize: 10, paddingLeft: 19 }}>
 +{pkg.features.length - 4} tính năng khác
 </li>
 )}
 </ul>
 )}
 </div>

 {/* Selected checkmark circle */}
 {isSelected && (
 <div style={{
 position: "absolute", top: 14, right: 14,
 width: 32, height: 32, borderRadius: "50%",
 background: selColor,
 display: "flex", alignItems: "center", justifyContent: "center",
 boxShadow: `0 0 20px ${selColor}70`,
 }}>
 <Check size={16} style={{ color: "#fff", strokeWidth: 3 }} />
 </div>
 )}
 </motion.button>
 );
 })}
 </div>
 </div>

 {/* ── Selected package summary bar ── */}
  {selectedPkg && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.35, ease: "easeOut" }}
 style={{
 background: `linear-gradient(135deg, ${DS.green}0C, ${DS.green}04)`,
 border: `1px solid ${DS.green}30`,
 borderRadius: 20,
 padding: "24px",
 marginBottom: 28,
 position: "relative",
 overflow: "hidden",
 boxShadow: `0 0 40px ${DS.green}12`,
 }}
 >
 {/* Background glow */}
 <div style={{
 position: "absolute", top: -30, right: -30,
 width: 140, height: 140, borderRadius: "50%",
 background: `radial-gradient(circle, ${DS.green}10 0%, transparent 70%)`,
 pointerEvents: "none",
 }} />

 <div className="relative">
 {/* Top row: package name + total */}
 <div style={{
 display: "flex", alignItems: "flex-start",
 justifyContent: "space-between", flexWrap: "wrap",
 gap: 16, marginBottom: 16,
 }}>
 <div>
 <div style={{
 color: DS.green, fontSize: 9, fontFamily: DS.mono,
 letterSpacing: "0.22em", marginBottom: 6,
 }}>
 GÓI ĐÃ CHỌN
 </div>
 <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
 <span style={{
 color: DS.text, fontFamily: DS.heading,
 fontSize: 34, fontWeight: 900,
 }}>
 {fmtVND(grandForDisplay)}
 </span>
 <span style={{
 background: `${DS.green}20`,
 color: DS.green, fontSize: 11, fontFamily: DS.mono,
 padding: "3px 10px", borderRadius: 20,
 }}>
 {selectedPkg.name}
 </span>
 </div>
 {selectedPkg.savingPct && selectedPkg.savingPct > 0 && (
 <div style={{
 display: "inline-block",
 background: "rgba(34,197,94,0.12)",
 color: DS.green, fontSize: 10, fontFamily: DS.mono,
 padding: "3px 10px", borderRadius: 20,
 marginTop: 8,
 }}>
 −{selectedPkg.savingPct}% so với giá gốc
 </div>
 )}
 </div>

 {/* LP reward */}
 {lpEarnedDisplay > 0 && (
 <div style={{
 background: `linear-gradient(135deg, ${DS.purple}18, ${DS.pink}08)`,
 border: `1px solid ${DS.purple}30`,
 borderRadius: 14, padding: "12px 18px",
 display: "flex", alignItems: "center", gap: 8,
 }}>
 <svg width="16" height="16" viewBox="0 0 24 24" fill={DS.purple} stroke="none">
 <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
 </svg>
 <span style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono }}>
 +{lpEarnedDisplay.toLocaleString()} LP
 </span>
 </div>
 )}
 </div>

 {/* Price breakdown chips */}
 <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
 {currentBasePrice > 0 && (
 <div style={{
 background: `${DS.green}10`,
 border: `1px solid ${DS.green}30`,
 borderRadius: 12, padding: "8px 16px",
 }}>
 <div style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono, marginBottom: 2 }}>GÓI</div>
 <div style={{ color: DS.green, fontSize: 15, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(currentBasePrice)}</div>
 </div>
 )}
 {featTotalForDisplay > 0 && (
 <div style={{ background: `${DS.blue}10`, border: `1px solid ${DS.blue}30`, borderRadius: 12, padding: "8px 16px" }}>
 <div style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono, marginBottom: 2 }}>TÍNH NĂNG</div>
 <div style={{ color: DS.blue, fontSize: 15, fontFamily: DS.mono, fontWeight: 700 }}>+{fmtVND(featTotalForDisplay)}</div>
 </div>
 )}
 {extraTotalForDisplay > 0 && (
 <div style={{ background: `${DS.purple}10`, border: `1px solid ${DS.purple}30`, borderRadius: 12, padding: "8px 16px" }}>
 <div style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono, marginBottom: 2 }}>DỊCH VỤ</div>
 <div style={{ color: DS.purple, fontSize: 15, fontFamily: DS.mono, fontWeight: 700 }}>+{fmtVND(extraTotalForDisplay)}</div>
 </div>
 )}
 {hostingTotal > 0 && (
 <div style={{ background: `${DS.amber}10`, border: `1px solid ${DS.amber}30`, borderRadius: 12, padding: "8px 16px" }}>
 <div style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono, marginBottom: 2 }}>HOSTING</div>
 <div style={{ color: DS.amber, fontSize: 15, fontFamily: DS.mono, fontWeight: 700 }}>+{fmtVND(hostingTotal)}</div>
 </div>
 )}
 {domainTotal > 0 && (
 <div style={{ background: `${DS.cyan}10`, border: `1px solid ${DS.cyan}30`, borderRadius: 12, padding: "8px 16px" }}>
 <div style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono, marginBottom: 2 }}>DOMAIN</div>
 <div style={{ color: DS.cyan, fontSize: 15, fontFamily: DS.mono, fontWeight: 700 }}>+{fmtVND(domainTotal)}</div>
 </div>
 )}
 {vatAmt > 0 && (
 <div style={{ background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, padding: "8px 16px" }}>
 <div style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono, marginBottom: 2 }}>VAT</div>
 <div style={{ color: DS.text3, fontSize: 15, fontFamily: DS.mono, fontWeight: 700 }}>+{fmtVND(vatAmt)}</div>
 </div>
 )}
 {lpDisc.vndDiscount > 0 && (
 <div style={{ background: `${DS.pink}10`, border: `1px solid ${DS.pink}30`, borderRadius: 12, padding: "8px 16px" }}>
 <div style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono, marginBottom: 2 }}>GIẢM LP</div>
 <div style={{ color: DS.pink, fontSize: 15, fontFamily: DS.mono, fontWeight: 700 }}>−{fmtVND(lpDisc.vndDiscount)}</div>
 </div>
 )}
 </div>
 </div>
 </motion.div>
 )}

 {/* ── Feature toggle ── */}
 {selectedPackage && currentFeatureOptions.length > 0 && (
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
 </div>
 )}
 {/* ── STEP 1: Domain ──────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div className="mb-6 p-5 rounded-2xl" style={{ background: "rgba(15,23,42,0.7)", border: `1px solid ${DS.cyan}15` }}>
                <div style={{ color: DS.cyan, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.22em", marginBottom: 8 }}>ĐĂNG KÝ TÊN MIỀN</div>
                <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 26, fontWeight: 900, letterSpacing: "0.04em", marginBottom: 6 }}>Chọn tên miền cho website</h3>
                <p style={{ color: DS.text3, fontSize: 14, lineHeight: 1.7 }}>Nhập tên miền bạn mong muốn và chọn đuôi phù hợp. Bạn có thể bỏ qua nếu đã có sẵn tên miền.</p>
              </div>

              <div className="mb-6">
                <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>TÊN MIỀN BẠN MUỐN ĐĂNG KÝ</label>
                <div className="flex gap-3">
                  <input value={domainName} onChange={e => setDomainName(e.target.value)} placeholder="ví dụ: mysite.com"
                    style={{ flex: 1, background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "12px 16px", color: DS.text, fontSize: 15, outline: "none", fontFamily: DS.body, boxSizing: "border-box" }} />
                  {domainPrices.length > 0 && (
                    <select value={domainName.includes(".") ? "." + domainName.split(".").pop() : ".com"}
                      onChange={e => { const base = domainName.includes(".") ? domainName.split(".")[0] : domainName; setDomainName(base + e.target.value); }}
                      style={{ background: "rgba(15,23,42,0.8)", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "12px 14px", color: DS.text, fontSize: 14, fontFamily: DS.mono, outline: "none", cursor: "pointer" }}>
                      {domainPrices.map(d => <option key={d.extension} value={d.extension} style={{ background: "#0F172A" }}>{d.extension}</option>)}
                    </select>
                  )}
                </div>
                {(() => {
                  const matchedExt = domainName.includes(".") ? domainPrices.find(d => domainName.endsWith(d.extension)) : null;
                  return (<>
                    {matchedExt && (
                      <div className="mt-2 flex items-center gap-2">
                        <Check size={11} style={{ color: DS.green }} />
                        <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono }}>Đăng ký {matchedExt.extension}: {fmtVND(matchedExt.registrationPrice)}/{matchedExt.periodVi}</span>
                        <span style={{ color: DS.text5, fontSize: 10 }}>— Gia hạn: {fmtVND(matchedExt.renewalPrice)}/năm</span>
                      </div>
                    )}
                    {domainName && !matchedExt && domainName.includes(".") && (
                      <div className="mt-2"><span style={{ color: DS.amber, fontSize: 11 }}>⚠ Không tìm thấy giá cho .{domainName.split(".").pop()}</span></div>
                    )}
                    {domainName && matchedExt?.note && (
                      <div className="mt-1 px-3 py-2 rounded-lg" style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.2)" }}>
                        <span style={{ color: DS.amber, fontSize: 11 }}>{matchedExt.note}</span>
                      </div>
                    )}
                  </>);
                })()}
              </div>

              {/* Purchase timing */}
              {domainName && domainName.includes(".") && domainPrices.find(d => domainName.endsWith(d.extension)) && (
                <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.5)", border: `1px solid ${DS.border}` }}>
                  <div style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, marginBottom: 12 }}>BẠN MUỐN ĐĂNG KÝ KHI NÀO?</div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {[{ now: true, label: "Đăng ký ngay bây giờ", desc: "Domain được đăng ký trước khi bàn giao web — website hoạt động ngay khi bàn giao.", color: DS.blue, bg: "rgba(59,130,246,0.1)", border: "1.5px solid rgba(59,130,246,0.4)" },
                      { now: false, label: "Mua sau khi bàn giao", desc: "Bạn tự chuẩn bị domain riêng — LOOP hỗ trợ kỹ thuật cấu hình miễn phí.", color: DS.purple, bg: "rgba(129,140,248,0.08)", border: "1.5px solid rgba(129,140,248,0.3)" }
                    ].map(opt => (
                      <motion.button key={String(opt.now)} onClick={() => setDomainPurchaseNow(opt.now)} className="flex-1 text-left p-4 rounded-xl"
                        style={{ background: domainPurchaseNow === opt.now ? opt.bg : "rgba(15,23,42,0.3)", border: domainPurchaseNow === opt.now ? opt.border : `1px solid ${DS.border}`, cursor: "pointer" }}
                        whileHover={{ scale: 1.01 }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: domainPurchaseNow === opt.now ? opt.color : "transparent", border: domainPurchaseNow === opt.now ? "none" : `1.5px solid ${DS.text4}` }}>
                            {domainPurchaseNow === opt.now && <Check size={9} style={{ color: "#fff" }} />}
                          </div>
                          <span style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{opt.label}</span>
                        </div>
                        <div style={{ color: DS.text4, fontSize: 11, marginLeft: 24 }}>{opt.desc}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Domain price table */}
              {domainPrices.length > 0 && (
                <div>
                  <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>BẢNG GIÁ TÊN MIỀN (tham khảo)</div>
                  <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${DS.border}` }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "rgba(15,23,42,0.8)" }}>
                          {["ĐUÔI", "ĐĂNG KÝ", "GIA HẠN", "GHI CHÚ"].map((h, i) => (
                            <th key={h} style={{ padding: "10px 14px", textAlign: i === 1 || i === 2 ? "right" : "left", color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", borderBottom: `1px solid ${DS.border}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {domainPrices.map(d => (
                          <tr key={d.extension} style={{ borderBottom: `1px solid ${DS.border}` }}>
                            <td style={{ padding: "10px 14px" }}><span style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 13, fontWeight: 700 }}>{d.extension}</span></td>
                            <td style={{ padding: "10px 14px", textAlign: "right" }}><span style={{ color: DS.text, fontFamily: DS.mono, fontSize: 12 }}>{fmtVND(d.registrationPrice)}</span></td>
                            <td style={{ padding: "10px 14px", textAlign: "right" }}><span style={{ color: DS.text4, fontFamily: DS.mono, fontSize: 12 }}>{fmtVND(d.renewalPrice)}</span></td>
                            <td style={{ padding: "10px 14px" }}><span style={{ color: d.note ? DS.text4 : DS.text5, fontSize: 11 }}>{d.note || "—"}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Hosting + Add-ons ───────────────────────────── */}
          {step === 2 && (
            <div>
              <div className="mb-6 p-5 rounded-2xl" style={{ background: "rgba(15,23,42,0.7)", border: `1px solid ${DS.purple}15` }}>
                <div style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.22em", marginBottom: 8 }}>HOSTING & DỊCH VỤ BỔ SUNG</div>
                <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 26, fontWeight: 900, letterSpacing: "0.04em", marginBottom: 6 }}>Hosting & Các dịch vụ bổ sung</h3>
                <p style={{ color: DS.text3, fontSize: 14, lineHeight: 1.7 }}>Chọn gói hosting và các dịch vụ đi kèm để website hoạt động tối ưu.</p>
              </div>

              {hostingPlans.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div style={{ width: 3, height: 16, background: DS.purple, borderRadius: 2 }} />
                    <h3 style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.14em" }}>HOSTING</h3>
                    <div style={{ flex: 1, height: 1, background: DS.border }} />
                    <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>Không bắt buộc</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                    {hostingPlans.map(plan => {
                      const isSelected = selectedExtras.includes("hosting") && selectedHostingPlan === plan.slug;
                      const hasDiscount = plan.discountPct > 0;
                      return (
                        <motion.button key={plan.slug} onClick={() => {
                          if (isSelected) { setSelectedHostingPlan(""); }
                          else { setSelectedHostingPlan(plan.slug); if (!selectedExtras.includes("hosting")) toggleExtra("hosting"); }
                        }} className="text-left p-4 rounded-xl relative"
                          style={{ background: isSelected ? `${plan.color}0C` : "rgba(15,23,42,0.5)", border: isSelected ? `1.5px solid ${plan.color}50` : `1px solid ${DS.border}`, cursor: "pointer" }}
                          whileHover={{ scale: 1.02 }}>
                          {plan.highlighted && <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "2px", textAlign: "center", background: GRD.primary, fontSize: 8, color: "#fff", fontFamily: DS.mono, borderRadius: "10px 10px 0 0" }}>★ PHỔ BIẾN NHẤT</div>}
                          <div style={{ marginTop: plan.highlighted ? 14 : 0 }}>
                            <div style={{ color: isSelected ? plan.color : DS.text2, fontSize: 12, fontFamily: DS.mono, fontWeight: 700, marginBottom: 4 }}>{plan.name.toUpperCase()}</div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 2 }}>
                              <span style={{ color: DS.text, fontFamily: DS.heading, fontSize: 17, fontWeight: 900 }}>{fmtVND(plan.discountedPrice)}</span>
                              {hasDiscount && <span className="px-1 py-0.5 rounded text-xs" style={{ background: `${DS.green}15`, color: DS.green, fontFamily: DS.mono }}>-{plan.discountPct}%</span>}
                            </div>
                            {plan.monthlyPrice > 0 && <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>~{fmtVND(plan.monthlyPrice)}/tháng · {plan.period}</div>}
                            {hasDiscount && <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, textDecoration: "line-through" }}>{fmtVND(plan.basePrice)}</div>}
                            {isSelected && <Check size={12} style={{ color: plan.color, marginTop: 4 }} />}
                          </div>
                        </motion.button>
                      );
                    })}
                    <motion.button onClick={() => { setSelectedHostingPlan(""); if (selectedExtras.includes("hosting")) toggleExtra("hosting"); }}
                      className="text-center flex items-center justify-center"
                      style={{ background: !selectedExtras.includes("hosting") ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.4)", border: !selectedExtras.includes("hosting") ? `1.5px solid ${DS.text4}60` : `1px solid ${DS.border}`, borderRadius: 12, cursor: "pointer" }}
                      whileHover={{ scale: 1.02 }}>
                      <span style={{ color: DS.text4, fontSize: 12 }}>Tự chuẩn bị</span>
                    </motion.button>
                  </div>
                </div>
              )}

              {extraOptions.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div style={{ width: 3, height: 16, background: DS.amber, borderRadius: 2 }} />
                    <h3 style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.14em" }}>DỊCH VỤ BỔ SUNG</h3>
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
                          style={{ background: isSelected ? `${color}0C` : "rgba(15,23,42,0.4)", border: isSelected ? `1.5px solid ${color}50` : `1px solid ${DS.border}`, cursor: "pointer" }}
                          whileHover={{ scale: 1.01 }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
                            {ext.id === "hosting" ? <Server size={16} /> : ext.id === "domain" ? <Globe size={16} /> : ext.id === "maintenance" ? <Shield size={16} /> : ext.id === "analytics-setup" ? <BarChart3 size={16} /> : ext.id === "training" ? <Users size={16} /> : ext.id === "priority" ? <Sparkles size={16} /> : ext.id === "seo-basic" ? <Target size={16} /> : <Layers size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div style={{ color: DS.text, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{ext.label}</div>
                            {ext.price > 0 && <div style={{ color, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>+{fmtVND(ext.price)}</div>}
                            {isSelected && <Check size={12} style={{ color, marginTop: 2 }} />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Contact Info ────────────────────────────────── */}
          {step === 3 && (
            <div>
              <div className="mb-6 p-5 rounded-2xl" style={{ background: "rgba(15,23,42,0.7)", border: `1px solid ${DS.pink}15` }}>
                <div style={{ color: DS.pink, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.22em", marginBottom: 8 }}>THÔNG TIN LIÊN HỆ</div>
                <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 26, fontWeight: 900, letterSpacing: "0.04em", marginBottom: 6 }}>Thông tin liên hệ</h3>
                <p style={{ color: DS.text3, fontSize: 14, lineHeight: 1.7 }}>Điền thông tin để chúng tôi liên hệ tư vấn và gửi báo giá chi tiết.</p>
              </div>

              <div className="mb-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${DS.pink}15` }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DS.pink} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <h4 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 16, fontWeight: 700, letterSpacing: "0.04em" }}>Thông tin cá nhân</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Họ và tên *", value: name, set: setName, placeholder: "Nguyễn Văn A" },
                    { label: "Email công ty *", value: email, set: setEmail, placeholder: "name@company.vn" },
                    { label: "Số điện thoại *", value: phone, set: setPhone, placeholder: "0901 234 567" },
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
                      {[{ val: "2", label: "2 tuần" }, { val: "4", label: "1 tháng" }, { val: "8", label: "2 tháng" }, { val: "12", label: "3 tháng" }, { val: "24", label: "6 tháng" }, { val: "custom", label: t("custom") }].map(d => (
                        <button key={d.val} onClick={() => setDuration(d.val)}
                          style={{ padding: "7px 12px", borderRadius: 8, fontSize: 11, fontFamily: DS.mono, cursor: "pointer",
                            background: duration === d.val ? GRD.primary : "rgba(15,23,42,0.6)",
                            border: duration === d.val ? "none" : `1px solid ${DS.border}`,
                            color: duration === d.val ? "#fff" : DS.text3 }}>{d.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${DS.purple}15` }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DS.purple} strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </div>
                  <h4 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 16, fontWeight: 700, letterSpacing: "0.04em" }}>Ghi chú thêm</h4>
                </div>
                <textarea value={talentNote} onChange={e => setTalentNote(e.target.value)} placeholder="Yêu cầu đặc biệt, thông tin bổ sung..." rows={3}
                  style={{ width: "100%", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "11px 14px", color: DS.text, fontSize: 14, outline: "none", fontFamily: DS.body, boxSizing: "border-box", resize: "vertical" }} />
              </div>
            </div>
          )}

          {/* ── STEP 4: Payment + Submit ────────────────────────────── */}
          {step === 4 && (
            <div>
              {submitError && (
                <div className="text-center py-8">
                  <div style={{ color: DS.red, fontSize: 13, marginBottom: 12, padding: "12px 16px", background: "rgba(239,68,68,0.1)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)" }}>{submitError}</div>
                  <button onClick={() => setSubmitError("")} style={{ color: DS.text4, fontSize: 12, background: "none", border: "none", cursor: "pointer", fontFamily: DS.mono }}>{t("closeAndRetry")}</button>
                </div>
              )}

              {submitted && (
                <motion.div className="text-center py-12" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.4)" }}><Check size={36} style={{ color: DS.green }} /></div>
                  <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 24, fontWeight: 900, letterSpacing: "0.06em", marginBottom: 12 }}>{t("successTitle")}</h3>
                  {newOrderId && (
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-xl" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)" }}>
                      <span style={{ color: DS.text4, fontSize: 12 }}>{t("orderCode")}:</span>
                      <span style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 14, fontWeight: 700 }}>{newOrderId}</span>
                    </div>
                  )}
                  <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8, maxWidth: 400, margin: "0 auto 32px" }}>{t("successMessage")}</p>
                  <div className="inline-block px-5 py-3 rounded-xl mb-6" style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.3)" }}>
                    <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 4 }}>LP ĐIỂM THƯỞNG ĐĂNG KÝ</div>
                    <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 24, fontWeight: 900 }}>+{lpEarnedDisplay.toLocaleString()} LP</div>
                  </div>
                </motion.div>
              )}

              {!submitted && !submitError && (
                <div>
                  <div className="mb-6 p-5 rounded-2xl" style={{ background: "rgba(15,23,42,0.7)", border: `1px solid ${DS.green}15` }}>
                    <div style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.22em", marginBottom: 8 }}>THANH TOÁN</div>
                    <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 26, fontWeight: 900, letterSpacing: "0.04em", marginBottom: 6 }}>Phương thức thanh toán</h3>
                    <p style={{ color: DS.text3, fontSize: 14, lineHeight: 1.7 }}>Chọn hình thức thanh toán và xác nhận đơn hàng.</p>
                  </div>

                  {/* Order tags */}
                  <div className="mb-5 p-4 rounded-xl flex items-center justify-between flex-wrap gap-3" style={{ background: "rgba(15,23,42,0.7)", border: `1px solid ${DS.border}` }}>
                    <div className="flex flex-wrap gap-2">
                      {selectedPkg && <span className="px-3 py-1.5 rounded-lg text-xs" style={{ background: `${pkgColor}15`, color: pkgColor, border: `1px solid ${pkgColor}30`, fontFamily: DS.mono, fontWeight: 600 }}>{selectedPkg.name}</span>}
                      {selectedFeatures.length > 0 && <span className="px-3 py-1.5 rounded-lg text-xs" style={{ background: `${DS.cyan}12`, color: DS.cyan, border: `1px solid ${DS.cyan}30`, fontFamily: DS.mono }}>+{selectedFeatures.length} tính năng</span>}
                      {selectedExtras.length > 0 && <span className="px-3 py-1.5 rounded-lg text-xs" style={{ background: `${DS.purple}12`, color: DS.purple, border: `1px solid ${DS.purple}30`, fontFamily: DS.mono }}>+{selectedExtras.length} dịch vụ</span>}
                      {domainName && <span className="px-3 py-1.5 rounded-lg text-xs" style={{ background: `${DS.cyan}12`, color: DS.cyan, border: `1px solid ${DS.cyan}30`, fontFamily: DS.mono }}>🌐 {domainName}</span>}
                    </div>
                    <button onClick={() => setStep(0)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: DS.blue, background: `${DS.blue}10`, border: `1px solid ${DS.blue}30`, fontFamily: DS.mono, cursor: "pointer" }}>← Sửa lựa chọn</button>
                  </div>

                  {/* Payment plan */}
                  <div className="mb-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${DS.green}15` }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DS.green} strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      </div>
                      <h4 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 16, fontWeight: 700, letterSpacing: "0.04em" }}>Hình thức thanh toán</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {([["50", DS.blue, t("paymentPlan50"), t("paymentPlan50Desc")] as const, ["100", DS.green, t("paymentPlan100"), t("paymentPlan100Desc")] as const]).map(([plan, clr, label, desc]) => (
                        <button key={plan} onClick={() => setPaymentPlan(plan as "50" | "100")}
                          style={{ padding: "14px 16px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                            background: paymentPlan === plan ? `${clr}12` : "rgba(15,23,42,0.5)",
                            border: paymentPlan === plan ? `1.5px solid ${clr}60` : `1px solid ${DS.border}`,
                            color: paymentPlan === plan ? DS.text : DS.text3 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${paymentPlan === plan ? clr : DS.text4}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {paymentPlan === plan && <div style={{ width: 8, height: 8, borderRadius: "50%", background: clr }} />}
                            </div>
                            <span style={{ fontFamily: DS.mono, fontWeight: 700, fontSize: 13 }}>{label}</span>
                            {plan === "100" && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: `${DS.green}15`, color: DS.green, fontFamily: DS.mono }}>−5%</span>}
                          </div>
                          <div style={{ color: DS.text4, fontSize: 11, marginLeft: 24, lineHeight: 1.5 }}>{desc}</div>
                        </button>
                      ))}
                    </div>

                    {/* Payment method */}
                    <div className="mb-4">
                      <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Hình thức chuyển khoản</label>
                      <div className="flex gap-3 flex-wrap">
                        {[{ id: "bank", label: t("bankTransfer"), icon: "🏦" }, { id: "vnpay", label: "VNPay QR", icon: "📱" }, { id: "momo", label: "Momo", icon: "💜" }].map(m => (
                          <button key={m.id} style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, cursor: "pointer", background: "rgba(15,23,42,0.5)", border: `1px solid ${DS.border}`, color: DS.text3, display: "flex", alignItems: "center", gap: 8, fontFamily: DS.mono }}>
                            <span style={{ fontSize: 16 }}>{m.icon}</span>{m.label}
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
                          <button onClick={() => setLpDiscount(Math.max(0, lpDiscount - 1000))} style={{ width: 28, height: 28, borderRadius: 7, background: `${DS.purple}15`, border: `1px solid ${DS.purple}30`, color: DS.purple, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={12} /></button>
                          <div style={{ color: DS.purple, fontFamily: DS.mono, fontSize: 15, fontWeight: 700, minWidth: 80, textAlign: "center" }}>{lpDiscount.toLocaleString()} LP</div>
                          <button onClick={() => setLpDiscount(Math.min(maxLpRedeem, lpDiscount + 1000))} style={{ width: 28, height: 28, borderRadius: 7, background: `${DS.purple}15`, border: `1px solid ${DS.purple}30`, color: DS.purple, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={12} /></button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit button */}
                  <button onClick={handleSubmit} disabled={!name || !email || !phone || submitLoading}
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
                </div>
              )}
            </div>
          )}

            </motion.div>
          </AnimatePresence>

          {/* ── Navigation Buttons (Next / Back) ── */}
          {!submitted && (
            <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                style={{
                  padding: "12px 28px", borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: DS.body,
                  cursor: step === 0 ? "not-allowed" : "pointer",
                  background: step === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
                  border: step === 0 ? "1px solid rgba(255,255,255,0.06)" : `1px solid ${DS.border}`,
                  color: step === 0 ? DS.text5 : DS.text3,
                  display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
                }}>
                <ArrowLeft size={15} /> Quay lại
              </button>
              {step < 4 && (
                <button
                  onClick={() => { if (canNext()) setStep(s => s + 1); }}
                  disabled={!canNext()}
                  style={{
                    padding: "12px 32px", borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: DS.body,
                    cursor: canNext() ? "pointer" : "not-allowed",
                    background: canNext() ? GRD.primary : "rgba(255,255,255,0.05)",
                    border: "none",
                    color: canNext() ? "#fff" : DS.text4,
                    display: "flex", alignItems: "center", gap: 8,
                    boxShadow: canNext() ? "0 0 20px rgba(129,140,248,0.3)" : "none",
                    transition: "all 0.3s",
                  }}>
                  Tiếp tục <ArrowRight size={15} />
                </button>
              )}
            </div>
          )}

        </div>
      </section>
    </main>
  );
}
