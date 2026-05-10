/**
 * GET /api/faq
 *
 * Public FAQ endpoint — returns active FAQs with locale-aware content.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi) and ?category= filter.
 */

import { handleError, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField } from "@/lib/i18n/localization";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);
    const category = searchParams.get("category") ?? undefined;

    const where: Record<string, unknown> = { isActive: true };
    if (category && category !== "all") {
      where.category = category;
    }

    const faqs = await prisma.faq.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        sortOrder: true,
        questionEn: true,
        questionJa: true,
        questionKo: true,
        questionZh: true,
        answerEn: true,
        answerJa: true,
        answerKo: true,
        answerZh: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const localized = faqs.map((f: typeof faqs[number]) => ({
      id: f.id,
      question: getLocalizedField(f, "question", locale),
      answer: getLocalizedField(f, "answer", locale),
      category: f.category,
      sortOrder: f.sortOrder,
      _localeUsed: locale,
    }));

    // Return distinct categories for filter tabs
    const allFaqs = await prisma.faq.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    const categories = allFaqs.map((f: typeof allFaqs[number]) => f.category);

    return ok({ data: localized, categories });
  } catch (error) {
    return handleError(error);
  }
}
