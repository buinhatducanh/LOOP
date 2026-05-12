import { prisma } from "@/lib/prisma";

/**
 * Kết quả tính giá đơn hàng Custom
 */
export interface PriceCalculationResult {
  basePrice: number;
  featureTotal: number;
  /** Infrastructure tier monthly cost included in the formula. */
  infraCost: number;
  /** Infrastructure tier setup fee (one-time, added to systemPrice). */
  infraSetupCost: number;
  /** Hosting plan discounted price (0 if none selected). */
  hostingCost: number;
  /** Domain registration price (0 if none or deferred). */
  domainCost: number;
  systemPrice: number;
  totalXp: number;
  rewardLevel: number;
  rewards: RewardItem[];
  finalPrice: number;
  validatedFeatureIds: string[];
  infraTier?: {
    id: string;
    slug: string;
    name: string;
    nameVi: string;
    monthlyCost: number;
    setupCost: number;
  } | null;
  hostingPlan?: {
    id: string;
    slug: string;
    name: string;
    monthlyPrice: number;
    months: number;
    discountPct: number;
    discountedPrice: number;
  } | null;
}

export interface RewardItem {
  addonServiceId: string;
  addonServiceName: string;
  addonServiceNameVi: string;
  rewardLevel: number;
  quantity: number;
  durationMonths: number | null;
  description: string | null;
}

export interface CalculatePriceParams {
  /** IDs of selected advanced features */
  selectedFeatureIds?: string[];
  /** Infrastructure tier slug to apply (e.g. "basic", "pro", "enterprise"). Overrides infraTierId if both provided. */
  infraTierSlug?: string;
  /** Infrastructure tier ID (alternative to slug). */
  infraTierId?: string;
  /** Admin override price — skips all formula calculation if provided. */
  adminOverridePrice?: number | null;
  /** Pre-selected hosting plan slug (e.g. "starter-1yr"). */
  hostingPlanSlug?: string;
  /** Domain registration price (from PricingDomainPrice). */
  domainPrice?: number;
  /** Whether domain will be registered now (or deferred). */
  domainPurchaseNow?: boolean;
}

/**
 * Tính giá đơn hàng Custom Web dựa trên tính năng đã chọn + infrastructure tier.
 *
 * Final Price Formula (BA spec):
 *   systemPrice = basePrice + Σ(advanced features) + infraTier.monthlyCost + infraTier.setupCost
 *   finalPrice  = adminOverridePrice ?? systemPrice
 *
 * If no infrastructure tier is selected, infraCost = infraSetupCost = 0.
 */
export async function calculateOrderPrice(
  params: CalculatePriceParams = {}
): Promise<PriceCalculationResult> {
  const {
    selectedFeatureIds = [],
    infraTierSlug,
    infraTierId,
    adminOverridePrice,
    hostingPlanSlug,
    domainPrice = 0,
    domainPurchaseNow = false,
  } = params;

  // ── Step 1: Fetch base price ─────────────────────────────────────────────────
  const basePriceSetting = await prisma.siteSetting.findUnique({
    where: { key: "custom_web_base_price" },
  });
  const basePrice = basePriceSetting ? parseInt(basePriceSetting.value, 10) : 3_000_000;

  // ── Step 1.5: Fetch hosting plan ───────────────────────────────────────────
  let hostingPlanData: PriceCalculationResult["hostingPlan"] = null;
  let hostingCost = 0;
  if (hostingPlanSlug) {
    const hp = await prisma.pricingHostingPlan.findUnique({
      where: { slug: hostingPlanSlug, isActive: true },
    });
    if (hp) {
      const basePlanCost = hp.monthlyPrice * hp.months;
      const discountedPlanCost = hp.discountPct > 0
        ? Math.round(basePlanCost * (1 - hp.discountPct / 100))
        : basePlanCost;
      hostingPlanData = {
        id: hp.id,
        slug: hp.slug,
        name: hp.nameVi || hp.name,
        monthlyPrice: hp.monthlyPrice,
        months: hp.months,
        discountPct: hp.discountPct,
        discountedPrice: discountedPlanCost,
      };
      hostingCost = discountedPlanCost;
    }
  }

  // ── Step 2: Fetch XP per level setting ────────────────────────────────────────
  const xpPerLevelSetting = await prisma.siteSetting.findUnique({
    where: { key: "xp_per_level" },
  });
  const xpPerLevel = xpPerLevelSetting ? parseInt(xpPerLevelSetting.value, 10) : 100;

  // ── Step 3: Fetch infrastructure tier ─────────────────────────────────────
  let infraTierData: {
    id: string; slug: string; name: string; nameVi: string;
    monthlyCost: number; setupCost: number;
  } | null = null;
  let infraCost = 0;
  let infraSetupCost = 0;

  const infraWhere: Record<string, unknown> = { isActive: true };
  if (infraTierSlug) infraWhere.slug = infraTierSlug;
  else if (infraTierId) infraWhere.id = infraTierId;

  if (infraTierSlug || infraTierId) {
    const infraTier = await prisma.infrastructureTier.findFirst({ where: infraWhere });
    if (infraTier) {
      infraTierData = {
        id: infraTier.id,
        slug: infraTier.slug,
        name: infraTier.name,
        nameVi: infraTier.nameVi,
        monthlyCost: infraTier.monthlyCost,
        setupCost: infraTier.setupCost,
      };
      infraCost = infraTier.monthlyCost;
      infraSetupCost = infraTier.setupCost;
    }
  }

  // ── Step 4: Fetch all selected features ────────────────────────────────────
  const features = selectedFeatureIds.length > 0
    ? await prisma.serviceAttribute.findMany({
        where: { id: { in: selectedFeatureIds }, isActive: true },
        select: {
          id: true, parentId: true, tier: true, price: true, xpPoints: true, includedInBase: true,
        },
      })
    : [];

  // ── Step 5: Validate mutual exclusion ─────────────────────────────────────
  const validatedFeatures = resolveMutualExclusion(features);
  const validatedFeatureIds = validatedFeatures.map((f) => f.id);

  // ── Step 6: Calculate feature prices ────────────────────────────────────────
  const advancedFeatures = validatedFeatures.filter((f) => f.tier === "advanced" && !f.includedInBase);
  const featureTotal = computeFeatureCost(advancedFeatures);

  // ── Step 7: Calculate XP (all advanced features, regardless of includedInBase) ──
  const totalXp = validatedFeatures
    .filter((f) => f.tier === "advanced")
    .reduce((sum: number, f: { xpPoints: number }) => sum + f.xpPoints, 0);
  const rewardLevel = Math.floor(totalXp / xpPerLevel) + 1;

  // ── Step 8: Resolve rewards ───────────────────────────────────────────────
  const rewards = await resolveRewards(rewardLevel);

  // ── Step 9: Final price ──────────────────────────────────────────────────
  const domainCost = domainPurchaseNow ? domainPrice : 0;
  const systemPrice = basePrice + featureTotal + infraCost + infraSetupCost + hostingCost + domainCost;
  const finalPrice = adminOverridePrice ?? systemPrice;

  return {
    basePrice,
    featureTotal,
    infraCost,
    infraSetupCost,
    hostingCost,
    domainCost,
    systemPrice,
    totalXp,
    rewardLevel,
    rewards,
    finalPrice,
    validatedFeatureIds,
    infraTier: infraTierData,
    hostingPlan: hostingPlanData,
  };
}

/**
 * Xử lý mutual exclusion giữa tính năng cha-con.
 * Nếu chọn cả cha (basic) lẫn con (advanced) → ưu tiên con, bỏ cha.
 *
 * Pricing rules:
 * - Parent (includedInBase=true) → base price already includes it → charge 0
 * - Child selected + parent exists → charge child.price minus parent.price (upgrade delta)
 * - Child selected, no parent → charge child.price
 */
function resolveMutualExclusion(
  features: Array<{
    id: string;
    parentId: string | null;
    tier: string;
    price: number;
    xpPoints: number;
    includedInBase: boolean;
  }>
): Array<{ id: string; parentId: string | null; tier: string; price: number; xpPoints: number; includedInBase: boolean }> {
  const featureMap = new Map(features.map((f) => [f.id, f]));
  const toRemove = new Set<string>();

  for (const feature of features) {
    if (feature.parentId && featureMap.has(feature.parentId)) {
      // Chọn con (advanced) → bỏ cha (basic)
      toRemove.add(feature.parentId);
    }
  }

  return features.filter((f) => !toRemove.has(f.id));
}

/**
 * Tính tổng feature cost:
 * Caller đã filter: loại bỏ includedInBase=true, và resolveMutualExclusion.
 * Mỗi feature ở đây là "advance feature đã chọn" không có parent hoặc đã qua mutual exclusion.
 * Pricing: child selected + parent exists → delta = child.price - parent.price
 * Pricing: standalone advanced → child.price (full price, không có parent)
 */
function computeFeatureCost(
  features: Array<{ id: string; parentId: string | null; tier: string; price: number; xpPoints: number; includedInBase: boolean }>
): number {
  const featureMap = new Map(features.map((f) => [f.id, f]));
  let total = 0;

  for (const f of features) {
    // includedInBase đã được filter ở caller — ở đây không cần check lại
    if (f.parentId && featureMap.has(f.parentId)) {
      // Upgrade: chỉ thêm delta (giá nâng cấp - giá cơ bản)
      const parent = featureMap.get(f.parentId)!;
      total += Math.max(0, f.price - parent.price);
    } else {
      // Standalone advanced feature
      total += f.price;
    }
  }

  return total;
}

/**
 * Lấy danh sách rewards cho level đạt được (tích lũy từ level 2 trở lên).
 */
async function resolveRewards(rewardLevel: number): Promise<RewardItem[]> {
  if (rewardLevel < 2) return [];

  const tiers = await prisma.rewardTier.findMany({
    where: { level: { lte: rewardLevel }, isActive: true },
    include: {
      items: {
        include: { addonService: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { level: "asc" },
  });

  return tiers.flatMap((tier: typeof tiers[number]) =>
    tier.items.map((item: typeof tier.items[number]) => ({
      addonServiceId: item.addonServiceId,
      addonServiceName: item.addonService.name,
      addonServiceNameVi: item.addonService.nameVi,
      rewardLevel: tier.level,
      quantity: item.quantity,
      durationMonths: item.durationMonths,
      description: item.description,
    }))
  );
}
