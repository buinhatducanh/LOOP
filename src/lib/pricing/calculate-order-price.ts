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
  } = params;

  // ── Step 1: Fetch base price ─────────────────────────────────────────────────
  const basePriceSetting = await prisma.siteSetting.findUnique({
    where: { key: "custom_web_base_price" },
  });
  const basePrice = basePriceSetting ? parseInt(basePriceSetting.value, 10) : 3_000_000;

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
      })
    : [];

  // ── Step 5: Validate mutual exclusion ─────────────────────────────────────
  const validatedFeatures = resolveMutualExclusion(features);
  const validatedFeatureIds = validatedFeatures.map((f) => f.id);

  // ── Step 6: Calculate feature prices ────────────────────────────────────────
  const advancedFeatures = validatedFeatures.filter((f) => f.tier === "advanced");
  const featureTotal = advancedFeatures.reduce((sum, f) => sum + f.price, 0);

  // ── Step 7: Calculate XP ──────────────────────────────────────────────────
  const totalXp = advancedFeatures.reduce((sum, f) => sum + f.xpPoints, 0);
  const rewardLevel = Math.floor(totalXp / xpPerLevel) + 1;

  // ── Step 8: Resolve rewards ───────────────────────────────────────────────
  const rewards = await resolveRewards(rewardLevel);

  // ── Step 9: Final price ──────────────────────────────────────────────────
  const systemPrice = basePrice + featureTotal + infraCost + infraSetupCost;
  const finalPrice = adminOverridePrice ?? systemPrice;

  return {
    basePrice,
    featureTotal,
    infraCost,
    infraSetupCost,
    systemPrice,
    totalXp,
    rewardLevel,
    rewards,
    finalPrice,
    validatedFeatureIds,
    infraTier: infraTierData,
  };
}

/**
 * Xử lý mutual exclusion giữa tính năng cha-con.
 * Nếu chọn cả cha (basic) lẫn con (advanced) → ưu tiên con, bỏ cha.
 */
function resolveMutualExclusion(
  features: Array<{
    id: string;
    parentId: string | null;
    tier: string;
    price: number;
    xpPoints: number;
  }>
): typeof features {
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

  return tiers.flatMap((tier) =>
    tier.items.map((item) => ({
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
