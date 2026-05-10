/**
 * GET /api/pricing/config?lang={locale}
 *
 * Returns all wizard data needed by the FE BookingWizardPage.
 * Supports 5 locales: vi (default), en, ja, ko, zh.
 * Fallback: missing locale field → returns Vietnamese (vi) value.
 *
 * Cached for 5 minutes (revalidate = 300).
 */

export const dynamic = "force-dynamic";

import { ok, serverError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { calculateOrderPrice } from "@/lib/pricing/calculate-order-price";

export const revalidate = 0; // Disable cache to always fetch fresh DB data

// ── Locale types ───────────────────────────────────────────────────────────────

const SUPPORTED_LOCALES = ["vi", "en", "ja", "ko", "zh"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function normalizeLocale(locale: string | null): Locale {
  if (locale && SUPPORTED_LOCALES.includes(locale as Locale)) {
    return locale as Locale;
  }
  return "vi";
}

// ── Per-locale field getter ────────────────────────────────────────────────────
// Explicit if-else avoids TS7053 template-literal-indexing errors on Prisma types.

function getLocalizedName(
  locale: Locale,
  base: string,
  vi?: string | null,
  en?: string | null,
  ja?: string | null,
  ko?: string | null,
  zh?: string | null
): string {
  if (locale === "en") return en ?? vi ?? base;
  if (locale === "ja") return ja ?? vi ?? base;
  if (locale === "ko") return ko ?? vi ?? base;
  if (locale === "zh") return zh ?? vi ?? base;
  return vi ?? base;
}

// ── Mapping helpers ────────────────────────────────────────────────────────────

/**
 * Maps a DB ServicePackage to WizardPackage.
 * allFeatures = deduplicated union of all features from this package and all packages
 * before it in sortOrder. This enables the FE comparison table to show which
 * features are NEW in each tier.
 */
function mapPackage(
  p: {
    id: string;
    slug: string;
    title: string;
    titleEn?: string | null;
    titleJa?: string | null;
    titleKo?: string | null;
    titleZh?: string | null;
    shortDesc: string;
    shortDescEn?: string | null;
    shortDescJa?: string | null;
    shortDescKo?: string | null;
    shortDescZh?: string | null;
    price: number | null;
    priceText?: string | null;
    features: string[];
    type: string;
    isSubscription: boolean;
    billingPeriod?: string | null;
    sortOrder: number;
    videoUrl?: string | null;
    videoThumbnail?: string | null;
    showFeatureAcknowledge?: boolean;
    acknowledgmentItems?: unknown;
    // Admin-managed fields
    isPopular?: boolean | null;
    tagline?: string | null;
    color?: string | null;
    pages?: string | null;
    pagesVi?: string | null;
    marketPrice?: number | null;
    serviceKey?: string | null;
    tierLevel?: number | null;
    lpReward?: number | null;
  },
  locale: Locale,
  marketPrices: Record<string, number>,
  allPackages: typeof arguments[0][],
) {
  const pkgPrice = p.price ?? 0;
  const marketPrice = marketPrices[p.slug] ?? pkgPrice;
  const saving = marketPrice - pkgPrice;

  // Compute allFeatures: union of features up to and including this package
  const allFeatures = [...new Set(
    allPackages
      .filter((other: typeof allPackages[number]) => other.sortOrder <= p.sortOrder)
      .flatMap((other: typeof allPackages[number]) => other.features ?? [])
  )];

  // Parse acknowledgment items from JSON
  const ackItems = (p.acknowledgmentItems ?? []) as {
    key: string;
    ackLabel: string;
    ackLabelEn?: string;
    icon?: string;
    sortOrder?: number;
  }[];

  // Build featureAcknowledgments map keyed by feature label
  const featureAcknowledgments: Record<string, (typeof ackItems)[0]> = {};
  for (const item of ackItems) {
    featureAcknowledgments[item.key] = item;
  }

  return {
    id: p.id,
    slug: p.slug,
    name: getLocalizedName(locale, p.title, p.title, p.titleEn, p.titleJa, p.titleKo, p.titleZh),
    desc: getLocalizedName(locale, p.shortDesc, p.shortDesc, p.shortDescEn, p.shortDescJa, p.shortDescKo, p.shortDescZh),
    priceText: p.priceText ?? (pkgPrice > 0 ? `${(pkgPrice / 1_000_000).toFixed(0)} triệu` : "Liên hệ báo giá"),
    price: pkgPrice,
    multiplier: 1,
    features: p.features ?? [],
    /** All features up to this tier (inclusive) */
    allFeatures,
    type: p.type,
    isSubscription: p.isSubscription,
    billingPeriod: p.billingPeriod,
    marketPrice,
    savingPct: saving > 0 ? Math.round((saving / marketPrice) * 100) : 0,
    /** Video & acknowledgment fields */
    videoUrl: p.videoUrl ?? null,
    videoThumbnail: p.videoThumbnail ?? null,
    showFeatureAcknowledge: p.showFeatureAcknowledge ?? true,
    acknowledgmentItems: ackItems,
    featureAcknowledgments,
    /** Admin-managed fields from ServicePackage */
    isPopular: p.isPopular ?? false,
    tagline: p.tagline ?? null,
    color: p.color ?? null,
    pages: p.pages ?? null,
    pagesVi: p.pagesVi ?? null,
    serviceKey: p.serviceKey ?? null,
    tierLevel: p.tierLevel ?? 1,
  };
}

function mapFeature(f: {
  id: string;
  name: string;
  nameVi: string;
  nameEn?: string | null;
  nameJa?: string | null;
  nameKo?: string | null;
  nameZh?: string | null;
  category: string;
  categoryVi: string;
  categoryEn?: string | null;
  categoryJa?: string | null;
  categoryKo?: string | null;
  categoryZh?: string | null;
  price: number;
  xpPoints: number;
  tier: string;
  parentId?: string | null;
  includedInBase: boolean;
  isUpgradeable?: boolean;
  description?: string | null;
  descriptionVi?: string | null;
}, locale: Locale) {
  return {
    id: f.id,
    label: getLocalizedName(locale, f.name, f.nameVi, f.nameEn, f.nameJa, f.nameKo, f.nameZh),
    labelEn: f.nameEn ?? f.nameVi ?? f.name,
    price: f.price,
    xpPoints: f.xpPoints,
    tier: f.tier,
    category: getLocalizedName(locale, f.category, f.categoryVi, f.categoryEn, f.categoryJa, f.categoryKo, f.categoryZh),
    categoryEn: f.categoryEn ?? f.categoryVi ?? f.category,
    parentId: f.parentId,
    includedInBase: f.includedInBase,
    /** True = đây là phiên bản nâng cấp từ parent (VD: advanced search thay basic search) */
    isUpgradeable: f.isUpgradeable ?? false,
    /** Plain-language Vietnamese description — non-tech customers */
    description: f.descriptionVi ?? f.description ?? "",
  };
}

function mapAddon(a: {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  nameEn?: string | null;
  nameJa?: string | null;
  nameKo?: string | null;
  nameZh?: string | null;
  description?: string | null;
  descriptionVi?: string | null;
  descriptionEn?: string | null;
  descriptionJa?: string | null;
  descriptionKo?: string | null;
  descriptionZh?: string | null;
  icon?: string | null;
  type: string;
  price: number;
  billingPeriod?: string | null;
}, locale: Locale) {
  return {
    id: a.id,
    slug: a.slug,
    label: getLocalizedName(locale, a.name, a.nameVi, a.nameEn, a.nameJa, a.nameKo, a.nameZh),
    labelEn: a.nameEn ?? a.nameVi ?? a.name,
    desc: getLocalizedName(locale, a.description ?? "", a.description, a.descriptionEn, a.descriptionJa, a.descriptionKo, a.descriptionZh),
    icon: a.icon,
    type: a.type,
    price: a.price,
    billingPeriod: a.billingPeriod,
  };
}

function mapInfraTier(t: {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  nameEn?: string | null;
  nameJa?: string | null;
  nameKo?: string | null;
  nameZh?: string | null;
  description?: string | null;
  descriptionVi?: string | null;
  descriptionEn?: string | null;
  descriptionJa?: string | null;
  descriptionKo?: string | null;
  descriptionZh?: string | null;
  monthlyCost: number;
  setupCost: number;
  icon?: string | null;
  color?: string | null;
}, locale: Locale) {
  return {
    id: t.id,
    slug: t.slug,
    name: getLocalizedName(locale, t.name, t.nameVi, t.nameEn, t.nameJa, t.nameKo, t.nameZh),
    nameEn: t.nameEn ?? t.nameVi ?? t.name,
    desc: getLocalizedName(locale, t.description ?? "", t.description, t.descriptionEn, t.descriptionJa, t.descriptionKo, t.descriptionZh),
    monthlyCost: t.monthlyCost,
    setupCost: t.setupCost,
    icon: t.icon,
    color: t.color,
  };
}

function mapHostingPlan(h: {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  monthlyPrice: number;
  period: string;
  periodVi: string;
  months: number;
  discountPct: number;
  features: string[];
  featuresVi: string[];
  highlighted: boolean;
  color: string;
}, locale: Locale) {
  // Compute the actual plan price after discount
  const basePrice = h.monthlyPrice * h.months;
  const discountedPrice = h.discountPct > 0
    ? Math.round(basePrice * (1 - h.discountPct / 100))
    : basePrice;
  return {
    id: h.id,
    slug: h.slug,
    name: getLocalizedName(locale, h.name, h.nameVi, h.nameVi, h.nameVi, h.nameVi, h.nameVi),
    monthlyPrice: h.monthlyPrice,
    basePrice,          // monthlyPrice × months (before discount)
    discountedPrice,     // price after discountPct
    period: getLocalizedName(locale, h.period, h.periodVi, h.periodVi, h.periodVi, h.periodVi, h.periodVi),
    periodVi: h.periodVi,
    months: h.months,
    discountPct: h.discountPct,
    features: getLocalizedName(locale, h.features.join("; "), h.featuresVi.join("; "), h.featuresVi.join("; "), h.featuresVi.join("; "), h.featuresVi.join("; "), h.featuresVi.join("; ")).split("; "),
    highlighted: h.highlighted,
    color: h.color,
  };
}

function mapDomainPrice(d: {
  id: string;
  extension: string;
  registrationPrice: number;
  renewalPrice: number;
  period: string;
  periodVi: string;
  note?: string | null;
  noteVi?: string | null;
  isAvailable: boolean;
}, locale: Locale) {
  return {
    id: d.id,
    extension: d.extension.startsWith('.') ? d.extension : `.${d.extension}`,
    registrationPrice: d.registrationPrice,
    renewalPrice: d.renewalPrice,
    period: getLocalizedName(locale, d.period, d.periodVi, d.periodVi, d.periodVi, d.periodVi, d.periodVi),
    periodVi: d.periodVi,
    note: getLocalizedName(locale, d.note ?? "", d.note ?? "", d.note ?? "", d.note ?? "", d.note ?? "", d.note ?? ""),
    noteVi: d.noteVi ?? d.note ?? "",
    isAvailable: d.isAvailable,
  };
}

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = normalizeLocale(searchParams.get("lang"));
    const email = searchParams.get("email");

    // ── Run all DB queries in parallel ──────────────────────────────────────────
    const [
      packages, features, addons, infraTiers, hostingPlans, domainPrices,
      basePriceSetting, vatSetting, websitePricingConfig, lpRateSetting,
      customerLp, freebiesSetting, seoTiers, seoFeatures, seoMatrix,
      webFeatureGroups,
    ] = await Promise.all([
      prisma.servicePackage.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          slug: true,
          title: true,
          titleEn: true,
          titleJa: true,
          titleKo: true,
          titleZh: true,
          shortDesc: true,
          shortDescEn: true,
          shortDescJa: true,
          shortDescKo: true,
          shortDescZh: true,
          price: true,
          priceText: true,
          features: true,
          isSubscription: true,
          billingPeriod: true,
          type: true,
          sortOrder: true,
          videoUrl: true,
          videoThumbnail: true,
          showFeatureAcknowledge: true,
          acknowledgmentItems: true,
          isPopular: true,
          tagline: true,
          color: true,
          pages: true,
          pagesVi: true,
          marketPrice: true,
          serviceKey: true,
          tierLevel: true,
        },
      }),

      // Features (for calculator step)
      prisma.serviceAttribute.findMany({
        where: { isActive: true },
        select: {
          id: true, name: true, nameVi: true, nameEn: true,
          nameJa: true, nameKo: true, nameZh: true,
          category: true, categoryVi: true, categoryEn: true,
          categoryJa: true, categoryKo: true, categoryZh: true,
          tier: true, price: true, xpPoints: true,
          parentId: true, includedInBase: true, isUpgradeable: true,
          description: true, descriptionVi: true,
        },
        orderBy: [{ category: "asc" }, { tier: "asc" }, { name: "asc" }],
      }),

      // Addons (Step 6)
      prisma.addonService.findMany({
        where: { isActive: true },
        select: {
          id: true,
          slug: true,
          name: true,
          nameVi: true,
          nameEn: true,
          nameJa: true,
          nameKo: true,
          nameZh: true,
          description: true,
          descriptionVi: true,
          descriptionEn: true,
          descriptionJa: true,
          descriptionKo: true,
          descriptionZh: true,
          icon: true,
          type: true,
          price: true,
          billingPeriod: true,
        },
        orderBy: { sortOrder: "asc" },
      }),

      // Infrastructure tiers
      prisma.infrastructureTier.findMany({
        where: { isActive: true },
        select: {
          id: true,
          slug: true,
          name: true,
          nameVi: true,
          nameEn: true,
          nameJa: true,
          nameKo: true,
          nameZh: true,
          description: true,
          descriptionVi: true,
          descriptionEn: true,
          descriptionJa: true,
          descriptionKo: true,
          descriptionZh: true,
          monthlyCost: true,
          setupCost: true,
          icon: true,
          color: true,
        },
        orderBy: { sortOrder: "asc" },
      }),

      // Hosting plans
      prisma.pricingHostingPlan.findMany({
        where: { isActive: true },
        select: {
          id: true,
          slug: true,
          name: true,
          nameVi: true,
          monthlyPrice: true,
          period: true,
          periodVi: true,
          months: true,
          discountPct: true,
          features: true,
          featuresVi: true,
          highlighted: true,
          color: true,
        },
        orderBy: { sortOrder: "asc" },
      }),

      // Domain prices
      prisma.pricingDomainPrice.findMany({
        where: { isActive: true },
        select: {
          id: true,
          extension: true,
          registrationPrice: true,
          renewalPrice: true,
          period: true,
          periodVi: true,
          note: true,
          noteVi: true,
          isAvailable: true,
        },
        orderBy: { sortOrder: "asc" },
      }),

      // Base price setting
      prisma.siteSetting.findUnique({
        where: { key: "custom_web_base_price" },
        select: { value: true },
      }),

      // VAT rate setting
      prisma.siteSetting.findUnique({
        where: { key: "vat_rate" },
        select: { value: true },
      }),

      // Website marketing pricing config (market prices, anchors, promotions)
      prisma.siteSetting.findUnique({
        where: { key: "website_pricing_config" },
        select: { value: true },
      }),

      // LP rate config (fallback to 1000 LP = 1M VND if not set)
      prisma.siteSetting.findUnique({
        where: { key: "lp_rate_config" },
        select: { value: true },
      }),

      // Customer LP balance lookup by email (public — no auth required on wizard)
      email ? prisma.customerPoint.findUnique({
        where: { userEmail: email },
        select: { balance: true, totalEarned: true, totalSpent: true, level: true },
      }) : Promise.resolve(null),
      prisma.siteSetting.findUnique({ where: { key: "package_freebies" }, select: { value: true } }),

      // SEO tiers (ServiceTier where serviceKey = "seo")
      prisma.serviceTier.findMany({
        where: { serviceKey: "seo", isActive: true },
        orderBy: { sortOrder: "asc" },
      }),

      // SEO features (ServiceAttribute where serviceKey = "seo")
      prisma.serviceAttribute.findMany({
        where: { serviceKey: "seo", isActive: true },
        orderBy: { sortOrder: "asc" },
      }),

      // SEO feature matrix from SiteSetting
      prisma.siteSetting.findUnique({
        where: { key: "seo_feature_matrix" },
        select: { value: true },
      }),

      // Web features: FeatureGroup + Feature where serviceKey = "web"
      prisma.featureGroup.findMany({
        where: { isActive: true, serviceKey: "web" },
        orderBy: { sortOrder: "asc" },
        include: {
          features: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      }),
    ]);

    const basePrice = basePriceSetting ? parseInt(basePriceSetting.value, 10) : 3_000_000;
    const vatRate = vatSetting ? parseFloat(vatSetting.value) : 0.10;
    const lpToVnd = lpRateSetting ? (JSON.parse(lpRateSetting.value).lp_to_vnd ?? 1000) : 1000;
    const lpEarnPerMillion = Math.ceil(1_000_000 * 0.10 / lpToVnd);

    // Package freebies
    let packageFreebies: Record<string, { hosting?: string; domain?: string[]; note: string }> = {};
    if (freebiesSetting?.value) {
      try { packageFreebies = JSON.parse(freebiesSetting.value); } catch { }
    }

    // SEO tiers — map to wizard format (no includedTiers needed for tiers themselves)
    const wizardSeoTiers = (seoTiers ?? []).map((t: typeof seoTiers[number]) => ({
      level: t.level,
      name: getLocalizedName(locale, t.name, t.name, t.nameEn, t.nameJa, t.nameKo, t.nameZh),
      nameEn: t.nameEn ?? t.name,
      shortDesc: getLocalizedName(
        locale,
        t.shortDesc ?? "",
        t.shortDesc ?? "",
        t.shortDescEn ?? t.shortDesc ?? "",
        t.shortDescJa ?? t.shortDesc ?? "",
        t.shortDescKo ?? t.shortDesc ?? "",
        t.shortDescZh ?? t.shortDesc ?? ""
      ),
      basePrice: t.basePrice,
      marketPrice: t.marketPrice ?? undefined,
      lpReward: t.lpReward,
    }));

    // SEO feature matrix — override includedTiers per feature from SiteSetting
    let seoFeatureMatrix: Record<string, number[]> = {};
    if (seoMatrix?.value) {
      try { seoFeatureMatrix = JSON.parse(seoMatrix.value); } catch { }
    }

    // SEO features — includedTiers from SiteSetting matrix
    const wizardSeoFeatures = (seoFeatures ?? []).map((f: typeof seoFeatures[number]) => ({
      id: f.id,
      label: getLocalizedName(locale, f.name, f.nameVi, f.nameEn, f.nameJa, f.nameKo, f.nameZh),
      labelEn: f.nameEn ?? f.nameVi ?? f.name,
      description: f.descriptionVi ?? f.description ?? "",
      category: getLocalizedName(locale, f.category, f.categoryVi, f.categoryEn, f.categoryJa, f.categoryKo, f.categoryZh),
      extraPrice: f.price > 0 ? f.price : undefined,
      includedTiers: seoFeatureMatrix[f.id] ?? [],
    }));

    // Parse website marketing pricing config
    // Expected shape:
    // {
    //   "marketPrices": { "basic": 5500000, "business": 8900000, "experience": 12000000 },
    //   "promotion": { "active": true, "label": "Giảm 20%", "expiresAt": "2026-04-30" },
    //   "slotsLeft": 3,
    // }
    let websitePricing: {
      marketPrices: Record<string, number>;
      promotion?: { active: boolean; label: string; expiresAt?: string };
      slotsLeft?: number;
    } = { marketPrices: {} };
    if (websitePricingConfig?.value) {
      try {
        websitePricing = JSON.parse(websitePricingConfig.value);
      } catch {
        // ignore malformed JSON — use empty defaults
      }
    }
    const { marketPrices, promotion, slotsLeft } = websitePricing;

    // Look up ClientVipStatus for the customer (G3 — returns discount cap for wizard UI)
    const customerVip = email ? await prisma.clientVipStatus.findUnique({
      where: { userEmail: email },
      select: { tier: true, totalSpending: true, vipPoints: true },
    }) : null;

    // VIP tier → discount cap (regular=10%, vip1=15%, vip2=20%, vip3=25%)
    const VIP_DISCOUNT_CAPS: Record<string, number> = {
      regular: 10, vip1: 15, vip2: 20, vip3: 25,
    };
    const vipTier = customerVip?.tier ?? "regular";
    const maxDiscountPct = VIP_DISCOUNT_CAPS[vipTier] ?? 10;

    // Sample calculation for reference (no features selected)
    const sampleCalc = await calculateOrderPrice({ selectedFeatureIds: [] });

    // Group features by localized category (use raw category field as group key)
    const featuresByCategory = features.reduce<Record<string, typeof features>>((acc: Record<string, typeof features>, f: typeof features[number]) => {
      const cat = f.categoryVi || f.category || "Khác";
      if (!acc[cat]) acc[cat] = [];
      acc[cat]!.push(f);
      return acc;
    }, {});

    // Map with locale-aware fields — mapPackage gets marketPrices for anchor display
    const wizardPackages = packages.map((p: typeof packages[number]) => mapPackage(p, locale, marketPrices, packages));
    // Deduplicate packages by slug
    const uniqueWizardPackages = wizardPackages.filter((p: typeof wizardPackages[number], i, self) => i === self.findIndex((t: typeof wizardPackages[number]) => t.slug === p.slug));

    const wizardFeatures = features.map((f: typeof features[number]) => mapFeature(f, locale));
    // Deduplicate features by id
    const uniqueWizardFeatures = wizardFeatures.filter((f: typeof wizardFeatures[number], i, self) => i === self.findIndex((t: typeof wizardFeatures[number]) => t.id === f.id));

    const wizardAddons = addons.map((a: typeof addons[number]) => mapAddon(a, locale));
    // Deduplicate addons by slug
    const uniqueWizardAddons = wizardAddons.filter((a: typeof wizardAddons[number], i, self) => i === self.findIndex((t: typeof wizardAddons[number]) => t.slug === a.slug));

    const wizardInfraTiers = infraTiers.map((t: typeof infraTiers[number]) => mapInfraTier(t, locale));
    // Deduplicate infra tiers by slug
    const uniqueWizardInfraTiers = wizardInfraTiers.filter((t: typeof wizardInfraTiers[number], i, self) => i === self.findIndex((x: typeof wizardInfraTiers[number]) => x.slug === t.slug));

    const wizardHostingPlans = hostingPlans.map((h: typeof hostingPlans[number]) => mapHostingPlan(h, locale));
    // Deduplicate hosting plans by slug
    const uniqueWizardHostingPlans = wizardHostingPlans.filter((h: typeof wizardHostingPlans[number], i, self) => i === self.findIndex((t: typeof wizardHostingPlans[number]) => t.slug === h.slug));

    // Deduplicate domain prices by extension (take the first one found)
    const uniqueDomainPrices: typeof domainPrices = [];
    const seenExtensions = new Set<string>();
    for (const d of domainPrices) {
      if (!seenExtensions.has(d.extension)) {
        seenExtensions.add(d.extension);
        uniqueDomainPrices.push(d);
      }
    }
    const wizardDomainPrices = uniqueDomainPrices.map((d: typeof uniqueDomainPrices[number]) => mapDomainPrice(d, locale));

    // Group localized features by localized category key
    const localizedFeaturesByCategory = Object.fromEntries(
      Object.entries(featuresByCategory).map(([catKey, feats]: [string, typeof features]) => [
        catKey,
        feats.map((f: typeof features[number]) => mapFeature(f, locale)).filter((f, i, self) => i === self.findIndex((t: ReturnType<typeof mapFeature>) => t.id === f.id)),
      ])
    );

    // Deduplicate SEO tiers by level
    const uniqueSeoTiers = wizardSeoTiers.filter((t: typeof wizardSeoTiers[number], i, self) => i === self.findIndex((x: typeof wizardSeoTiers[number]) => x.level === t.level));
    // Deduplicate SEO features by id
    const uniqueSeoFeatures = wizardSeoFeatures.filter((f: typeof wizardSeoFeatures[number], i, self) => i === self.findIndex((x: typeof wizardSeoFeatures[number]) => x.id === f.id));



    // Build wizardWebFeatures from FeatureGroup + Feature DB data
    // Shape matches WebPackageFeature interface used by BookingWizardClient
    const wizardWebFeatures = (webFeatureGroups ?? []).flatMap((group: typeof webFeatureGroups[number]) =>
      group.features.map((f: typeof group.features[number]) => ({
        id: f.id,
        label: getLocalizedName(locale, f.featureName, f.featureName, f.featureName, f.featureName, f.featureName, f.featureName),
        labelEn: f.featureName,
        description: f.description ?? "",
        category: f.category,
        extraPrice: (f.extraPrice && f.extraPrice > 0) ? f.extraPrice : undefined,
        // Parse includedTiers from JSON — stored as Json field in DB
        includedTiers: (typeof f.includedTiers === "string"
          ? JSON.parse(f.includedTiers)
          : Array.isArray(f.includedTiers) ? f.includedTiers : []) as number[],
      }))
    );

    // Deduplicate Web features by id
    const uniqueWebFeatures = wizardWebFeatures.filter((f: typeof wizardWebFeatures[number], i, self) => i === self.findIndex((x: typeof wizardWebFeatures[number]) => x.id === f.id));

    return ok(
      {
        basePrice,
        sampleXp: sampleCalc.totalXp,
        sampleRewardLevel: sampleCalc.rewardLevel,
        packages: uniqueWizardPackages,
        features: uniqueWizardFeatures,
        featuresByCategory: localizedFeaturesByCategory,
        addons: uniqueWizardAddons,
        infraTiers: uniqueWizardInfraTiers,
        hostingPlans: uniqueWizardHostingPlans,
        domainPrices: wizardDomainPrices,
        lpRate: {
          lpPerVnd: lpToVnd,
          vndPerLp: Math.round(1_000 / lpToVnd),
          maxDiscountPercent: maxDiscountPct,
          lpEarnPerMillion,
        },
        /** Customer LP data — returned when email param is provided */
        customerLp: email && customerLp ? {
          balance: customerLp.balance,
          totalEarned: customerLp.totalEarned,
          totalSpent: customerLp.totalSpent,
          level: customerLp.level,
        } : null,
        /** VIP tier for this customer (G3) */
        customerVip: customerVip ?? null,
        packageLps: packages.reduce<Record<string, number>>((acc: Record<string, number>, p: typeof packages[number]) => {
          acc[p.slug] = p.isSubscription ? 30 : 50;
          return acc;
        }, {}),
        vatRate,
        /** Package freebies per slug */
        packageFreebies,
        /** Marketing data — loaded from SiteSetting "website_pricing_config" */
        marketing: {
          promotion: promotion?.active ? promotion : undefined,
          slotsLeft: slotsLeft ?? undefined,
        },
        /** SEO tiers + features — wired from DB (ServiceTier + ServiceAttribute serviceKey=seo) */
        seoTiers: uniqueSeoTiers,
        seoFeatures: uniqueSeoFeatures,
        /** Web features — loaded from FeatureGroup+Feature DB (serviceKey="web") */
        webFeatures: uniqueWebFeatures,
        meta: {
          locale,
          cached: true,
          revalidateSeconds: revalidate,
        },
      },
      200
    );
  } catch (error) {
    console.error("Failed to fetch pricing config:", error);
    return serverError();
  }
}
