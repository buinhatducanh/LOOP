/**
 * GET /api/payment/vnpay/return
 *
 * VNPay return URL — customer is redirected here after payment.
 * Verifies the signature and redirects to the payment result page.
 *
 * VNPay redirects with query params:
 * vnp_Amount, vnp_BankCode, vnp_BankTranNo, vnp_CardType, vnp_OrderInfo,
 * vnp_PayDate, vnp_ResponseCode, vnp_TmnCode, vnp_TransactionNo,
 * vnp_TxnRef, vnp_SecureHash
 */

import { NextRequest, NextResponse } from "next/server";
import { loadVNPayConfig, verifyVNPaySignature, verifyVNPayReturn } from "@/lib/services/payment/vnpay.service";
import { recordPayment } from "@/lib/pricing/order-lifecycle";

export async function GET(req: NextRequest) {
 try {
 const { searchParams } = new URL(req.url);

 // Collect all vnp_ params
 const params: Record<string, string> = {};
 for (const [k, v] of searchParams.entries()) {
 if (k.startsWith("vnp_")) params[k] = v;
 }

 if (!params.vnp_TxnRef) {
 return NextResponse.redirect(new URL("/khach-hang?payment=failed&reason=no_order", req.url));
 }

 const config = await loadVNPayConfig();
 if (!config) {
 return NextResponse.redirect(
 new URL("/khach-hang?payment=failed&reason=not_configured", req.url)
 );
 }

 // ── Verify signature ──────────────────────────────────────────────────────────
 const isValid = verifyVNPaySignature(params, config.vnp_HashSecret);
 if (!isValid) {
 console.error("[VNPay Return] Invalid signature");
 return NextResponse.redirect(
 new URL("/khach-hang?payment=failed&reason=invalid_signature", req.url)
 );
 }

 // ── Parse result ──────────────────────────────────────────────────────────────
 const result = verifyVNPayReturn(params);
 const orderId = result.orderId;

 if (result.success && orderId) {
 // Check if payment already recorded (idempotency)
 const { prisma } = await import("@/lib/prisma");
 const existing = await prisma.payment.findFirst({
 where: { orderId, amount: result.amount },
 });

 if (!existing) {
 try {
 await recordPayment(
 orderId,
 result.amount,
 "vnpay",
 `VNPay transNo: ${result.bankTranNo}, bank: ${result.bankCode}`,
 "system"
 );
 } catch (payErr) {
 console.error(`[VNPay Return] Failed to record payment:`, payErr);
 }
 }
 }

 // ── Redirect to result page ───────────────────────────────────────────────────
 const success = result.success ? "success" : "failed";
 const reason = encodeURIComponent(result.message);
 return NextResponse.redirect(
 new URL(`/khach-hang?payment=${success}&reason=${reason}&order=${orderId}`, req.url)
 );
 } catch (err) {
 console.error("[VNPay Return] Error:", err);
 return NextResponse.redirect(
 new URL("/khach-hang?payment=failed&reason=internal_error", req.url)
 );
 }
}
