import { NextRequest, NextResponse } from "next/server";
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

    const old = await prisma.pricingWebPackage.findUnique({ where: { id } });
    const pkg = await prisma.pricingWebPackage.update({
      where: { id },
      data: {
        slug: data.slug,
        name: data.name,
        nameVi: data.nameVi,
        tagline: data.tagline,
        taglineVi: data.taglineVi,
        price: data.price,
        currency: data.currency,
        period: data.period,
        periodVi: data.periodVi,
        highlighted: data.highlighted,
        cta: data.cta,
        ctaVi: data.ctaVi,
        color: data.color,
        pages: data.pages,
        pagesVi: data.pagesVi,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "pricing_web_packages",
      resourceId: id,
      oldValues: old as unknown as Record<string, unknown>,
      newValues: data,
    });

    revalidatePath("/vi/pricing");
    revalidatePath("/en/pricing");

    return NextResponse.json({ data: pkg });
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

    const old = await prisma.pricingWebPackage.findUnique({ where: { id } });
    await prisma.pricingWebPackage.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "pricing_web_packages",
      resourceId: id,
      oldValues: old as unknown as Record<string, unknown>,
    });

    revalidatePath("/vi/pricing");
    revalidatePath("/en/pricing");

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
