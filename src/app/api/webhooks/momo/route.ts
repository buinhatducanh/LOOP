/**
 * POST /api/webhooks/momo
 *
 * MoMo IPN (Instant Payment Notification) webhook.
 * Receives payment result notifications from MoMo.
 *
 * MoMo sends POST with: partnerCode, accessKey, amount, orderId,
 * orderInfo, orderType, transId, message, responseTime, errorDescription,
 * payType, signature
 *
 * Flow:
 * 1. Verify signature
 * 2. Check resultCode === 0 (success)
 * 3. Call recordPayment() automatically
 */

import { NextRequest, NextResponse } from "next/server";
import { loadMoMoConfig, verifyMoMoSignature } from "@/lib/services/payment/momo.service";
import { recordPayment } from "@/lib/pricing/order-lifecycle";

export async function POST(req: NextRequest) {
 try {
 const body = await req.json() as Record<string, string | number>;

 // ── Verify signature ─────────────────────────────────────────────────────────
 const config = await loadMoMoConfig();
 if (!config) {
 return NextResponse.json({ error: "MoMo not configured" }, { status: 500 });
 }

 const isValid = verifyMoMoSignature(body, config.secretKey);
 if (!isValid) {
 console.error("[MoMo Webhook] Invalid signature");
 return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
 }

 const { resultCode, orderId, transId, amount, message } = body;

 console.log(`[MoMo Webhook] Received: orderId=${orderId}, resultCode=${resultCode}, amount=${amount}`);

 // ── Only process successful payments ────────────────────────────────────────
 if (resultCode === 0 && typeof orderId === "string" && typeof amount === "number") {
 const paymentAmount = Math.round(Number(amount));

 // Check if payment already recorded (idempotency)
 const { prisma } = await import("@/lib/prisma");
 const existing = await prisma.payment.findFirst({
 where: {
 orderId,
 amount: paymentAmount,
 confirmedAt: {
 gte: new Date(Date.now() - 60_000), // within last minute
 },
 },
 });

 if (!existing) {
 try {
 await recordPayment(
 orderId,
 paymentAmount,
 "momo",
 `MoMo transId: ${transId ?? "unknown"}`,
 "system"
 );
 console.log(`[MoMo Webhook] Payment recorded: orderId=${orderId}, amount=${paymentAmount}`);
 } catch (payErr) {
 console.error(`[MoMo Webhook] Failed to record payment:`, payErr);
 // Return 200 anyway to prevent MoMo retry storms
 }
 }
 }

 return NextResponse.json({ resultCode: 0, message: "OK" });
 } catch (err) {
 console.error("[MoMo Webhook] Error:", err);
 // Return 200 to prevent MoMo retry
 return NextResponse.json({ error: "Internal error" }, { status: 200 });
 }
}
