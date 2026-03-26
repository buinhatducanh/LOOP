import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField, getLocalizedArray } from "@/lib/i18n/localization";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);

    const service = await prisma.service.findUnique({
      where: { slug },
      include: {
        projects: {
          where: { isPublished: true },
          orderBy: { sortOrder: "asc" },
          select: { id: true, slug: true, image: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { version: "v1", error: "Service not found" },
        { status: 404, headers: { "X-API-Version": "v1" } }
      );
    }

    return NextResponse.json({
      version: "v1",
      data: {
        id: service.id,
        slug: service.slug,
        icon: service.icon,
        title: getLocalizedField(service, "title", locale),
        shortDescription: getLocalizedField(service, "shortDescription", locale),
        longDescription: getLocalizedField(service, "longDescription", locale),
        features: getLocalizedArray(service, "features", locale),
        technologies: getLocalizedArray(service, "technologies", locale),
        startingPrice: service.startingPrice,
        deliveryTime: service.deliveryTime,
        category: service.category,
        isActive: service.isActive,
        projects: service.projects,
        _localeUsed: locale,
      },
      headers: { "X-API-Version": "v1" },
    });
  } catch (error) {
    console.error("[/api/services/[slug]] Failed:", error);
    return NextResponse.json(
      { version: "v1", error: "Failed to fetch service" },
      { status: 500, headers: { "X-API-Version": "v1" } }
    );
  }
}
