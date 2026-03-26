import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("packages", "read");
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    const where = categoryId ? { categoryId } : {};

    const features = await prisma.pricingComparisonFeature.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: { category: { select: { name: true, nameVi: true } } },
    });

    return NextResponse.json({ data: features });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("packages", "create");
    const data = await req.json();

    const feature = await prisma.pricingComparisonFeature.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        nameVi: data.nameVi,
        tooltip: data.tooltip || null,
        tooltipVi: data.tooltipVi || null,
        values: data.values || {},
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "pricing_comparison_features",
      resourceId: feature.id,
      newValues: data,
    });

    revalidatePath("/vi/pricing");
    revalidatePath("/en/pricing");

    return NextResponse.json({ data: feature }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
