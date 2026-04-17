/**
 * POST /api/payment/momo/create
 *
 * Creates a MoMo payment request for an order.
 * Returns payment URL (deep link / QR) for customer redirect.
 *
 * Body: {
 * orderId: string,
 * amount: number, // VND, integer >= 1000
 * }
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { ok, badRequest, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { loadMoMoConfig, createMoMoPayment } from "@/lib/services/payment/momo.service";

export async function POST(req: NextRequest) {
 try {
 const session = await requireAuth(req);
 const body = await req.json();

 const { orderId, amount } = body;

 if (!orderId || typeof orderId !== "string") {
 return badRequest("orderId is required");
 }
 if (!amount || typeof amount !== "number" || amount < 1000) {
 return badRequest("amount must be a number >= 1000 VND");
 }

 // ── Verify order belongs to this customer ────────────────────────────────────
 const order = await prisma.order.findUnique({
 where: { id: orderId },
 select: {
 id: true,
 orderNumber: true,
 customerEmail: true,
 paymentStatus: true,
 totalAmount: true,
 finalPrice: true,
 status: true,
 customerName: true,
  },
 });

 if (!order) {
 return badRequest("order not found");
 }

 const isOwner = order.customerEmail === session.email;
 const isPending = order.status === "pending_payment";
 if (!isOwner && !isPending) {
 return badRequest("not authorized to pay this order");
 }

 const total = order.finalPrice ?? order.totalAmount ?? 0;
 if (amount > total) {
 return badRequest(`amount exceeds order total (${total} VND)`);
 }

 // ── Load MoMo config ────────────────────────────────────────────────────────
 const config = await loadMoMoConfig();
 if (!config) {
 return badRequest(
 "MoMo chua duoc cau hinh. Admin vui long cai dat MoMo trong /admin/settings."
  );
 }

 // ── Create MoMo payment ──────────────────────────────────────────────────────
 const requestId = `MOMO-${Date.now()}-${orderId.slice(0, 8)}`;

 const payment = await createMoMoPayment(
 {
 orderId: order.id,
 orderNumber: order.orderNumber,
 amount: Math.round(amount),
 customerName: order.customerName ?? undefined,
 customerEmail: order.customerEmail ?? undefined,
 requestId,
 },
 config
 );

 return ok({
 payUrl: payment.payUrl,
 transId: payment.transId,
 requestId: payment.requestId,
 amount: payment.amount,
 resultCode: payment.resultCode,
 message: payment.message,
 });
 } catch (err) {
 return handleError(err);
 }
}
