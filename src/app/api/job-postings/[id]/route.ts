/**
 * GET /api/job-postings/[id] — Public single job posting
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError, notFound } from "@/lib/api";
import { getLocalizedField } from "@/lib/i18n/localization";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const lang = (searchParams.get("lang") ?? "vi") as "vi" | "en";

    const posting = await prisma.jobPosting.findUnique({
      where: { id },
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
        description: true,
        descEn: true,
        requirements: true,
        reqEn: true,
        benefits: true,
        benEn: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    if (!posting) return notFound("Job posting not found");

    const localized = {
      ...posting,
      title: getLocalizedField(posting as unknown as Record<string, string>, "title", lang),
      description: getLocalizedField(posting as unknown as Record<string, string>, "description", lang),
      requirements: getLocalizedField(posting as unknown as Record<string, string>, "requirements", lang),
      benefits: getLocalizedField(posting as unknown as Record<string, string>, "benefits", lang),
      salaryLabel:
        posting.salaryMin && posting.salaryMax
          ? `${(posting.salaryMin / 1_000_000).toFixed(0)}–${(posting.salaryMax / 1_000_000).toFixed(0)}M`
          : posting.salaryMin
          ? `Từ ${(posting.salaryMin / 1_000_000).toFixed(0)}M`
          : null,
    };

    return ok(localized);
  } catch (err) {
    return handleError(err);
  }
}
