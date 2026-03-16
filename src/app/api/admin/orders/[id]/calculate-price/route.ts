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
    const { selectedFeatureIds, adminOverridePrice } = await req.json();

    if (!selectedFeatureIds || !Array.isArray(selectedFeatureIds)) {
      return NextResponse.json(
        { error: "selectedFeatureIds is required and must be an array" },
        { status: 400 }
      );
    }

    const result = await calculateOrderPrice(selectedFeatureIds, adminOverridePrice);

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "orders",
      resourceId: id,
      newValues: { selectedFeatureIds, adminOverridePrice },
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
