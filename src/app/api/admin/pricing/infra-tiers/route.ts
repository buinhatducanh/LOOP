/**
 * GET    /api/admin/pricing/infra-tiers  — List all InfrastructureTiers
 * POST   /api/admin/pricing/infra-tiers  — Create an infra tier
 * PUT    /api/admin/pricing/infra-tiers  — Update an infra tier
 * DELETE /api/admin/pricing/infra-tiers  — Delete an infra tier
 *
 * Manages: InfrastructureTier model — hosting/DevOps cost tiers
 * Permissions: settings:read / settings:update
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, list, handleError, badRequest } from "@/lib/api";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(_req: NextRequest) {
  try {
    await requirePermission("settings", "read");

    const page = parseInt(_req.nextUrl.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(_req.nextUrl.searchParams.get("limit") ?? "50", 10);
    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.infrastructureTier.findMany({
        orderBy: { monthlyCost: "asc" },
        skip: offset,
        take: limit,
      }),
      prisma.infrastructureTier.count(),
    ]);

    return list(items, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("settings", "update");
    const body = await req.json();

    const {
      slug, name, nameVi, nameEn, nameJa, nameKo, nameZh,
      monthlyCost, setupCost, description, descriptionVi, descriptionEn,
      descriptionJa, descriptionKo, descriptionZh,
    } = body;

    if (!slug || typeof slug !== "string") return badRequest("slug là bắt buộc");
    if (typeof monthlyCost !== "number" || monthlyCost < 0) return badRequest("monthlyCost phải là số ≥ 0");

    const existing = await prisma.infrastructureTier.findUnique({ where: { slug } });
    if (existing) return badRequest("slug đã tồn tại");

    const created = await prisma.infrastructureTier.create({
      data: {
        slug: slug.trim(),
        name: nameVi?.trim() || name?.trim() || slug,
        nameVi: nameVi?.trim() || slug,
        nameEn: nameEn?.trim() || null,
        nameJa: nameJa?.trim() || null,
        nameKo: nameKo?.trim() || null,
        nameZh: nameZh?.trim() || null,
        monthlyCost,
        setupCost: Number(setupCost) || 0,
        description: description?.trim() || null,
        descriptionVi: descriptionVi?.trim() || null,
        descriptionEn: descriptionEn?.trim() || null,
        descriptionJa: descriptionJa?.trim() || null,
        descriptionKo: descriptionKo?.trim() || null,
        descriptionZh: descriptionZh?.trim() || null,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "infrastructure-tier",
      resourceId: created.id,
      newValues: { slug, nameVi, monthlyCost },
    });

    return ok(created, 201);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requirePermission("settings", "update");
    const body = await req.json();
    const { id, ...data } = body as { id: string } & Record<string, unknown>;

    if (!id) return badRequest("id là bắt buộc");

    const existing = await prisma.infrastructureTier.findUnique({ where: { id } });
    if (!existing) return badRequest("Không tìm thấy infra tier");

    const updated = await prisma.infrastructureTier.update({
      where: { id },
      data: {
        ...(data.slug !== undefined && { slug: String(data.slug).trim() }),
        ...(data.name !== undefined && { name: String(data.name).trim() }),
        ...(data.nameVi !== undefined && { nameVi: String(data.nameVi).trim() }),
        ...(data.nameEn !== undefined && { nameEn: String(data.nameEn).trim() || null }),
        ...(data.nameJa !== undefined && { nameJa: String(data.nameJa).trim() || null }),
        ...(data.nameKo !== undefined && { nameKo: String(data.nameKo).trim() || null }),
        ...(data.nameZh !== undefined && { nameZh: String(data.nameZh).trim() || null }),
        ...(data.monthlyCost !== undefined && { monthlyCost: Number(data.monthlyCost) || 0 }),
        ...(data.setupCost !== undefined && { setupCost: Number(data.setupCost) || 0 }),
        ...(data.description !== undefined && { description: String(data.description).trim() || null }),
        ...(data.descriptionVi !== undefined && { descriptionVi: String(data.descriptionVi).trim() || null }),
        ...(data.descriptionEn !== undefined && { descriptionEn: String(data.descriptionEn).trim() || null }),
        ...(data.descriptionJa !== undefined && { descriptionJa: String(data.descriptionJa).trim() || null }),
        ...(data.descriptionKo !== undefined && { descriptionKo: String(data.descriptionKo).trim() || null }),
        ...(data.descriptionZh !== undefined && { descriptionZh: String(data.descriptionZh).trim() || null }),
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "infrastructure-tier",
      resourceId: id,
      newValues: data,
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requirePermission("settings", "update");
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");

    if (!id) return badRequest("id là bắt buộc");

    await prisma.infrastructureTier.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "infrastructure-tier",
      resourceId: id,
    });

    return ok({ id });
  } catch (err) {
    return handleError(err);
  }
}
