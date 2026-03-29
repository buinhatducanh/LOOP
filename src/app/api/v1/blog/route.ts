/**
 * GET /api/v1/blog
 *
 * Returns all blog posts from Sanity CMS.
 * Cached for 5 minutes — Sanity CDN handles the heavy lifting.
 *
 * Version: v1 (stable)
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { client } from "@/sanity/client";
import { postsQuery } from "@/sanity/queries";
import { handleError } from "@/lib/api/response";
import { logger } from "@/lib/logger";

export const revalidate = 300;

export async function GET() {
  const start = Date.now();
  try {
    const posts = await client.fetch<Array<{
      _id: string;
      title: string;
      titleVi?: string;
      slug: { current: string };
      mainImage?: unknown;
      publishedAt?: string;
      authorName?: string;
      categories?: string[];
    }>>(postsQuery);

    const formatted = posts.map((post: { _id: string; slug: { current: string }; title: string; titleVi?: string; publishedAt?: string; authorName?: string; categories?: string[] }) => ({
      id: post._id,
      slug: post.slug.current,
      title: post.title,
      titleVi: post.titleVi,
      publishedAt: post.publishedAt,
      author: post.authorName,
      categories: post.categories ?? [],
      // Image URL should be constructed by the client using @sanity/image-url
    }));

    logger.withSLO("GET /api/v1/blog success", {
      endpoint: "/api/v1/blog",
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - start,
    });
    return NextResponse.json(
      {
        version: "v1",
        data: formatted,
        meta: { count: formatted.length, cached: true },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
          "X-API-Version": "v1",
        },
      }
    );
  } catch (error) {
    logger.withSLO("GET /api/v1/blog failed", {
      endpoint: "/api/v1/blog",
      method: "GET",
      statusCode: 500,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
