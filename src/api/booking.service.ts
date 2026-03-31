/**
 * LOOP Solutions — Booking Service
 * Wizard pricing config + price calculation
 *
 * BE endpoints:
 * GET  /api/pricing/config        → full wizard config (services, packages, features, addons, LP rate)
 * POST /api/pricing/calculate     → real-time price calculation
 */
import { apiClient } from "@/lib/api/client";

// ─── BE → FE Types ─────────────────────────────────────────────────────────

/*** Wizard service (Step 1) — from pricing config */
export interface WizardService {
  id: string;
  title: string;
  titleEn: string;
  shortDesc: string;
  basePrice: number;
  icon: string;
  color: string;
  isSubscription: boolean;
  perMonth?: boolean;
}

/*** Wizard package (Step 2) — from pricing config */
export interface WizardPackage {
  id: string;
  slug: string;
  name: string;
  desc: string;
  priceText: string;
  multiplier: number;
  features: string[];
  type: string;
  isSubscription: boolean;
  billingPeriod: string | null;
}

/*** Wizard feature (Step 3) — from pricing config */
export interface WizardFeature {
  id: string;
  label: string;
  labelEn: string;
  price: number;
  xpPoints: number;
  tier: string;
  category: string;
  parentId: string | null;
}

/*** Feature grouped by category for UI */
export interface WizardFeatureCategory {
  category: string;
  features: WizardFeature[];
}

/*** Wizard addon (Step 6) — from pricing config */
export interface WizardAddon {
  id: string;
  slug: string;
  label: string;
  labelEn: string;
  desc: string;
  icon: string | null;
  type: string;
  price: number;
  billingPeriod: string | null;
}

/*** LP rate config */
export interface LpRateConfig {
  lpPerVnd: number;
  vndPerLp: number;
  maxDiscountPercent: number;
  lpEarnPerMillion: number;
}

/*** Full pricing config from BE */
export interface PricingConfig {
  basePrice: number;
  packageLps: Record<string, number>;
  packages: WizardPackage[];
  featuresByCategory: Record<string, WizardFeature[]>;
  addons: WizardAddon[];
  lpRate: LpRateConfig;
  currency: string;
}

/**
 * Fetch pricing config from BE.
 * Falls back to hardcoded data if API unavailable.
 */
export async function getPricingConfig(locale = "vi"): Promise<PricingConfig> {
  try {
    const res = await apiClient.get<{ data: PricingConfig }>("/pricing/config", { params: { lang: locale } });
    if (res?.data) return res.data;
  } catch {
    // fall through to fallback
  }
  return getFallbackPricingConfig();
}

/**
 * Calculate LP discount given subtotal and LP discount amount.
 */
export function calcLpDiscount(
  subtotal: number,
  lpDiscount: number,
  lpBalance: number,
  rate: LpRateConfig,
): { vndDiscount: number; lpApplied: number } {
  const lpToApply = Math.min(lpDiscount, lpBalance);
  const maxDiscount = subtotal * (rate.maxDiscountPercent / 100);
  const maxLpAllowed = Math.floor(maxDiscount * rate.lpPerVnd);
  const lpAllowed = Math.min(lpToApply, maxLpAllowed);
  const vndDiscount = Math.floor(lpAllowed / rate.lpPerVnd);
  return { vndDiscount, lpApplied: lpAllowed };
}

// ─── Fallback Data ─────────────────────────────────────────────────────────────

export function getFallbackPricingConfig(): PricingConfig {
  return {
    basePrice: 15_000_000,
    currency: "VND",
    packageLps: { starter: 500, business: 1200, enterprise: 2500 },
    packages: [
      {
        id: "starter", slug: "starter", name: "Starter", type: "web",
        multiplier: 1, priceText: "15M", desc: "Phù hợp cá nhân, startup giai đoạn đầu",
        features: ["Thiết kế cơ bản", "Responsive design", "SEO cơ bản", "Bảo hành 3 tháng"],
        isSubscription: false, billingPeriod: null,
      },
      {
        id: "business", slug: "business", name: "Business", type: "web",
        multiplier: 2.2, priceText: "33M", desc: "Doanh nghiệp vừa, sản phẩm cần scale",
        features: ["Thiết kế độc quyền", "CMS tích hợp", "Analytics dashboard", "Bảo hành 6 tháng", "Không giới hạn sửa"],
        isSubscription: false, billingPeriod: null,
      },
      {
        id: "enterprise", slug: "enterprise", name: "Enterprise", type: "web",
        multiplier: 3.8, priceText: "57M", desc: "Doanh nghiệp lớn, yêu cầu cao",
        features: ["Tùy chỉnh hoàn toàn", "API & Integrations", "SLA 99.9%", "Dedicated PM", "Support 24/7", "Bảo hành 12 tháng"],
        isSubscription: false, billingPeriod: null,
      },
    ],
    featuresByCategory: {
      web: [
        { id: "cms", label: "Tích hợp CMS", labelEn: "CMS Integration", price: 5_000_000, xpPoints: 50, tier: "basic", category: "web", parentId: null },
        { id: "i18n", label: "Đa ngôn ngữ (i18n)", labelEn: "Multi-language (i18n)", price: 3_000_000, xpPoints: 30, tier: "basic", category: "web", parentId: null },
        { id: "ecom", label: "E-commerce", labelEn: "E-commerce", price: 12_000_000, xpPoints: 120, tier: "pro", category: "web", parentId: null },
        { id: "blog", label: "Blog & Content module", labelEn: "Blog & Content", price: 2_500_000, xpPoints: 25, tier: "basic", category: "web", parentId: null },
        { id: "analytics", label: "Analytics dashboard riêng", labelEn: "Custom Analytics", price: 4_000_000, xpPoints: 40, tier: "pro", category: "web", parentId: null },
      ],
      app: [
        { id: "auth", label: "Auth & User management", labelEn: "Auth & Users", price: 6_000_000, xpPoints: 60, tier: "basic", category: "app", parentId: null },
        { id: "notification", label: "Push notification", labelEn: "Push Notifications", price: 3_500_000, xpPoints: 35, tier: "basic", category: "app", parentId: null },
        { id: "payment", label: "Tích hợp thanh toán", labelEn: "Payment Integration", price: 8_000_000, xpPoints: 80, tier: "pro", category: "app", parentId: null },
        { id: "chat", label: "In-app chat", labelEn: "In-app Chat", price: 7_000_000, xpPoints: 70, tier: "pro", category: "app", parentId: null },
      ],
      dashboard: [
        { id: "realtime", label: "Real-time data sync", labelEn: "Real-time Sync", price: 5_000_000, xpPoints: 50, tier: "basic", category: "dashboard", parentId: null },
        { id: "export", label: "Export PDF/Excel tự động", labelEn: "PDF/Excel Export", price: 3_000_000, xpPoints: 30, tier: "basic", category: "dashboard", parentId: null },
        { id: "alert", label: "Alert & notification", labelEn: "Alerts", price: 4_000_000, xpPoints: 40, tier: "basic", category: "dashboard", parentId: null },
        { id: "api", label: "API & webhook", labelEn: "API & Webhooks", price: 6_000_000, xpPoints: 60, tier: "pro", category: "dashboard", parentId: null },
      ],
      seo: [
        { id: "ads", label: "Quản lý Google Ads", labelEn: "Google Ads", price: 3_000_000, xpPoints: 30, tier: "basic", category: "seo", parentId: null },
        { id: "content", label: "Content marketing (4 bài/tháng)", labelEn: "Content (4 posts/month)", price: 4_000_000, xpPoints: 40, tier: "basic", category: "seo", parentId: null },
        { id: "social", label: "Social media management", labelEn: "Social Media", price: 2_500_000, xpPoints: 25, tier: "basic", category: "seo", parentId: null },
      ],
    },
    addons: [
      { id: "hosting", slug: "hosting", label: "Hosting & Domain 1 năm", labelEn: "Hosting & Domain 1yr", desc: "", icon: null, type: "addon", price: 3_000_000, billingPeriod: "yearly" },
      { id: "maintenance", slug: "maintenance", label: "Bảo trì & cập nhật 1 năm", labelEn: "Maintenance 1yr", desc: "", icon: null, type: "addon", price: 5_000_000, billingPeriod: "yearly" },
      { id: "analytics-setup", slug: "analytics-setup", label: "Setup Google Analytics 4", labelEn: "GA4 Setup", desc: "", icon: null, type: "addon", price: 1_500_000, billingPeriod: null },
      { id: "training", slug: "training", label: "Training (3 buổi)", labelEn: "Training (3 sessions)", desc: "", icon: null, type: "addon", price: 2_000_000, billingPeriod: null },
      { id: "priority", slug: "priority", label: "Priority support 24/7 (6 tháng)", labelEn: "Priority 24/7 (6mo)", desc: "", icon: null, type: "addon", price: 4_500_000, billingPeriod: "6monthly" },
    ],
    lpRate: {
      lpPerVnd: 500,
      vndPerLp: 2,
      maxDiscountPercent: 20,
      lpEarnPerMillion: 50,
    },
  };
}
