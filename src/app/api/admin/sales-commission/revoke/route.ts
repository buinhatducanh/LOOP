/**
 * POST /api/admin/sales-commission/revoke
 *
 * Revoke a previously credited sales commission from a team member.
 * Deducts LP from availableLp + completedCommission + totalSalesCommission.
 * Reverts commissionPaid flag on the source Order/Enrollment.
 * Creates an audit LpTransaction.
 *
 * Requires: admin/super_admin/ceo (bypasses permission matrix)
 * Body: { eventId: string, reason?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { requirePermissionFast, requireAuth } from "@/lib/auth/permissions";
import { revokeSalesCommission } from "@/lib/services/commerce/commission.service";
import { handleError, ok, badRequest } from "@/lib/api/response";

export async function POST(req: NextRequest) {
 try {
 const session = await requireAuth(req);
 requirePermissionFast(session, "team", "update");

 const body = await req.json();
 const { eventId, reason } = body;

 if (!eventId || typeof eventId !== "string") {
 return badRequest("eventId is required");
 }

 const result = await revokeSalesCommission(eventId, session.userId, reason);

 if (!result.revoked) {
 return NextResponse.json(
 { error: result.error },
 { status: 400 }
 );
 }

 return ok({ revoked: true, eventId }, 200);
 } catch (err) {
 return handleError(err);
 }
}
