import { NextRequest, NextResponse } from "next/server";
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

    const old = await prisma.pricingComparisonFeature.findUnique({ where: { id } });
    const feature = await prisma.pricingComparisonFeature.update({
      where: { id },
      data: {
        categoryId: data.categoryId,
        name: data.name,
        nameVi: data.nameVi,
        tooltip: data.tooltip,
        tooltipVi: data.tooltipVi,
        values: data.values,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "pricing_comparison_features",
      resourceId: id,
      oldValues: old as unknown as Record<string, unknown>,
      newValues: data,
    });

    revalidatePath("/vi/pricing");
    revalidatePath("/en/pricing");

    return NextResponse.json({ data: feature });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("packages", "delete");
    const { id } = await params;

    const old = await prisma.pricingComparisonFeature.findUnique({ where: { id } });
    await prisma.pricingComparisonFeature.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "pricing_comparison_features",
      resourceId: id,
      oldValues: old as unknown as Record<string, unknown>,
    });

    revalidatePath("/vi/pricing");
    revalidatePath("/en/pricing");

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
