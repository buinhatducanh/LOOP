/**
 * GET /api/payment/methods
 *
 * Public endpoint — no auth required.
 * Returns available payment methods for the booking wizard.
 * Bank transfer (with static QR) + MoMo + VNPay.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
 const [bankConfig, momoQr] = await Promise.all([
 prisma.siteSetting.findUnique({ where: { key: "payment_bank_info" } }),
 prisma.siteSetting.findUnique({ where: { key: "payment_momo_qr" } }),
 ]);

 // Parse bank config (stored as JSON in SiteSetting)
 let bankInfo: {
 bankName?: string;
 accountNo?: string;
 accountName?: string;
 bankBin?: string;
 phone?: string;
 } = {};
 try {
 if (bankConfig?.value) {
 bankInfo = JSON.parse(bankConfig.value);
 }
 } catch { /* ignore */ }

 const methods: Array<{
 value: string;
 label: string;
 icon: string;
 recommended?: boolean;
 description: string;
 bankName?: string;
 accountNo?: string;
 accountName?: string;
 phone?: string;
 }> = [
 {
 value: "bank",
 label: "Chuyển khoản",
 icon: "🏦",
 recommended: true,
 description: "Quét mã QR bằng app ngân hàng",
 bankName: bankInfo.bankName,
 accountNo: bankInfo.accountNo,
 accountName: bankInfo.accountName,
 phone: bankInfo.phone,
 },
 {
 value: "momo",
 label: "MoMo",
 icon: "💜",
 description: "Thanh toán qua ví MoMo",
 },
 {
 value: "vnpay",
 label: "VNPay",
 icon: "💳",
 description: "Thanh toán qua VNPay",
 },
 ];

 const staticQrInfo = {
 bankTransfer: {
 qrUrl: bankConfig?.value || null,
 },
 momo: {
 qrUrl: momoQr?.value || null,
 },
 };

 return NextResponse.json({
 data: {
 methods,
 staticQrInfo,
 bankInfo,
 },
 });
}
