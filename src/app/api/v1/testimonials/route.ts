/**
 * GET /api/v1/testimonials
 *
 * Returns all active testimonials for the public website.
 * Cached for 5 minutes.
 *
 * Version: v1 (stable)
 */

import { NextResponse } from "next/server";
import { getCachedTestimonials } from "@/lib/db/queries";

export const revalidate = 300;

export async function GET() {
  try {
    const testimonials = await getCachedTestimonials();

    return NextResponse.json(
      {
        version: "v1",
        data: testimonials,
        meta: { count: testimonials.length, cached: true },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
          "X-API-Version": "v1",
        },
      }
    );
  } catch (error) {
    console.error("[/api/v1/testimonials] Failed:", error);
    return NextResponse.json(
      { version: "v1", error: "Failed to fetch testimonials" },
      { status: 500, headers: { "X-API-Version": "v1" } }
    );
  }
}
