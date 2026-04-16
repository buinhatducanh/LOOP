/**
 * GET /api/payment/banks
 *
 * Returns list of supported banks from VietQR.
 * Public endpoint — no auth required.
 */

import { NextResponse } from "next/server";
import { getSupportedBanks } from "@/lib/services/payment/vietqr.service";

export const dynamic = "force-dynamic";

export async function GET() {
 try {
 const banks = await getSupportedBanks();
 return NextResponse.json({ data: banks });
 } catch {
 return NextResponse.json({ data: [] });
 }
}
