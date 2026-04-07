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
  multiplier: number;
  color: string;
  desc: string;
  features: string[];
  lp: number;
  popular?: boolean;
  price?: number | null;
  priceText?: string;
  isSubscription?: boolean;
  billingPeriod?: string | null;
  type?: string;
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
  lpRate: LpRateConfig;
  packageLps: Record<string, number>;
  /** VAT rate (e.g. 0.10 = 10%). Falls back to 0.10 if SiteSetting not set. */
  vatRate: number;
  meta: {
    locale: string;
    cached: boolean;
    revalidateSeconds: number;
  };
}
