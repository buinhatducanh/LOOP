/**
 * Single Division (Ban) CRUD API
 * Route: /api/admin/divisions/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { handleError, ok, notFound, badRequest } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/divisions/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requirePermission("team", "read");
    const { id } = await params;
    const prisma = (await import("@/lib/prisma")).prisma;

    const division = await prisma.division.findUnique({
      where: { id },
      include: {
        departments: {
          include: {
            memberDepartments: {
              include: {
                member: { select: { id: true, name: true, image: true, slug: true } },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!division) return notFound("Division not found");

    const enriched = {
      ...division,
      departmentCount: division.departments.length,
      memberCount: division.departments.reduce(
        (sum, d) => sum + d.memberDepartments.length,
        0
      ),
      departments: division.departments.map((d) => ({
        id: d.id,
        key: d.key,
        name: d.name,
        shortName: d.shortName,
        color: d.color,
        description: d.description,
        mission: d.mission,
        memberCount: d.memberDepartments.length,
        members: d.memberDepartments.map((md) => ({
          id: md.member.id,
          name: md.member.name,
          avatar: md.member.image,
          slug: md.member.slug,
          position: md.position,
          isDeptHead: md.isDeptHead,
          isPrimary: md.isPrimary,
        })),
      })),
    };

    return ok(enriched);
  } catch (err) {
    return handleError(err);
  }
}

// PUT /api/admin/divisions/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requirePermission("team", "update");
    const { id } = await params;
    const body = await req.json();
    const prisma = (await import("@/lib/prisma")).prisma;

    const existing = await prisma.division.findUnique({ where: { id } });
    if (!existing) return notFound("Division not found");

    const { name, shortName, color, description, sortOrder } = body;

    const updated = await prisma.division.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(shortName !== undefined && { shortName }),
        ...(color !== undefined && { color }),
        ...(description !== undefined && { description }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/admin/divisions/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requirePermission("team", "delete");
    const { id } = await params;
    const prisma = (await import("@/lib/prisma")).prisma;

    const existing = await prisma.division.findUnique({
      where: { id },
      include: { _count: { select: { departments: true } } },
    });
    if (!existing) return notFound("Division not found");
    if (existing._count.departments > 0) {
      return badRequest(
        `Cannot delete division with ${existing._count.departments} departments. Reassign them first.`
      );
    }

    await prisma.division.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
