import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    await requirePermission("packages", "read");
    const plans = await prisma.pricingHostingPlan.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ data: plans });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("packages", "create");
    const data = await req.json();

    const plan = await prisma.pricingHostingPlan.create({
      data: {
        slug: data.slug,
        name: data.name,
        nameVi: data.nameVi,
        price: data.price,
        period: data.period,
        periodVi: data.periodVi,
        features: data.features || [],
        featuresVi: data.featuresVi || [],
        highlighted: data.highlighted ?? false,
        color: data.color || "#3B82F6",
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "pricing_hosting_plans",
      resourceId: plan.id,
      newValues: data,
    });

    revalidatePath("/vi/pricing");
    revalidatePath("/en/pricing");

    return NextResponse.json({ data: plan }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
