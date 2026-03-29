/**
 * LOOP Solutions — Booking Service
 * Wizard pricing config + price calculation + quote submission
 *
 * BE endpoints:
 * GET  /api/pricing/config        → full wizard config (services, packages, features, addons, LP rate)
 * POST /api/pricing/calculate     → real-time price calculation (custom web)
 * POST /api/pricing/quote         → submit wizard → create QuoteRequest
 * POST /api/admin/orders/[id]/demo → send demo link for an order
 */
import { api } from "./client";

// ─── BE → FE Types ─────────────────────────────────────────────────────────────

/** Wizard service (Step 1) — from pricing config */
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

/** Wizard package (Step 2) — from pricing config */
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

/** Wizard feature (Step 3) — from pricing config */
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

/** Feature grouped by category for UI */
export interface WizardFeatureCategory {
  category: string;
  features: WizardFeature[];
}

/** Wizard addon (Step 6) — from pricing config */
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

/** Infrastructure tier (Custom orders) */
export interface WizardInfraTier {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  desc: string;
  monthlyCost: number;
  setupCost: number;
  icon: string | null;
  color: string | null;
}

/** LP economy config */
export interface LpRateConfig {
  lpPerVnd: number;      // 500 (1 VND = 500 LP)
  vndPerLp: number;      // 2 (1 LP = 500 VND → 1000 LP = 500,000 VND)
  maxDiscountPercent: number; // 20
  lpEarnPerMillion: number; // 50
}

/** Full pricing config from BE */
export interface PricingConfig {
  basePrice: number;
  sampleXp: number;
  sampleRewardLevel: number;
  packages: WizardPackage[];
  features: WizardFeature[];
  featuresByCategory: Record<string, WizardFeature[]>;
  addons: WizardAddon[];
  infraTiers: WizardInfraTier[];
  lpRate: LpRateConfig;
  packageLps: Record<string, number>;
  meta: { cached: boolean; revalidateSeconds: number };
}

/** Price calculation result (from POST /api/pricing/calculate) */
export interface PriceCalculation {
  basePrice: number;
  featureTotal: number;
  infraCost: number;
  infraSetupCost: number;
  systemPrice: number;
  totalXp: number;
  rewardLevel: number;
  rewards: Array<{
    addonServiceId: string;
    addonServiceName: string;
    addonServiceNameVi: string;
    rewardLevel: number;
    quantity: number;
    durationMonths: number | null;
    description: string | null;
  }>;
  finalPrice: number;
  validatedFeatureIds: string[];
  infraTier: WizardInfraTier | null;
}

/** Quote item sent to BE */
export interface QuoteItem {
  featureId: string;
  featureName: string;
  variantId: string;
  variantName: string;
  price: number;
}

/** Quote submission payload */
export interface QuoteSubmitData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  selectedItems: QuoteItem[];
  totalAmount: number;
  notes?: string;
}

/** Quote result returned from BE */
export interface QuoteResult {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  companyName: string | null;
  selectedItems: QuoteItem[];
  totalAmount: number;
  notes: string | null;
  status: string;
  createdAt: string;
  message: string;
}

/** Demo link result */
export interface DemoResult {
  demoId: string;
  maskedUrl: string;
  clientToken: string;
  figmaUrl: string;
  sent: boolean;
  message: string;
}

// ─── LP Calculation Helpers ─────────────────────────────────────────────────────

/**
 * LP ↔ VND conversion using BE config.
 * Rate: 1,000 LP = 500,000 VND → 1 LP = 500 VND
 *
 * LP Discount rules:
 * - Max discount: 20% of order total
 * - Cannot redeem more LP than balance
 */
export function calcLpToVnd(lp: number, lpRate: LpRateConfig): number {
  return Math.floor(lp / lpRate.vndPerLp) * lpRate.vndPerLp * lpRate.lpPerVnd;
}

export function calcVndToLp(vnd: number, lpRate: LpRateConfig): number {
  return Math.floor(vnd / (lpRate.vndPerLp * lpRate.lpPerVnd)) * lpRate.vndPerLp;
}

/**
 * Calculate LP discount amount.
 * Returns the VND amount discounted, and the LP amount used.
 */
export function calcLpDiscount(
  subtotal: number,
  lpToRedeem: number,
  lpBalance: number,
  lpRate: LpRateConfig
): { lpUsed: number; vndDiscount: number; error?: string } {
  // Step 1: Cap LP at available balance
  const lpCapped = Math.min(lpToRedeem, lpBalance);
  if (lpToRedeem > lpBalance) {
    return { lpUsed: lpCapped, vndDiscount: 0, error: `Số dư LP không đủ. Tối đa: ${lpBalance.toLocaleString()} LP` };
  }

  // Step 2: Convert LP → VND
  const vndFromLp = calcLpToVnd(lpCapped, lpRate);

  // Step 3: Cap discount at 20% of subtotal
  const maxDiscount = subtotal * (lpRate.maxDiscountPercent / 100);
  const vndDiscount = Math.min(vndFromLp, maxDiscount);

  if (vndFromLp > maxDiscount) {
    // LP exceeds 20% cap — use only what covers the cap
    const lpNeeded = Math.ceil((maxDiscount / lpRate.lpPerVnd) * lpRate.vndPerLp);
    return { lpUsed: lpNeeded, vndDiscount: maxDiscount };
  }

  return { lpUsed: lpCapped, vndDiscount };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const bookingService = {
  /**
   * GET /api/pricing/config?lang={locale}
   * Returns full wizard config: packages, features, addons, infra tiers, LP rate.
   * Called once on wizard mount (cached by BE for 5 min).
   * Locale-aware: service names, package labels, feature names localized.
   * Fallback: BE returns VI when field for requested locale is null.
   *
   * @param lang - locale code: vi | en | ja | ko | zh  (default: vi)
   */
  getPricingConfig: async (lang: string = 'vi'): Promise<PricingConfig> => {
    const res = await api.get<{ data: PricingConfig }>(`/pricing/config?lang=${lang}`);
    return res.data;
  },

  /**
   * POST /api/pricing/calculate
   * Real-time price calculation for Custom Web orders.
   * Used when user changes features or infra tier.
   */
  calculatePrice: async (params: {
    selectedFeatureIds?: string[];
    infraTierSlug?: string;
  }): Promise<PriceCalculation> => {
    const res = await api.post<{ data: PriceCalculation }>("/pricing/calculate", params);
    return res.data;
  },

  /**
   * POST /api/pricing/quote
   * Submit wizard configuration → creates QuoteRequest in BE.
   * Returns order number for display in success state.
   */
  submitQuote: async (data: QuoteSubmitData): Promise<QuoteResult> => {
    const res = await api.post<{ data: QuoteResult; message: string }>(
      "/pricing/quote",
      data
    );
    return {
      ...res.data,
      message: res.message ?? "Yêu cầu đã được gửi thành công!",
    };
  },

  /**
   * POST /api/admin/orders/[id]/demo
   * Send demo link for an order.
   */
  sendDemo: async (
    orderId: string,
    data: { figmaUrl: string; note?: string; maskedUrl?: string }
  ): Promise<DemoResult> => {
    const res = await api.post<{ data: DemoResult }>(
      `/admin/orders/${orderId}/demo`,
      data
    );
    return res.data;
  },

  /**
   * GET /api/admin/orders/[id]/demo
   * Get demo links for an order.
   */
  getDemos: async (
    orderId: string
  ): Promise<
    Array<{
      id: string;
      title: string;
      figmaUrl: string;
      clientToken: string;
      status: string;
      note: string | null;
      createdAt: string;
      sentAt: string | null;
      approvedAt: string | null;
    }>
  > => {
    const res = await api.get<{ data: unknown[] }>(`/admin/orders/${orderId}/demo`);
    return res.data as never;
  },
};
