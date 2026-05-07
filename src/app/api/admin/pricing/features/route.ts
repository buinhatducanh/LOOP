/**
 * GET    /api/admin/pricing/features  — List all ServiceAttributes (features)
 * POST   /api/admin/pricing/features  — Create a feature
 * PUT    /api/admin/pricing/features  — Bulk update features
 *
 * Manages: ServiceAttribute model — pricing features/attributes
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
    const category = req.nextUrl.searchParams.get("category");
    const isActiveParam = req.nextUrl.searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (isActiveParam !== null) where.isActive = isActiveParam === "true";

    const [items, total] = await Promise.all([
      prisma.serviceAttribute.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: offset,
        take: limit,
      }),
      prisma.serviceAttribute.count({ where }),
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
      description, descriptionVi,
      category, categoryVi, categoryEn, categoryJa, categoryKo, categoryZh,
      icon, price, isRequired, sortOrder, isActive, tier, xpPoints, parentId,
    } = body;

    if (!slug || typeof slug !== "string") return badRequest("slug là bắt buộc");
    if (!nameVi || typeof nameVi !== "string") return badRequest("nameVi là bắt buộc");
    if (!category || typeof category !== "string") return badRequest("category là bắt buộc");
    if (!categoryVi || typeof categoryVi !== "string") return badRequest("categoryVi là bắt buộc");

    const existing = await prisma.serviceAttribute.findUnique({ where: { slug } });
    if (existing) return badRequest("slug đã tồn tại");

    const created = await prisma.$transaction(async (tx) => {
      const attr = await tx.serviceAttribute.create({
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
          category: category.trim(),
          categoryVi: categoryVi.trim(),
          categoryEn: categoryEn?.trim() || null,
          categoryJa: categoryJa?.trim() || null,
          categoryKo: categoryKo?.trim() || null,
          categoryZh: categoryZh?.trim() || null,
          icon: icon?.trim() || null,
          price: Number(price) || 0,
          isRequired: Boolean(isRequired),
          sortOrder: Number(sortOrder) || 0,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          tier: tier || "basic",
          xpPoints: Number(xpPoints) || 0,
          parentId: parentId || null,
          serviceKey: body.serviceKey || "web",
        },
      });

      // SYNC: Create Feature in Matrix
      // 1. Find or create group
      const groupName = categoryVi.trim();
      const groupSlug = category.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
      
      let group = await tx.featureGroup.findFirst({
        where: { groupName: { equals: groupName, mode: "insensitive" } }
      });

      if (!group) {
        group = await tx.featureGroup.create({
          data: {
            groupName,
            slug: groupSlug,
            serviceKey: body.serviceKey || "web",
            sortOrder: 99,
          }
        });
      }

      // 2. Create feature
      await tx.feature.create({
        data: {
          groupId: group.id,
          featureName: nameVi.trim(),
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          category: groupName,
          includedTiers: [], // Default to empty, admin will configure tiers later
        }
      });

      return attr;
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "service-attribute",
      resourceId: created.id,
      newValues: { slug, nameVi, categoryVi },
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

    const existing = await prisma.serviceAttribute.findUnique({ where: { id } });
    if (!existing) return badRequest("Không tìm thấy feature");

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.serviceAttribute.update({
        where: { id },
        data: {
          ...(data.slug !== undefined ? { slug: String(data.slug).trim() } : {}),
          ...(data.name !== undefined ? { name: String(data.name).trim() } : {}),
          ...(data.nameVi !== undefined ? { nameVi: String(data.nameVi).trim() } : {}),
          ...(data.nameEn !== undefined ? { nameEn: String(data.nameEn).trim() || null } : {}),
          ...(data.nameJa !== undefined ? { nameJa: String(data.nameJa).trim() || null } : {}),
          ...(data.nameKo !== undefined ? { nameKo: String(data.nameKo).trim() || null } : {}),
          ...(data.nameZh !== undefined ? { nameZh: String(data.nameZh).trim() || null } : {}),
          ...(data.description !== undefined ? { description: String(data.description).trim() || null } : {}),
          ...(data.descriptionVi !== undefined ? { descriptionVi: String(data.descriptionVi).trim() || null } : {}),
          ...(data.category !== undefined ? { category: String(data.category).trim() } : {}),
          ...(data.categoryVi !== undefined ? { categoryVi: String(data.categoryVi).trim() } : {}),
          ...(data.categoryEn !== undefined ? { categoryEn: String(data.categoryEn).trim() || null } : {}),
          ...(data.categoryJa !== undefined ? { categoryJa: String(data.categoryJa).trim() || null } : {}),
          ...(data.categoryKo !== undefined ? { categoryKo: String(data.categoryKo).trim() || null } : {}),
          ...(data.categoryZh !== undefined ? { categoryZh: String(data.categoryZh).trim() || null } : {}),
          ...(data.icon !== undefined ? { icon: String(data.icon).trim() || null } : {}),
          ...(data.price !== undefined ? { price: Number(data.price) || 0 } : {}),
          ...(data.isRequired !== undefined ? { isRequired: Boolean(data.isRequired) } : {}),
          ...(data.sortOrder !== undefined ? { sortOrder: Number(data.sortOrder) || 0 } : {}),
          ...(data.isActive !== undefined ? { isActive: Boolean(data.isActive) } : {}),
          ...(data.tier !== undefined ? { tier: String(data.tier) } : {}),
          ...(data.xpPoints !== undefined ? { xpPoints: Number(data.xpPoints) || 0 } : {}),
          ...(data.parentId !== undefined ? { parentId: data.parentId ? String(data.parentId) : null } : {}),
        },
      });

      // SYNC: Update Feature (Comparison Matrix) if nameVi, name, or slug matches
      const nameViVal = (data.nameVi as string) || existing.nameVi || "";
      const nameVal = (data.name as string) || existing.name || "";
      const slugVal = (data.slug as string) || existing.slug || "";
      const featuresToSync = await tx.feature.findMany({
        where: {
          OR: [
            ...(nameViVal ? [{ featureName: { equals: nameViVal, mode: "insensitive" as const } }] : []),
            ...(nameVal ? [{ featureName: { equals: nameVal, mode: "insensitive" as const } }] : []),
            ...(slugVal ? [{ featureName: { equals: slugVal, mode: "insensitive" as const } }] : []),
          ],
        },
        select: { id: true },
      });

      if (featuresToSync.length > 0) {
        const syncData: Record<string, unknown> = {
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive,
        };
        if (data.nameVi) syncData.featureName = String(data.nameVi).trim();
        if (data.categoryVi) syncData.category = String(data.categoryVi).trim();
        await tx.feature.updateMany({
          where: { id: { in: featuresToSync.map((f) => f.id) } },
          data: syncData,
        });
      }

      return u;
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "service-attribute",
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

    const existing = await prisma.serviceAttribute.findUnique({ where: { id } });
    if (!existing) return ok({ id });

    await prisma.$transaction(async (tx) => {
      // 1. Delete the ServiceAttribute
      await tx.serviceAttribute.delete({ where: { id } });

      // 2. SYNC: Delete corresponding features from the Comparison Matrix
      // Match by featureName (using nameVi, name, or slug to be safe, matching PUT logic)
      const nameViVal = existing.nameVi || "";
      const nameVal = existing.name || "";
      const slugVal = existing.slug || "";

      await tx.feature.deleteMany({
        where: {
          OR: [
            ...(nameViVal ? [{ featureName: { equals: nameViVal, mode: "insensitive" as const } }] : []),
            ...(nameVal ? [{ featureName: { equals: nameVal, mode: "insensitive" as const } }] : []),
            ...(slugVal ? [{ featureName: { equals: slugVal, mode: "insensitive" as const } }] : []),
          ],
        },
      });

      // Optional: Clean up empty groups if needed, but safer to leave them or manage them separately
    });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "service-attribute",
      resourceId: id,
    });

    return ok({ id });
  } catch (err) {
    return handleError(err);
  }
}
