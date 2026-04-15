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

export interface PackageFreebie {
 type: "hosting" | "domain";
 label: string;
 detail?: string;
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
 marketPrice?: number;
 savingPct?: number;
 allFeatures?: string[];
 freebies?: PackageFreebie[];
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
 includedInBase?: boolean;
 isUpgradeable?: boolean;
 description: string;
 benefit?: string;
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
 basePrice: number;
 discountedPrice: number;
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
 lpPerVnd: number;
 vndPerLp: number;
 maxDiscountPercent: number;
 lpEarnPerMillion: number;
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
 vatRate: number;
 marketing?: {
 promotion?: { active: boolean; label: string; expiresAt?: string };
 slotsLeft?: number;
 };
 packageFreebies?: Record<string, { hosting?: string; domain?: string[]; note: string }>;
 meta: {
 locale: string;
 cached: boolean;
 revalidateSeconds: number;
 };
 customerLp?: {
 balance: number;
 totalEarned: number;
 totalSpent: number;
 level: number;
 } | null;
 customerVip?: {
 tier: string;
 totalSpending: number;
 vipPoints: number;
 } | null;
}
