import { serverError, ok } from "@/lib/api/response";
import { calculateOrderPrice } from "@/lib/pricing/calculate-order-price";
import type { NextRequest } from "next/server";

// Public API cho Pricing Calculator
// Body: { selectedFeatureIds: string[], infraTierSlug?: string, hostingPlanSlug?: string, domainPrice?: number, domainPurchaseNow?: boolean }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const selectedFeatureIds = Array.isArray(body.selectedFeatureIds)
      ? body.selectedFeatureIds
      : [];
    const infraTierSlug =
      typeof body.infraTierSlug === "string" ? body.infraTierSlug : undefined;
    const hostingPlanSlug =
      typeof body.hostingPlanSlug === "string" ? body.hostingPlanSlug : undefined;
    const domainPrice =
      typeof body.domainPrice === "number" ? body.domainPrice : 0;
    const domainPurchaseNow =
      typeof body.domainPurchaseNow === "boolean" ? body.domainPurchaseNow : false;

    const result = await calculateOrderPrice({
      selectedFeatureIds,
      infraTierSlug,
      hostingPlanSlug,
      domainPrice,
      domainPurchaseNow,
      adminOverridePrice: null,
    });

    return ok(result);
  } catch (error) {
    console.error("Pricing calculate error:", error);
    return serverError();
  }
}
