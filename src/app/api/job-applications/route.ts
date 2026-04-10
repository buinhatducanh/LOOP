/**
 * POST /api/job-applications — Public job application form
 * Body: { jobPostingId, name, email, phone?, linkedinUrl?, portfolioUrl?, coverLetter? }
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, handleError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobPostingId, name, email, phone, linkedinUrl, portfolioUrl, coverLetter } = body;

    if (!jobPostingId || !name || !email) {
      return badRequest("jobPostingId, name and email are required");
    }

    // Verify posting exists and is active
    const posting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      select: { id: true, title: true, isActive: true, status: true },
    });
    if (!posting || !posting.isActive || posting.status !== "open") {
      return badRequest("This job posting is no longer accepting applications");
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobPostingId,
        name,
        email,
        phone: phone ?? null,
        linkedinUrl: linkedinUrl ?? null,
        portfolioUrl: portfolioUrl ?? null,
        coverLetter: coverLetter ?? null,
        status: "applied",
      },
    });

    return ok(application, 201);
  } catch (err) {
    return handleError(err);
  }
}
