/**
 * Reject a single OffSystemSplit → split marked rejected, no LP credited
 * POST /api/admin/off-system-payments/:id/splits/:splitId/reject
 *
 * Body: { reason?: string }
 */

import { handleError, ok, notFound, badRequest } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

interface RouteParams { params: Promise<{ id: string; splitId: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission("off_system_payments", "update");
    const { splitId } = await params;
    const { reason } = await req.json().catch(() => ({ reason: undefined })) as {
      reason?: string;
    };

    const split = await prisma.offSystemSplit.findUnique({
      where: { id: splitId },
    });

    if (!split) return notFound("Split not found");
    if (split.status === "approved") return badRequest("split already approved");
    if (split.status === "rejected") return badRequest("split already rejected");

    const updated = await prisma.offSystemSplit.update({
      where: { id: splitId },
      data: {
        status: "rejected",
        approvedBy: session.userId, // reuse field for who rejected
        approvedAt: new Date(),
      },
    });

    return ok({ splitId: updated.id, status: "rejected", reason: reason ?? null });
  } catch (error) {
    return handleError(error);
  }
}
