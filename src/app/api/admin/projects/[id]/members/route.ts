import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("projects", "read");
    const { id: projectId } = await params;

    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        member: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json({
      data: projectMembers.map(pm => ({
        id: pm.id,
        memberId: pm.memberId,
        projectRole: pm.projectRole,
        name: pm.member.name,
        email: pm.member.email,
        role: pm.member.role,
        assignedLp: pm.assignedLp,
        earnedLp: pm.earnedLp,
        exp: pm.exp,
        joinedAt: pm.joinedAt,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
