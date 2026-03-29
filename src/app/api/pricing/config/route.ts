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

export const revalidate = 300;

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

function mapPackage(p: {
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
}, locale: Locale) {
  return {
    id: p.id,
    slug: p.slug,
    name: getLocalizedName(locale, p.title, p.title, p.titleEn, p.titleJa, p.titleKo, p.titleZh),
    desc: getLocalizedName(locale, p.shortDesc, p.shortDesc, p.shortDescEn, p.shortDescJa, p.shortDescKo, p.shortDescZh),
    priceText: p.priceText ?? (p.price ? `${(p.price / 1_000_000).toFixed(0)} triệu` : "Liên hệ báo giá"),
    price: p.price,
    multiplier: p.price ? Math.round((p.price / 3_000_000) * 10) / 10 : 1,
    features: p.features ?? [],
    type: p.type,
    isSubscription: p.isSubscription,
    billingPeriod: p.billingPeriod,
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

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = normalizeLocale(searchParams.get("lang"));

    // Run all DB queries in parallel
    const [packages, features, addons, infraTiers, basePriceSetting] = await Promise.all([
      // Service packages
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
        },
      }),

      // Features (for calculator step)
      prisma.serviceAttribute.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          nameVi: true,
          nameEn: true,
          nameJa: true,
          nameKo: true,
          nameZh: true,
          category: true,
          categoryVi: true,
          categoryEn: true,
          categoryJa: true,
          categoryKo: true,
          categoryZh: true,
          tier: true,
          price: true,
          xpPoints: true,
          parentId: true,
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

      // Base price setting
      prisma.siteSetting.findUnique({
        where: { key: "custom_web_base_price" },
        select: { value: true },
      }),
    ]);

    const basePrice = basePriceSetting ? parseInt(basePriceSetting.value, 10) : 3_000_000;

    // Sample calculation for reference (no features selected)
    const sampleCalc = await calculateOrderPrice({ selectedFeatureIds: [] });

    // Group features by localized category (use raw category field as group key)
    const featuresByCategory = features.reduce<Record<string, typeof features>>((acc, f) => {
      const cat = f.categoryVi || f.category || "Khác";
      if (!acc[cat]) acc[cat] = [];
      acc[cat]!.push(f);
      return acc;
    }, {});

    // Map with locale-aware fields
    const wizardPackages = packages.map((p) => mapPackage(p, locale));
    const wizardFeatures = features.map((f) => mapFeature(f, locale));
    const wizardAddons = addons.map((a) => mapAddon(a, locale));
    const wizardInfraTiers = infraTiers.map((t) => mapInfraTier(t, locale));

    // Group localized features by localized category key
    const localizedFeaturesByCategory = Object.fromEntries(
      Object.entries(featuresByCategory).map(([catKey, feats]) => [
        catKey,
        feats.map((f) => mapFeature(f, locale)),
      ])
    );

    return ok(
      {
        basePrice,
        sampleXp: sampleCalc.totalXp,
        sampleRewardLevel: sampleCalc.rewardLevel,
        packages: wizardPackages,
        features: wizardFeatures,
        featuresByCategory: localizedFeaturesByCategory,
        addons: wizardAddons,
        infraTiers: wizardInfraTiers,
        lpRate: {
          lpPerVnd: 500,
          vndPerLp: 2,
          maxDiscountPercent: 20,
          lpEarnPerMillion: 50,
        },
        packageLps: packages.reduce<Record<string, number>>((acc, p) => {
          acc[p.slug] = p.isSubscription ? 30 : 50;
          return acc;
        }, {}),
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
