/**
 * Division (Ban) CRUD API
 * Route: /api/admin/divisions
 */
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { handleError, ok, list, badRequest } from "@/lib/api";
import { buildPagination } from "@/lib/api/response";

// GET /api/admin/divisions — list all divisions with departments + member count
export async function GET(req: Request) {
  try {
    await requirePermission("team", "read");

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));

    const [divisions, total] = await Promise.all([
      (await import("@/lib/prisma")).prisma.division.findMany({
        include: {
          departments: {
            include: {
              memberDepartments: {
                select: { id: true, isDeptHead: true, isPrimary: true },
              },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (await import("@/lib/prisma")).prisma.division.count(),
    ]);

    const enriched = divisions.map((div: typeof divisions[number]) => ({
      ...div,
      departmentCount: div.departments.length,
      memberCount: div.departments.reduce(
        (sum: number, d: typeof div.departments[number]) => sum + d.memberDepartments.length,
        0
      ),
      departments: div.departments.map((d: typeof div.departments[number]) => ({
        id: d.id,
        key: d.key,
        name: d.name,
        shortName: d.shortName,
        color: d.color,
        memberCount: d.memberDepartments.length,
        headId: d.memberDepartments.find((md: typeof d.memberDepartments[number]) => md.isDeptHead)?.id ?? null,
      })),
    }));

    return list(enriched, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/admin/divisions — create division
export async function POST(req: Request) {
  try {
    await requirePermission("team", "create");
    const body = await req.json();

    const { key, name, shortName, color, description } = body;

    if (!key || typeof key !== "string") {
      return badRequest("key is required");
    }
    if (!name || typeof name !== "string") {
      return badRequest("name is required");
    }
    if (!shortName || typeof shortName !== "string") {
      return badRequest("shortName is required");
    }

    const prisma = (await import("@/lib/prisma")).prisma;
    const existing = await prisma.division.findUnique({ where: { key } });
    if (existing) {
      return badRequest(`Division with key "${key}" already exists`);
    }

    const division = await prisma.division.create({
      data: {
        key,
        name,
        shortName,
        color: color ?? "#3B82F6",
        description: description ?? null,
      },
    });

    return ok({ ...division, departmentCount: 0, memberCount: 0, departments: [] }, 201);
  } catch (err) {
    return handleError(err);
  }
}
