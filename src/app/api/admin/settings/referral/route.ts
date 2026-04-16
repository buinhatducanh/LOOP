/**
 * GET /api/admin/settings/referral
 * POST /api/admin/settings/referral
 *
 * Referral LP tier configuration.
 * Stores tier thresholds and rates in SiteSetting as JSON.
 * Key: "referral_lp_tiers"
 */

import { NextRequest, NextResponse } from "next/server";
import { handleError, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

// Default tiers (hardcoded until admin saves custom values)
export const REFERRAL_TIERS_DEFAULT = [
 { minRevenue: 0, maxRevenue: 50_000_000, lpRate: 0.05, label: "Tier 1 (0–50M)" },
 { minRevenue: 50_000_000, maxRevenue: 200_000_000, lpRate: 0.07, label: "Tier 2 (50–200M)" },
 { minRevenue: 200_000_000, maxRevenue: null, lpRate: 0.10, label: "Tier 3 (200M+)" },
];

export async function GET(req: NextRequest) {
 try {
 await requirePermission("settings", "read");

 const setting = await prisma.siteSetting.findUnique({
 where: { key: "referral_lp_tiers" },
 });

 if (setting?.value) {
 try {
 return ok(JSON.parse(setting.value));
 } catch {
 return ok(REFERRAL_TIERS_DEFAULT);
 }
 }

 return ok(REFERRAL_TIERS_DEFAULT);
 } catch (err) {
 return handleError(err);
 }
}

export async function POST(req: NextRequest) {
 try {
 await requirePermission("settings", "update");

 const body = await req.json();
 const { tiers } = body as { tiers: unknown[] };

 if (!Array.isArray(tiers)) {
 return NextResponse.json({ error: "tiers must be an array" }, { status: 400 });
 }

 // Validate tier structure
 for (const tier of tiers) {
 const t = tier as Record<string, unknown>;
 if (typeof t.minRevenue !== "number" || typeof t.lpRate !== "number") {
 return NextResponse.json({ error: "Invalid tier structure" }, { status: 400 });
 }
 if (t.lpRate < 0 || t.lpRate > 1) {
 return NextResponse.json({ error: "lpRate must be between 0 and 1" }, { status: 400 });
 }
 }

 const stringValue = JSON.stringify(tiers);

 const result = await prisma.siteSetting.upsert({
 where: { key: "referral_lp_tiers" },
 update: { value: stringValue, group: "referral" },
 create: { key: "referral_lp_tiers", value: stringValue, group: "referral" },
 });

 return ok(result, 201);
 } catch (err) {
 return handleError(err);
 }
}
