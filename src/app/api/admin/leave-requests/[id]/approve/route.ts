/**
 * Leave Request Approve — /api/admin/leave-requests/[id]/approve
 * POST — quick approve convenience endpoint
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { ok, notFound, handleError, badRequest } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    const existing = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!existing) return notFound("Leave request not found");

    if (existing.status !== "pending") {
      return badRequest(`Leave request is already ${existing.status}`);
    }

    const leaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: "approved",
        respondedBy: session.userId,
        respondedAt: new Date(),
      },
    });

    return ok(leaveRequest);
  } catch (err) {
    return handleError(err);
  }
}
