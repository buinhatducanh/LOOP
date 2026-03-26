import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField } from "@/lib/i18n/localization";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);

    const member = await prisma.teamMember.findUnique({
      where: { slug, isActive: true },
      include: {
        memberExpertise: {
          include: { expertise: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { version: "v1", error: "Team member not found" },
        { status: 404, headers: { "X-API-Version": "v1" } }
      );
    }

    // Get related members (same role level, excluding current)
    const relatedMembers = await prisma.teamMember.findMany({
      where: {
        isActive: true,
        id: { not: member.id },
        roleLevel: member.roleLevel,
      },
      take: 4,
      orderBy: [{ sortOrder: "asc" }],
    });

    const r = member as unknown as Record<string, unknown>;

    return NextResponse.json({
      version: "v1",
      data: {
        id: member.id,
        slug: member.slug,
        name: getLocalizedField(r, "name", locale),
        role: getLocalizedField(r, "role", locale),
        bio: getLocalizedField(r, "bio", locale),
        shortBio: getLocalizedField(r, "shortBio", locale),
        image: member.image,
        isFeatured: member.isFeatured,
        level: member.level,
        rank: member.rank,
        linkedin: member.linkedin,
        twitter: member.twitter,
        github: member.github,
        expertise: member.memberExpertise?.map((e) => ({
          name: getLocalizedField(e.expertise as unknown as Record<string, unknown>, "name", locale),
          category: getLocalizedField(e.expertise as unknown as Record<string, unknown>, "category", locale),
          icon: e.expertise.icon,
        })) ?? [],
        related: relatedMembers.map((m) => ({
          id: m.id,
          slug: m.slug,
          name: getLocalizedField(m as unknown as Record<string, unknown>, "name", locale),
          role: getLocalizedField(m as unknown as Record<string, unknown>, "role", locale),
          image: m.image,
        })),
        _localeUsed: locale,
      },
      headers: { "X-API-Version": "v1" },
    });
  } catch (error) {
    console.error("[/api/team/[slug]] Failed:", error);
    return NextResponse.json(
      { version: "v1", error: "Failed to fetch team member" },
      { status: 500, headers: { "X-API-Version": "v1" } }
    );
  }
}
