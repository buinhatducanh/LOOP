import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { approveQuoteAndCreateOrder } from "@/lib/pricing/quote-to-order";

// POST /api/admin/quotes/[id]/sign
// Marks a quote as signed by the customer.
// This is a SEPARATE step from internal approval — previously both approvedAt
// and signedAt were set at the same time (P0-2 bug).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("quotes", "update");
    const { id } = await params;
    const _data = await req.json().catch(() => ({}));

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Allow signing if quote is approved, sent, or viewed by customer
    const ALLOWED_SIGN_STATUSES = ["approved", "sent", "viewed"];
    if (!ALLOWED_SIGN_STATUSES.includes(quote.status)) {
      return NextResponse.json(
        { error: `Quote must be approved or sent before signing. Current status: ${quote.status}` },
        { status: 400 }
      );
    }

    // P0-2: If quote hasn't been "approved" (which creates the Order), 
    // we must do it now during signing to ensure data integrity.
    if (!quote.orderId) {
      const result = await approveQuoteAndCreateOrder(id, null);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        status: "signed",
        signedAt: new Date(),
        // If it was just 'sent' or 'viewed' but not 'approved', marking as signed implicitly approves it
        ...(["sent", "viewed"].includes(quote.status) ? { approvedAt: new Date() } : {})
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "sign",
      resource: "quotes",
      resourceId: id,
      newValues: { 
        signedAt: updated.signedAt,
        autoApproved: !quote.orderId
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("[SIGN_QUOTE_ERROR]", error);
    const details = error.message || String(error);
    return NextResponse.json({ 
      error: `Lỗi: ${details}`
    }, { status: 500 });
  }
}
