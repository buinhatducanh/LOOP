import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath } from "next/cache";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("packages", "update");
    const { id } = await params;
    const data = await req.json();

    const old = await prisma.servicePackage.findUnique({ where: { id } });
    const pkg = await prisma.servicePackage.update({
      where: { id },
      data: {
        // Core fields
        slug: data.slug,
        title: data.title ?? data.name ?? "",
        shortDesc: data.shortDesc ?? data.tagline ?? "",
        price: data.price ?? 0,
        priceText: data.priceText ?? "",
        features: Array.isArray(data.features) ? data.features : [],
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
        // Admin-managed fields
        isPopular: data.isPopular ?? false,
        tagline: data.tagline ?? null,
        color: data.color ?? null,
        pages: data.pages ?? null,
        pagesVi: data.pagesVi ?? null,
        marketPrice: data.marketPrice ?? null,
        isSubscription: data.isSubscription ?? false,
        billingPeriod: data.billingPeriod ?? null,
        videoUrl: data.videoUrl ?? null,
        videoThumbnail: data.videoThumbnail ?? null,
        serviceKey: data.serviceKey ?? null,
        tierLevel: data.tierLevel ?? 1,
        // Localized titles
        titleEn: data.titleEn ?? null,
        titleJa: data.titleJa ?? null,
        titleKo: data.titleKo ?? null,
        titleZh: data.titleZh ?? null,
        // Localized descriptions
        shortDescEn: data.shortDescEn ?? null,
        shortDescJa: data.shortDescJa ?? null,
        shortDescKo: data.shortDescKo ?? null,
        shortDescZh: data.shortDescZh ?? null,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "service_package",
      resourceId: id,
      oldValues: old as unknown as Record<string, unknown>,
      newValues: data,
    });

    revalidatePath("/vi/thiet-ke-website");
    revalidatePath("/en/thiet-ke-website");

    return ok(pkg);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("packages", "delete");
    const { id } = await params;

    const old = await prisma.servicePackage.findUnique({ where: { id } });
    await prisma.servicePackage.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "service_package",
      resourceId: id,
      oldValues: old as unknown as Record<string, unknown>,
    });

    revalidatePath("/vi/thiet-ke-website");
    revalidatePath("/en/thiet-ke-website");

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
