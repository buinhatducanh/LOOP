import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { handleError, ok, notFound } from "@/lib/api";

// GET /api/admin/permissions
export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return ok({
        memberId: session.teamMemberId ?? null,
        tabPermissions: session.tabPermissions ?? [],
        departmentPermissions: session.departmentPermissions ?? {},
        isDeptHead: session.isDeptHead ?? false,
        departmentId: session.departmentId ?? null,
      });
    }

    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        role: true,
        departmentId: true,
        memberDepartments: { select: { isDeptHead: true } },
        tabPermissions: true,
      },
    });

    if (!member) return notFound("Member not found");

    return ok({
      memberId: member.id,
      name: member.name ?? "",
      role: member.role ?? "",
      departmentId: member.departmentId ?? null,
      isDeptHead: (member.memberDepartments ?? []).some((md: { isDeptHead: boolean }) => md.isDeptHead) ?? false,
      tabPermissions: member.tabPermissions ?? [],
    });
  } catch (err) {
    return handleError(err);
  }
}
