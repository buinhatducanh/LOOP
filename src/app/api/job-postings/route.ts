/**
 * GET /api/job-postings — Public list of active job postings
 * Query: ?lang=&department=&role=&page=1&limit=20
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { list, buildPagination, handleError } from "@/lib/api";
import { getLocalizedField } from "@/lib/i18n/localization";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
    const department = searchParams.get("department");
    const role = searchParams.get("role");
    const lang = (searchParams.get("lang") ?? "vi") as "vi" | "en";

    const where: Record<string, unknown> = {
      isActive: true,
      status: "open",
    };
    if (department) where.department = department;
    if (role) where.role = role;

    const [postings, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          titleEn: true,
          department: true,
          role: true,
          employmentType: true,
          location: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          status: true,
          expiresAt: true,
          createdAt: true,
        },
      }),
      prisma.jobPosting.count({ where }),
    ]);

    // Apply i18n — title
    const localized = postings.map((p) => {
      const title = getLocalizedField(p as unknown as Record<string, string>, "title", lang);
      const salaryLabel =
        p.salaryMin && p.salaryMax
          ? `${(p.salaryMin / 1_000_000).toFixed(0)}–${(p.salaryMax / 1_000_000).toFixed(0)}M`
          : p.salaryMin
          ? `Từ ${(p.salaryMin / 1_000_000).toFixed(0)}M`
          : null;
      return { ...p, title, salaryLabel };
    });

    // Distinct departments for filter
    const departments = await prisma.jobPosting.findMany({
      where: { isActive: true, status: "open" },
      select: { department: true },
      distinct: ["department"],
    });

    return list(localized, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}
