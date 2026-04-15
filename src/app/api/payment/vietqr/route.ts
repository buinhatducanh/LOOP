/**
 * POST /api/payment/vietqr
 *
 * Creates a dynamic VietQR for an order.
 * Returns Base64 QR image + payment code + amount + expiry.
 *
 * Body: {
 * orderId: string,
 * orderNumber: string,
 * amount: number, // VNĐ, số nguyên
 * }
 *
 * Response: {
 * data: {
 * qrDataURL: string, // Base64 PNG image
 * paymentCode: string, // "LOOP-{ORDER_NUMBER}"
 * amount: number,
 * expiresAt: string, // ISO date
 * accountName: string, // Tên chủ TK
 * accountNo: string, // Số tài khoản
 *  bankName: string, // Tên ngân hàng
 * bankBin: string, // 3 số đầu
 * }
 * }
 *
 * Auth: requires customer auth (order must belong to this customer or be pending_payment).
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { ok, badRequest, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { loadVietQRConfig, createVietQR } from "@/lib/services/payment/vietqr.service";

export async function POST(req: NextRequest) {
 try {
 const session = await requireAuth(req);
 const body = await req.json();

 const { orderId, orderNumber, amount } = body;

 if (!orderId || typeof orderId !== "string") {
 return badRequest("orderId is required");
 }
 if (!orderNumber || typeof orderNumber !== "string") {
 return badRequest("orderNumber is required");
 }
 if (!amount || typeof amount !== "number" || amount < 1000) {
 return badRequest("amount must be a number >= 1000 VNĐ");
 }

 // ── Verify order belongs to this customer ──────────────────────────────────
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
 },
 });

 if (!order) {
 return badRequest("order not found");
 }

 // Either the order belongs to this user (by email), OR it's a pending_payment order (anyone can pay)
 const isOwner = order.customerEmail === session.email;
 const isPending = order.status === "pending_payment";
 if (!isOwner && !isPending) {
 return badRequest("not authorized to pay this order");
 }

 // Amount must not exceed remaining balance
 const total = order.finalPrice ?? order.totalAmount ?? 0;
 if (amount > total) {
 return badRequest(`amount exceeds order total (${total} VNĐ)`);
 }

 // ── Load VietQR config ────────────────────────────────────────────────────
 const config = await loadVietQRConfig();
 if (!config) {
 return badRequest(
 "VietQR chưa được cấu hình. Admin vui lòng cài đặt VietQR trong /admin/settings."
 );
 }

 // ── Create QR ─────────────────────────────────────────────────────────────
 const qr = await createVietQR(
 {
 orderId: order.id,
 orderNumber: order.orderNumber,
 amount: Math.round(amount),
 },
 config
 );

 return ok({
 qrDataURL: qr.qrDataURL,
 paymentCode: qr.paymentCode,
 amount: qr.amount,
 expiresAt: qr.expiresAt,
 accountName: config.accountName,
 accountNo: config.accountNo,
 bankName: config.bankName,
 bankBin: config.bankBin,
 });
 } catch (err) {
 return handleError(err);
 }
}
