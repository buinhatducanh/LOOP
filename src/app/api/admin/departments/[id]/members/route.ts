import { NextResponse } from "next/server";
import { requireAuth, requirePermissionFast } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { handleError, ok, notFound, badRequest } from "@/lib/api";

// PUT /api/admin/departments/[id]/members
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermissionFast(session, "team", "update");
    const { id } = await params;
    const body = await req.json();
    const { memberIds } = body;

    if (memberIds != null && !Array.isArray(memberIds)) {
      return badRequest("memberIds must be an array");
    }

    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) return notFound("Department not found");

    await prisma.$transaction(async (tx) => {
      await tx.teamMember.updateMany({
        where: { departmentId: id },
        data: { departmentId: null, isDeptHead: false },
      }).catch(() => { /* ignore */ });

      if (memberIds && memberIds.length > 0) {
        await tx.teamMember.updateMany({
          where: { id: { in: memberIds } },
          data: { departmentId: id },
        });
      }

      await tx.department.update({
        where: { id },
        data: { memberCount: memberIds ? memberIds.length : 0 },
      });
    });

    const updated = await prisma.department.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true, name: true, image: true, rank: true,
            level: true, role: true, isDeptHead: true,
          },
        },
      },
    });

    return ok({
      ...updated,
      name: updated?.name ?? "",
      shortName: updated?.shortName ?? "",
      color: updated?.color ?? "#3B82F6",
    });
  } catch (err) {
    return handleError(err);
  }
}
