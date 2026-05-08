/**
 * Bulk-assign members to a department via MemberDepartment junction
 * Route: PUT /api/admin/departments/[id]/members
 *
 * Payload: { memberIds: string[], headId?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { handleError, ok, notFound, badRequest } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { memberIds, headId } = body;

    if (memberIds != null && !Array.isArray(memberIds)) {
      return badRequest("memberIds must be an array");
    }

    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) return notFound("Department not found");

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Remove all existing junction records for this department
      await tx.memberDepartment.deleteMany({
        where: { departmentId: id },
      }).catch(() => { /* ignore */ });

      // Create new junction records
      if (memberIds && memberIds.length > 0) {
        await tx.memberDepartment.createMany({
          data: memberIds.map((memberId: string) => ({
            memberId,
            departmentId: id,
            isDeptHead: memberId === headId,
            isPrimary: memberId === headId,
          })),
        });
      }
    });

    // Return updated department with members
    const updated = await prisma.department.findUnique({
      where: { id },
      include: {
        memberDepartments: {
          where: { departmentId: id },
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

    // Compute headId from junction
    const head = updated?.memberDepartments.find((md) => md.isDeptHead);

    return ok({
      id: department.id,
      key: department.key ?? "",
      name: department.name ?? "",
      shortName: department.shortName ?? "",
      color: department.color ?? "#3B82F6",
      memberCount: members.length,
      headId: head?.memberId ?? null,
      members,
    });
  } catch (err) {
    return handleError(err);
  }
}
