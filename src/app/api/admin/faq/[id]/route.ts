/**
 * GET /api/admin/faq/[id] — get single FAQ
 * PUT /api/admin/faq/[id] — update FAQ
 * DELETE /api/admin/faq/[id] — delete FAQ
 */

import { handleError, ok, notFound, badRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("blog-posts", "read");
    const { id } = await params;

    const faq = await prisma.faq.findUnique({ where: { id } });
    if (!faq) return notFound("FAQ not found");

    return ok(faq);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("blog-posts", "update");
    const { id } = await params;
    const body = await req.json();

    if (!body.question || typeof body.question !== "string" || !body.question.trim()) {
      return badRequest("question is required");
    }
    if (!body.answer || typeof body.answer !== "string" || !body.answer.trim()) {
      return badRequest("answer is required");
    }

    const faq = await prisma.faq.update({
      where: { id },
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

    return ok(faq);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("blog-posts", "delete");
    const { id } = await params;

    await prisma.faq.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
