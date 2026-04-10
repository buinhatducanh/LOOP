/**
 * GET/PUT/DELETE /api/admin/job-postings/[id] — Admin single job posting
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermissionFast } from "@/lib/auth/permissions";
import { ok, handleError, notFound } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermissionFast(session, "blog-posts", "read");
    const { id } = await params;
    const posting = await prisma.jobPosting.findUnique({
      where: { id },
      include: { _count: { select: { applications: true } } },
    });
    if (!posting) return notFound("Job posting not found");
    return ok(posting);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermissionFast(session, "blog-posts", "update");
    const { id } = await params;
    const body = await req.json();
    const existing = await prisma.jobPosting.findUnique({ where: { id } });
    if (!existing) return notFound("Job posting not found");

    const posting = await prisma.jobPosting.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        titleEn: body.titleEn ?? existing.titleEn,
        department: body.department ?? existing.department,
        role: body.role ?? existing.role,
        employmentType: body.employmentType ?? existing.employmentType,
        location: body.location ?? existing.location,
        salaryMin: body.salaryMin ?? existing.salaryMin,
        salaryMax: body.salaryMax ?? existing.salaryMax,
        description: body.description ?? existing.description,
        descEn: body.descEn ?? existing.descEn,
        requirements: body.requirements ?? existing.requirements,
        reqEn: body.reqEn ?? existing.reqEn,
        benefits: body.benefits ?? existing.benefits,
        benEn: body.benEn ?? existing.benEn,
        status: body.status ?? existing.status,
        sortOrder: body.sortOrder ?? existing.sortOrder,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : existing.expiresAt,
      },
    });
    return ok(posting);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermissionFast(session, "blog-posts", "delete");
    const { id } = await params;
    await prisma.jobPosting.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
