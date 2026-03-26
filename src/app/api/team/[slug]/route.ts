import { ok, notFound, serverError } from "@/lib/api/response";
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

    if (!member) return notFound("Team member not found");

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

    return ok({ ...member, related: relatedMembers });
  } catch (error) {
    console.error("Failed to fetch team member:", error);
    return serverError();
  }
}
