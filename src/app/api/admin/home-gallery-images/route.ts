/**
 * HomeGalleryImage CRUD — Admin API
 *
 * GET    /api/admin/home-gallery-images      → list all gallery images
 * POST   /api/admin/home-gallery-images      → create gallery image
 */

import { requirePermission } from "@/lib/auth/permissions";
import { handleError, ok, list, badRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { NextRequest } from "next/server";

export type { HomeGalleryImageCreateSchema };

// ─── Schema ───────────────────────────────────────────────────────────────────

const HomeGalleryImageCreateSchema = z.object({
  image: z.string().url("image must be a valid URL").or(z.string().min(1)),
  imagePublicId: z.string().optional(),
  alt: z.string().optional(),
  altEn: z.string().optional(),
  altJa: z.string().optional(),
  altKo: z.string().optional(),
  altZh: z.string().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
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
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (isActive === "true") where.isActive = true;

    const [images, total] = await Promise.all([
      prisma.homeGalleryImage.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.homeGalleryImage.count({ where }),
    ]);

    return list(images, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}

// ─── Create ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await requirePermission("blog-posts", "create");

    const body = await req.json();
    const parsed = HomeGalleryImageCreateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.message);

    const image = await prisma.homeGalleryImage.create({
      data: {
        image: parsed.data.image,
        imagePublicId: parsed.data.imagePublicId,
        alt: parsed.data.alt,
        altEn: parsed.data.altEn,
        altJa: parsed.data.altJa,
        altKo: parsed.data.altKo,
        altZh: parsed.data.altZh,
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return ok(image, 201);
  } catch (err) {
    return handleError(err);
  }
}
