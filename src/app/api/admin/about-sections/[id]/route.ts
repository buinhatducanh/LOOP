/**
 * GET    /api/admin/about-sections/[id] — get single section
 * PUT    /api/admin/about-sections/[id] — update section
 * DELETE /api/admin/about-sections/[id] — delete section
 */

import { handleError, ok, notFound, badRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

const ALLOWED_TYPES = [
  "hero", "stats", "story", "timeline", "values", "team_preview", "cta",
];

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("blog-posts", "read");
    const { id } = await params;
    const section = await prisma.aboutSection.findUnique({ where: { id } });
    if (!section) return notFound("AboutSection not found");
    return ok(section);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("blog-posts", "update");
    const { id } = await params;
    const body = await req.json();

    if (body.sectionType && !ALLOWED_TYPES.includes(body.sectionType)) {
      return badRequest(`sectionType must be one of: ${ALLOWED_TYPES.join(", ")}`);
    }

    const section = await prisma.aboutSection.findUnique({ where: { id } });
    if (!section) return notFound("AboutSection not found");

    const data: Record<string, unknown> = {};
    const fields = [
      "badge", "title", "titleHighlight", "subtitle", "description",
      "ctaText", "ctaLink", "cta2Text", "cta2Link",
      "stats", "story", "timeline", "values", "teamPreview",
      "ctaSectionTitle", "ctaSectionSub", "isActive", "sortOrder", "sectionType", "locale",
    ];
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = body[f];
    }

    const updated = await prisma.aboutSection.update({ where: { id }, data });
    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("blog-posts", "delete");
    const { id } = await params;
    const section = await prisma.aboutSection.findUnique({ where: { id } });
    if (!section) return notFound("AboutSection not found");
    await prisma.aboutSection.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
