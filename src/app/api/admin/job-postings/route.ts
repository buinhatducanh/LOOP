/**
 * GET/POST /api/admin/job-postings — Admin CRUD for job postings
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermissionFast } from "@/lib/auth/permissions";
import { ok, list, buildPagination, handleError, badRequest } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    requirePermissionFast(session, "blog-posts", "read");
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
    const department = searchParams.get("department");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (department) where.department = department;
    if (status) where.status = status;

    const [postings, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { applications: true } },
        },
      }),
      prisma.jobPosting.count({ where }),
    ]);

    return list(postings, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    requirePermissionFast(session, "blog-posts", "create");
    const body = await req.json();
    const {
      title, titleEn, department, role, employmentType, location,
      salaryMin, salaryMax, salaryCurrency, description, descEn,
      requirements, reqEn, benefits, benEn, status, sortOrder, expiresAt,
    } = body;

    if (!title || !department || !role) {
      return badRequest("title, department, role are required");
    }

    const posting = await prisma.jobPosting.create({
      data: {
        title,
        titleEn: titleEn ?? null,
        department,
        role,
        employmentType: employmentType ?? "full_time",
        location: location ?? "Ho Chi Minh City, Vietnam",
        salaryMin: salaryMin ?? null,
        salaryMax: salaryMax ?? null,
        salaryCurrency: salaryCurrency ?? "VND",
        description: description ?? "",
        descEn: descEn ?? null,
        requirements: requirements ?? "",
        reqEn: reqEn ?? null,
        benefits: benefits ?? "",
        benEn: benEn ?? null,
        status: status ?? "open",
        sortOrder: sortOrder ?? 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return ok(posting, 201);
  } catch (err) {
    return handleError(err);
  }
}
