/**
 * Assign a member to multiple departments via MemberDepartment junction
 * Route: PUT /api/admin/team/[id]/departments
 *
 * Payload:
 *   departments: Array<{ departmentId: string; position?: string; isPrimary?: boolean; isDeptHead?: boolean }>
 *
 * Replaces all existing junction records for this member.
 */
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { handleError, ok, notFound, badRequest } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await requirePermission("team", "update");
    const { id } = await params;
    const body = await req.json();
    const { departments } = body;

    if (departments != null && !Array.isArray(departments)) {
      return badRequest("departments must be an array");
    }

    const member = await prisma.teamMember.findUnique({ where: { id } });
    if (!member) return notFound("Member not found");

    await prisma.$transaction(async (tx) => {
      // Remove all existing junction records for this member
      await tx.memberDepartment.deleteMany({
        where: { memberId: id },
      }).catch(() => { /* ignore */ });

      // Validate department IDs
      if (departments && departments.length > 0) {
        const deptIds = departments.map((d: { departmentId: string }) => d.departmentId);
        const validDepts = await tx.department.findMany({
          where: { id: { in: deptIds } },
          select: { id: true },
        });
        const validIdSet = new Set(validDepts.map((d) => d.id));

        for (const entry of departments) {
          if (!validIdSet.has(entry.departmentId)) continue;
          await tx.memberDepartment.create({
            data: {
              memberId: id,
              departmentId: entry.departmentId,
              position: entry.position ?? null,
              isDeptHead: entry.isDeptHead ?? false,
              isPrimary: entry.isPrimary ?? false,
            },
          });
        }

        // Set primary departmentId on TeamMember for backwards compatibility
        const primaryDept = departments.find((d: { isPrimary: boolean }) => d.isPrimary);
        if (primaryDept) {
          await tx.teamMember.update({
            where: { id },
            data: { departmentId: primaryDept.departmentId },
          });
        }
      }
    });

    // Return updated member with all departments
    const updated = await prisma.teamMember.findUnique({
      where: { id },
      include: {
        memberDepartments: {
          include: {
            department: { select: { id: true, key: true, name: true, shortName: true, color: true } },
          },
        },
      },
    });

    const enrichedDepts = (updated?.memberDepartments ?? [])
      .filter((md) => md.department != null)
      .map((md) => ({
        id: md.department!.id,
        key: md.department!.key,
        name: md.department!.name,
        shortName: md.department!.shortName,
        color: md.department!.color,
        position: md.position,
        isDeptHead: md.isDeptHead,
        isPrimary: md.isPrimary,
      }));

    return ok({
      id: updated?.id,
      name: updated?.name,
      departments: enrichedDepts,
    });
  } catch (err) {
    return handleError(err);
  }
}
