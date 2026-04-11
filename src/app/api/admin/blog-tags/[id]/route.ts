/**
 * Blog Tag — Single item + Update + Delete
 *
 * GET    /api/admin/blog-tags/[id]  → single tag
 * PUT    /api/admin/blog-tags/[id]  → update tag
 * DELETE /api/admin/blog-tags/[id]  → delete tag
 */

import { requirePermission } from "@/lib/auth/permissions";
import { handleError, ok, badRequest, notFound } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteContext { params: Promise<{ id: string }> }

// ─── Schema ───────────────────────────────────────────────────────────────────

const TagUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  nameEn: z.string().optional(),
  nameJa: z.string().optional(),
  nameKo: z.string().optional(),
  nameZh: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().optional(),
});

// ─── Get ───────────────────────────────────────────────────────────────────────

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    await requirePermission("blogs", "read");
    const { id } = await params;

    const tag = await prisma.blogTag.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } },
    });
    if (!tag) return notFound("Tag not found");

    return ok(tag);
  } catch (err) {
    return handleError(err);
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function PUT(req: Request, { params }: RouteContext) {
  try {
    await requirePermission("blogs", "update");
    const { id } = await params;

    const body = await req.json();
    const parsed = TagUpdateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.message);

    const tag = await prisma.blogTag.update({
      where: { id },
      data: parsed.data,
    });

    return ok(tag);
  } catch (err) {
    return handleError(err);
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    await requirePermission("blogs", "delete");
    const { id } = await params;

    await prisma.blogTag.delete({ where: { id } });
    return ok({ id }, 200);
  } catch (err) {
    return handleError(err);
  }
}
