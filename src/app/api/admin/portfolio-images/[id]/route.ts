/**
 * GET /api/admin/portfolio-images/[id] — get a single portfolio image
 * PUT /api/admin/portfolio-images/[id] — update a portfolio image
 * DELETE /api/admin/portfolio-images/[id] — delete a portfolio image
 */

import { handleError, ok, notFound, badRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("blog-posts", "read");
    const { id } = await params;

    const image = await prisma.portfolioImage.findUnique({ where: { id } });
    if (!image) return notFound("Portfolio image not found");

    return ok(image);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("blog-posts", "update");
    const { id } = await params;
    const body = await req.json();

    if (!body.image || typeof body.image !== "string" || !body.image.trim()) {
      return badRequest("image is required");
    }
    if (!body.description || typeof body.description !== "string" || !body.description.trim()) {
      return badRequest("description is required");
    }

    const updatedImage = await prisma.portfolioImage.update({
      where: { id },
      data: {
        image: body.image.trim(),
        description: body.description.trim(),
        width: typeof body.width === "number" ? Math.max(50, body.width) : 300,
        row: body.row === 2 ? 2 : 1,
        sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });

    return ok(updatedImage);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("blog-posts", "delete");
    const { id } = await params;

    await prisma.portfolioImage.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
