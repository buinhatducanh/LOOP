import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { handleError, ok, notFound, badRequest } from "@/lib/api";
import { AuthError, isSuperAdmin } from "@/lib/auth/permissions";
import { isCeo } from "@/lib/auth/roles";

// PUT /api/admin/departments/[id]/head
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (headId) {
      const member = await prisma.teamMember.findUnique({ where: { id: headId } });
      if (!member) return notFound("Member not found");
      if (member.departmentId && member.departmentId !== id) {
        return badRequest("Member belongs to a different department");
      }
    }

    await prisma.$transaction(async (tx) => {
      if (department.headId) {
        await tx.teamMember.update({
          where: { id: department.headId },
          data: { isDeptHead: false },
        }).catch(() => { /* previous head may not exist */ });
      }
      if (headId) {
        await tx.teamMember.update({
          where: { id: headId },
          data: { isDeptHead: true, departmentId: id },
        });
      }
      await tx.department.update({
        where: { id },
        data: { headId: headId ?? null },
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
