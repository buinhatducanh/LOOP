import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { handleError, ok, notFound, badRequest } from "@/lib/api";
import { addAvatar } from "@/lib/api/mappings";

// GET /api/admin/departments/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            image: true,
            rank: true,
            level: true,
            role: true,
            department: true,
            departmentId: true,
            isDeptHead: true,
            tabPermissions: true,
            availableLp: true,
            lockedLp: true,
            currentXp: true,
            maxXp: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!department) return notFound("Department not found");

    return ok({
      id: department.id,
      key: department.key ?? "",
      name: department.name ?? "",
      shortName: department.shortName ?? "",
      color: department.color ?? "#3B82F6",
      description: department.description ?? "",
      mission: department.mission ?? "",
      headId: department.headId,
      memberCount: department.members.length,
      members: department.members.map(addAvatar),
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
    });
  } catch (err) {
    return handleError(err);
  }
}

// PUT /api/admin/departments/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) return notFound("Department not found");

    const { name, shortName, color, description, mission } = body;

    const updated = await prisma.department.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name ?? null }),
        ...(shortName !== undefined && { shortName: shortName ?? null }),
        ...(color !== undefined && { color: color ?? null }),
        ...(description !== undefined && { description: description ?? null }),
        ...(mission !== undefined && { mission: mission ?? null }),
      },
    });

    return ok({
      ...updated,
      name: updated.name ?? "",
      shortName: updated.shortName ?? "",
      color: updated.color ?? "#3B82F6",
      description: updated.description ?? "",
      mission: updated.mission ?? "",
    });
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/admin/departments/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });

    if (!department) return notFound("Department not found");
    if (department._count.members > 0) {
      return badRequest("Cannot delete department with members — reassign members first");
    }

    await prisma.department.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
