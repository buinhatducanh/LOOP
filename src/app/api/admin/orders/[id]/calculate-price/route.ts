import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { calculateOrderPrice } from "@/lib/pricing/calculate-order-price";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("orders", "update");
    const { id } = await params;
    const body = await req.json();
    const { selectedFeatureIds, infraTierSlug, infraTierId, adminOverridePrice } = body;

    // P1-5 FIX: sanity cap on admin override price (max 10× baseline, min 0)
    if (adminOverridePrice !== undefined) {
      if (typeof adminOverridePrice !== "number" || adminOverridePrice < 0) {
        return NextResponse.json(
          { error: "adminOverridePrice must be a non-negative number" },
          { status: 400 }
        );
      }
      // Warn (but allow) if override exceeds 10× baseline — log for review
      if (adminOverridePrice > 1_000_000_000) {
        console.warn(`[calculate-price] adminOverridePrice=${adminOverridePrice} exceeds 1B cap for order ${id}`);
      }
    }

    if (!selectedFeatureIds || !Array.isArray(selectedFeatureIds)) {
      return NextResponse.json(
        { error: "selectedFeatureIds is required and must be an array" },
        { status: 400 }
      );
    }

    const result = await calculateOrderPrice({
      selectedFeatureIds,
      infraTierSlug,
      infraTierId,
      adminOverridePrice,
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "orders",
      resourceId: id,
      newValues: { selectedFeatureIds, infraTierSlug, infraTierId, adminOverridePrice },
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    return handleError(error);
  }
}
