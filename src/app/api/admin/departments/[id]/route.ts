/**
 * Single Department CRUD API
 * Route: /api/admin/departments/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { handleError, ok, notFound, badRequest } from "@/lib/api";
import { addAvatar } from "@/lib/api/mappings";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/departments/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("team", "read");
    const { id } = await params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        division: { select: { id: true, key: true, name: true, shortName: true, color: true } },
        memberDepartments: {
          include: {
            member: {
              select: {
                id: true, name: true, image: true, rank: true, level: true,
                role: true, department: true, departmentId: true,
                tabPermissions: true, availableLp: true, lockedLp: true,
                currentXp: true, maxXp: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!department) return notFound("Department not found");

    const members = department.memberDepartments.map((md) =>
      addAvatar({
        ...md.member,
        position: md.position,
        isDeptHead: md.isDeptHead,
        isPrimary: md.isPrimary,
      })
    );

    return ok({
      id: department.id,
      key: department.key ?? "",
      name: department.name ?? "",
      shortName: department.shortName ?? "",
      color: department.color ?? "#3B82F6",
      description: department.description ?? "",
      mission: department.mission ?? "",
      divisionId: department.division?.id ?? null,
      division: department.division,
      memberCount: department.memberDepartments.length,
      members,
      headId: department.memberDepartments.find((md) => md.isDeptHead)?.member.id ?? null,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
    });
  } catch (err) {
    return handleError(err);
  }
}

// PUT /api/admin/departments/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requirePermission("team", "update");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) return notFound("Department not found");

    const { name, shortName, color, description, mission, divisionId, sortOrder } = body;

    // Validate divisionId if provided
    if (divisionId !== undefined) {
      if (divisionId === null) {
        // OK — unassign from division
      } else {
        const div = await prisma.division.findUnique({ where: { id: divisionId } });
        if (!div) return badRequest("Division not found");
      }
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(shortName !== undefined && { shortName }),
        ...(color !== undefined && { color }),
        ...(description !== undefined && { description }),
        ...(mission !== undefined && { mission }),
        ...(divisionId !== undefined && { divisionId }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/admin/departments/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("team", "delete");
    const { id } = await params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { memberDepartments: true } } },
    });

    if (!department) return notFound("Department not found");
    if (department._count.memberDepartments > 0) {
      return badRequest(
        `Cannot delete department with ${department._count.memberDepartments} members — reassign them first`
      );
    }

    await prisma.department.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
