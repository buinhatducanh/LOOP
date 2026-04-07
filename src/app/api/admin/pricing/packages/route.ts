/**
 * GET    /api/admin/pricing/packages  — List all ServicePackages
 * POST   /api/admin/pricing/packages  — Create a package
 * PUT    /api/admin/pricing/packages  — Update a package
 * DELETE /api/admin/pricing/packages  — Delete a package
 *
 * Manages: ServicePackage model — pricing bundles (Basic/Pro/Enterprise)
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
    const type = _req.nextUrl.searchParams.get("type");
    const isActiveParam = _req.nextUrl.searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (isActiveParam !== null) where.isActive = isActiveParam === "true";

    const [items, total] = await Promise.all([
      prisma.servicePackage.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: offset,
        take: limit,
      }),
      prisma.servicePackage.count({ where }),
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

export async function POST(_req: NextRequest) {
  try {
    const _session = await requirePermission("settings", "update");
    const body = await req.json();

    const {
      slug, title, titleEn, titleJa, titleKo, titleZh,
      shortDesc, shortDescEn, shortDescJa, shortDescKo, shortDescZh,
      type, price, priceText, features, isSubscription, billingPeriod, sortOrder, isActive,
    } = body;

    if (!slug || typeof slug !== "string") return badRequest("slug là bắt buộc");
    if (!title || typeof title !== "string") return badRequest("title là bắt buộc");
    if (!shortDesc || typeof shortDesc !== "string") return badRequest("shortDesc là bắt buộc");
    if (!type || typeof type !== "string") return badRequest("type là bắt buộc");

    const existing = await prisma.servicePackage.findUnique({ where: { slug } });
    if (existing) return badRequest("slug đã tồn tại");

    const created = await prisma.servicePackage.create({
      data: {
        slug: slug.trim(),
        title: title.trim(),
        titleEn: titleEn?.trim() || null,
        titleJa: titleJa?.trim() || null,
        titleKo: titleKo?.trim() || null,
        titleZh: titleZh?.trim() || null,
        shortDesc: shortDesc.trim(),
        shortDescEn: shortDescEn?.trim() || null,
        shortDescJa: shortDescJa?.trim() || null,
        shortDescKo: shortDescKo?.trim() || null,
        shortDescZh: shortDescZh?.trim() || null,
        type: type.trim(),
        price: price !== undefined ? Number(price) : null,
        priceText: priceText?.trim() || null,
        features: Array.isArray(features) ? features : [],
        isSubscription: Boolean(isSubscription),
        billingPeriod: billingPeriod?.trim() || null,
        sortOrder: Number(sortOrder) || 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "service-package",
      resourceId: created.id,
      newValues: { slug, title, type },
    });

    return ok(created, 201);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(_req: NextRequest) {
  try {
    const _session = await requirePermission("settings", "update");
    const body = await req.json();
    const { id, ...data } = body as { id: string } & Record<string, unknown>;

    if (!id) return badRequest("id là bắt buộc");

    const existing = await prisma.servicePackage.findUnique({ where: { id } });
    if (!existing) return badRequest("Không tìm thấy package");

    const updated = await prisma.servicePackage.update({
      where: { id },
      data: {
        ...(data.slug !== undefined && { slug: String(data.slug).trim() }),
        ...(data.title !== undefined && { title: String(data.title).trim() }),
        ...(data.titleEn !== undefined && { titleEn: String(data.titleEn).trim() || null }),
        ...(data.titleJa !== undefined && { titleJa: String(data.titleJa).trim() || null }),
        ...(data.titleKo !== undefined && { titleKo: String(data.titleKo).trim() || null }),
        ...(data.titleZh !== undefined && { titleZh: String(data.titleZh).trim() || null }),
        ...(data.shortDesc !== undefined && { shortDesc: String(data.shortDesc).trim() }),
        ...(data.shortDescEn !== undefined && { shortDescEn: String(data.shortDescEn).trim() || null }),
        ...(data.shortDescJa !== undefined && { shortDescJa: String(data.shortDescJa).trim() || null }),
        ...(data.shortDescKo !== undefined && { shortDescKo: String(data.shortDescKo).trim() || null }),
        ...(data.shortDescZh !== undefined && { shortDescZh: String(data.shortDescZh).trim() || null }),
        ...(data.type !== undefined && { type: String(data.type).trim() }),
        ...(data.price !== undefined && { price: data.price !== null ? Number(data.price) : null }),
        ...(data.priceText !== undefined && { priceText: String(data.priceText).trim() || null }),
        ...(data.features !== undefined && { features: Array.isArray(data.features) ? data.features : [] }),
        ...(data.isSubscription !== undefined && { isSubscription: Boolean(data.isSubscription) }),
        ...(data.billingPeriod !== undefined && { billingPeriod: String(data.billingPeriod).trim() || null }),
        ...(data.sortOrder !== undefined && { sortOrder: Number(data.sortOrder) || 0 }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "service-package",
      resourceId: id,
      newValues: data,
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const _session = await requirePermission("settings", "update");
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");

    if (!id) return badRequest("id là bắt buộc");

    await prisma.servicePackage.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "service-package",
      resourceId: id,
    });

    return ok({ id });
  } catch (err) {
    return handleError(err);
  }
}
