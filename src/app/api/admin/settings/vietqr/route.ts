/**
 * POST /api/admin/settings/vietqr/test
 *
 * Test VietQR connection with provided credentials.
 * Does NOT save — just validates the API key works.
 */

import { NextRequest, NextResponse } from "next/server";
import { handleError, ok, badRequest } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/permissions";

export async function POST(req: NextRequest) {
 try {
 await requirePermission("settings", "update");

 const body = await req.json();
 const { apiKey, apiSecret, accountNo, accountName, bankId, bankName } = body;

 if (!apiKey || !accountNo) {
 return badRequest("apiKey and accountNo are required");
 }

 // Try to get supported banks list to verify the API key
 const response = await fetch("https://api.vietqr.io/v2/banks", {
 headers: {
 "x-api-key": apiKey,
 "x-client-id": apiSecret ?? "",
 },
 });

 if (!response.ok) {
 const err = await response.text().catch(() => "unknown");
 return NextResponse.json({
 ok: false,
 message: `VietQR API error ${response.status}: ${err}`,
 }, { status: 200 });
 }

 return ok({
 ok: true,
 message: "Ket noi VietQR thanh cong",
 accountNo,
 bankId: bankId ?? "970436",
 bankName: bankName ?? "Unknown",
 });
 } catch (err) {
 return handleError(err);
 }
}
