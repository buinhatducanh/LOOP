import { ok, serverError } from "@/lib/api/response";
import { calculateOrderPrice } from "@/lib/pricing/calculate-order-price";
import type { NextRequest } from "next/server";

// Public pricing API (no auth)
// Body: { selectedFeatureIds: string[], infraTierSlug?: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const selectedFeatureIds = Array.isArray(body.selectedFeatureIds)
      ? body.selectedFeatureIds
      : [];
    const infraTierSlug =
      typeof body.infraTierSlug === "string" ? body.infraTierSlug : undefined;

    const result = await calculateOrderPrice({
      selectedFeatureIds,
      infraTierSlug,
      adminOverridePrice: null,
    });

    return ok(result);
  } catch (error) {
    console.error("Pricing calculator error:", error);
    return serverError();
  }
}
