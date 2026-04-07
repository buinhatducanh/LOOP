/**
 * GET /api/blog-posts
 *
 * Public blog posts from database (not Sanity CMS).
 * Supports ?lang=vi|en|ja|ko|zh (default: vi)
 */

import { handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField } from "@/lib/i18n/localization";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: { status: "published" },
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          slug: true,
          projectId: true,
          title: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          status: true,
          seoTitle: true,
          seoDesc: true,
          seoTitleEn: true,
          seoTitleJa: true,
          seoTitleKo: true,
          seoTitleZh: true,
          seoDescEn: true,
          seoDescJa: true,
          seoDescKo: true,
          seoDescZh: true,
          authorId: true,
          // Translations
          titleEn: true,
          titleJa: true,
          titleKo: true,
          titleZh: true,
          excerptEn: true,
          excerptJa: true,
          excerptKo: true,
          excerptZh: true,
        },
      }),
      prisma.blogPost.count({ where: { status: "published" } }),
    ]);

    const localized = posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: getLocalizedField(p, "title", locale),
      excerpt: getLocalizedField(p, "excerpt", locale),
      coverImage: p.coverImage,
      publishedAt: p.publishedAt,
      seoTitle: getLocalizedField(p, "seoTitle", locale),
      seoDesc: getLocalizedField(p, "seoDesc", locale),
      authorId: p.authorId,
      _localeUsed: locale,
    }));

    return ok({
      version: "v1",
      data: localized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      meta: { locale },
    });
  } catch (error) {
    return handleError(error);
  }
}
