/**
 * GET /api/payment/momo/query?requestId=&orderId=
 *
 * Query MoMo transaction status.
 * Used by customer to check payment result after redirect.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { ok, badRequest, handleError } from "@/lib/api";
import { loadMoMoConfig, queryMoMoStatus } from "@/lib/services/payment/momo.service";

export async function GET(req: NextRequest) {
 try {
 await requireAuth(req);

 const { searchParams } = new URL(req.url);
 const requestId = searchParams.get("requestId");
 const orderId = searchParams.get("orderId");

 if (!requestId || !orderId) {
 return badRequest("requestId and orderId are required");
 }

 const config = await loadMoMoConfig();
 if (!config) {
 return badRequest("MoMo chua duoc cau hinh");
 }

 const result = await queryMoMoStatus(requestId, orderId, config);

 return ok(result);
 } catch (err) {
 return handleError(err);
 }
}
