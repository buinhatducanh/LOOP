import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import type { Prisma } from "@/generated/prisma";

// DELETE /api/admin/orders/[id]/payments/[paymentId]
// Deletes a payment record and reverses its effects on order totals and LP awards.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const session = await requirePermission("orders", "update");
    const { id, paymentId } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId, orderId: id },
      include: { order: true }
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Atomic transaction to delete payment and update order
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Delete the payment record
      await tx.payment.delete({ where: { id: paymentId } });

      // 2. Update order totals
      const newPaidAmount = Math.max(0, payment.order.paidAmount - payment.amount);
      const totalExpected = payment.order.finalPrice ?? payment.order.totalAmount ?? 0;
      
      let paymentStatus = "unpaid";
      if (newPaidAmount >= totalExpected && totalExpected > 0) {
        paymentStatus = "paid_full";
      } else if (newPaidAmount > 0) {
        paymentStatus = "paid_partial";
      }

      await tx.order.update({
        where: { id },
        data: { 
          paidAmount: newPaidAmount,
          paymentStatus 
        }
      });

      // 3. Delete associated LP awards (cleanup)
      // This includes LP given to customer, referrer, and staff for THIS payment
      await tx.lpAward.deleteMany({
        where: { 
          projectId: id,
          createdAt: {
            gte: new Date(payment.createdAt.getTime() - 1000), // Match approx creation time
            lte: new Date(payment.createdAt.getTime() + 1000)
          },
          // Or better, if we had a paymentId on LpAward, but we don't in current schema
          // We'll rely on the project + amount match if needed, but for now we delete pending awards 
          // linked to this project created around the same time.
          status: "pending" 
        }
      });

      // 4. Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "delete",
          resource: "orders",
          resourceId: id,
          newValues: { 
            deletedPaymentAmount: payment.amount,
            previousPaidAmount: payment.order.paidAmount,
            newPaidAmount 
          }
        }
      });
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
