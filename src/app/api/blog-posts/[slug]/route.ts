/**
 * GET /api/blog-posts/[slug]
 *
 * Public blog post detail from database.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField } from "@/lib/i18n/localization";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);

    // Find by slug (status filter applied post-query since slug alone isn't unique)
    const post = await prisma.blogPost.findFirst({
      where: { slug, status: "published" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            slug: true,
            role: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { version: "v1", error: "Blog post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      version: "v1",
      data: {
        id: post.id,
        slug: post.slug,
        title: getLocalizedField(post, "title", locale),
        content: getLocalizedField(post, "content", locale),
        excerpt: getLocalizedField(post, "excerpt", locale),
        coverImage: post.coverImage,
        publishedAt: post.publishedAt,
        seoTitle: getLocalizedField(post, "seoTitle", locale),
        seoDesc: getLocalizedField(post, "seoDesc", locale),
        author: post.author,
        _localeUsed: locale,
      },
      headers: { "X-API-Version": "v1" },
    });
  } catch (error) {
    console.error("[/api/blog-posts/[slug]] Failed:", error);
    return NextResponse.json(
      { version: "v1", error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}
