/**
 * GET /api/admin/faq — list all FAQs (admin view, includes inactive)
 * POST /api/admin/faq — create FAQ
 */

import { handleError, ok, list, badRequest, buildPagination } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: Request) {
  try {
    const session = await requirePermission("blog-posts", "read");
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (category && category !== "all") {
      where.category = category;
    }

    const [faqs, total] = await Promise.all([
      prisma.faq.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.faq.count({ where }),
    ]);

    return list(faqs, buildPagination(page, limit, total));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("blog-posts", "create");
    const body = await req.json();

    if (!body.question || typeof body.question !== "string" || !body.question.trim()) {
      return badRequest("question is required");
    }
    if (!body.answer || typeof body.answer !== "string" || !body.answer.trim()) {
      return badRequest("answer is required");
    }

    const faq = await prisma.faq.create({
      data: {
        question: body.question.trim(),
        answer: body.answer.trim(),
        category: body.category ?? "general",
        sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
        isActive: Boolean(body.isActive),
        questionEn: body.questionEn?.trim() || null,
        questionJa: body.questionJa?.trim() || null,
        questionKo: body.questionKo?.trim() || null,
        questionZh: body.questionZh?.trim() || null,
        answerEn: body.answerEn?.trim() || null,
        answerJa: body.answerJa?.trim() || null,
        answerKo: body.answerKo?.trim() || null,
        answerZh: body.answerZh?.trim() || null,
      },
    });

    return ok(faq, 201);
  } catch (error) {
    return handleError(error);
  }
}
