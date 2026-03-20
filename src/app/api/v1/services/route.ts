/**
 * GET /api/v1/services
 *
 * Returns all active services for the public website.
 * This is a cached endpoint — responses are served from CDN cache for 5 minutes.
 *
 * Version: v1 (stable)
 * Stability: Stable — breaking changes will be released as v2
 */

import { NextResponse } from "next/server";
import { getCachedServices } from "@/lib/db/queries";

// CDN cache — 5 minutes, stale-while-revalidate 1 hour
export const revalidate = 300;

export async function GET() {
  try {
    const services = await getCachedServices();

    return NextResponse.json(
      {
        version: "v1",
        data: services,
        meta: {
          count: services.length,
          cached: true,
          // Use Vary header so CDN respects locale-specific responses
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
          "X-API-Version": "v1",
        },
      }
    );
  } catch (error) {
    console.error("[/api/v1/services] Failed to fetch services:", error);
    return NextResponse.json(
      { version: "v1", error: "Failed to fetch services" },
      { status: 500, headers: { "X-API-Version": "v1" } }
    );
  }
}
