/**
 * RevenueSplitConfig single-item API
 * GET    /api/admin/revenue-split-configs/:id
 * PUT    /api/admin/revenue-split-configs/:id
 * DELETE /api/admin/revenue-split-configs/:id
 */

import { handleError, ok, notFound, badRequest } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("revenue_split_configs", "read");
    const { id } = await params;

    const config = await prisma.revenueSplitConfig.findUnique({ where: { id } });
    if (!config) return notFound("Config not found");

    return ok(config);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("revenue_split_configs", "update");
    const { id } = await params;
    const body = await req.json();

    const { label, percentage, isActive } = body;

    if (percentage !== undefined && (typeof percentage !== "number" || percentage < 0 || percentage > 100)) {
      return badRequest("percentage must be a number between 0 and 100");
    }

    const existing = await prisma.revenueSplitConfig.findUnique({ where: { id } });
    if (!existing) return notFound("Config not found");

    // Recalculate: if changing one role's %, other roles stay as-is (admin manages totals)
    // No auto-rebalancing — admin must manually ensure sum ≤ 100
    const updated = await prisma.revenueSplitConfig.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(percentage !== undefined && { percentage }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("revenue_split_configs", "delete");
    const { id } = await params;

    const existing = await prisma.revenueSplitConfig.findUnique({ where: { id } });
    if (!existing) return notFound("Config not found");

    await prisma.revenueSplitConfig.delete({ where: { id } });

    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}