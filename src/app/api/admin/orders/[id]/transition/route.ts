import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
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

    // P1-2 FIX: audit log is written INSIDE transitionOrderStatus's $transaction.
    const result = await transitionOrderStatus(id, toStatus, session.userId, note, session.userId, id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
