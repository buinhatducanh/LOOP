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
    const search = searchParams.get("search") || "";

    const where = search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {};

    const packages = await prisma.pricingWebPackage.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ data: packages });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("packages", "create");
    const data = await req.json();

    const pkg = await prisma.pricingWebPackage.create({
      data: {
        slug: data.slug,
        name: data.name,
        nameVi: data.nameVi,
        tagline: data.tagline,
        taglineVi: data.taglineVi,
        price: data.price,
        currency: data.currency || "VND",
        period: data.period,
        periodVi: data.periodVi,
        highlighted: data.highlighted ?? false,
        cta: data.cta,
        ctaVi: data.ctaVi,
        color: data.color || "#3B82F6",
        pages: data.pages,
        pagesVi: data.pagesVi,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "pricing_web_packages",
      resourceId: pkg.id,
      newValues: data,
    });

    revalidatePath("/vi/pricing");
    revalidatePath("/en/pricing");

    return NextResponse.json({ data: pkg }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
