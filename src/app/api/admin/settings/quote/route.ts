/**
 * GET /api/admin/settings/quote
 * POST /api/admin/settings/quote
 *
 * Quote expiry configuration.
 * Keys: quote_expiry_days, quote_auto_expire, quote_reminder_hours
 */

import { NextRequest, NextResponse } from "next/server";
import { handleError, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

const QUOTE_KEYS = ["quote_expiry_days", "quote_auto_expire", "quote_reminder_hours"];

// Defaults
const QUOTE_DEFAULTS: Record<string, string> = {
 quote_expiry_days: "7",
 quote_auto_expire: "true",
 quote_reminder_hours: "24",
};

export async function GET(req: NextRequest) {
 try {
 await requirePermission("settings", "read");

 const settings = await prisma.siteSetting.findMany({
 where: { key: { in: QUOTE_KEYS } },
 });

 const result: Record<string, unknown> = {};
 for (const s of settings) {
 if (s.key === "quote_auto_expire") {
 result[s.key] = s.value === "true";
 } else {
 const parsed = parseInt(s.value, 10);
 result[s.key] = isNaN(parsed) ? s.value : parsed;
 }
 }

 // Fill defaults
 for (const [k, v] of Object.entries(QUOTE_DEFAULTS)) {
 if (!(k in result)) {
 result[k] = k === "quote_auto_expire" ? v === "true" : parseInt(v, 10);
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

 if (!QUOTE_KEYS.includes(key)) continue;

 const stringValue = typeof value === "boolean"
 ? String(value)
 : typeof value === "number"
 ? String(value)
 : String(value);

 const result = await prisma.siteSetting.upsert({
 where: { key },
 update: { value: stringValue, group: "quote" },
 create: { key, value: stringValue, group: "quote" },
 });
 results.push(result);
 }

 return ok(results, 201);
 } catch (err) {
 return handleError(err);
 }
}
