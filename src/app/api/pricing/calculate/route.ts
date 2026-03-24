import { NextRequest, NextResponse } from "next/server";
import { calculateOrderPrice } from "@/lib/pricing/calculate-order-price";

// Public pricing API (no auth)
// Body: { selectedFeatureIds: string[], infraTierSlug?: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const selectedFeatureIds = Array.isArray(body.selectedFeatureIds) ? body.selectedFeatureIds : [];
    const infraTierSlug = typeof body.infraTierSlug === "string" ? body.infraTierSlug : undefined;

    const result = await calculateOrderPrice({
      selectedFeatureIds,
      infraTierSlug,
      adminOverridePrice: null,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
