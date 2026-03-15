import { prisma } from "@/lib/prisma";

/**
 * Kết quả tính giá đơn hàng Custom
 */
export interface PriceCalculationResult {
  basePrice: number;
  featureTotal: number;
  systemPrice: number;
  totalXp: number;
  rewardLevel: number;
  rewards: RewardItem[];
  finalPrice: number;
  validatedFeatureIds: string[];
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

/**
 * Tính giá đơn hàng Custom Web dựa trên tính năng đã chọn.
 *
 * Logic:
 * 1. Lấy giá base từ SiteSetting
 * 2. Validate mutual exclusion (cha-con)
 * 3. Tính tổng giá tính năng nâng cao
 * 4. Tính XP + Level
 * 5. Resolve rewards theo level
 * 6. Trả về giá cuối cùng
 */
export async function calculateOrderPrice(
  selectedFeatureIds: string[],
  adminOverridePrice?: number | null
): Promise<PriceCalculationResult> {
  // Step 1: Fetch base price
  const basePriceSetting = await prisma.siteSetting.findUnique({
    where: { key: "custom_web_base_price" },
  });
  const basePrice = basePriceSetting ? parseInt(basePriceSetting.value, 10) : 3000000;

  // Step 2: Fetch XP per level setting
  const xpPerLevelSetting = await prisma.siteSetting.findUnique({
    where: { key: "xp_per_level" },
  });
  const xpPerLevel = xpPerLevelSetting ? parseInt(xpPerLevelSetting.value, 10) : 100;

  // Step 3: Fetch all selected features
  const features = await prisma.serviceAttribute.findMany({
    where: {
      id: { in: selectedFeatureIds },
      isActive: true,
    },
  });

  // Step 4: Validate mutual exclusion
  // Nếu chọn child (advanced) → remove parent (basic) khỏi list
  const validatedFeatures = resolveMutualExclusion(features);
  const validatedFeatureIds = validatedFeatures.map((f) => f.id);

  // Step 5: Calculate feature prices (chỉ advanced features có giá > 0)
  const advancedFeatures = validatedFeatures.filter((f) => f.tier === "advanced");
  const featureTotal = advancedFeatures.reduce((sum, f) => sum + f.price, 0);

  // Step 6: Calculate XP
  const totalXp = advancedFeatures.reduce((sum, f) => sum + f.xpPoints, 0);
  const rewardLevel = Math.floor(totalXp / xpPerLevel) + 1;

  // Step 7: Resolve rewards
  const rewards = await resolveRewards(rewardLevel);

  // Step 8: Final price
  const systemPrice = basePrice + featureTotal;
  const finalPrice = adminOverridePrice ?? systemPrice;

  return {
    basePrice,
    featureTotal,
    systemPrice,
    totalXp,
    rewardLevel,
    rewards,
    finalPrice,
    validatedFeatureIds,
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
    where: {
      level: { lte: rewardLevel },
      isActive: true,
    },
    include: {
      items: {
        include: {
          addonService: true,
        },
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
