/**
 * GET /api/admin/portfolio-images — list all portfolio images
 * POST /api/admin/portfolio-images — create a new portfolio image
 */

import { handleError, ok, list, badRequest, buildPagination } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: Request) {
  try {
    const session = await requirePermission("blog-posts", "read");
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      prisma.portfolioImage.findMany({
        orderBy: [
          { row: "asc" },
          { sortOrder: "asc" },
          { createdAt: "desc" }
        ],
        skip,
        take: limit,
      }),
      prisma.portfolioImage.count(),
    ]);

    return list(images, buildPagination(page, limit, total));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("blog-posts", "create");
    const body = await req.json();

    if (!body.image || typeof body.image !== "string" || !body.image.trim()) {
      return badRequest("image is required");
    }
    if (!body.description || typeof body.description !== "string" || !body.description.trim()) {
      return badRequest("description is required");
    }

    const newImage = await prisma.portfolioImage.create({
      data: {
        image: body.image.trim(),
        description: body.description.trim(),
        width: typeof body.width === "number" ? Math.max(50, body.width) : 300,
        row: body.row === 2 ? 2 : 1,
        sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });

    return ok(newImage, 201);
  } catch (error) {
    return handleError(error);
  }
}
