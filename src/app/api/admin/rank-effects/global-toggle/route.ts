import { handleError, ok } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

/**
 * GET /api/admin/rank-effects/global-toggle
 * Returns the global effects enabled state based on effect counts.
 */
export async function GET() {
  try {
    const session = await requirePermission("effects", "read");

    // If ANY effect is disabled → global toggle is OFF
    // If ALL effects are enabled → global toggle is ON
    const total = await prisma.rankEffect.count();
    const disabledCount = await prisma.rankEffect.count({ where: { isEnabled: false } });
    const isEnabled = total > 0 && disabledCount === 0;
    return ok({ isEnabled, total, enabled: total - disabledCount, disabled: disabledCount });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/admin/rank-effects/global-toggle
 * Body: { isEnabled: boolean }
 * Enables or disables ALL rank effects globally.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await requirePermission("effects", "update");
    const { isEnabled } = await req.json();

    if (typeof isEnabled !== "boolean") {
      return ok({ error: "isEnabled (boolean) is required" }, 400);
    }

    await prisma.rankEffect.updateMany({ data: { isEnabled } });

    const updated = await prisma.rankEffect.findMany({ select: { id: true, name: true, isEnabled: true } });
    return ok({ success: true, isEnabled, updatedCount: updated.length });
  } catch (error) {
    return handleError(error);
  }
}
