/**
 * Admin Case Studies — Single item
 *
 * GET    /api/admin/case-studies/[id] — get one
 * PUT    /api/admin/case-studies/[id] — update
 * DELETE /api/admin/case-studies/[id] — delete
 *
 * Requires: requirePermission("projects", "read/update/delete")
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { handleError, notFound, badRequest } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("projects", "read");
    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: { id, isCaseStudy: true },
      include: { service: { select: { id: true, slug: true, title: true } } },
    });

    if (!project) return notFound("case study not found");
    return NextResponse.json({ data: project });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("projects", "update");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.project.findFirst({
      where: { id, isCaseStudy: true },
    });
    if (!existing) return notFound("case study not found");

    // Prevent flipping isCaseStudy off via this route
    const data = { ...body, isCaseStudy: true };

    const updated = await prisma.project.update({
      where: { id },
      data,
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "case-studies",
      resourceId: id,
      oldValues: existing,
      newValues: data,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("projects", "delete");
    const { id } = await params;

    const existing = await prisma.project.findFirst({
      where: { id, isCaseStudy: true },
    });
    if (!existing) return notFound("case study not found");

    await prisma.project.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "case-studies",
      resourceId: id,
      oldValues: existing,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleError(error);
  }
}
