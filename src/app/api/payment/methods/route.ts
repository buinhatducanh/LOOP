/**
 * GET /api/payment/methods
 *
 * Public endpoint — no auth required.
 * Returns available payment methods for the booking wizard.
 * Includes VietQR info if configured, plus static QR codes.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadVietQRConfig } from "@/lib/services/payment/vietqr.service";

export const dynamic = "force-dynamic";

export async function GET() {
 const [bankQr, momoQr, vietqrConfig] = await Promise.all([
 prisma.siteSetting.findUnique({ where: { key: "payment_bank_qr" } }),
 prisma.siteSetting.findUnique({ where: { key: "payment_momo_qr" } }),
 loadVietQRConfig(),
 ]);

 const methods: Array<{
 value: string;
 label: string;
 icon: string;
 recommended?: boolean;
 description: string;
 hasDynamicQR?: boolean;
 bankName?: string;
 accountNo?: string;
 accountName?: string;
 bankBin?: string;
 }> = [
 {
 value: "vietqr",
 label: "VietQR",
 icon: "📱",
 recommended: true,
 description: "Quét mã QR bằng app ngân hàng — nhanh nhất",
 hasDynamicQR: true,
 bankName: vietqrConfig?.bankName,
 accountNo: vietqrConfig?.accountNo,
 accountName: vietqrConfig?.accountName,
 bankBin: vietqrConfig?.bankBin,
 },
 {
 value: "bank_transfer",
 label: "Chuyển khoản thủ công",
 icon: "🏦",
 description: "Chuyển khoản theo thông tin tài khoản bên dưới",
 hasDynamicQR: false,
 bankName: vietqrConfig?.bankName,
 accountNo: vietqrConfig?.accountNo,
 accountName: vietqrConfig?.accountName,
 bankBin: vietqrConfig?.bankBin,
 },
 {
 value: "momo",
 label: "Ví MoMo",
 icon: "💜",
 description: "Thanh toán qua ví MoMo",
 hasDynamicQR: false,
 },
 ];

 const staticQrInfo = {
 bankTransfer: {
 qrUrl: bankQr?.value || null,
 },
 momo: {
 qrUrl: momoQr?.value || null,
 },
 };

 return NextResponse.json({
 data: {
 methods,
 staticQrInfo,
 vietqrEnabled: !!vietqrConfig,
 },
 });
}
