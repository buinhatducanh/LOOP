/**
 * GET /api/admin/job-applications — Admin list job applications
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermissionFast } from "@/lib/auth/permissions";
import { list, buildPagination, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    requirePermissionFast(session, "blog-posts", "read");
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
    const jobPostingId = searchParams.get("jobPostingId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (jobPostingId) where.jobPostingId = jobPostingId;
    if (status) where.status = status;

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          jobPosting: { select: { id: true, title: true, department: true } },
        },
      }),
      prisma.jobApplication.count({ where }),
    ]);

    return list(applications, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}
