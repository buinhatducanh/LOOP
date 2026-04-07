import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { calculateOrderPrice } from "@/lib/pricing/calculate-order-price";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("orders", "update");
    const { id } = await params;
    const body = await req.json();
    const { selectedFeatureIds, infraTierSlug, infraTierId, adminOverridePrice } = body;

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
