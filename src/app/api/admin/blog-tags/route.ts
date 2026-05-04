/**
 * Blog Tags CRUD — Admin API
 *
 * GET    /api/admin/blog-tags      → list all tags
 * POST   /api/admin/blog-tags      → create tag
 */

import { requirePermission } from "@/lib/auth/permissions";
import { handleError, ok, list, badRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { NextRequest } from "next/server";

export type { TagCreateSchema, TagUpdateSchema };

// ─── Schema ───────────────────────────────────────────────────────────────────

const TagCreateSchema = z.object({
  key: z.string().min(1, "key is required").regex(/^[a-z0-9-]+$/, "key must be lowercase alphanumeric with dashes"),
  name: z.string().min(1, "name is required"),
  nameEn: z.string().optional(),
  nameJa: z.string().optional(),
  nameKo: z.string().optional(),
  nameZh: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().optional(),
});

const TagUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  nameEn: z.string().optional(),
  nameJa: z.string().optional(),
  nameKo: z.string().optional(),
  nameZh: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().optional(),
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

function buildPagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

// ─── List ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await requirePermission("blog-posts", "read");

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));
    const search = searchParams.get("search") ?? "";

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { key: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [tags, total] = await Promise.all([
      prisma.blogTag.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { posts: true } } },
      }),
      prisma.blogTag.count({ where }),
    ]);

    return list(tags, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}

// ─── Create ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await requirePermission("blog-posts", "create");

    const body = await req.json();
    const parsed = TagCreateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.message);

    const existing = await prisma.blogTag.findUnique({ where: { key: parsed.data.key } });
    if (existing) return badRequest(`Tag key "${parsed.data.key}" already exists`);

    const tag = await prisma.blogTag.create({
      data: {
        key: parsed.data.key,
        name: parsed.data.name,
        nameEn: parsed.data.nameEn,
        nameJa: parsed.data.nameJa,
        nameKo: parsed.data.nameKo,
        nameZh: parsed.data.nameZh,
        color: parsed.data.color ?? "#3B82F6",
        sortOrder: parsed.data.sortOrder ?? 0,
      },
    });

    return ok(tag, 201);
  } catch (err) {
    return handleError(err);
  }
}
