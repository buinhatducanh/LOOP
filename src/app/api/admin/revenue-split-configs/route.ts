/**
 * RevenueSplitConfig CRUD API
 * GET  /api/admin/revenue-split-configs     → list all configs
 * POST /api/admin/revenue-split-configs     → create config
 */

import { handleError, ok, list, badRequest } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(_req: NextRequest) {
  try {
    await requirePermission("revenue_split_configs", "read");

    const configs = await prisma.revenueSplitConfig.findMany({
      orderBy: { percentage: "desc" },
    });

    return ok(configs);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("revenue_split_configs", "create");

    const body = await req.json();
    const { key, label, percentage, isActive } = body;

    if (!key || typeof key !== "string") {
      return badRequest("key is required");
    }
    if (!label || typeof label !== "string") {
      return badRequest("label is required");
    }
    if (typeof percentage !== "number" || percentage < 0 || percentage > 100) {
      return badRequest("percentage must be a number between 0 and 100");
    }

    // Check for duplicate key
    const existing = await prisma.revenueSplitConfig.findUnique({ where: { key } });
    if (existing) {
      return NextResponse.json(
        { error: `Config with key "${key}" already exists` },
        { status: 409 }
      );
    }

    const config = await prisma.revenueSplitConfig.create({
      data: { key, label, percentage, isActive: isActive ?? true },
    });

    return ok(config, 201);
  } catch (error) {
    return handleError(error);
  }
}