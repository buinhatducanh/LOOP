/**
 * POST /api/payment/vnpay/create
 *
 * Creates a VNPay payment URL for an order.
 * Returns a signed redirect URL for the customer.
 *
 * Body: {
 * orderId: string,
 * amount: number, // VND, integer >= 1000
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { ok, badRequest, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { loadVNPayConfig, createVNPayUrl } from "@/lib/services/payment/vnpay.service";

function getClientIp(req: NextRequest): string {
 const forwarded = req.headers.get("x-forwarded-for");
 if (forwarded) return forwarded.split(",")[0].trim();
 return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

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

 // ── Load VNPay config ────────────────────────────────────────────────────────
 const config = await loadVNPayConfig();
 if (!config) {
 return badRequest(
 "VNPay chua duoc cau hinh. Admin vui long cai dat VNPay trong /admin/settings."
 );
 }

 // ── Create VNPay URL ─────────────────────────────────────────────────────────
 const result = await createVNPayUrl(
 {
 orderId: order.id,
 orderNumber: order.orderNumber,
 amount: Math.round(amount),
 customerName: order.customerName ?? undefined,
 customerEmail: order.customerEmail ?? undefined,
 ipAddr: getClientIp(req),
 },
 config
 );

 return ok({
 paymentUrl: result.paymentUrl,
 vnp_TxnRef: result.vnp_TxnRef,
 amount: result.vnp_Amount,
 });
 } catch (err) {
 return handleError(err);
 }
}
