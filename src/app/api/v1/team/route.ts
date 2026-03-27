/**
 * GET /api/v1/team
 *
 * Returns all active team members for the public website.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi)
 *
 * Version: v1 (stable)
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField } from "@/lib/i18n/localization";
import { handleError } from "@/lib/api/response";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);

    const members = await prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: [{ roleLevel: "asc" }, { sortOrder: "asc" }],
      include: {
        memberExpertise: {
          include: { expertise: true },
        },
      },
    });

    const publicMembers = members.map((m) => ({
      id: m.id,
      slug: m.slug,
      name: getLocalizedField(m, "name", locale),
      role: getLocalizedField(m, "role", locale),
      shortBio: getLocalizedField(m, "shortBio", locale),
      bio: getLocalizedField(m, "bio", locale),
      image: m.image,
      isFeatured: m.isFeatured,
      expertise: m.memberExpertise?.map((e) => ({
        name: getLocalizedField(e.expertise, "name", locale),
        category: getLocalizedField(e.expertise, "category", locale),
        icon: e.expertise.icon,
      })) ?? [],
      _localeUsed: locale,
    }));

    return NextResponse.json(
      {
        version: "v1",
        data: publicMembers,
        meta: { count: publicMembers.length, locale },
      },
      { headers: { "X-API-Version": "v1" } }
    );
  } catch (error) {
    return handleError(error);
  }
}
