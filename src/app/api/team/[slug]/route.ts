import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const member = await prisma.teamMember.findUnique({
      where: { slug },
    });

    if (!member) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get related members (same category, excluding current)
    const relatedMembers = await prisma.teamMember.findMany({
      where: {
        isActive: true,
        id: { not: member.id },
        roleCategory: member.roleCategory,
      },
      take: 4,
      orderBy: [{ roleLevel: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json({
      data: member,
      related: relatedMembers,
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
