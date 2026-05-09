/**
 * Public Blog Tags — v1 API
 *
 * GET /api/v1/blog-tags  → list all active tags with post count
 * No auth required.
 */

import { handleError, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const locale = searchParams.get("lang") ?? "vi";

    const tags = await prisma.blogTag.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { posts: true } } },
    });

    const localeNameField: Record<string, string> = {
      en: "nameEn", ja: "nameJa", ko: "nameKo", zh: "nameZh",
    };
    const nameField = localeNameField[locale] ?? "name";

    const result = tags.map((tag: typeof tags[number]) => ({
      id: tag.id,
      key: tag.key,
      name: (tag as Record<string, unknown>)[nameField] as string ?? tag.name,
      nameVi: tag.name,
      color: tag.color,
      postCount: tag._count.posts,
    }));

    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}

export const dynamic = "force-static";
export const revalidate = 3600;
