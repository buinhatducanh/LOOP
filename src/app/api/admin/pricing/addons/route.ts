/**
 * GET    /api/admin/pricing/addons  — List all AddonServices
 * POST   /api/admin/pricing/addons  — Create an addon
 * PUT    /api/admin/pricing/addons  — Update an addon
 * DELETE /api/admin/pricing/addons  — Delete an addon
 *
 * Manages: AddonService model — extra services (Domain, SSL, Hosting...)
 * Permissions: settings:read / settings:update
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, list, handleError, badRequest } from "@/lib/api";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("settings", "read");

    const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10);
    const offset = (page - 1) * limit;
    const type = req.nextUrl.searchParams.get("type");
    const isActiveParam = req.nextUrl.searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (isActiveParam !== null) where.isActive = isActiveParam === "true";

    const [items, total] = await Promise.all([
      prisma.addonService.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: offset,
        take: limit,
      }),
      prisma.addonService.count({ where }),
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
      slug, _name, nameVi, nameEn, nameJa, nameKo, nameZh,
      description, descriptionVi, descriptionEn, descriptionJa, descriptionKo, descriptionZh,
      icon, type, price, billingPeriod, metadata, sortOrder, isActive,
    } = body;

    if (!slug || typeof slug !== "string") return badRequest("slug là bắt buộc");
    if (!nameVi || typeof nameVi !== "string") return badRequest("nameVi là bắt buộc");
    if (typeof price !== "number" || price < 0) return badRequest("price phải là số ≥ 0");

    const existing = await prisma.addonService.findUnique({ where: { slug } });
    if (existing) return badRequest("slug đã tồn tại");

    const created = await prisma.addonService.create({
      data: {
        slug: slug.trim(),
        name: nameVi.trim(),
        nameVi: nameVi.trim(),
        nameEn: nameEn?.trim() || null,
        nameJa: nameJa?.trim() || null,
        nameKo: nameKo?.trim() || null,
        nameZh: nameZh?.trim() || null,
        description: description?.trim() || null,
        descriptionVi: descriptionVi?.trim() || null,
        descriptionEn: descriptionEn?.trim() || null,
        descriptionJa: descriptionJa?.trim() || null,
        descriptionKo: descriptionKo?.trim() || null,
        descriptionZh: descriptionZh?.trim() || null,
        icon: icon?.trim() || null,
        type: type?.trim() || "one_time",
        price,
        billingPeriod: billingPeriod?.trim() || null,
        metadata: metadata || null,
        sortOrder: Number(sortOrder) || 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "addon-service",
      resourceId: created.id,
      newValues: { slug, nameVi, price },
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

    const existing = await prisma.addonService.findUnique({ where: { id } });
    if (!existing) return badRequest("Không tìm thấy addon");

    const updated = await prisma.addonService.update({
      where: { id },
      data: {
        ...(data.slug !== undefined && { slug: String(data.slug).trim() }),
        ...(data.name !== undefined && { name: String(data.name).trim() }),
        ...(data.nameVi !== undefined && { nameVi: String(data.nameVi).trim() }),
        ...(data.nameEn !== undefined && { nameEn: String(data.nameEn).trim() || null }),
        ...(data.nameJa !== undefined && { nameJa: String(data.nameJa).trim() || null }),
        ...(data.nameKo !== undefined && { nameKo: String(data.nameKo).trim() || null }),
        ...(data.nameZh !== undefined && { nameZh: String(data.nameZh).trim() || null }),
        ...(data.description !== undefined && { description: String(data.description).trim() || null }),
        ...(data.descriptionVi !== undefined && { descriptionVi: String(data.descriptionVi).trim() || null }),
        ...(data.descriptionEn !== undefined && { descriptionEn: String(data.descriptionEn).trim() || null }),
        ...(data.descriptionJa !== undefined && { descriptionJa: String(data.descriptionJa).trim() || null }),
        ...(data.descriptionKo !== undefined && { descriptionKo: String(data.descriptionKo).trim() || null }),
        ...(data.descriptionZh !== undefined && { descriptionZh: String(data.descriptionZh).trim() || null }),
        ...(data.icon !== undefined && { icon: String(data.icon).trim() || null }),
        ...(data.type !== undefined && { type: String(data.type).trim() }),
        ...(data.price !== undefined && { price: Number(data.price) || 0 }),
        ...(data.billingPeriod !== undefined && { billingPeriod: String(data.billingPeriod).trim() || null }),
        ...(data.metadata !== undefined && { metadata: data.metadata ?? undefined }),
        ...(data.sortOrder !== undefined && { sortOrder: Number(data.sortOrder) || 0 }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "addon-service",
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

    await prisma.addonService.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "addon-service",
      resourceId: id,
    });

    return ok({ id });
  } catch (err) {
    return handleError(err);
  }
}
