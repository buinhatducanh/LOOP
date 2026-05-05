/**
 * GET    /api/admin/seo-tiers/[id] — Get single SEO tier
 * PUT    /api/admin/seo-tiers/[id] — Update SEO tier
 * DELETE /api/admin/seo-tiers/[id] — Delete SEO tier
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, handleError, badRequest } from "@/lib/api";
import { createAuditLog } from "@/lib/auth/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("services", "read");
    const { id } = await params;

    const tier = await prisma.serviceTier.findUnique({ where: { id } });
    if (!tier) return badRequest("Không tìm thấy SEO tier");
    if (tier.serviceKey !== "seo") return badRequest("Không phải SEO tier");

    return ok(tier);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission("services", "update");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.serviceTier.findUnique({ where: { id } });
    if (!existing) return badRequest("Không tìm thấy SEO tier");
    if (existing.serviceKey !== "seo") return badRequest("Không phải SEO tier");

    const updated = await prisma.serviceTier.update({
      where: { id },
      data: {
        ...(body.level !== undefined && { level: Number(body.level) }),
        ...(body.name !== undefined && { name: String(body.name).trim() }),
        ...(body.nameEn !== undefined && { nameEn: body.nameEn?.trim() || null }),
        ...(body.shortDesc !== undefined && { shortDesc: body.shortDesc?.trim() || null }),
        ...(body.shortDescEn !== undefined && { shortDescEn: body.shortDescEn?.trim() || null }),
        ...(body.basePrice !== undefined && { basePrice: Number(body.basePrice) }),
        ...(body.marketPrice !== undefined && { marketPrice: (body.marketPrice !== null && body.marketPrice !== "") ? Number(body.marketPrice) : null }),
        ...(body.lpReward !== undefined && { lpReward: Number(body.lpReward ?? 0) }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "seo_tier",
      resourceId: id,
      newValues: body,
    });

    return ok(updated);
  } catch (err: any) {
    console.error("[PUT /api/admin/seo-tiers/[id]] Error:", err);
    // Bắt lỗi trùng Level (Unique constraint của Prisma là P2002)
    if (err.code === "P2002") {
      return badRequest("Level này đã tồn tại trong hệ thống SEO. Vui lòng chọn Level khác.");
    }
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission("services", "delete");
    const { id } = await params;

    const existing = await prisma.serviceTier.findUnique({ where: { id } });
    if (!existing) return badRequest("Không tìm thấy SEO tier");
    if (existing.serviceKey !== "seo") return badRequest("Không phải SEO tier");

    await prisma.serviceTier.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "seo_tier",
      resourceId: id,
    });

    return ok({ id });
  } catch (err) {
    return handleError(err);
  }
}
