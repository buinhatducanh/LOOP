/**
 * GET  /api/admin/seo-tiers — List SEO tiers (serviceKey = "seo")
 * POST /api/admin/seo-tiers — Create SEO tier
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, list, handleError, badRequest } from "@/lib/api";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("services", "read");
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = { serviceKey: "seo" };
    if (isActive !== null) where.isActive = isActive === "true";

    const [tiers, total] = await Promise.all([
      prisma.serviceTier.findMany({
        where,
        orderBy: { sortOrder: "asc" },
      }),
      prisma.serviceTier.count({ where }),
    ]);

    return list(tiers, { page: 1, limit: 100, total, totalPages: 1 });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("services", "create");
    const body = await req.json();
    const {
      level, name, nameEn,
      shortDesc,
      basePrice, marketPrice, lpReward, sortOrder, isActive,
    } = body;

    if (level === undefined || !name || basePrice === undefined) {
      return badRequest("level, name, basePrice are required");
    }

    // SEO tiers: serviceKey = "seo"
    const tier = await prisma.serviceTier.create({
      data: {
        serviceKey: "seo",
        level: Number(level),
        name: String(name).trim(),
        nameEn: nameEn?.trim() || null,
        shortDesc: shortDesc?.trim() || null,
        basePrice: Number(basePrice),
        marketPrice: (marketPrice !== undefined && marketPrice !== null && marketPrice !== "") ? Number(marketPrice) : null,
        lpReward: Number(lpReward ?? 0),
        sortOrder: Number(sortOrder ?? level),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "seo_tier",
      resourceId: tier.id,
      newValues: { level, name, basePrice },
    });

    return ok(tier, 201);
  } catch (err: any) {
    if (err.code === "P2002") {
      return badRequest("Level này đã tồn tại trong hệ thống SEO. Vui lòng chọn Level khác.");
    }
    return handleError(err);
  }
}
