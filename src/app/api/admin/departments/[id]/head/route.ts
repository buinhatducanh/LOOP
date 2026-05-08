/**
 * Set department head via MemberDepartment junction
 * Route: PUT /api/admin/departments/[id]/head
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { handleError, ok, notFound, badRequest } from "@/lib/api";
import { AuthError, isSuperAdmin } from "@/lib/auth/permissions";
import { isCeo } from "@/lib/auth/roles";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    if (!isCeo(session.role) && !isSuperAdmin(session)) {
      throw new AuthError("Only CEO or super admin can set department head", 403);
    }

    const { id } = await params;
    const body = await req.json();
    const { headId } = body;

    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) return notFound("Department not found");

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Clear existing head in this department's junction records
      await tx.memberDepartment.updateMany({
        where: { departmentId: id, isDeptHead: true },
        data: { isDeptHead: false },
      }).catch(() => { /* ignore if none */ });

      if (headId) {
        const member = await tx.teamMember.findUnique({ where: { id: headId } });
        if (!member) throw new Error("Member not found");

        // Upsert the member-department record for this head
        await tx.memberDepartment.upsert({
          where: { memberId_departmentId: { memberId: headId, departmentId: id } },
          update: { isDeptHead: true, isPrimary: true },
          create: { memberId: headId, departmentId: id, isDeptHead: true, isPrimary: true },
        });
      }
    });

    // Return updated department with members
    const updated = await prisma.department.findUnique({
      where: { id },
      include: {
        memberDepartments: {
          include: {
            member: { select: { id: true, name: true, image: true, rank: true, level: true, role: true } },
          },
        },
      },
    });

    const members = updated?.memberDepartments.map((md) => ({
      ...md.member,
      position: md.position,
      isDeptHead: md.isDeptHead,
      isPrimary: md.isPrimary,
    })) ?? [];

    return ok({
      id: department.id,
      key: department.key ?? "",
      name: department.name ?? "",
      shortName: department.shortName ?? "",
      color: department.color ?? "#3B82F6",
      memberCount: members.length,
      members,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Member not found") {
      return notFound("Member not found");
    }
    return handleError(err);
  }
}
