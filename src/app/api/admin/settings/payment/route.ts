/**
 * GET /api/admin/settings/payment
 * POST /api/admin/settings/payment
 *
 * Payment gateway configuration: VietQR, MoMo, VNPay, Bank transfer.
 * All settings stored in SiteSetting with group: "payment".
 */

import { NextRequest, NextResponse } from "next/server";
import { handleError, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

// Keys stored in SiteSetting
const PAYMENT_KEYS = [
 "vietqr_config",
 "momo_config",
 "vnpay_config",
 "payment_bank_qr",
 "payment_momo_qr",
 "payment_vnpay_info",
 "payment_methods_order",
];

export async function GET(req: NextRequest) {
 try {
 await requirePermission("settings", "read");

 const settings = await prisma.siteSetting.findMany({
 where: { key: { in: PAYMENT_KEYS } },
 });

 const result: Record<string, unknown> = {};
 for (const s of settings) {
 try {
 result[s.key] = JSON.parse(s.value);
 } catch {
 result[s.key] = s.value;
 }
 }

 return ok(result);
 } catch (err) {
 return handleError(err);
 }
}

export async function POST(req: NextRequest) {
 try {
 await requirePermission("settings", "update");

 const body = await req.json();
 const { settings } = body as { settings: Array<{ key: string; value: unknown }> };

 if (!Array.isArray(settings)) {
 return NextResponse.json({ error: "settings must be an array" }, { status: 400 });
 }

 const results = [];
 for (const item of settings) {
 const { key, value } = item as { key: string; value: unknown };

 if (!PAYMENT_KEYS.includes(key)) {
 continue; // Skip unknown keys
 }

 const stringValue = typeof value === "string" ? value : JSON.stringify(value);

 const result = await prisma.siteSetting.upsert({
 where: { key },
 update: { value: stringValue, group: "payment" },
 create: { key, value: stringValue, group: "payment" },
 });
 results.push(result);
 }

 return ok(results, 201);
 } catch (err) {
 return handleError(err);
 }
}
