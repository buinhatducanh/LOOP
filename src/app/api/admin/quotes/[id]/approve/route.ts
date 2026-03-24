import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// POST /api/admin/quotes/[id]/approve — action: "send" | "approve" | "reject"
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("quotes", "approve");
    const { id } = await params;
    const data = await req.json();
    const { action } = data as { action: "send" | "approve" | "reject" };

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
            area: true,
          },
        },
      },
    });
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (action === "send") {
      const updated = await prisma.quote.update({
        where: { id },
        data: { status: "sent", sentAt: new Date() },
      });
      return NextResponse.json({ data: updated });
    }

    if (action === "approve") {
      // Create an Order from the approved quote
      const lead = quote.salesLead;
      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          customerName: lead?.customerName ?? "Unknown",
          customerEmail: lead?.customerEmail ?? "",
          customerPhone: lead?.customerPhone ?? null,
          companyName: lead?.companyName ?? null,
          totalAmount: quote.totalAmount,
          status: "pending",
          paymentStatus: "unpaid",
          salesLeadId: lead?.id,
        },
      });

      const updated = await prisma.quote.update({
        where: { id },
        data: {
          status: "approved",
          approvedAt: new Date(),
          signedAt: new Date(),
          orderId: order.id,
        },
      });

      await createAuditLog({
        userId: session.userId,
        action: "approve",
        resource: "quotes",
        resourceId: id,
        newValues: { orderId: order.id, totalAmount: quote.totalAmount },
      });

      return NextResponse.json({ data: updated, order });
    }

    if (action === "reject") {
      const updated = await prisma.quote.update({
        where: { id },
        data: { status: "rejected" },
      });
      return NextResponse.json({ data: updated });
    }

    return NextResponse.json(
      { error: "Unknown action. Use: send | approve | reject" },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
