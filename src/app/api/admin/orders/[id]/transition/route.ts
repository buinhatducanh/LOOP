import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { transitionOrderStatus } from "@/lib/pricing/order-lifecycle";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("orders", "update");
    const { id } = await params;
    const { toStatus, note } = await req.json();

    if (!toStatus) {
      return NextResponse.json(
        { error: "toStatus is required" },
        { status: 400 }
      );
    }

    const result = await transitionOrderStatus(id, toStatus, session.userId, note);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "orders",
      resourceId: id,
      newValues: { toStatus, note },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
