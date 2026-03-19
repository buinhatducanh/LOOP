import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("locale") || "vi";

    const page = await prisma.landingPage.findFirst({
      where: {
        slug,
        isPublished: true,
        locale,
      },
      include: {
        sections: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: "Landing page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: page });
  } catch (error) {
    console.error("GET /api/public/landing/[slug] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
