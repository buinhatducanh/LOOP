/**
 * GET  /api/admin/access-tags   — List all access tags
 * POST /api/admin/access-tags   — Create a new access tag (admin/HR only)
 */
import { NextRequest, NextResponse } from "next/server";
import { ok } from "@/lib/api/response";
import { requireAuth, requirePermissionFast } from "@/lib/auth/permissions"
import { handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    const tags = await prisma.accessTag.findMany({
      orderBy: [{ isDefault: "desc" }, { slug: "asc" }],
    });

    return ok(tags);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    requirePermissionFast(session, "access-tags", "create");

    const body = await req.json();
    const { slug, label, description, color, isDefault } = body;

    if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
      return NextResponse.json({ error: "slug là bắt buộc" }, { status: 400 });
    }
    if (!label || typeof label !== "string" || label.trim().length === 0) {
      return NextResponse.json({ error: "label là bắt buộc" }, { status: 400 });
    }

    const slugNormalized = slug.trim().toLowerCase().replace(/\s+/g, "-");

    const existing = await prisma.accessTag.findUnique({ where: { slug: slugNormalized } });
    if (existing) {
      return NextResponse.json({ error: "Tag đã tồn tại" }, { status: 409 });
    }

    const tag = await prisma.accessTag.create({
      data: {
        slug: slugNormalized,
        label: label.trim(),
        description: description?.trim() ?? null,
        color: color?.trim() ?? "#3B82F6",
        isDefault: Boolean(isDefault),
      },
    });

    return ok(tag, 201);
  } catch (err) {
    return handleError(err);
  }
}
