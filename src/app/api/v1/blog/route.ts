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

export const revalidate = 300;

export async function GET() {
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
    console.error("[/api/v1/blog] Failed:", error);
    return NextResponse.json(
      { version: "v1", error: "Failed to fetch blog posts" },
      { status: 500, headers: { "X-API-Version": "v1" } }
    );
  }
}
