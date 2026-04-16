/**
 * POST /api/webhooks/vnpay
 *
 * VNPay IPN (Internet Payment Notification) — server-to-server confirmation.
 * Verifies signature and records payment automatically.
 */

import { NextRequest, NextResponse } from "next/server";
import { loadVNPayConfig, verifyVNPaySignature, verifyVNPayReturn } from "@/lib/services/payment/vnpay.service";
import { recordPayment } from "@/lib/pricing/order-lifecycle";

export async function POST(req: NextRequest) {
 try {
 const body = await req.json() as Record<string, string>;

 // ── Verify signature ──────────────────────────────────────────────────────────
 const config = await loadVNPayConfig();
 if (!config) {
 return NextResponse.json({ RspCode: "99", Message: "Not configured" }, { status: 500 });
 }

 const isValid = verifyVNPaySignature(body, config.vnp_HashSecret);
 if (!isValid) {
 console.error("[VNPay IPN] Invalid signature");
 return NextResponse.json({ RspCode: "97", Message: "Invalid signature" }, { status: 401 });
 }

 // ── Verify and parse ──────────────────────────────────────────────────────────
 const result = verifyVNPayReturn(body);

 console.log(
 `[VNPay IPN] Received: orderId=${result.orderId}, success=${result.success}, amount=${result.amount}`
 );

 if (result.success && result.orderId) {
 const { prisma } = await import("@/lib/prisma");

 // Idempotency: check if already recorded
 const existing = await prisma.payment.findFirst({
 where: { orderId: result.orderId, amount: result.amount },
 });

 if (!existing) {
 try {
 await recordPayment(
 result.orderId,
 result.amount,
 "vnpay",
 `VNPay IPN transNo: ${result.bankTranNo}, bank: ${result.bankCode}`,
 "system"
 );
 console.log(`[VNPay IPN] Payment recorded: orderId=${result.orderId}`);
 } catch (payErr) {
 console.error(`[VNPay IPN] Failed to record payment:`, payErr);
 // Return success anyway to prevent VNPay retry
 }
 }
 }

 // VNPay expects RspCode: 00 = success, 99 = error
 return NextResponse.json({
 RspCode: result.success ? "00" : "99",
 Message: result.message,
 });
 } catch (err) {
 console.error("[VNPay IPN] Error:", err);
 return NextResponse.json({ RspCode: "99", Message: "Internal error" }, { status: 200 });
 }
}
