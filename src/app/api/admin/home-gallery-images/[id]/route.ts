/**
 * HomeGalleryImage CRUD — Single Item
 *
 * GET    /api/admin/home-gallery-images/[id]   → get single image
 * PUT    /api/admin/home-gallery-images/[id]   → update image
 * DELETE /api/admin/home-gallery-images/[id]   → delete image
 */

import { requirePermission } from "@/lib/auth/permissions";
import { handleError, ok, notFound, badRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { NextRequest } from "next/server";

const HomeGalleryImageUpdateSchema = z.object({
  image: z.string().min(1).optional(),
  imagePublicId: z.string().optional(),
  alt: z.string().optional(),
  altEn: z.string().optional(),
  altJa: z.string().optional(),
  altKo: z.string().optional(),
  altZh: z.string().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

// ─── Get ──────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("blog-posts", "read");

    const { id } = await params;
    const image = await prisma.homeGalleryImage.findUnique({ where: { id } });
    if (!image) return notFound("Image not found");

    return ok(image);
  } catch (err) {
    return handleError(err);
  }
}

// ─── Update ────────────────────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("blog-posts", "update");

    const { id } = await params;
    const body = await req.json();
    const parsed = HomeGalleryImageUpdateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.message);

    const existing = await prisma.homeGalleryImage.findUnique({ where: { id } });
    if (!existing) return notFound("Image not found");

    const image = await prisma.homeGalleryImage.update({
      where: { id },
      data: {
        ...(parsed.data.image !== undefined && { image: parsed.data.image }),
        ...(parsed.data.imagePublicId !== undefined && { imagePublicId: parsed.data.imagePublicId }),
        ...(parsed.data.alt !== undefined && { alt: parsed.data.alt }),
        ...(parsed.data.altEn !== undefined && { altEn: parsed.data.altEn }),
        ...(parsed.data.altJa !== undefined && { altJa: parsed.data.altJa }),
        ...(parsed.data.altKo !== undefined && { altKo: parsed.data.altKo }),
        ...(parsed.data.altZh !== undefined && { altZh: parsed.data.altZh }),
        ...(parsed.data.sortOrder !== undefined && { sortOrder: parsed.data.sortOrder }),
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      },
    });

    return ok(image);
  } catch (err) {
    return handleError(err);
  }
}

// ─── Delete ────────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("blog-posts", "delete");

    const { id } = await params;
    const existing = await prisma.homeGalleryImage.findUnique({ where: { id } });
    if (!existing) return notFound("Image not found");

    await prisma.homeGalleryImage.delete({ where: { id } });

    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
