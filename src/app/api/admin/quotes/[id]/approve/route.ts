import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { approveQuoteAndCreateOrder } from "@/lib/pricing/quote-to-order";

// POST /api/admin/quotes/[id]/approve
// Actions: "send" | "approve" | "reject"
// Approve runs the full pricing engine and auto-creates an Order.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("quotes", "approve");
    const { id } = await params;
    const data = await req.json();
    const { action, adminOverridePrice } = data as {
      action: "send" | "approve" | "reject";
      adminOverridePrice?: number | null;
    };

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        salesLead: {
          select: {
            id: true,
            customerName: true,
            customerEmail: true,
            customerPhone: true,
            companyName: true,
          },
        },
      },
    });
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // ── Send quote ────────────────────────────────────────────────────────────
    if (action === "send") {
      const updated = await prisma.quote.update({
        where: { id },
        data: { status: "sent", sentAt: new Date() },
      });
      return NextResponse.json({ data: updated });
    }

    // ── Reject quote ──────────────────────────────────────────────────────
    if (action === "reject") {
      const updated = await prisma.quote.update({
        where: { id },
        data: { status: "rejected" },
      });
      return NextResponse.json({ data: updated });
    }

    // ── Approve quote — auto-create Order with pricing ───────────────────
    if (action === "approve") {
      const result = await approveQuoteAndCreateOrder(id, adminOverridePrice ?? null);

      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      await createAuditLog({
        userId: session.userId,
        action: "approve",
        resource: "quotes",
        resourceId: id,
        newValues: {
          orderId: result.orderId,
          systemPrice: result.systemPrice,
          finalPrice: result.finalPrice,
          infraTier: result.infraTier,
          lpAllocation: result.lpAllocation,
        },
      });

      return NextResponse.json({
        data: {
          quoteId: id,
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          systemPrice: result.systemPrice,
          finalPrice: result.finalPrice,
          infraTier: result.infraTier,
          lpAllocation: result.lpAllocation,
        },
      }, { status: 201 });
    }

    return NextResponse.json(
      { error: "Unknown action. Use: send | approve | reject" },
      { status: 400 }
    );
  } catch (error) {
    return handleError(error);
  }
}
