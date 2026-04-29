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

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("settings", "update");
    const body = await req.json();

    const {
      slug, title, titleEn, titleJa, titleKo, titleZh,
      shortDesc, shortDescEn, shortDescJa, shortDescKo, shortDescZh,
      type, price, priceText, features, isSubscription, billingPeriod, sortOrder, isActive, serviceKey, tagline, color, isPopular,
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
        serviceKey: serviceKey?.trim() || null,
        tagline: tagline?.trim() || null,
        color: color?.trim() || null,
        isPopular: Boolean(isPopular),
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

export async function PUT(req: NextRequest) {
  try {
    const session = await requirePermission("settings", "update");
    const body = await req.json();
    const { id, ...data } = body as { id: string } & Record<string, unknown>;

    if (!id) return badRequest("id là bắt buộc");

    const existing = await prisma.servicePackage.findUnique({ where: { id } });
    if (!existing) return badRequest("Không tìm thấy package");

    const updated = await prisma.servicePackage.update({
      where: { id },
      data: {
        slug: data.slug !== undefined ? String(data.slug).trim() : undefined,
        title: data.title !== undefined ? String(data.title).trim() : undefined,
        titleEn: data.titleEn !== undefined ? (String(data.titleEn).trim() || null) : undefined,
        titleJa: data.titleJa !== undefined ? (String(data.titleJa).trim() || null) : undefined,
        titleKo: data.titleKo !== undefined ? (String(data.titleKo).trim() || null) : undefined,
        titleZh: data.titleZh !== undefined ? (String(data.titleZh).trim() || null) : undefined,
        shortDesc: data.shortDesc !== undefined ? String(data.shortDesc).trim() : undefined,
        shortDescEn: data.shortDescEn !== undefined ? (String(data.shortDescEn).trim() || null) : undefined,
        shortDescJa: data.shortDescJa !== undefined ? (String(data.shortDescJa).trim() || null) : undefined,
        shortDescKo: data.shortDescKo !== undefined ? (String(data.shortDescKo).trim() || null) : undefined,
        shortDescZh: data.shortDescZh !== undefined ? (String(data.shortDescZh).trim() || null) : undefined,
        type: data.type !== undefined ? String(data.type).trim() : undefined,
        price: data.price !== undefined ? (data.price !== null ? Number(data.price) : null) : undefined,
        priceText: data.priceText !== undefined ? (String(data.priceText).trim() || null) : undefined,
        features: data.features !== undefined ? (Array.isArray(data.features) ? data.features : []) : undefined,
        isSubscription: data.isSubscription !== undefined ? Boolean(data.isSubscription) : undefined,
        billingPeriod: data.billingPeriod !== undefined ? (String(data.billingPeriod).trim() || null) : undefined,
        sortOrder: data.sortOrder !== undefined ? (Number(data.sortOrder) || 0) : undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
        serviceKey: data.serviceKey !== undefined ? (String(data.serviceKey).trim() || null) : undefined,
        tagline: data.tagline !== undefined ? (String(data.tagline).trim() || null) : undefined,
        color: data.color !== undefined ? (String(data.color).trim() || null) : undefined,
        isPopular: data.isPopular !== undefined ? Boolean(data.isPopular) : undefined,
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

export async function DELETE(req: NextRequest) {
  try {
    const session = await requirePermission("settings", "update");
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
