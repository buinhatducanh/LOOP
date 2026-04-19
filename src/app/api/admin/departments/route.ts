import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { handleError, ok, list, badRequest } from "@/lib/api";
import { buildPagination } from "@/lib/api/response";
import { addAvatar } from "@/lib/api/mappings";

// GET /api/admin/departments — list all departments with members
export async function GET(req: Request) {
  try {
    await requirePermission("team", "read");
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        include: {
          division: { select: { id: true, key: true, name: true, shortName: true } },
          memberDepartments: {
            include: {
              member: {
                select: {
                  id: true, name: true, image: true, rank: true,
                  level: true, role: true, department: true,
                  departmentId: true, tabPermissions: true,
                },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { sortOrder: "asc" },
      }),
      prisma.department.count(),
    ]);

    const enriched = departments.map((dept) => ({
      id: dept.id,
      key: dept.key ?? "",
      name: dept.name ?? "",
      shortName: dept.shortName ?? "",
      color: dept.color ?? "#3B82F6",
      description: dept.description ?? "",
      mission: dept.mission ?? "",
      memberCount: dept.memberDepartments.length,
      // Division info
      divisionId: dept.division?.id ?? null,
      division: dept.division
        ? { id: dept.division.id, key: dept.division.key, name: dept.division.name, shortName: dept.division.shortName }
        : null,
      // Members from junction (new way)
      members: dept.memberDepartments.map((md) => addAvatar({
        ...md.member,
        position: md.position,
        isDeptHead: md.isDeptHead,
        isPrimary: md.isPrimary,
      })),
      // Head: member with isDeptHead=true in this department
      headId: dept.memberDepartments.find((md) => md.isDeptHead)?.member.id ?? null,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
    }));

    return list(enriched, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/admin/departments — create department
export async function POST(req: Request) {
  try {
    await requirePermission("team", "create");
    const body = await req.json();

    const { key, name, shortName, color, description, mission, divisionId } = body;

    if (!key) return badRequest("key is required");
    if (!name) return badRequest("name is required");
    if (!shortName) return badRequest("shortName is required");

    const existing = await prisma.department.findUnique({ where: { key } });
    if (existing) return badRequest(`Department with key "${key}" already exists`);

    if (divisionId) {
      const div = await prisma.division.findUnique({ where: { id: divisionId } });
      if (!div) return badRequest("Division not found");
    }

    const department = await prisma.department.create({
      data: {
        key,
        name,
        shortName,
        color: color ?? "#3B82F6",
        description: description ?? null,
        mission: mission ?? null,
        divisionId: divisionId ?? null,
      },
    });

    return ok({
      ...department,
      name: department.name ?? "",
      shortName: department.shortName ?? "",
      color: department.color ?? "#3B82F6",
      description: department.description ?? "",
      mission: department.mission ?? "",
    }, 201);
  } catch (err) {
    return handleError(err);
  }
}
