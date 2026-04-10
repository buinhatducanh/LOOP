/**
 * Booking Wizard — shared types
 * Matches the shape returned by GET /api/pricing/config
 */

export interface WizardService {
  id: string;
  title: string;
  desc: string;
  basePrice: number;
  color: string;
  perMonth: boolean;
}

export interface WizardPackage {
  id: string;
  slug?: string;
  name: string;
  multiplier: number;      // deprecated — kept for backward compat
  color: string;
  desc: string;
  features: string[];
  lp: number;
  popular?: boolean;
  /** Real price from DB — use this instead of multiplier × basePrice */
  price?: number | null;
  priceText?: string;
  isSubscription?: boolean;
  billingPeriod?: string | null;
  type?: string;
  /** Market anchor price — strikethrough display for anchoring */
  marketPrice?: number;
  /** Saving vs market price percentage (0 if no market anchor) */
  savingPct?: number;
  /** All features up to this tier (inclusive) — for comparison table */
  allFeatures?: string[];
}

export interface WizardFeature {
  id: string;
  label: string;
  labelEn?: string;
  price: number;
  xpPoints?: number;
  tier?: string;
  category: string;
  categoryEn?: string;
  parentId?: string | null;
  /** true = bao gồm trong base price → hiển thị "✓ Đã bao gồm" */
  includedInBase?: boolean;
}

export interface WizardTalent {
  id: string;
  name: string;
  role: string;
  rank: string;
  rankColor: string;
  rankSymbol: string;
  img: string;
  specialty: string;
  level?: number;
}

export interface WizardExtra {
  id: string;
  slug?: string;
  label: string;
  labelEn?: string;
  desc?: string;
  price: number;
  icon?: string | null;
  type?: string;
  billingPeriod?: string | null;
  color?: string;
}

export interface WizardInfraTier {
  id: string;
  slug?: string;
  name: string;
  nameEn?: string;
  desc?: string;
  monthlyCost: number;
  setupCost: number;
  icon?: string | null;
  color?: string | null;
}

export interface WizardHostingPlan {
  id: string;
  slug: string;
  name: string;
  monthlyPrice: number;
  basePrice: number;         // monthlyPrice × months (before discount)
  discountedPrice: number;    // after discountPct
  period: string;
  months: number;
  discountPct: number;
  features: string[];
  highlighted: boolean;
  color: string;
}

export interface WizardDomainPrice {
  extension: string;
  registrationPrice: number;
  renewalPrice: number;
  period: string;
  periodVi: string;
  note: string;
  noteVi: string;
  isAvailable: boolean;
}

export interface LpRateConfig {
  lpPerVnd: number;       // LP earned per 1 VND spent (e.g. 500)
  vndPerLp: number;       // VND discount per 1 LP (e.g. 2)
  maxDiscountPercent: number; // max discount cap as percentage (e.g. 20)
  lpEarnPerMillion: number;   // LP earned per 1M VND spent
}

/** Full response from GET /api/pricing/config */
export interface PricingConfig {
  basePrice: number;
  sampleXp: number;
  sampleRewardLevel: number;
  packages: WizardPackage[];
  features: WizardFeature[];
  featuresByCategory: Record<string, WizardFeature[]>;
  addons: WizardExtra[];
  infraTiers: WizardInfraTier[];
  hostingPlans: WizardHostingPlan[];
  domainPrices: WizardDomainPrice[];
  lpRate: LpRateConfig;
  packageLps: Record<string, number>;
  /** VAT rate (e.g. 0.10 = 10%). Falls back to 0.10 if SiteSetting not set. */
  vatRate: number;
  /** Marketing data loaded from SiteSetting "website_pricing_config" */
  marketing?: {
    promotion?: { active: boolean; label: string; expiresAt?: string };
    slotsLeft?: number;
  };
  meta: {
    locale: string;
    cached: boolean;
    revalidateSeconds: number;
  };
  /** Customer LP data — returned when email param is provided */
  customerLp?: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
    level: number;
  } | null;
  /** VIP tier for this customer (G3) */
  customerVip?: {
    tier: string;
    totalSpending: number;
    vipPoints: number;
  } | null;
}
