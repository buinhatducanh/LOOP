import { ok, notFound, serverError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

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

    if (!page) return notFound("Landing page not found");
    return ok(page);
  } catch (error) {
    console.error("GET /api/public/landing/[slug] error:", error);
    return serverError();
  }
}
