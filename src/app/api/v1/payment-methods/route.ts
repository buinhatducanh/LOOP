/**
 * GET /api/v1/payment-methods
 *
 * Public endpoint — no auth required.
 * Returns available payment methods and QR code URLs for the booking wizard.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
 const [bankQr, momoQr] = await Promise.all([
 prisma.siteSetting.findUnique({ where: { key: "payment_bank_qr" } }),
 prisma.siteSetting.findUnique({ where: { key: "payment_momo_qr" } }),
 ]);

 return NextResponse.json({
 data: {
 methods: ["bank", "momo"],
 bank: {
 label: "Chuyển khoản ngân hàng",
 qrUrl: bankQr?.value || null,
 },
 momo: {
 label: "Ví MoMo",
 qrUrl: momoQr?.value || null,
 },
 },
 });
}
