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

    // Query ServicePackage (type = "website") instead of PricingWebPackage
    const where = search
      ? { title: { contains: search, mode: "insensitive" as const }, type: "website" }
      : { type: "website" };

    const packages = await prisma.servicePackage.findMany({
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

    const pkg = await prisma.servicePackage.create({
      data: {
        slug: data.slug,
        title: data.title ?? data.name ?? "",
        shortDesc: data.shortDesc ?? data.tagline ?? "",
        type: "website",
        price: data.price ?? 0,
        priceText: data.priceText ?? "",
        features: Array.isArray(data.features) ? data.features : [],
        isSubscription: false,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "service_package",
      resourceId: pkg.id,
      newValues: data,
    });

    revalidatePath("/vi/thiet-ke-website");
    revalidatePath("/en/thiet-ke-website");

    return NextResponse.json({ data: pkg }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
