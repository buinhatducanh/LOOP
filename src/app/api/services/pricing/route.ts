import { prisma } from "@/lib/prisma";

// ── Types ──────────────────────────────────────────────────────────────────────

export type ServiceTierAPI = {
  id: string;
  serviceKey: string;
  level: number;
  name: string;
  nameEn: string | null;
  shortDesc: string | null;
  basePrice: number;
  marketPrice: number | null;
  lpReward: number;
  sortOrder: number;
  isActive: boolean;
};

export type ServiceAttributeAPI = {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  category: string;
  categoryEn: string | null;
  price: number;
  tier: string;
  serviceKey: string | null;
  includedInBase: boolean;
};

export type ServicePricingResponse = {
  tiers: ServiceTierAPI[];
  features: Record<string, ServiceAttributeAPI[]>;
  meta: {
    locale: string;
    cached: boolean;
    revalidateSeconds: number;
  };
};

// ── Locale helpers ──────────────────────────────────────────────────────────────

function getLocalizedText(vi: string | null | undefined, en: string | null | undefined, locale: string): string {
  if (!locale || locale === "vi") return vi ?? "";
  if (locale === "en") return en ?? vi ?? "";
  return en ?? vi ?? "";
}

// ── GET /api/services/pricing?lang={locale}&serviceKey={optional} ─────────────

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("lang") ?? "vi";
    const serviceKeyFilter = searchParams.get("serviceKey");

    // Fetch all active service tiers
    const where: Record<string, unknown> = { isActive: true };
    if (serviceKeyFilter) where.serviceKey = serviceKeyFilter;

    const tiers = await prisma.serviceTier.findMany({
      where,
      orderBy: [{ serviceKey: "asc" }, { level: "asc" }],
    });

    // Fetch all active service attributes scoped to relevant serviceKeys
    const activeServiceKeys = serviceKeyFilter
      ? [serviceKeyFilter]
      : [...new Set(tiers.map(t => t.serviceKey))];

    const featureWhere: Record<string, unknown> = { isActive: true };
    if (activeServiceKeys.length > 0) {
      // Include shared (serviceKey=null) + matching serviceKey attributes
      featureWhere.OR = [
        { serviceKey: null },
        ...activeServiceKeys.map(sk => ({ serviceKey: sk })),
      ];
    }

    const attributes = await prisma.serviceAttribute.findMany({
      where: featureWhere,
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });

    // Group features by serviceKey
    const featuresByService: Record<string, ServiceAttributeAPI[]> = {};
    for (const attr of attributes) {
      const key = attr.serviceKey ?? "shared";
      if (!featuresByService[key]) featuresByService[key] = [];
      featuresByService[key].push({
        id: attr.id,
        slug: attr.slug,
        name: getLocalizedText(attr.nameVi, attr.nameEn, locale) || attr.name,
        nameEn: attr.nameEn,
        description: getLocalizedText(attr.descriptionVi, null, locale) ?? attr.description,
        category: getLocalizedText(attr.categoryVi, attr.categoryEn, locale) || attr.category,
        categoryEn: attr.categoryEn,
        price: attr.price,
        tier: attr.tier,
        serviceKey: attr.serviceKey,
        includedInBase: attr.includedInBase,
      });
    }

    // Localize tier names
    const localizedTiers: ServiceTierAPI[] = tiers.map(tier => ({
      id: tier.id,
      serviceKey: tier.serviceKey,
      level: tier.level,
      name: getLocalizedText(tier.name, tier.nameEn, locale) || tier.name,
      nameEn: tier.nameEn,
      shortDesc: getLocalizedText(tier.shortDesc, tier.shortDescEn, locale) ?? tier.shortDesc,
      basePrice: tier.basePrice,
      marketPrice: tier.marketPrice,
      lpReward: tier.lpReward,
      sortOrder: tier.sortOrder,
      isActive: tier.isActive,
    }));

    return Response.json({
      tiers: localizedTiers,
      features: featuresByService,
      meta: {
        locale,
        cached: true,
        revalidateSeconds: 300,
      },
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("[api/services/pricing]", err);
    return Response.json({ error: "Failed to load pricing data" }, { status: 500 });
  }
}