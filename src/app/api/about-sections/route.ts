/**
 * GET /api/about-sections — public endpoint
 * Returns active About sections grouped by type for the public /about page
 */

import { ok, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("lang") ?? searchParams.get("locale") ?? "vi";

    // Try to load from DB
    const sections = await prisma.aboutSection.findMany({
      where: { locale, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (sections.length > 0) {
      return ok(sections);
    }

    // Fallback: return null (AboutClient uses i18n defaults when no data)
    return ok(null);
  } catch (err) {
    return handleError(err);
  }
}
