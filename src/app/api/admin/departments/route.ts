import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { handleError, ok, list, badRequest } from "@/lib/api";
import { buildPagination } from "@/lib/api/response";
import { addAvatar } from "@/lib/api/mappings";

// GET /api/admin/departments — list all departments with members
export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
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
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { key: "asc" },
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
      headId: dept.headId,
      memberCount: dept.members.length,
      members: dept.members.map(addAvatar),
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
    await requireAuth();
    const body = await req.json();

    const { key, name, shortName, color, description, mission } = body;

    if (!key) return badRequest("key is required");

    if (name == null && shortName == null) {
      return badRequest("name or shortName is required");
    }

    if (name == null) {
      return badRequest("name is required");
    }
    if (shortName == null) {
      return badRequest("shortName is required");
    }

    const existing = await prisma.department.findUnique({ where: { key } });
    if (existing) return badRequest(`Department with key "${key}" already exists`);

    const department = await prisma.department.create({
      data: {
        key,
        name: name ?? "",
        shortName: shortName ?? "",
        color: color ?? "#3B82F6",
        description: description ?? null,
        mission: mission ?? null,
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
