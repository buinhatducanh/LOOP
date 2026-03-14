import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    await requirePermission("packages", "read");

    const categories = await prisma.pricingFeatureCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        features: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json({ data: categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("packages", "create");
    const data = await req.json();

    const category = await prisma.pricingFeatureCategory.create({
      data: {
        slug: data.slug,
        name: data.name,
        nameVi: data.nameVi,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "pricing_feature_categories",
      resourceId: category.id,
      newValues: data,
    });

    revalidatePath("/vi/pricing");
    revalidatePath("/en/pricing");

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
